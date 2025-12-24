import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Search, Eye, Trash2, Plus, UserPlus, X, Mail, Edit } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    created_at: string;
    roles: Role[];
    bookings: Array<{
        id: number;
        package: {
            title: string;
        };
    }>;
    userDetail?: {
        stay_status: string;
        payment_status: string;
        package_price?: number;
    };
}

interface Message {
    id: number;
    message: string;
    created_at: string;
    is_read: boolean;
}

interface UsersProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    roles: Role[];
    filters?: {
        search?: string;
        role?: string;
        has_booking?: string;
    };
}

export default function Index({ users, roles, filters = {} }: UsersProps) {
    const { flash } = usePage().props as any;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [hasBooking, setHasBooking] = useState(filters.has_booking || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Handle flash messages
    useEffect(() => {
        if (flash?.success) {
            setFlashMessage({ type: 'success', message: flash.success });
            setTimeout(() => setFlashMessage(null), 5000);
        } else if (flash?.error) {
            setFlashMessage({ type: 'error', message: flash.error });
            setTimeout(() => setFlashMessage(null), 5000);
        }
    }, [flash]);

    // Handle ESC key to close modals
    React.useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isCreateModalOpen) {
                    setIsCreateModalOpen(false);
                }
                if (isMessageModalOpen) {
                    setIsMessageModalOpen(false);
                }
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isCreateModalOpen, isMessageModalOpen]);

    // Create User Form
    const { data: createData, setData: setCreateData, post: createUser, processing: createProcessing, errors: createErrors, reset: resetCreateForm } = useForm({
        name: '',
        email: '',
        password: '',
        role: '',
    });

    const handleSearch = () => {
        router.get('/admin/users', {
            search: searchTerm,
            role: roleFilter,
            has_booking: hasBooking,
            page: 1 // Reset to first page when searching
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Auto search when searchTerm changes (like Livewire updatedSearchTerm)
    React.useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (searchTerm !== (filters.search || '')) {
                handleSearch();
            }
        }, 500); // 500ms delay for better UX

        return () => clearTimeout(delayedSearch);
    }, [searchTerm]);

    // Auto search when roleFilter changes
    React.useEffect(() => {
        if (roleFilter !== (filters.role || '')) {
            handleSearch();
        }
    }, [roleFilter]);

    // Auto search when hasBooking changes
    React.useEffect(() => {
        if (hasBooking !== (filters.has_booking || '')) {
            handleSearch();
        }
    }, [hasBooking]);

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createUser('/admin/users', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreateForm();
            },
        });
    };

    const handleDeleteUser = (userId: number, hasBookings: boolean) => {
        if (hasBookings) {
            setFlashMessage({ type: 'error', message: 'Cannot delete user with active bookings. Please delete all bookings first.' });
            return;
        }

        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/admin/users/${userId}`, {
                preserveScroll: true,
                preserveState: false,
            });
        }
    };

    const loadMessages = async (userId: number) => {
        setSelectedUserId(userId);
        try {
            const response = await fetch(`/admin/users/${userId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
        }
        setIsMessageModalOpen(true);
    };

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '£0.00';
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'completed':
            case 'paid':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'pending':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'inactive':
            case 'cancelled':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Convert "User" role to "Guest" for display only
    const getDisplayRole = (roleName: string) => {
        return roleName === 'User' ? 'Guest' : roleName;
    };

    return (
        <AdminLayout>
            <Head title="Users Management" />

            {/* Flash Messages */}
            {flashMessage && (
                <div className={`fixed top-4 right-4 z-50 max-w-md w-full ${flashMessage.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded-lg shadow-lg animate-slide-in`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 ${flashMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {flashMessage.type === 'success' ? (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-3">
                                <p className={`text-sm font-medium ${flashMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                    {flashMessage.message}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFlashMessage(null)}
                            className={`ml-4 inline-flex ${flashMessage.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Users Management
                        </h1>
                        <p className="mt-2 text-gray-600 text-lg">
                            Manage user accounts, details, and bookings
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Create New User
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg shadow-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Search Bar */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Search Users</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Role</label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium bg-white transition-all duration-200"
                            >
                                <option value="">All Roles</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {getDisplayRole(role.name)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Booking Status Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Booking Status</label>
                            <select
                                value={hasBooking}
                                onChange={(e) => setHasBooking(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium bg-white transition-all duration-200"
                            >
                                <option value="">All Users</option>
                                <option value="yes">Has Bookings</option>
                                <option value="no">No Bookings</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">All Users</h2>
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                                    <span className="font-semibold text-gray-700">{users.total}</span> total users
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        User Information
                                    </th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Role & Status
                                    </th>
                                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={`hover:bg-gray-50 transition-all duration-200 ${
                                            user.bookings.length > 0 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-400' : ''
                                        }`}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <Mail className="h-4 w-4 mr-1" />
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role, index) => (
                                                        <span
                                                            key={role.id}
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                        >
                                                            {getDisplayRole(role.name)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        No role assigned
                                                    </span>
                                                )}
                                                {user.userDetail?.stay_status && (
                                                    <div className="mt-1">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.userDetail.stay_status)}`}>
                                                            {user.userDetail.stay_status === 'staying' ? 'Currently Staying' : 'Want to Stay'}
                                                        </span>
                                                    </div>
                                                )}
                                                {user.bookings.length > 0 && (
                                                    <div className="text-xs text-blue-600 font-medium">
                                                        {user.bookings.length} active booking(s)
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center space-x-3">
                                                {/* View User Button */}
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="inline-flex items-center p-2 border border-transparent rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                                                    title="View User Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>

                                                {/* Edit User Button */}
                                                <Link
                                                    href={`/admin/users/${user.id}/edit`}
                                                    className="inline-flex items-center p-2 border border-transparent rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
                                                    title="Edit User"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>

                                                {/* Message Button */}
                                                <button
                                                    onClick={() => loadMessages(user.id)}
                                                    className="inline-flex items-center p-2 border border-transparent rounded-lg text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
                                                    title="View Messages"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.bookings.length > 0)}
                                                    className={`inline-flex items-center p-2 border border-transparent rounded-lg transition-all duration-200 transform hover:scale-105 ${
                                                        user.bookings.length > 0
                                                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                            : 'text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                                    }`}
                                                    title={user.bookings.length > 0 ? 'Cannot delete user with active bookings' : 'Delete User'}
                                                    disabled={user.bookings.length > 0}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.last_page > 1 && (
                        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-700 font-medium">
                                    Showing <span className="font-semibold text-gray-900">{((users.current_page - 1) * users.per_page) + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(users.current_page * users.per_page, users.total)}</span> of <span className="font-semibold text-gray-900">{users.total}</span> results
                                </div>
                                <div className="flex items-center space-x-2">
                                    {users.links.map((link, index) => {
                                        // Skip if this is the "Previous" or "Next" text link
                                        if (!link.url && (link.label.includes('Previous') || link.label.includes('Next'))) {
                                            return null;
                                        }

                                        // Handle Previous/Next arrows
                                        if (link.label.includes('&laquo;') || link.label.includes('Previous')) {
                                            return link.url ? (
                                                <Link
                                                    key={index}
                                                    href={`${link.url}&search=${searchTerm}&role=${roleFilter}&has_booking=${hasBooking}`}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                                                    preserveState
                                                    preserveScroll
                                                >
                                                    ← Previous
                                                </Link>
                                            ) : (
                                                <span
                                                    key={index}
                                                    className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                                                >
                                                    ← Previous
                                                </span>
                                            );
                                        }

                                        if (link.label.includes('&raquo;') || link.label.includes('Next')) {
                                            return link.url ? (
                                                <Link
                                                    key={index}
                                                    href={`${link.url}&search=${searchTerm}&role=${roleFilter}&has_booking=${hasBooking}`}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                                                    preserveState
                                                    preserveScroll
                                                >
                                                    Next →
                                                </Link>
                                            ) : (
                                                <span
                                                    key={index}
                                                    className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                                                >
                                                    Next →
                                                </span>
                                            );
                                        }

                                        // Handle page numbers
                                        return link.url ? (
                                            <Link
                                                key={index}
                                                href={`${link.url}&search=${searchTerm}&role=${roleFilter}&has_booking=${hasBooking}`}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                                preserveState
                                                preserveScroll
                                            >
                                                {link.label}
                                            </Link>
                                        ) : (
                                            <span
                                                key={index}
                                                className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                                            >
                                                {link.label.includes('...') ? '...' : link.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create User Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                                onClick={() => setIsCreateModalOpen(false)}
                            ></div>

                            <div
                                className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-white px-6 pb-4 pt-6 sm:p-8 sm:pb-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                    <UserPlus className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <h2 className="text-xl font-bold leading-6 text-gray-900">Create New User</h2>
                                        </div>
                                        <button
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg p-1 transition-colors duration-200"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateUser} className="space-y-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                value={createData.name}
                                                onChange={(e) => setCreateData('name', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                placeholder="Enter full name"
                                                required
                                            />
                                            {createErrors.name && <span className="text-red-500 text-sm mt-1 block">{createErrors.name}</span>}
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={createData.email}
                                                onChange={(e) => setCreateData('email', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                placeholder="Enter email address"
                                                required
                                            />
                                            {createErrors.email && <span className="text-red-500 text-sm mt-1 block">{createErrors.email}</span>}
                                        </div>

                                        <div>
                                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                value={createData.password}
                                                onChange={(e) => setCreateData('password', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                placeholder="Enter password"
                                                required
                                            />
                                            {createErrors.password && <span className="text-red-500 text-sm mt-1 block">{createErrors.password}</span>}
                                        </div>

                                        <div>
                                            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                                                User Role
                                            </label>
                                            <select
                                                id="role"
                                                value={createData.role}
                                                onChange={(e) => setCreateData('role', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                required
                                            >
                                                <option value="">Select Role</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.name}>
                                                        {getDisplayRole(role.name)}
                                                    </option>
                                                ))}
                                            </select>
                                            {createErrors.role && <span className="text-red-500 text-sm mt-1 block">{createErrors.role}</span>}
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8">
                                    <button
                                        type="submit"
                                        onClick={handleCreateUser}
                                        disabled={createProcessing}
                                        className="inline-flex w-full justify-center items-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        {createProcessing ? (
                                            <>
                                                <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                                                    <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full"></div>
                                                </div>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Create User
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages Modal */}
                {isMessageModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                                onClick={() => setIsMessageModalOpen(false)}
                            ></div>

                            <div
                                className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-white px-6 pb-4 pt-6 sm:p-8 sm:pb-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                    <Mail className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <h2 className="text-xl font-bold leading-6 text-gray-900">
                                                User Messages
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() => setIsMessageModalOpen(false)}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg p-1 transition-colors duration-200"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-1">
                                        <div className="overflow-x-auto">
                                            <table className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
                                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Message</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Sent On</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {messages.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-12 text-center">
                                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                                    <Mail className="h-12 w-12 text-gray-300 mb-4" />
                                                                    <p className="text-lg font-medium">No messages found</p>
                                                                    <p className="text-sm">This user has no messages yet.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        messages.map((message) => (
                                                            <tr
                                                                key={message.id}
                                                                className={`transition-all duration-200 ${
                                                                    message.is_read
                                                                        ? 'bg-gray-50 hover:bg-gray-100'
                                                                        : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400'
                                                                }`}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm text-gray-900 font-medium max-w-md">
                                                                        {message.message}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                                    {new Date(message.created_at).toLocaleDateString('en-GB', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                                        message.is_read
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                        {message.is_read ? 'Read' : 'Unread'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-4 sm:px-8">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setIsMessageModalOpen(false)}
                                            className="inline-flex justify-center items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
