import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import * as packageRoutes from '@/routes/admin/packages';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Upload,
    X,
    AlertCircle,
} from 'lucide-react';

interface Country {
    id: number;
    name: string;
}

interface City {
    id: number;
    name: string;
    country_id: number;
}

interface Area {
    id: number;
    name: string;
    city_id: number;
}

interface Property {
    id: number;
    name: string;
}

interface Maintain {
    id: number;
    name: string;
}

interface Amenity {
    id: number;
    name: string;
}

interface RoomPrice {
    id?: number;
    type: string;
    fixed_price: number;
    discount_price: number | null;
    booking_price: number;
    rent_advance_price: number;
}

interface Room {
    id?: number;
    name: string;
    number_of_beds: number;
    number_of_bathrooms: number;
    prices: RoomPrice[];
}

interface PaidService {
    maintain_id?: number | string;
    amenity_id?: number | string;
    price: number;
}

interface Instruction {
    id?: number;
    title: string;
    description: string;
    order: number;
}

interface ExistingPhoto {
    id: number;
    url: string;
}

interface Package {
    id: number;
    country_id: number;
    city_id: number;
    area_id: number;
    property_id: number;
    name: string;
    address: string;
    map_link: string | null;
    expiration_date: string;
    number_of_kitchens: number;
    number_of_rooms: number;
    common_bathrooms: number;
    seating: number;
    details: string | null;
    video_link: string | null;
    rooms: Room[];
    instructions: Instruction[];
    photos: ExistingPhoto[];
}

interface Props {
    package: Package;
    isEntireProperty: boolean;
    entirePropertyPrices: RoomPrice[];
    freeMaintains: number[];
    freeAmenities: number[];
    paidMaintains: PaidService[];
    paidAmenities: PaidService[];
    countries: Country[];
    cities: City[];
    areas: Area[];
    properties: Property[];
    maintains: Maintain[];
    amenities: Amenity[];
}

