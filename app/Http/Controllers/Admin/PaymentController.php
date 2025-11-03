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
            'user',
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
            'user',
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
        $paymentLink = PaymentLink::where('unique_id', $uniqueId)->firstOrFail();

        $validated = $request->validate([
            'payment_method' => 'required|string|in:BankTransfer,Stripe',
            'bank_reference' => 'required_if:payment_method,BankTransfer|string',
        ]);

        // Determine payment type
        $bookingPayment = $paymentLink->bookingPayment;
        $paymentType = $bookingPayment->milestone_type === 'Booking Fee' ? 'booking' : 'rent';

        try {
            // Create payment record
            $paymentData = [
                'booking_id' => $paymentLink->booking_id,
                'booking_payment_id' => $paymentLink->booking_payment_id,
                'user_id' => $paymentLink->user_id,
                'amount' => $paymentLink->amount,
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'payment_type' => $paymentType,
                'reference_number' => $validated['bank_reference'] ?? null,
            ];

            $payment = Payment::create($paymentData);

            // Update booking payment status
            $bookingPayment->update([
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            // Update payment link status
            $paymentLink->update([
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            return redirect()->route('admin.payment-links.show', $uniqueId)
                ->with('success', 'Payment processed successfully.');

        } catch (\Exception $e) {
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
