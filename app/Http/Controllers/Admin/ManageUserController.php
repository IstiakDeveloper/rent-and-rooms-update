<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class ManageUserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');
        $roleFilter = $request->get('role');
        $status = $request->get('status');

        $users = User::with(['roles', 'bookings'])
            ->when($search, function ($query) use ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($roleFilter, function ($query) use ($roleFilter) {
                $query->whereHas('roles', function($q) use ($roleFilter) {
                    $q->where('name', $roleFilter);
                });
            })
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Transform users to include role name, bookings count, check-in/out dates
        $users->getCollection()->transform(function ($user) {
            $user->role_name = $user->roles->first()?->name ?? 'No Role';
            $user->bookings_count = $user->bookings->count();

            // Get the most recent booking (active or latest)
            $activeBooking = $user->bookings->where('status', 'active')->first();

            if ($activeBooking) {
                // If there's an active booking, show its dates
                $user->check_in_date = $activeBooking->from_date;
                $user->check_out_date = $activeBooking->to_date;
                $user->booking_status = $activeBooking->status;
            } else {
                // Otherwise, show the most recent booking
                $latestBooking = $user->bookings->sortByDesc('created_at')->first();
                if ($latestBooking) {
                    $user->check_in_date = $latestBooking->from_date;
                    $user->check_out_date = $latestBooking->to_date;
                    $user->booking_status = $latestBooking->status;
                } else {
                    $user->check_in_date = null;
                    $user->check_out_date = null;
                    $user->booking_status = null;
                }
            }

            return $user;
        });

        // Get roles from Spatie Role model
        $availableRoles = Role::pluck('name')->toArray();
        $statuses = ['active', 'inactive'];

        return Inertia::render('Admin/ManageUsers/Index', [
            'users' => $users,
            'roles' => $availableRoles,
            'statuses' => $statuses,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'status' => $status,
            ],
        ]);
    }

    public function store(Request $request)
    {
        // Get available role names from Spatie
        $availableRoles = Role::pluck('name')->toArray();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'string', Rule::in($availableRoles)],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        // Create user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'],
        ]);

        // Assign Spatie role
        $user->assignRole($validated['role']);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        // Get available role names from Spatie
        $availableRoles = Role::pluck('name')->toArray();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['required', 'string', 'max:20'],
            'role' => ['required', 'string', Rule::in($availableRoles)],
            'status' => ['required', 'string', 'in:active,inactive'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        // Update basic user info
        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'status' => $validated['status'],
        ];

        // Only update password if provided
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Sync Spatie role
        $user->syncRoles([$validated['role']]);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        try {
            // This will trigger the model's deleting event which checks for bookings
            $user->delete();
            return back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

}



