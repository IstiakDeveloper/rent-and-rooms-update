import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import {
    ChevronLeft,
    ChevronRight,
    X as CloseIcon,
    MapPin,
    ExternalLink,
    Home,
    Bath,
    Users,
    Bed,
    Star,
    Calendar,
    Phone,
    Mail,
    User
} from 'lucide-react';

interface Photo {
    id: number;
    url: string;
}

interface RoomPrice {
    id: number;
    room_id: number;
    type: string;
    fixed_price: number;
    discount_price?: number;
}

interface Room {
    id: number;
    name: string;
    number_of_beds: number;
    number_of_bathrooms: number;
    prices: RoomPrice[];
    roomPrices: RoomPrice[];
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

interface Partner {
    id: number;
    name: string;
    profile_photo_path?: string;
}

interface Package {
    id: number;
    name: string;
    address: string;
    map_link?: string;
    video_link?: string;
    number_of_rooms: number;
    number_of_kitchens: number;
    common_bathrooms: number;
    seating: number;
    details: string;
    city: City;
    area: Area;
    property: Property;
    photos: Photo[];
    rooms: Room[];
    entireProperty?: EntireProperty;
    assignedPartner?: Partner;
}

interface Props {
    package: Package;
    relatedPackages: Package[];
    footer: any;
    header: any;
    countries: any[];
    selectedCountry: number;
}

export default function PropertiesShow({
    package: pkg,
    relatedPackages,
    footer,
    header,
    countries,
    selectedCountry
}: Props) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [showMore, setShowMore] = useState(false);

    // Booking form state
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const images = pkg.photos.map(photo => `/storage/${photo.url}`);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') previousImage();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'Escape') setShowLightbox(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentImageIndex]);

    const previousImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const openLightbox = () => {
        setShowLightbox(true);
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        setShowLightbox(false);
        document.body.style.overflow = '';
    };

    // Extract YouTube video ID
    const getYouTubeId = (url: string) => {
        const match = url?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
        return match ? match[1] : null;
    };

    const videoId = pkg.video_link ? getYouTubeId(pkg.video_link) : null;

    // Get first price for display
    const getFirstPrice = () => {
        const roomPrices = pkg.rooms.flatMap(room => room.roomPrices || room.prices || []);
        return roomPrices[0] || pkg.entireProperty?.prices[0];
    };

    const firstPrice = getFirstPrice();

