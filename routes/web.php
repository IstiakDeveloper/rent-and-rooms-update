<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\PackageController as FrontendPackageController;
use App\Http\Controllers\Frontend\CheckoutController;
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
Route::get('/migrate', function() {
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

Route::get('/storage-link', function() {
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


// Properties (Frontend)
Route::get('/properties', [FrontendPackageController::class, 'index'])->name('properties.index');
Route::get('/properties/{partnerSlug}/{packageSlug}', [FrontendPackageController::class, 'show'])->name('properties.show');

// Store checkout data route
Route::post('/store-checkout-data', [App\Http\Controllers\Frontend\CheckoutController::class, 'storeCheckoutData'])->name('store.checkout.data');


// Checkout Routes
Route::middleware(['auth'])->prefix('checkout')->name('checkout.')->group(function () {
    Route::get('/', [CheckoutController::class, 'index'])->name('index');
    Route::post('/submit', [CheckoutController::class, 'submitBooking'])->name('submit');
});

// Stripe Routes
Route::get('/stripe/success/{booking}', [CheckoutController::class, 'stripeSuccess'])->name('stripe.success');
Route::get('/stripe/cancel/{booking}', [CheckoutController::class, 'stripeCancel'])->name('stripe.cancel');

// Booking Complete Route
Route::get('/booking/complete/{booking}', [CheckoutController::class, 'bookingComplete'])->name('booking.complete');

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

// Guest Routes - For regular users (guests and users)
Route::middleware(['auth', 'role:Guest,User'])->prefix('guest')->name('guest.')->group(function () {
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

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile', [ProfileController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.update-password');
    Route::post('/profile/user-detail', [ProfileController::class, 'updateUserDetail'])->name('profile.update-user-detail');
    Route::post('/profile/agreement', [ProfileController::class, 'updateAgreementDetail'])->name('profile.update-agreement');
    Route::delete('/profile/agreement', [ProfileController::class, 'deleteAgreementDetail'])->name('profile.delete-agreement');
    Route::post('/profile/bank', [ProfileController::class, 'updateBankDetail'])->name('profile.update-bank');
    Route::post('/profile/documents', [ProfileController::class, 'uploadDocument'])->name('profile.upload-document');
    Route::post('/profile/documents/{id}', [ProfileController::class, 'updateDocument'])->name('profile.update-document');
    Route::delete('/profile/documents/{id}', [ProfileController::class, 'deleteDocument'])->name('profile.delete-document');
    Route::post('/profile/id-proof', [ProfileController::class, 'updateIdProof'])->name('profile.update-id-proof');

    // Message Routes
    Route::get('/messages', [\App\Http\Controllers\Guest\MessageController::class, 'index'])->name('messages.index');
    Route::get('/messages/{id}', [\App\Http\Controllers\Guest\MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{id}/mark-as-read', [\App\Http\Controllers\Guest\MessageController::class, 'markAsRead'])->name('messages.mark-read');
    Route::post('/messages/mark-all-read', [\App\Http\Controllers\Guest\MessageController::class, 'markAllAsRead'])->name('messages.mark-all-read');
    Route::delete('/messages/{id}', [\App\Http\Controllers\Guest\MessageController::class, 'destroy'])->name('messages.destroy');

    // Payment Success/Cancel Routes
    Route::get('/payment/success', function() {
        return redirect()->route('guest.bookings.index')->with('success', 'Payment completed successfully!');
    })->name('payment.success');
    Route::get('/payment/cancel', function() {
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
        Route::put('/manage-users/{user}', [ManageUserController::class, 'update'])->name('manage-users.update');
        Route::delete('/manage-users/{user}', [ManageUserController::class, 'destroy'])->name('manage-users.destroy');
    });

    // Bookings - All Admin Roles (Super Admin, Admin, Partner)
    Route::middleware(['role:Super Admin,Admin,Partner'])->group(function () {
        Route::resource('bookings', BookingController::class);
        Route::get('/api/room-prices-by-package', [BookingController::class, 'getRoomPricesByPackage'])->name('api.room-prices-by-package');
        Route::get('/admin-bookings/create', [AdminBookingController::class, 'create'])->name('admin-bookings.create');
        Route::post('/admin-bookings', [AdminBookingController::class, 'store'])->name('admin-bookings.store');
        Route::get('/api/package-details/{package}', [AdminBookingController::class, 'getPackageDetails'])->name('api.package-details');
        Route::get('/api/search-users', [AdminBookingController::class, 'searchUsers'])->name('api.search-users');
        Route::get('/api/available-rooms', [AdminBookingController::class, 'getAvailableRooms'])->name('api.available-rooms');
        Route::post('/api/calculate-pricing', [AdminBookingController::class, 'calculatePricing'])->name('api.calculate-pricing');
        Route::get('/bookings/{booking}/admin-edit', [AdminBookingEditController::class, 'edit'])->name('admin-bookings.edit');
        Route::patch('/bookings/{booking}/admin-update', [AdminBookingEditController::class, 'update'])->name('admin-bookings.update');
        Route::post('/bookings/{booking}/extend', [AdminBookingEditController::class, 'extendBooking'])->name('admin-bookings.extend');
        Route::post('/bookings/{booking}/cancel', [AdminBookingEditController::class, 'cancelBooking'])->name('admin-bookings.cancel');
        Route::get('/api/booking-calculation/{booking}', [AdminBookingEditController::class, 'getBookingCalculation'])->name('api.booking-calculation');
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
        Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
        Route::post('/profile', [ProfileController::class, 'updateProfile'])->name('profile.update');
        Route::post('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.update-password');
        Route::post('/profile/user-detail', [ProfileController::class, 'updateUserDetail'])->name('profile.update-user-detail');
        Route::post('/profile/agreement', [ProfileController::class, 'updateAgreementDetail'])->name('profile.update-agreement');
        Route::delete('/profile/agreement', [ProfileController::class, 'deleteAgreementDetail'])->name('profile.delete-agreement');
        Route::post('/profile/bank', [ProfileController::class, 'updateBankDetail'])->name('profile.update-bank');
        Route::post('/profile/documents', [ProfileController::class, 'uploadDocument'])->name('profile.upload-document');
        Route::post('/profile/documents/{id}', [ProfileController::class, 'updateDocument'])->name('profile.update-document');
        Route::delete('/profile/documents/{id}', [ProfileController::class, 'deleteDocument'])->name('profile.delete-document');
        Route::post('/profile/id-proof', [ProfileController::class, 'updateIdProof'])->name('profile.update-id-proof');
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
        Route::get('/settings/terms-conditions', [SettingsController::class, 'termsConditionsSettings'])->name('settings.terms-conditions');
        Route::patch('/settings/terms-conditions', [SettingsController::class, 'updateTermsConditions'])->name('settings.update-terms-conditions');
        Route::get('/settings/partner-terms-conditions', [SettingsController::class, 'partnerTermsConditionsSettings'])->name('settings.partner-terms-conditions');
        Route::patch('/settings/partner-terms-conditions', [SettingsController::class, 'updatePartnerTermsConditions'])->name('settings.update-partner-terms-conditions');
        Route::post('/settings/social-links', [SettingsController::class, 'storeSocialLink'])->name('settings.store-social-link');
        Route::patch('/settings/social-links/{socialLink}', [SettingsController::class, 'updateSocialLink'])->name('settings.update-social-link');
        Route::delete('/settings/social-links/{socialLink}', [SettingsController::class, 'destroySocialLink'])->name('settings.destroy-social-link');
    });
});

require __DIR__.'/auth.php';
