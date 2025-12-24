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
use App\Models\PartnerDocument;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\InvoiceMail;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Carbon\Carbon;

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
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('email', 'like', '%' . $searchTerm . '%');
            });
        }

        // Role filter
        if ($request->filled('role')) {
            $roleFilter = $request->get('role');
            $query->whereHas('roles', function ($q) use ($roleFilter) {
                $q->where('name', $roleFilter);
            });
        }

        // Has booking filter
        if ($request->filled('has_booking')) {
            $hasBooking = $request->get('has_booking');
            if ($hasBooking === 'yes') {
                $query->has('bookings');
            } elseif ($hasBooking === 'no') {
                $query->doesntHave('bookings');
            }
        }

        $users = $query->paginate(15);
        $roles = \Spatie\Permission\Models\Role::all();

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => [
                'search' => $request->get('search'),
                'role' => $request->get('role'),
                'has_booking' => $request->get('has_booking'),
            ],
        ]);
    }

    public function show(User $user)
    {
        $user->load([
            'roles',
            'userDetail',
            'bankDetail',
            'agreementDetail',
            'documents',
            'partnerDocuments',
            'partnerDocumentItems',
        ]);

        // Load packages assigned to this user
        $packages = Package::with(['creator', 'assignedPartner', 'assignedBy', 'country', 'city', 'area', 'property', 'documents'])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('assigned_to', $user->id);
            })
            ->get();

        // Load payments with booking relationship
        $payments = Payment::whereHas('booking', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with('booking')
            ->latest()
            ->get();

        $paymentLinks = PaymentLink::where('user_id', $user->id)
            ->with('bookingPayment')
            ->latest()
            ->get();

        // Load bookings with all necessary relationships
        $bookings = Booking::where('user_id', $user->id)
            ->with([
                'package',
                'bookingPayments' => function ($query) {
                    $query->orderBy('due_date', 'asc');
                },
                'payments',
                'bookingRoomPrices.room.prices'
            ])
            ->latest()
            ->get()
            ->map(function ($booking) {
                // Calculate payment summary
                $totalPrice = (float) $booking->price + (float) $booking->booking_price;
                $totalPaid = $booking->payments->where('status', 'Paid')->sum('amount');
                $remainingBalance = $totalPrice - $totalPaid;
                $paymentPercentage = $totalPrice > 0 ? ($totalPaid / $totalPrice * 100) : 0;

                // Calculate total rent advance from booking room prices
                $rentAdvancePrice = 0;
                if ($booking->bookingRoomPrices) {
                    foreach ($booking->bookingRoomPrices as $brp) {
                        if ($brp->room && $brp->room->prices) {
                            $matchingPrice = $brp->room->prices->firstWhere('type', $brp->price_type);
                            if ($matchingPrice) {
                                $rentAdvancePrice += (float) $matchingPrice->rent_advance_price;
                            }
                        }
                    }
                }

                // Convert to array first
                $bookingArray = $booking->toArray();

                // Add rent advance price
                $bookingArray['rent_advance_price'] = $rentAdvancePrice;

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
            'partnerDocuments' => $user->partnerDocuments ?? null,
            'partnerDocumentItems' => $user->partnerDocumentItems ?? [],
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
            'due_date' => now()->addDays(7),
            'status' => 'pending',
        ]);

        // Create payment link
        $uniqueId = 'PL-' . strtoupper(Str::random(12));
        $paymentLink = PaymentLink::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'booking_payment_id' => $bookingPayment->id,
            'amount' => $validated['milestone_amount'],
            'unique_id' => $uniqueId,
            'status' => 'active',
            'expires_at' => now()->addDays(7),
        ]);

        return redirect()->back()->with('success', 'Payment link generated successfully. Link: ' . route('payment.link.public', $uniqueId));
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
        $uniqueId = 'PL-' . strtoupper(Str::random(12));
        $paymentLink = PaymentLink::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'booking_payment_id' => $milestone->id,
            'amount' => $validated['amount'],
            'unique_id' => $uniqueId,
            'status' => 'active',
            'expires_at' => now()->addDays(7),
        ]);

        return redirect()->back()->with('success', 'Payment link generated: ' . route('payment.link.public', $uniqueId));
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

        try {
            // Delete associated files and records
            $fileFields = ['passport', 'nid_or_other', 'payslip', 'student_card'];
            foreach ($user->documents as $document) {
                foreach ($fileFields as $field) {
                    if ($document->$field) {
                        Storage::delete($document->$field);
                    }
                }
            }

            // This will trigger the model's deleting event which checks for bookings
            $user->delete();

            return redirect()->back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function getMessages(User $user)
    {
        $messages = Message::where('recipient_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

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

            // Get corresponding booking payment directly from the payment
            $bookingPayment = null;

            if ($payment->booking_payment_id) {
                $bookingPayment = BookingPayment::find($payment->booking_payment_id);
            } else {
                $bookingPayment = BookingPayment::where('booking_id', $booking->id)
                    ->where('amount', $payment->amount)
                    ->orderBy('due_date', 'asc')
                    ->first();
            }

            if ($bookingPayment) {
                if ($validated['status'] === 'Paid') {
                    $bookingPayment->update([
                        'payment_status' => 'paid',
                        'payment_id' => $payment->id,
                        'paid_at' => now(),
                        'payment_method' => $payment->payment_method,
                        'transaction_reference' => $payment->transaction_id ?? $payment->reference_number
                    ]);

                    PaymentLink::where('booking_payment_id', $bookingPayment->id)
                        ->update(['status' => 'completed']);
                } else {
                    $bookingPayment->update([
                        'payment_status' => 'pending',
                        'payment_id' => null,
                        'paid_at' => null,
                        'payment_method' => null,
                        'transaction_reference' => null
                    ]);

                    PaymentLink::where('booking_payment_id', $bookingPayment->id)
                        ->where('status', '!=', 'completed')
                        ->update(['status' => 'expired']);
                }

                if ($bookingPayment->payment_id && $bookingPayment->payment_id !== $payment->id) {
                    Payment::where('id', $bookingPayment->payment_id)
                        ->update(['status' => 'cancelled']);
                }
            }

            // Recalculate booking status
            $this->updateBookingStatus($booking);

            DB::commit();

            $statusText = $validated['status'] === 'Paid' ? 'marked as paid' : 'reset to pending';

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'message' => "Payment successfully {$statusText}!",
                    'status' => $validated['status']
                ], 200);
            }

            return redirect()->back()->with('success', "Payment successfully {$statusText}!");

        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to update payment status: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to update payment status: ' . $e->getMessage());
        }
    }

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

    public function generateMilestonePaymentLinks(Request $request, User $user)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id'
        ]);

        try {
            $booking = Booking::with('payments', 'bookingPayments')->findOrFail($validated['booking_id']);

            if ($booking->bookingPayments()->count() === 0) {
                $this->createInitialMilestonePayments($booking);
                $booking->load('bookingPayments');
            }

            $milestones = $booking->bookingPayments()
                ->orderBy('due_date')
                ->get()
                ->map(function ($payment) {
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

    public function createMilestonePaymentLink(Request $request, User $user, BookingPayment $bookingPayment)
    {
        try {
            if ($bookingPayment->payment_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'error' => 'This milestone has already been paid.'
                ]);
            }

            $existingLink = PaymentLink::where('booking_payment_id', $bookingPayment->id)
                ->where('status', 'active')
                ->first();

            if ($existingLink) {
                $existingLink->update([
                    'amount' => $bookingPayment->amount,
                    'updated_at' => now()
                ]);

                $paymentLink = $existingLink;
            } else {
                $paymentLink = PaymentLink::create([
                    'unique_id' => Str::uuid(),
                    'user_id' => $user->id,
                    'booking_id' => $bookingPayment->booking_id,
                    'booking_payment_id' => $bookingPayment->id,
                    'amount' => $bookingPayment->amount,
                    'status' => 'active'
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $existingLink ? 'Payment link updated successfully!' : 'Payment link generated successfully!',
                'payment_link' => url('/pay/' . $paymentLink->unique_id),
                'last_updated' => $paymentLink->updated_at->format('d M Y H:i')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error managing payment link: ' . $e->getMessage()
            ], 500);
        }
    }

    private function createInitialMilestonePayments($booking)
    {
        try {
            if (!$booking->from_date || !$booking->to_date) {
                throw new \Exception('Booking dates are missing');
            }

            if (!$booking->price || $booking->price <= 0) {
                throw new \Exception('Booking price is invalid');
            }

            $startDate = Carbon::parse($booking->from_date);
            $priceType = $booking->price_type ?? 'Month';

            $fromDate = Carbon::parse($booking->from_date);
            $toDate = Carbon::parse($booking->to_date);

            $numberOfPayments = match ($priceType) {
                'Month' => max(1, $fromDate->diffInMonths($toDate)),
                'Week' => max(1, ceil($fromDate->diffInDays($toDate) / 7)),
                'Day' => max(1, $fromDate->diffInDays($toDate)),
                default => 1
            };

            $numberOfPayments = max(1, $numberOfPayments);
            $baseAmount = $booking->price / $numberOfPayments;

            // Create booking fee milestone
            $booking->bookingPayments()->create([
                'milestone_type' => 'Booking',
                'milestone_number' => 0,
                'due_date' => $startDate,
                'amount' => $booking->booking_price ?? 0,
                'payment_status' => 'pending',
                'is_booking_fee' => true
            ]);

            // Create regular payment milestones
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

        } catch (\Exception $e) {
            throw $e;
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

    public function downloadInvoice(User $user, Booking $booking)
    {
        try {
            $booking->load(['user', 'package', 'payments']);

            $invoiceData = $this->prepareInvoiceData($booking);

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.invoice-template', $invoiceData);
            $pdf->setPaper('A4', 'portrait');

            session()->flash('success', 'Invoice downloaded successfully!');

            return $pdf->download("invoice-{$booking->id}.pdf");

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error generating invoice: ' . $e->getMessage());
        }
    }

    public function emailInvoice(User $user, Booking $booking)
    {
        try {
            $booking->load(['user', 'package', 'payments']);

            if (!$booking->user->email) {
                return redirect()->back()->with('error', 'Cannot send invoice: User has no email address.');
            }

            $invoiceData = $this->prepareInvoiceData($booking);

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.invoice-template', $invoiceData);
            $pdf->setPaper('A4', 'portrait');
            $pdfContent = $pdf->output();

            $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($booking->id, 4, '0', STR_PAD_LEFT);

            Mail::to($booking->user->email)
                ->send(new InvoiceMail($booking, $invoiceNumber, $pdfContent));

            return redirect()->back()->with('success', 'Invoice has been successfully emailed to ' . $booking->user->email);

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to send invoice email. Please try again later.');
        }
    }

    public function getBookingMilestones(User $user, Booking $booking)
    {
        try {
            if ($booking->bookingPayments()->count() === 0) {
                $this->createInitialMilestonePayments($booking);
                $booking->load('bookingPayments');
            }

            $milestones = $booking->bookingPayments()
                ->orderBy('due_date')
                ->get()
                ->map(function ($payment) {
                    try {
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
            return response()->json([
                'error' => 'Failed to fetch milestones',
                'message' => $e->getMessage()
            ], 500);
        }
    }

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
            return response()->json(['error' => 'Failed to update user information'], 500);
        }
    }

    private function prepareInvoiceData($booking)
    {
        $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($booking->id, 4, '0', STR_PAD_LEFT);

        $header = \App\Models\Header::first();
        $logo = $header ? $header->logo : null;

        return [
            'invoice_number' => $invoiceNumber,
            'date' => now()->format('d/m/Y'),
            'due_date' => now()->addDays(7)->format('d/m/Y'),
            'logo' => $logo,
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
            return redirect()->back()->with('error', 'Error updating documents: ' . $e->getMessage());
        }
    }

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

    public function updatePartnerDocuments(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'photo_id' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'photo_id_expiry' => 'nullable|date',
                'authorised_letter' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'authorised_letter_expiry' => 'nullable|date',
                'management_agreement' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'management_agreement_expiry' => 'nullable|date',
                'management_maintain_agreement' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'management_maintain_agreement_expiry' => 'nullable|date',
                'franchise_agreement' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'franchise_agreement_expiry' => 'nullable|date',
                'investor_agreement' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'investor_agreement_expiry' => 'nullable|date',
                'hmo_licence' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'hmo_licence_expiry' => 'nullable|date',
                'gas_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'gas_certificate_expiry' => 'nullable|date',
                'eicr_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'eicr_certificate_expiry' => 'nullable|date',
                'epc_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'epc_certificate_expiry' => 'nullable|date',
                'smoke_fire_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'smoke_fire_certificate_expiry' => 'nullable|date',
                'building_insurance' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'building_insurance_expiry' => 'nullable|date',
                'maintain_report' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'maintain_report_expiry' => 'nullable|date',
                'package_floor_plan' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'package_floor_plan_expiry' => 'nullable|date',
                'authorization_letter' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'authorization_letter_expiry' => 'nullable|date',
            ]);

            $partnerDoc = $user->partnerDocuments ?? new PartnerDocument(['user_id' => $user->id]);

            $updateData = [];

            $fileFields = [
                'photo_id',
                'authorised_letter',
                'management_agreement',
                'management_maintain_agreement',
                'franchise_agreement',
                'investor_agreement',
                'hmo_licence',
                'gas_certificate',
                'eicr_certificate',
                'epc_certificate',
                'smoke_fire_certificate',
                'building_insurance',
                'maintain_report',
                'package_floor_plan',
            ];

            foreach ($fileFields as $field) {
                if ($request->hasFile($field)) {
                    if ($partnerDoc->exists && $partnerDoc->$field) {
                        Storage::delete($partnerDoc->$field);
                    }

                    $path = $request->file($field)->store('partner_documents', 'public');
                    $updateData[$field] = $path;
                }

                $expiryField = $field . '_expiry';
                if ($request->has($expiryField)) {
                    $updateData[$expiryField] = $validated[$expiryField];
                }
            }

            if ($partnerDoc->exists) {
                $partnerDoc->update($updateData);
            } else {
                $partnerDoc->fill($updateData);
                $partnerDoc->save();
            }

            return redirect()->back()->with('success', 'Partner documents updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to update documents: ' . $e->getMessage()]);
        }
    }

    public function deletePartnerDocument(User $user, string $type)
    {
        try {
            $partnerDoc = $user->partnerDocuments;

            if (!$partnerDoc) {
                return redirect()->back()->withErrors(['error' => 'No documents found.']);
            }

            $validTypes = [
                'photo_id',
                'authorised_letter',
                'management_agreement',
                'management_maintain_agreement',
                'franchise_agreement',
                'investor_agreement',
                'hmo_licence',
                'gas_certificate',
                'eicr_certificate',
                'epc_certificate',
                'smoke_fire_certificate',
                'building_insurance',
                'maintain_report',
                'package_floor_plan',
            ];

            if (!in_array($type, $validTypes)) {
                return redirect()->back()->withErrors(['error' => 'Invalid document type.']);
            }

            if ($partnerDoc->$type) {
                Storage::delete($partnerDoc->$type);
            }

            $partnerDoc->update([
                $type => null,
                $type . '_expiry' => null,
            ]);

            return redirect()->back()->with('success', 'Document deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete document: ' . $e->getMessage()]);
        }
    }

    public function downloadPartnerDocument(User $user, string $type)
    {
        try {
            $partnerDoc = $user->partnerDocuments;

            if (!$partnerDoc) {
                abort(404, 'No documents found.');
            }

            $validTypes = [
                'photo_id',
                'authorised_letter',
                'management_agreement',
                'management_maintain_agreement',
                'franchise_agreement',
                'investor_agreement',
                'hmo_licence',
                'gas_certificate',
                'eicr_certificate',
                'epc_certificate',
                'smoke_fire_certificate',
                'building_insurance',
                'maintain_report',
                'package_floor_plan',
            ];

            if (!in_array($type, $validTypes)) {
                abort(400, 'Invalid document type.');
            }

            $filePath = $partnerDoc->$type;

            if (!$filePath) {
                abort(404, 'Document not found.');
            }

            if (!Storage::disk('public')->exists($filePath)) {
                abort(404, 'Document file not found in storage.');
            }

            $fileName = basename($filePath);
            $friendlyName = str_replace('_', ' ', ucfirst($type)) . '_' . $user->name . '_' . $fileName;

            return response()->download(storage_path('app/public/' . $filePath), $friendlyName);

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to download document: ' . $e->getMessage());
        }
    }

    // Dynamic Partner Document Methods (New System)
    public function getPartnerDocumentItems(User $user)
    {
        $partnerDocs = $user->partnerDocumentItems()->where('document_type', 'partner')->get();
        $packageDocs = $user->partnerDocumentItems()->where('document_type', 'package')->get();

        return response()->json([
            'success' => true,
            'partner_documents' => $partnerDocs,
            'package_documents' => $packageDocs,
        ]);
    }

    public function addPartnerDocumentItem(Request $request, User $user)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'document_type' => 'required|in:partner,package',
            'document_name' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $filePath = $request->file('file')->store('partner_documents', 'public');

            $document = \App\Models\PartnerDocumentItem::create([
                'user_id' => $user->id,
                'package_id' => $validated['package_id'],
                'document_type' => $validated['document_type'],
                'document_name' => $validated['document_name'],
                'file_path' => $filePath,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'active',
            ]);

            return redirect()->back()->with('success', 'Document added successfully.');
        } catch (\Exception $e) {
            \Log::error('Error adding partner document', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to add document: ' . $e->getMessage());
        }
    }

    public function updatePartnerDocumentItem(Request $request, User $user, \App\Models\PartnerDocumentItem $document)
    {
        if ($document->user_id !== $user->id) {
            return redirect()->back()->with('error', 'Unauthorized access to document');
        }

        $validated = $request->validate([
            'document_name' => 'required|string|max:255',
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $updateData = [
                'document_name' => $validated['document_name'],
                'expiry_date' => $validated['expiry_date'] ?? $document->expiry_date,
                'notes' => $validated['notes'] ?? $document->notes,
            ];

            if ($request->hasFile('file')) {
                if ($document->file_path) {
                    Storage::delete($document->file_path);
                }
                $filePath = $request->file('file')->store('partner_documents', 'public');
                $updateData['file_path'] = $filePath;
            }

            $document->update($updateData);

            return redirect()->back()->with('success', 'Document updated successfully.');
        } catch (\Exception $e) {
            \Log::error('Error updating partner document', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to update document: ' . $e->getMessage());
        }
    }

    public function deletePartnerDocumentItem(User $user, \App\Models\PartnerDocumentItem $document)
    {
        if ($document->user_id !== $user->id) {
            return redirect()->back()->with('error', 'Unauthorized access to document');
        }

        try {
            if ($document->file_path) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();

            return redirect()->back()->with('success', 'Document deleted successfully.');
        } catch (\Exception $e) {
            \Log::error('Error deleting partner document', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to delete document: ' . $e->getMessage());
        }
    }

    public function downloadPartnerDocumentItem(User $user, \App\Models\PartnerDocumentItem $document)
    {
        if ($document->user_id !== $user->id) {
            abort(403, 'Unauthorized access to document');
        }

        if (!$document->file_path) {
            abort(404, 'Document file not found');
        }

        if (!Storage::disk('public')->exists($document->file_path)) {
            \Log::error('Partner document file not found in storage', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'path' => $document->file_path,
            ]);
            abort(404, 'Document file not found in storage');
        }

        $fileName = $document->document_name . '_' . $user->name . '_' . basename($document->file_path);

        return Storage::disk('public')->download($document->file_path, $fileName);
    }
}
