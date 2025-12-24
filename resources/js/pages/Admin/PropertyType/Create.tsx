import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        type: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/property-types');
    };

    return (
        <AdminLayout>
            <Head title="Create Property Type" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <a href="/admin/property-types" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Property Types
                    </a>
                </div>

                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Property Type</h1>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Property Type <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.type ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="e.g., Apartment, House, Villa"
                            />
                            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Creating...' : 'Create Property Type'}
                            </button>
                            <a
                                href="/admin/property-types"
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
