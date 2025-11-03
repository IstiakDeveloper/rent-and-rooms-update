<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Country;
use App\Models\Property;
use App\Models\PropertyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PropertyController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // For now, show all properties (will implement role check later)
        $properties = Property::with(['country', 'city', 'propertyType', 'user'])->paginate(15);

        return Inertia::render('Admin/Property/Index', [
            'properties' => $properties,
        ]);
    }

    public function create()
    {
        $countries = Country::all();
        $cities = collect(); // Empty initially
        $propertyTypes = PropertyType::all();

        return Inertia::render('Admin/Property/Create', [
            'countries' => $countries,
            'cities' => $cities,
            'propertyTypes' => $propertyTypes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'city_id' => 'required|exists:cities,id',
            'property_type_id' => 'required|exists:property_types,id',
            'name' => 'required|string|max:255',
            'photo' => 'nullable|image|max:2048',
        ]);

        $validated['user_id'] = Auth::id();

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('property_photos', 'public');
        }

        Property::create($validated);

        return redirect()->route('admin.properties.index')
            ->with('success', 'Property created successfully.');
    }

    public function edit(Property $property)
    {
        $countries = Country::all();
        $cities = City::where('country_id', $property->country_id)->get();
        $propertyTypes = PropertyType::all();

        return Inertia::render('Admin/Property/Edit', [
            'property' => $property,
            'countries' => $countries,
            'cities' => $cities,
            'propertyTypes' => $propertyTypes,
        ]);
    }

    public function update(Request $request, Property $property)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'city_id' => 'required|exists:cities,id',
            'property_type_id' => 'required|exists:property_types,id',
            'name' => 'required|string|max:255',
            'photo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($property->photo) {
                Storage::disk('public')->delete($property->photo);
            }

            $validated['photo'] = $request->file('photo')->store('property_photos', 'public');
        }

        $property->update($validated);

        return redirect()->route('admin.properties.index')
            ->with('success', 'Property updated successfully.');
    }

    public function destroy(Property $property)
    {
        // Check if property has packages
        if ($property->packages()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete property that has packages associated with it.');
        }

        // Delete photo if exists
        if ($property->photo) {
            Storage::disk('public')->delete($property->photo);
        }

        $property->delete();

        return redirect()->route('admin.properties.index')
            ->with('success', 'Property deleted successfully.');
    }
}
