<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\City;
use App\Models\Country;
use App\Models\Footer;
use App\Models\Header;
use App\Models\HeroSection;
use App\Models\HomeData;
use App\Models\Package;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $selectedCountry = session('selectedCountry', 1); // Default to United Kingdom

        // Load cities for selected country
        $cities = City::where('country_id', $selectedCountry)->get();

        // Load areas if city is selected
        $areas = [];
        if ($request->filled('city_id')) {
            $areas = Area::where('city_id', $request->city_id)->get();
        }

        // Search packages
        $packages = null;
        $noPackagesFound = false;

        if ($request->filled('city_id') || $request->filled('area_id') || $request->filled('keyword')) {
            $query = Package::with(['country', 'city', 'area', 'rooms.roomPrices', 'entireProperty.prices', 'photos', 'creator', 'assignedPartner']);

            if ($selectedCountry) {
                $query->where('country_id', $selectedCountry);
            }
            if ($request->filled('city_id')) {
                $query->where('city_id', $request->city_id);
            }
            if ($request->filled('area_id')) {
                $query->where('area_id', $request->area_id);
            }
            if ($request->filled('keyword')) {
                $keyword = $request->keyword;
                $query->where(function($q) use ($keyword) {
                    $q->where('name', 'like', '%' . $keyword . '%')
                      ->orWhere('address', 'like', '%' . $keyword . '%');
                });
            }

            $packages = $query->get();
            $noPackagesFound = $packages->isEmpty();
        }

        // Featured packages
        $featuredPackages = Package::with(['country', 'city', 'area', 'rooms.roomPrices', 'entireProperty.prices', 'photos', 'creator', 'assignedPartner'])
            ->take(8)
            ->get();

        // Hero section
        $heroSection = HeroSection::first();

        // Header data
        $header = Header::first();

        // Footer data
        $footer = Footer::with([
            'footerSectionTwo',
            'footerSectionThree',
            'footerSectionFour.socialLinks'
        ])->first();

        // Home data sections
        $homeData = HomeData::with('items')->get();

        // All countries for selector
        $countries = Country::all();

        return Inertia::render('Frontend/Home', [
            'cities' => $cities,
            'areas' => $areas,
            'packages' => $packages,
            'noPackagesFound' => $noPackagesFound,
            'featuredPackages' => $featuredPackages,
            'heroSection' => $heroSection,
            'header' => $header,
            'footer' => $footer,
            'homeData' => $homeData,
            'countries' => $countries,
            'selectedCountry' => $selectedCountry,
            'filters' => [
                'city_id' => $request->city_id,
                'area_id' => $request->area_id,
                'keyword' => $request->keyword,
            ],
        ]);
    }

    public function setCountry(Request $request)
    {
        $countryId = $request->input('country_id', 1);
        session(['selectedCountry' => $countryId]);

        return response()->json(['success' => true]);
    }
}
