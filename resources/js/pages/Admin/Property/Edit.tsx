import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface Country {
    id: number;
    name: string;
}

interface City {
    id: number;
    name: string;
}

interface PropertyType {
    id: number;
    type: string;
}

interface Property {
    id: number;
    name: string;
    country_id: number;
    city_id: number;
    property_type_id: number;
    photo?: string;
}

interface Props {
    property: Property;
    countries: Country[];
    cities: City[];
    propertyTypes: PropertyType[];
}

export default function Edit({ property, countries, cities: initialCities, propertyTypes }: Props) {
    const [formData, setFormData] = useState({
        country_id: property.country_id.toString(),
        city_id: property.city_id.toString(),
        property_type_id: property.property_type_id.toString(),
        name: property.name,
        photo: null as File | null,
    });
    const [cities, setCities] = useState<City[]>(initialCities);
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (formData.country_id) {
            axios.get(`/api/countries/${formData.country_id}/cities`)
                .then(response => setCities(response.data))
                .catch(() => setCities([]));
        }
    }, [formData.country_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const data = new FormData();
        data.append('country_id', formData.country_id);
        data.append('city_id', formData.city_id);
        data.append('property_type_id', formData.property_type_id);
        data.append('name', formData.name);
        if (formData.photo) {
            data.append('photo', formData.photo);
        }
        data.append('_method', 'PUT');

        router.post(`/admin/properties/${property.id}`, data, {
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Edit Property" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <a href="/admin/properties" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Properties
                    </a>
                </div>

                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Property</h1>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.country_id}
                                onChange={(e) => setFormData({ ...formData, country_id: e.target.value, city_id: '' })}
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
                                City <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.city_id}
                                onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.city_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select a city</option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                            {errors.city_id && <p className="mt-1 text-sm text-red-600">{errors.city_id}</p>}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Property Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.property_type_id}
                                onChange={(e) => setFormData({ ...formData, property_type_id: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.property_type_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select a property type</option>
                                {propertyTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.type}
                                    </option>
                                ))}
                            </select>
                            {errors.property_type_id && <p className="mt-1 text-sm text-red-600">{errors.property_type_id}</p>}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Property Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Photo
                            </label>
                            {property.photo && (
                                <div className="mb-2">
                                    <img src={`/storage/${property.photo}`} alt={property.name} className="w-32 h-32 object-cover rounded" />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                            {errors.photo && <p className="mt-1 text-sm text-red-600">{errors.photo}</p>}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Updating...' : 'Update Property'}
                            </button>
                            <a
                                href="/admin/properties"
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
