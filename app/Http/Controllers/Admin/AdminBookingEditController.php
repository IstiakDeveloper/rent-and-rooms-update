<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\BookingRoomPrice;
use App\Models\Package;
use App\Models\Payment;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminBookingEditController extends Controller
{
    /**
     * Display the edit booking page
     */
    public function edit(Booking $booking)
    {
        $booking->load([
            'user',
            'package' => function($query) {
                $query->with(['rooms.roomPrices', 'country', 'city', 'area', 'property']);
            },
            'bookingPayments',
            'bookingRoomPrices'
        ]);

        // Get all packages for potential package change
        $packages = Package::with(['rooms.roomPrices', 'country', 'city', 'area'])
            ->where('status', 'active')
            ->get();

        // Get original room from room_ids and ensure it's properly decoded
        $roomIds = is_string($booking->room_ids)
            ? json_decode($booking->room_ids, true)
            : $booking->room_ids;

        $selectedRoom = null;
        if (!empty($roomIds) && is_array($roomIds)) {
            $selectedRoom = Room::with('roomPrices')->find($roomIds[0]);
        }

        // Prepare booking data with properly decoded room_ids
        $bookingData = $booking->toArray();
        $bookingData['room_ids'] = $roomIds;

        // Decode milestone_breakdown if it's a string
        if (is_string($bookingData['milestone_breakdown'])) {
            $bookingData['milestone_breakdown'] = json_decode($bookingData['milestone_breakdown'], true);
        }

        return Inertia::render('Admin/AdminBooking/Edit', [
            'booking' => $bookingData,
            'packages' => $packages,
            'selectedRoom' => $selectedRoom,
        ]);
    }

    /**
     * Update an existing booking with full recalculation
     */
    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'package_id' => 'required|exists:packages,id',
            'selected_room' => 'required|exists:rooms,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'phone' => 'required|string|max:15',
            'payment_option' => 'nullable|in:booking_only,full',
            'payment_method' => 'nullable|in:cash,card,bank_transfer',
            'bank_transfer_reference' => 'required_if:payment_method,bank_transfer|nullable|string',
            'price_type' => 'nullable|string',
            'total_amount' => 'nullable|numeric|min:0',
            'booking_price' => 'nullable|numeric|min:0',
            'price_breakdown' => 'nullable|array',
            'payment_status' => 'nullable|string|in:pending,completed,failed,partial',
            'status' => 'nullable|string|in:pending,approved,confirmed,cancelled,completed',
        ], [
            'user_id.required' => 'Please select a user',
            'user_id.exists' => 'Selected user does not exist',
            'package_id.required' => 'Please select a package',
            'package_id.exists' => 'Selected package does not exist',
            'selected_room.required' => 'Please select a room',
            'selected_room.exists' => 'Selected room does not exist',
            'from_date.required' => 'Please select check-in date',
            'from_date.date' => 'Check-in date must be a valid date',
            'to_date.required' => 'Please select check-out date',
            'to_date.date' => 'Check-out date must be a valid date',
            'to_date.after' => 'Check-out date must be after check-in date',
            'phone.required' => 'Please enter phone number',
            'phone.max' => 'Phone number must not exceed 15 characters',
        ]);

        DB::beginTransaction();

        try {
            // Determine what needs to be updated
            $needsFullRecalculation = false;
            $updateData = [];

            // Normalize dates by parsing them first to handle different formats
            $newFromDate = isset($validated['from_date']) ? Carbon::parse($validated['from_date'])->format('Y-m-d') : null;
            $newToDate = isset($validated['to_date']) ? Carbon::parse($validated['to_date'])->format('Y-m-d') : null;
            $currentFromDate = Carbon::parse($booking->from_date)->format('Y-m-d');
            $currentToDate = Carbon::parse($booking->to_date)->format('Y-m-d');

            // Check if dates changed
            if ($newFromDate && $newFromDate !== $currentFromDate) {
                $needsFullRecalculation = true;
                Log::info('From date changed', ['old' => $currentFromDate, 'new' => $newFromDate]);
            }
            if ($newToDate && $newToDate !== $currentToDate) {
                $needsFullRecalculation = true;
                Log::info('To date changed', ['old' => $currentToDate, 'new' => $newToDate]);
            }

            // Check if room changed
            $currentRoomIds = is_string($booking->room_ids)
                ? json_decode($booking->room_ids, true)
                : $booking->room_ids;
            if (isset($validated['selected_room']) && (!empty($currentRoomIds) && $currentRoomIds[0] != $validated['selected_room'])) {
                $needsFullRecalculation = true;
                Log::info('Room changed', ['old' => $currentRoomIds[0], 'new' => $validated['selected_room']]);
            }

            // Check if package changed
            if (isset($validated['package_id']) && $validated['package_id'] != $booking->package_id) {
                $needsFullRecalculation = true;
                Log::info('Package changed', ['old' => $booking->package_id, 'new' => $validated['package_id']]);
            }

            Log::info('Update check', [
                'needsFullRecalculation' => $needsFullRecalculation,
                'has_from_date' => isset($validated['from_date']),
                'has_to_date' => isset($validated['to_date']),
                'has_selected_room' => isset($validated['selected_room']),
                'validated_data' => $validated
            ]);

            // If full recalculation is needed
            if ($needsFullRecalculation && isset($validated['from_date']) && isset($validated['to_date']) && isset($validated['selected_room'])) {

                Log::info('Starting full recalculation');

                // Use provided values or fall back to existing
                $fromDate = Carbon::parse($validated['from_date']);
                $toDate = Carbon::parse($validated['to_date']);
                $numberOfDays = $fromDate->diffInDays($toDate);

                $selectedRoom = isset($validated['selected_room']) ? $validated['selected_room'] : $currentRoomIds[0];
                $packageId = isset($validated['package_id']) ? $validated['package_id'] : $booking->package_id;

                // Get price breakdown
                $priceBreakdownData = $validated['price_breakdown'] ?? [];

                if (empty($priceBreakdownData)) {
                    throw new \Exception("Unable to determine price type for recalculation");
                }

                // Calculate payment amount
                $paymentOption = $validated['payment_option'] ?? $booking->payment_option;
                $totalAmount = $validated['total_amount'] ?? $booking->price;
                $bookingPrice = $validated['booking_price'] ?? $booking->booking_price;

                $paymentAmount = $paymentOption === 'full'
                    ? $totalAmount + $bookingPrice
                    : $bookingPrice;

                // Update booking data
                $updateData = [
                    'user_id' => $validated['user_id'] ?? $booking->user_id,
                    'package_id' => $packageId,
                    'from_date' => $fromDate->format('Y-m-d'),
                    'to_date' => $toDate->format('Y-m-d'),
                    'room_ids' => json_encode([$selectedRoom]),
                    'number_of_days' => $numberOfDays,
                    'price_type' => $validated['price_type'] ?? $booking->price_type,
                    'price' => $totalAmount,
                    'booking_price' => $bookingPrice,
                    'payment_option' => $paymentOption,
                    'total_amount' => $paymentAmount,
                    'milestone_breakdown' => json_encode($priceBreakdownData),
                ];

                // Add status updates if provided
                if (isset($validated['payment_status'])) {
                    $updateData['payment_status'] = $validated['payment_status'];
                }
                if (isset($validated['status'])) {
                    $updateData['status'] = $validated['status'];
                }

                // Update booking
                $booking->update($updateData);

                Log::info('Booking updated with full recalculation', ['booking_id' => $booking->id, 'updateData' => $updateData]);

                // Delete and recreate booking room prices
                BookingRoomPrice::where('booking_id', $booking->id)->delete();
                $this->createBookingRoomPrices($booking, $selectedRoom, $validated['price_type'] ?? $booking->price_type);

                // Delete and recreate milestone payments
                BookingPayment::where('booking_id', $booking->id)->delete();
                $this->createMilestonePayments(
                    $booking,
                    $priceBreakdownData,
                    $validated['payment_method'] ?? $booking->bookingPayments->first()->payment_method ?? 'cash'
                );

                // Update payment records if needed
                $this->updatePaymentRecords(
                    $booking,
                    $paymentAmount,
                    $validated['payment_method'] ?? null,
                    $paymentOption,
                    $validated['bank_transfer_reference'] ?? null
                );

            } else {
                // Simple update without recalculation
                Log::info('Simple update without recalculation', ['booking_id' => $booking->id]);

                if (isset($validated['payment_status'])) {
                    $updateData['payment_status'] = $validated['payment_status'];
                }
                if (isset($validated['status'])) {
                    $updateData['status'] = $validated['status'];
                }
                if (isset($validated['user_id'])) {
                    $updateData['user_id'] = $validated['user_id'];
                }

                if (!empty($updateData)) {
                    $booking->update($updateData);
                    Log::info('Booking updated (simple)', ['booking_id' => $booking->id, 'updateData' => $updateData]);
                } else {
                    Log::info('No changes detected');
                }
            }

            DB::commit();

            Log::info('Booking update committed successfully', ['booking_id' => $booking->id]);

            return redirect()->route('admin.bookings.show', $booking)
                ->with('success', 'Booking updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Booking update failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Error updating booking: ' . $e->getMessage());
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
    }

    /**
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
     * Update payment records
     */
    private function updatePaymentRecords($booking, $paymentAmount, $paymentMethod, $paymentOption, $bankReference = null)
    {
        // Check if payment record exists
        $existingPayment = Payment::where('booking_id', $booking->id)->first();

        $paymentData = [
            'booking_id' => $booking->id,
            'amount' => $paymentAmount,
            'payment_type' => $paymentOption === 'full' ? 'rent' : 'booking',
        ];

        if ($paymentMethod) {
            $paymentData['payment_method'] = $paymentMethod;

            switch ($paymentMethod) {
                case 'card':
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
        }

        if ($existingPayment) {
            $existingPayment->update($paymentData);
        } else {
            Payment::create($paymentData);
        }
    }

    /**
     * Search users for editing
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
     * Get package details with rooms and prices for editing
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
     * Get available rooms for a package within date range (excluding current booking)
     */
    public function getAvailableRooms(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'booking_id' => 'nullable|exists:bookings,id',
        ]);

        $packageId = $validated['package_id'];
        $fromDate = $validated['from_date'];
        $toDate = $validated['to_date'];
        $currentBookingId = $validated['booking_id'] ?? null;

        // Get booked room IDs for the date range (excluding current booking being edited)
        $bookedRoomIds = Booking::where('package_id', $packageId)
            ->when($currentBookingId, function($query) use ($currentBookingId) {
                $query->where('id', '!=', $currentBookingId);
            })
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
     * Calculate pricing for selected room and dates (for edit preview)
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
     * Get disabled/booked dates for a room (excluding current booking)
     */
    public function getDisabledDates(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'room_id' => 'required|exists:rooms,id',
            'booking_id' => 'nullable|exists:bookings,id',
        ]);

        $currentBookingId = $validated['booking_id'] ?? null;

        $bookedDates = Booking::where('package_id', $validated['package_id'])
            ->when($currentBookingId, function($query) use ($currentBookingId) {
                $query->where('id', '!=', $currentBookingId);
            })
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

    /**
     * Extend booking to a new end date
     */
    public function extendBooking(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'new_to_date' => 'required|date|after:' . Carbon::parse($booking->to_date)->format('Y-m-d'),
        ]);

        DB::beginTransaction();

        try {
            $originalToDate = Carbon::parse($booking->to_date);
            $newToDate = Carbon::parse($validated['new_to_date']);
            $extraDays = $originalToDate->diffInDays($newToDate);

            // Get room price for calculation
            $roomIds = is_string($booking->room_ids)
                ? json_decode($booking->room_ids, true)
                : $booking->room_ids;

            $extraAmount = 0;
            if (!empty($roomIds)) {
                $room = Room::with('roomPrices')->find($roomIds[0]);
                if ($room) {
                    $roomPrice = $room->roomPrices()
                        ->where('type', $booking->price_type)
                        ->first();

                    if ($roomPrice) {
                        $dailyRate = ($roomPrice->discount_price ?? $roomPrice->fixed_price);

                        // Calculate based on price type
                        if ($booking->price_type === 'Month') {
                            $months = ceil($extraDays / 30);
                            $extraAmount = $dailyRate * $months;
                        } elseif ($booking->price_type === 'Week') {
                            $weeks = ceil($extraDays / 7);
                            $extraAmount = $dailyRate * $weeks;
                        } else {
                            $extraAmount = $dailyRate * $extraDays;
                        }
                    }
                }
            }

            // Update booking
            $booking->update([
                'to_date' => $validated['new_to_date'],
                'number_of_days' => $booking->number_of_days + $extraDays,
                'price' => $booking->price + $extraAmount,
                'total_amount' => $booking->total_amount + $extraAmount,
            ]);

            // Create payment record for extension
            if ($extraAmount > 0) {
                Payment::create([
                    'booking_id' => $booking->id,
                    'user_id' => $booking->user_id,
                    'amount' => $extraAmount,
                    'payment_method' => 'pending',
                    'status' => 'pending',
                    'payment_type' => 'rent',
                    'description' => "Extension for {$extraDays} days",
                ]);
            }

            DB::commit();

            return redirect()->route('admin.bookings.show', $booking)
                ->with('success', 'Booking extended successfully. Additional payment of £' . number_format($extraAmount, 2) . ' required.');

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to extend booking: ' . $e->getMessage());
        }
    }

    /**
     * Cancel booking
     */
    public function cancelBooking(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:500',
            'refund_amount' => 'nullable|numeric|min:0|max:' . $booking->total_amount,
        ]);

        DB::beginTransaction();

        try {
            $booking->update([
                'status' => 'cancelled',
                'payment_status' => 'cancelled',
                'cancellation_reason' => $validated['cancellation_reason'],
                'cancelled_at' => now(),
            ]);

            // Update all milestone payments to cancelled
            BookingPayment::where('booking_id', $booking->id)
                ->update(['payment_status' => 'cancelled']);

            // Process refund if specified
            if (!empty($validated['refund_amount']) && $validated['refund_amount'] > 0) {
                Payment::create([
                    'booking_id' => $booking->id,
                    'user_id' => $booking->user_id,
                    'amount' => -$validated['refund_amount'],
                    'payment_method' => 'refund',
                    'status' => 'completed',
                    'payment_type' => 'refund',
                    'description' => 'Refund for cancelled booking',
                ]);
            }

            DB::commit();

            return redirect()->route('admin.bookings.index')
                ->with('success', 'Booking cancelled successfully.');

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to cancel booking: ' . $e->getMessage());
        }
    }

    /**
     * Get booking calculation details
     */
    public function getBookingCalculation(Request $request, Booking $booking)
    {
        // Get current pricing for the booking
        $roomIds = is_string($booking->room_ids)
            ? json_decode($booking->room_ids, true)
            : $booking->room_ids;

        $calculation = [
            'original_rent_amount' => $booking->price,
            'original_booking_fee' => $booking->booking_price,
            'current_total' => $booking->total_amount,
            'days' => $booking->number_of_days,
            'price_type' => $booking->price_type,
            'from_date' => $booking->from_date,
            'to_date' => $booking->to_date,
        ];

        if (!empty($roomIds)) {
            $room = Room::with('roomPrices')->find($roomIds[0]);
            if ($room) {
                $roomPrice = $room->roomPrices()
                    ->where('type', $booking->price_type)
                    ->first();

                if ($roomPrice) {
                    $calculation['unit_rate'] = $roomPrice->discount_price ?? $roomPrice->fixed_price;
                    $calculation['booking_price'] = $roomPrice->booking_price;
                    $calculation['calculated_rent'] = $calculation['unit_rate'] * $booking->number_of_days;
                }
            }
        }

        return response()->json($calculation);
    }
}
