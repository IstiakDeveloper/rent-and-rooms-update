import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Search, Home as HomeIcon, Users, Bath, MapPin, Sparkles, TrendingUp, Shield, Clock } from 'lucide-react';
import GuestLayout from '@/layouts/GuestLayout';

interface City {
    id: number;
    name: string;
}

interface Area {
    id: number;
    name: string;
}

interface Photo {
    id: number;
    url: string;
}

interface RoomPrice {
    id: number;
    type: string;
    fixed_price: number;
    discount_price?: number;
}

interface Room {
    id: number;
    roomPrices?: RoomPrice[];
    room_prices?: RoomPrice[]; // Support snake_case from Laravel
}

interface EntirePropertyPrice {
    id: number;
    type: string;
    fixed_price: number;
    discount_price?: number;
}

interface EntireProperty {
    id: number;
    prices: EntirePropertyPrice[];
}

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface AuthUser {
    user: User | null;
}

interface Package {
    id: number;
    name: string;
    address: string;
    number_of_rooms: number;
    common_bathrooms: number;
    seating: number;
    photos: Photo[];
    rooms: Room[];
    entireProperty?: EntireProperty;
    creator?: User;
    assignedPartner?: User;
}

interface HeroSection {
    background_image?: string;
    title_small: string;
    title_big: string;
}

interface HomeDataItem {
    id: number;
    item_title: string;
    item_des: string;
    item_image?: string;
}

interface HomeData {
    id: number;
    section_title: string;
    items: HomeDataItem[];
}

interface Country {
    id: number;
    name: string;
    code: string;
}

interface Header {
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface Footer {
    footer_logo?: string;
    copyright_text?: string;
    address?: string;
    phone?: string;
    email?: string;
    sectionTwo?: any;
    sectionThree?: any;
    sectionFour?: any;
}

interface HomeProps {
    cities: City[];
    areas: Area[];
    packages: Package[] | null;
    noPackagesFound: boolean;
    featuredPackages: Package[];
    heroSection: HeroSection;
    header: Header;
    footer: Footer;
    homeData: HomeData[];
    countries: Country[];
    selectedCountry: number;
    filters: {
        city_id?: number;
        area_id?: number;
        keyword?: string;
    };
}

export default function Home({
    cities,
    areas,
    packages,
    noPackagesFound,
    featuredPackages,
    heroSection,
    header,
    footer,
    homeData,
    countries,
    selectedCountry,
    filters = {}
}: HomeProps) {
    const { auth } = usePage<{ auth: AuthUser }>().props;

    // Debug logging
    console.log('Home page - Auth state:', auth);
    console.log('Home page - User:', auth?.user);
    // Debug logging
    console.log('Home component data:', {
        featuredPackages: featuredPackages?.length || 0,
        packages: packages?.length || 0,
        samplePackage: featuredPackages?.[0],
        sampleRoom: featuredPackages?.[0]?.rooms?.[0]
    });

    const [selectedCity, setSelectedCity] = useState<number | string>(filters.city_id || '');
    const [selectedArea, setSelectedArea] = useState<number | string>(filters.area_id || '');
    const [keyword, setKeyword] = useState(filters.keyword || '');
    const [localAreas, setLocalAreas] = useState<Area[]>(areas);

    // Update areas when city changes
    useEffect(() => {
        if (selectedCity) {
            router.get('/',
                { city_id: selectedCity },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['areas'],
                    onSuccess: (page: any) => {
                        setLocalAreas(page.props.areas || []);
                    }
                }
            );
        } else {
            setLocalAreas([]);
            setSelectedArea('');
        }
    }, [selectedCity]);

