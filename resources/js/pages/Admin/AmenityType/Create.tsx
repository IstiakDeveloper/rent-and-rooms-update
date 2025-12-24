import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        type: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/amenity-types');
    };

    return (
        <AdminLayout>
            <Head title="Create Amenity Type" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin/amenity-types"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Create Amenity Type</h1>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className={`block w-full rounded-md shadow-sm ${
                                    errors.type
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                required
                            />
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href="/admin/amenity-types"
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
