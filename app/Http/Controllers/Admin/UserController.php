<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AgreementDetail;
use App\Models\BankDetail;
use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\Package;
use App\Models\Payment;
use App\Models\PaymentLink;
use App\Models\User;
use App\Models\UserDetail;
use App\Models\UserDocument;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Carbon\Carbon;
use SendGrid\Mail\Mail as SendGridMail;
use SendGrid;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with([
            'roles',
            'userDetail',
            'bankDetail',
            'agreementDetail',
            'documents',
            'bookings.package'
        ]);

        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->get('search');
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('email', 'like', '%' . $searchTerm . '%');
            });
        }

        // Stay status filter
        if ($request->filled('stay_status')) {
            $stayStatus = $request->get('stay_status');
            $query->whereHas('userDetail', function ($q) use ($stayStatus) {
                if ($stayStatus === 'staying') {
                    $q->where('stay_status', 'staying');
                } elseif ($stayStatus === 'want_to') {
                    $q->where('stay_status', 'want_to');
                }
            });
        }

        $users = $query->paginate(15);
        $roles = \Spatie\Permission\Models\Role::all();

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => [
                'search' => $request->get('search'),
                'stay_status' => $request->get('stay_status'),
            ],
        ]);
    }    public function show(User $user)
    {
        $user->load([
            'roles',
            'userDetail',
            'bankDetail',
            'agreementDetail',
            'documents',
        ]);

        // Load packages assigned to this user (matching Livewire logic)
        $packages = Package::with(['creator', 'assignedPartner', 'assignedBy', 'country', 'city', 'area', 'property', 'documents'])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('assigned_to', $user->id);
            })
            ->get();

        // Load payments with booking relationship (matching Livewire structure)
        $payments = Payment::whereHas('booking', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with('booking')
        ->latest()
        ->get();

        $paymentLinks = PaymentLink::where('user_id', $user->id)
            ->with('bookingPayment')
            ->latest()
            ->get();

        // Load bookings with all necessary relationships (matching Livewire structure)
        $bookings = Booking::where('user_id', $user->id)
            ->with([
                'package',
                'bookingPayments' => function($query) {
                    $query->orderBy('due_date', 'asc');
                },
                'payments',
            ])
            ->latest()
            ->get()
            ->map(function($booking) {
                // Calculate payment summary (matching Livewire logic)
                $totalPrice = (float) $booking->price + (float) $booking->booking_price;
                $totalPaid = $booking->payments->where('status', 'Paid')->sum('amount');
                $remainingBalance = $totalPrice - $totalPaid;
                $paymentPercentage = $totalPrice > 0 ? ($totalPaid / $totalPrice * 100) : 0;

                // Convert to array first
                $bookingArray = $booking->toArray();

                // Add payment summary
                $bookingArray['payment_summary'] = [
                    'total_price' => $totalPrice,
                    'total_paid' => $totalPaid,
                    'remaining_balance' => $remainingBalance,
                    'payment_percentage' => $paymentPercentage
                ];

                return $bookingArray;
            });

        return Inertia::render('Admin/User/Show', [
            'user' => $user,
            'packages' => $packages,
            'payments' => $payments,
            'paymentLinks' => $paymentLinks,
            'bookings' => $bookings,
            'documents' => $user->documents ?? [],
            'bankDetails' => $user->bankDetail ?? null,
            'agreementDetails' => $user->agreementDetail ?? null,
        ]);
    }

    public function updateProofDocuments(Request $request, User $user)
    {
        $validated = $request->validate([
            'proof_type_1' => 'nullable|string',
            'proof_path_1' => 'nullable|file|max:10240',
            'proof_type_2' => 'nullable|string',
            'proof_path_2' => 'nullable|file|max:10240',
            'proof_type_3' => 'nullable|string',
            'proof_path_3' => 'nullable|file|max:10240',
            'proof_type_4' => 'nullable|string',
            'proof_path_4' => 'nullable|file|max:10240',
        ]);

        $updateData = [];

        for ($i = 1; $i <= 4; $i++) {
            if ($request->has("proof_type_{$i}")) {
                $updateData["proof_type_{$i}"] = $validated["proof_type_{$i}"];
            }

            if ($request->hasFile("proof_path_{$i}")) {
                // Delete old file if exists
                if ($user->{"proof_path_{$i}"}) {
                    Storage::delete($user->{"proof_path_{$i}"});
                }

                $path = $request->file("proof_path_{$i}")->store('proof_documents', 'public');
                $updateData["proof_path_{$i}"] = $path;
            }
        }

        $user->update($updateData);

        return redirect()->back()->with('success', 'Proof documents updated successfully.');
    }

    public function updateBankDetails(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_code' => 'required|string|max:20',
            'account' => 'required|string|max:30',
        ]);

        $user->bankDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return redirect()->back()->with('success', 'Bank details updated successfully.');
    }

    public function updateAgreementDetails(Request $request, User $user)
    {
        $validated = $request->validate([
            'agreement_type' => 'required|string',
            'duration' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'deposit' => 'required|numeric|min:0',
        ]);

        $user->agreementDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return redirect()->back()->with('success', 'Agreement details updated successfully.');
    }

    public function updateUserDetails(Request $request, User $user)
    {
        $validated = $request->validate([
            'phone' => 'nullable|string|max:20',
            'occupied_address' => 'nullable|string',
            'package' => 'nullable|string',
            'booking_type' => 'nullable|string',
            'duration_type' => 'nullable|string',
            'payment_status' => 'required|string',
            'package_price' => 'nullable|numeric|min:0',
            'security_amount' => 'nullable|numeric|min:0',
            'entry_date' => 'nullable|date',
            'stay_status' => 'required|string',
            'package_id' => 'nullable|exists:packages,id',
        ]);

        $user->userDetail()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return redirect()->back()->with('success', 'User details updated successfully.');
    }

    public function storeDocument(Request $request, User $user)
    {
        $validated = $request->validate([
            'person_name' => 'required|string|max:255',
            'passport' => 'nullable|file|max:10240',
            'nid_or_other' => 'nullable|file|max:10240',
            'payslip' => 'nullable|file|max:10240',
            'student_card' => 'nullable|file|max:10240',
        ]);

        $documentData = [
            'user_id' => $user->id,
            'person_name' => $validated['person_name'],
        ];

        $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                $path = $request->file($field)->store('user_documents', 'public');
                $documentData[$field] = $path;
            }
        }

        UserDocument::create($documentData);

        return redirect()->back()->with('success', 'Document added successfully.');
    }

    public function updateDocument(Request $request, User $user, UserDocument $document)
    {
        $validated = $request->validate([
            'person_name' => 'required|string|max:255',
            'passport' => 'nullable|file|max:10240',
            'nid_or_other' => 'nullable|file|max:10240',
            'payslip' => 'nullable|file|max:10240',
            'student_card' => 'nullable|file|max:10240',
        ]);

        $updateData = [
            'person_name' => $validated['person_name'],
        ];

        $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                // Delete old file if exists
                if ($document->$field) {
                    Storage::delete($document->$field);
                }

                $path = $request->file($field)->store('user_documents', 'public');
                $updateData[$field] = $path;
            }
        }

        $document->update($updateData);

        return redirect()->back()->with('success', 'Document updated successfully.');
    }

    public function destroyDocument(User $user, UserDocument $document)
    {
        // Delete associated files
        $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];

        foreach ($fileFields as $field) {
            if ($document->$field) {
                Storage::delete($document->$field);
            }
        }

        $document->delete();

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }

    public function storePayment(Request $request, User $user)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'duration_type' => 'required|string',
            'payment_status' => 'required|string',
            'booking_id' => 'required|exists:bookings,id',
        ]);

        // Verify the booking belongs to this user
        $booking = Booking::where('id', $validated['booking_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        Payment::create([
            'booking_id' => $validated['booking_id'],
            'amount' => $validated['amount'],
            'payment_method' => 'manual',
            'payment_type' => $validated['duration_type'],
            'status' => $validated['payment_status'],
            'transaction_id' => 'manual-' . time(),
        ]);

        return redirect()->back()->with('success', 'Payment added successfully.');
    }

    public function updatePayment(Request $request, User $user, Payment $payment)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'duration_type' => 'required|string',
            'payment_status' => 'required|string',
        ]);

        // Verify the payment belongs to this user through booking
        if (!$payment->booking || $payment->booking->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $payment->update([
            'amount' => $validated['amount'],
            'payment_type' => $validated['duration_type'],
            'status' => $validated['payment_status'],
        ]);

        return redirect()->back()->with('success', 'Payment updated successfully.');
    }

    public function destroyPayment(User $user, Payment $payment)
    {
        // Verify the payment belongs to this user through booking
        if (!$payment->booking || $payment->booking->user_id !== $user->id) {
            abort(403, 'Unauthorized');
        }

        $payment->delete();

        return redirect()->back()->with('success', 'Payment deleted successfully.');
    }

    public function generatePaymentLink(Request $request, User $user)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'milestone_amount' => 'required|numeric|min:0',
        ]);

        $booking = Booking::findOrFail($validated['booking_id']);

        // Create booking payment
        $bookingPayment = BookingPayment::create([
            'booking_id' => $booking->id,
            'amount' => $validated['milestone_amount'],
            'payment_date' => now(),
            'due_date' => now()->addDays(7), // 7 days to pay
            'status' => 'pending',
        ]);

        // Create payment link
        $paymentLink = PaymentLink::create([
            'user_id' => $user->id,
            'booking_payment_id' => $bookingPayment->id,
            'amount' => $validated['milestone_amount'],
            'link' => 'payment-link-' . uniqid(),
            'status' => 'active',
            'expires_at' => now()->addDays(7),
        ]);

        return redirect()->back()->with('success', 'Payment link generated successfully.');
    }

    public function generateMilestonePaymentLink(Request $request, User $user, BookingPayment $milestone)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        // Verify the milestone belongs to a booking of this user
        $booking = $milestone->booking()->with('user')->first();
        if (!$booking || $booking->user_id !== $user->id) {
            return redirect()->back()->with('error', 'Invalid milestone for this user.');
        }

        // Check if payment link already exists for this milestone
        $existingLink = PaymentLink::where('booking_payment_id', $milestone->id)
            ->where('status', 'active')
            ->first();

        if ($existingLink) {
            // Revoke old link and create new one
            $existingLink->update(['status' => 'revoked']);
        }

        // Create payment link
        $paymentLink = PaymentLink::create([
            'user_id' => $user->id,
            'booking_payment_id' => $milestone->id,
            'amount' => $validated['amount'],
            'link' => 'payment-link-' . uniqid(),
            'status' => 'active',
            'expires_at' => now()->addDays(7),
        ]);

        return redirect()->back()->with('success', 'Payment link generated successfully for milestone.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
        ]);

        // Create the user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Assign the selected role to the user
        $user->syncRoles($validated['role']);

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    public function destroy(User $user)
    {
        // Authorization check - only Super Admin can delete users
        $currentUser = Auth::user();
        if (!$currentUser || !$currentUser->roles->pluck('name')->contains('Super Admin')) {
            return redirect()->back()->with('error', "You don't have permission to delete users.");
        }

        // Prevent deleting own account
        if ($currentUser->id == $user->id) {
            return redirect()->back()->with('error', "You cannot delete your own account.");
        }

        // Delete associated files and records
        $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];
        foreach ($user->documents as $document) {
            foreach ($fileFields as $field) {
                if ($document->$field) {
                    Storage::delete($document->$field);
                }
            }
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully.');
    }

    public function getMessages(User $user)
    {
        $messages = Message::where('recipient_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Update payment status for a specific payment (matching Livewire functionality)
     */
    public function updatePaymentStatus(Request $request, User $user, Payment $payment)
    {
        $validated = $request->validate([
            'status' => 'required|in:Paid,Pending,cancelled'
        ]);

        try {
            DB::beginTransaction();

            $booking = $payment->booking;

            // Update payment status
            $payment->update([
                'status' => $validated['status'],
                'paid_at' => $validated['status'] === 'Paid' ? now() : null
            ]);

            // Find corresponding booking payment
            $bookingPayment = BookingPayment::where('booking_id', $booking->id)
                ->where('amount', $payment->amount)
                ->orderBy('due_date', 'asc')
                ->first();

            if ($bookingPayment) {
                if ($validated['status'] === 'Paid') {
                    // Update booking payment for paid status
                    $bookingPayment->update([
                        'payment_status' => 'paid',
                        'payment_id' => $payment->id,
                        'paid_at' => now(),
                        'payment_method' => $payment->payment_method,
                        'transaction_reference' => $payment->transaction_id
                    ]);

                    // Invalidate any existing payment links
                    PaymentLink::where('booking_payment_id', $bookingPayment->id)
                        ->update(['status' => 'completed']);
                } else {
                    // For pending status, reset the booking payment
                    $bookingPayment->update([
                        'payment_status' => 'pending',
                        'payment_id' => null,
                        'paid_at' => null,
                        'payment_method' => null,
                        'transaction_reference' => null
                    ]);

                    // Invalidate any existing payment links to allow new ones
                    PaymentLink::where('booking_payment_id', $bookingPayment->id)
                        ->where('status', '!=', 'completed')
                        ->update(['status' => 'expired']);
                }

                // If there was a previous payment, update its status
                if ($bookingPayment->payment_id && $bookingPayment->payment_id !== $payment->id) {
                    Payment::where('id', $bookingPayment->payment_id)
                        ->update(['status' => 'cancelled']);
                }
            }

            // Recalculate booking status
            $this->updateBookingStatus($booking);

            DB::commit();

            $statusText = $validated['status'] === 'Paid' ? 'marked as paid' : 'reset to pending';

            // Check if it's an AJAX request
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'message' => "Payment successfully {$statusText}!",
                    'status' => $validated['status']
                ], 200);
            }

            return redirect()->back()->with('success', "Payment successfully {$statusText}!");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment status update failed', [
                'payment_id' => $payment->id,
                'status' => $validated['status'],
                'error' => $e->getMessage()
            ]);

            // Check if it's an AJAX request
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to update payment status: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to update payment status: ' . $e->getMessage());
        }
    }

    /**
     * Update the overall booking status based on payments
     */
    protected function updateBookingStatus($booking)
    {
        $totalAmount = (float) $booking->price + (float) $booking->booking_price;
        $totalPaid = $booking->payments()
            ->where('status', 'Paid')
            ->sum('amount');

        $allMilestonesCount = $booking->bookingPayments()->count();
        $paidMilestonesCount = $booking->bookingPayments()
            ->where('payment_status', 'paid')
            ->count();

        if ($totalPaid >= $totalAmount && $paidMilestonesCount === $allMilestonesCount) {
            $status = 'paid';
        } elseif ($totalPaid > 0) {
            $status = 'partially_paid';
        } else {
            $status = 'pending';
        }

        $booking->update([
            'payment_status' => $status,
            'last_payment_date' => $paidMilestonesCount > 0 ? now() : null
        ]);
    }

    /**
     * Generate payment link for milestone (matching Livewire functionality)
     */
    public function generateMilestonePaymentLinks(Request $request, User $user)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id'
        ]);

        try {
            $booking = Booking::with('payments', 'bookingPayments')->findOrFail($validated['booking_id']);

            // Check if milestone payments exist, if not create them
            if ($booking->bookingPayments()->count() === 0) {
                $this->createInitialMilestonePayments($booking);
                $booking->load('bookingPayments');
            }

            // Get all milestones
            $milestones = $booking->bookingPayments()
                ->orderBy('due_date')
                ->get()
                ->map(function ($payment) {
                    // Get the most recent pending payment link
                    $existingPaymentLink = PaymentLink::where('booking_payment_id', $payment->id)
                        ->where('status', 'pending')
                        ->latest()
                        ->first();

                    return [
                        'id' => $payment->id,
                        'description' => $payment->is_booking_fee
                            ? 'Booking Fee'
                            : $this->getMilestoneDescription($payment),
                        'amount' => $payment->amount,
                        'due_date' => Carbon::parse($payment->due_date)->format('d M Y'),
                        'status' => $payment->payment_status,
                        'is_booking_fee' => $payment->is_booking_fee,
                        'payment_link' => $existingPaymentLink ? route('admin.payment-links.show', $existingPaymentLink->unique_id) : null,
                        'last_updated' => $existingPaymentLink ? $existingPaymentLink->updated_at->format('d M Y H:i') : null
                    ];
                });

            return response()->json([
                'success' => true,
                'milestones' => $milestones
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create payment link for specific milestone
     */
    public function createMilestonePaymentLink(Request $request, User $user, BookingPayment $bookingPayment)
    {
        try {
            // Prevent creating a link for already paid milestones
            if ($bookingPayment->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'error' => 'This milestone has already been paid.'
                ]);
            }

            // Check for existing payment link
            $existingLink = PaymentLink::where('booking_payment_id', $bookingPayment->id)
                ->where('status', 'pending')
                ->first();

            if ($existingLink) {
                // Update existing link
                $existingLink->update([
                    'amount' => $bookingPayment->amount,
                    'updated_at' => now()
                ]);

                $paymentLink = $existingLink;
            } else {
                // Create new payment link if none exists
                $paymentLink = PaymentLink::create([
                    'unique_id' => Str::uuid(),
                    'user_id' => $user->id,
                    'booking_id' => $bookingPayment->booking_id,
                    'booking_payment_id' => $bookingPayment->id,
                    'amount' => $bookingPayment->amount,
                    'status' => 'pending'
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $existingLink ? 'Payment link updated successfully!' : 'Payment link generated successfully!',
                'payment_link' => route('admin.payment-links.show', $paymentLink->unique_id),
                'last_updated' => $paymentLink->updated_at->format('d M Y H:i')
            ]);

        } catch (\Exception $e) {
            Log::error('Error generating milestone payment link', [
                'user_id' => $user->id,
                'booking_payment_id' => $bookingPayment->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error managing payment link: ' . $e->getMessage()
            ], 500);
        }
    }

    private function createInitialMilestonePayments($booking)
    {
        try {
            // Validate booking data
            if (!$booking->from_date || !$booking->to_date) {
                Log::error('Booking missing dates', [
                    'booking_id' => $booking->id,
                    'from_date' => $booking->from_date,
                    'to_date' => $booking->to_date
                ]);
                throw new \Exception('Booking dates are missing');
            }

            if (!$booking->price || $booking->price <= 0) {
                Log::error('Booking has invalid price', [
                    'booking_id' => $booking->id,
                    'price' => $booking->price,
                    'booking_price' => $booking->booking_price
                ]);
                throw new \Exception('Booking price is invalid');
            }

            $startDate = Carbon::parse($booking->from_date);
            $priceType = $booking->price_type ?? 'Month'; // Default to Month if not set

            Log::info('Creating milestone payments', [
                'booking_id' => $booking->id,
                'price_type' => $priceType,
                'from_date' => $booking->from_date,
                'to_date' => $booking->to_date,
                'price' => $booking->price,
                'booking_price' => $booking->booking_price
            ]);

            // Calculate milestones based on price type
            $fromDate = Carbon::parse($booking->from_date);
            $toDate = Carbon::parse($booking->to_date);

            $numberOfPayments = match ($priceType) {
                'Month' => max(1, $fromDate->diffInMonths($toDate)),
                'Week' => max(1, ceil($fromDate->diffInDays($toDate) / 7)),
                'Day' => max(1, $fromDate->diffInDays($toDate)),
                default => 1
            };

            // Ensure at least one payment
            $numberOfPayments = max(1, $numberOfPayments);

            Log::info('Calculated payments', [
                'booking_id' => $booking->id,
                'number_of_payments' => $numberOfPayments
            ]);

            // Calculate amount per milestone
            $baseAmount = $booking->price / $numberOfPayments;

            // Create a separate booking fee milestone
            $booking->bookingPayments()->create([
                'milestone_type' => 'Booking',
                'milestone_number' => 0,
                'due_date' => $startDate,
                'amount' => $booking->booking_price ?? 0,
                'payment_status' => 'pending',
                'is_booking_fee' => true
            ]);

            for ($i = 0; $i < $numberOfPayments; $i++) {
                $dueDate = match ($priceType) {
                    'Month' => $startDate->copy()->addMonths($i),
                    'Week' => $startDate->copy()->addWeeks($i),
                    'Day' => $startDate->copy()->addDays($i),
                    default => $startDate->copy()->addMonths($i)
                };

                $booking->bookingPayments()->create([
                    'milestone_type' => $priceType,
                    'milestone_number' => $i + 1,
                    'due_date' => $dueDate,
                    'amount' => $baseAmount,
                    'payment_status' => 'pending',
                    'is_booking_fee' => false
                ]);
            }

            Log::info('Successfully created milestone payments', [
                'booking_id' => $booking->id,
                'total_created' => $numberOfPayments + 1 // +1 for booking fee
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating milestone payments', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e; // Re-throw so calling method can handle it
        }
    }

    private function getMilestoneDescription($payment)
    {
        $formattedDate = Carbon::parse($payment->due_date)->format('d M Y');

        return match ($payment->milestone_type) {
            'Month' => "Month {$formattedDate} Payment",
            'Week' => "Week {$formattedDate} Payment",
            'Day' => "Day {$formattedDate} Payment",
            'Booking Fee' => "Booking Fee {$formattedDate} Payment",
            default => "Payment {$formattedDate}",
        };
    }

    /**
     * Download invoice for booking
     */
    public function downloadInvoice(User $user, Booking $booking)
    {
        try {
            $booking->load(['user', 'package', 'payments']);

            $invoiceData = $this->prepareInvoiceData($booking);

            $pdf = app('dompdf.wrapper');
            $pdf->loadView('admin.invoice-template', $invoiceData);

            return $pdf->download("invoice-{$booking->id}.pdf");

        } catch (\Exception $e) {
            Log::error('Download invoice error', [
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => 'Error generating invoice: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Email invoice to user
     */
    public function emailInvoice(User $user, Booking $booking)
    {
        try {
            $booking->load(['user', 'package', 'payments']);

            // Check if user has email
            if (!$booking->user->email) {
                return response()->json(['message' => 'Cannot send invoice: User has no email address.'], 400);
            }

            $invoiceData = $this->prepareInvoiceData($booking);

            // Generate PDF
            $pdf = app('dompdf.wrapper');
            $pdf->loadView('admin.invoice-template', $invoiceData);
            $pdfContent = $pdf->output();

            // Send email using Laravel Mail
            Mail::send('emails.invoice', [
                'booking' => $booking,
                'userName' => $booking->user->name,
                'invoiceNumber' => 'INV-' . date('Y') . '-' . str_pad($booking->id, 4, '0', STR_PAD_LEFT),
                'totalAmount' => number_format($booking->price + $booking->booking_price, 2),
                'dueDate' => now()->addDays(7)->format('d/m/Y')
            ], function ($message) use ($booking, $pdfContent) {
                $message->from('rentandrooms@gmail.com', 'Rent and Rooms');
                $message->to($booking->user->email, $booking->user->name);
                $message->subject("Your Invoice from Rent and Rooms - Booking #{$booking->id}");
                $message->attachData($pdfContent, "invoice-{$booking->id}.pdf", [
                    'mime' => 'application/pdf'
                ]);
            });

            return response()->json(['message' => 'Invoice has been successfully emailed to ' . $booking->user->email], 200);

        } catch (\Exception $e) {
            Log::error('Invoice email error', [
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => 'Failed to send invoice email. Please try again later.'], 500);
        }
    }

    /**
     * Get milestones for a specific booking (matching frontend functionality)
     */
    public function getBookingMilestones(User $user, Booking $booking)
    {
        try {
            // Check if milestone payments exist, if not create them
            if ($booking->bookingPayments()->count() === 0) {
                $this->createInitialMilestonePayments($booking);
                $booking->load('bookingPayments');
            }

            // Get all milestones with payment link information
            $milestones = $booking->bookingPayments()
                ->orderBy('due_date')
                ->get()
                ->map(function ($payment) {
                    try {
                        // Get the most recent pending payment link
                        $existingPaymentLink = PaymentLink::where('booking_payment_id', $payment->id)
                            ->where('status', 'pending')
                            ->latest()
                            ->first();

                        return [
                            'id' => $payment->id,
                            'description' => $payment->is_booking_fee
                                ? 'Booking Fee'
                                : $this->getMilestoneDescription($payment),
                            'amount' => (float) $payment->amount,
                            'due_date' => Carbon::parse($payment->due_date)->format('d M Y'),
                            'status' => $payment->payment_status ?? 'pending',
                            'is_booking_fee' => $payment->is_booking_fee ?? false,
                            'payment_link' => $existingPaymentLink ? route('admin.payment-links.show', $existingPaymentLink->unique_id) : null,
                            'last_updated' => $existingPaymentLink ? Carbon::parse($existingPaymentLink->updated_at)->format('d M Y H:i') : null
                        ];
                    } catch (\Exception $e) {
                        Log::error('Error mapping milestone', [
                            'payment_id' => $payment->id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        // Return basic data if mapping fails
                        return [
                            'id' => $payment->id,
                            'description' => 'Payment #' . $payment->id,
                            'amount' => (float) $payment->amount,
                            'due_date' => Carbon::parse($payment->due_date)->format('d M Y'),
                            'status' => $payment->payment_status ?? 'pending',
                            'is_booking_fee' => false,
                            'payment_link' => null,
                            'last_updated' => null
                        ];
                    }
                });

            return response()->json([
                'success' => true,
                'milestones' => $milestones
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching booking milestones', [
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to fetch milestones',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user basic information (matching frontend functionality)
     */
    public function updateUserInfo(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'required|string|max:15',
        ]);

        try {
            $user->update($validated);
            return response()->json(['message' => 'User information updated successfully']);
        } catch (\Exception $e) {
            Log::error('Error updating user info', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to update user information'], 500);
        }
    }

    private function prepareInvoiceData($booking)
    {
        $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($booking->id, 4, '0', STR_PAD_LEFT);

        return [
            'invoice_number' => $invoiceNumber,
            'date' => now()->format('d/m/Y'),
            'due_date' => now()->addDays(7)->format('d/m/Y'),
            'booking' => $booking,
            'customer' => [
                'name' => $booking->user->name,
                'email' => $booking->user->email,
                'phone' => $booking->user->phone ?? 'N/A',
            ],
            'company' => [
                'name' => 'Rent and Rooms',
                'address' => '60 Sceptre Street, Newcastle, NE4 6PR',
                'phone' => '03301339494',
                'email' => 'rentandrooms@gmail.com'
            ],
            'items' => [
                [
                    'description' => $booking->package->name . ' Package',
                    'amount' => $booking->price,
                    'type' => 'Package Price'
                ],
                [
                    'description' => 'Booking Fee',
                    'amount' => $booking->booking_price,
                    'type' => 'Booking Fee'
                ]
            ],
            'payments' => $booking->payments,
            'summary' => [
                'total_price' => $booking->price + $booking->booking_price,
                'total_paid' => $booking->payments->where('status', 'Paid')->sum('amount'),
                'remaining_balance' => ($booking->price + $booking->booking_price) - $booking->payments->where('status', 'Paid')->sum('amount')
            ]
        ];
    }

    private function getInvoiceEmailContent($booking)
    {
        try {
            return view('emails.invoice', [
                'booking' => $booking,
                'userName' => $booking->user->name,
                'invoiceNumber' => 'INV-' . date('Y') . '-' . str_pad($booking->id, 4, '0', STR_PAD_LEFT),
                'totalAmount' => number_format($booking->price + $booking->booking_price, 2),
                'dueDate' => now()->addDays(7)->format('d/m/Y')
            ])->render();
        } catch (\Exception $e) {
            Log::error('Error rendering invoice email template: ' . $e->getMessage());
            throw new \Exception('Failed to generate email content');
        }
    }

    /**
     * Update user basic information
     */
    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'required|string|max:15',
        ]);

        $user->update($validated);

        return redirect()->back()->with('success', 'User information updated successfully.');
    }

    /**
     * Update package documents
     */
    public function updatePackageDocuments(Request $request, User $user, Package $package)
    {
        $request->validate([
            'documents.gas_certificate' => 'nullable|mimes:pdf,jpg,jpeg,png|max:10240',
            'documents.electric_certificate' => 'nullable|mimes:pdf,jpg,jpeg,png|max:10240',
            'documents.landlord_certificate' => 'nullable|mimes:pdf,jpg,jpeg,png|max:10240',
            'documents.building_insurance' => 'nullable|mimes:pdf,jpg,jpeg,png|max:10240',
            'documents.pat_certificate' => 'nullable|mimes:pdf,jpg,jpeg,png|max:10240',
            'documents.epc_certificate' => 'nullable|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        try {
            DB::beginTransaction();

            // Check if package belongs to user OR is assigned to user
            if ($package->user_id !== $user->id && $package->assigned_to !== $user->id) {
                throw new \Exception('Package does not belong to this user');
            }

            foreach ($request->file('documents', []) as $type => $file) {
                if ($file) {
                    $existingDoc = $package->documents()
                        ->where('type', $type)
                        ->first();

                    if ($existingDoc && Storage::exists($existingDoc->path)) {
                        Storage::delete($existingDoc->path);
                    }

                    $path = $file->store('package-documents', 'public');

                    $package->documents()->updateOrCreate(
                        ['type' => $type],
                        [
                            'path' => $path,
                            'expires_at' => now()->addYear(),
                            'updated_by' => Auth::id(),
                            'status' => 'active'
                        ]
                    );
                }
            }

            DB::commit();
            return redirect()->back()->with('success', 'Package documents updated successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating package documents', [
                'user_id' => $user->id,
                'package_id' => $package->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Error updating documents: ' . $e->getMessage());
        }
    }

    /**
     * Delete package document
     */
    public function deletePackageDocument(User $user, Package $package, $type)
    {
        try {
            DB::beginTransaction();

            if ($package->user_id !== $user->id) {
                throw new \Exception('Package does not belong to this user');
            }

            $document = $package->documents()
                ->where('type', $type)
                ->first();

            if ($document) {
                if (Storage::exists($document->path)) {
                    Storage::delete($document->path);
                }
                $document->delete();
            }

            DB::commit();
            return redirect()->back()->with('success', 'Document deleted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error deleting document: ' . $e->getMessage());
        }
    }
}
