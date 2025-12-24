<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Booking;
use App\Models\Package;
use App\Models\Payment;
use App\Models\PaymentLink;
use App\Models\UserDocument;
use App\Models\BookingPayment;
use App\Models\PartnerDocumentItem;
use App\Services\User\UserDocumentService;
use App\Services\User\UserDetailsService;
use App\Services\User\PaymentService;
use App\Services\User\MilestoneService;
use App\Services\User\InvoiceService;
use App\Services\User\PartnerDocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserController extends Controller
{
    protected $userDocumentService;
    protected $userDetailsService;
    protected $paymentService;
    protected $milestoneService;
    protected $invoiceService;
    protected $partnerDocumentService;

    public function __construct(
        UserDocumentService $userDocumentService,
        UserDetailsService $userDetailsService,
        PaymentService $paymentService,
        MilestoneService $milestoneService,
        InvoiceService $invoiceService,
        PartnerDocumentService $partnerDocumentService
    ) {
        $this->userDocumentService = $userDocumentService;
        $this->userDetailsService = $userDetailsService;
        $this->paymentService = $paymentService;
        $this->milestoneService = $milestoneService;
        $this->invoiceService = $invoiceService;
        $this->partnerDocumentService = $partnerDocumentService;
    }

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

        if ($request->filled('search')) {
            $searchTerm = $request->get('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('email', 'like', '%' . $searchTerm . '%');
            });
        }

        if ($request->filled('role')) {
            $roleFilter = $request->get('role');
            $query->whereHas('roles', function ($q) use ($roleFilter) {
                $q->where('name', $roleFilter);
            });
        }

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
            'partnerDocumentItems'
        ]);

        $packages = Package::with(['creator', 'assignedPartner', 'assignedBy', 'country', 'city', 'area', 'property', 'documents'])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('assigned_to', $user->id);
            })
            ->get();

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
                $totalPrice = (float) $booking->price + (float) $booking->booking_price;
                $totalPaid = $booking->payments->where('status', 'Paid')->sum('amount');
                $remainingBalance = $totalPrice - $totalPaid;
                $paymentPercentage = $totalPrice > 0 ? ($totalPaid / $totalPrice * 100) : 0;

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

                $bookingArray = $booking->toArray();
                $bookingArray['rent_advance_price'] = $rentAdvancePrice;
                $bookingArray['payment_summary'] = [
                    'total_price' => $totalPrice,
                    'total_paid' => $totalPaid,
                    'remaining_balance' => $remainingBalance,
                    'payment_percentage' => $paymentPercentage
                ];

                return $bookingArray;
            });

        // Get dynamic partner documents
        $partnerDocumentItems = $user->partnerDocumentItems()
            ->orderBy('document_type')
            ->orderBy('created_at', 'desc')
            ->get();

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
            'partnerDocumentItems' => $partnerDocumentItems,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->syncRoles($validated['role']);

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    public function destroy(User $user)
    {
        $currentUser = Auth::user();
        if (!$currentUser || !$currentUser->roles->pluck('name')->contains('Super Admin')) {
            return redirect()->back()->with('error', "You don't have permission to delete users.");
        }

        if ($currentUser->id == $user->id) {
            return redirect()->back()->with('error', "You cannot delete your own account.");
        }

        try {
            $user->delete();
            return redirect()->back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // User Details Methods
    public function updateProofDocuments(Request $request, User $user)
    {
        try {
            $this->userDetailsService->updateProofDocuments($request, $user);
            return redirect()->back()->with('success', 'Proof documents updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updateBankDetails(Request $request, User $user)
    {
        try {
            $this->userDetailsService->updateBankDetails($request, $user);
            return redirect()->back()->with('success', 'Bank details updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updateAgreementDetails(Request $request, User $user)
    {
        try {
            $this->userDetailsService->updateAgreementDetails($request, $user);
            return redirect()->back()->with('success', 'Agreement details updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updateUserDetails(Request $request, User $user)
    {
        try {
            $this->userDetailsService->updateUserDetails($request, $user);
            return redirect()->back()->with('success', 'User details updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updateUser(Request $request, User $user)
    {
        try {
            $this->userDetailsService->updateUserInfo($request, $user);
            return redirect()->back()->with('success', 'User information updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updateUserInfo(Request $request, User $user)
    {
        try {
            $this->userDetailsService->updateUserInfo($request, $user);
            return response()->json(['message' => 'User information updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update user information'], 500);
        }
    }

    // User Document Methods
    public function storeDocument(Request $request, User $user)
    {
        try {
            $this->userDocumentService->storeDocument($request, $user);
            return redirect()->back()->with('success', 'Document added successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updateDocument(Request $request, User $user, UserDocument $document)
    {
        try {
            $this->userDocumentService->updateDocument($request, $user, $document);
            return redirect()->back()->with('success', 'Document updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroyDocument(User $user, UserDocument $document)
    {
        try {
            $this->userDocumentService->destroyDocument($document);
            return redirect()->back()->with('success', 'Document deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // Payment Methods
    public function storePayment(Request $request, User $user)
    {
        try {
            $this->paymentService->storePayment($request, $user);
            return redirect()->back()->with('success', 'Payment added successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updatePayment(Request $request, User $user, Payment $payment)
    {
        try {
            $this->paymentService->updatePayment($request, $user, $payment);
            return redirect()->back()->with('success', 'Payment updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroyPayment(User $user, Payment $payment)
    {
        try {
            $this->paymentService->destroyPayment($user, $payment);
            return redirect()->back()->with('success', 'Payment deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updatePaymentStatus(Request $request, User $user, Payment $payment)
    {
        try {
            $result = $this->paymentService->updatePaymentStatus($request, $user, $payment);

            $statusText = $result['status'] === 'Paid' ? 'marked as paid' : 'reset to pending';

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'message' => "Payment successfully {$statusText}!",
                    'status' => $result['status']
                ], 200);
            }

            return redirect()->back()->with('success', "Payment successfully {$statusText}!");
        } catch (\Exception $e) {
            Log::error('Payment status update failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage()
            ]);

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json(['message' => 'Failed to update payment status: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Failed to update payment status: ' . $e->getMessage());
        }
    }

    public function generatePaymentLink(Request $request, User $user)
    {
        try {
            $paymentLink = $this->paymentService->generatePaymentLink($request, $user);
            return redirect()->back()->with('success', 'Payment link generated successfully. Link: ' . route('payment.link.public', $paymentLink->unique_id));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function generateMilestonePaymentLink(Request $request, User $user, BookingPayment $milestone)
    {
        try {
            $paymentLink = $this->paymentService->generateMilestonePaymentLink($request, $user, $milestone);
            return redirect()->back()->with('success', 'Payment link generated: ' . route('payment.link.public', $paymentLink->unique_id));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    // Milestone Methods
    public function generateMilestonePaymentLinks(Request $request, User $user)
    {
        try {
            $milestones = $this->milestoneService->generateMilestonePaymentLinks($request, $user);
            return response()->json(['success' => true, 'milestones' => $milestones]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function createMilestonePaymentLink(Request $request, User $user, BookingPayment $bookingPayment)
    {
        try {
            $paymentLink = $this->milestoneService->createMilestonePaymentLink($request, $user, $bookingPayment);

            $message = $paymentLink->wasRecentlyCreated ?
                'Payment link generated successfully!' :
                'Payment link updated successfully!';

            return response()->json([
                'success' => true,
                'message' => $message,
                'payment_link' => url('/pay/' . $paymentLink->unique_id),
                'last_updated' => $paymentLink->updated_at->format('d M Y H:i')
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating milestone payment link', [
                'user_id' => $user->id,
                'booking_payment_id' => $bookingPayment->id ?? null,
                'error' => $e->getMessage()
            ]);

            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function getBookingMilestones(User $user, Booking $booking)
    {
        try {
            $milestones = $this->milestoneService->getBookingMilestones($user, $booking);
            return response()->json(['success' => true, 'milestones' => $milestones]);
        } catch (\Exception $e) {
            Log::error('Error fetching booking milestones', [
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to fetch milestones', 'message' => $e->getMessage()], 500);
        }
    }

    // Invoice Methods
    public function downloadInvoice(User $user, Booking $booking)
    {
        try {
            return $this->invoiceService->downloadInvoice($user, $booking);
        } catch (\Exception $e) {
            Log::error('Download invoice error', [
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Error generating invoice: ' . $e->getMessage());
        }
    }

    public function emailInvoice(User $user, Booking $booking)
    {
        try {
            $email = $this->invoiceService->emailInvoice($user, $booking);
            return redirect()->back()->with('success', 'Invoice has been successfully emailed to ' . $email);
        } catch (\Exception $e) {
            Log::error('Invoice email error', [
                'user_id' => $user->id,
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to send invoice email: ' . $e->getMessage());
        }
    }

    // Dynamic Partner Document Methods
    public function getPartnerDocumentItems(User $user)
    {
        try {
            $partnerDocs = $this->partnerDocumentService->getPartnerDocuments($user);
            $packageDocs = $this->partnerDocumentService->getPackageDocuments($user);
            $stats = $this->partnerDocumentService->getDocumentStats($user);

            return response()->json([
                'success' => true,
                'partner_documents' => $partnerDocs,
                'package_documents' => $packageDocs,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function addPartnerDocumentItem(Request $request, User $user)
    {
        try {
            $document = $this->partnerDocumentService->addDocument($request, $user);
            return redirect()->back()->with('success', 'Document added successfully.');
        } catch (\Exception $e) {
            Log::error('Error adding partner document', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to add document: ' . $e->getMessage());
        }
    }

    public function updatePartnerDocumentItem(Request $request, User $user, PartnerDocumentItem $document)
    {
        try {
            $this->partnerDocumentService->updateDocument($request, $user, $document);
            return redirect()->back()->with('success', 'Document updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating partner document', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to update document: ' . $e->getMessage());
        }
    }

    public function deletePartnerDocumentItem(User $user, PartnerDocumentItem $document)
    {
        try {
            $this->partnerDocumentService->deleteDocument($user, $document);
            return redirect()->back()->with('success', 'Document deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting partner document', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to delete document: ' . $e->getMessage());
        }
    }

    public function downloadPartnerDocumentItem(User $user, PartnerDocumentItem $document)
    {
        try {
            return $this->partnerDocumentService->downloadDocument($user, $document);
        } catch (\Exception $e) {
            Log::error('Error downloading partner document', [
                'user_id' => $user->id,
                'document_id' => $document->id,
                'error' => $e->getMessage()
            ]);
            return redirect()->back()->with('error', 'Failed to download document: ' . $e->getMessage());
        }
    }

    public function getMessages(User $user)
    {
        $messages = \App\Models\Message::where('recipient_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    // Legacy partner documents methods (keeping for backward compatibility)
    public function updatePartnerDocuments(Request $request, User $user)
    {
        // This can be deprecated in favor of dynamic document system
        return redirect()->back()->with('info', 'Please use the new dynamic document management system.');
    }

    public function deletePartnerDocument(User $user, string $type)
    {
        // This can be deprecated in favor of dynamic document system
        return redirect()->back()->with('info', 'Please use the new dynamic document management system.');
    }

    public function downloadPartnerDocument(User $user, string $type)
    {
        // This can be deprecated in favor of dynamic document system
        return redirect()->back()->with('info', 'Please use the new dynamic document management system.');
    }

    public function updatePackageDocuments(Request $request, User $user, Package $package)
    {
        // Keep this for package-specific documents that are attached to packages
        // This is separate from partner documents
        return redirect()->back()->with('info', 'Package documents management coming soon.');
    }

    public function deletePackageDocument(User $user, Package $package, $type)
    {
        return redirect()->back()->with('info', 'Package documents management coming soon.');
    }
}
