<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AmenityType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AmenityTypeController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // For now, show all amenity types (will implement role check later)
        $amenityTypes = AmenityType::withCount('amenities')->paginate(15);

        return Inertia::render('Admin/AmenityType/Index', [
            'amenityTypes' => $amenityTypes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/AmenityType/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:amenity_types,type',
        ]);

        $validated['user_id'] = Auth::id();

        AmenityType::create($validated);

        return redirect()->route('admin.amenity-types.index')
            ->with('success', 'Amenity type created successfully.');
    }

    public function edit(AmenityType $amenityType)
    {
        return Inertia::render('Admin/AmenityType/Edit', [
            'amenityType' => $amenityType,
        ]);
    }

    public function update(Request $request, AmenityType $amenityType)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:amenity_types,type,' . $amenityType->id,
        ]);

        $amenityType->update($validated);

        return redirect()->route('admin.amenity-types.index')
            ->with('success', 'Amenity type updated successfully.');
    }

    public function destroy(AmenityType $amenityType)
    {
        // Check if amenity type has amenities
        if ($amenityType->amenities()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete amenity type that has amenities associated with it.');
        }

        $amenityType->delete();

        return redirect()->route('admin.amenity-types.index')
            ->with('success', 'Amenity type deleted successfully.');
    }
}
