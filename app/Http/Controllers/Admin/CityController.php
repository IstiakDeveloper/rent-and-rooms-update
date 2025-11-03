<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CityController extends Controller
{
    public function index()
    {
        $cities = City::with('country')->paginate(15);

        return Inertia::render('Admin/City/Index', [
            'cities' => $cities,
        ]);
    }

    public function create()
    {
        $countries = Country::all();

        return Inertia::render('Admin/City/Create', [
            'countries' => $countries,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
        ]);

        City::create($validated);

        return redirect()->route('admin.cities.index')
            ->with('success', 'City created successfully.');
    }

    public function edit(City $city)
    {
        $countries = Country::all();

        return Inertia::render('Admin/City/Edit', [
            'city' => $city,
            'countries' => $countries,
        ]);
    }

    public function update(Request $request, City $city)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
        ]);

        $city->update($validated);

        return redirect()->route('admin.cities.index')
            ->with('success', 'City updated successfully.');
    }

    public function destroy(City $city)
    {
        if ($city->areas()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete city that has areas associated with it.');
        }

        $city->delete();

        return redirect()->route('admin.cities.index')
            ->with('success', 'City deleted successfully.');
    }
}
