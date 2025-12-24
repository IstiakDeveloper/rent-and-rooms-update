import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface MaintainType {
    id: number;
    type: string;
    maintains_count: number;
    created_at: string;
}

interface Props {
    maintainTypes: {
        data: MaintainType[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

export default function Index({ maintainTypes }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this maintain type?')) {
            router.delete(`/admin/maintain-types/${id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Maintain Types" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Maintain Types</h1>
                    <Link
                        href="/admin/maintain-types/create"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Maintain Type
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maintains Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {maintainTypes.data.map((maintainType) => (
                                <tr key={maintainType.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maintainType.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{maintainType.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maintainType.maintains_count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(maintainType.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/admin/maintain-types/${maintainType.id}/edit`}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            <Edit2 className="w-4 h-4 inline" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(maintainType.id)}
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

                {maintainTypes.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {maintainTypes.links.map((link, index) => (
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
