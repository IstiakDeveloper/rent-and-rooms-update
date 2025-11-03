<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class MailController extends Controller
{
    public function index()
    {
        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('Admin/Mail/Index', [
            'users' => $users,
        ]);
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'recipient_type' => 'required|string|in:single,multiple,all',
            'user_ids' => 'required_if:recipient_type,single,multiple|array',
            'user_ids.*' => 'exists:users,id',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        try {
            $recipients = [];

            switch ($validated['recipient_type']) {
                case 'single':
                case 'multiple':
                    $recipients = User::whereIn('id', $validated['user_ids'])->get();
                    break;
                case 'all':
                    $recipients = User::all();
                    break;
            }

            foreach ($recipients as $user) {
                // Use Laravel's built-in Mail facade
                // You would typically create a Mailable class for this
                Mail::raw($validated['message'], function ($message) use ($user, $validated) {
                    $message->to($user->email, $user->name)
                           ->subject($validated['subject']);
                });
            }

            return redirect()->back()->with('success', 'Email sent successfully to ' . count($recipients) . ' recipients.');

        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to send email: ' . $e->getMessage());
        }
    }

    public function sendBulkNotification(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|in:info,warning,success,error',
        ]);

        // This would typically integrate with a notification system
        // For now, we'll just send emails to all users

        $users = User::all();

        try {
            foreach ($users as $user) {
                Mail::raw(
                    "Notification: {$validated['title']}\n\n{$validated['message']}",
                    function ($message) use ($user, $validated) {
                        $message->to($user->email, $user->name)
                               ->subject('System Notification: ' . $validated['title']);
                    }
                );
            }

            return redirect()->back()->with('success', 'Bulk notification sent successfully.');

        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to send bulk notification: ' . $e->getMessage());
        }
    }
}
