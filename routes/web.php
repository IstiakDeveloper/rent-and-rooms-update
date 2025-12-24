<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\PackageController as FrontendPackageController;
use App\Http\Controllers\Frontend\CheckoutController;
use App\Http\Controllers\Frontend\JoinWithUsController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PackageController as AdminPackageController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\CountryController;
use App\Http\Controllers\Admin\CityController;
use App\Http\Controllers\Admin\AreaController;
use App\Http\Controllers\Admin\AmenityController;
use App\Http\Controllers\Admin\AmenityTypeController;
use App\Http\Controllers\Admin\MaintainController;
use App\Http\Controllers\Admin\MaintainTypeController;
use App\Http\Controllers\Admin\PropertyController;
use App\Http\Controllers\Admin\PropertyTypeController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\MailController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AdminBookingController;
use App\Http\Controllers\Admin\AdminBookingEditController;
use App\Http\Controllers\Admin\ManageUserController;
use App\Http\Controllers\Guest\DashboardController as GuestDashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

// Public Utility Routes
Route::get('/migrate', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);
        return response()->json([
            'success' => true,
            'message' => 'Migration completed successfully!',
            'output' => Artisan::output()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Migration failed: ' . $e->getMessage()
        ], 500);
    }
});

Route::get('/setup-storage', function () {
    $source = storage_path('app/public');
    $destination = public_path('storage');

    if (!File::exists($destination)) {
        File::makeDirectory($destination, 0755, true);
    }

    File::copyDirectory($source, $destination);

    return 'Storage folder created and files copied!';
});


Route::get('/storage-link', function () {
    try {
        Artisan::call('storage:link');
        return response()->json([
            'success' => true,
            'message' => 'Storage link created successfully!',
            'output' => Artisan::output()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Storage link failed: ' . $e->getMessage()
        ], 500);
    }
});

// Home page
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::post('/set-country', [HomeController::class, 'setCountry'])->name('set.country');

// Join With Us page
Route::get('/join-with-us', [App\Http\Controllers\Frontend\JoinWithUsController::class, 'index'])->name('join.with.us');

// Properties (Frontend)
Route::get('/properties', [FrontendPackageController::class, 'index'])->name('properties.index');
Route::get('/properties/{partnerSlug}/{packageSlug}', [FrontendPackageController::class, 'show'])->name('properties.show');

// Store checkout data route
Route::post('/store-checkout-data', [App\Http\Controllers\Frontend\CheckoutController::class, 'storeCheckoutData'])->name('store.checkout.data');


// Checkout Routes - Requires authentication and email verification
Route::middleware(['auth', 'verified'])->prefix('checkout')->name('checkout.')->group(function () {
    Route::get('/', [CheckoutController::class, 'index'])->name('index');
    Route::post('/submit', [CheckoutController::class, 'submitBooking'])->name('submit');
});

// Stripe Routes - Requires authentication and email verification
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/stripe/success/{booking}', [CheckoutController::class, 'stripeSuccess'])->name('stripe.success');
    Route::get('/stripe/cancel/{booking}', [CheckoutController::class, 'stripeCancel'])->name('stripe.cancel');
});

// Booking Complete Route - Requires authentication and email verification
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/booking/complete/{booking}', [CheckoutController::class, 'bookingComplete'])->name('booking.complete');
});

// Booking Verification Routes - Requires authentication
Route::middleware(['auth'])->group(function () {
    Route::get('/booking/verification/pending/{booking}', [CheckoutController::class, 'verificationPending'])->name('booking.verification.pending');
    Route::get('/booking/verify/{booking}/{token}', [CheckoutController::class, 'verifyBooking'])->name('booking.verify')->middleware('signed');
    Route::post('/booking/{booking}/resend-verification', [CheckoutController::class, 'resendVerification'])->name('booking.resend.verification');
});

// Public Payment Link Route (must be outside admin middleware)
Route::get('/pay/{uniqueId}', [PaymentController::class, 'showPublicPaymentLink'])->name('payment.link.public');
Route::post('/pay/{uniqueId}/process', [PaymentController::class, 'processPublicPayment'])->name('payment.link.process');

