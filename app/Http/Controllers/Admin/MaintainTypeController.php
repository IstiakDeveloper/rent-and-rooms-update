<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaintainType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MaintainTypeController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // For now, show all maintain types (will implement role check later)
        $maintainTypes = MaintainType::withCount('maintains')->paginate(15);

        return Inertia::render('Admin/MaintainType/Index', [
            'maintainTypes' => $maintainTypes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/MaintainType/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:maintain_types,type',
        ]);

        $validated['user_id'] = Auth::id();

        MaintainType::create($validated);

        return redirect()->route('admin.maintain-types.index')
            ->with('success', 'Maintain type created successfully.');
    }

    public function edit(MaintainType $maintainType)
    {
        return Inertia::render('Admin/MaintainType/Edit', [
            'maintainType' => $maintainType,
        ]);
    }

    public function update(Request $request, MaintainType $maintainType)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255|unique:maintain_types,type,' . $maintainType->id,
        ]);

        $maintainType->update($validated);

        return redirect()->route('admin.maintain-types.index')
            ->with('success', 'Maintain type updated successfully.');
    }

    public function destroy(MaintainType $maintainType)
    {
        // Check if maintain type has maintains
        if ($maintainType->maintains()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete maintain type that has maintains associated with it.');
        }

        $maintainType->delete();

        return redirect()->route('admin.maintain-types.index')
            ->with('success', 'Maintain type deleted successfully.');
    }
}