    const handleSearch = () => {
        const params: any = {};
        if (selectedCity) params.city_id = selectedCity;
        if (selectedArea) params.area_id = selectedArea;
        if (keyword) params.keyword = keyword;

        router.get('/', params, {
            preserveState: true,
            onSuccess: () => {
                // Scroll to results
                const element = document.getElementById('filterPackage');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    };

    const getFirstAvailablePrice = (prices: any[]) => {
        if (!prices || !Array.isArray(prices)) return null;

        // Priority order: Day, Week, Month
        const types = ['Day', 'Week', 'Month'];
        for (const type of types) {
            const price = prices.find(p => p && p.type === type);
            if (price) {
                return { price, type };
            }
        }
        return null;
    };

    const getPriceIndicator = (type: string) => {
        switch (type) {
            case 'Day':
                return '(P/N by Room)';
            case 'Week':
                return '(P/W by Room)';
            case 'Month':
                return '(P/M by Room)';
            default:
                return '';
        }
    };

    const getPropertyPriceIndicator = (type: string) => {
        switch (type) {
            case 'Day':
                return '(P/N by Property)';
            case 'Week':
                return '(P/W by Property)';
            case 'Month':
                return '(P/M by Property)';
            default:
                return '';
        }
    };

    const renderPackageCard = (pkg: Package, isFeatured = false) => {
        // Validate package data
        if (!pkg || !pkg.id || !pkg.name) {
            console.warn('Invalid package data:', pkg);
            return null;
        }

        // Generate proper URL using partner and package info
        const getPackageUrl = () => {
            // Get partner slug
            const partner = pkg.assignedPartner || pkg.creator;
            const partnerSlug = partner ? partner.name.toLowerCase().replace(/\s+/g, '-') : 'unknown';

            // Get package slug with ID
            const packageSlug = `${pkg.id}-${pkg.name.toLowerCase().replace(/\s+/g, '-')}`;

            return `/properties/${partnerSlug}/${packageSlug}`;
        };

        // Safely get room prices - check both camelCase and snake_case
        const roomPrices = pkg.rooms?.flatMap(room => {
            if (room && (room.roomPrices || room.room_prices)) {
                const prices = room.roomPrices || room.room_prices;
                if (Array.isArray(prices)) {
                    return prices.filter((price: any) => price && typeof price === 'object');
                }
            }
            return [];
        }) || [];

        console.log('Package:', pkg.name);
        console.log('Room Prices:', roomPrices);
        console.log('Property Prices:', pkg.entireProperty?.prices);

        const roomPriceData = getFirstAvailablePrice(roomPrices);
        const roomPrice = roomPriceData?.price;
        const roomPriceType = roomPriceData?.type;
        const roomPriceIndicator = roomPriceType ? getPriceIndicator(roomPriceType) : '';

        // Safely get property prices
        const propertyPrices = (pkg.entireProperty?.prices && Array.isArray(pkg.entireProperty.prices))
            ? pkg.entireProperty.prices.filter(price => price && typeof price === 'object')
            : [];

        const propertyPriceData = getFirstAvailablePrice(propertyPrices);
        const propertyPrice = propertyPriceData?.price;
        const propertyPriceType = propertyPriceData?.type;
        const propertyPriceIndicator = propertyPriceType ? getPropertyPriceIndicator(propertyPriceType) : '';

        console.log('Room Price Data:', roomPriceData);
        console.log('Property Price Data:', propertyPriceData);        const cardSize = isFeatured ? 'h-44' : 'h-48';
        const textSize = isFeatured ? 'text-sm' : 'text-base';
        const priceSize = isFeatured ? 'text-base' : 'text-lg';

        return (
            <a
                key={pkg.id}
                href={getPackageUrl()}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
            >
                {/* Image with Gradient Overlay */}
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    {pkg.photos && pkg.photos.length > 0 ? (
                        <>
                            <img
                                src={`/storage/${pkg.photos[0].url}`}
                                alt={pkg.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <HomeIcon className="w-16 h-16 text-gray-300" />
                        </div>
                    )}

                    {/* Featured Badge */}
                    {isFeatured && (
                        <div className="absolute top-4 right-4">
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1 animate-pulse">
                                <Sparkles className="h-3 w-3" />
                                <span>FEATURED</span>
                            </div>
                        </div>
                    )}
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

                    {/* Price */}
                    <div className="mb-4">
                        {propertyPrice ? (
                            <div className="flex items-baseline gap-2">
                                {propertyPrice.discount_price ? (
                                    <>
                                        <span className="text-sm text-gray-400 line-through">£{propertyPrice.fixed_price}</span>
                                        <span className={`${priceSize} font-bold text-indigo-600`}>£{propertyPrice.discount_price}</span>
                                    </>
                                ) : (
                                    <span className={`${priceSize} font-bold text-indigo-600`}>£{propertyPrice.fixed_price}</span>
                                )}
                                <span className="text-xs text-gray-500">{propertyPriceIndicator}</span>
                            </div>
                        ) : roomPrice ? (
                            <div className="flex items-baseline gap-2">
                                {roomPrice.discount_price ? (
                                    <>
                                        <span className="text-sm text-gray-400 line-through">£{roomPrice.fixed_price}</span>
                                        <span className={`${priceSize} font-bold text-indigo-600`}>£{roomPrice.discount_price}</span>
                                    </>
                                ) : (
                                    <span className={`${priceSize} font-bold text-indigo-600`}>£{roomPrice.fixed_price}</span>
                                )}
                                <span className="text-xs text-gray-500">{roomPriceIndicator}</span>
                            </div>
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <span className={`${priceSize} font-medium text-gray-500`}>Price on request</span>
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                                <HomeIcon className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium">{propertyPrice ? pkg.number_of_rooms : pkg.rooms?.length || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Bath className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium">{pkg.common_bathrooms}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium">{pkg.seating}</span>
                            </div>
                        </div>
                        <div className="text-indigo-600 group-hover:translate-x-2 transition-transform duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </a>
        );
    };

    return (
        <GuestLayout
            header={header}
            footer={footer}
            countries={countries}
            selectedCountry={selectedCountry}
            auth={auth}
        >
            <Head title="Home - Find Your Perfect Property" />

            {/* Hero Section - Modern Gradient Design */}
            <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    {heroSection?.background_image && (
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
                            style={{ backgroundImage: `url('/storage/${heroSection.background_image}')` }}
                        ></div>
                    )}
                    {/* Animated Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/70 via-purple-600/70 to-pink-600/70 animate-gradient"></div>

                    {/* Floating Shapes */}
                    <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-delay"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="text-center mb-12">
                        <p className="text-yellow-300 text-sm sm:text-base font-bold tracking-widest uppercase mb-4 animate-fade-in-down flex items-center justify-center space-x-2">
                            <Sparkles className="h-5 w-5" />
                            <span>{heroSection?.title_small}</span>
                            <Sparkles className="h-5 w-5" />
                        </p>
                        <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 animate-fade-in-up">
                            {heroSection?.title_big}
                        </h1>
                        <p className="text-white/90 text-lg sm:text-xl max-w-2xl mx-auto animate-fade-in">
                            Discover amazing properties in prime locations. Your dream home awaits!
                        </p>
                    </div>

                    {/* Search Form */}
                    <div className="max-w-4xl mx-auto">
                                            {/* Modern Search Form */}
                    <div className="max-w-5xl mx-auto animate-fade-in-up-delay">
                        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
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
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Area</label>
                                    <select
                                        value={selectedArea}
                                        onChange={(e) => setSelectedArea(e.target.value)}
                                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                                        disabled={!selectedCity}
                                    >
                                        <option value="">Select Area</option>
                                        {localAreas.map((area) => (
                                            <option key={area.id} value={area.id}>
                                                {area.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Keyword</label>
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search properties..."
                                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={handleSearch}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
                                    >
                                        <Search className="h-5 w-5" />
                                        <span>Search Properties</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </section>

            {/* Search Results */}
            {packages && packages.length > 0 && (
                <section id="filterPackage" className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-2">Search Results</h2>
                                    <p className="text-gray-600 flex items-center space-x-2">
                                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                                        <span className="font-semibold">{packages.length} properties</span>
                                        <span>found matching your criteria</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {packages
                                .filter(pkg => pkg && pkg.id && pkg.name)
                                .map((pkg) => renderPackageCard(pkg, false))
                                .filter(Boolean)
                            }
                        </div>
                    </div>
                </section>
            )}

            {/* No Results */}
            {noPackagesFound && (
                <section id="filterPackage" className="py-16 bg-gray-50">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-12 text-center">
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-yellow-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                No Properties Found
                            </h3>
                            <p className="text-gray-600 mb-6">
                                We couldn't find any properties matching your search criteria. Try adjusting your filters or search for a different location.
                            </p>
                            <button
                                onClick={() => router.reload()}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 mb-4">
                            Why Choose Us?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            We provide the best service to help you find your perfect home
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Verified Properties</h3>
                            <p className="text-gray-600 leading-relaxed">
                                All properties are thoroughly verified and inspected to ensure quality and safety standards.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                                <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Best Prices</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Competitive pricing with no hidden fees. Get the best value for your money.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
                                <Clock className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">24/7 Support</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Our dedicated team is available round the clock to assist you with any queries.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <p className="text-indigo-600 font-bold text-sm uppercase tracking-wider mb-3 flex items-center justify-center space-x-2">
                            <Sparkles className="h-4 w-4" />
                            <span>Premium Selection</span>
                        </p>
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
                            Featured Properties
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Handpicked properties offering the best value and location
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {featuredPackages && featuredPackages.length > 0 && featuredPackages
                            .filter(pkg => pkg && pkg.id && pkg.name)
                            .map((pkg) => renderPackageCard(pkg, true))
                            .filter(Boolean)
                        }
                    </div>

                    <div className="text-center">
                        <a
                            href="/properties"
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl space-x-2"
                        >
                            <span>View All Properties</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* Home Data Sections */}
            {homeData && homeData.length > 0 && (
                <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {homeData.map((section) => (
                            <div key={section.id} className="mb-16 last:mb-0">
                                <div className="text-center mb-12">
                                    <h2 className="text-4xl font-black text-gray-900 mb-4">
                                        {section.section_title}
                                    </h2>
                                </div>

                                {section.items && section.items.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {section.items.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group"
                                            >
                                                {/* Image */}
                                                {item.item_image && (
                                                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                        <img
                                                            src={`/storage/${item.item_image}`}
                                                            alt={item.item_title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}

                                                {/* Number Badge if no image */}
                                                {!item.item_image && (
                                                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                                        <span className="text-white font-bold text-2xl">{index + 1}</span>
                                                    </div>
                                                )}

                                                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center group-hover:text-indigo-600 transition-colors duration-300">
                                                    {item.item_title}
                                                </h3>
                                                <p className="text-gray-600 leading-relaxed text-center">
                                                    {item.item_des}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <style>{`
                @keyframes gradient {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                    }
                    50% {
                        transform: translateY(-20px) translateX(10px);
                    }
                }

                @keyframes float-delay {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                    }
                    50% {
                        transform: translateY(-30px) translateX(-10px);
                    }
                }

                @keyframes fade-in-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 15s ease infinite;
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                .animate-float-delay {
                    animation: float-delay 8s ease-in-out infinite;
                }

                .animate-fade-in-down {
                    animation: fade-in-down 0.6s ease-out;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out;
                }

                .animate-fade-in-up-delay {
                    animation: fade-in-up 1s ease-out 0.2s both;
                }

                .animate-fade-in {
                    animation: fade-in 1s ease-out 0.4s both;
                }
            `}</style>
        </GuestLayout>
    );
}
