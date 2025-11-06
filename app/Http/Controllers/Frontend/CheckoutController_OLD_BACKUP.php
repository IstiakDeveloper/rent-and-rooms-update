<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\BookingAmenity;
use App\Models\BookingMaintain;
use App\Models\Package;
use App\Models\Room;
use App\Models\Footer;
use App\Models\Header;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Carbon\Carbon;

class CheckoutController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
    }



    public function storeCheckoutData(Request $request)
    {
        $validated = $request->validate([
            'package_id' => 'required|integer|exists:packages,id',
            'selected_room' => 'required|integer|exists:rooms,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'amenities' => 'nullable|array',
            'maintains' => 'nullable|array',
        ]);

        $request->session()->put('checkout', $validated);

        // Return success for fetch API
        return response()->json(['success' => true]);
    }


    private function createBooking($data)
    {
        // Check if user is authenticated
        if (!auth()->check()) {
            throw new \Exception('User must be logged in to make a booking');
        }

        $room = Room::with('roomPrices')->findOrFail($data['selected_room']);
        $days = Carbon::parse($data['from_date'])->diffInDays(Carbon::parse($data['to_date']));
        $type = $this->determinePriceType($days);

        // Use smart price selection
        $priceData = $this->getSmartRoomPrice($room, $type);

        $totalAmount = $this->calculateTotalAmount($priceData, $days, $type);
        $amenitiesTotal = collect($data['amenities'] ?? [])->sum('price');
        $maintainsTotal = collect($data['maintains'] ?? [])->sum('price');

        return Booking::create([
            'user_id' => auth()->id(), // ✅ Authenticated user ID
            'package_id' => $data['package_id'],
            'from_date' => $data['from_date'],
            'to_date' => $data['to_date'],
            'number_of_days' => $days, // ✅ Added missing field
            'price_type' => $type, // ✅ Added missing field
            'price' => $priceData->discount_price ?? $priceData->fixed_price, // ✅ Added missing field
            'payment_option' => $data['paymentOption'] ?? 'full', // ✅ Added missing field
            'status' => 'pending',
            'total_amount' => $totalAmount + $amenitiesTotal + $maintainsTotal,
            'booking_price' => $priceData->booking_price ?? 0,
            'payment_status' => 'pending',
        ]);
    }

    public function index(Request $request)
    {
        $checkoutData = $request->session()->get('checkout');

        if (!$checkoutData) {
            return redirect()->route('properties.index')->with('error', 'No booking data found.');
        }

        $package = Package::with(['photos', 'city', 'area'])->findOrFail($checkoutData['package_id']);
        $room = Room::with(['roomPrices'])->findOrFail($checkoutData['selected_room']);

        $fromDate = Carbon::parse($checkoutData['from_date']);
        $toDate = Carbon::parse($checkoutData['to_date']);
        $totalNights = $fromDate->diffInDays($toDate);

        $priceType = $this->determinePriceType($totalNights);

        // Use smart price selection
        $priceData = $this->getSmartRoomPrice($room, $priceType);

        if (!$priceData) {
            return redirect()->back()->with('error', 'Room pricing not available.');
        }

        $totalAmount = $this->calculateTotalAmount($priceData, $totalNights, $priceType);
        $bookingPrice = $priceData->booking_price ?? 0;

        $selectedAmenities = $checkoutData['amenities'] ?? [];
        $selectedMaintains = $checkoutData['maintains'] ?? [];

        $amenitiesTotal = collect($selectedAmenities)->sum('price');
        $maintainsTotal = collect($selectedMaintains)->sum('price');

        $priceBreakdown = $this->createPriceBreakdown($priceData, $totalNights, $priceType);

        $footer = Footer::with(['footerSectionTwo', 'footerSectionThree', 'footerSectionFour.socialLinks'])->first();
        $header = Header::first();
        $countries = Country::all();

        return Inertia::render('Frontend/Checkout/Index', [
            'package' => $package,
            'selectedRoom' => $room,
            'checkoutData' => [
                'packageId' => $checkoutData['package_id'],
                'fromDate' => $checkoutData['from_date'],
                'toDate' => $checkoutData['to_date'],
                'name' => $checkoutData['name'],
                'email' => $checkoutData['email'],
                'phone' => $checkoutData['phone'],
                'selectedRoom' => $checkoutData['selected_room'],
            ],
            'totalNights' => $totalNights,
            'priceBreakdown' => $priceBreakdown,
            'totalAmount' => $totalAmount,
            'bookingPrice' => $bookingPrice,
            'selectedAmenities' => $selectedAmenities,
            'selectedMaintains' => $selectedMaintains,
            'amenitiesTotal' => $amenitiesTotal,
            'maintainsTotal' => $maintainsTotal,
            'bankDetails' => 'Account: 12345678, Sort: 12-34-56, Ref: RENT{booking_id}',
            'footer' => $footer,
            'header' => $header,
            'countries' => $countries,
            'selectedCountry' => session('selectedCountry', 1),
        ]);
    }

    public function submitBooking(Request $request)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'package_id' => 'required|integer|exists:packages,id',
                'selected_room' => 'required|integer|exists:rooms,id',
                'from_date' => 'required|date',
                'to_date' => 'required|date|after:from_date',
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:20',
                'amenities' => 'nullable|array',
                'maintains' => 'nullable|array',
                'paymentMethod' => 'required|in:card,bank_transfer',
                'paymentOption' => 'required|in:full,booking_only',
                'bankTransferReference' => 'nullable|string',
            ]);

            if ($validated['paymentMethod'] === 'bank_transfer' && empty($validated['bankTransferReference'])) {
                return response()->json(['error' => 'Bank transfer reference required'], 400);
            }

            $booking = $this->createBooking($validated);
            $room = Room::with('roomPrices')->findOrFail($validated['selected_room']);
            $totalDays = Carbon::parse($validated['from_date'])->diffInDays(Carbon::parse($validated['to_date']));

            $this->createBookingRoomPrices($booking, $room, $this->determinePriceType($totalDays));
            $this->createBookingServices($booking, $validated);

            $paymentAmount = $validated['paymentOption'] === 'full'
                ? ($booking->total_amount + $booking->booking_price)
                : $booking->booking_price;

            if ($validated['paymentMethod'] === 'card') {
                $stripeUrl = $this->handleStripePayment($booking, $paymentAmount, $booking->package);
                DB::commit();
                return response()->json(['success' => true, 'stripe_url' => $stripeUrl]);
            } else {
                $this->createPayment($booking, $paymentAmount, $request);
                DB::commit();
                return response()->json(['success' => true, 'booking_id' => $booking->id]);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function determinePriceType($days)
    {
        if ($days >= 30) return 'Month';
        if ($days >= 7) return 'Week';
        return 'Day';
    }

    private function calculateTotalAmount($priceData, $nights, $type)
    {
        $price = $priceData->discount_price ?? $priceData->fixed_price;
        if ($type === 'Month') return $price * ceil($nights / 30);
        if ($type === 'Week') return $price * ceil($nights / 7);
        return $price * $nights;
    }

    // Smart method to get best available price based on room prices
    private function getSmartRoomPrice($room, $type)
    {
        $prices = $room->roomPrices;

        // Try to find exact match first
        $exactPrice = $prices->where('type', $type)->first();
        if ($exactPrice) {
            return $exactPrice;
        }

        // Fallback logic based on requested type
        if ($type === 'Day') {
            // For Day: Week -> Month
            return $prices->where('type', 'Week')->first()
                ?? $prices->where('type', 'Month')->first()
                ?? $prices->first();
        } elseif ($type === 'Week') {
            // For Week: Day -> Month
            return $prices->where('type', 'Day')->first()
                ?? $prices->where('type', 'Month')->first()
                ?? $prices->first();
        } else { // Month
            // For Month: Week -> Day
            return $prices->where('type', 'Week')->first()
                ?? $prices->where('type', 'Day')->first()
                ?? $prices->first();
        }
    }

    private function createPriceBreakdown($priceData, $nights, $type)
    {
        $price = $priceData->discount_price ?? $priceData->fixed_price;
        $qty = $type === 'Month' ? ceil($nights / 30) : ($type === 'Week' ? ceil($nights / 7) : $nights);

        return [[
            'type' => $type,
            'quantity' => $qty,
            'price' => $price,
            'total' => $price * $qty,
            'description' => $qty . ' ' . ($qty > 1 ? $type . 's' : $type)
        ]];
    }

    private function createBookingRoomPrices($booking, $room, $type)
    {
        // Use smart price selection
        $priceData = $this->getSmartRoomPrice($room, $type);
        if ($priceData) {
            DB::table('booking_room_prices')->insert([
                'booking_id' => $booking->id,
                'room_price_id' => $priceData->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function createBookingServices($booking, $data)
    {
        foreach ($data['amenities'] ?? [] as $amenity) {
            BookingAmenity::create(['booking_id' => $booking->id, 'amenity_id' => $amenity['id'], 'price' => $amenity['price']]);
        }
        foreach ($data['maintains'] ?? [] as $maintain) {
            BookingMaintain::create(['booking_id' => $booking->id, 'maintain_id' => $maintain['id'], 'price' => $maintain['price']]);
        }
    }

    private function createPayment($booking, $amount, $request)
    {
        return BookingPayment::create([
            'booking_id' => $booking->id,
            'amount' => $amount,
            'payment_method' => $request->input('paymentMethod'),
            'payment_status' => 'pending',
            'reference_number' => $request->input('bankTransferReference'),
            'payment_date' => now(),
        ]);
    }

    private function handleStripePayment($booking, $amount, $package)
    {
        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'gbp',
                    'product_data' => ['name' => "Booking: {$package->name}"],
                    'unit_amount' => $amount * 100,
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => route('checkout.success', $booking->id),
            'cancel_url' => route('checkout.cancel', $booking->id),
            'metadata' => ['booking_id' => $booking->id],
        ]);

        BookingPayment::create([
            'booking_id' => $booking->id,
            'amount' => $amount,
            'payment_method' => 'card',
            'payment_status' => 'pending',
            'stripe_session_id' => $session->id,
            'payment_date' => now(),
        ]);

        return $session->url;
    }

    public function success($bookingId)
    {
        $booking = Booking::with(['package', 'room'])->findOrFail($bookingId);
        return Inertia::render('Frontend/Checkout/Success', [
            'booking' => $booking,
            'footer' => Footer::with(['footerSectionTwo', 'footerSectionThree', 'footerSectionFour.socialLinks'])->first(),
            'header' => Header::first(),
            'countries' => Country::all(),
            'selectedCountry' => session('selectedCountry', 1),
        ]);
    }

    public function cancel($bookingId)
    {
        $booking = Booking::findOrFail($bookingId);
        $package = $booking->package;
        $partnerSlug = $package->assignedPartner ? strtolower(str_replace(' ', '-', $package->assignedPartner->name)) : 'unknown';
        $packageSlug = $package->id . '-' . strtolower(str_replace(' ', '-', $package->name));

        return redirect()->route('properties.show', ['partnerSlug' => $partnerSlug, 'packageSlug' => $packageSlug])
            ->with('error', 'Payment cancelled.');
    }
}
