<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentLink;
use App\Models\BookingPayment;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {
        $payments = Payment::with([
            'booking.user',
            'booking.package',
            'bookingPayment'
        ])->latest()->paginate(15);

        return Inertia::render('Admin/Payment/Index', [
            'payments' => $payments,
        ]);
    }

    public function show(Payment $payment)
    {
        $payment->load([
            'booking.user',
            'booking.package',
            'bookingPayment'
        ]);

        return Inertia::render('Admin/Payment/Show', [
            'payment' => $payment,
        ]);
    }

    public function updateStatus(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,completed,failed,refunded',
            'admin_notes' => 'nullable|string',
        ]);

        $payment->update([
            'status' => $validated['status'],
            'admin_notes' => $validated['admin_notes'],
            'updated_by' => Auth::id(),
        ]);

        // Update related booking payment if exists
        if ($payment->booking_payment_id) {
            $payment->bookingPayment->update([
                'status' => $validated['status'],
            ]);
        }

        return redirect()->back()->with('success', 'Payment status updated successfully.');
    }

    // Payment Links Management
    public function paymentLinks()
    {
        $paymentLinks = PaymentLink::with([
            'user',
            'booking.package',
            'bookingPayment'
        ])->latest()->paginate(15);

        return Inertia::render('Admin/Payment/PaymentLinks', [
            'paymentLinks' => $paymentLinks,
        ]);
    }

    public function showPaymentLink($uniqueId)
    {
        $paymentLink = PaymentLink::with([
            'user',
            'booking.package',
            'bookingPayment'
        ])->where('unique_id', $uniqueId)->firstOrFail();

        return Inertia::render('Admin/Payment/PaymentLinkShow', [
            'paymentLink' => $paymentLink,
        ]);
    }

    public function processPayment(Request $request, $uniqueId)
    {
        $paymentLink = PaymentLink::with(['bookingPayment', 'booking'])->where('unique_id', $uniqueId)->firstOrFail();

        // Check if payment link is still active
        if (!in_array($paymentLink->status, ['pending', 'active'])) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'This payment link is no longer active.');
        }

        $validated = $request->validate([
            'payment_method' => 'required|string|in:BankTransfer,Stripe',
            'bank_reference' => 'required_if:payment_method,BankTransfer|nullable|string',
        ]);

        // Map frontend payment method to database enum value
        $paymentMethodMap = [
            'BankTransfer' => 'bank_transfer',
            'Stripe' => 'card',
        ];
        $dbPaymentMethod = $paymentMethodMap[$validated['payment_method']] ?? 'bank_transfer';

        // Determine payment type
        $bookingPayment = $paymentLink->bookingPayment;
        $paymentType = 'rent'; // default
        if ($bookingPayment && $bookingPayment->milestone_type) {
            $paymentType = $bookingPayment->milestone_type === 'Booking Fee' || $bookingPayment->milestone_type === 'Booking' ? 'booking' : 'rent';
        }

        try {
            \DB::beginTransaction();

            // Create payment record
            $paymentData = [
                'booking_id' => $paymentLink->booking_id,
                'booking_payment_id' => $paymentLink->booking_payment_id,
                'amount' => $paymentLink->amount,
                'payment_method' => $dbPaymentMethod,
                'status' => 'completed',
                'payment_type' => $paymentType,
                'transaction_id' => $validated['bank_reference'] ?? ('PL-' . uniqid()),
            ];

            $payment = Payment::create($paymentData);

            // Update booking payment status if exists
            if ($bookingPayment) {
                $bookingPayment->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                    'payment_method' => $dbPaymentMethod,
                    'transaction_reference' => $validated['bank_reference'] ?? null,
                ]);
            }

            // Update payment link status
            $paymentLink->update([
                'status' => 'completed',
                'transaction_id' => $validated['bank_reference'] ?? $payment->id,
            ]);

            \DB::commit();

            return redirect()->route('admin.payment-links.show', $uniqueId)
                ->with('success', 'Payment processed successfully.');

        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Payment processing failed', [
                'unique_id' => $uniqueId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Payment processing failed: ' . $e->getMessage());
        }
    }

    public function generatePaymentLink(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:0',
            'milestone_type' => 'required|string',
            'due_date' => 'required|date|after:today',
        ]);

        $booking = Booking::findOrFail($validated['booking_id']);

        // Create booking payment
        $bookingPayment = BookingPayment::create([
            'booking_id' => $booking->id,
            'amount' => $validated['amount'],
            'milestone_type' => $validated['milestone_type'],
            'due_date' => $validated['due_date'],
            'status' => 'pending',
        ]);

        // Create payment link
        $paymentLink = PaymentLink::create([
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'booking_payment_id' => $bookingPayment->id,
            'amount' => $validated['amount'],
            'unique_id' => 'payment-' . uniqid(),
            'status' => 'active',
            'expires_at' => now()->addDays(30),
        ]);

        return redirect()->back()->with('success', 'Payment link generated successfully.');
    }

    public function revokePaymentLink(PaymentLink $paymentLink)
    {
        $paymentLink->update([
            'status' => 'revoked',
        ]);

        return redirect()->back()->with('success', 'Payment link revoked successfully.');
    }
}
