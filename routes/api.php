<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\RoomAvailabilityController;
use App\Http\Controllers\Frontend\CheckoutController;
use App\Models\City;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Room availability API routes
Route::get('/room-booked-dates/{roomId}', [RoomAvailabilityController::class, 'getBookedDates']);
Route::post('/check-room-availability', [RoomAvailabilityController::class, 'checkAvailability']);

// Get cities by country
Route::get('/countries/{country}/cities', function ($countryId) {
    return City::where('country_id', $countryId)->get(['id', 'name']);
});
