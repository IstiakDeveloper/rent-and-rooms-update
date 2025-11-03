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
    public function index()
    {
        $user = Auth::user();

        // For now, show all bookings (will implement role check later)
        $bookings = Booking::with([
            'user',
            'package.country',
            'package.city',
            'package.area',
            'bookingPayments',
            'bookingAmenities.amenity',
            'bookingMaintains.maintain',
            'bookingRoomPrices.roomPrice'
        ])->latest()->paginate(15);

        return Inertia::render('Admin/Booking/Index', [
            'bookings' => $bookings,
        ]);
    }

    public function show(Booking $booking)
    {
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
            'bookingRoomPrices.roomPrice'
        ]);

        return Inertia::render('Admin/Booking/Show', [
            'booking' => $booking,
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
        $booking->load([
            'bookingAmenities.amenity',
            'bookingMaintains.maintain',
            'bookingRoomPrices.roomPrice'
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
        DB::beginTransaction();

        try {
            // Delete related records
            $booking->bookingAmenities()->delete();
            $booking->bookingMaintains()->delete();
            $booking->bookingRoomPrices()->delete();
            $booking->bookingPayments()->delete();

            $booking->delete();

            DB::commit();

            return redirect()->route('admin.bookings.index')
                ->with('success', 'Booking deleted successfully.');

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
}
