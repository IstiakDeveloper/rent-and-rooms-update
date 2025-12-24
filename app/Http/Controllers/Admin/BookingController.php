<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingAmenity;
use App\Models\BookingMaintain;
use App\Models\BookingPayment;
use App\Models\BookingRoomPrice;
use App\Models\Package;
use App\Models\Payment;
use App\Models\RoomPrice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isSuperAdmin = $userRoles->contains('Super Admin');
        $isAdmin = $userRoles->contains('Admin');
        $isPartner = $userRoles->contains('Partner');

        // Build query with filters
        $query = Booking::with([
            'user',
            'package.country',
            'package.city',
            'package.area',
            'bookingPayments',
            'bookingAmenities.amenity',
            'bookingMaintains.maintain',
            'bookingRoomPrices.room'
        ])
        ->when($isPartner, function($q) use ($user) {
            // Partner sees only bookings for packages assigned to them AND have admin assigned
            return $q->whereHas('package', function($query) use ($user) {
                $query->where('assigned_to', $user->id)
                      ->whereNotNull('admin_id');
            });
        })
        ->when($isAdmin && !$isSuperAdmin, function($q) use ($user) {
            // Admin sees only bookings for packages where they are assigned as admin
            return $q->whereHas('package', function($query) use ($user) {
                $query->where('admin_id', $user->id);
            });
        });

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('user', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('package', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Payment status filter
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        $bookings = $query->latest()->paginate(15);

        return Inertia::render('Admin/Booking/Index', [
            'bookings' => $bookings,
            'userRole' => [
                'isPartner' => $isPartner,
                'isAdmin' => $isAdmin,
                'isSuperAdmin' => $isSuperAdmin,
            ],
        ]);
    }

    public function show(Booking $booking)
    {
        $user = Auth::user();
        $userRoles = $user->roles->pluck('name');
        $isPartner = $userRoles->contains('Partner');
        $isAdmin = $userRoles->contains('Admin');
        $isSuperAdmin = $userRoles->contains('Super Admin');

        $booking->load([
            'user',
            'package' => function($query) {
                $query->with([
                    'country', 'city', 'area', 'property',
                    'packageAmenities.amenity',
                    'packageMaintains.maintain',
                    'rooms.roomPrices',
                    'photos'
                ]);
            },
            'bookingPayments',
            'bookingAmenities.amenity',
            'bookingMaintains.maintain',
            'bookingRoomPrices.room'
        ]);

        return Inertia::render('Admin/Booking/Show', [
            'booking' => $booking,
            'userRole' => [
                'isPartner' => $isPartner,
                'isAdmin' => $isAdmin,
                'isSuperAdmin' => $isSuperAdmin,
            ],
        ]);
    }

    public function create()
    {
        $user = Auth::user();

        // For now, get all packages (will implement role check later)
        $packages = Package::with([
            'country', 'city', 'area',
            'packageAmenities.amenity',
            'packageMaintains.maintain',
            'rooms.roomPrices'
        ])->get();

        $users = User::all();

        return Inertia::render('Admin/Booking/Create', [
            'packages' => $packages,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'package_id' => 'required|exists:packages,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'room_ids' => 'required|array',
            'room_ids.*' => 'exists:rooms,id',
            'price_type' => 'required|string',
            'price' => 'required|numeric|min:0',
            'booking_price' => 'required|numeric|min:0',
            'payment_option' => 'required|string',
            'total_amount' => 'required|numeric|min:0',
            'amenities' => 'array',
            'maintains' => 'array',
            'room_prices' => 'array',
            'auto_renewal' => 'boolean',
            'renewal_period_days' => 'nullable|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            // Calculate number of days
            $fromDate = \Carbon\Carbon::parse($validated['from_date']);
            $toDate = \Carbon\Carbon::parse($validated['to_date']);
            $numberOfDays = $fromDate->diffInDays($toDate);

            $validated['number_of_days'] = $numberOfDays;
            $validated['payment_status'] = 'pending';
            $validated['status'] = 'pending';

            // Set renewal fields
            if ($validated['auto_renewal'] ?? false) {
                $validated['renewal_status'] = 'active';
                $validated['next_renewal_date'] = $toDate->addDays($validated['renewal_period_days']);
            }

            $booking = Booking::create($validated);

            // Store amenities
            if (!empty($validated['amenities'])) {
                foreach ($validated['amenities'] as $amenityId) {
                    BookingAmenity::create([
                        'booking_id' => $booking->id,
                        'amenity_id' => $amenityId,
                    ]);
                }
            }

            // Store maintains
            if (!empty($validated['maintains'])) {
                foreach ($validated['maintains'] as $maintainId) {
                    BookingMaintain::create([
                        'booking_id' => $booking->id,
                        'maintain_id' => $maintainId,
                    ]);
                }
            }

            // Store room prices
            if (!empty($validated['room_prices'])) {
                foreach ($validated['room_prices'] as $roomPriceData) {
                    BookingRoomPrice::create([
                        'booking_id' => $booking->id,
                        'room_price_id' => $roomPriceData['room_price_id'],
                        'price' => $roomPriceData['price'],
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('admin.bookings.index')
                ->with('success', 'Booking created successfully.');

        } catch (\Exception $e) {
            DB::rollback();

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to create booking: ' . $e->getMessage());
        }
    }

    public function edit(Booking $booking)
    {
        $user = Auth::user();
        $isPartner = $user->roles->pluck('name')->contains('Partner');

        // Partners cannot edit bookings
        if ($isPartner) {
            return redirect()->route('admin.bookings.index')
                ->with('error', 'Partners do not have permission to edit bookings.');
        }

        $booking->load([
            'bookingAmenities.amenity',
            'bookingMaintains.maintain',
            'bookingRoomPrices.room'
        ]);

        $packages = Package::with([
            'country', 'city', 'area',
            'packageAmenities.amenity',
            'packageMaintains.maintain',
            'rooms.roomPrices'
        ])->get();

        $users = User::all();

        return Inertia::render('Admin/Booking/Edit', [
            'booking' => $booking,
            'packages' => $packages,
            'users' => $users,
        ]);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'package_id' => 'required|exists:packages,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'room_ids' => 'required|array',
            'room_ids.*' => 'exists:rooms,id',
            'price_type' => 'required|string',
            'price' => 'required|numeric|min:0',
            'booking_price' => 'required|numeric|min:0',
            'payment_option' => 'required|string',
            'total_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|string',
            'status' => 'required|string',
            'amenities' => 'array',
            'maintains' => 'array',
            'room_prices' => 'array',
            'auto_renewal' => 'boolean',
            'renewal_period_days' => 'nullable|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            // Calculate number of days
            $fromDate = \Carbon\Carbon::parse($validated['from_date']);
            $toDate = \Carbon\Carbon::parse($validated['to_date']);
            $numberOfDays = $fromDate->diffInDays($toDate);

            $validated['number_of_days'] = $numberOfDays;

            // Handle renewal
            if ($validated['auto_renewal'] ?? false) {
                $validated['renewal_status'] = 'active';
                $validated['next_renewal_date'] = $toDate->addDays($validated['renewal_period_days']);
            } else {
                $validated['renewal_status'] = 'inactive';
                $validated['next_renewal_date'] = null;
            }

            $booking->update($validated);

            // Update amenities
            $booking->bookingAmenities()->delete();
            if (!empty($validated['amenities'])) {
                foreach ($validated['amenities'] as $amenityId) {
                    BookingAmenity::create([
                        'booking_id' => $booking->id,
                        'amenity_id' => $amenityId,
                    ]);
                }
            }

            // Update maintains
            $booking->bookingMaintains()->delete();
            if (!empty($validated['maintains'])) {
                foreach ($validated['maintains'] as $maintainId) {
                    BookingMaintain::create([
                        'booking_id' => $booking->id,
                        'maintain_id' => $maintainId,
                    ]);
                }
            }

            // Update room prices
            $booking->bookingRoomPrices()->delete();
            if (!empty($validated['room_prices'])) {
                foreach ($validated['room_prices'] as $roomPriceData) {
                    BookingRoomPrice::create([
                        'booking_id' => $booking->id,
                        'room_price_id' => $roomPriceData['room_price_id'],
                        'price' => $roomPriceData['price'],
                    ]);
                }
            }

            DB::commit();

            return redirect()->route('admin.bookings.index')
                ->with('success', 'Booking updated successfully.');

        } catch (\Exception $e) {
            DB::rollback();

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update booking: ' . $e->getMessage());
        }
    }

    public function destroy(Booking $booking)
    {
        $user = Auth::user();
        $isPartner = $user->roles->pluck('name')->contains('Partner');

        // Partners cannot delete bookings
        if ($isPartner) {
            return redirect()->route('admin.bookings.index')
                ->with('error', 'Partners do not have permission to delete bookings.');
        }

        DB::beginTransaction();

        try {
            // Delete all related records
            // 1. Delete booking amenities
            $booking->bookingAmenities()->delete();

            // 2. Delete booking maintains
            $booking->bookingMaintains()->delete();

            // 3. Delete booking room prices
            $booking->bookingRoomPrices()->delete();

            // 4. Delete booking payments (milestone payments)
            $booking->bookingPayments()->delete();

            // 5. Delete payment records (actual payment transactions)
            $booking->payments()->delete();

            // 6. Delete payment links if any
            $booking->paymentLinks()->delete();

            // 7. Finally delete the booking itself
            $booking->delete();

            DB::commit();

            return redirect()->route('admin.bookings.index')
                ->with('success', 'Booking and all related records deleted successfully.');

        } catch (\Exception $e) {
            DB::rollback();

            return redirect()->back()
                ->with('error', 'Failed to delete booking: ' . $e->getMessage());
        }
    }

    public function getRoomPricesByPackage(Request $request)
    {
        $roomPrices = RoomPrice::whereHas('room', function ($query) use ($request) {
            $query->where('package_id', $request->package_id);
        })->with('room')->get();

        return response()->json($roomPrices);
    }

    /**
     * Update booking status
     */
    public function updateStatus(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected,cancelled'
        ]);

        $booking->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Booking status updated successfully!');
    }

    /**
     * Update payment status
     */
    public function updatePaymentStatus(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'payment_status' => 'required|in:pending,paid,partial,failed'
        ]);

        $booking->update(['payment_status' => $validated['payment_status']]);

        return redirect()->back()->with('success', 'Payment status updated successfully!');
    }
}
