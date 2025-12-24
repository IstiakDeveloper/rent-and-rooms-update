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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class PaymentController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isPartner = $userRoles->contains('Partner');
            $isAdmin = $userRoles->contains('Admin');
        $isSuperAdmin = $userRoles->contains('Super Admin');

        $payments = Payment::with([
            'user',
            'booking.package',
            'bookingPayment'
        ])
        ->when($isPartner, function($query) use ($user) {
            // Partner sees only payments for packages where they are assigned AND admin is assigned
            return $query->whereHas('booking.package', function($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->whereNotNull('admin_id');
            });
        })
        ->when($isAdmin && !$isSuperAdmin, function($query) use ($user) {
            // Admin sees only payments for packages where they are assigned as admin
            return $query->whereHas('booking.package', function($q) use ($user) {
                $q->where('admin_id', $user->id);
            });
        })
        ->latest()->paginate(15);

        return Inertia::render('Admin/Payment/Index', [
            'payments' => $payments,
            'userRole' => [
                'isPartner' => $isPartner,
                'isAdmin' => $isAdmin,
                'isSuperAdmin' => $isSuperAdmin,
            ],
        ]);
    }

    public function show(Payment $payment)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isPartner = $userRoles->contains('Partner');
        $isAdmin = $userRoles->contains('Admin');
        $isSuperAdmin = $userRoles->contains('Super Admin');

        $payment->load([
            'user',
            'booking.package',
            'bookingPayment'
        ]);

        return Inertia::render('Admin/Payment/Show', [
            'payment' => $payment,
            'userRole' => [
                'isPartner' => $isPartner,
                'isAdmin' => $isAdmin,
                'isSuperAdmin' => $isSuperAdmin,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified payment.
     */
    public function edit(Payment $payment)
    {
        $payment->load(['user', 'booking.package', 'bookingPayment']);

        // Provide a small list of users to select from when assigning
        $users = User::select('id', 'name', 'email')->limit(100)->get();

        return Inertia::render('Admin/Payment/Edit', [
            'payment' => $payment,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified payment (e.g., assign a user).
     */
    public function update(Request $request, Payment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
        ]);

        $payment->update([
            'user_id' => $validated['user_id'] ?? null,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->route('admin.payments.show', $payment->id)->with('success', 'Payment updated successfully.');
    }

    /**
     * Remove the specified payment from storage.
     */
    public function destroy(Payment $payment): RedirectResponse
    {
        $payment->delete();
        return redirect()->route('admin.payments.index')->with('success', 'Payment deleted successfully.');
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
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isPartner = $userRoles->contains('Partner');

        $paymentLinks = PaymentLink::with([
            'user',
            'booking.package',
            'bookingPayment'
        ])
        ->when($isPartner, function($query) use ($user) {
            // Partner sees only payment links for packages assigned to them
            return $query->whereHas('booking.package', function($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });
        })
        ->latest()->paginate(15);

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

    // Public Payment Link Methods
    public function showPublicPaymentLink($uniqueId)
    {
        $paymentLink = PaymentLink::with([
            'user',
            'booking.package',
            'bookingPayment'
        ])->where('unique_id', $uniqueId)->firstOrFail();

        // Check if link is still valid
        if ($paymentLink->status !== 'active') {
            return Inertia::render('Guest/Payment/LinkExpired', [
                'message' => 'This payment link is no longer active.'
            ]);
        }

        if ($paymentLink->expires_at && $paymentLink->expires_at < now()) {
            $paymentLink->update(['status' => 'expired']);
            return Inertia::render('Guest/Payment/LinkExpired', [
                'message' => 'This payment link has expired.'
            ]);
        }

        return Inertia::render('Guest/Payment/PaymentLink', [
            'paymentLink' => [
                'unique_id' => $paymentLink->unique_id,
                'amount' => $paymentLink->amount,
                'status' => $paymentLink->status,
                'expires_at' => $paymentLink->expires_at,
                'user' => $paymentLink->user ? [
                    'id' => $paymentLink->user->id,
                    'name' => $paymentLink->user->name,
                    'email' => $paymentLink->user->email,
                ] : null,
                'booking' => $paymentLink->booking ? [
                    'id' => $paymentLink->booking->id,
                    'from_date' => $paymentLink->booking->from_date,
                    'to_date' => $paymentLink->booking->to_date,
                    'package' => $paymentLink->booking->package ? [
                        'id' => $paymentLink->booking->package->id,
                        'name' => $paymentLink->booking->package->name,
                        'address' => $paymentLink->booking->package->address,
                    ] : null,
                ] : null,
                'bookingPayment' => $paymentLink->bookingPayment ? [
                    'id' => $paymentLink->bookingPayment->id,
                    'milestone_type' => $paymentLink->bookingPayment->milestone_type,
                    'due_date' => $paymentLink->bookingPayment->due_date,
                    'status' => $paymentLink->bookingPayment->status,
                ] : null,
            ],
        ]);
    }

    public function processPublicPayment(Request $request, $uniqueId)
    {
        $paymentLink = PaymentLink::with([
            'booking',
            'bookingPayment',
            'user'
        ])->where('unique_id', $uniqueId)->firstOrFail();

        // Validate link is still active
        if ($paymentLink->status !== 'active') {
            return redirect()->back()->with('error', 'This payment link is no longer active.');
        }

        if ($paymentLink->expires_at && $paymentLink->expires_at < now()) {
            $paymentLink->update(['status' => 'expired']);
            return redirect()->back()->with('error', 'This payment link has expired.');
        }

        // Log incoming request
        Log::info('Processing public payment', [
            'unique_id' => $uniqueId,
            'request_data' => $request->all()
        ]);

        $validated = $request->validate([
            'payment_method' => 'required|string|in:BankTransfer,Stripe',
            'bank_reference' => 'required_if:payment_method,BankTransfer|nullable|string',
            'bank_name' => 'nullable|string',
            'account_holder' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Determine payment type
            $bookingPayment = $paymentLink->bookingPayment;
            $paymentType = $bookingPayment && $bookingPayment->milestone_type === 'Booking Fee' ? 'booking' : 'rent';

            // Map frontend payment method to database enum values
            $paymentMethodMap = [
                'BankTransfer' => 'bank_transfer',
                'Stripe' => 'card',
            ];

            $paymentMethod = $paymentMethodMap[$validated['payment_method']] ?? 'bank_transfer';

            // Create payment record
            $paymentData = [
                'booking_id' => $paymentLink->booking_id,
                'booking_payment_id' => $paymentLink->booking_payment_id,
                'user_id' => $paymentLink->user_id,
                'amount' => $paymentLink->amount,
                'payment_method' => $paymentMethod,
                'status' => 'pending', // Set as pending for admin review
                'payment_type' => $paymentType,
                'reference_number' => $validated['bank_reference'] ?? null,
            ];

            $payment = Payment::create($paymentData);

            // Update booking payment status to pending
            if ($bookingPayment) {
                $bookingPayment->update([
                    'status' => 'pending',
                ]);
            }

            // Update payment link status
            $paymentLink->update([
                'status' => 'pending',
                'transaction_id' => $payment->id,
            ]);

            DB::commit();

            Log::info('Payment processed successfully', [
                'payment_id' => $payment->id,
                'payment_link_id' => $paymentLink->id
            ]);

            return Inertia::render('Guest/Payment/PaymentSuccess', [
                'payment' => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'reference_number' => $payment->reference_number,
                ],
                'message' => 'Payment submitted successfully. Pending admin approval.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Payment processing failed', [
                'unique_id' => $uniqueId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Payment processing failed: ' . $e->getMessage()]);
        }
    }
}
