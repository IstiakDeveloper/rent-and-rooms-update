<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\JoinPackage;
use App\Models\JoinWithUsHeader;
use App\Models\Footer;
use App\Models\Header;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JoinWithUsController extends Controller
{
    public function index()
    {
        $selectedCountry = session('selectedCountry', 1);

        $header = JoinWithUsHeader::where('is_active', true)->first();
        $packages = JoinPackage::where('is_active', true)
            ->orderBy('display_order')
            ->get();

        // Load common data like Properties/Index
        $footer = Footer::with([
            'footerSectionTwo',
            'footerSectionThree',
            'footerSectionFour.socialLinks'
        ])->first();
        $headerData = Header::first();
        $countries = Country::all();

        return Inertia::render('Frontend/JoinWithUs', [
            'header' => $header,
            'packages' => $packages,
            'footer' => $footer,
            'headerData' => $headerData,
            'countries' => $countries,
            'selectedCountry' => $selectedCountry,
        ]);
    }
}
