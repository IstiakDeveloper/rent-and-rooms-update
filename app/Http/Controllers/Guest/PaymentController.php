<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Display user's payment history
     */
    public function index()
    {
        $user = Auth::user();

        // Get all payments for user's bookings
        $payments = Payment::whereHas('booking', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['booking.package'])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($payment) {
            return [
                'id' => $payment->id,
                'booking_id' => $payment->booking_id,
                'amount' => (float) $payment->amount,
                'status' => $payment->status,
                'payment_method' => $payment->payment_method ?? 'N/A',
                'transaction_id' => $payment->transaction_id ?? 'N/A',
                'payment_date' => $payment->payment_date ? $payment->payment_date->format('d M, Y') : 'N/A',
                'created_at' => $payment->created_at->format('d M, Y H:i'),
                'package_name' => $payment->booking->package->name ?? 'N/A',
                'package_address' => $payment->booking->package->address ?? 'N/A',
            ];
        });

        // Calculate summary
        $totalPaid = $payments->where('status', 'Paid')->sum('amount');
        $totalPending = $payments->where('status', 'Pending')->sum('amount');
        $totalPayments = $payments->count();

        return Inertia::render('Guest/Payments/Index', [
            'payments' => $payments,
            'summary' => [
                'total_paid' => $totalPaid,
                'total_pending' => $totalPending,
                'total_payments' => $totalPayments,
            ],
        ]);
    }
}
