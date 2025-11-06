<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\City;
use App\Models\Area;
use App\Models\Country;
use App\Models\Amenity;
use App\Models\Footer;
use App\Models\Header;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PackageController extends Controller
{
    public function index(Request $request)
    {
        $selectedCountry = session('selectedCountry', 1);

        // Get all filters
        $cities = City::where('country_id', $selectedCountry)->get();
        $areas = Area::when($request->city_id, function($query) use ($request) {
            return $query->where('city_id', $request->city_id);
        })->get();
        $amenities = Amenity::all();

        // Build query
        $query = Package::with([
            'country',
            'city',
            'area',
            'property',
            'photos',
            'rooms.roomPrices',
            'entireProperty.prices',
            'amenities',
            'maintains',
            'creator',
            'assignedPartner'
        ])
        ->where('status', 'active')
        ->where('country_id', $selectedCountry);

        // Apply filters
        if ($request->filled('city_id')) {
            $query->where('city_id', $request->city_id);
        }

        if ($request->filled('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%");
            });
        }

        // Price range filter
        if ($request->filled('min_price') || $request->filled('max_price')) {
            $query->where(function($q) use ($request) {
                // Check rooms prices
                $q->whereHas('rooms.roomPrices', function($roomQuery) use ($request) {
                    if ($request->filled('min_price')) {
                        $roomQuery->where('fixed_price', '>=', $request->min_price);
                    }
                    if ($request->filled('max_price')) {
                        $roomQuery->where('fixed_price', '<=', $request->max_price);
                    }
                })
                // Or check entire property prices
                ->orWhereHas('entireProperty.prices', function($propertyQuery) use ($request) {
                    if ($request->filled('min_price')) {
                        $propertyQuery->where('price', '>=', $request->min_price);
                    }
                    if ($request->filled('max_price')) {
                        $propertyQuery->where('price', '<=', $request->max_price);
                    }
                });
            });
        }

        // Number of rooms filter
        if ($request->filled('rooms')) {
            $query->where('number_of_rooms', '>=', $request->rooms);
        }

        // Amenities filter
        if ($request->filled('amenities')) {
            $amenityIds = is_array($request->amenities) ? $request->amenities : explode(',', $request->amenities);
            foreach ($amenityIds as $amenityId) {
                $query->whereHas('amenities', function($q) use ($amenityId) {
                    $q->where('amenities.id', $amenityId);
                });
            }
        }        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        switch ($sortBy) {
            case 'price_low':
                $query->leftJoin('rooms', 'packages.id', '=', 'rooms.package_id')
                      ->leftJoin('room_prices', 'rooms.id', '=', 'room_prices.room_id')
                      ->orderBy('room_prices.fixed_price', 'asc')
                      ->select('packages.*');
                break;
            case 'price_high':
                $query->leftJoin('rooms', 'packages.id', '=', 'rooms.package_id')
                      ->leftJoin('room_prices', 'rooms.id', '=', 'room_prices.room_id')
                      ->orderBy('room_prices.fixed_price', 'desc')
                      ->select('packages.*');
                break;
            case 'name':
                $query->orderBy('name', $sortOrder);
                break;
            default:
                $query->orderBy('created_at', $sortOrder);
        }

        // Pagination
        $perPage = $request->get('per_page', 12);
        $packages = $query->paginate($perPage)->withQueryString();

        // Get price range for slider
        $priceRange = [
            'min' => 0,
            'max' => 1000
        ];

        // Load common data
        $footer = Footer::with([
            'footerSectionTwo',
            'footerSectionThree',
            'footerSectionFour.socialLinks'
        ])->first();
        $header = Header::first();
        $countries = Country::all();

        return Inertia::render('Frontend/Properties/Index', [
            'packages' => $packages,
            'cities' => $cities,
            'areas' => $areas,
            'amenities' => $amenities,
            'priceRange' => $priceRange,
            'filters' => [
                'search' => $request->search,
                'city_id' => $request->city_id,
                'area_id' => $request->area_id,
                'property_id' => $request->property_id,
                'min_price' => $request->min_price,
                'max_price' => $request->max_price,
                'rooms' => $request->rooms,
                'amenities' => $request->amenities,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
                'per_page' => $perPage,
            ],
            'footer' => $footer,
            'header' => $header,
            'countries' => $countries,
            'selectedCountry' => $selectedCountry,
        ]);
    }

    public function show(Request $request, $partnerSlug, $packageSlug)
    {
        try {
            $package = Package::with([
                'creator',
                'assignedPartner',
                'country',
                'city',
                'area',
                'property',
                'rooms.roomPrices',
                'photos',
                'amenities',
                'maintains.maintainType',
                'packageAmenities' => function($query) {
                    $query->with('amenity');
                },
                'packageMaintains' => function($query) {
                    $query->with('maintain.maintainType');
                },
                'instructions',
                'bookings' => function($query) {
                    $query->whereNotIn('payment_status', ['cancelled', 'refunded']);
                }
            ])
                ->where(function ($query) use ($partnerSlug) {
                    $query->whereHas('assignedPartner', function ($q) use ($partnerSlug) {
                        $q->whereRaw('LOWER(REPLACE(name, " ", "-")) = ?', [strtolower($partnerSlug)]);
                    })
                        ->orWhereHas('creator', function ($q) use ($partnerSlug) {
                            $q->whereRaw('LOWER(REPLACE(name, " ", "-")) = ?', [strtolower($partnerSlug)]);
                        });
                })
                ->where(function ($query) use ($packageSlug) {
                    // Check if packageSlug is numeric (ID) or string (name)
                    if (is_numeric($packageSlug)) {
                        $query->where('id', $packageSlug);
                    } else {
                        // Extract the ID if it's in format "123-package-name"
                        if (preg_match('/^(\d+)-/', $packageSlug, $matches)) {
                            $query->where('id', $matches[1]);
                        } else {
                            $query->whereRaw('LOWER(REPLACE(name, " ", "-")) = ?', [strtolower($packageSlug)]);
                        }
                    }
                })
                ->firstOrFail();

            // Get related packages (same city)
            $relatedPackages = Package::with(['photos', 'city', 'area', 'rooms.roomPrices'])
                ->where('status', 'active')
                ->where('city_id', $package->city_id)
                ->where('id', '!=', $package->id)
                ->take(4)
                ->get();

            // Load common data
            $footer = Footer::with([
                'footerSectionTwo',
                'footerSectionThree',
                'footerSectionFour.socialLinks'
            ])->first();
            $header = Header::first();
            $countries = Country::all();
            $selectedCountry = session('selectedCountry', 1);

            // Debug: Log package data
            Log::info('Package Show - Services Data:', [
                'package_id' => $package->id,
                'amenities' => $package->amenities ? $package->amenities->toArray() : null,
                'maintains' => $package->maintains ? $package->maintains->toArray() : null,
                'packageAmenities' => $package->packageAmenities ? $package->packageAmenities->toArray() : null,
                'packageMaintains' => $package->packageMaintains ? $package->packageMaintains->toArray() : null,
            ]);

            return Inertia::render('Frontend/Properties/Show', [
                'package' => $package,
                'relatedPackages' => $relatedPackages,
                'footer' => $footer,
                'header' => $header,
                'countries' => $countries,
                'selectedCountry' => $selectedCountry,
            ]);

        } catch (\Exception $e) {
            abort(404, 'Package not found.');
        }
    }
}
