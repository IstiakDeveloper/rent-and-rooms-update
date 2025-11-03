<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Room;
use App\Models\BookingPayment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminBookingEditController extends Controller
{
    public function edit(Booking $booking)
    {
        $booking->load([
            'user',
            'package' => function($query) {
                $query->with(['rooms.roomPrices', 'country', 'city', 'area']);
            },
            'bookingPayments'
        ]);

        // Get original room from room_ids
        $roomIds = is_string($booking->room_ids)
            ? json_decode($booking->room_ids, true)
            : $booking->room_ids;

        $selectedRoom = null;
        if (!empty($roomIds)) {
            $selectedRoom = Room::with('roomPrices')->find($roomIds[0]);
        }

        return Inertia::render('Admin/AdminBooking/Edit', [
            'booking' => $booking,
            'selectedRoom' => $selectedRoom,
        ]);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'to_date' => 'nullable|date|after:from_date',
            'custom_booking_fee' => 'nullable|numeric|min:0',
            'custom_rent_amount' => 'nullable|numeric|min:0',
            'use_custom_booking_fee' => 'boolean',
            'use_custom_rent_amount' => 'boolean',
            'payment_status' => 'string|in:pending,completed,failed',
            'status' => 'string|in:pending,confirmed,cancelled,completed',
        ]);

        DB::beginTransaction();

        try {
            $updateData = [
                'payment_status' => $validated['payment_status'],
                'status' => $validated['status'],
            ];

            // Handle date extension
            if ($validated['to_date'] && $validated['to_date'] !== Carbon::parse($booking->to_date)->format('Y-m-d')) {
                $fromDate = Carbon::parse($booking->from_date);
                $newToDate = Carbon::parse($validated['to_date']);
                $numberOfDays = $fromDate->diffInDays($newToDate);

                $updateData['to_date'] = $validated['to_date'];
                $updateData['number_of_days'] = $numberOfDays;

                // Recalculate amounts if extending
                if ($newToDate->gt(Carbon::parse($booking->to_date))) {
                    $extraDays = Carbon::parse($booking->to_date)->diffInDays($newToDate);

                    // Get room price for calculation
                    $roomIds = is_string($booking->room_ids)
                        ? json_decode($booking->room_ids, true)
                        : $booking->room_ids;

                    if (!empty($roomIds)) {
                        $room = Room::with('roomPrices')->find($roomIds[0]);
                        if ($room) {
                            $roomPrice = $room->roomPrices()
                                ->where('price_type', $booking->price_type)
                                ->first();

                            if ($roomPrice) {
                                $extraAmount = $roomPrice->price * $extraDays;
                                $updateData['price'] = $booking->price + $extraAmount;
                                $updateData['total_amount'] = $booking->total_amount + $extraAmount;
                            }
                        }
                    }
                }
            }

            // Handle custom fees
            if ($validated['use_custom_booking_fee'] && isset($validated['custom_booking_fee'])) {
                $updateData['booking_price'] = $validated['custom_booking_fee'];
                $updateData['total_amount'] = $booking->price + $validated['custom_booking_fee'];
            }

            if ($validated['use_custom_rent_amount'] && isset($validated['custom_rent_amount'])) {
                $updateData['price'] = $validated['custom_rent_amount'];
                $updateData['total_amount'] = $validated['custom_rent_amount'] + $booking->booking_price;
            }

            $booking->update($updateData);

            DB::commit();

            return redirect()->route('admin.bookings.show', $booking)
                ->with('success', 'Booking updated successfully.');

        } catch (\Exception $e) {
            DB::rollback();

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update booking: ' . $e->getMessage());
        }
    }

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
                        ->where('price_type', $booking->price_type)
                        ->first();

                    if ($roomPrice) {
                        $extraAmount = $roomPrice->price * $extraDays;
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
            DB::rollback();

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to extend booking: ' . $e->getMessage());
        }
    }

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
                'cancellation_reason' => $validated['cancellation_reason'],
                'cancelled_at' => now(),
            ]);

            // Process refund if specified
            if (!empty($validated['refund_amount']) && $validated['refund_amount'] > 0) {
                Payment::create([
                    'booking_id' => $booking->id,
                    'user_id' => $booking->user_id,
                    'amount' => -$validated['refund_amount'], // Negative for refund
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
            DB::rollback();

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to cancel booking: ' . $e->getMessage());
        }
    }

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
        ];

        if (!empty($roomIds)) {
            $room = Room::with('roomPrices')->find($roomIds[0]);
            if ($room) {
                $roomPrice = $room->roomPrices()
                    ->where('price_type', $booking->price_type)
                    ->first();

                if ($roomPrice) {
                    $calculation['daily_rate'] = $roomPrice->price;
                    $calculation['calculated_rent'] = $roomPrice->price * $booking->number_of_days;
                }
            }
        }

        return response()->json($calculation);
    }
}
