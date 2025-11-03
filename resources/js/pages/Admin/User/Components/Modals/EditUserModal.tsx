import React from 'react';
import { useForm } from '@inertiajs/react';
import { X, User, Mail, Phone, Save } from 'lucide-react';

interface Props {
    isOpen: boolean;
    user: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditUserModal({ isOpen, user, onClose, onSuccess }: Props) {
    const form = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.patch(`/users/${user.id}/update-info`, {
            onSuccess: () => {
                onSuccess();
                onClose();
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Edit User Information</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <User className="h-4 w-4 inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Enter full name"
                                required
                            />
                            {form.errors.name && (
                                <p className="text-red-600 text-sm mt-2">{form.errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Mail className="h-4 w-4 inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Enter email address"
                                required
                            />
                            {form.errors.email && (
                                <p className="text-red-600 text-sm mt-2">{form.errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Phone className="h-4 w-4 inline mr-2" />
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Enter phone number"
                                required
                            />
                            {form.errors.phone && (
                                <p className="text-red-600 text-sm mt-2">{form.errors.phone}</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {form.processing ? (
                                    <>
                                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                                            <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full"></div>
                                        </div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
