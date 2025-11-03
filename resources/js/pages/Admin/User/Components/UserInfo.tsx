import React from 'react';
import { User, Mail, Phone, Edit3 } from 'lucide-react';

interface Props {
    user: {
        name: string;
        email: string;
        phone: string;
    };
    onEdit: () => void;
}

export default function UserInfo({ user, onEdit }: Props) {
    return (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200 border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">User Information</h2>
                            <p className="text-sm text-gray-600 mt-1">Personal details and contact information</p>
                        </div>
                    </div>
                    <button
                        onClick={onEdit}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                    </button>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="flex-shrink-0">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Full Name</label>
                        </div>
                        <p className="text-lg font-medium text-gray-900">{user.name}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="flex-shrink-0">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Email Address</label>
                        </div>
                        <p className="text-lg font-medium text-gray-900 break-all">{user.email}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="flex-shrink-0">
                                <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Phone Number</label>
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                            {user.phone || (
                                <span className="text-gray-400 italic">Not provided</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
