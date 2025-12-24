import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';

interface City {
    id: number;
    name: string;
    country: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface Props {
    cities: {
        data: City[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ cities }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this city?')) {
            router.delete(`/admin/cities/${id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Cities" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Cities</h1>
                    <Link
                        href="/admin/cities/create"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add City
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cities.data.map((city) => (
                                <tr key={city.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900">{city.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {city.country.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/admin/cities/${city.id}/edit`}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            <Edit className="w-4 h-4 inline" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(city.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {cities.data.length === 0 && (
                        <div className="text-center py-12">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No cities found</p>
                        </div>
                    )}
                </div>

                {cities.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {Array.from({ length: cities.last_page }, (_, i) => i + 1).map((page) => (
                            <Link
                                key={page}
                                href={`/admin/cities?page=${page}`}
                                className={`px-4 py-2 rounded ${
                                    page === cities.current_page
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
