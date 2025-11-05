<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\PackageController as FrontendPackageController;
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
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Home page
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::post('/set-country', [HomeController::class, 'setCountry'])->name('set.country');

// Properties (Frontend)
Route::get('/properties', [FrontendPackageController::class, 'index'])->name('properties.index');
Route::get('/properties/{partnerSlug}/{packageSlug}', [FrontendPackageController::class, 'show'])->name('properties.show');

Route::get('/dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin Routes
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Packages
    Route::resource('packages', AdminPackageController::class);
    Route::post('/packages/{package}/assign', [AdminPackageController::class, 'assign'])->name('packages.assign');
    Route::get('/api/cities-by-country', [AdminPackageController::class, 'getCitiesByCountry'])->name('api.cities-by-country');
    Route::get('/api/areas-by-city', [AdminPackageController::class, 'getAreasByCity'])->name('api.areas-by-city');
    Route::get('/api/properties-by-area', [AdminPackageController::class, 'getPropertiesByArea'])->name('api.properties-by-area');

    // Users
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

    // New routes for Livewire to Controller migration
    Route::patch('/users/{user}/payments/{payment}/status', [UserController::class, 'updatePaymentStatus'])->name('users.update-payment-status');
    Route::get('/users/{user}/booking/{booking}/milestones', [UserController::class, 'generateMilestonePaymentLinks'])->name('users.milestone-payment-links');
    Route::post('/users/{user}/booking-payments/{bookingPayment}/payment-link', [UserController::class, 'createMilestonePaymentLink'])->name('users.create-milestone-payment-link');
    Route::get('/users/{user}/booking/{booking}/invoice/download', [UserController::class, 'downloadInvoice'])->name('users.download-invoice');
    Route::post('/users/{user}/booking/{booking}/invoice/email', [UserController::class, 'emailInvoice'])->name('users.email-invoice');

    // Missing routes for frontend functionality
    Route::get('/users/{user}/booking/{booking}/milestones', [UserController::class, 'getBookingMilestones'])->name('users.get-booking-milestones');
    Route::put('/users/{user}/update-info', [UserController::class, 'updateUserInfo'])->name('users.update-info');
    Route::patch('/users/{user}/update-info', [UserController::class, 'updateUser'])->name('users.update-info');
    Route::post('/users/{user}/packages/{package}/documents', [UserController::class, 'updatePackageDocuments'])->name('users.update-package-documents');
    Route::delete('/users/{user}/packages/{package}/documents/{type}', [UserController::class, 'deletePackageDocument'])->name('users.delete-package-document');

    // User CRUD operations
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Manage Users (CRUD)
    Route::resource('manage-users', ManageUserController::class);
    Route::get('/manage-users/{user}/messages', [ManageUserController::class, 'getMessages'])->name('manage-users.messages');
    Route::post('/manage-users/{user}/send-message', [ManageUserController::class, 'sendMessage'])->name('manage-users.send-message');
    Route::post('/manage-users/bulk-action', [ManageUserController::class, 'bulkAction'])->name('manage-users.bulk-action');
    Route::get('/manage-users/export', [ManageUserController::class, 'exportUsers'])->name('manage-users.export');

    // Bookings
    Route::resource('bookings', BookingController::class);
    Route::get('/api/room-prices-by-package', [BookingController::class, 'getRoomPricesByPackage'])->name('api.room-prices-by-package');    // Admin Booking (Advanced)
    Route::get('/admin-bookings/create', [AdminBookingController::class, 'create'])->name('admin-bookings.create');
    Route::post('/admin-bookings', [AdminBookingController::class, 'store'])->name('admin-bookings.store');
    Route::get('/api/package-details/{package}', [AdminBookingController::class, 'getPackageDetails'])->name('api.package-details');
    Route::get('/api/search-users', [AdminBookingController::class, 'searchUsers'])->name('api.search-users');
    Route::get('/api/available-rooms', [AdminBookingController::class, 'getAvailableRooms'])->name('api.available-rooms');
    Route::post('/api/calculate-pricing', [AdminBookingController::class, 'calculatePricing'])->name('api.calculate-pricing');

    // Admin Booking Edit
    Route::get('/bookings/{booking}/admin-edit', [AdminBookingEditController::class, 'edit'])->name('admin-bookings.edit');
    Route::patch('/bookings/{booking}/admin-update', [AdminBookingEditController::class, 'update'])->name('admin-bookings.update');
    Route::post('/bookings/{booking}/extend', [AdminBookingEditController::class, 'extendBooking'])->name('admin-bookings.extend');
    Route::post('/bookings/{booking}/cancel', [AdminBookingEditController::class, 'cancelBooking'])->name('admin-bookings.cancel');
    Route::get('/api/booking-calculation/{booking}', [AdminBookingEditController::class, 'getBookingCalculation'])->name('api.booking-calculation');

    // Countries & Cities
    Route::resource('countries', CountryController::class);
    Route::resource('cities', CityController::class);    // Areas
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

    // Payments
    Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::get('/payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
    Route::patch('/payments/{payment}/status', [PaymentController::class, 'updateStatus'])->name('payments.update-status');
    Route::get('/payment-links', [PaymentController::class, 'paymentLinks'])->name('payment-links.index');
    Route::get('/payment-links/{uniqueId}', [PaymentController::class, 'showPaymentLink'])->name('payment-links.show');
    Route::post('/payment-links/{uniqueId}/process', [PaymentController::class, 'processPayment'])->name('payment-links.process');
    Route::post('/payment-links/generate', [PaymentController::class, 'generatePaymentLink'])->name('payment-links.generate');
    Route::patch('/payment-links/{paymentLink}/revoke', [PaymentController::class, 'revokePaymentLink'])->name('payment-links.revoke');

    // Mail
    Route::get('/mail', [MailController::class, 'index'])->name('mail.index');
    Route::post('/mail/send', [MailController::class, 'send'])->name('mail.send');
    Route::post('/mail/bulk-notification', [MailController::class, 'sendBulkNotification'])->name('mail.bulk-notification');

    // Admin Profile
    Route::get('/profile', [AdminProfileController::class, 'show'])->name('profile.show');
    Route::patch('/profile', [AdminProfileController::class, 'updateProfile'])->name('profile.update');
    Route::patch('/profile/password', [AdminProfileController::class, 'updatePassword'])->name('profile.update-password');
    Route::patch('/profile/proof-documents', [AdminProfileController::class, 'updateProofDocuments'])->name('profile.update-proof-documents');
    Route::patch('/profile/bank-details', [AdminProfileController::class, 'updateBankDetails'])->name('profile.update-bank-details');
    Route::patch('/profile/agreement-details', [AdminProfileController::class, 'updateAgreementDetails'])->name('profile.update-agreement-details');
    Route::patch('/profile/user-details', [AdminProfileController::class, 'updateUserDetails'])->name('profile.update-user-details');
    Route::post('/profile/documents', [AdminProfileController::class, 'storeDocument'])->name('profile.store-document');
    Route::patch('/profile/documents/{document}', [AdminProfileController::class, 'updateDocument'])->name('profile.update-document');
    Route::delete('/profile/documents/{document}', [AdminProfileController::class, 'destroyDocument'])->name('profile.destroy-document');

    // Settings
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

require __DIR__.'/auth.php';
