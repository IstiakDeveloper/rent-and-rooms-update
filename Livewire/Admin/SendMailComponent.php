<?php

namespace App\Livewire\Admin;

use App\Models\Message;
use App\Models\User;
use Livewire\Component;
use SendGrid\Mail\Mail as SendGridMail;

class SendMailComponent extends Component
{
    public $selectedUsers = [];
    public $allUsersSelected = false;
    public $message = '';
    public $loading = false;
    public $sentMessages = [];
    public $searchUsers = '';

    protected $rules = [
        'message' => 'required|string|min:5',
        'selectedUsers' => 'required|array|min:1',
    ];

    public function render()
    {
        // Fetch all users with role 'User'
        $users = User::role('User')->get();
        // $users = User::all();
        // Fetch sent messages
        $this->sentMessages = Message::where('sender_id', auth()->id())->latest()->get();

        return view('livewire.admin.send-mail-component', [
            'users' => $users,
            'filteredUsers' => $this->getFilteredUsers(),
        ]);
    }

    public function getFilteredUsers()
    {
        return User::role('User')
            ->when($this->searchUsers, function($query) {
                $query->where(function($q) {
                    $q->where('name', 'like', '%' . $this->searchUsers . '%')
                      ->orWhere('email', 'like', '%' . $this->searchUsers . '%');
                });
            })
            ->get();
    }

    public function updatedAllUsersSelected()
    {
        if ($this->allUsersSelected) {
            // Select all user IDs
            $this->selectedUsers = User::role('User')->pluck('id')->toArray();
        } else {
            $this->selectedUsers = [];
        }
    }

    public function sendEmails()
    {
        // Validate the input
        $this->validate();
        $this->loading = true; // Start loading

        // Fetch the selected users
        $users = User::whereIn('id', $this->selectedUsers)->get();
        $userNames = [];
        
        $sendgrid = new \SendGrid(env('SENDGRID_API_KEY'));
        foreach ($users as $user) {
            try {
                $email = new SendGridMail();
                $email->setFrom("rentandrooms@gmail.com", "Rent and Rooms");
                $email->setSubject("Important Notification");
                $email->addTo($user->email, $user->name);
                
                $textContent = "Hello {$user->name},\n\n{$this->message}";
                $htmlContent = "<strong>Hello {$user->name}</strong><br>" . nl2br($this->message);
        
                $email->addContent("text/plain", $textContent);
                $email->addContent("text/html", $htmlContent);
        
                $sendgrid->send($email);
        
                Message::create([
                    'sender_id' => auth()->id(),
                    'recipient_id' => $user->id,
                    'message' => $this->message,
                ]);
        
                $userNames[] = $user->name;
        
            } catch (\Exception $e) {
                logger('check');
                \Log::error("Email failed to {$user->email}: " . $e->getMessage());
                session()->flash('error', 'Failed to send email to ' . $user->name);
            }
        }


        // Format user names for success message
        $userNamesString = implode(', ', $userNames);

        // Flash success message if emails are sent
        if (!empty($userNames)) {
            session()->flash('message', 'Emails and messages successfully sent to: ' . $userNamesString);
        }

        // Reset fields after sending
        $this->selectedUsers = [];
        $this->message = '';
        $this->allUsersSelected = false;
        $this->searchUsers = ''; // Reset search input

        $this->loading = false; // Stop loading
    }

    public function removeUser($userId)
    {
        $this->selectedUsers = array_filter($this->selectedUsers, function($id) use ($userId) {
            return $id != $userId;
        });
    }
}
