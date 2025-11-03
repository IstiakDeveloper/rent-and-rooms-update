<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PropertyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PropertyTypeController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // For now, show all property types (will implement role check later)
        $propertyTypes = PropertyType::withCount('properties')->paginate(15);

        return Inertia::render('Admin/PropertyType/Index', [
            'propertyTypes' => $propertyTypes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/PropertyType/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:property_types,type',
        ]);

        $validated['user_id'] = Auth::id();

        PropertyType::create($validated);

        return redirect()->route('admin.property-types.index')
            ->with('success', 'Property type created successfully.');
    }

    public function edit(PropertyType $propertyType)
    {
        return Inertia::render('Admin/PropertyType/Edit', [
            'propertyType' => $propertyType,
        ]);
    }

    public function update(Request $request, PropertyType $propertyType)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:property_types,type,' . $propertyType->id,
        ]);

        $propertyType->update($validated);

        return redirect()->route('admin.property-types.index')
            ->with('success', 'Property type updated successfully.');
    }

    public function destroy(PropertyType $propertyType)
    {
        // Check if property type has properties
        if ($propertyType->properties()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete property type that has properties associated with it.');
        }

        $propertyType->delete();

        return redirect()->route('admin.property-types.index')
            ->with('success', 'Property type deleted successfully.');
    }
}
