import { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Search, Edit2, Trash2, X, UserCheck, UserX, UserPlus } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    role_name: string; // Spatie role name
    status: string;
    created_at: string;
    bookings_count?: number;
    check_in_date?: string | null;
    check_out_date?: string | null;
    booking_status?: string | null;
}

interface Props {
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
    roles: string[];
    statuses: string[];
    filters: {
        search?: string;
        role?: string;
        status?: string;
    };
}

export default function Index({ users, roles, statuses, filters }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Edit form
    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        email: '',
        phone: '',
        role: '',
        status: '',
        password: '',
        password_confirmation: '',
    });

    // Create form
    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role: roles[0] || '',
        status: 'active',
    });

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

    const handleSearch = () => {
        router.get('/admin/manage-users', {
            search,
            role: roleFilter,
            status: statusFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setRoleFilter('');
        setStatusFilter('');
        router.get('/admin/manage-users', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role_name, // Use Spatie role name
            status: user.status,
            password: '',
            password_confirmation: '',
        });
    };

    const closeEditModal = () => {
        setEditingUser(null);
        resetEdit();
    };

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
        resetCreate();
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetCreate();
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/manage-users', {
            preserveScroll: true,
            onSuccess: () => {
                closeCreateModal();
            },
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            put(`/admin/manage-users/${editingUser.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    closeEditModal();
                },
            });
        }
    };

    const handleDelete = (user: User) => {
        if (confirm(`Are you sure you want to delete ${user.name}?`)) {
            router.delete(`/admin/manage-users/${user.id}`, {
                preserveScroll: true,
            });
        }
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            'Super Admin': 'bg-purple-100 text-purple-800',
            'Admin': 'bg-blue-100 text-blue-800',
            'Partner': 'bg-green-100 text-green-800',
            'User': 'bg-orange-100 text-orange-800',
            'Guest': 'bg-orange-100 text-orange-800',
            'No Role': 'bg-gray-100 text-gray-800',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    // Convert "User" role to "Guest" for display only
    const getDisplayRole = (role: string) => {
        return role === 'User' ? 'Guest' : role;
    };

    const getStatusBadgeColor = (status: string) => {
        return status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    };

    return (
        <AdminLayout>
            <Head title="Manage Users" />

            {/* Flash Messages */}
            {flashMessage && (
                <div className={`fixed top-4 right-4 z-50 max-w-md w-full ${flashMessage.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded-lg shadow-lg`}>
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

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View and manage all users in the system
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create User
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Name or email..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Role Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Roles</option>
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            {getDisplayRole(role)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Status</option>
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleSearch}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Search
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Check In Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Check Out Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <UserX className="h-12 w-12 mb-3" />
                                                    <p className="text-lg font-medium">No users found</p>
                                                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role_name)}`}>
                                                        {getDisplayRole(user.role_name)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                                                        {user.status === 'active' ? (
                                                            <UserCheck className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <UserX className="h-3 w-3 mr-1" />
                                                        )}
                                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {user.check_in_date ? (
                                                        <span className={`font-medium ${
                                                            user.booking_status === 'completed' || user.booking_status === 'checked_out'
                                                                ? 'text-gray-600'
                                                                : 'text-green-600'
                                                        }`}>
                                                            {new Date(user.check_in_date).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {user.check_out_date ? (
                                                        <span className={`font-medium ${
                                                            user.booking_status === 'completed' || user.booking_status === 'checked_out'
                                                                ? 'text-red-600'
                                                                : 'text-blue-600'
                                                        }`}>
                                                            {new Date(user.check_out_date).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                        title="Edit user"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(users.current_page - 1) * users.per_page + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(users.current_page * users.per_page, users.total)}
                                        </span> of <span className="font-medium">{users.total}</span> results
                                    </div>
                                    <div className="flex gap-2">
                                        {users.links.map((link, index) => {
                                            if (!link.url) return null;

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => router.get(link.url!)}
                                                    disabled={link.active}
                                                    className={`px-3 py-1 rounded ${
                                                        link.active
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Edit User
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData('name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {editErrors.name && (
                                    <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={editData.email}
                                    onChange={(e) => setEditData('email', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {editErrors.email && (
                                    <p className="mt-1 text-sm text-red-600">{editErrors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editData.phone}
                                    onChange={(e) => setEditData('phone', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {editErrors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{editErrors.phone}</p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editData.role}
                                    onChange={(e) => setEditData('role', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            {getDisplayRole(role)}
                                        </option>
                                    ))}
                                </select>
                                {editErrors.role && (
                                    <p className="mt-1 text-sm text-red-600">{editErrors.role}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editData.status}
                                    onChange={(e) => setEditData('status', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                {editErrors.status && (
                                    <p className="mt-1 text-sm text-red-600">{editErrors.status}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">Reset Password (Optional)</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={editData.password}
                                            onChange={(e) => setEditData('password', e.target.value)}
                                            placeholder="Leave blank to keep current password"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {editErrors.password && (
                                            <p className="mt-1 text-sm text-red-600">{editErrors.password}</p>
                                        )}
                                    </div>
                                    {editData.password && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={editData.password_confirmation}
                                                onChange={(e) => setEditData('password_confirmation', e.target.value)}
                                                placeholder="Confirm new password"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editProcessing}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {editProcessing ? 'Updating...' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Create New User
                            </h3>
                            <button
                                onClick={closeCreateModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createData.name}
                                    onChange={(e) => setCreateData('name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {createErrors.name && (
                                    <p className="mt-1 text-sm text-red-600">{createErrors.name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={createData.email}
                                    onChange={(e) => setCreateData('email', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {createErrors.email && (
                                    <p className="mt-1 text-sm text-red-600">{createErrors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createData.phone}
                                    onChange={(e) => setCreateData('phone', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {createErrors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{createErrors.phone}</p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={createData.role}
                                    onChange={(e) => setCreateData('role', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            {getDisplayRole(role)}
                                        </option>
                                    ))}
                                </select>
                                {createErrors.role && (
                                    <p className="mt-1 text-sm text-red-600">{createErrors.role}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={createData.status}
                                    onChange={(e) => setCreateData('status', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                {createErrors.status && (
                                    <p className="mt-1 text-sm text-red-600">{createErrors.status}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={createData.password}
                                    onChange={(e) => setCreateData('password', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    minLength={8}
                                />
                                {createErrors.password && (
                                    <p className="mt-1 text-sm text-red-600">{createErrors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={createData.password_confirmation}
                                    onChange={(e) => setCreateData('password_confirmation', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    minLength={8}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createProcessing}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {createProcessing ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
