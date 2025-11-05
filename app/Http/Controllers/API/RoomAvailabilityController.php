<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class RoomAvailabilityController extends Controller
{
    /**
     * Get booked dates for a specific room
     */
    public function getBookedDates($roomId): JsonResponse
    {
        try {
            // Validate room exists
            $room = Room::findOrFail($roomId);

            // Get all bookings for this room that are active/confirmed
            $bookedDates = Booking::where(function ($query) use ($roomId) {
                    // Check if room_ids JSON contains this room ID
                    $query->whereJsonContains('room_ids', (int)$roomId);
                })
                ->whereNotIn('payment_status', ['cancelled', 'refunded', 'failed'])
                ->where('to_date', '>=', Carbon::now()->toDateString()) // Only future/current bookings
                ->get()
                ->flatMap(function ($booking) {
                    $bookedDates = [];
                    $from = Carbon::parse($booking->from_date);
                    $to = Carbon::parse($booking->to_date);

                    // Include all dates in the booking range
                    while ($from->lte($to)) {
                        $bookedDates[] = $from->format('Y-m-d');
                        $from->addDay();
                    }
                    return $bookedDates;
                })
                ->unique()
                ->sort()
                ->values()
                ->toArray();

            return response()->json([
                'success' => true,
                'roomId' => $roomId,
                'bookedDates' => $bookedDates,
                'count' => count($bookedDates),
                'message' => count($bookedDates) . ' booked dates found for room ' . $roomId
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching booked dates for room ' . $roomId . ': ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error fetching availability data',
                'bookedDates' => []
            ], 500);
        }
    }

    /**
     * Check if a room is available for specific date range
     */
    public function checkAvailability(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'roomId' => 'required|exists:rooms,id',
                'fromDate' => 'required|date|after_or_equal:today',
                'toDate' => 'required|date|after:fromDate',
                'packageId' => 'required|exists:packages,id'
            ]);

            $roomId = (int)$request->roomId;
            $fromDate = Carbon::parse($request->fromDate);
            $toDate = Carbon::parse($request->toDate);

            // Check for conflicting bookings using proper JSON queries
            $conflictingBookings = Booking::where('package_id', $request->packageId)
                ->whereJsonContains('room_ids', $roomId)
                ->whereNotIn('payment_status', ['cancelled', 'refunded', 'failed'])
                ->where(function ($query) use ($fromDate, $toDate) {
                    $query->whereBetween('from_date', [$fromDate->toDateString(), $toDate->toDateString()])
                        ->orWhereBetween('to_date', [$fromDate->toDateString(), $toDate->toDateString()])
                        ->orWhere(function ($subQuery) use ($fromDate, $toDate) {
                            $subQuery->where('from_date', '<=', $fromDate->toDateString())
                                ->where('to_date', '>=', $toDate->toDateString());
                        });
                })
                ->get();

            $isAvailable = $conflictingBookings->isEmpty();

            // Get detailed conflict information if not available
            $conflictDetails = [];
            if (!$isAvailable) {
                $conflictDetails = $conflictingBookings->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'from' => $booking->from_date,
                        'to' => $booking->to_date,
                        'status' => $booking->payment_status,
                        'user' => $booking->user->name ?? 'Unknown'
                    ];
                })->toArray();
            }

            return response()->json([
                'success' => true,
                'available' => $isAvailable,
                'roomId' => $roomId,
                'requestedDates' => [
                    'from' => $fromDate->toDateString(),
                    'to' => $toDate->toDateString(),
                    'nights' => $fromDate->diffInDays($toDate)
                ],
                'conflicts' => $conflictDetails,
                'conflictCount' => count($conflictDetails),
                'message' => $isAvailable
                    ? 'Room is available for the selected dates'
                    : 'Room has ' . count($conflictDetails) . ' conflicting booking(s)'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error checking room availability: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error checking availability',
                'available' => false
            ], 500);
        }
    }

    /**
     * Get availability calendar for a room (30 days ahead)
     */
    public function getAvailabilityCalendar($roomId): JsonResponse
    {
        try {
            $room = Room::findOrFail($roomId);

            $startDate = Carbon::now();
            $endDate = Carbon::now()->addDays(60); // Next 60 days

            $calendar = [];
            $currentDate = $startDate->copy();

            // Get all booked dates in the range using proper JSON query
            $bookedDates = Booking::whereJsonContains('room_ids', (int)$roomId)
                ->whereNotIn('payment_status', ['cancelled', 'refunded', 'failed'])
                ->where('from_date', '<=', $endDate->toDateString())
                ->where('to_date', '>=', $startDate->toDateString())
                ->get()
                ->flatMap(function ($booking) {
                    $dates = [];
                    $from = Carbon::parse($booking->from_date);
                    $to = Carbon::parse($booking->to_date);

                    while ($from->lte($to)) {
                        $dates[] = $from->format('Y-m-d');
                        $from->addDay();
                    }
                    return $dates;
                })
                ->unique()
                ->flip();

            // Build calendar
            while ($currentDate->lte($endDate)) {
                $dateStr = $currentDate->format('Y-m-d');
                $isBooked = isset($bookedDates[$dateStr]);

                $calendar[] = [
                    'date' => $dateStr,
                    'day' => $currentDate->format('j'),
                    'dayName' => $currentDate->format('D'),
                    'month' => $currentDate->format('M'),
                    'year' => $currentDate->format('Y'),
                    'available' => !$isBooked,
                    'isToday' => $currentDate->isToday(),
                    'isPast' => $currentDate->isPast()
                ];

                $currentDate->addDay();
            }

            return response()->json([
                'success' => true,
                'roomId' => $roomId,
                'calendar' => $calendar,
                'period' => [
                    'from' => $startDate->toDateString(),
                    'to' => $endDate->toDateString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error generating availability calendar: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error generating calendar'
            ], 500);
        }
    }
}
