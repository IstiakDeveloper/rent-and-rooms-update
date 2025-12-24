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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        // Get all settings data
        $header = Header::first();
        $heroSection = HeroSection::first();
        $footer = Footer::first();
        $footerSectionTwo = FooterSectionTwo::first();
        $footerSectionThree = FooterSectionThree::first();
        $footerSectionFour = FooterSectionFour::with('socialLinks')->first();
        $socialLinks = SocialLink::all();
        $privacyPolicies = PrivacyPolicy::all();
        $termsConditions = TermsCondition::all();
        $partnerTermsConditions = PartnerTermsCondition::all();

        return Inertia::render('Admin/Settings/Index', [
            'header' => $header,
            'heroSection' => $heroSection,
            'footer' => $footer,
            'footerSectionTwo' => $footerSectionTwo,
            'footerSectionThree' => $footerSectionThree,
            'footerSectionFour' => $footerSectionFour,
            'socialLinks' => $socialLinks,
            'privacyPolicies' => $privacyPolicies,
            'termsConditions' => $termsConditions,
            'partnerTermsConditions' => $partnerTermsConditions,
        ]);
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
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        DB::beginTransaction();
        try {
            $header = Header::firstOrCreate([]);

            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($header->logo && Storage::disk('public')->exists($header->logo)) {
                    Storage::disk('public')->delete($header->logo);
                }

                $logoPath = $request->file('logo')->store('logos', 'public');
                $header->logo = $logoPath;
            }

            $header->save();

            DB::commit();
            return redirect()->back()->with('success', 'Header logo updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Header update failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update header: ' . $e->getMessage());
        }
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
            'title_small' => 'nullable|string|max:255',
            'title_big' => 'nullable|string|max:500',
            'background_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        DB::beginTransaction();
        try {
            $heroSection = HeroSection::firstOrCreate([]);

            if ($request->hasFile('background_image')) {
                // Delete old image if exists
                if ($heroSection->background_image && Storage::disk('public')->exists($heroSection->background_image)) {
                    Storage::disk('public')->delete($heroSection->background_image);
                }

                $imagePath = $request->file('background_image')->store('hero_images', 'public');
                $validated['background_image'] = $imagePath;
            }

            $heroSection->update([
                'title_small' => $validated['title_small'] ?? $heroSection->title_small,
                'title_big' => $validated['title_big'] ?? $heroSection->title_big,
                'background_image' => $validated['background_image'] ?? $heroSection->background_image,
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Hero section updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Hero section update failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update hero section: ' . $e->getMessage());
        }
    }

    // Footer Settings
    public function footerSettings()
    {
        $footer = Footer::first();
        $footerSectionTwo = FooterSectionTwo::first();
        $footerSectionThree = FooterSectionThree::first();
        $footerSectionFour = FooterSectionFour::with('socialLinks')->first();
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
            'footer_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'address' => 'nullable|string|max:500',
            'email' => 'nullable|email|max:255',
            'contact_number' => 'nullable|string|max:50',
            'website' => 'nullable|url|max:255',
            'terms_title' => 'nullable|string|max:255',
            'terms_link' => 'nullable|string|max:255',
            'privacy_title' => 'nullable|string|max:255',
            'privacy_link' => 'nullable|string|max:255',
            'rights_reserves_text' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $footer = Footer::firstOrCreate([]);

            if ($request->hasFile('footer_logo')) {
                // Delete old logo if exists
                if ($footer->footer_logo && Storage::disk('public')->exists($footer->footer_logo)) {
                    Storage::disk('public')->delete($footer->footer_logo);
                }

                $logoPath = $request->file('footer_logo')->store('footer_logos', 'public');
                $validated['footer_logo'] = $logoPath;
            }

            $footer->update($validated);

            DB::commit();
            return redirect()->back()->with('success', 'Footer updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Footer update failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update footer: ' . $e->getMessage());
        }
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
        $privacyPolicies = PrivacyPolicy::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Settings/PrivacyPolicy', [
            'privacyPolicies' => $privacyPolicies,
        ]);
    }

    public function updatePrivacyPolicy(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:privacy_policies,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            if (!empty($validated['id'])) {
                // Update existing
                $privacyPolicy = PrivacyPolicy::findOrFail($validated['id']);
                $privacyPolicy->update([
                    'title' => $validated['title'],
                    'content' => $validated['content'],
                ]);
                $message = 'Privacy policy updated successfully!';
            } else {
                // Create new
                PrivacyPolicy::create([
                    'title' => $validated['title'],
                    'content' => $validated['content'],
                ]);
                $message = 'Privacy policy created successfully!';
            }

            DB::commit();
            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Privacy policy update failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to save privacy policy: ' . $e->getMessage());
        }
    }

    public function deletePrivacyPolicy(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $privacyPolicy = PrivacyPolicy::findOrFail($id);
            $privacyPolicy->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Privacy policy deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Privacy policy delete failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete privacy policy: ' . $e->getMessage());
        }
    }

    // Terms & Conditions Settings
    public function termsConditionsSettings()
    {
        $termsConditions = TermsCondition::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Settings/TermsConditions', [
            'termsConditions' => $termsConditions,
        ]);
    }

    public function updateTermsConditions(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:terms_conditions,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            if (!empty($validated['id'])) {
                // Update existing
                $termsCondition = TermsCondition::findOrFail($validated['id']);
                $termsCondition->update([
                    'title' => $validated['title'],
                    'content' => $validated['content'],
                ]);
                $message = 'Terms & conditions updated successfully!';
            } else {
                // Create new
                TermsCondition::create([
                    'title' => $validated['title'],
                    'content' => $validated['content'],
                ]);
                $message = 'Terms & conditions created successfully!';
            }

            DB::commit();
            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Terms & conditions update failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to save terms & conditions: ' . $e->getMessage());
        }
    }

    public function deleteTermsCondition(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $termsCondition = TermsCondition::findOrFail($id);
            $termsCondition->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Terms & conditions deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Terms & conditions delete failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete terms & conditions: ' . $e->getMessage());
        }
    }

    // Partner Terms & Conditions Settings
    public function partnerTermsConditionsSettings()
    {
        $partnerTermsConditions = PartnerTermsCondition::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Settings/PartnerTermsConditions', [
            'partnerTermsConditions' => $partnerTermsConditions,
        ]);
    }

    public function updatePartnerTermsConditions(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|exists:partner_terms_conditions,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            if (!empty($validated['id'])) {
                // Update existing
                $partnerTermsCondition = PartnerTermsCondition::findOrFail($validated['id']);
                $partnerTermsCondition->update([
                    'title' => $validated['title'],
                    'content' => $validated['content'],
                ]);
                $message = 'Partner terms & conditions updated successfully!';
            } else {
                // Create new
                PartnerTermsCondition::create([
                    'title' => $validated['title'],
                    'content' => $validated['content'],
                ]);
                $message = 'Partner terms & conditions created successfully!';
            }

            DB::commit();
            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Partner terms & conditions update failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to save partner terms & conditions: ' . $e->getMessage());
        }
    }

    public function deletePartnerTermsCondition(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $partnerTermsCondition = PartnerTermsCondition::findOrFail($id);
            $partnerTermsCondition->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Partner terms & conditions deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Partner terms & conditions delete failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete partner terms & conditions: ' . $e->getMessage());
        }
    }

    // Social Links
    public function storeSocialLink(Request $request)
    {
        $validated = $request->validate([
            'icon_class' => 'required|string|max:255',
            'link' => 'required|url|max:500',
        ]);

        DB::beginTransaction();
        try {
            // Get or create footer section four
            $footerSectionFour = FooterSectionFour::firstOrCreate([]);

            SocialLink::create([
                'footer_section_four_id' => $footerSectionFour->id,
                'icon_class' => $validated['icon_class'],
                'link' => $validated['link'],
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Social link added successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Social link create failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to add social link: ' . $e->getMessage());
        }
    }

    public function updateSocialLink(Request $request, SocialLink $socialLink)
    {
        $validated = $request->validate([
            'icon_class' => 'required|string|max:255',
            'link' => 'required|url|max:500',
        ]);

        DB::beginTransaction();
        try {
            $socialLink->update($validated);

            DB::commit();
            return redirect()->back()->with('success', 'Social link updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Social link update failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update social link: ' . $e->getMessage());
        }
    }

    public function destroySocialLink(SocialLink $socialLink)
    {
        DB::beginTransaction();
        try {
            $socialLink->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Social link deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Social link delete failed: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete social link: ' . $e->getMessage());
        }
    }
}
