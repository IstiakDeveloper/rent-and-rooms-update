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
        $userRoles = $user->roles->pluck('name');
        $isSuperAdmin = $userRoles->contains('Super Admin');
        $isAdmin = $userRoles->contains('Admin');
        $isPartner = $userRoles->contains('Partner');
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

        // Load revenue data based on role
        $revenueData = $this->loadRevenueData($filterPeriod, $dateRange, $user, $isPartner, $isAdmin);
        $dashboardData = array_merge($dashboardData, $revenueData);

        // Role-based data filtering
        if ($isPartner) {
            // Partner sees only their assigned packages and related data
            $dashboardData['totalPackages'] = Package::where('assigned_to', $user->id)->count();
            $dashboardData['totalBookings'] = Booking::whereHas('package', function($query) use ($user) {
                $query->where('assigned_to', $user->id);
            })->count();

            $dashboardData['partnerPackages'] = $dashboardData['totalPackages'];
            $dashboardData['partnerBookings'] = $dashboardData['totalBookings'];

            $dashboardData['partnerUsers'] = User::whereHas('bookings.package', function($query) use ($user) {
                $query->where('assigned_to', $user->id);
            })->distinct()->count();

            $dashboardData['totalUsers'] = $dashboardData['partnerUsers'];

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

            // Recent bookings for partner
            $dashboardData['recentBookings'] = Booking::whereHas('package', function($query) use ($user) {
                $query->where('assigned_to', $user->id);
            })
                ->with(['package.property', 'user'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($booking) {
                    return [
                        'id' => $booking->id,
                        'booking_number' => $booking->booking_number ?? 'N/A',
                        'from_date' => $booking->from_date ? \Carbon\Carbon::parse($booking->from_date)->format('Y-m-d') : null,
                        'to_date' => $booking->to_date ? \Carbon\Carbon::parse($booking->to_date)->format('Y-m-d') : null,
                        'created_at' => $booking->created_at ? $booking->created_at->format('Y-m-d') : null,
                        'status' => $booking->status,
                        'payment_status' => $booking->payment_status,
                        'total_amount' => $booking->total_amount,
                        'package' => $booking->package ? [
                            'id' => $booking->package->id,
                            'name' => $booking->package->name,
                            'title' => $booking->package->title ?? $booking->package->name,
                            'property' => $booking->package->property ? [
                                'id' => $booking->package->property->id,
                                'name' => $booking->package->property->name,
                            ] : null,
                        ] : null,
                        'user' => $booking->user ? [
                            'id' => $booking->user->id,
                            'name' => $booking->user->name,
                            'email' => $booking->user->email,
                        ] : null,
                    ];
                });
        } elseif ($isSuperAdmin) {
            // Super Admin sees all data
            $dashboardData['totalUsers'] = User::count();
            $dashboardData['totalPartner'] = User::role('Partner')->count();
            $dashboardData['totalPackages'] = Package::count();
            $dashboardData['totalBookings'] = Booking::count();

            $dashboardData['partnerPackages'] = Package::where('assigned_to', $user->id)->count();
            $dashboardData['partnerBookings'] = Booking::whereHas('package', function($query) use ($user) {
                $query->where('assigned_to', $user->id);
            })->count();

            $dashboardData['partnerUsers'] = User::whereHas('bookings.package', function($query) use ($user) {
                $query->where('assigned_to', $user->id);
            })->distinct()->count();

            // Recent bookings - all bookings for Super Admin
            $dashboardData['recentBookings'] = Booking::with(['package.property', 'user'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($booking) {
                    return [
                        'id' => $booking->id,
                        'booking_number' => $booking->booking_number ?? 'N/A',
                        'from_date' => $booking->from_date ? \Carbon\Carbon::parse($booking->from_date)->format('Y-m-d') : null,
                        'to_date' => $booking->to_date ? \Carbon\Carbon::parse($booking->to_date)->format('Y-m-d') : null,
                        'created_at' => $booking->created_at ? $booking->created_at->format('Y-m-d') : null,
                        'status' => $booking->status,
                        'payment_status' => $booking->payment_status,
                        'total_amount' => $booking->total_amount,
                        'package' => $booking->package ? [
                            'id' => $booking->package->id,
                            'name' => $booking->package->name,
                            'title' => $booking->package->title ?? $booking->package->name,
                            'property' => $booking->package->property ? [
                                'id' => $booking->package->property->id,
                                'name' => $booking->package->property->name,
                            ] : null,
                        ] : null,
                        'user' => $booking->user ? [
                            'id' => $booking->user->id,
                            'name' => $booking->user->name,
                            'email' => $booking->user->email,
                        ] : null,
                    ];
                });
        } elseif ($isAdmin) {
            // Admin sees only their assigned packages data
            $dashboardData['totalPackages'] = Package::where('admin_id', $user->id)->count();
            $dashboardData['totalBookings'] = Booking::whereHas('package', function($query) use ($user) {
                $query->where('admin_id', $user->id);
            })->count();

            $dashboardData['totalUsers'] = User::whereHas('bookings.package', function($query) use ($user) {
                $query->where('admin_id', $user->id);
            })->distinct()->count();

            $dashboardData['totalPartner'] = User::role('Partner')
                ->whereHas('assignedPackages', function($query) use ($user) {
                    $query->where('admin_id', $user->id);
                })->count();

            $dashboardData['partnerPackages'] = $dashboardData['totalPackages'];
            $dashboardData['partnerBookings'] = $dashboardData['totalBookings'];
            $dashboardData['partnerUsers'] = $dashboardData['totalUsers'];

            // Recent bookings - only for packages where admin is assigned
            $dashboardData['recentBookings'] = Booking::whereHas('package', function($query) use ($user) {
                $query->where('admin_id', $user->id);
            })
                ->with(['package.property', 'user'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($booking) {
                    return [
                        'id' => $booking->id,
                        'booking_number' => $booking->booking_number ?? 'N/A',
                        'from_date' => $booking->from_date ? \Carbon\Carbon::parse($booking->from_date)->format('Y-m-d') : null,
                        'to_date' => $booking->to_date ? \Carbon\Carbon::parse($booking->to_date)->format('Y-m-d') : null,
                        'created_at' => $booking->created_at ? $booking->created_at->format('Y-m-d') : null,
                        'status' => $booking->status,
                        'payment_status' => $booking->payment_status,
                        'total_amount' => $booking->total_amount,
                        'package' => $booking->package ? [
                            'id' => $booking->package->id,
                            'name' => $booking->package->name,
                            'title' => $booking->package->title ?? $booking->package->name,
                            'property' => $booking->package->property ? [
                                'id' => $booking->package->property->id,
                                'name' => $booking->package->property->name,
                            ] : null,
                        ] : null,
                        'user' => $booking->user ? [
                            'id' => $booking->user->id,
                            'name' => $booking->user->name,
                            'email' => $booking->user->email,
                        ] : null,
                    ];
                });
        } else {
            // Regular user data
            $dashboardData['activePackages'] = $user->bookings()->count();
            $dashboardData['upcomingBookings'] = $user->bookings()->count();
            $dashboardData['totalSpent'] = $user->bookings()
                ->where('payment_status', 'completed')
                ->sum('total_amount');

            $dashboardData['totalPackages'] = Package::where('user_id', $user->id)->count();
            $dashboardData['totalBookings'] = Booking::whereHas('package', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->count();

            $dashboardData['recentBookings'] = $user->bookings()
                ->with(['package.property', 'user'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($booking) {
                    return [
                        'id' => $booking->id,
                        'booking_number' => $booking->booking_number ?? 'N/A',
                        'from_date' => $booking->from_date ? \Carbon\Carbon::parse($booking->from_date)->format('Y-m-d') : null,
                        'to_date' => $booking->to_date ? \Carbon\Carbon::parse($booking->to_date)->format('Y-m-d') : null,
                        'created_at' => $booking->created_at ? $booking->created_at->format('Y-m-d') : null,
                        'status' => $booking->status,
                        'payment_status' => $booking->payment_status,
                        'total_amount' => $booking->total_amount,
                        'package' => $booking->package ? [
                            'id' => $booking->package->id,
                            'name' => $booking->package->name,
                            'title' => $booking->package->title ?? $booking->package->name,
                            'property' => $booking->package->property ? [
                                'id' => $booking->package->property->id,
                                'name' => $booking->package->property->name,
                            ] : null,
                        ] : null,
                        'user' => $booking->user ? [
                            'id' => $booking->user->id,
                            'name' => $booking->user->name,
                            'email' => $booking->user->email,
                        ] : null,
                    ];
                });
        }

        return Inertia::render('Admin/Dashboard/Index', $dashboardData);
    }

    private function loadRevenueData($filterPeriod, $dateRange, $user, $isPartner, $isAdmin)
    {
        // Get rent payments
        $rentPayments = Payment::where('payment_type', 'rent')
            ->whereIn('status', ['completed', 'paid'])
            ->when($isPartner, function($query) use ($user) {
                return $query->whereHas('booking.package', function($q) use ($user) {
                    $q->where('assigned_to', $user->id)->whereNotNull('admin_id');
                });
            })
            ->when($isAdmin, function($query) use ($user) {
                return $query->whereHas('booking.package', function($q) use ($user) {
                    $q->where('admin_id', $user->id);
                });
            });

        // Get booking payments
        $bookingPayments = Payment::where('payment_type', 'booking')
            ->whereIn('status', ['completed', 'paid'])
            ->when($isPartner, function($query) use ($user) {
                return $query->whereHas('booking.package', function($q) use ($user) {
                    $q->where('assigned_to', $user->id)->whereNotNull('admin_id');
                });
            })
            ->when($isAdmin, function($query) use ($user) {
                return $query->whereHas('booking.package', function($q) use ($user) {
                    $q->where('admin_id', $user->id);
                });
            });

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
        })
        ->when($isPartner, function($query) use ($user) {
            return $query->whereHas('booking.package', function($q) use ($user) {
                $q->where('assigned_to', $user->id)->whereNotNull('admin_id');
            });
        })
        ->when($isAdmin, function($query) use ($user) {
            return $query->whereHas('booking.package', function($q) use ($user) {
                $q->where('admin_id', $user->id);
            });
        })->count();

        $completedPayments = Payment::whereIn('status', ['completed', 'paid'])
            ->when($filterPeriod !== 'all', function ($query) use ($dateRange) {
                return $query->whereBetween('created_at', [$dateRange['start'], $dateRange['end']]);
            })
            ->when($isPartner, function($query) use ($user) {
                return $query->whereHas('booking.package', function($q) use ($user) {
                    $q->where('assigned_to', $user->id);
                });
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
