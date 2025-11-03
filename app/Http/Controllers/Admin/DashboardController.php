<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $filterPeriod = $request->get('filter_period', 'month');

        // Initialize dashboard data
        $dashboardData = [
            'totalUsers' => 0,
            'totalPartner' => 0,
            'totalPackages' => 0,
            'totalBookings' => 0,
            'monthlyRevenue' => 0,
            'totalBookingRevenue' => 0,
            'activePackages' => 0,
            'upcomingBookings' => 0,
            'totalSpent' => 0,
            'recentBookings' => [],
            'monthlyRentTotal' => 0,
            'monthlyBookingTotal' => 0,
            'totalRentIncome' => 0,
            'totalBookingIncome' => 0,
            'filterPeriod' => $filterPeriod,
            'totalCompletedRentPayments' => 0,
            'totalCompletedBookingPayments' => 0,
            'paymentSuccessRate' => 0,
            'partnerUsers' => 0,
            'partnerPackages' => 0,
            'partnerBookings' => 0,
            'partnerRevenue' => 0,
            'partnerRentIncome' => 0,
            'partnerBookingIncome' => 0,
            'partnerRentPayments' => 0,
            'partnerBookingPayments' => 0,
        ];

        // Get date range based on filter period
        $dateRange = $this->getDateRange($filterPeriod);

        // Load revenue data
        $revenueData = $this->loadRevenueData($filterPeriod, $dateRange);
        $dashboardData = array_merge($dashboardData, $revenueData);

        // Common user stats
        $dashboardData['totalUsers'] = User::count(); // Remove role filter for now
        $dashboardData['totalPartner'] = User::count(); // Will need to implement role logic later

        // User-specific data
        $dashboardData['activePackages'] = $user->bookings()->count(); // Remove scope for now
        $dashboardData['upcomingBookings'] = $user->bookings()->count(); // Remove scope for now
        $dashboardData['totalSpent'] = $user->bookings()
            ->where('payment_status', 'completed')
            ->sum('total_amount');

        $dashboardData['totalPackages'] = Package::where('user_id', $user->id)->count();
        $dashboardData['totalBookings'] = Booking::whereHas('package', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->count();

        // Super Admin specific logic (will need to implement role check later)
        if (true) { // Replace with proper role check
            $dashboardData['totalPackages'] = Package::count();
            $dashboardData['totalBookings'] = Booking::count();
        }

        // Partner specific logic (will need to implement role check later)
        $dashboardData['partnerPackages'] = Package::where('assigned_to', $user->id)->count();
        $dashboardData['partnerBookings'] = Booking::whereHas('package', function($query) use ($user) {
            $query->where('assigned_to', $user->id);
        })->count();

        $dashboardData['partnerUsers'] = User::whereHas('bookings.package', function($query) use ($user) {
            $query->where('assigned_to', $user->id);
        })->distinct()->count();

        // Partner Revenue
        $partnerPayments = Payment::whereHas('booking.package', function($query) use ($user) {
            $query->where('assigned_to', $user->id);
        })->whereIn('status', ['completed', 'paid']);

        if ($filterPeriod !== 'all') {
            $partnerPayments->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
        }

        $dashboardData['partnerRevenue'] = $partnerPayments->sum('amount');
        $dashboardData['partnerRentIncome'] = $partnerPayments->where('payment_type', 'rent')->sum('amount');
        $dashboardData['partnerBookingIncome'] = $partnerPayments->where('payment_type', 'booking')->sum('amount');
        $dashboardData['partnerRentPayments'] = $partnerPayments->where('payment_type', 'rent')->count();
        $dashboardData['partnerBookingPayments'] = $partnerPayments->where('payment_type', 'booking')->count();

        // Recent bookings
        $dashboardData['recentBookings'] = $user->bookings()
            ->with(['package', 'user'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Admin/Dashboard/Index', $dashboardData);
    }

    private function loadRevenueData($filterPeriod, $dateRange)
    {
        // Get rent payments
        $rentPayments = Payment::where('payment_type', 'rent')
            ->whereIn('status', ['completed', 'paid']);

        // Get booking payments
        $bookingPayments = Payment::where('payment_type', 'booking')
            ->whereIn('status', ['completed', 'paid']);

        if ($filterPeriod !== 'all') {
            $rentPayments->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
            $bookingPayments->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
        }

        // Calculate totals
        $monthlyRentTotal = $rentPayments->sum('amount');
        $monthlyBookingTotal = $bookingPayments->sum('amount');

        // Get payment counts
        $totalCompletedRentPayments = $rentPayments->count();
        $totalCompletedBookingPayments = $bookingPayments->count();

        // Calculate success rate
        $totalPayments = Payment::when($filterPeriod !== 'all', function ($query) use ($dateRange) {
            return $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
        })->count();

        $completedPayments = Payment::whereIn('status', ['completed', 'paid'])
            ->when($filterPeriod !== 'all', function ($query) use ($dateRange) {
                return $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
            })->count();

        $paymentSuccessRate = $totalPayments > 0
            ? ($completedPayments / $totalPayments) * 100
            : 0;

        return [
            'monthlyRentTotal' => $monthlyRentTotal,
            'monthlyBookingTotal' => $monthlyBookingTotal,
            'totalCompletedRentPayments' => $totalCompletedRentPayments,
            'totalCompletedBookingPayments' => $totalCompletedBookingPayments,
            'paymentSuccessRate' => round($paymentSuccessRate, 2),
        ];
    }

    private function getDateRange($filterPeriod)
    {
        $now = now();

        return match ($filterPeriod) {
            'month' => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
            ],
            'year' => [
                'start' => $now->copy()->startOfYear(),
                'end' => $now->copy()->endOfYear(),
            ],
            default => [
                'start' => null,
                'end' => null,
            ],
        };
    }
}
