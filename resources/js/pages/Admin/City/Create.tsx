import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft } from 'lucide-react';

interface Country {
    id: number;
    name: string;
}

interface Props {
    countries: Country[];
}

export default function Create({ countries }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        country_id: '',
        name: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/cities');
    };

    return (
        <AdminLayout>
            <Head title="Create City" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <a href="/admin/cities" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Cities
                    </a>
                </div>

                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Create City</h1>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.country_id}
                                onChange={(e) => setData('country_id', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.country_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select a country</option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                            {errors.country_id && <p className="mt-1 text-sm text-red-600">{errors.country_id}</p>}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter city name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Creating...' : 'Create City'}
                            </button>
                            <a
                                href="/admin/cities"
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
