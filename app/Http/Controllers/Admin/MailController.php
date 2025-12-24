<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\UserNotification;
use Inertia\Inertia;

class MailController extends Controller
{
    public function index()
    {
        // Get all users with Guest/User role with their bookings (matching UserController pattern)
        $users = User::role('User')
            ->with(['bookings' => function($query) {
                $query->select('id', 'user_id', 'status');
            }])
            ->get(['id', 'name', 'email'])
            ->map(function($user) {
                // Check if user has any approved bookings (active bookings in the system)
                $activeBookings = $user->bookings->where('status', 'approved');

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'has_active_booking' => $activeBookings->count() > 0,
                ];
            });

        // Get sent messages
        $sentMessages = Message::where('sender_id', auth()->id())
            ->with('recipient:id,name,email')
            ->latest()
            ->get();

        return Inertia::render('Admin/Mail/Index', [
            'users' => $users,
            'sentMessages' => $sentMessages,
        ]);
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'selectedUsers' => 'required|array|min:1',
            'selectedUsers.*' => 'exists:users,id',
            'message' => 'required|string|min:5',
            'subject' => 'nullable|string|max:255',
        ]);

        try {
            $users = User::whereIn('id', $validated['selectedUsers'])->get();
            $userNames = [];
            $failedUsers = [];

            foreach ($users as $user) {
                try {
                    // Send email using Laravel Mail
                    Mail::to($user->email)
                        ->send(new UserNotification(
                            $user->name,
                            $validated['message'],
                            $validated['subject'] ?? 'Important Notification'
                        ));

                    // Save message to database
                    Message::create([
                        'sender_id' => auth()->id(),
                        'recipient_id' => $user->id,
                        'message' => $validated['message'],
                    ]);

                    $userNames[] = $user->name;

                } catch (\Exception $e) {
                    Log::error("Email failed to {$user->email}: " . $e->getMessage());
                    $failedUsers[] = $user->name;
                }
            }

            if (!empty($userNames)) {
                $message = 'Emails successfully sent to: ' . implode(', ', $userNames);
                if (!empty($failedUsers)) {
                    $message .= '. Failed to send to: ' . implode(', ', $failedUsers);
                }
                return redirect()->back()->with('success', $message);
            } else {
                return redirect()->back()->with('error', 'Failed to send emails to all recipients.');
            }

        } catch (\Exception $e) {
            Log::error('Mail send error: ' . $e->getMessage());
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to send emails: ' . $e->getMessage());
        }
    }
}
