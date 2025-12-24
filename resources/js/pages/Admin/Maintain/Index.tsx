import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

interface MaintainType {
    id: number;
    type: string;
}

interface Maintain {
    id: number;
    name: string;
    photo?: string;
    maintain_type: MaintainType;
    created_at: string;
}

interface Props {
    maintains: {
        data: Maintain[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

export default function Index({ maintains }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this maintain?')) {
            router.delete(`/admin/maintains/${id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Maintains" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Maintains</h1>
                    <Link
                        href="/admin/maintains/create"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Maintain
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {maintains.data.map((maintain) => (
                                <tr key={maintain.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maintain.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {maintain.photo ? (
                                            <img
                                                src={`/storage/${maintain.photo}`}
                                                alt={maintain.name}
                                                className="h-10 w-10 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                                <ImageIcon className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{maintain.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maintain.maintain_type.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(maintain.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/admin/maintains/${maintain.id}/edit`}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            <Edit2 className="w-4 h-4 inline" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(maintain.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {maintains.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {maintains.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                preserveScroll
                                className={`px-3 py-1 rounded ${
                                    link.active
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
