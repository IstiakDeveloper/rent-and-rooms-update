<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Maintain;
use App\Models\MaintainType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MaintainController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // For now, show all maintains (will implement role check later)
        $maintains = Maintain::with('maintainType')->paginate(15);

        $maintainTypes = MaintainType::all();

        return Inertia::render('Admin/Maintain/Index', [
            'maintains' => $maintains,
            'maintainTypes' => $maintainTypes,
        ]);
    }

    public function create()
    {
        $maintainTypes = MaintainType::all();

        return Inertia::render('Admin/Maintain/Create', [
            'maintainTypes' => $maintainTypes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'maintain_type_id' => 'required|exists:maintain_types,id',
            'name' => 'required|string|max:255',
            'photo' => 'nullable|image|max:2048',
        ]);

        $validated['user_id'] = Auth::id();

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('maintain_photos', 'public');
        }

        Maintain::create($validated);

        return redirect()->route('admin.maintains.index')
            ->with('success', 'Maintain created successfully.');
    }

    public function edit(Maintain $maintain)
    {
        $maintainTypes = MaintainType::all();

        return Inertia::render('Admin/Maintain/Edit', [
            'maintain' => $maintain,
            'maintainTypes' => $maintainTypes,
        ]);
    }

    public function update(Request $request, Maintain $maintain)
    {
        $validated = $request->validate([
            'maintain_type_id' => 'required|exists:maintain_types,id',
            'name' => 'required|string|max:255',
            'photo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($maintain->photo) {
                Storage::disk('public')->delete($maintain->photo);
            }

            $validated['photo'] = $request->file('photo')->store('maintain_photos', 'public');
        }

        $maintain->update($validated);

        return redirect()->route('admin.maintains.index')
            ->with('success', 'Maintain updated successfully.');
    }

    public function destroy(Maintain $maintain)
    {
        // Check if maintain is being used in packages
        if ($maintain->packageMaintains()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete maintain that is being used in packages.');
        }

        // Delete photo if exists
        if ($maintain->photo) {
            Storage::disk('public')->delete($maintain->photo);
        }

        $maintain->delete();

        return redirect()->route('admin.maintains.index')
            ->with('success', 'Maintain deleted successfully.');
    }
}
