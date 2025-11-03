<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\AmenityType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AmenityController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // For now, show all amenities (will implement role check later)
        $amenities = Amenity::with('amenityType')->paginate(15);

        $amenityTypes = AmenityType::all();

        return Inertia::render('Admin/Amenity/Index', [
            'amenities' => $amenities,
            'amenityTypes' => $amenityTypes,
        ]);
    }

    public function create()
    {
        $amenityTypes = AmenityType::all();

        return Inertia::render('Admin/Amenity/Create', [
            'amenityTypes' => $amenityTypes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amenity_type_id' => 'required|exists:amenity_types,id',
            'name' => 'required|string|max:255',
        ]);

        $validated['user_id'] = Auth::id();

        Amenity::create($validated);

        return redirect()->route('admin.amenities.index')
            ->with('success', 'Amenity created successfully.');
    }

    public function edit(Amenity $amenity)
    {
        $amenityTypes = AmenityType::all();

        return Inertia::render('Admin/Amenity/Edit', [
            'amenity' => $amenity,
            'amenityTypes' => $amenityTypes,
        ]);
    }

    public function update(Request $request, Amenity $amenity)
    {
        $validated = $request->validate([
            'amenity_type_id' => 'required|exists:amenity_types,id',
            'name' => 'required|string|max:255',
        ]);

        $amenity->update($validated);

        return redirect()->route('admin.amenities.index')
            ->with('success', 'Amenity updated successfully.');
    }

    public function destroy(Amenity $amenity)
    {
        // Check if amenity is being used in packages
        if ($amenity->packageAmenities()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete amenity that is being used in packages.');
        }

        $amenity->delete();

        return redirect()->route('admin.amenities.index')
            ->with('success', 'Amenity deleted successfully.');
    }
}
