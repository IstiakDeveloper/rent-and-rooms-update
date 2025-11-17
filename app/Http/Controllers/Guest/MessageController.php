<?php

namespace App\Http\Controllers\Guest;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MessageController extends Controller
{
    /**
     * Display a listing of user's messages
     */
    public function index()
    {
        $messages = Message::where('recipient_id', Auth::id())
            ->with('sender:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'title' => $message->title ?? 'No Subject',
                    'message' => $message->message,
                    'is_read' => (bool) $message->is_read,
                    'created_at' => $message->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $message->created_at->diffForHumans(),
                    'sender' => [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name,
                    ],
                ];
            });

        $unreadCount = Message::where('recipient_id', Auth::id())
            ->where('is_read', false)
            ->count();

        return Inertia::render('Guest/Messages/Index', [
            'messages' => $messages,
            'unreadCount' => $unreadCount,
        ]);
    }

    /**
     * Display a specific message
     */
    public function show($id)
    {
        $message = Message::where('recipient_id', Auth::id())
            ->with('sender:id,name')
            ->findOrFail($id);

        // Mark as read
        if (!$message->is_read) {
            $message->update(['is_read' => true]);
        }

        return Inertia::render('Guest/Messages/Show', [
            'message' => [
                'id' => $message->id,
                'title' => $message->title ?? 'No Subject',
                'message' => $message->message,
                'is_read' => (bool) $message->is_read,
                'created_at' => $message->created_at->format('Y-m-d H:i:s'),
                'created_at_formatted' => $message->created_at->format('d M, Y H:i'),
                'sender' => [
                    'id' => $message->sender->id,
                    'name' => $message->sender->name,
                ],
            ],
        ]);
    }

    /**
     * Mark a message as read
     */
    public function markAsRead($id)
    {
        $message = Message::where('recipient_id', Auth::id())
            ->findOrFail($id);

        $message->update(['is_read' => true]);

        return back()->with('success', 'Message marked as read');
    }

    /**
     * Mark all messages as read
     */
    public function markAllAsRead()
    {
        Message::where('recipient_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return back()->with('success', 'All messages marked as read');
    }

    /**
     * Delete a message
     */
    public function destroy($id)
    {
        $message = Message::where('recipient_id', Auth::id())
            ->findOrFail($id);

        $message->delete();

        return redirect()->route('guest.messages.index')
            ->with('success', 'Message deleted successfully');
    }
}
