import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Plus, Edit, Trash2, Building, Image as ImageIcon } from 'lucide-react';

interface Property {
    id: number;
    name: string;
    photo?: string;
    country: {
        id: number;
        name: string;
    };
    city: {
        id: number;
        name: string;
    };
    property_type: {
        id: number;
        type: string;
    };
    user: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface Props {
    properties: {
        data: Property[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ properties }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this property?')) {
            router.delete(`/admin/properties/${id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Properties" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
                    <Link
                        href="/admin/properties/create"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Property
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {properties.data.map((property) => (
                                <tr key={property.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {property.photo ? (
                                            <img src={`/storage/${property.photo}`} alt={property.name} className="w-10 h-10 rounded object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                <ImageIcon className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900">{property.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {property.property_type.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {property.city.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {property.country.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/admin/properties/${property.id}/edit`}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            <Edit className="w-4 h-4 inline" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(property.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {properties.data.length === 0 && (
                        <div className="text-center py-12">
                            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No properties found</p>
                        </div>
                    )}
                </div>

                {properties.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {Array.from({ length: properties.last_page }, (_, i) => i + 1).map((page) => (
                            <Link
                                key={page}
                                href={`/admin/properties?page=${page}`}
                                className={`px-4 py-2 rounded ${
                                    page === properties.current_page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {page}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
