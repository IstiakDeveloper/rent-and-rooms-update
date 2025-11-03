<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Package;
use App\Models\Payment;
use App\Models\Room;
use App\Models\User;
use App\Models\BookingPayment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminBookingController extends Controller
{
    public function create()
    {
        $packages = Package::with(['rooms.roomPrices', 'country', 'city', 'area'])->get();
        $users = User::select('id', 'name', 'email', 'phone')->get();

        return Inertia::render('Admin/AdminBooking/Create', [
            'packages' => $packages,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'user_id' => 'nullable|exists:users,id',
            'name' => 'required_without:user_id|string|max:255',
            'email' => 'required_without:user_id|email|max:255',
            'phone' => 'required_without:user_id|string|max:20',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'selected_rooms' => 'required|array',
            'payment_option' => 'required|string|in:booking_only,full_payment',
            'payment_method' => 'required|string|in:bank_transfer,stripe',
            'bank_transfer_reference' => 'required_if:payment_method,bank_transfer|string',
            'price_type' => 'required|string',
            'total_amount' => 'required|numeric|min:0',
            'booking_price' => 'required|numeric|min:0',
            'milestone_breakdown' => 'nullable|array',
        ]);

        DB::beginTransaction();

        try {
            // Create or find user
            if (!$validated['user_id']) {
                $user = User::firstOrCreate(
                    ['email' => $validated['email']],
                    [
                        'name' => $validated['name'],
                        'phone' => $validated['phone'],
                        'password' => bcrypt('password123'), // Default password
                    ]
                );
                $validated['user_id'] = $user->id;
            }

            // Calculate number of days
            $fromDate = Carbon::parse($validated['from_date']);
            $toDate = Carbon::parse($validated['to_date']);
            $numberOfDays = $fromDate->diffInDays($toDate);

            // Create booking
            $booking = Booking::create([
                'user_id' => $validated['user_id'],
                'package_id' => $validated['package_id'],
                'from_date' => $validated['from_date'],
                'to_date' => $validated['to_date'],
                'room_ids' => json_encode($validated['selected_rooms']),
                'number_of_days' => $numberOfDays,
                'price_type' => $validated['price_type'],
                'price' => $validated['total_amount'] - $validated['booking_price'],
                'booking_price' => $validated['booking_price'],
                'payment_option' => $validated['payment_option'],
                'total_amount' => $validated['total_amount'],
                'payment_status' => 'pending',
                'status' => 'confirmed',
                'milestone_breakdown' => $validated['milestone_breakdown'] ?? null,
            ]);

            // Create payment record
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'user_id' => $validated['user_id'],
                'amount' => $validated['payment_option'] === 'full_payment'
                    ? $validated['total_amount']
                    : $validated['booking_price'],
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'payment_type' => $validated['payment_option'] === 'full_payment' ? 'rent' : 'booking',
                'reference_number' => $validated['bank_transfer_reference'] ?? null,
            ]);

            // Update booking payment status if full payment
            if ($validated['payment_option'] === 'full_payment') {
                $booking->update(['payment_status' => 'completed']);
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

    public function getPackageDetails(Package $package)
    {
        $package->load(['rooms.roomPrices', 'country', 'city', 'area']);

        return response()->json($package);
    }

    public function searchUsers(Request $request)
    {
        $query = $request->get('q');

        $users = User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->orWhere('phone', 'like', "%{$query}%")
            ->select('id', 'name', 'email', 'phone')
            ->limit(10)
            ->get();

        return response()->json($users);
    }

    public function getAvailableRooms(Request $request)
    {
        $packageId = $request->get('package_id');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $bookedRoomIds = Booking::where('package_id', $packageId)
            ->where(function ($query) use ($fromDate, $toDate) {
                $query->whereBetween('from_date', [$fromDate, $toDate])
                    ->orWhereBetween('to_date', [$fromDate, $toDate])
                    ->orWhere(function ($q) use ($fromDate, $toDate) {
                        $q->where('from_date', '<=', $fromDate)
                          ->where('to_date', '>=', $toDate);
                    });
            })
            ->where('status', '!=', 'cancelled')
            ->pluck('room_ids')
            ->flatten()
            ->unique()
            ->toArray();

        $availableRooms = Room::where('package_id', $packageId)
            ->whereNotIn('id', $bookedRoomIds)
            ->with('roomPrices')
            ->get();

        return response()->json($availableRooms);
    }

    public function calculatePricing(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'selected_rooms' => 'required|array',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'price_type' => 'required|string',
        ]);

        $fromDate = Carbon::parse($validated['from_date']);
        $toDate = Carbon::parse($validated['to_date']);
        $numberOfDays = $fromDate->diffInDays($toDate);

        $rooms = Room::whereIn('id', $validated['selected_rooms'])
            ->with('roomPrices')
            ->get();

        $totalPrice = 0;
        $priceBreakdown = [];

        foreach ($rooms as $room) {
            $roomPrice = $room->roomPrices()
                ->where('price_type', $validated['price_type'])
                ->first();

            if ($roomPrice) {
                $roomTotal = $roomPrice->price * $numberOfDays;
                $totalPrice += $roomTotal;

                $priceBreakdown[] = [
                    'room_id' => $room->id,
                    'room_name' => $room->name,
                    'price_per_day' => $roomPrice->price,
                    'days' => $numberOfDays,
                    'total' => $roomTotal,
                ];
            }
        }

        // Calculate booking fee (10% of total)
        $bookingPrice = $totalPrice * 0.1;

        return response()->json([
            'total_amount' => $totalPrice + $bookingPrice,
            'rent_amount' => $totalPrice,
            'booking_price' => $bookingPrice,
            'price_breakdown' => $priceBreakdown,
            'number_of_days' => $numberOfDays,
        ]);
    }
}
