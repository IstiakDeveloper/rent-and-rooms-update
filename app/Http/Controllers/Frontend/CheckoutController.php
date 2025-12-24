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
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('stripe.stripe_sk', env('STRIPE_SECRET_KEY')));
    }

    /**
     * Store checkout data in session from property show page
     */
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

        $request->session()->put('checkout_data', $validated);

        return response()->json(['success' => true]);
    }

    /**
     * Display checkout page
     */
    public function index(Request $request)
    {
        // Check authentication
        if (!Auth::check()) {
            return redirect()->route('login')->with('error', 'Please login to continue booking.');
        }

        // Check email verification
        $user = Auth::user();
        if (!$user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice')->with('error', 'Please verify your email address to continue booking.');
        }

        // Get checkout data from session
        $checkoutData = $request->session()->get('checkout_data');

        if (!$checkoutData) {
            return redirect()->route('properties.index')->with('error', 'No booking data found.');
        }

        // Load package and room data
        $package = Package::with(['photos', 'city', 'area', 'assignedPartner', 'creator'])->findOrFail($checkoutData['package_id']);
        $room = Room::with(['roomPrices'])->findOrFail($checkoutData['selected_room']);

        // Calculate dates and pricing
        $fromDate = Carbon::parse($checkoutData['from_date']);
        $toDate = Carbon::parse($checkoutData['to_date']);
        $totalNights = $fromDate->diffInDays($toDate);

        // Determine price type and get pricing breakdown
        $priceType = $this->determinePriceType($totalNights, $room);
        $priceBreakdown = $this->calculatePriceBreakdown($room, $totalNights, $fromDate);

        // Calculate totals
        $roomTotal = collect($priceBreakdown)->sum('total');
        $selectedAmenities = $checkoutData['amenities'] ?? [];
        $selectedMaintains = $checkoutData['maintains'] ?? [];
        $amenitiesTotal = collect($selectedAmenities)->sum('price');
        $maintainsTotal = collect($selectedMaintains)->sum('price');

        // Get booking price
        $roomPrice = $room->roomPrices->firstWhere('type', $priceType);
        $bookingPrice = $roomPrice ? $roomPrice->booking_price : 50.00;

        // Bank details
        $bankDetails = "Netsoftuk Solution A/C 17855008 S/C 04-06-05";

        // Load common data
        $footer = Footer::with(['footerSectionTwo', 'footerSectionThree', 'footerSectionFour.socialLinks'])->first();
        $header = Header::first();
        $countries = Country::all();

        return Inertia::render('Frontend/Checkout/Index', [
            'package' => $package,
            'room' => $room,
            'checkoutData' => [
                'package_id' => $checkoutData['package_id'],
                'from_date' => $checkoutData['from_date'],
                'to_date' => $checkoutData['to_date'],
                'name' => $checkoutData['name'],
                'email' => $checkoutData['email'],
                'phone' => $checkoutData['phone'],
                'selected_room' => $checkoutData['selected_room'],
            ],
            'totalNights' => $totalNights,
            'priceType' => $priceType,
            'priceBreakdown' => $priceBreakdown,
            'roomTotal' => $roomTotal,
            'bookingPrice' => $bookingPrice,
            'selectedAmenities' => $selectedAmenities,
            'selectedMaintains' => $selectedMaintains,
            'amenitiesTotal' => $amenitiesTotal,
            'maintainsTotal' => $maintainsTotal,
            'bankDetails' => $bankDetails,
            'footer' => $footer,
            'header' => $header,
            'countries' => $countries,
            'selectedCountry' => session('selectedCountry', 1),
        ]);
    }

    /**
     * Submit booking and process payment
     */
    public function submitBooking(Request $request)
    {
        // Check authentication
        if (!Auth::check()) {
            return response()->json(['error' => 'User must be logged in'], 401);
        }

        // Check email verification
        $user = Auth::user();
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'error' => 'Email verification required',
                'message' => 'Please verify your email address before making a booking.',
                'redirect' => route('verification.notice')
            ], 403);
        }

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

            // Validate bank transfer reference
            if ($validated['paymentMethod'] === 'bank_transfer' && empty($validated['bankTransferReference'])) {
                return response()->json(['error' => 'Bank transfer reference is required'], 400);
            }

            // Load room with prices
            $room = Room::with('roomPrices')->findOrFail($validated['selected_room']);
            $package = Package::findOrFail($validated['package_id']);

            // Calculate dates and pricing
            $fromDate = Carbon::parse($validated['from_date']);
            $toDate = Carbon::parse($validated['to_date']);
            $totalDays = $fromDate->diffInDays($toDate);

            // Get price breakdown
            $priceType = $this->determinePriceType($totalDays, $room);
            $priceBreakdown = $this->calculatePriceBreakdown($room, $totalDays, $fromDate);

            // Calculate totals
            $roomTotal = collect($priceBreakdown)->sum('total');
            $amenitiesTotal = collect($validated['amenities'] ?? [])->sum('price');
            $maintainsTotal = collect($validated['maintains'] ?? [])->sum('price');

            // Get booking price
            $roomPrice = $room->roomPrices->firstWhere('type', $priceType);
            $bookingPrice = $roomPrice ? $roomPrice->booking_price : 50.00;

            // Calculate payment amount
            $subtotal = $roomTotal + $amenitiesTotal + $maintainsTotal;
            $total = $subtotal + $bookingPrice;
            $paymentAmount = $validated['paymentOption'] === 'full' ? $total : $bookingPrice;

            // Create booking with milestone breakdown
            $booking = $this->createBooking([
                'package_id' => $validated['package_id'],
                'selected_room' => $validated['selected_room'],
                'from_date' => $validated['from_date'],
                'to_date' => $validated['to_date'],
                'totalDays' => $totalDays,
                'priceType' => $priceType,
                'price' => $roomTotal,
                'booking_price' => $bookingPrice,
                'payment_option' => $validated['paymentOption'],
                'total_amount' => $subtotal,
                'priceBreakdown' => $priceBreakdown,
                'amenitiesTotal' => $amenitiesTotal,
                'maintainsTotal' => $maintainsTotal,
            ]);

            // Create booking services
            $this->createBookingServices($booking, $validated);

            // Create milestone payments
            $this->createMilestonePayments($booking, $priceBreakdown, $bookingPrice, $fromDate);

            // Generate verification token and send email
            $booking->generateVerificationToken();
            $booking->user->notify(new \App\Notifications\BookingVerificationNotification($booking));

            DB::commit();

            // Clear session
            session()->forget('checkout_data');

            // Redirect to verification pending page
            return response()->json([
                'success' => true,
                'booking_id' => $booking->id,
                'message' => 'Booking created! Please check your email to verify this booking.',
                'redirect_url' => route('booking.verification.pending', $booking->id)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Booking submission error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Determine price type based on duration and available rates
     */
    private function determinePriceType($totalDays, $room)
    {
        $availableTypes = $room->roomPrices->pluck('type')->unique();

        // If only one type available, use that
        if ($availableTypes->count() === 1) {
            return $availableTypes->first();
        }

        // Smart selection based on duration
        if ($totalDays >= 30 && $availableTypes->contains('Month')) {
            return 'Month';
        }

        if ($totalDays >= 7 && $availableTypes->contains('Week')) {
            return 'Week';
        }

        if ($availableTypes->contains('Day')) {
            return 'Day';
        }

        // Fallback
        return $availableTypes->first();
    }

    /**
     * Calculate detailed price breakdown with milestones
     */
    private function calculatePriceBreakdown($room, $totalDays, $fromDate)
    {
        $priceType = $this->determinePriceType($totalDays, $room);
        $roomPrice = $room->roomPrices->firstWhere('type', $priceType);

        if (!$roomPrice) {
            throw new \Exception("Price not found for type: {$priceType}");
        }

        $price = $roomPrice->discount_price ?? $roomPrice->fixed_price;
        $breakdown = [];

        switch ($priceType) {
            case 'Month':
                $months = ceil($totalDays / 30);
                for ($i = 0; $i < $months; $i++) {
                    $breakdown[] = [
                        'type' => 'Month',
                        'quantity' => 1,
                        'price' => $price,
                        'total' => $price,
                        'description' => Carbon::parse($fromDate)->addMonths($i)->format('F Y')
                    ];
                }
                break;

            case 'Week':
                $weeks = ceil($totalDays / 7);
                $breakdown[] = [
                    'type' => 'Week',
                    'quantity' => $weeks,
                    'price' => $price,
                    'total' => $price * $weeks,
                    'description' => "{$weeks} " . ($weeks > 1 ? 'Weeks' : 'Week')
                ];
                break;

            case 'Day':
                $breakdown[] = [
                    'type' => 'Day',
                    'quantity' => $totalDays,
                    'price' => $price,
                    'total' => $price * $totalDays,
                    'description' => "{$totalDays} " . ($totalDays > 1 ? 'Days' : 'Day')
                ];
                break;
        }

        return $breakdown;
    }

    /**
     * Create booking record
     */
    private function createBooking($data)
    {
        return Booking::create([
            'user_id' => Auth::id(),
            'package_id' => $data['package_id'],
            'from_date' => $data['from_date'],
            'to_date' => $data['to_date'],
            'room_ids' => json_encode([$data['selected_room']]),
            'number_of_days' => $data['totalDays'],
            'price_type' => $data['priceType'],
            'price' => $data['total_amount'],
            'booking_price' => $data['booking_price'],
            'payment_option' => $data['payment_option'],
            'total_amount' => $data['total_amount'] + $data['amenitiesTotal'] + $data['maintainsTotal'],
            'payment_status' => 'pending',
            'status' => 'pending',
            'total_milestones' => count($data['priceBreakdown']),
            'milestone_amount' => $data['total_amount'] / count($data['priceBreakdown']),
            'milestone_breakdown' => json_encode($data['priceBreakdown']),
            'auto_renewal' => false,
            'renewal_period_days' => 30,
        ]);
    }

    /**
     * Create booking services (amenities and maintains)
     */
    private function createBookingServices($booking, $data)
    {
        // Create amenities
        if (!empty($data['amenities'])) {
            foreach ($data['amenities'] as $amenity) {
                BookingAmenity::create([
                    'booking_id' => $booking->id,
                    'amenity_id' => $amenity['id'],
                    'price' => $amenity['price'],
                ]);
            }
        }

        // Create maintains
        if (!empty($data['maintains'])) {
            foreach ($data['maintains'] as $maintain) {
                BookingMaintain::create([
                    'booking_id' => $booking->id,
                    'maintain_id' => $maintain['id'],
                    'price' => $maintain['price'],
                ]);
            }
        }
    }

    /**
     * Create milestone payments
     */
    private function createMilestonePayments($booking, $priceBreakdown, $bookingPrice, $startDate)
    {
        // First milestone - Booking Fee
        BookingPayment::create([
            'booking_id' => $booking->id,
            'milestone_type' => 'Booking Fee',
            'milestone_number' => 0,
            'due_date' => now(),
            'amount' => $bookingPrice,
            'payment_status' => 'pending',
            'payment_method' => null,
        ]);

        // Remaining milestones based on price breakdown
        foreach ($priceBreakdown as $index => $milestone) {
            $dueDate = match ($milestone['type']) {
                'Month' => Carbon::parse($startDate)->addMonths($index),
                'Week' => Carbon::parse($startDate)->addWeeks($index),
                'Day' => Carbon::parse($startDate)->addDays($index),
                default => Carbon::parse($startDate)
            };

            BookingPayment::create([
                'booking_id' => $booking->id,
                'milestone_type' => $milestone['type'],
                'milestone_number' => $index + 1,
                'due_date' => $dueDate,
                'amount' => $milestone['total'],
                'payment_status' => 'pending',
                'payment_method' => null,
            ]);
        }
    }

    /**
     * Create payment record for non-Stripe payments
     */
    private function createPaymentRecord($booking, $amount, $data)
    {
        // Create main payment record
        Payment::create([
            'booking_id' => $booking->id,
            'payment_method' => $data['paymentMethod'],
            'amount' => $amount,
            'status' => 'pending',
            'transaction_id' => $data['bankTransferReference'] ?? null,
            'payment_option' => $data['paymentOption'],
        ]);

        // Update booking payment milestone
        if ($data['paymentOption'] === 'booking_only') {
            // Update booking fee milestone
            BookingPayment::where('booking_id', $booking->id)
                ->where('milestone_number', 0)
                ->update([
                    'payment_status' => 'pending',
                    'payment_method' => $data['paymentMethod'],
                    'transaction_reference' => $data['bankTransferReference'] ?? null,
                ]);
        } else {
            // Update all milestones
            BookingPayment::where('booking_id', $booking->id)
                ->update([
                    'payment_status' => 'pending',
                    'payment_method' => $data['paymentMethod'],
                    'transaction_reference' => $data['bankTransferReference'] ?? null,
                ]);
        }
    }

    /**
     * Handle Stripe payment
     */
    private function handleStripePayment($booking, $amount, $package, $paymentOption)
    {
        $description = $paymentOption === 'booking_only'
            ? "Booking Fee for {$package->name}"
            : "Full Payment for {$package->name}";

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'gbp',
                    'product_data' => [
                        'name' => $description,
                        'description' => "Booking from {$booking->from_date} to {$booking->to_date}",
                    ],
                    'unit_amount' => (int) ($amount * 100),
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => route('stripe.success', ['booking' => $booking->id]) . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('stripe.cancel', ['booking' => $booking->id]),
            'metadata' => [
                'booking_id' => $booking->id,
                'payment_option' => $paymentOption,
            ]
        ]);

        // Create payment record
        Payment::create([
            'booking_id' => $booking->id,
            'payment_method' => 'card',
            'amount' => $amount,
            'status' => 'pending',
            'transaction_id' => $session->id,
            'payment_option' => $paymentOption,
        ]);

        return $session->url;
    }

    /**
     * Booking complete page (for non-Stripe payments)
     */
    public function bookingComplete($bookingId)
    {
        // Check if user is authenticated and verified
        if (!Auth::check() || !Auth::user()->hasVerifiedEmail()) {
            return redirect()->route('verification.notice')->with('error', 'Please verify your email address.');
        }

        $booking = Booking::with(['package', 'user', 'bookingPayments'])->findOrFail($bookingId);

        // Ensure user owns this booking
        if ($booking->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to booking.');
        }

        return Inertia::render('Frontend/Checkout/Complete', [
            'booking' => $booking,
            'room' => $booking->room, // Access the room accessor
            'footer' => Footer::with(['footerSectionTwo', 'footerSectionThree', 'footerSectionFour.socialLinks'])->first(),
            'header' => Header::first(),
            'countries' => Country::all(),
            'selectedCountry' => session('selectedCountry', 1),
        ]);
    }

    /**
     * Stripe success callback
     */
    public function stripeSuccess($bookingId, Request $request)
    {
        // Check if user is authenticated and verified
        if (!Auth::check() || !Auth::user()->hasVerifiedEmail()) {
            return redirect()->route('verification.notice')->with('error', 'Please verify your email address.');
        }

        $booking = Booking::with(['package', 'user'])->findOrFail($bookingId);

        // Ensure user owns this booking
        if ($booking->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to booking.');
        }

        // Update booking payment status
        $booking->update(['payment_status' => 'paid', 'status' => 'confirmed']);

        // Update milestone payments
        BookingPayment::where('booking_id', $booking->id)
            ->where('milestone_number', 0)
            ->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
                'payment_method' => 'card'
            ]);

        // Clear session
        session()->forget('checkout_data');

        return Inertia::render('Frontend/Checkout/Success', [
            'booking' => $booking,
            'room' => $booking->room, // Access the room accessor
            'footer' => Footer::with(['footerSectionTwo', 'footerSectionThree', 'footerSectionFour.socialLinks'])->first(),
            'header' => Header::first(),
            'countries' => Country::all(),
            'selectedCountry' => session('selectedCountry', 1),
        ]);
    }

    /**
     * Stripe cancel callback
     */
    public function stripeCancel($bookingId)
    {
        // Check if user is authenticated and verified
        if (!Auth::check() || !Auth::user()->hasVerifiedEmail()) {
            return redirect()->route('verification.notice')->with('error', 'Please verify your email address.');
        }

        $booking = Booking::with('package')->findOrFail($bookingId);

        // Ensure user owns this booking
        if ($booking->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to booking.');
        }

        // Optionally delete or mark booking as cancelled
        $booking->update(['status' => 'cancelled']);

        return redirect()->route('properties.index')->with('error', 'Payment was cancelled.');
    }

    /**
     * Show verification pending page
     */
    public function verificationPending($bookingId)
    {
        $booking = Booking::with(['package', 'user'])->findOrFail($bookingId);

        // Ensure user owns this booking
        if ($booking->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to booking.');
        }

        return Inertia::render('Frontend/Booking/VerificationPending', [
            'booking' => $booking,
            'footer' => Footer::with(['footerSectionTwo', 'footerSectionThree', 'footerSectionFour.socialLinks'])->first(),
            'header' => Header::first(),
            'countries' => Country::all(),
            'selectedCountry' => session('selectedCountry', 1),
        ]);
    }

    /**
     * Verify booking with token
     */
    public function verifyBooking($bookingId, $token, Request $request)
    {
        $booking = Booking::findOrFail($bookingId);

        // Verify ownership
        if ($booking->user_id !== Auth::id()) {
            abort(403, 'Unauthorized access to booking.');
        }

        // Check if already verified
        if ($booking->isVerified()) {
            return redirect()->route('booking.complete', $booking->id)
                ->with('message', 'This booking has already been verified.');
        }

        // Verify token
        if ($booking->booking_verification_token !== $token) {
            return redirect()->route('booking.verification.pending', $booking->id)
                ->with('error', 'Invalid verification token.');
        }

        // Mark as verified
        $booking->markAsVerified();

        // Process payment based on saved payment details
        $payment = Payment::where('booking_id', $booking->id)->first();

        if ($payment && $payment->status === 'pending') {
            // Update booking to confirmed if it was bank transfer
            if ($payment->payment_method === 'bank_transfer') {
                $booking->update(['status' => 'pending']); // Pending admin approval
            }
        }

        return redirect()->route('booking.complete', $booking->id)
            ->with('success', 'Booking verified successfully! Your booking is now being processed.');
    }

    /**
     * Resend booking verification email
     */
    public function resendVerification($bookingId)
    {
        $booking = Booking::findOrFail($bookingId);

        // Verify ownership
        if ($booking->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if already verified
        if ($booking->isVerified()) {
            return response()->json(['error' => 'Booking already verified'], 400);
        }

        // Generate new token and send email
        $booking->generateVerificationToken();
        $booking->user->notify(new \App\Notifications\BookingVerificationNotification($booking));

        return response()->json([
            'success' => true,
            'message' => 'Verification email has been resent!'
        ]);
    }

}

