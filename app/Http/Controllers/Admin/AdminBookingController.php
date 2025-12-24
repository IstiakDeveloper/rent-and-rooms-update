<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\BookingRoomPrice;
use App\Models\Package;
use App\Models\Payment;
use App\Models\Room;
use App\Models\RoomPrice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminBookingController extends Controller
{
    /**
     * Display the create booking page
     */
    public function create()
    {
        $packages = Package::with(['rooms.roomPrices', 'country', 'city', 'area'])
            ->where('status', 'active')
            ->get();

        return Inertia::render('Admin/AdminBooking/Create', [
            'packages' => $packages,
        ]);
    }

    /**
     * Store a new booking
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'package_id' => 'required|exists:packages,id',
            'selected_room' => 'required|exists:rooms,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'phone' => 'required|string|max:15',
            'payment_option' => 'required|in:booking_only,full',
            'payment_method' => 'required|in:cash,card,bank_transfer',
            'bank_transfer_reference' => 'required_if:payment_method,bank_transfer|nullable|string',
            'price_type' => 'required|string',
            'total_amount' => 'required|numeric|min:0',
            'booking_price' => 'required|numeric|min:0',
            'price_breakdown' => 'required|array',
        ]);

        DB::beginTransaction();

        try {
            // Get price breakdown and determine price type
            $priceBreakdownData = $validated['price_breakdown'];

            if (empty($priceBreakdownData)) {
                throw new \Exception("Unable to determine price type");
            }

            // Calculate payment amount
            $paymentAmount = $validated['payment_option'] === 'full'
                ? $validated['total_amount'] + $validated['booking_price']
                : $validated['booking_price'];

            // Calculate number of days
            $fromDate = Carbon::parse($validated['from_date']);
            $toDate = Carbon::parse($validated['to_date']);
            $numberOfDays = $fromDate->diffInDays($toDate);

            // Create the booking
            $booking = Booking::create([
                'user_id' => $validated['user_id'],
                'package_id' => $validated['package_id'],
                'from_date' => $validated['from_date'],
                'to_date' => $validated['to_date'],
                'room_ids' => json_encode([$validated['selected_room']]),
                'number_of_days' => $numberOfDays,
                'price_type' => $validated['price_type'],
                'price' => $validated['total_amount'],
                'booking_price' => $validated['booking_price'],
                'payment_option' => $validated['payment_option'],
                'total_amount' => $paymentAmount,
                'payment_status' => 'pending',
                'status' => 'approved',
                'milestone_breakdown' => json_encode($priceBreakdownData),
            ]);

            // Create booking room prices
            $this->createBookingRoomPrices($booking, $validated['selected_room'], $validated['price_type']);

            // Create milestone payments
            $this->createMilestonePayments($booking, $priceBreakdownData, $validated['payment_method']);

            // Process payment based on method
            $this->processPayment(
                $booking,
                $paymentAmount,
                $validated['payment_method'],
                $validated['payment_option'],
                $validated['bank_transfer_reference'] ?? null
            );

            DB::commit();

            return redirect()->route('admin.bookings.index')
                ->with('success', 'Booking created and payment processed successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Booking creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Error creating booking: ' . $e->getMessage());
        }
    }

    /**
     * Create booking room prices
     */
    private function createBookingRoomPrices($booking, $roomId, $priceType)
    {
        $room = Room::with('roomPrices')->find($roomId);

        // Get the applicable price for the selected type
        $roomPrice = $room->roomPrices->filter(function ($price) use ($priceType) {
            return $price->type === $priceType;
        })->first();

        if ($roomPrice) {
            BookingRoomPrice::create([
                'booking_id' => $booking->id,
                'room_id' => $roomId,
                'price_type' => $priceType,
                'fixed_price' => $roomPrice->fixed_price,
                'discount_price' => $roomPrice->discount_price,
                'booking_price' => $roomPrice->booking_price,
            ]);
        }
    }    /**
     * Create milestone payments
     */
    private function createMilestonePayments($booking, $priceBreakdown, $paymentMethod)
    {
        $startDate = Carbon::parse($booking->from_date);
        $bookingFee = $booking->booking_price;

        // Insert booking fee payment with immediate due date
        BookingPayment::create([
            'booking_id' => $booking->id,
            'milestone_type' => 'Booking Fee',
            'milestone_number' => 0,
            'due_date' => now(),
            'amount' => $bookingFee,
            'payment_status' => 'pending',
            'payment_method' => $paymentMethod,
            'is_booking_fee' => true,
        ]);

        // Create milestone payments for remaining amount
        foreach ($priceBreakdown as $index => $milestone) {
            // Calculate due date based on milestone type
            $dueDate = match ($milestone['type']) {
                'Month' => $startDate->copy()->addMonths($index),
                'Week' => $startDate->copy()->addWeeks($index),
                'Day' => $startDate->copy()->addDays($index),
                default => $startDate->copy()->addDays($index)
            };

            BookingPayment::create([
                'booking_id' => $booking->id,
                'milestone_type' => $milestone['type'],
                'milestone_number' => $index + 1,
                'due_date' => $dueDate,
                'amount' => $milestone['total'],
                'payment_status' => 'pending',
                'payment_method' => $paymentMethod,
                'is_booking_fee' => false,
            ]);
        }
    }

    /**
     * Process payment based on method
     */
    private function processPayment($booking, $paymentAmount, $paymentMethod, $paymentOption, $bankReference = null)
    {
        $paymentData = [
            'booking_id' => $booking->id,
            'payment_method' => $paymentMethod,
            'amount' => $paymentAmount,
            'payment_type' => $paymentOption === 'full' ? 'rent' : 'booking',
        ];

        switch ($paymentMethod) {
            case 'card':
                // Card payment would be handled on frontend with Stripe
                $paymentData['status'] = 'pending';
                $paymentData['transaction_id'] = null;
                break;

            case 'bank_transfer':
                $paymentData['status'] = 'pending';
                $paymentData['transaction_id'] = $bankReference;
                break;

            case 'cash':
            default:
                $paymentData['status'] = 'pending';
                break;
        }

        Payment::create($paymentData);
    }

    /**
     * Search users
     */
    public function searchUsers(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $users = User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->orWhere('phone', 'like', "%{$query}%")
            ->select('id', 'name', 'email', 'phone')
            ->limit(10)
            ->get();

        return response()->json($users);
    }

    /**
     * Get package details with rooms and prices
     */
    public function getPackageDetails(Package $package)
    {
        $package->load([
            'rooms.roomPrices',
            'country',
            'city',
            'area',
            'property'
        ]);

        return response()->json($package);
    }

    /**
     * Get available rooms for a package within date range
     */
    public function getAvailableRooms(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
        ]);

        $packageId = $validated['package_id'];
        $fromDate = $validated['from_date'];
        $toDate = $validated['to_date'];

        // Get booked room IDs for the date range
        $bookedRoomIds = Booking::where('package_id', $packageId)
            ->whereNotIn('payment_status', ['cancelled', 'refunded'])
            ->where(function ($query) use ($fromDate, $toDate) {
                $query->whereBetween('from_date', [$fromDate, $toDate])
                    ->orWhereBetween('to_date', [$fromDate, $toDate])
                    ->orWhere(function ($q) use ($fromDate, $toDate) {
                        $q->where('from_date', '<=', $fromDate)
                          ->where('to_date', '>=', $toDate);
                    });
            })
            ->get()
            ->flatMap(function ($booking) {
                return json_decode($booking->room_ids, true) ?: [];
            })
            ->unique()
            ->values()
            ->toArray();

        // Get available rooms
        $availableRooms = Room::where('package_id', $packageId)
            ->whereNotIn('id', $bookedRoomIds)
            ->with('roomPrices')
            ->get();

        return response()->json($availableRooms);
    }

    /**
     * Calculate pricing for selected room and dates
     */
    public function calculatePricing(Request $request)
    {
        $validated = $request->validate([
            'selected_room' => 'required|exists:rooms,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
        ]);

        $room = Room::with('roomPrices')->find($validated['selected_room']);
        $startDate = Carbon::parse($validated['from_date']);
        $endDate = Carbon::parse($validated['to_date']);
        $totalDays = $startDate->diffInDays($endDate);

        // Determine optimal price type
        $priceBreakdown = $this->determineOptimalPriceType($room, $startDate, $endDate, $totalDays);

        if (!$priceBreakdown) {
            return response()->json([
                'error' => 'Unable to calculate pricing for the selected dates'
            ], 400);
        }

        $prices = $room->roomPrices->keyBy('type');
        $breakdown = [];
        $total = 0;
        $priceType = null;

        // Calculate breakdown
        foreach ($priceBreakdown as $type => $quantity) {
            if ($quantity > 0 && isset($prices[$type])) {
                if (!$priceType) {
                    $priceType = $type;
                }

                $price = $prices[$type];
                $unitPrice = $price->discount_price ?? $price->fixed_price;

                if ($type === 'Month') {
                    // Add monthly breakdown with month names
                    $currentDate = $startDate->copy();
                    for ($i = 0; $i < $quantity; $i++) {
                        $monthName = $currentDate->format('F Y');
                        $breakdown[] = [
                            'type' => 'Month',
                            'quantity' => 1,
                            'price' => $unitPrice,
                            'total' => $unitPrice,
                            'description' => $monthName,
                            'note' => ($i === $quantity - 1 && $endDate->day > 1) ? '(Includes partial month)' : ''
                        ];
                        $currentDate->addMonth();
                    }
                } else {
                    $typeTotal = $unitPrice * $quantity;
                    $breakdown[] = [
                        'type' => $type,
                        'quantity' => $quantity,
                        'price' => $unitPrice,
                        'total' => $typeTotal,
                        'description' => "{$quantity} " . ($quantity > 1 ? "{$type}s" : $type)
                    ];
                }

                $total += $unitPrice * $quantity;
            }
        }

        // Get booking price
        $bookingPrice = $prices[$priceType]->booking_price ?? 0;

        return response()->json([
            'breakdown' => $breakdown,
            'total' => round($total, 2),
            'booking_price' => round($bookingPrice, 2),
            'price_type' => $priceType,
            'number_of_days' => $totalDays,
        ]);
    }

    /**
     * Determine optimal price type based on duration
     */
    private function determineOptimalPriceType($room, $startDate, $endDate, $totalDays)
    {
        $availableTypes = $room->roomPrices->pluck('type')->unique();

        $priceBreakdown = [
            'Month' => 0,
            'Week' => 0,
            'Day' => 0
        ];

        // First check if duration is over a month (28 days)
        if ($totalDays >= 28) {
            if (!$availableTypes->contains('Month')) {
                throw new \Exception("Monthly pricing is required for bookings of 28 days or more.");
            }
            return $this->calculateMonthlyBreakdown($startDate, $endDate, $totalDays);
        }

        // Then check if duration is 7 days or more
        if ($totalDays >= 7) {
            if (!$availableTypes->contains('Week')) {
                if ($availableTypes->contains('Month')) {
                    return $this->calculateMonthlyBreakdown($startDate, $endDate, $totalDays);
                }
                throw new \Exception("Weekly pricing is required for bookings of 7 days or more.");
            }
            return $this->calculateWeeklyBreakdown($totalDays);
        }

        // Finally, check for daily bookings (less than 7 days)
        if (!$availableTypes->contains('Day')) {
            if ($availableTypes->contains('Week')) {
                return $this->calculateWeeklyBreakdown($totalDays);
            } elseif ($availableTypes->contains('Month')) {
                return $this->calculateMonthlyBreakdown($startDate, $endDate, $totalDays);
            }
            throw new \Exception("Daily pricing is required for bookings less than 7 days.");
        }

        return [
            'Month' => 0,
            'Week' => 0,
            'Day' => $totalDays
        ];
    }

    /**
     * Calculate monthly breakdown
     */
    private function calculateMonthlyBreakdown($startDate, $endDate, $totalDays)
    {
        // Get days in first month
        $daysInFirstMonth = $startDate->daysInMonth;

        // If total days is less than or equal to days in first month, return 1 month
        if ($totalDays <= $daysInFirstMonth) {
            return [
                'Month' => 1,
                'Week' => 0,
                'Day' => 0
            ];
        }

        // If days exceed first month, calculate how many months are needed
        $extraDays = $totalDays - $daysInFirstMonth;
        $months = 1 + ceil($extraDays / $endDate->daysInMonth);

        return [
            'Month' => (int)$months,
            'Week' => 0,
            'Day' => 0
        ];
    }

    /**
     * Calculate weekly breakdown
     */
    private function calculateWeeklyBreakdown($totalDays)
    {
        $fullWeeks = ceil($totalDays / 7);

        return [
            'Month' => 0,
            'Week' => $fullWeeks,
            'Day' => 0
        ];
    }

    /**
     * Get disabled/booked dates for a room
     */
    public function getDisabledDates(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'room_id' => 'required|exists:rooms,id',
        ]);

        $bookedDates = Booking::where('package_id', $validated['package_id'])
            ->whereNotIn('payment_status', ['cancelled', 'refunded'])
            ->whereRaw('JSON_CONTAINS(REPLACE(REPLACE(room_ids, "\\\\", ""), \'"\', ""), ?)', ["[{$validated['room_id']}]"])
            ->get()
            ->flatMap(function ($booking) {
                $bookedDates = [];
                $from = Carbon::parse($booking->from_date);
                $to = Carbon::parse($booking->to_date);

                while ($from->lte($to)) {
                    $bookedDates[] = $from->format('Y-m-d');
                    $from->addDay();
                }
                return $bookedDates;
            })
            ->unique()
            ->values()
            ->toArray();

        return response()->json($bookedDates);
    }
}
