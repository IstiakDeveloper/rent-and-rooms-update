<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class ManageUserController extends Controller
{
    public function index(Request $request)
    {
        $searchTerm = $request->get('search');
        $stayStatus = $request->get('stay_status');

        $users = User::with(['userDetail', 'bookings.package'])
            ->when($searchTerm, function ($query) use ($searchTerm) {
                $query->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%");
            })
            ->when($stayStatus, function ($query) use ($stayStatus) {
                $query->whereHas('userDetail', function ($q) use ($stayStatus) {
                    $q->where('stay_status', $stayStatus);
                });
            })
            ->paginate(15);

        $stayStatusOptions = ['Staying', 'Want to Stay'];

        return Inertia::render('Admin/ManageUser/Index', [
            'users' => $users,
            'stayStatusOptions' => $stayStatusOptions,
            'filters' => [
                'search' => $searchTerm,
                'stay_status' => $stayStatus,
            ],
        ]);
    }

    public function create()
    {
        // For now, we'll use simple role strings instead of Spatie roles
        $roles = ['User', 'Partner', 'Super Admin'];

        return Inertia::render('Admin/ManageUser/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:User,Partner,Super Admin',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'], // Store role directly in user table for now
        ]);

        return redirect()->route('admin.manage-users.index')
            ->with('success', 'User created successfully.');
    }

    public function show(User $user)
    {
        $user->load([
            'userDetail',
            'bankDetail',
            'agreementDetail',
            'documents',
            'bookings.package'
        ]);

        return Inertia::render('Admin/ManageUser/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user)
    {
        $roles = ['User', 'Partner', 'Super Admin'];

        return Inertia::render('Admin/ManageUser/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|in:User,Partner,Super Admin',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return redirect()->route('admin.manage-users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $currentUser = Auth::user();

        // Authorization check - only Super Admin can delete users
        if (!$currentUser || $currentUser->role !== 'Super Admin') {
            return redirect()->back()
                ->with('error', "You don't have permission to delete users.");
        }

        // Prevent deleting own account
        if ($currentUser->id === $user->id) {
            return redirect()->back()
                ->with('error', "You cannot delete your own account.");
        }

        // Check if user has active bookings
        if ($user->bookings()->whereIn('status', ['confirmed', 'pending'])->count() > 0) {
            return redirect()->back()
                ->with('error', "Cannot delete user with active bookings.");
        }

        $user->delete();

        return redirect()->route('admin.manage-users.index')
            ->with('success', 'User deleted successfully.');
    }

    public function getMessages(User $user)
    {
        $messages = Message::where('recipient_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Admin/ManageUser/Messages', [
            'user' => $user,
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request, User $user)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        Message::create([
            'sender_id' => Auth::id(),
            'recipient_id' => $user->id,
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'is_read' => false,
        ]);

        return redirect()->back()
            ->with('success', 'Message sent successfully.');
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|string|in:delete,activate,deactivate',
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $currentUser = Auth::user();

        // Authorization check
        if (!$currentUser || $currentUser->role !== 'Super Admin') {
            return redirect()->back()
                ->with('error', "You don't have permission to perform bulk actions.");
        }

        $userIds = $validated['user_ids'];
        
        // Remove current user from bulk delete action
        if ($validated['action'] === 'delete') {
            $userIds = array_filter($userIds, function($id) use ($currentUser) {
                return $id !== $currentUser->id;
            });
        }

        switch ($validated['action']) {
            case 'delete':
                $users = User::whereIn('id', $userIds)
                    ->whereDoesntHave('bookings', function($query) {
                        $query->whereIn('status', ['confirmed', 'pending']);
                    })
                    ->get();

                foreach ($users as $user) {
                    $user->delete();
                }

                return redirect()->back()
                    ->with('success', count($users) . ' users deleted successfully.');

            case 'activate':
                User::whereIn('id', $userIds)->update(['status' => 'active']);
                
                return redirect()->back()
                    ->with('success', 'Users activated successfully.');

            case 'deactivate':
                User::whereIn('id', $userIds)->update(['status' => 'inactive']);
                
                return redirect()->back()
                    ->with('success', 'Users deactivated successfully.');

            default:
                return redirect()->back()
                    ->with('error', 'Invalid action.');
        }
    }

    public function exportUsers(Request $request)
    {
        $searchTerm = $request->get('search');
        $stayStatus = $request->get('stay_status');

        $users = User::with(['userDetail', 'bookings.package'])
            ->when($searchTerm, function ($query) use ($searchTerm) {
                $query->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('email', 'like', "%{$searchTerm}%");
            })
            ->when($stayStatus, function ($query) use ($stayStatus) {
                $query->whereHas('userDetail', function ($q) use ($stayStatus) {
                    $q->where('stay_status', $stayStatus);
                });
            })
            ->get();

        // This would typically generate CSV/Excel export
        // For now, just return JSON data
        return response()->json([
            'users' => $users,
            'exported_at' => now(),
            'total_count' => $users->count(),
        ]);
    }
}