<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JoinPackage;
use App\Models\JoinWithUsHeader;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JoinPackageController extends Controller
{
    public function index()
    {
        $packages = JoinPackage::orderBy('display_order')->get();
        $header = JoinWithUsHeader::first();

        return Inertia::render('Admin/JoinPackages/Index', [
            'packages' => $packages,
            'header' => $header,
        ]);
    }

    public function updateHeader(Request $request)
    {
        $validated = $request->validate([
            'main_title' => 'required|string|max:255',
            'subtitle' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $header = JoinWithUsHeader::first();
        if ($header) {
            $header->update($validated);
        } else {
            JoinWithUsHeader::create($validated);
        }

        return redirect()->back()->with('success', 'Header updated successfully.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:500',
            'description' => 'required|string',
            'whats_included' => 'required|array',
            'whats_included.*' => 'string',
            'ideal_for' => 'nullable|string',
            'price' => 'nullable|string|max:255',
            'price_note' => 'nullable|string|max:255',
            'display_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        JoinPackage::create($validated);

        return redirect()->back()->with('success', 'Package created successfully.');
    }

    public function update(Request $request, JoinPackage $package)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:500',
            'description' => 'required|string',
            'whats_included' => 'required|array',
            'whats_included.*' => 'string',
            'ideal_for' => 'nullable|string',
            'price' => 'nullable|string|max:255',
            'price_note' => 'nullable|string|max:255',
            'display_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $package->update($validated);

        return redirect()->back()->with('success', 'Package updated successfully.');
    }

    public function destroy(JoinPackage $package)
    {
        $package->delete();

        return redirect()->back()->with('success', 'Package deleted successfully.');
    }

    public function updateOrder(Request $request)
    {
        $validated = $request->validate([
            'packages' => 'required|array',
            'packages.*.id' => 'required|exists:join_packages,id',
            'packages.*.display_order' => 'required|integer',
        ]);

        foreach ($validated['packages'] as $packageData) {
            JoinPackage::where('id', $packageData['id'])
                ->update(['display_order' => $packageData['display_order']]);
        }

        return redirect()->back()->with('success', 'Package order updated successfully.');
    }
}
