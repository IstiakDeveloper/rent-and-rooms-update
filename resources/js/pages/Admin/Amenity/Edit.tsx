import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft } from 'lucide-react';

interface AmenityType {
    id: number;
    type: string;
}

interface Amenity {
    id: number;
    name: string;
    amenity_type_id: number;
}

interface Props {
    amenity: Amenity;
    amenityTypes: AmenityType[];
}

export default function Edit({ amenity, amenityTypes }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        amenity_type_id: amenity.amenity_type_id.toString(),
        name: amenity.name,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/amenities/${amenity.id}`);
    };

    return (
        <AdminLayout>
            <Head title="Edit Amenity" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin/amenities"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Amenity</h1>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label htmlFor="amenity_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Amenity Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="amenity_type_id"
                                value={data.amenity_type_id}
                                onChange={(e) => setData('amenity_type_id', e.target.value)}
                                className={`block w-full rounded-md shadow-sm ${
                                    errors.amenity_type_id
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                required
                            >
                                <option value="">Select Amenity Type</option>
                                {amenityTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.type}
                                    </option>
                                ))}
                            </select>
                            {errors.amenity_type_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.amenity_type_id}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`block w-full rounded-md shadow-sm ${
                                    errors.name
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href="/admin/amenities"
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
