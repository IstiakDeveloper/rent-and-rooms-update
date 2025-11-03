<?php

namespace App\Livewire\Admin\User;

use App\Models\User;
use App\Models\Message;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;
use Spatie\Permission\Models\Role;

class ManageUserComponent extends Component
{
    public $name, $email, $password, $password_confirmation, $role;
    public $roles, $users;
    public $isOpen = false;
    public $selectedUserId;
    public $messages = [];
    public $isMessageModalOpen = false;
    public $searchTerm = '';
    public $stay_status;
    public $stayStatusOptions = ['Staying', 'Want to Stay'];

    public function mount()
    {
        $this->roles = Role::all();
        $this->users = User::with('bookings')->get();

    }

    public function updatedSearchTerm()
    {

        $this->filterUsers();

    }
    public function updatedStayStatus()
    {
        // Filter users based on stay status
        $this->filterUsers();
    }

    public function loadMessages($userId)
    {
        $this->selectedUserId = $userId;
        $this->messages = Message::where('recipient_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get(); // Fetch messages for the selected user
        $this->isMessageModalOpen = true;
    }

    private function filterUsers()
    {
        $this->users = User::where(function($query) {
            // Search by name or email
            $query->where('name', 'like', '%' . $this->searchTerm . '%')
                  ->orWhere('email', 'like', '%' . $this->searchTerm . '%');
        })
        ->whereHas('userDetail', function ($query) {
            if ($this->stay_status) {
                $query->where('stay_status', $this->stay_status);
            }
        })
        ->get();
    }

    public function createUser()
    {
        $this->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
        ]);

        // Create the user
        $user = User::create([
            'name' => $this->name,
            'email' => $this->email,
            'password' => Hash::make($this->password),
        ]);

        // Assign the selected role to the user
        $user->syncRoles($this->role);

        // Reset input fields
        $this->reset(['name', 'email', 'password']);

        // Refresh user list
        $this->users = User::all();

        flash()->success("User created and role assigned successfully.");
    }

    public function openModal()
    {
        $this->isOpen = true;
    }

    public function closeModal()
    {
        $this->isOpen = false;
    }

    public function deleteUser($userId)
    {
        // Authorization check - only Super Admin can delete users
        $currentUser = Auth::user();
        if (!$currentUser || !$currentUser->roles->pluck('name')->contains('Super Admin')) {
            flash()->error("You don't have permission to delete users.");
            return;
        }

        // Check if the user ID is valid and the user exists
        if (!is_numeric($userId) || !User::find($userId)) {
            flash()->error("Invalid user ID or user not found.");
            return;
        }

        // Prevent deleting own account
        if ($currentUser->id == $userId) {
            flash()->error("You cannot delete your own account.");
            return;
        }

        // Find and delete the user
        $userToDelete = User::find($userId);

        if ($userToDelete) {
            $userToDelete->delete();

            $this->users = User::with('bookings')->get();

            flash()->success("User deleted successfully.");
        } else {
            flash()->error("User not found.");
        }
    }

    public function render()
    {
        return view('livewire.admin.user.manage-user-component', [
            'users' => $this->users,
            'messages' => $this->messages,
        ]);
    }
}
