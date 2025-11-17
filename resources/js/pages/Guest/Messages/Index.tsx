import { Head, router } from '@inertiajs/react';
import GuestDashboardLayout from '@/layouts/GuestDashboardLayout';
import { useState } from 'react';
import { Mail, MailOpen, Trash2, Eye, X, CheckCheck } from 'lucide-react';

interface Sender {
    id: number;
    name: string;
}

interface Message {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    created_at_human: string;
    sender: Sender;
}

interface Props {
    messages: Message[];
    unreadCount: number;
}

export default function Index({ messages, unreadCount }: Props) {
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleShowMessage = (message: Message) => {
        setSelectedMessage(message);
        setShowModal(true);

        // Mark as read if unread
        if (!message.is_read) {
            router.post(
                `/guest/messages/${message.id}/mark-as-read`,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                }
            );
        }
    };

    const handleDelete = (messageId: number) => {
        if (confirm('Are you sure you want to delete this message?')) {
            router.delete(`/guest/messages/${messageId}`, {
                preserveScroll: true,
            });
        }
    };

    const handleMarkAllAsRead = () => {
        router.post(
            '/guest/messages/mark-all-read',
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedMessage(null);
    };

    return (
        <GuestDashboardLayout>
            <Head title="Messages" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Mail className="h-8 w-8 text-blue-600" />
                            Your Messages
                        </h1>
                        {unreadCount > 0 && (
                            <p className="mt-2 text-gray-600">
                                You have{' '}
                                <span className="font-semibold text-blue-600">
                                    {unreadCount}
                                </span>{' '}
                                unread message{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark All as Read
                        </button>
                    )}
                </div>

                {/* Messages List */}
                {messages.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Mail className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No messages yet
                        </h3>
                        <p className="text-gray-500">
                            When you receive messages, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {messages.map((message) => (
                                <li
                                    key={message.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${
                                        !message.is_read
                                            ? 'bg-blue-50 border-l-4 border-blue-500'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {message.is_read ? (
                                                    <MailOpen className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                ) : (
                                                    <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                                )}
                                                <h3
                                                    className={`text-sm font-semibold ${
                                                        message.is_read
                                                            ? 'text-gray-700'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {message.title}
                                                </h3>
                                                {!message.is_read && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        New
                                                    </span>
                                                )}
                                            </div>

                                            <p
                                                className={`text-sm mb-2 ${
                                                    message.is_read
                                                        ? 'text-gray-500'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                {message.message.length > 80
                                                    ? message.message.substring(0, 80) +
                                                      '...'
                                                    : message.message}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>From: {message.sender.name}</span>
                                                <span>•</span>
                                                <span>{message.created_at_human}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleShowMessage(message)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                                    message.is_read
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                            >
                                                <Eye className="h-4 w-4" />
                                                {message.is_read ? 'View' : 'Read'}
                                            </button>

                                            <button
                                                onClick={() => handleDelete(message.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete message"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Message Modal */}
            {showModal && selectedMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {selectedMessage.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            From: {selectedMessage.sender.name}
                                        </span>
                                        <span>•</span>
                                        <span>{selectedMessage.created_at_human}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="prose max-w-none">
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {selectedMessage.message}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-200 mt-6 pt-4 flex justify-between items-center">
                                <p className="text-xs text-gray-500">
                                    Sent on:{' '}
                                    {new Date(
                                        selectedMessage.created_at
                                    ).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDelete(selectedMessage.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </GuestDashboardLayout>
    );
}
