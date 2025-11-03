<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Header;
use App\Models\HeroSection;
use App\Models\Footer;
use App\Models\FooterSectionTwo;
use App\Models\FooterSectionThree;
use App\Models\FooterSectionFour;
use App\Models\SocialLink;
use App\Models\HomeData;
use App\Models\HomeDataItem;
use App\Models\PrivacyPolicy;
use App\Models\TermsCondition;
use App\Models\PartnerTermsCondition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Settings/Index');
    }

    // Header Settings
    public function headerSettings()
    {
        $header = Header::first();

        return Inertia::render('Admin/Settings/Header', [
            'header' => $header,
        ]);
    }

    public function updateHeader(Request $request)
    {
        $validated = $request->validate([
            'logo' => 'nullable|image|max:1024',
        ]);

        $header = Header::firstOrCreate([]);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($header->logo) {
                Storage::disk('public')->delete($header->logo);
            }

            $logoPath = $request->file('logo')->store('logos', 'public');
            $header->logo = $logoPath;
        }

        $header->save();

        return redirect()->back()->with('success', 'Header updated successfully.');
    }

    // Hero Section Settings
    public function heroSettings()
    {
        $heroSection = HeroSection::first();

        return Inertia::render('Admin/Settings/HeroSection', [
            'heroSection' => $heroSection,
        ]);
    }

    public function updateHeroSection(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string',
            'description' => 'nullable|string',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|url',
            'background_image' => 'nullable|image|max:2048',
        ]);

        $heroSection = HeroSection::firstOrCreate([]);

        if ($request->hasFile('background_image')) {
            // Delete old image if exists
            if ($heroSection->background_image) {
                Storage::disk('public')->delete($heroSection->background_image);
            }

            $imagePath = $request->file('background_image')->store('hero_images', 'public');
            $validated['background_image'] = $imagePath;
        }

        $heroSection->update($validated);

        return redirect()->back()->with('success', 'Hero section updated successfully.');
    }

    // Footer Settings
    public function footerSettings()
    {
        $footer = Footer::first();
        $footerSectionTwo = FooterSectionTwo::first();
        $footerSectionThree = FooterSectionThree::first();
        $footerSectionFour = FooterSectionFour::first();
        $socialLinks = SocialLink::all();

        return Inertia::render('Admin/Settings/Footer', [
            'footer' => $footer,
            'footerSectionTwo' => $footerSectionTwo,
            'footerSectionThree' => $footerSectionThree,
            'footerSectionFour' => $footerSectionFour,
            'socialLinks' => $socialLinks,
        ]);
    }

    public function updateFooter(Request $request)
    {
        $validated = $request->validate([
            'logo' => 'nullable|image|max:1024',
            'description' => 'nullable|string',
            'copyright' => 'nullable|string',
        ]);

        $footer = Footer::firstOrCreate([]);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($footer->logo) {
                Storage::disk('public')->delete($footer->logo);
            }

            $logoPath = $request->file('logo')->store('footer_logos', 'public');
            $validated['logo'] = $logoPath;
        }

        $footer->update($validated);

        return redirect()->back()->with('success', 'Footer updated successfully.');
    }

    // Home Data Settings
    public function homeDataSettings()
    {
        $homeData = HomeData::with('homeDataItems')->first();

        return Inertia::render('Admin/Settings/HomeData', [
            'homeData' => $homeData,
        ]);
    }

    public function updateHomeData(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'array',
            'items.*.title' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.icon' => 'nullable|string',
        ]);

        $homeData = HomeData::firstOrCreate([]);
        $homeData->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
        ]);

        // Update home data items
        $homeData->homeDataItems()->delete();
        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $itemData) {
                $homeData->homeDataItems()->create($itemData);
            }
        }

        return redirect()->back()->with('success', 'Home data updated successfully.');
    }

    // Privacy Policy Settings
    public function privacyPolicySettings()
    {
        $privacyPolicy = PrivacyPolicy::first();

        return Inertia::render('Admin/Settings/PrivacyPolicy', [
            'privacyPolicy' => $privacyPolicy,
        ]);
    }

    public function updatePrivacyPolicy(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $privacyPolicy = PrivacyPolicy::firstOrCreate([]);
        $privacyPolicy->update($validated);

        return redirect()->back()->with('success', 'Privacy policy updated successfully.');
    }

    // Terms & Conditions Settings
    public function termsConditionsSettings()
    {
        $termsCondition = TermsCondition::first();

        return Inertia::render('Admin/Settings/TermsConditions', [
            'termsCondition' => $termsCondition,
        ]);
    }

    public function updateTermsConditions(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $termsCondition = TermsCondition::firstOrCreate([]);
        $termsCondition->update($validated);

        return redirect()->back()->with('success', 'Terms & conditions updated successfully.');
    }

    // Partner Terms & Conditions Settings
    public function partnerTermsConditionsSettings()
    {
        $partnerTermsCondition = PartnerTermsCondition::first();

        return Inertia::render('Admin/Settings/PartnerTermsConditions', [
            'partnerTermsCondition' => $partnerTermsCondition,
        ]);
    }

    public function updatePartnerTermsConditions(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $partnerTermsCondition = PartnerTermsCondition::firstOrCreate([]);
        $partnerTermsCondition->update($validated);

        return redirect()->back()->with('success', 'Partner terms & conditions updated successfully.');
    }

    // Social Links
    public function storeSocialLink(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'icon' => 'nullable|string|max:255',
        ]);

        SocialLink::create($validated);

        return redirect()->back()->with('success', 'Social link added successfully.');
    }

    public function updateSocialLink(Request $request, SocialLink $socialLink)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'icon' => 'nullable|string|max:255',
        ]);

        $socialLink->update($validated);

        return redirect()->back()->with('success', 'Social link updated successfully.');
    }

    public function destroySocialLink(SocialLink $socialLink)
    {
        $socialLink->delete();

        return redirect()->back()->with('success', 'Social link deleted successfully.');
    }
}
