<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\City;
use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AreaController extends Controller
{
    public function index()
    {
        $areas = Area::with(['country', 'city'])->paginate(15);

        return Inertia::render('Admin/Area/Index', [
            'areas' => $areas,
        ]);
    }

    public function create()
    {
        $countries = Country::all();
        // Load UK cities by default (UK ID = 1)
        $ukCountry = Country::where('name', 'LIKE', '%UK%')->orWhere('name', 'LIKE', '%United Kingdom%')->first();
        $cities = $ukCountry ? City::where('country_id', $ukCountry->id)->get(['id', 'name']) : collect();

        return Inertia::render('Admin/Area/Create', [
            'countries' => $countries,
            'cities' => $cities,
            'defaultCountryId' => $ukCountry?->id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'city_id' => 'required|exists:cities,id',
            'name' => 'required|string|max:255',
            'photo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('area_photos', 'public');
        }

        Area::create($validated);

        return redirect()->route('admin.areas.index')
            ->with('success', 'Area created successfully.');
    }

    public function edit(Area $area)
    {
        $countries = Country::all();
        $cities = City::where('country_id', $area->country_id)->get();

        return Inertia::render('Admin/Area/Edit', [
            'area' => $area,
            'countries' => $countries,
            'cities' => $cities,
        ]);
    }

    public function update(Request $request, Area $area)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'city_id' => 'required|exists:cities,id',
            'name' => 'required|string|max:255',
            'photo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($area->photo) {
                Storage::disk('public')->delete($area->photo);
            }

            $validated['photo'] = $request->file('photo')->store('area_photos', 'public');
        }

        $area->update($validated);

        return redirect()->route('admin.areas.index')
            ->with('success', 'Area updated successfully.');
    }

    public function destroy(Area $area)
    {
        // Check if area has packages or properties
        if ($area->packages()->count() > 0 || $area->properties()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete area that has packages or properties associated with it.');
        }

        // Delete photo if exists
        if ($area->photo) {
            Storage::disk('public')->delete($area->photo);
        }

        $area->delete();

        return redirect()->route('admin.areas.index')
            ->with('success', 'Area deleted successfully.');
    }
}