// Default Dashboard - Redirects based on user role
Route::get('/dashboard', function () {
    $user = Auth::user();

    if (!$user) {
        return redirect()->route('login');
    }

    // First check Spatie roles (if assigned)
    if (method_exists($user, 'hasRole')) {
        // Super Admin, Admin, and Partner go to admin dashboard
        if ($user->hasRole(['Super Admin', 'Admin', 'Partner'])) {
            return redirect()->route('admin.dashboard');
        }

        // Guest or User role goes to guest dashboard
        if ($user->hasRole(['Guest', 'User'])) {
            return redirect()->route('guest.dashboard');
        }
    }

    // Check role column as fallback
    if (isset($user->role)) {
        // Admin roles
        if (in_array($user->role, ['Super Admin', 'Admin', 'Partner'])) {
            return redirect()->route('admin.dashboard');
        }

        // Guest/User roles - including plain 'User' role
        if (in_array($user->role, ['Guest', 'User', 'user', 'guest'])) {
            return redirect()->route('guest.dashboard');
        }
    }

    // Default: If role is not recognized, send to guest dashboard
    return redirect()->route('guest.dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Profile Routes - For all authenticated users (no prefix)
Route::middleware(['auth'])->group(function () {
    // Common profile routes for all users
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile', [ProfileController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.update-password');
    Route::post('/profile/user-detail', [ProfileController::class, 'updateUserDetail'])->name('profile.update-user-detail');
    Route::post('/profile/agreement', [ProfileController::class, 'updateAgreementDetail'])->name('profile.update-agreement');
    Route::delete('/profile/agreement', [ProfileController::class, 'deleteAgreementDetail'])->name('profile.delete-agreement');
    Route::post('/profile/bank', [ProfileController::class, 'updateBankDetail'])->name('profile.update-bank');

    // Guest/User document routes (simple documents)
    Route::middleware(['role:Guest,User'])->group(function () {
        Route::post('/profile/documents', [ProfileController::class, 'uploadDocument'])->name('profile.upload-document');
        Route::post('/profile/documents/{id}', [ProfileController::class, 'updateDocument'])->name('profile.update-document');
        Route::delete('/profile/documents/{id}', [ProfileController::class, 'deleteDocument'])->name('profile.delete-document');
        Route::get('/profile/documents/{document}/{field}/download', [ProfileController::class, 'downloadDocument'])->name('profile.download-document');
        Route::post('/profile/id-proof', [ProfileController::class, 'updateIdProof'])->name('profile.update-id-proof');
    });

    // Partner-specific routes (only for Partners)
    Route::middleware(['role:Partner'])->group(function () {
        // Partner Personal Documents (Fixed Fields)
        Route::post('/profile/partner-documents', [\App\Http\Controllers\Admin\ProfileController::class, 'updatePartnerDocuments'])->name('profile.update-partner-documents');
        Route::delete('/profile/partner-documents/{type}', [\App\Http\Controllers\Admin\ProfileController::class, 'deletePartnerDocument'])->name('profile.delete-partner-document');
        Route::get('/profile/partner-documents/{type}/download', [\App\Http\Controllers\Admin\ProfileController::class, 'downloadPartnerDocument'])->name('profile.download-partner-document');

        // Package Documents (Dynamic - only for Partners)
        Route::post('/profile/package-documents', [\App\Http\Controllers\Admin\ProfileController::class, 'addPackageDocument'])->name('profile.add-package-document');
        Route::match(['put', 'post'], '/profile/package-documents/{documentId}', [\App\Http\Controllers\Admin\ProfileController::class, 'updatePackageDocument'])->name('profile.update-package-document');
        Route::delete('/profile/package-documents/{documentId}', [\App\Http\Controllers\Admin\ProfileController::class, 'deletePackageDocument'])->name('profile.delete-package-document');
        Route::get('/profile/package-documents/{documentId}/download', [\App\Http\Controllers\Admin\ProfileController::class, 'downloadPackageDocument'])->name('profile.download-package-document');
    });
});

// Guest Routes - For regular users (guests, users, and partners)
Route::middleware(['auth', 'role:Guest,User,Partner'])->prefix('guest')->name('guest.')->group(function () {
    Route::get('/dashboard', [GuestDashboardController::class, 'index'])->name('dashboard');

    // Booking Routes
    Route::get('/bookings', [\App\Http\Controllers\Guest\BookingController::class, 'index'])->name('bookings.index');
    Route::get('/bookings/{id}', [\App\Http\Controllers\Guest\BookingController::class, 'show'])->name('bookings.show');
    Route::post('/bookings/{id}/payment', [\App\Http\Controllers\Guest\BookingController::class, 'processPayment'])->name('bookings.payment');
    Route::post('/bookings/{id}/auto-renewal', [\App\Http\Controllers\Guest\BookingController::class, 'toggleAutoRenewal'])->name('bookings.auto-renewal');
    Route::post('/bookings/{id}/cancel', [\App\Http\Controllers\Guest\BookingController::class, 'cancel'])->name('bookings.cancel');

    // Document Routes
    Route::get('/documents', [\App\Http\Controllers\Guest\DocumentController::class, 'index'])->name('documents.index');

    // Payment Routes
    Route::get('/payments', [\App\Http\Controllers\Guest\PaymentController::class, 'index'])->name('payments.index');

    // Message Routes
    Route::get('/messages', [\App\Http\Controllers\Guest\MessageController::class, 'index'])->name('messages.index');
    Route::get('/messages/{id}', [\App\Http\Controllers\Guest\MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{id}/mark-as-read', [\App\Http\Controllers\Guest\MessageController::class, 'markAsRead'])->name('messages.mark-read');
    Route::post('/messages/mark-all-read', [\App\Http\Controllers\Guest\MessageController::class, 'markAllAsRead'])->name('messages.mark-all-read');
    Route::delete('/messages/{id}', [\App\Http\Controllers\Guest\MessageController::class, 'destroy'])->name('messages.destroy');

    // Payment Success/Cancel Routes
    Route::get('/payment/success', function () {
        return redirect()->route('guest.bookings.index')->with('success', 'Payment completed successfully!');
    })->name('payment.success');
    Route::get('/payment/cancel', function () {
        return redirect()->route('guest.bookings.index')->with('error', 'Payment was cancelled.');
    })->name('payment.cancel');
});

// Admin Routes
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard - All Admin Roles (Super Admin, Admin, Partner)
    Route::middleware(['role:Super Admin,Admin,Partner'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    });

    // Users - Super Admin & Admin only
    Route::middleware(['role:Super Admin,Admin'])->group(function () {
        Route::resource('users', UserController::class)->only(['index', 'show']);
        Route::patch('/users/{user}/proof-documents', [UserController::class, 'updateProofDocuments'])->name('users.update-proof-documents');
        Route::patch('/users/{user}/bank-details', [UserController::class, 'updateBankDetails'])->name('users.update-bank-details');
        Route::patch('/users/{user}/agreement-details', [UserController::class, 'updateAgreementDetails'])->name('users.update-agreement-details');
        Route::patch('/users/{user}/user-details', [UserController::class, 'updateUserDetails'])->name('users.update-user-details');
        Route::post('/users/{user}/documents', [UserController::class, 'storeDocument'])->name('users.store-document');
        Route::patch('/users/{user}/documents/{document}', [UserController::class, 'updateDocument'])->name('users.update-document');
        Route::delete('/users/{user}/documents/{document}', [UserController::class, 'destroyDocument'])->name('users.destroy-document');
        Route::post('/users/{user}/payments', [UserController::class, 'storePayment'])->name('users.store-payment');
        Route::patch('/users/{user}/payments/{payment}', [UserController::class, 'updatePayment'])->name('users.update-payment');
        Route::delete('/users/{user}/payments/{payment}', [UserController::class, 'destroyPayment'])->name('users.destroy-payment');
        Route::post('/users/{user}/payment-links', [UserController::class, 'generatePaymentLink'])->name('users.generate-payment-link');
        Route::post('/users/{user}/milestones/{milestone}/payment-link', [UserController::class, 'generateMilestonePaymentLink'])->name('users.generate-milestone-payment-link');
        Route::get('/users/{user}/messages', [UserController::class, 'getMessages'])->name('users.messages');
        Route::patch('/users/{user}/payments/{payment}/status', [UserController::class, 'updatePaymentStatus'])->name('users.update-payment-status');
        Route::get('/users/{user}/booking/{booking}/milestones', [UserController::class, 'generateMilestonePaymentLinks'])->name('users.milestone-payment-links');
        Route::post('/users/{user}/booking-payments/{bookingPayment}/payment-link', [UserController::class, 'createMilestonePaymentLink'])->name('users.create-milestone-payment-link');
        Route::get('/users/{user}/booking/{booking}/invoice/download', [UserController::class, 'downloadInvoice'])->name('users.download-invoice');
        Route::post('/users/{user}/booking/{booking}/invoice/email', [UserController::class, 'emailInvoice'])->name('users.email-invoice');
        Route::get('/users/{user}/booking/{booking}/milestones', [UserController::class, 'getBookingMilestones'])->name('users.get-booking-milestones');
        Route::put('/users/{user}/update-info', [UserController::class, 'updateUserInfo'])->name('users.update-info');
        Route::patch('/users/{user}/update-info', [UserController::class, 'updateUser'])->name('users.update-info');
        Route::post('/users/{user}/packages/{package}/documents', [UserController::class, 'updatePackageDocuments'])->name('users.update-package-documents');
        Route::delete('/users/{user}/packages/{package}/documents/{type}', [UserController::class, 'deletePackageDocument'])->name('users.delete-package-document');
        Route::post('/users/{user}/partner-documents', [UserController::class, 'updatePartnerDocuments'])->name('users.update-partner-documents');
        Route::delete('/users/{user}/partner-documents/{type}', [UserController::class, 'deletePartnerDocument'])->name('users.delete-partner-document');
        Route::get('/users/{user}/partner-documents/{type}/download', [UserController::class, 'downloadPartnerDocument'])->name('users.download-partner-document');

        // Dynamic Partner Document Items (New System)
        Route::get('/users/{user}/document-items', [UserController::class, 'getPartnerDocumentItems'])->name('users.get-document-items');
        Route::post('/users/{user}/document-items', [UserController::class, 'addPartnerDocumentItem'])->name('users.add-document-item');
        Route::put('/users/{user}/document-items/{document}', [UserController::class, 'updatePartnerDocumentItem'])->name('users.update-document-item');
        Route::delete('/users/{user}/document-items/{document}', [UserController::class, 'deletePartnerDocumentItem'])->name('users.delete-document-item');
        Route::get('/users/{user}/document-items/{document}/download', [UserController::class, 'downloadPartnerDocumentItem'])->name('users.download-document-item');

        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Packages - All Admin Roles (Super Admin, Admin, Partner)
    Route::middleware(['role:Super Admin,Admin,Partner'])->group(function () {
        Route::resource('packages', AdminPackageController::class);
        Route::post('/packages/{package}/assign', [AdminPackageController::class, 'assign'])->name('packages.assign');
        Route::put('/packages/{package}/documents', [AdminPackageController::class, 'updateDocuments'])->name('packages.update-documents');
        Route::get('/api/cities-by-country', [AdminPackageController::class, 'getCitiesByCountry'])->name('api.cities-by-country');
        Route::get('/api/areas-by-city', [AdminPackageController::class, 'getAreasByCity'])->name('api.areas-by-city');
        Route::get('/api/properties-by-area', [AdminPackageController::class, 'getPropertiesByArea'])->name('api.properties-by-area');
    });

    // Manage Users (CRUD) - Super Admin & Admin only
    Route::middleware(['role:Super Admin,Admin'])->group(function () {
        Route::get('/manage-users', [ManageUserController::class, 'index'])->name('manage-users.index');
        Route::post('/manage-users', [ManageUserController::class, 'store'])->name('manage-users.store');
        Route::put('/manage-users/{user}', [ManageUserController::class, 'update'])->name('manage-users.update');
        Route::delete('/manage-users/{user}', [ManageUserController::class, 'destroy'])->name('manage-users.destroy');
    });

    // Bookings - All Admin Roles (Super Admin, Admin, Partner)
    Route::middleware(['role:Super Admin,Admin,Partner'])->group(function () {
        Route::resource('bookings', BookingController::class);
        Route::patch('/bookings/{booking}/status', [BookingController::class, 'updateStatus'])->name('bookings.update-status');
        Route::patch('/bookings/{booking}/payment-status', [BookingController::class, 'updatePaymentStatus'])->name('bookings.update-payment-status');
        Route::get('/api/room-prices-by-package', [BookingController::class, 'getRoomPricesByPackage'])->name('api.room-prices-by-package');
        Route::get('/admin-bookings/create', [AdminBookingController::class, 'create'])->name('admin-bookings.create');
        Route::post('/admin-bookings', [AdminBookingController::class, 'store'])->name('admin-bookings.store');
        Route::get('/api/package-details/{package}', [AdminBookingController::class, 'getPackageDetails'])->name('api.package-details');
        Route::get('/api/search-users', [AdminBookingController::class, 'searchUsers'])->name('api.search-users');
        Route::get('/api/available-rooms', [AdminBookingController::class, 'getAvailableRooms'])->name('api.available-rooms');
        Route::get('/api/disabled-dates', [AdminBookingController::class, 'getDisabledDates'])->name('api.disabled-dates');
        Route::post('/api/calculate-pricing', [AdminBookingController::class, 'calculatePricing'])->name('api.calculate-pricing');

        // Admin Booking Edit Routes
        Route::get('/bookings/{booking}/admin-edit', [AdminBookingEditController::class, 'edit'])->name('admin-bookings.edit');
        Route::patch('/bookings/{booking}/admin-update', [AdminBookingEditController::class, 'update'])->name('admin-bookings.update');
        Route::post('/bookings/{booking}/extend', [AdminBookingEditController::class, 'extendBooking'])->name('admin-bookings.extend');
        Route::post('/bookings/{booking}/cancel', [AdminBookingEditController::class, 'cancelBooking'])->name('admin-bookings.cancel');
        Route::get('/api/booking-calculation/{booking}', [AdminBookingEditController::class, 'getBookingCalculation'])->name('api.booking-calculation');

        // Admin Booking Edit API Routes (mirror create controller)
        Route::get('/api/edit/search-users', [AdminBookingEditController::class, 'searchUsers'])->name('api.edit.search-users');
        Route::get('/api/edit/package-details/{package}', [AdminBookingEditController::class, 'getPackageDetails'])->name('api.edit.package-details');
        Route::get('/api/edit/available-rooms', [AdminBookingEditController::class, 'getAvailableRooms'])->name('api.edit.available-rooms');
        Route::post('/api/edit/calculate-pricing', [AdminBookingEditController::class, 'calculatePricing'])->name('api.edit.calculate-pricing');
        Route::get('/api/edit/disabled-dates', [AdminBookingEditController::class, 'getDisabledDates'])->name('api.edit.disabled-dates');
    });

    // Countries & Cities - Super Admin & Admin only
    Route::middleware(['role:Super Admin,Admin'])->group(function () {
        Route::resource('countries', CountryController::class);
        Route::resource('cities', CityController::class);
        Route::resource('areas', AreaController::class);

        // Amenities
        Route::resource('amenities', AmenityController::class);
        Route::resource('amenity-types', AmenityTypeController::class);

        // Maintains
        Route::resource('maintains', MaintainController::class);
        Route::resource('maintain-types', MaintainTypeController::class);

        // Properties
        Route::resource('properties', PropertyController::class);
        Route::resource('property-types', PropertyTypeController::class);
    });

    // Payments - All Admin Roles (Super Admin, Admin, Partner)
    Route::middleware(['role:Super Admin,Admin,Partner'])->group(function () {
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
        Route::get('/payments/{payment}/edit', [PaymentController::class, 'edit'])->name('payments.edit');
        Route::match(['put','patch'],'/payments/{payment}', [PaymentController::class, 'update'])->name('payments.update');
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
        Route::patch('/payments/{payment}/status', [PaymentController::class, 'updateStatus'])->name('payments.update-status');
        Route::get('/payment-links', [PaymentController::class, 'paymentLinks'])->name('payment-links.index');
        Route::get('/payment-links/{uniqueId}', [PaymentController::class, 'showPaymentLink'])->name('payment-links.show');
        Route::post('/payment-links/{uniqueId}/process', [PaymentController::class, 'processPayment'])->name('payment-links.process');
        Route::post('/payment-links/generate', [PaymentController::class, 'generatePaymentLink'])->name('payment-links.generate');
        Route::patch('/payment-links/{paymentLink}/revoke', [PaymentController::class, 'revokePaymentLink'])->name('payment-links.revoke');
    });

    // Mail - Super Admin & Admin only
    Route::middleware(['role:Super Admin,Admin'])->group(function () {
        Route::get('/mail', [MailController::class, 'index'])->name('mail.index');
        Route::post('/mail/send', [MailController::class, 'send'])->name('mail.send');
        Route::post('/mail/bulk-notification', [MailController::class, 'sendBulkNotification'])->name('mail.bulk-notification');
    });

    // Admin Profile - All Admin Roles (Super Admin, Admin, Partner)
    Route::middleware(['role:Super Admin,Admin,Partner'])->group(function () {
        Route::get('/profile', [AdminProfileController::class, 'show'])->name('profile.show');
        Route::post('/profile', [AdminProfileController::class, 'updateProfile'])->name('profile.update');
        Route::post('/profile/password', [AdminProfileController::class, 'updatePassword'])->name('profile.update-password');
        Route::post('/profile/user-detail', [AdminProfileController::class, 'updateUserDetail'])->name('profile.update-user-detail');
        Route::post('/profile/agreement', [AdminProfileController::class, 'updateAgreementDetail'])->name('profile.update-agreement');
        Route::delete('/profile/agreement', [AdminProfileController::class, 'deleteAgreementDetail'])->name('profile.delete-agreement');
        Route::post('/profile/bank', [AdminProfileController::class, 'updateBankDetail'])->name('profile.update-bank');
        Route::post('/profile/documents', [AdminProfileController::class, 'storeDocument'])->name('profile.store-document');
        Route::get('/profile/documents/{document}/{field}/download', [AdminProfileController::class, 'downloadDocument'])->name('profile.download-document');
        Route::post('/profile/partner-documents', [AdminProfileController::class, 'updatePartnerDocuments'])->name('profile.update-partner-documents');
        Route::delete('/profile/partner-documents/{type}', [AdminProfileController::class, 'deletePartnerDocument'])->name('profile.delete-partner-document');
        Route::get('/profile/partner-documents/{type}/download', [AdminProfileController::class, 'downloadPartnerDocument'])->name('profile.download-partner-document');
        Route::post('/profile/documents', [AdminProfileController::class, 'uploadDocument'])->name('profile.upload-document');
        Route::post('/profile/documents/{id}', [AdminProfileController::class, 'updateDocument'])->name('profile.update-document');
        Route::delete('/profile/documents/{id}', [AdminProfileController::class, 'deleteDocument'])->name('profile.delete-document');
        Route::post('/profile/id-proof', [AdminProfileController::class, 'updateIdProof'])->name('profile.update-id-proof');
        Route::post('/profile/partner-documents', [AdminProfileController::class, 'updatePartnerDocuments'])->name('profile.update-partner-documents');
        Route::delete('/profile/partner-documents/{type}', [AdminProfileController::class, 'deletePartnerDocument'])->name('profile.delete-partner-document');
    });

    // Settings - Super Admin only
    Route::middleware(['role:Super Admin'])->group(function () {
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::get('/settings/header', [SettingsController::class, 'headerSettings'])->name('settings.header');
        Route::patch('/settings/header', [SettingsController::class, 'updateHeader'])->name('settings.update-header');
        Route::get('/settings/hero', [SettingsController::class, 'heroSettings'])->name('settings.hero');
        Route::patch('/settings/hero', [SettingsController::class, 'updateHeroSection'])->name('settings.update-hero');
        Route::get('/settings/footer', [SettingsController::class, 'footerSettings'])->name('settings.footer');
        Route::patch('/settings/footer', [SettingsController::class, 'updateFooter'])->name('settings.update-footer');
        Route::get('/settings/home-data', [SettingsController::class, 'homeDataSettings'])->name('settings.home-data');
        Route::patch('/settings/home-data', [SettingsController::class, 'updateHomeData'])->name('settings.update-home-data');
        Route::get('/settings/privacy-policy', [SettingsController::class, 'privacyPolicySettings'])->name('settings.privacy-policy');
        Route::patch('/settings/privacy-policy', [SettingsController::class, 'updatePrivacyPolicy'])->name('settings.update-privacy-policy');
        Route::delete('/settings/privacy-policy/{id}', [SettingsController::class, 'deletePrivacyPolicy'])->name('settings.delete-privacy-policy');
        Route::get('/settings/terms-conditions', [SettingsController::class, 'termsConditionsSettings'])->name('settings.terms-conditions');
        Route::patch('/settings/terms-conditions', [SettingsController::class, 'updateTermsConditions'])->name('settings.update-terms-conditions');
        Route::delete('/settings/terms-conditions/{id}', [SettingsController::class, 'deleteTermsCondition'])->name('settings.delete-terms-condition');
        Route::get('/settings/partner-terms-conditions', [SettingsController::class, 'partnerTermsConditionsSettings'])->name('settings.partner-terms-conditions');
        Route::patch('/settings/partner-terms-conditions', [SettingsController::class, 'updatePartnerTermsConditions'])->name('settings.update-partner-terms-conditions');
        Route::delete('/settings/partner-terms-conditions/{id}', [SettingsController::class, 'deletePartnerTermsCondition'])->name('settings.delete-partner-terms-condition');
        Route::post('/settings/social-links', [SettingsController::class, 'storeSocialLink'])->name('settings.store-social-link');
        Route::patch('/settings/social-links/{socialLink}', [SettingsController::class, 'updateSocialLink'])->name('settings.update-social-link');
        Route::delete('/settings/social-links/{socialLink}', [SettingsController::class, 'destroySocialLink'])->name('settings.destroy-social-link');

        // Join Packages Management
        Route::get('/join-packages', [App\Http\Controllers\Admin\JoinPackageController::class, 'index'])->name('join-packages.index');
        Route::post('/join-packages', [App\Http\Controllers\Admin\JoinPackageController::class, 'store'])->name('join-packages.store');
        Route::patch('/join-packages/{package}', [App\Http\Controllers\Admin\JoinPackageController::class, 'update'])->name('join-packages.update');
        Route::delete('/join-packages/{package}', [App\Http\Controllers\Admin\JoinPackageController::class, 'destroy'])->name('join-packages.destroy');
        Route::post('/join-packages/update-order', [App\Http\Controllers\Admin\JoinPackageController::class, 'updateOrder'])->name('join-packages.update-order');
        Route::patch('/join-packages/header/update', [App\Http\Controllers\Admin\JoinPackageController::class, 'updateHeader'])->name('join-packages.update-header');
    });
});

require __DIR__ . '/auth.php';
