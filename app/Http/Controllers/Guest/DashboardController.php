<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the guest dashboard with bookings and payment information
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get user's bookings with related data
        $bookings = Booking::where('user_id', $user->id)
            ->with([
                'package:id,name,address',
                'bookingPayments' => function($query) {
                    $query->select(
                        'id',
                        'booking_id',
                        'milestone_type',
                        'milestone_number',
                        'due_date',
                        'amount',
                        'payment_status',
                        'payment_method',
                        'paid_at',
                        'is_booking_fee',
                        'start_date',
                        'end_date'
                    )->orderBy('milestone_number', 'asc');
                }
            ])
            ->select(
                'id',
                'package_id',
                'from_date',
                'to_date',
                'number_of_days',
                'price_type',
                'price',
                'total_amount',
                'booking_price',
                'status',
                'payment_status',
                'payment_option',
                'auto_renewal',
                'renewal_period_days',
                'next_renewal_date',
                'created_at'
            )
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate payment statistics
        $totalBookings = $bookings->count();

        $totalPaid = 0;
        $totalPending = 0;
        $totalOverdue = 0;

        foreach ($bookings as $booking) {
            foreach ($booking->bookingPayments as $payment) {
                if ($payment->payment_status === 'paid') {
                    $totalPaid += $payment->amount;
                } elseif ($payment->payment_status === 'pending') {
                    if ($payment->due_date && now()->gt($payment->due_date)) {
                        $totalOverdue += $payment->amount;
                    } else {
                        $totalPending += $payment->amount;
                    }
                }
            }
        }

        // Recent payments (last 5)
        $recentPayments = Payment::where('booking_id', function($query) use ($user) {
                $query->select('id')
                    ->from('bookings')
                    ->where('user_id', $user->id);
            })
            ->with([
                'booking.package:id,name'
            ])
            ->select(
                'id',
                'booking_id',
                'booking_payment_id',
                'payment_method',
                'amount',
                'transaction_id',
                'status',
                'payment_type',
                'created_at'
            )
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Active bookings (pending or confirmed)
        $activeBookings = $bookings->filter(function($booking) {
            return in_array($booking->status, ['pending', 'confirmed']);
        });

        return Inertia::render('Guest/Dashboard', [
            'bookings' => $bookings,
            'statistics' => [
                'totalBookings' => $totalBookings,
                'activeBookings' => $activeBookings->count(),
                'totalPaid' => round($totalPaid, 2),
                'totalPending' => round($totalPending, 2),
                'totalOverdue' => round($totalOverdue, 2),
            ],
            'recentPayments' => $recentPayments,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ]
        ]);
    }
}
