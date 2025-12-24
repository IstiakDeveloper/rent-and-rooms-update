import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft, Upload } from 'lucide-react';

interface MaintainType {
    id: number;
    type: string;
}

interface Props {
    maintainTypes: MaintainType[];
}

export default function Create({ maintainTypes }: Props) {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        maintain_type_id: '',
        name: '',
        photo: null as File | null,
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/maintains');
    };

    return (
        <AdminLayout>
            <Head title="Create Maintain" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin/maintains"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Create Maintain</h1>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label htmlFor="maintain_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                                Maintain Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="maintain_type_id"
                                value={data.maintain_type_id}
                                onChange={(e) => setData('maintain_type_id', e.target.value)}
                                className={`block w-full rounded-md shadow-sm ${
                                    errors.maintain_type_id
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                                required
                            >
                                <option value="">Select Maintain Type</option>
                                {maintainTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.type}
                                    </option>
                                ))}
                            </select>
                            {errors.maintain_type_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.maintain_type_id}</p>
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

                        <div>
                            <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                                Photo
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Photo
                                    <input
                                        type="file"
                                        id="photo"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="sr-only"
                                    />
                                </label>
                                {photoPreview && (
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="h-20 w-20 object-cover rounded"
                                    />
                                )}
                            </div>
                            {errors.photo && (
                                <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <Link
                                href="/admin/maintains"
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
