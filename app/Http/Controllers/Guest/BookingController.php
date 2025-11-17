<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    /**
     * Display a listing of user's bookings.
     */
    public function index(Request $request)
    {
        $query = Booking::where('user_id', auth()->id())
            ->with(['package', 'payments', 'bookingPayments']);

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by payment status if provided
        if ($request->has('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        // Search by package name or booking ID
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhereHas('package', function ($packageQuery) use ($search) {
                        $packageQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $bookings = $query->latest()->paginate(12)->withQueryString();

        // Calculate statistics
        $statistics = [
            'total' => Booking::where('user_id', auth()->id())->count(),
            'active' => Booking::where('user_id', auth()->id())
                ->whereIn('status', ['confirmed', 'active'])
                ->count(),
            'pending' => Booking::where('user_id', auth()->id())
                ->where('status', 'pending')
                ->count(),
            'completed' => Booking::where('user_id', auth()->id())
                ->where('status', 'finished')
                ->count(),
        ];

        return Inertia::render('Guest/Bookings/Index', [
            'bookings' => $bookings,
            'statistics' => $statistics,
            'filters' => [
                'status' => $request->status ?? 'all',
                'payment_status' => $request->payment_status ?? 'all',
                'search' => $request->search ?? '',
            ],
        ]);
    }

    /**
     * Display the specified booking.
     */
    public function show($id)
    {
        $booking = Booking::with([
            'package.instructions',
            'payments',
            'bookingPayments',
            'amenities',
            'maintains'
        ])->where('user_id', auth()->id())
            ->findOrFail($id);

        // Calculate payment statistics
        $totalPrice = (float) $booking->price + (float) $booking->booking_price;
        $totalPaid = $booking->payments->where('status', 'completed')->sum('amount');
        $dueBill = $totalPrice - $totalPaid;
        $paymentPercentage = $totalPrice > 0 ? ($totalPaid / $totalPrice * 100) : 0;

        // Get current milestone (next unpaid milestone)
        $currentMilestone = $booking->bookingPayments
            ->where('payment_status', '!=', 'paid')
            ->sortBy('due_date')
            ->first();

        // Check for overdue payments
        $hasOverdue = $booking->bookingPayments
            ->where('payment_status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->isNotEmpty();

        // Get rooms data
        $rooms = $booking->rooms;

        // Can manage auto-renewal check
        $canManageAutoRenewal = $this->canManageAutoRenewal($booking);

        // Bank details for display
        $bankDetails = 'Netsoftuk Solution A/C 17855008 S/C 04-06-05';

        return Inertia::render('Guest/Bookings/Show', [
            'booking' => $booking,
            'rooms' => $rooms,
            'paymentStats' => [
                'totalPrice' => $totalPrice,
                'totalPaid' => $totalPaid,
                'dueBill' => $dueBill,
                'paymentPercentage' => $paymentPercentage,
            ],
            'currentMilestone' => $currentMilestone,
            'hasOverdue' => $hasOverdue,
            'canManageAutoRenewal' => $canManageAutoRenewal,
            'bankDetails' => $bankDetails,
        ]);
    }

    /**
     * Process payment for a booking milestone.
     */
    public function processPayment(Request $request, $id)
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:card,bank_transfer',
            'milestone_id' => 'required|exists:booking_payments,id',
            'bank_transfer_reference' => 'required_if:payment_method,bank_transfer',
        ]);

        $booking = Booking::where('user_id', auth()->id())->findOrFail($id);
        $milestone = $booking->bookingPayments()->findOrFail($validated['milestone_id']);

        if ($validated['payment_method'] === 'bank_transfer') {
            return $this->handleBankTransfer($booking, $milestone, $validated['bank_transfer_reference']);
        } else {
            return $this->handleStripePayment($booking, $milestone);
        }
    }

    /**
     * Handle bank transfer payment.
     */
    protected function handleBankTransfer($booking, $milestone, $reference)
    {
        try {
            \DB::beginTransaction();

            $paymentType = $milestone->milestone_type === 'Booking Fee' ? 'booking' : 'rent';

            // Create payment record
            Payment::create([
                'booking_id' => $booking->id,
                'payment_method' => 'bank_transfer',
                'payment_type' => $paymentType,
                'amount' => $milestone->amount,
                'transaction_id' => $reference,
                'booking_payment_id' => $milestone->id,
                'status' => 'pending',
            ]);

            // Update milestone status
            $milestone->update([
                'payment_status' => 'pending'
            ]);

            // Update booking payment status
            $booking->update([
                'payment_status' => 'pending'
            ]);

            \DB::commit();

            return redirect()->back()->with('success', 'Bank transfer initiated. Please contact admin with transfer details.');
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'Failed to process bank transfer: ' . $e->getMessage());
        }
    }

    /**
     * Handle Stripe payment.
     */
    protected function handleStripePayment($booking, $milestone)
    {
        try {
            $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

            \DB::beginTransaction();

            $paymentType = $milestone->milestone_type === 'Booking Fee' ? 'booking' : 'rent';
            $description = $paymentType === 'booking'
                ? "Booking Fee Payment"
                : "Rent Payment for " . $milestone->milestone_number;

            $session = $stripe->checkout->sessions->create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'gbp',
                        'product_data' => [
                            'name' => $description,
                        ],
                        'unit_amount' => $milestone->amount * 100, // Convert to pence
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => route('guest.payment.success') . '?session_id={CHECKOUT_SESSION_ID}&booking_id=' . $booking->id,
                'cancel_url' => route('guest.payment.cancel') . '?booking_id=' . $booking->id,
                'metadata' => [
                    'booking_id' => $booking->id,
                    'milestone_id' => $milestone->id,
                    'payment_type' => $paymentType,
                    'amount' => $milestone->amount
                ],
            ]);

            // Create initial payment record
            Payment::create([
                'booking_id' => $booking->id,
                'payment_method' => 'card',
                'payment_type' => $paymentType,
                'amount' => $milestone->amount,
                'status' => 'pending',
                'booking_payment_id' => $milestone->id,
                'stripe_session_id' => $session->id
            ]);

            // Update milestone status
            $milestone->update([
                'payment_status' => 'pending'
            ]);

            \DB::commit();

            return redirect($session->url);
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'Stripe payment failed: ' . $e->getMessage());
        }
    }

    /**
     * Toggle auto-renewal for a booking.
     */
    public function toggleAutoRenewal(Request $request, $id)
    {
        $validated = $request->validate([
            'auto_renewal' => 'required|boolean',
        ]);

        $booking = Booking::where('user_id', auth()->id())->findOrFail($id);

        if (!$this->canManageAutoRenewal($booking)) {
            return redirect()->back()->with('error', 'Cannot manage auto-renewal for this booking.');
        }

        // Only allow auto-renewal for monthly packages
        if ($validated['auto_renewal'] && $booking->price_type !== 'Month') {
            return redirect()->back()->with('error', 'Auto-renewal is only available for monthly packages.');
        }

        // Calculate next renewal date (7 days before package end)
        $nextRenewalDate = $validated['auto_renewal']
            ? \Carbon\Carbon::parse($booking->to_date)->subDays(7)
            : null;

        // Update booking
        $booking->update([
            'auto_renewal' => $validated['auto_renewal'],
            'renewal_period_days' => 30, // Fixed to 30 days for monthly packages
            'next_renewal_date' => $nextRenewalDate,
            'renewal_status' => $validated['auto_renewal'] ? 'pending' : null
        ]);

        $message = $validated['auto_renewal']
            ? 'Auto-renewal enabled successfully. Your booking will be automatically renewed 7 days before expiry.'
            : 'Auto-renewal disabled successfully.';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Cancel a booking.
     */
    public function cancel($id)
    {
        $booking = Booking::where('user_id', auth()->id())->findOrFail($id);

        // Update booking status
        $booking->update([
            'from_date' => null,
            'to_date' => null,
            'status' => 'cancelled',
        ]);

        // Delete pending payments
        Payment::where('booking_id', $booking->id)
            ->where('status', 'pending')
            ->delete();

        return redirect()->route('guest.bookings.index')->with('success', 'Booking cancelled successfully!');
    }

    /**
     * Check if auto-renewal can be managed for a booking.
     */
    protected function canManageAutoRenewal($booking)
    {
        // Allow managing if already enabled
        if ($booking->auto_renewal) {
            return true;
        }

        // For new auto-renewals, check conditions
        $toDate = \Carbon\Carbon::parse($booking->to_date);

        return $booking->price_type === 'Month' && // Only for monthly packages
            !in_array($booking->status, ['cancelled', 'finished', 'rejected']) &&
            $booking->from_date &&
            $booking->to_date &&
            $toDate->isFuture();
    }
}
