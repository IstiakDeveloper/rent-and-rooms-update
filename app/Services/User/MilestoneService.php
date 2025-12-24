<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\PaymentLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class MilestoneService
{
    public function generateMilestonePaymentLinks(Request $request, User $user)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id'
        ]);

        $booking = Booking::with('payments', 'bookingPayments')->findOrFail($validated['booking_id']);

        if ($booking->bookingPayments()->count() === 0) {
            $this->createInitialMilestonePayments($booking);
            $booking->load('bookingPayments');
        }

        $milestones = $booking->bookingPayments()
            ->orderBy('due_date')
            ->get()
            ->map(function ($payment) {
                $existingPaymentLink = PaymentLink::where('booking_payment_id', $payment->id)
                    ->where('status', 'pending')
                    ->latest()
                    ->first();

                return [
                    'id' => $payment->id,
                    'description' => $payment->is_booking_fee
                        ? 'Booking Fee'
                        : $this->getMilestoneDescription($payment),
                    'amount' => $payment->amount,
                    'due_date' => Carbon::parse($payment->due_date)->format('d M Y'),
                    'status' => $payment->payment_status,
                    'is_booking_fee' => $payment->is_booking_fee,
                    'payment_link' => $existingPaymentLink ? route('admin.payment-links.show', $existingPaymentLink->unique_id) : null,
                    'last_updated' => $existingPaymentLink ? $existingPaymentLink->updated_at->format('d M Y H:i') : null
                ];
            });

        return $milestones;
    }

    public function createMilestonePaymentLink(Request $request, User $user, BookingPayment $bookingPayment)
    {
        if ($bookingPayment->payment_status === 'paid') {
            throw new \Exception('This milestone has already been paid.');
        }

        $existingLink = PaymentLink::where('booking_payment_id', $bookingPayment->id)
            ->where('status', 'active')
            ->first();

        if ($existingLink) {
            $existingLink->update([
                'amount' => $bookingPayment->amount,
                'updated_at' => now()
            ]);

            return $existingLink;
        }

        $paymentLink = PaymentLink::create([
            'unique_id' => Str::uuid(),
            'user_id' => $user->id,
            'booking_id' => $bookingPayment->booking_id,
            'booking_payment_id' => $bookingPayment->id,
            'amount' => $bookingPayment->amount,
            'status' => 'active'
        ]);

        return $paymentLink;
    }

    public function getBookingMilestones(User $user, Booking $booking)
    {
        if ($booking->bookingPayments()->count() === 0) {
            $this->createInitialMilestonePayments($booking);
            $booking->load('bookingPayments');
        }

        $milestones = $booking->bookingPayments()
            ->orderBy('due_date')
            ->get()
            ->map(function ($payment) {
                try {
                    $existingPaymentLink = PaymentLink::where('booking_payment_id', $payment->id)
                        ->where('status', 'pending')
                        ->latest()
                        ->first();

                    return [
                        'id' => $payment->id,
                        'description' => $payment->is_booking_fee
                            ? 'Booking Fee'
                            : $this->getMilestoneDescription($payment),
                        'amount' => (float) $payment->amount,
                        'due_date' => Carbon::parse($payment->due_date)->format('d M Y'),
                        'status' => $payment->payment_status ?? 'pending',
                        'is_booking_fee' => $payment->is_booking_fee ?? false,
                        'payment_link' => $existingPaymentLink ? route('admin.payment-links.show', $existingPaymentLink->unique_id) : null,
                        'last_updated' => $existingPaymentLink ? Carbon::parse($existingPaymentLink->updated_at)->format('d M Y H:i') : null
                    ];
                } catch (\Exception $e) {
                    Log::error('Error mapping milestone', [
                        'payment_id' => $payment->id,
                        'error' => $e->getMessage()
                    ]);
                    return [
                        'id' => $payment->id,
                        'description' => 'Payment #' . $payment->id,
                        'amount' => (float) $payment->amount,
                        'due_date' => Carbon::parse($payment->due_date)->format('d M Y'),
                        'status' => $payment->payment_status ?? 'pending',
                        'is_booking_fee' => false,
                        'payment_link' => null,
                        'last_updated' => null
                    ];
                }
            });

        return $milestones;
    }

    public function createInitialMilestonePayments($booking)
    {
        if (!$booking->from_date || !$booking->to_date) {
            throw new \Exception('Booking dates are missing');
        }

        if (!$booking->price || $booking->price <= 0) {
            throw new \Exception('Booking price is invalid');
        }

        $startDate = Carbon::parse($booking->from_date);
        $priceType = $booking->price_type ?? 'Month';

        $fromDate = Carbon::parse($booking->from_date);
        $toDate = Carbon::parse($booking->to_date);

        $numberOfPayments = match ($priceType) {
            'Month' => max(1, $fromDate->diffInMonths($toDate)),
            'Week' => max(1, ceil($fromDate->diffInDays($toDate) / 7)),
            'Day' => max(1, $fromDate->diffInDays($toDate)),
            default => 1
        };

        $numberOfPayments = max(1, $numberOfPayments);
        $baseAmount = $booking->price / $numberOfPayments;

        $booking->bookingPayments()->create([
            'milestone_type' => 'Booking',
            'milestone_number' => 0,
            'due_date' => $startDate,
            'amount' => $booking->booking_price ?? 0,
            'payment_status' => 'pending',
            'is_booking_fee' => true
        ]);

        for ($i = 0; $i < $numberOfPayments; $i++) {
            $dueDate = match ($priceType) {
                'Month' => $startDate->copy()->addMonths($i),
                'Week' => $startDate->copy()->addWeeks($i),
                'Day' => $startDate->copy()->addDays($i),
                default => $startDate->copy()->addMonths($i)
            };

            $booking->bookingPayments()->create([
                'milestone_type' => $priceType,
                'milestone_number' => $i + 1,
                'due_date' => $dueDate,
                'amount' => $baseAmount,
                'payment_status' => 'pending',
                'is_booking_fee' => false
            ]);
        }
    }

    private function getMilestoneDescription($payment)
    {
        $formattedDate = Carbon::parse($payment->due_date)->format('d M Y');

        return match ($payment->milestone_type) {
            'Month' => "Month {$formattedDate} Payment",
            'Week' => "Week {$formattedDate} Payment",
            'Day' => "Day {$formattedDate} Payment",
            'Booking Fee' => "Booking Fee {$formattedDate} Payment",
            default => "Payment {$formattedDate}",
        };
    }
}
