<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentLink;
use App\Models\BookingPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PaymentService
{
    public function storePayment(Request $request, User $user)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'duration_type' => 'required|string',
            'payment_status' => 'required|string',
            'booking_id' => 'required|exists:bookings,id',
        ]);

        $booking = Booking::where('id', $validated['booking_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        return Payment::create([
            'booking_id' => $validated['booking_id'],
            'amount' => $validated['amount'],
            'payment_method' => 'manual',
            'payment_type' => $validated['duration_type'],
            'status' => $validated['payment_status'],
            'transaction_id' => 'manual-' . time(),
        ]);
    }

    public function updatePayment(Request $request, User $user, Payment $payment)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'duration_type' => 'required|string',
            'payment_status' => 'required|string',
        ]);

        if (!$payment->booking || $payment->booking->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $payment->update([
            'amount' => $validated['amount'],
            'payment_type' => $validated['duration_type'],
            'status' => $validated['payment_status'],
        ]);

        return $payment;
    }

    public function destroyPayment(User $user, Payment $payment)
    {
        if (!$payment->booking || $payment->booking->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $payment->delete();
    }

    public function updatePaymentStatus(Request $request, User $user, Payment $payment)
    {
        $validated = $request->validate([
            'status' => 'required|in:Paid,Pending,cancelled'
        ]);

        try {
            DB::beginTransaction();

            $booking = $payment->booking;

            $payment->update([
                'status' => $validated['status'],
                'paid_at' => $validated['status'] === 'Paid' ? now() : null
            ]);

            $bookingPayment = null;

            if ($payment->booking_payment_id) {
                $bookingPayment = BookingPayment::find($payment->booking_payment_id);
            } else {
                $bookingPayment = BookingPayment::where('booking_id', $booking->id)
                    ->where('amount', $payment->amount)
                    ->orderBy('due_date', 'asc')
                    ->first();
            }

            if ($bookingPayment) {
                if ($validated['status'] === 'Paid') {
                    $bookingPayment->update([
                        'payment_status' => 'paid',
                        'payment_id' => $payment->id,
                        'paid_at' => now(),
                        'payment_method' => $payment->payment_method,
                        'transaction_reference' => $payment->transaction_id ?? $payment->reference_number
                    ]);

                    PaymentLink::where('booking_payment_id', $bookingPayment->id)
                        ->update(['status' => 'completed']);
                } else {
                    $bookingPayment->update([
                        'payment_status' => 'pending',
                        'payment_id' => null,
                        'paid_at' => null,
                        'payment_method' => null,
                        'transaction_reference' => null
                    ]);

                    PaymentLink::where('booking_payment_id', $bookingPayment->id)
                        ->where('status', '!=', 'completed')
                        ->update(['status' => 'expired']);
                }

                if ($bookingPayment->payment_id && $bookingPayment->payment_id !== $payment->id) {
                    Payment::where('id', $bookingPayment->payment_id)
                        ->update(['status' => 'cancelled']);
                }
            }

            $this->updateBookingStatus($booking);

            DB::commit();

            return [
                'success' => true,
                'status' => $validated['status']
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment status update failed', [
                'payment_id' => $payment->id,
                'status' => $validated['status'],
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    protected function updateBookingStatus($booking)
    {
        $totalAmount = (float) $booking->price + (float) $booking->booking_price;
        $totalPaid = $booking->payments()
            ->where('status', 'Paid')
            ->sum('amount');

        $allMilestonesCount = $booking->bookingPayments()->count();
        $paidMilestonesCount = $booking->bookingPayments()
            ->where('payment_status', 'paid')
            ->count();

        if ($totalPaid >= $totalAmount && $paidMilestonesCount === $allMilestonesCount) {
            $status = 'paid';
        } elseif ($totalPaid > 0) {
            $status = 'partially_paid';
        } else {
            $status = 'pending';
        }

        $booking->update([
            'payment_status' => $status,
            'last_payment_date' => $paidMilestonesCount > 0 ? now() : null
        ]);
    }

    public function generatePaymentLink(Request $request, User $user)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'milestone_amount' => 'required|numeric|min:0',
        ]);

        $booking = Booking::findOrFail($validated['booking_id']);

        $bookingPayment = BookingPayment::create([
            'booking_id' => $booking->id,
            'amount' => $validated['milestone_amount'],
            'payment_date' => now(),
            'due_date' => now()->addDays(7),
            'status' => 'pending',
        ]);

        $uniqueId = 'PL-' . strtoupper(Str::random(12));
        $paymentLink = PaymentLink::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'booking_payment_id' => $bookingPayment->id,
            'amount' => $validated['milestone_amount'],
            'unique_id' => $uniqueId,
            'status' => 'active',
            'expires_at' => now()->addDays(7),
        ]);

        return $paymentLink;
    }

    public function generateMilestonePaymentLink(Request $request, User $user, BookingPayment $milestone)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        $booking = $milestone->booking()->with('user')->first();
        if (!$booking || $booking->user_id !== $user->id) {
            throw new \Exception('Invalid milestone for this user.');
        }

        $existingLink = PaymentLink::where('booking_payment_id', $milestone->id)
            ->where('status', 'active')
            ->first();

        if ($existingLink) {
            $existingLink->update(['status' => 'revoked']);
        }

        $uniqueId = 'PL-' . strtoupper(Str::random(12));
        $paymentLink = PaymentLink::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'booking_payment_id' => $milestone->id,
            'amount' => $validated['amount'],
            'unique_id' => $uniqueId,
            'status' => 'active',
            'expires_at' => now()->addDays(7),
        ]);

        return $paymentLink;
    }
}