export default function Edit({
    package: packageData,
    isEntireProperty,
    entirePropertyPrices: initialEntirePropertyPrices,
    freeMaintains: initialFreeMaintains,
    freeAmenities: initialFreeAmenities,
    paidMaintains: initialPaidMaintains,
    paidAmenities: initialPaidAmenities,
    countries,
    cities: allCities,
    areas: allAreas,
    properties,
    maintains,
    amenities,
}: Props) {
    const [cities, setCities] = useState<City[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string[]>([]);
    const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(packageData.photos || []);

    const { data, setData, post, processing, errors } = useForm({
        is_entire_property: isEntireProperty,
        country_id: packageData.country_id.toString(),
        city_id: packageData.city_id.toString(),
        area_id: packageData.area_id.toString(),
        property_id: packageData.property_id.toString(),
        name: packageData.name,
        address: packageData.address,
        map_link: packageData.map_link || '',
        expiration_date: packageData.expiration_date,
        number_of_kitchens: packageData.number_of_kitchens,
        number_of_rooms: packageData.number_of_rooms,
        common_bathrooms: packageData.common_bathrooms,
        seating: packageData.seating,
        details: packageData.details || '',
        video_link: packageData.video_link || '',
        entire_property_prices: (initialEntirePropertyPrices && initialEntirePropertyPrices.length > 0
            ? initialEntirePropertyPrices
            : [{ type: '', fixed_price: 0, discount_price: null, booking_price: 0, rent_advance_price: 0 }]
        ) as RoomPrice[],
        rooms: packageData.rooms.map(room => ({
            id: room.id,
            name: room.name,
            number_of_beds: room.number_of_beds,
            number_of_bathrooms: room.number_of_bathrooms,
            prices: room.prices.map(price => ({
                id: price.id,
                type: price.type,
                fixed_price: price.fixed_price,
                discount_price: price.discount_price,
                booking_price: price.booking_price,
                rent_advance_price: price.rent_advance_price || 0,
            })),
        })) as Room[],
        freeMaintains: initialFreeMaintains as number[],
        freeAmenities: initialFreeAmenities as number[],
        paidMaintains: initialPaidMaintains as PaidService[],
        paidAmenities: initialPaidAmenities as PaidService[],
        instructions: packageData.instructions.map(inst => ({
            id: inst.id,
            title: inst.title,
            description: inst.description,
            order: inst.order,
        })) as Instruction[],
        photos: [] as File[],
        deletedPhotos: [] as number[],
        _method: 'PUT',
    });

    // Update cities when country changes
    useEffect(() => {
        if (data.country_id) {
            const filteredCities = allCities.filter(city => city.country_id === Number(data.country_id));
            setCities(filteredCities);
        } else {
            setCities([]);
        }
    }, [data.country_id]);

    // Update areas when city changes
    useEffect(() => {
        if (data.city_id) {
            const filteredAreas = allAreas.filter(area => area.city_id === Number(data.city_id));
            setAreas(filteredAreas);
        } else {
            setAreas([]);
        }
    }, [data.city_id]);

    // Initialize cascading dropdowns
    useEffect(() => {
        if (packageData.country_id) {
            const filteredCities = allCities.filter(city => city.country_id === packageData.country_id);
            setCities(filteredCities);
        }
        if (packageData.city_id) {
            const filteredAreas = allAreas.filter(area => area.city_id === packageData.city_id);
            setAreas(filteredAreas);
        }
    }, []);

    // Room Management
    const addRoom = () => {
        setData('rooms', [
            ...data.rooms,
            {
                name: '',
                number_of_beds: 1,
                number_of_bathrooms: 0,
                prices: [{ type: '', fixed_price: 0, discount_price: null, booking_price: 0, rent_advance_price: 0 }],
            },
        ]);
    };

    const removeRoom = (index: number) => {
        if (data.rooms.length > 1) {
            const newRooms = data.rooms.filter((_, i) => i !== index);
            setData('rooms', newRooms);
        }
    };

    const updateRoom = (index: number, field: string, value: any) => {
        const newRooms = [...data.rooms];
        (newRooms[index] as any)[field] = value;
        setData('rooms', newRooms);
    };

    // Price Management
    const addPrice = (roomIndex: number) => {
        if (data.rooms[roomIndex].prices.length < 3) {
            const newRooms = [...data.rooms];
            newRooms[roomIndex].prices.push({ type: '', fixed_price: 0, discount_price: null, booking_price: 0, rent_advance_price: 0 });
            setData('rooms', newRooms);
        }
    };

    const removePrice = (roomIndex: number, priceIndex: number) => {
        if (data.rooms[roomIndex].prices.length > 1) {
            const newRooms = [...data.rooms];
            newRooms[roomIndex].prices = newRooms[roomIndex].prices.filter((_, i) => i !== priceIndex);
            setData('rooms', newRooms);
        }
    };

    const updatePrice = (roomIndex: number, priceIndex: number, field: string, value: any) => {
        const newRooms = [...data.rooms];
        (newRooms[roomIndex].prices[priceIndex] as any)[field] = value;
        setData('rooms', newRooms);
    };

    // Entire Property Price Management
    const addEntirePropertyPrice = () => {
        if (data.entire_property_prices.length < 3) {
            setData('entire_property_prices', [
                ...data.entire_property_prices,
                { type: '', fixed_price: 0, discount_price: null, booking_price: 0, rent_advance_price: 0 }
            ]);
        }
    };

    const removeEntirePropertyPrice = (index: number) => {
        if (data.entire_property_prices.length > 1) {
            setData('entire_property_prices', data.entire_property_prices.filter((_, i) => i !== index));
        }
    };

    const updateEntirePropertyPrice = (index: number, field: string, value: any) => {
        const newPrices = [...data.entire_property_prices];
        (newPrices[index] as any)[field] = value;
        setData('entire_property_prices', newPrices);
    };

    // Services Management
    const addPaidMaintain = () => {
        setData('paidMaintains', [...data.paidMaintains, { maintain_id: '', price: 0 }]);
    };

    const removePaidMaintain = (index: number) => {
        setData('paidMaintains', data.paidMaintains.filter((_, i) => i !== index));
    };

    const updatePaidMaintain = (index: number, field: string, value: any) => {
        const newServices = [...data.paidMaintains];
        (newServices[index] as any)[field] = value;
        setData('paidMaintains', newServices);
    };

    const addPaidAmenity = () => {
        setData('paidAmenities', [...data.paidAmenities, { amenity_id: '', price: 0 }]);
    };

    const removePaidAmenity = (index: number) => {
        setData('paidAmenities', data.paidAmenities.filter((_, i) => i !== index));
    };

    const updatePaidAmenity = (index: number, field: string, value: any) => {
        const newServices = [...data.paidAmenities];
        (newServices[index] as any)[field] = value;
        setData('paidAmenities', newServices);
    };

    // Instructions Management
    const addInstruction = () => {
        setData('instructions', [
            ...data.instructions,
            { title: '', description: '', order: data.instructions.length },
        ]);
    };

    const removeInstruction = (index: number) => {
        if (data.instructions.length > 1) {
            const newInstructions = data.instructions.filter((_, i) => i !== index);
            newInstructions.forEach((inst, i) => (inst.order = i));
            setData('instructions', newInstructions);
        }
    };

    const updateInstruction = (index: number, field: string, value: any) => {
        const newInstructions = [...data.instructions];
        (newInstructions[index] as any)[field] = value;
        setData('instructions', newInstructions);
    };

    // Photo Management
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setData('photos', [...data.photos, ...files]);

            // Create preview URLs
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPhotoPreview(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeNewPhoto = (index: number) => {
        setData('photos', data.photos.filter((_, i) => i !== index));
        setPhotoPreview(photoPreview.filter((_, i) => i !== index));
    };

    const removeExistingPhoto = (photoId: number) => {
        setExistingPhotos(existingPhotos.filter(photo => photo.id !== photoId));
        setData('deletedPhotos', [...data.deletedPhotos, photoId]);
    };

    // Form Submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(packageRoutes.update(packageData.id).url, {
            forceFormData: true,
        });
    };

    return (
        <AdminLayout>
            <Head title={`Edit Package - ${packageData.name}`} />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Package</h1>
                        <p className="text-gray-600 mt-1">Update package details</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.visit(packageRoutes.index().url)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>

                {/* Error Display */}
                {Object.keys(errors).length > 0 && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-red-800 mb-2">
                                    Please fix the following errors:
                                </h3>
                                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                    {Object.values(errors).map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Location & Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.country_id}
                                    onChange={(e) => setData('country_id', e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.country_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Country</option>
                                    {countries.map((country) => (
                                        <option key={country.id} value={country.id}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.city_id}
                                    onChange={(e) => setData('city_id', e.target.value)}
                                    disabled={!data.country_id}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.city_id ? 'border-red-500' : 'border-gray-300'
                                    } ${!data.country_id ? 'bg-gray-100' : ''}`}
                                >
                                    <option value="">Select City</option>
                                    {cities.map((city) => (
                                        <option key={city.id} value={city.id}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Area <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.area_id}
                                    onChange={(e) => setData('area_id', e.target.value)}
                                    disabled={!data.city_id}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.area_id ? 'border-red-500' : 'border-gray-300'
                                    } ${!data.city_id ? 'bg-gray-100' : ''}`}
                                >
                                    <option value="">Select Area</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.id}>
                                            {area.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Property <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.property_id}
                                    onChange={(e) => setData('property_id', e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.property_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Property</option>
                                    {properties.map((property) => (
                                        <option key={property.id} value={property.id}>
                                            {property.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Package Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter package name"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expiration Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.expiration_date}
                                    onChange={(e) => setData('expiration_date', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.expiration_date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Enter full address"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.address ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Map Link</label>
                                <input
                                    type="url"
                                    value={data.map_link}
                                    onChange={(e) => setData('map_link', e.target.value)}
                                    placeholder="https://..."
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.map_link ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div className="md:col-span-4">
                                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="is_entire_property"
                                        checked={data.is_entire_property}
                                        onChange={(e) => setData('is_entire_property', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_entire_property" className="text-sm font-medium text-gray-900 cursor-pointer">
                                        Rent Entire Property (If checked, no need to add individual rooms)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Entire Property Pricing */}
                    {data.is_entire_property && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Entire Property Pricing</h2>
                                {data.entire_property_prices.length < 3 && (
                                    <button
                                        type="button"
                                        onClick={addEntirePropertyPrice}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Price Option
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {data.entire_property_prices.map((price, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-gray-700">Price Option {index + 1}</h3>
                                            {data.entire_property_prices.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeEntirePropertyPrice(index)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Price Type <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={price.type}
                                                    onChange={(e) => updateEntirePropertyPrice(index, 'type', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">Select Type</option>
                                                    <option value="Day">Per Day</option>
                                                    <option value="Week">Per Week</option>
                                                    <option value="Month">Per Month</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fixed Price (£) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={price.fixed_price}
                                                    onChange={(e) => updateEntirePropertyPrice(index, 'fixed_price', Number(e.target.value))}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Discount Price (£)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={price.discount_price ?? ''}
                                                    onChange={(e) => updateEntirePropertyPrice(index, 'discount_price', e.target.value ? Number(e.target.value) : null)}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Booking Price (£) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={price.booking_price}
                                                    onChange={(e) => updateEntirePropertyPrice(index, 'booking_price', Number(e.target.value))}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Rent Advance Price (£) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={price.rent_advance_price}
                                                    onChange={(e) => updateEntirePropertyPrice(index, 'rent_advance_price', Number(e.target.value))}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Security deposit amount (refundable)</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {errors.entire_property_prices && (
                                <div className="mt-2 flex items-center gap-2 text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">{errors.entire_property_prices}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Property Details */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Rooms <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.number_of_rooms}
                                    onChange={(e) => setData('number_of_rooms', Number(e.target.value))}
                                    min="1"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.number_of_rooms ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Kitchens <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.number_of_kitchens}
                                    onChange={(e) => setData('number_of_kitchens', Number(e.target.value))}
                                    min="0"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.number_of_kitchens ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Common Bathrooms <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.common_bathrooms}
                                    onChange={(e) => setData('common_bathrooms', Number(e.target.value))}
                                    min="0"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.common_bathrooms ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seating Capacity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.seating}
                                    onChange={(e) => setData('seating', Number(e.target.value))}
                                    min="0"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.seating ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Video Link</label>
                                <input
                                    type="url"
                                    value={data.video_link}
                                    onChange={(e) => setData('video_link', e.target.value)}
                                    placeholder="https://..."
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.video_link ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                                <textarea
                                    value={data.details}
                                    onChange={(e) => setData('details', e.target.value)}
                                    rows={3}
                                    placeholder="Enter package details..."
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.details ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rooms Section - Only show if not entire property */}
                    {!data.is_entire_property && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Rooms & Pricing</h2>
                            <button
                                type="button"
                                onClick={addRoom}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Room
                            </button>
                        </div>

                        <div className="space-y-4">
                            {data.rooms.map((room, roomIndex) => (
                                <div key={roomIndex} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">Room {roomIndex + 1}</h3>
                                        {data.rooms.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRoom(roomIndex)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Room Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={room.name}
                                                onChange={(e) => updateRoom(roomIndex, 'name', e.target.value)}
                                                placeholder="e.g., Master Bedroom"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Number of Beds <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={room.number_of_beds}
                                                onChange={(e) => updateRoom(roomIndex, 'number_of_beds', Number(e.target.value))}
                                                min="1"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Number of Bathrooms <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={room.number_of_bathrooms}
                                                onChange={(e) => updateRoom(roomIndex, 'number_of_bathrooms', Number(e.target.value))}
                                                min="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Pricing Options */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-gray-700">Pricing Options</label>
                                            {room.prices.length < 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => addPrice(roomIndex)}
                                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add Price
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {room.prices.map((price, priceIndex) => (
                                                <div key={priceIndex} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Type <span className="text-red-500">*</span>
                                                            </label>
                                                            <select
                                                                value={price.type}
                                                                onChange={(e) => updatePrice(roomIndex, priceIndex, 'type', e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="Day">Day</option>
                                                                <option value="Week">Week</option>
                                                                <option value="Month">Month</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Fixed Price <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="flex">
                                                                <span className="inline-flex items-center px-3 text-sm bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                                                                    £
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    value={price.fixed_price}
                                                                    onChange={(e) => updatePrice(roomIndex, priceIndex, 'fixed_price', Number(e.target.value))}
                                                                    step="0.01"
                                                                    min="0"
                                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Discount Price
                                                            </label>
                                                            <div className="flex">
                                                                <span className="inline-flex items-center px-3 text-sm bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                                                                    £
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    value={price.discount_price || ''}
                                                                    onChange={(e) => updatePrice(roomIndex, priceIndex, 'discount_price', e.target.value ? Number(e.target.value) : null)}
                                                                    step="0.01"
                                                                    min="0"
                                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-end gap-2">
                                                            <div className="flex-1">
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Booking Price <span className="text-red-500">*</span>
                                                                </label>
                                                                <div className="flex">
                                                                    <span className="inline-flex items-center px-3 text-sm bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                                                                        £
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        value={price.booking_price}
                                                                        onChange={(e) => updatePrice(roomIndex, priceIndex, 'booking_price', Number(e.target.value))}
                                                                        step="0.01"
                                                                        min="0"
                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {room.prices.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removePrice(roomIndex, priceIndex)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Rent Advance Price <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="flex">
                                                            <span className="inline-flex items-center px-3 text-sm bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                                                                £
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={price.rent_advance_price}
                                                                onChange={(e) => updatePrice(roomIndex, priceIndex, 'rent_advance_price', Number(e.target.value))}
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">Security deposit amount (refundable)</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Instructions Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Package Instructions</h2>
                            <button
                                type="button"
                                onClick={addInstruction}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Instruction
                            </button>
                        </div>

                        <div className="space-y-4">
                            {data.instructions.map((instruction, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">Instruction {index + 1}</h3>
                                        {data.instructions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeInstruction(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={instruction.title}
                                                onChange={(e) => updateInstruction(index, 'title', e.target.value)}
                                                placeholder="Enter instruction title"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={instruction.description}
                                                onChange={(e) => updateInstruction(index, 'description', e.target.value)}
                                                rows={3}
                                                placeholder="Enter instruction details"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Services Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Free Services */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Free Services</h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Free Maintains</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {maintains.map((maintain) => (
                                        <label key={maintain.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.freeMaintains.includes(maintain.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setData('freeMaintains', [...data.freeMaintains, maintain.id]);
                                                    } else {
                                                        setData('freeMaintains', data.freeMaintains.filter((id) => id !== maintain.id));
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{maintain.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Free Amenities</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {amenities.map((amenity) => (
                                        <label key={amenity.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.freeAmenities.includes(amenity.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setData('freeAmenities', [...data.freeAmenities, amenity.id]);
                                                    } else {
                                                        setData('freeAmenities', data.freeAmenities.filter((id) => id !== amenity.id));
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{amenity.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Paid Services */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Paid Services</h2>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-700">Paid Maintains</label>
                                    <button
                                        type="button"
                                        onClick={addPaidMaintain}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add
                                    </button>
                                </div>
                                {data.paidMaintains.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No paid maintains added. Click "Add" to include paid services.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {data.paidMaintains.map((service, index) => (
                                            <div key={index} className="flex gap-2">
                                                <select
                                                    value={service.maintain_id}
                                                    onChange={(e) => updatePaidMaintain(index, 'maintain_id', Number(e.target.value))}
                                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">Select Service</option>
                                                    {maintains.map((maintain) => (
                                                        <option key={maintain.id} value={maintain.id}>
                                                            {maintain.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex w-32">
                                                    <span className="inline-flex items-center px-2 text-sm bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                                                        £
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={service.price}
                                                        onChange={(e) => updatePaidMaintain(index, 'price', Number(e.target.value))}
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Price"
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removePaidMaintain(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-700">Paid Amenities</label>
                                    <button
                                        type="button"
                                        onClick={addPaidAmenity}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add
                                    </button>
                                </div>
                                {data.paidAmenities.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No paid amenities added. Click "Add" to include paid services.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {data.paidAmenities.map((service, index) => (
                                            <div key={index} className="flex gap-2">
                                                <select
                                                    value={service.amenity_id}
                                                    onChange={(e) => updatePaidAmenity(index, 'amenity_id', Number(e.target.value))}
                                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">Select Service</option>
                                                    {amenities.map((amenity) => (
                                                        <option key={amenity.id} value={amenity.id}>
                                                            {amenity.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex w-32">
                                                    <span className="inline-flex items-center px-2 text-sm bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg">
                                                        £
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={service.price}
                                                        onChange={(e) => updatePaidAmenity(index, 'price', Number(e.target.value))}
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Price"
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removePaidAmenity(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Photos Upload */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Photos</h2>

                        {/* Existing Photos */}
                        {existingPhotos.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Existing Photos</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {existingPhotos.map((photo) => (
                                        <div key={photo.id} className="relative group">
                                            <img
                                                src={`/storage/${photo.url}`}
                                                alt="Package photo"
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingPhoto(photo.id)}
                                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Photos Upload */}
                        <div className="mb-4">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> new photos
                                    </p>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* New Photos Preview */}
                        {photoPreview.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">New Photos</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {photoPreview.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`New photo ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewPhoto(index)}
                                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.visit(packageRoutes.index().url)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Updating...' : 'Update Package'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
