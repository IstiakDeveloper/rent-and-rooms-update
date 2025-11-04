import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import { Search, Filter, MapPin, Bed, Bath, Home, X as CloseIcon, Star, ChevronLeft, ChevronRight, Users } from 'lucide-react';

interface Price {
    id: number;
    price: number;
    duration: string;
}

interface Room {
    id: number;
    name: string;
    prices: Price[];
}

interface EntireProperty {
    id: number;
    prices: Price[];
}

interface Photo {
    id: number;
    url: string;
}

interface City {
    id: number;
    name: string;
}

interface Area {
    id: number;
    name: string;
}

interface Property {
    id: number;
    name: string;
}

interface Package {
    id: number;
    name: string;
    address: string;
    number_of_rooms: number;
    common_bathrooms: number;
    details: string;
    city: City;
    area: Area;
    property: Property;
    photos: Photo[];
    rooms: Room[];
    entireProperty: EntireProperty | null;
}

interface Amenity {
    id: number;
    name: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedPackages {
    data: Package[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    packages: PaginatedPackages;
    cities: City[];
    areas: Area[];
    amenities: Amenity[];
    priceRange: { min: number; max: number };
    filters: {
        search?: string;
        city_id?: number;
        area_id?: number;
        min_price?: number;
        max_price?: number;
        rooms?: number;
        amenities?: number[];
        sort_by?: string;
    };
    footer: any;
    header: any;
    countries: any[];
    selectedCountry: number;
}

export default function PropertiesIndex({
    packages,
    cities,
    areas,
    amenities,
    priceRange,
    filters,
    footer,
    header,
    countries,
    selectedCountry
}: Props) {
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);

    const getMinPrice = (pkg: Package): number => {
        const prices: number[] = [];
        pkg.rooms?.forEach(room => {
            room.prices?.forEach(price => prices.push(price.price));
        });
        pkg.entireProperty?.prices?.forEach(price => prices.push(price.price));
        return prices.length > 0 ? Math.min(...prices) : 0;
    };

    const applyFilters = () => {
        router.get('/properties', localFilters, { preserveState: true, preserveScroll: true });
        setShowMobileFilters(false);
    };

    const resetFilters = () => {
        setLocalFilters({});
        router.get('/properties');
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        if (['city_id', 'sort_by'].includes(key)) {
            setTimeout(() => {
                router.get('/properties', newFilters, { preserveState: true, preserveScroll: true });
            }, 300);
        }
    };

    const toggleAmenity = (amenityId: number) => {
        const currentAmenities = Array.isArray(localFilters.amenities) ? localFilters.amenities : [];
        const newAmenities = currentAmenities.includes(amenityId)
            ? currentAmenities.filter(id => id !== amenityId)
            : [...currentAmenities, amenityId];
        handleFilterChange('amenities', newAmenities);
    };

    const FilterSection = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    City
                </label>
                <select
                    value={localFilters.city_id || ''}
                    onChange={(e) => handleFilterChange('city_id', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="">All Cities</option>
                    {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                </select>
            </div>

            {localFilters.city_id && areas.length > 0 && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Area</label>
                    <select
                        value={localFilters.area_id || ''}
                        onChange={(e) => handleFilterChange('area_id', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">All Areas</option>
                        {areas.map(area => (
                            <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range (Weekly)</label>
                <div className="flex gap-3">
                    <input
                        type="number"
                        placeholder="Min £"
                        value={localFilters.min_price || ''}
                        onChange={(e) => handleFilterChange('min_price', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-gray-400 self-center">-</span>
                    <input
                        type="number"
                        placeholder="Max £"
                        value={localFilters.max_price || ''}
                        onChange={(e) => handleFilterChange('max_price', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Bed className="inline h-4 w-4 mr-1" />
                    Minimum Rooms
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                        <button
                            key={num}
                            onClick={() => handleFilterChange('rooms', num === localFilters.rooms ? '' : num)}
                            className={`px-3 py-2 rounded-lg font-medium transition-all ${
                                localFilters.rooms === num
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                        >
                            {num}+
                        </button>
                    ))}
                </div>
            </div>

            {amenities.length > 0 && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Amenities</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {amenities.slice(0, 10).map(amenity => (
                            <label
                                key={amenity.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={Array.isArray(localFilters.amenities) && localFilters.amenities.includes(amenity.id)}
                                    onChange={() => toggleAmenity(amenity.id)}
                                    className="w-5 h-5 text-indigo-600 border-2 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">{amenity.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={applyFilters}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
                Apply Filters
            </button>
        </div>
    );

    return (
        <GuestLayout footer={footer} header={header} countries={countries} selectedCountry={selectedCountry}>
            <Head title="Properties - Find Your Perfect Home" />

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full animate-pulse"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Find Your Perfect Property</h1>
                    <p className="text-xl md:text-2xl text-indigo-100 mb-8">
                        Discover {packages.total}+ amazing properties across the UK
                    </p>
                    <div className="max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                            <input
                                type="text"
                                placeholder="Search by location, name, or keyword..."
                                value={localFilters.search || ''}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full pl-14 pr-4 py-4 text-gray-900 rounded-2xl shadow-2xl focus:ring-4 focus:ring-white/30 focus:outline-none text-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-80 shrink-0">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Filter className="h-6 w-6 text-indigo-600" />
                                        Filters
                                    </h2>
                                    <button
                                        onClick={resetFilters}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <FilterSection />
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Filter Button */}
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className="lg:hidden fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl z-50"
                    >
                        <Filter className="h-6 w-6" />
                    </button>

                    {/* Mobile Filter Modal */}
                    {showMobileFilters && (
                        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
                            <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                        <button
                                            onClick={() => setShowMobileFilters(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <CloseIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <FilterSection />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Properties Grid */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">{packages.total}</span> properties found
                            </p>
                            <select
                                value={localFilters.sort_by || 'created_at'}
                                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="created_at">Newest First</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>
                        </div>

                        {packages.data.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                                    {packages.data.map(pkg => {
                                        const minPrice = getMinPrice(pkg);
                                        const mainPhoto = pkg.photos[0]?.url;
                                        return (
                                            <Link
                                                key={pkg.id}
                                                href={`/properties/property/${pkg.id}-${pkg.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                                            >
                                                {/* Image with Gradient Overlay */}
                                                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                                                    {mainPhoto ? (
                                                        <>
                                                            <img
                                                                src={`/storage/${mainPhoto}`}
                                                                alt={pkg.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Home className="w-16 h-16 text-gray-300" />
                                                        </div>
                                                    )}

                                                    {/* Featured Badge */}
                                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-xs font-semibold text-gray-900">Featured</span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-300">
                                                        {pkg.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-4 line-clamp-1 flex items-center">
                                                        <MapPin className="h-4 w-4 mr-1 text-indigo-500" />
                                                        {pkg.address}
                                                    </p>

                                                    {/* Price Display */}
                                                    {minPrice > 0 && (
                                                        <div className="mb-4">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                                    £{minPrice}
                                                                </span>
                                                                <span className="text-sm text-gray-500 font-medium">/week</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Features */}
                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                            <div className="flex items-center space-x-1">
                                                                <Home className="w-4 h-4 text-indigo-500" />
                                                                <span className="font-medium">{pkg.number_of_rooms}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <Users className="w-4 h-4 text-indigo-500" />
                                                                <span className="font-medium">{pkg.number_of_rooms}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <Bath className="w-4 h-4 text-indigo-500" />
                                                                <span className="font-medium">{pkg.common_bathrooms}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                                            View →
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {packages.last_page > 1 && (
                                    <div className="flex justify-center items-center gap-2">
                                        {packages.links.map((link, index) => {
                                            if (link.label.includes('Previous')) {
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => link.url && router.get(link.url)}
                                                        disabled={!link.url}
                                                        className={`p-2 rounded-lg ${
                                                            link.url
                                                                ? 'bg-white border-2 border-gray-200 hover:border-indigo-600'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </button>
                                                );
                                            }
                                            if (link.label.includes('Next')) {
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => link.url && router.get(link.url)}
                                                        disabled={!link.url}
                                                        className={`p-2 rounded-lg ${
                                                            link.url
                                                                ? 'bg-white border-2 border-gray-200 hover:border-indigo-600'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <ChevronRight className="h-5 w-5" />
                                                    </button>
                                                );
                                            }
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => link.url && router.get(link.url)}
                                                    disabled={!link.url}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                        link.active
                                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                                            : link.url
                                                            ? 'bg-white border-2 border-gray-200 hover:border-indigo-600 text-gray-700'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                                <Home className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No properties found</h3>
                                <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
                                <button
                                    onClick={resetFilters}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
