import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';

interface Role {
    id: number;
    name: string;
}

interface CreateProps {
    roles: Role[];
    user_id?: number;
    user?: {
        id: number;
        name: string;
        email: string;
        role?: string;
    };
}

export default function Create({ roles, user_id, user }: CreateProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
        role_id: user?.role || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (user_id) {
            // Edit mode
            put(`/admin/users/${user_id}`, {
                onSuccess: () => {
                    reset();
                },
            });
        } else {
            // Create mode
            post('/admin/users', {
                onSuccess: () => {
                    reset();
                },
            });
        }
    };

    const handleCancel = () => {
        window.history.back();
    };

    return (
        <AdminLayout>
            <Head title={user_id ? 'Edit User' : 'Create User'} />

            {/* Overlay Effect */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>

            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            {user_id ? 'Edit User' : 'Create User'}
                        </h2>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field */}
                        <div>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full px-4 py-3 text-lg border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                                placeholder="Name"
                                required
                            />
                            {errors.name && (
                                <span className="text-red-500 text-sm mt-1 block">{errors.name}</span>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full px-4 py-3 text-lg border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                                placeholder="Email"
                                required
                            />
                            {errors.email && (
                                <span className="text-red-500 text-sm mt-1 block">{errors.email}</span>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full px-4 py-3 text-lg border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                                placeholder="Password"
                                required={!user_id}
                            />
                            {errors.password && (
                                <span className="text-red-500 text-sm mt-1 block">{errors.password}</span>
                            )}
                        </div>

                        {/* Password Confirmation Field */}
                        <div>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="w-full px-4 py-3 text-lg border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                                placeholder="Confirm Password"
                                required={!user_id && data.password.length > 0}
                            />
                        </div>

                        {/* Role Selection */}
                        <div>
                            <select
                                value={data.role_id}
                                onChange={(e) => setData('role_id', e.target.value)}
                                className="w-full px-4 py-3 text-lg border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                                required
                            >
                                <option value="">Select Role</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                            {errors.role_id && (
                                <span className="text-red-500 text-sm mt-1 block">{errors.role_id}</span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-3 text-lg font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
