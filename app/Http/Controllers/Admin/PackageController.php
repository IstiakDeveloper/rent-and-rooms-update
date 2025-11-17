<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Area;
use App\Models\City;
use App\Models\Country;
use App\Models\Maintain;
use App\Models\Package;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PackageController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $with = ['creator', 'assignedPartner', 'assignedBy', 'country', 'city', 'area', 'property'];

        // For now, show all packages (will implement role check later)
        $packages = Package::with($with)->get();

        return Inertia::render('Admin/Package/Index', [
            'packages' => $packages,
            'countries' => Country::all(),
            'cities' => City::all(),
            'areas' => Area::all(),
            'properties' => Property::all(),
            'maintains' => Maintain::all(),
            'amenities' => Amenity::all(),
        ]);
    }

    public function show(Package $package)
    {
        $package->load([
            'creator',
            'assignedPartner',
            'assignedBy',
            'country',
            'city',
            'area',
            'property',
            'packageMaintains.maintain',
            'packageAmenities.amenity',
            'photos',
            'rooms.roomPrices'
        ]);

        return Inertia::render('Admin/Package/Show', [
            'package' => $package,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Package/Create', [
            'countries' => Country::all(),
            'cities' => City::all(),
            'areas' => Area::all(),
            'properties' => Property::all(),
            'maintains' => Maintain::all(),
            'amenities' => Amenity::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'city_id' => 'required|exists:cities,id',
            'area_id' => 'required|exists:areas,id',
            'property_id' => 'required|exists:properties,id',
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'map_link' => 'nullable|url',
            'number_of_rooms' => 'required|integer|min:1',
            'number_of_kitchens' => 'required|integer|min:0',
            'seating' => 'required|integer|min:1',
            'details' => 'nullable|string',
            'video_link' => 'nullable|url',
            'common_bathrooms' => 'required|integer|min:0',
            'maintains' => 'array',
            'amenities' => 'array',
        ]);

        $validated['user_id'] = Auth::id();

        $package = Package::create($validated);

        // Attach maintains and amenities
        if (!empty($validated['maintains'])) {
            $package->packageMaintains()->createMany(
                collect($validated['maintains'])->map(function ($maintainId) {
                    return ['maintain_id' => $maintainId];
                })
            );
        }

        if (!empty($validated['amenities'])) {
            $package->packageAmenities()->createMany(
                collect($validated['amenities'])->map(function ($amenityId) {
                    return ['amenity_id' => $amenityId];
                })
            );
        }

        return redirect()->route('admin.packages.index')
            ->with('success', 'Package created successfully.');
    }

    public function edit(Package $package)
    {
        $package->load([
            'packageMaintains.maintain',
            'packageAmenities.amenity'
        ]);

        return Inertia::render('Admin/Package/Edit', [
            'package' => $package,
            'countries' => Country::all(),
            'cities' => City::all(),
            'areas' => Area::all(),
            'properties' => Property::all(),
            'maintains' => Maintain::all(),
            'amenities' => Amenity::all(),
        ]);
    }

    public function update(Request $request, Package $package)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'city_id' => 'required|exists:cities,id',
            'area_id' => 'required|exists:areas,id',
            'property_id' => 'required|exists:properties,id',
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'map_link' => 'nullable|url',
            'number_of_rooms' => 'required|integer|min:1',
            'number_of_kitchens' => 'required|integer|min:0',
            'seating' => 'required|integer|min:1',
            'details' => 'nullable|string',
            'video_link' => 'nullable|url',
            'common_bathrooms' => 'required|integer|min:0',
            'maintains' => 'array',
            'amenities' => 'array',
        ]);

        $package->update($validated);

        // Sync maintains
        $package->packageMaintains()->delete();
        if (!empty($validated['maintains'])) {
            $package->packageMaintains()->createMany(
                collect($validated['maintains'])->map(function ($maintainId) {
                    return ['maintain_id' => $maintainId];
                })
            );
        }

        // Sync amenities
        $package->packageAmenities()->delete();
        if (!empty($validated['amenities'])) {
            $package->packageAmenities()->createMany(
                collect($validated['amenities'])->map(function ($amenityId) {
                    return ['amenity_id' => $amenityId];
                })
            );
        }

        return redirect()->route('admin.packages.index')
            ->with('success', 'Package updated successfully.');
    }

    public function destroy(Package $package)
    {
        $package->delete();

        return redirect()->route('admin.packages.index')
            ->with('success', 'Package deleted successfully.');
    }

    public function assign(Request $request, Package $package)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $package->update([
            'assigned_to' => $validated['user_id'],
            'assigned_by' => Auth::id(),
            'assigned_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'Package assigned successfully.');
    }

    public function getCitiesByCountry(Request $request)
    {
        $cities = City::where('country_id', $request->country_id)->get();
        return response()->json($cities);
    }

    public function getAreasByCity(Request $request)
    {
        $areas = Area::where('city_id', $request->city_id)->get();
        return response()->json($areas);
    }

    public function getPropertiesByArea(Request $request)
    {
        $properties = Property::where('area_id', $request->area_id)->get();
        return response()->json($properties);
    }

    public function updateDocuments(Request $request, Package $package)
    {
        $validated = $request->validate([
            'document_types' => 'required|array',
            'documents' => 'required|array',
            'documents.*' => 'nullable|file|mimes:pdf,jpeg,png,jpg|max:2048',
        ]);

        foreach ($validated['document_types'] as $index => $type) {
            if ($request->hasFile("documents.{$type}")) {
                $file = $request->file("documents.{$type}");
                $path = $file->store('package_documents', 'public');

                // Check if document already exists
                $document = $package->documents()->where('type', $type)->first();

                if ($document) {
                    // Delete old file
                    if ($document->path && Storage::disk('public')->exists($document->path)) {
                        Storage::disk('public')->delete($document->path);
                    }
                    // Update with new file
                    $document->update(['path' => $path, 'updated_at' => now()]);
                } else {
                    // Create new document
                    $package->documents()->create([
                        'type' => $type,
                        'path' => $path,
                        'expires_at' => now()->addYear(), // Default 1 year expiry
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Package documents updated successfully.');
    }
}
