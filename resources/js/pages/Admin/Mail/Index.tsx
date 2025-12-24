import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Search, Mail, Send, CheckCircle, X, Users, Loader2, FileText } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    has_active_booking: boolean;
}

interface Message {
    id: number;
    message: string;
    created_at: string;
    recipient: {
        id: number;
        name: string;
        email: string;
    };
}

interface Props {
    users: User[];
    sentMessages: Message[];
}

export default function Index({ users, sentMessages }: Props) {
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [allUsersSelected, setAllUsersSelected] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle select all
    useEffect(() => {
        if (allUsersSelected) {
            setSelectedUsers(users.map(u => u.id));
        } else {
            setSelectedUsers([]);
        }
    }, [allUsersSelected]);

    // Toggle user selection
    const toggleUser = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Remove user from selection
    const removeUser = (userId: number) => {
        setSelectedUsers(prev => prev.filter(id => id !== userId));
        if (allUsersSelected) setAllUsersSelected(false);
    };

    // Handle send email
    const handleSendEmail = () => {
        if (selectedUsers.length === 0) {
            alert('Please select at least one user');
            return;
        }

        if (!message.trim()) {
            alert('Please enter a message');
            return;
        }

        setLoading(true);

        router.post('/admin/mail/send', {
            selectedUsers,
            message,
            subject: subject || 'Important Notification',
        }, {
            onSuccess: () => {
                setMessage('');
                setSubject('');
                setSelectedUsers([]);
                setAllUsersSelected(false);
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Send Mail to Users" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-8">
                {/* Header Section - Enhanced */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-4 mb-2">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Mail className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Email Center</h1>
                                    <p className="text-gray-500 mt-1 text-sm">Communicate with your users effectively</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                                <Users className="h-6 w-6 text-white" />
                                <div className="text-right">
                                    <p className="text-xs text-blue-100 font-medium">Total Users</p>
                                    <p className="text-2xl font-bold text-white">{users.length}</p>
                                </div>
                            </div>
                            {selectedUsers.length > 0 && (
                                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-xl border border-green-300">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-semibold text-green-800">{selectedUsers.length} Recipients Selected</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column - Compose Email */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Compose Email Card - Enhanced */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                            <Send className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">Compose Email</h2>
                                            <p className="text-blue-100 text-sm">Create and send your message</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Quick Select Options - Enhanced */}
                                <div className="space-y-4">
                                    {/* Select All Checkbox */}
                                    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                                        <div className="relative z-10 flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    id="selectAll"
                                                    checked={allUsersSelected}
                                                    onChange={(e) => setAllUsersSelected(e.target.checked)}
                                                    className="w-6 h-6 text-blue-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500/20 cursor-pointer transition-all duration-200"
                                                />
                                            </div>
                                            <label htmlFor="selectAll" className="flex-1 cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-base font-bold text-gray-900">Select All Users</p>
                                                        <p className="text-sm text-gray-600">Send to all {users.length} registered users</p>
                                                    </div>
                                                    <Users className="h-8 w-8 text-blue-600" />
                                                </div>
                                            </label>
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-30 -mr-16 -mt-16"></div>
                                    </div>

                                    {/* Quick Select Buttons */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* All Registered (No Bookings) */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const registeredUsers = users.filter(u => !u.has_active_booking).map(u => u.id);
                                                setSelectedUsers(registeredUsers);
                                                setAllUsersSelected(false);
                                            }}
                                            className="relative overflow-hidden group p-5 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105"
                                        >
                                            <div className="relative z-10 flex flex-col items-center space-y-2">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                                    <Users className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-gray-900">All Registered</p>
                                                    <p className="text-xs text-gray-600 mt-1">No active bookings</p>
                                                    <p className="text-lg font-bold text-green-600 mt-1">
                                                        {users.filter(u => !u.has_active_booking).length} users
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-green-300 rounded-full blur-2xl opacity-20 -mr-10 -mt-10"></div>
                                        </button>

                                        {/* All Active (With Bookings) */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const activeUsers = users.filter(u => u.has_active_booking).map(u => u.id);
                                                setSelectedUsers(activeUsers);
                                                setAllUsersSelected(false);
                                            }}
                                            className="relative overflow-hidden group p-5 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105"
                                        >
                                            <div className="relative z-10 flex flex-col items-center space-y-2">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                                    <CheckCircle className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-gray-900">All Active</p>
                                                    <p className="text-xs text-gray-600 mt-1">With active bookings</p>
                                                    <p className="text-lg font-bold text-purple-600 mt-1">
                                                        {users.filter(u => u.has_active_booking).length} users
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-300 rounded-full blur-2xl opacity-20 -mr-10 -mt-10"></div>
                                        </button>
                                    </div>
                                </div>

                                {/* User Dropdown - Enhanced */}
                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                                        <Users className="h-5 w-5 text-blue-600" />
                                        <span>Select Recipients</span>
                                        <span className="ml-auto text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-xs font-bold">
                                            {selectedUsers.length} selected
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="w-full px-6 py-4 text-left bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-700 font-medium">
                                                {selectedUsers.length === 0
                                                    ? 'Click to select recipients'
                                                    : `${selectedUsers.length} user(s) ready to receive`}
                                            </span>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute z-20 w-full mt-3 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {/* Search Input - Enhanced */}
                                            <div className="p-4 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search by name or email..."
                                                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    {searchQuery && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSearchQuery('')}
                                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 transition-all duration-200"
                                                            title="Clear search"
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* User List - Enhanced */}
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {filteredUsers.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <Users className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                        <p className="text-gray-500 font-medium">No users found</p>
                                                        <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
                                                    </div>
                                                ) : (
                                                    filteredUsers.map((user) => (
                                                        <label
                                                            key={user.id}
                                                            className="flex items-center px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 group"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.includes(user.id)}
                                                                onChange={() => toggleUser(user.id)}
                                                                className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                                                            />
                                                            <div className="ml-4 flex items-center flex-1">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                                                                    <span className="text-white text-sm font-bold">
                                                                        {user.name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                        {user.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Users Display - Enhanced */}
                                {selectedUsers.length > 0 && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                                        <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center space-x-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <span>Selected Recipients ({selectedUsers.length})</span>
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedUsers.map((userId) => {
                                                const user = users.find(u => u.id === userId);
                                                return user ? (
                                                    <span
                                                        key={userId}
                                                        className="inline-flex items-center px-4 py-2.5 bg-white text-gray-900 text-sm font-semibold rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 group"
                                                    >
                                                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
                                                            <span className="text-white text-xs font-bold">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        {user.name}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUser(userId)}
                                                            className="ml-3 text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Subject Field - Enhanced */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                                        <Mail className="h-5 w-5 text-blue-600" />
                                        <span>Email Subject</span>
                                        <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Enter email subject (e.g., Important Notification)"
                                        className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 font-medium"
                                    />
                                </div>

                                {/* Message Field - Enhanced */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <span>Message</span>
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={8}
                                        placeholder="Type your message here... (minimum 5 characters)"
                                        className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none font-medium"
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        {message.trim() && message.length < 5 ? (
                                            <p className="text-sm text-red-600 font-medium flex items-center space-x-1">
                                                <X className="h-4 w-4" />
                                                <span>Message must be at least 5 characters</span>
                                            </p>
                                        ) : message.trim() ? (
                                            <p className="text-sm text-green-600 font-medium flex items-center space-x-1">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>Message looks good!</span>
                                            </p>
                                        ) : (
                                            <span></span>
                                        )}
                                        <span className="text-sm text-gray-500">{message.length} characters</span>
                                    </div>
                                </div>

                                {/* Send Button - Enhanced */}
                                <div className="flex justify-end pt-6 border-t-2 border-gray-100">
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={loading || selectedUsers.length === 0 || !message.trim() || message.length < 5}
                                        className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 shadow-lg hover:shadow-2xl disabled:shadow-none overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        <div className="relative flex items-center space-x-3">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                    <span className="text-lg">Sending Email...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                                                    <span className="text-lg">Send Email to {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}</span>
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sent Messages */}
                    <div className="xl:col-span-1">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-6">
                            <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 px-6 py-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <CheckCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Sent History</h2>
                                        <p className="text-gray-300 text-xs">{sentMessages.length} messages sent</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
                                {sentMessages.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Mail className="h-10 w-10 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 text-base font-semibold">No messages yet</p>
                                        <p className="text-gray-400 text-sm mt-2">Your sent messages will<br />appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {sentMessages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className="group p-5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                                            >
                                                <div className="flex items-start space-x-3 mb-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                                                        <span className="text-white text-base font-bold">
                                                            {msg.recipient.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                            {msg.recipient.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{msg.recipient.email}</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(msg.created_at).toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 pl-15">
                                                    {msg.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #3b82f6, #6366f1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #2563eb, #4f46e5);
                }
                @keyframes slide-in-from-top-2 {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
