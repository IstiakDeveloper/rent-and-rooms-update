<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CountryController extends Controller
{
    public function index()
    {
        $countries = Country::with('cities')->paginate(15);

        return Inertia::render('Admin/Country/Index', [
            'countries' => $countries,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Country/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:countries,name',
        ]);

        Country::create($validated);

        return redirect()->route('admin.countries.index')
            ->with('success', 'Country created successfully.');
    }

    public function edit(Country $country)
    {
        return Inertia::render('Admin/Country/Edit', [
            'country' => $country,
        ]);
    }

    public function update(Request $request, Country $country)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:countries,name,' . $country->id,
        ]);

        $country->update($validated);

        return redirect()->route('admin.countries.index')
            ->with('success', 'Country updated successfully.');
    }

    public function destroy(Country $country)
    {
        if ($country->cities()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete country that has cities associated with it.');
        }

        $country->delete();

        return redirect()->route('admin.countries.index')
            ->with('success', 'Country deleted successfully.');
    }
}