    // Truncate description
    const words = pkg.details?.split(' ') || [];
    const displayWords = showMore ? words : words.slice(0, 100);

    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle booking submission
        console.log({ fromDate, toDate, selectedRoom, name, email, phone });
    };

    const getMinPrice = (p: Package): number => {
        const prices: number[] = [];
        p.rooms?.forEach(room => {
            (room.prices || room.roomPrices || []).forEach(price => {
                prices.push(price.discount_price || price.fixed_price);
            });
        });
        p.entireProperty?.prices?.forEach(price => {
            prices.push(price.discount_price || price.fixed_price);
        });
        return prices.length > 0 ? Math.min(...prices) : 0;
    };

    return (
        <GuestLayout footer={footer} header={header} countries={countries} selectedCountry={selectedCountry}>
            <Head title={`${pkg.name} - Property Details`} />

            {/* Back Button */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
                <section className="bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200" style={{ height: '500px' }}>
                            <img
                                src={images[currentImageIndex]}
                                alt={pkg.name}
                                className="w-full h-full object-cover cursor-pointer transition-opacity duration-300"
                                onClick={openLightbox}
                            />

                            {/* Navigation Controls */}
                            {images.length > 1 && (
                                <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); previousImage(); }}
                                        className="pointer-events-auto bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-transform hover:scale-110"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="pointer-events-auto bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-transform hover:scale-110"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-700" />
                                    </button>
                                </div>
                            )}

                            {/* Image Counter */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                <span className="inline-block bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full">
                                    {currentImageIndex + 1} / {images.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Lightbox */}
            {showLightbox && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="relative max-w-7xl max-h-screen p-4">
                        <img
                            src={images[currentImageIndex]}
                            alt={pkg.name}
                            className="max-w-full max-h-screen object-contain"
                        />
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                        >
                            <CloseIcon className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            )}

            {/* Video Section */}
            {videoId && (
                <section className="bg-white py-6">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="relative rounded-2xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                className="absolute inset-0 w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Main Content */}
            <section className="py-8 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Property Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Property Header */}
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold text-gray-900 mb-3">{pkg.name}</h1>
                                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                                            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-indigo-500" />
                                            <span>{pkg.address}</span>
                                        </div>
                                        {pkg.map_link && (
                                            <a
                                                href={pkg.map_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                            >
                                                View on Map
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>

                                    {/* Price Display */}
                                    {firstPrice && (
                                        <div className="flex-shrink-0">
                                            <div className="text-right">
                                                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                    £{firstPrice.discount_price || firstPrice.fixed_price}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    per {firstPrice.type?.toLowerCase()}
                                                </div>
                                                {firstPrice.discount_price && (
                                                    <div className="text-sm text-gray-400 line-through">
                                                        £{firstPrice.fixed_price}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Partner Info */}
                                {pkg.assignedPartner && (
                                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                            {pkg.assignedPartner.profile_photo_path ? (
                                                <img
                                                    src={`/storage/${pkg.assignedPartner.profile_photo_path}`}
                                                    alt={pkg.assignedPartner.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-medium">Hosted by</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {pkg.assignedPartner.name}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                    <p>
                                        {displayWords.join(' ')}
                                        {words.length > 100 && (
                                            <button
                                                onClick={() => setShowMore(!showMore)}
                                                className="text-indigo-600 hover:text-indigo-700 font-medium ml-1 transition-colors"
                                            >
                                                {showMore ? 'Show less' : '... Show more'}
                                            </button>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Property Features */}
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Property Features</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                                        <Home className="w-8 h-8 text-indigo-600 mb-2" />
                                        <span className="text-2xl font-bold text-gray-900">{pkg.number_of_rooms}</span>
                                        <span className="text-xs text-gray-600">Rooms</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                        <Bath className="w-8 h-8 text-purple-600 mb-2" />
                                        <span className="text-2xl font-bold text-gray-900">{pkg.common_bathrooms}</span>
                                        <span className="text-xs text-gray-600">Bathrooms</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl">
                                        <Home className="w-8 h-8 text-pink-600 mb-2" />
                                        <span className="text-2xl font-bold text-gray-900">{pkg.number_of_kitchens}</span>
                                        <span className="text-xs text-gray-600">Kitchens</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl">
                                        <Users className="w-8 h-8 text-orange-600 mb-2" />
                                        <span className="text-2xl font-bold text-gray-900">{pkg.seating}</span>
                                        <span className="text-xs text-gray-600">Seating</span>
                                    </div>
                                </div>
                            </div>

                            {/* Available Rooms */}
                            {pkg.rooms && pkg.rooms.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rooms</h2>
                                    <div className="space-y-4">
                                        {pkg.rooms.map((room) => (
                                            <div key={room.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
                                                <h3 className="font-bold text-gray-900 mb-3 text-lg">{room.name}</h3>
                                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Bed className="w-5 h-5 text-indigo-500" />
                                                        <span className="font-medium">{room.number_of_beds} Beds</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Bath className="w-5 h-5 text-indigo-500" />
                                                        <span className="font-medium">{room.number_of_bathrooms} Bathrooms</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(room.roomPrices || room.prices || []).map((price) => (
                                                        <div key={price.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-4 py-2 rounded-full">
                                                            <span className="font-bold text-gray-900">
                                                                £{price.discount_price || price.fixed_price}
                                                            </span>
                                                            <span className="text-gray-600 text-sm"> / {price.type?.toLowerCase()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Related Properties */}
                            {relatedPackages.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Properties</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {relatedPackages.map((related) => {
                                            const minPrice = getMinPrice(related);
                                            const mainPhoto = related.photos[0]?.url;
                                            return (
                                                <Link
                                                    key={related.id}
                                                    href={`/properties/property/${related.id}-${related.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                    className="group bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 overflow-hidden transition-all duration-300 hover:shadow-lg"
                                                >
                                                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                                                        {mainPhoto ? (
                                                            <img
                                                                src={`/storage/${mainPhoto}`}
                                                                alt={related.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Home className="w-12 h-12 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                            {related.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mb-2 line-clamp-1 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-indigo-500" />
                                                            {related.city.name}, {related.area.name}
                                                        </p>
                                                        {minPrice > 0 && (
                                                            <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                                £{minPrice}/week
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Booking Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Book This Property</h2>

                                <form onSubmit={handleBookingSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Calendar className="inline w-4 h-4 mr-1" />
                                            Check-in Date
                                        </label>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Calendar className="inline w-4 h-4 mr-1" />
                                            Check-out Date
                                        </label>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Home className="inline w-4 h-4 mr-1" />
                                            Select Room
                                        </label>
                                        <select
                                            value={selectedRoom}
                                            onChange={(e) => setSelectedRoom(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        >
                                            <option value="">Choose a room</option>
                                            {pkg.rooms.map((room) => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <User className="inline w-4 h-4 mr-1" />
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Mail className="inline w-4 h-4 mr-1" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Phone className="inline w-4 h-4 mr-1" />
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                                    >
                                        Continue to Checkout
                                    </button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <span className="font-medium">Featured Property</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}
