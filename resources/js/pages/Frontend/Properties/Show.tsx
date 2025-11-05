import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import GuestLayout from '@/layouts/GuestLayout';
import { useAuthModal } from '@/contexts/AuthModalContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
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
    User,
    Clock,
    CheckCircle,
    AlertCircle,
    ImageIcon,
    Play,
    Sparkles
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
    prices?: RoomPrice[];
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
    auth?: {
        user?: any;
    };
}

export default function PropertiesShow({
    package: pkg,
    relatedPackages,
    footer,
    header,
    countries,
    selectedCountry,
    auth
}: Props) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const { openLogin, openRegister } = useAuthModal();

    // Modern booking form state with Date objects
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calendar popup states
    const [isFromDateOpen, setIsFromDateOpen] = useState(false);
    const [isToDateOpen, setIsToDateOpen] = useState(false);
    const fromDateRef = useRef<HTMLDivElement>(null);
    const toDateRef = useRef<HTMLDivElement>(null);

    // Check if user is authenticated
    const isAuthenticated = auth?.user ? true : false;

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

    // Create portal div for calendar and handle click outside
    useEffect(() => {
        // Create portal div if it doesn't exist
        if (!document.getElementById('date-picker-portal')) {
            const portalDiv = document.createElement('div');
            portalDiv.id = 'date-picker-portal';
            portalDiv.style.position = 'fixed';
            portalDiv.style.top = '0';
            portalDiv.style.left = '0';
            portalDiv.style.zIndex = '9999';
            portalDiv.style.pointerEvents = 'none';
            document.body.appendChild(portalDiv);
        }

        // Handle click outside to close calendars
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            // Don't close if clicking on calendar
            if (target && (target as Element).closest('.react-datepicker')) {
                return;
            }

            if (fromDateRef.current && !fromDateRef.current.contains(target)) {
                setIsFromDateOpen(false);
            }
            if (toDateRef.current && !toDateRef.current.contains(target)) {
                setIsToDateOpen(false);
            }
        };

        // Handle scroll to close calendars
        const handleScroll = () => {
            setIsFromDateOpen(false);
            setIsToDateOpen(false);
        };

        // Handle escape key to close calendars
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsFromDateOpen(false);
                setIsToDateOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            document.removeEventListener('keydown', handleEscape);
            const portalDiv = document.getElementById('date-picker-portal');
            if (portalDiv) {
                document.body.removeChild(portalDiv);
            }
        };
    }, []);

    const previousImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    // Modern price calculation with proper room price support
    const getFirstAvailablePrice = () => {
        if (pkg.rooms && pkg.rooms.length > 0) {
            const firstRoom = pkg.rooms[0];
            const roomPrices = firstRoom.roomPrices || firstRoom.room_prices || firstRoom.prices || [];

            // Priority: Day -> Week -> Month
            const dayPrice = roomPrices.find(p => p.type === 'Day');
            const weekPrice = roomPrices.find(p => p.type === 'Week');
            const monthPrice = roomPrices.find(p => p.type === 'Month');

            return dayPrice || weekPrice || monthPrice;
        } else if (pkg.entireProperty?.prices) {
            const prices = pkg.entireProperty.prices;

            // Priority: Day -> Week -> Month
            const dayPrice = prices.find(p => p.type === 'Day');
            const weekPrice = prices.find(p => p.type === 'Week');
            const monthPrice = prices.find(p => p.type === 'Month');

            return dayPrice || weekPrice || monthPrice;
        }
        return null;
    };

    const firstPrice = getFirstAvailablePrice();

    // Form validation
    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!selectedRoom) newErrors.selectedRoom = 'Please select a room';
        if (!fromDate) newErrors.fromDate = 'Please select check-in date';
        if (!toDate) newErrors.toDate = 'Please select check-out date';
        if (!name.trim()) newErrors.name = 'Please enter your name';
        if (!email.trim()) newErrors.email = 'Please enter your email';
        if (!phone.trim()) newErrors.phone = 'Please enter your phone number';

        if (fromDate && toDate && fromDate >= toDate) {
            newErrors.toDate = 'Check-out date must be after check-in date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Form submission
    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Submit booking logic here
            console.log('Booking submitted:', {
                selectedRoom,
                fromDate,
                toDate,
                name,
                email,
                phone
            });

            // Success feedback
            alert('Booking request submitted successfully!');
        } catch (error) {
            console.error('Booking error:', error);
            alert('Error submitting booking. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
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

    // Truncate description
    const words = pkg.details?.split(' ') || [];
    const displayWords = showMore ? words : words.slice(0, 100);

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
                        <div className="relative rounded-2xl overflow-hidden bg-linear-to-br from-gray-100 to-gray-200" style={{ height: '500px' }}>
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
                                            <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-indigo-500" />
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
                                        <div className="shrink-0">
                                            <div className="text-right">
                                                <div className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
                                        <div className="w-12 h-12 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
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
                                    <div className="flex flex-col items-center p-4 bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl">
                                        <Home className="w-8 h-8 text-indigo-600 mb-2" />
                                        <span className="text-2xl font-bold text-gray-900">{pkg.number_of_rooms}</span>
                                        <span className="text-xs text-gray-600">Rooms</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl">
                                        <Bath className="w-8 h-8 text-purple-600 mb-2" />
                                        <span className="text-2xl font-bold text-gray-900">{pkg.common_bathrooms}</span>
                                        <span className="text-xs text-gray-600">Bathrooms</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-linear-to-br from-pink-50 to-orange-50 rounded-xl">
                                        <Home className="w-8 h-8 text-pink-600 mb-2" />
                                        <span className="text-2xl font-bold text-gray-900">{pkg.number_of_kitchens}</span>
                                        <span className="text-xs text-gray-600">Kitchens</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-linear-to-br from-orange-50 to-yellow-50 rounded-xl">
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
                                                        <div key={price.id} className="bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-4 py-2 rounded-full">
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
                                                    <div className="relative h-48 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
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
                                                            <div className="text-lg font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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

                        {/* Right Column - Professional Booking Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-24">
                                {/* Header */}
                                <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                            <Calendar className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Book This Property</h2>
                                    </div>
                                    <p className="text-indigo-100 text-sm mt-1">Simple 3-step booking process</p>
                                </div>

                                {isAuthenticated ? (
                                    <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
                                        {/* Step 1: Room Selection */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                                <h3 className="text-lg font-semibold text-gray-900">Select Room</h3>
                                            </div>

                                            {pkg.rooms && pkg.rooms.length > 0 ? (
                                                <div className="relative">
                                                    <select
                                                        value={selectedRoom}
                                                        onChange={(e) => {
                                                            setSelectedRoom(e.target.value);
                                                            setErrors(prev => ({ ...prev, selectedRoom: '' }));
                                                        }}
                                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 appearance-none text-gray-900 font-medium"
                                                    >
                                                        <option value="">Choose a room type...</option>
                                                        {pkg.rooms.map((room) => {
                                                            const prices = room.roomPrices || room.room_prices || room.prices || [];
                                                            const firstPrice = prices.length > 0 ? prices[0] : null;
                                                            const displayPrice = firstPrice
                                                                ? `£${firstPrice.discount_price || firstPrice.fixed_price}/${firstPrice.type?.toLowerCase()}`
                                                                : 'Price on request';

                                                            return (
                                                                <option key={room.id} value={room.id}>
                                                                    {room.name} - {room.number_of_beds} beds, {room.number_of_bathrooms} bath - {displayPrice}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                                </div>
                                            ) : (
                                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                                    <p className="text-gray-500">No rooms available</p>
                                                </div>
                                            )}

                                            {/* Selected Room Details */}
                                            {selectedRoom && (
                                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                                    {(() => {
                                                        const room = pkg.rooms.find(r => r.id.toString() === selectedRoom);
                                                        if (!room) return null;
                                                        const prices = room.roomPrices || room.room_prices || room.prices || [];

                                                        return (
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                                                                    <span className="font-semibold text-indigo-900">{room.name}</span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3 text-sm text-indigo-700 mb-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <Bed className="w-4 h-4" />
                                                                        <span>{room.number_of_beds} beds</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Bath className="w-4 h-4" />
                                                                        <span>{room.number_of_bathrooms} bath</span>
                                                                    </div>
                                                                </div>
                                                                {prices.length > 0 && (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {prices.map((price) => (
                                                                            <div key={price.id} className="bg-white border border-indigo-200 px-3 py-1 rounded-full text-sm">
                                                                                {price.discount_price ? (
                                                                                    <>
                                                                                        <span className="text-gray-400 line-through mr-2">£{price.fixed_price}</span>
                                                                                        <span className="font-bold text-indigo-600">£{price.discount_price}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span className="font-bold text-indigo-600">£{price.fixed_price}</span>
                                                                                )}
                                                                                <span className="text-indigo-500 ml-1">/{price.type?.toLowerCase()}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {errors.selectedRoom && (
                                                <p className="text-red-500 text-sm flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {errors.selectedRoom}
                                                </p>
                                            )}
                                        </div>

                                        {/* Step 2: Select Dates */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                                <h3 className="text-lg font-semibold text-gray-900">Select Dates</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative" ref={fromDateRef}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Check-in
                                                    </label>
                                                    <div
                                                        className="relative w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm cursor-pointer bg-white flex items-center justify-between"
                                                        onClick={() => {
                                                            setIsFromDateOpen(true);
                                                            setIsToDateOpen(false);
                                                        }}
                                                    >
                                                        <span>{fromDate ? fromDate.toLocaleDateString() : 'Select date'}</span>
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                    </div>

                                                    {isFromDateOpen && createPortal(
                                                        <div
                                                            className="fixed z-9999 bg-white border border-gray-300 rounded-xl shadow-2xl"
                                                            style={{
                                                                top: fromDateRef.current ? fromDateRef.current.getBoundingClientRect().bottom + 5 : 0,
                                                                left: fromDateRef.current ? fromDateRef.current.getBoundingClientRect().left : 0,
                                                                pointerEvents: 'auto'
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <DatePicker
                                                                selected={fromDate}
                                                                onChange={(date) => {
                                                                    if (date) {
                                                                        setFromDate(date);
                                                                        setErrors(prev => ({ ...prev, fromDate: '' }));
                                                                        setTimeout(() => {
                                                                            setIsFromDateOpen(false);
                                                                        }, 100);
                                                                    }
                                                                }}
                                                                minDate={new Date()}
                                                                inline
                                                                calendarClassName="react-datepicker-calendar"
                                                            />
                                                        </div>,
                                                        document.body
                                                    )}

                                                    {errors.fromDate && (
                                                        <p className="text-red-500 text-xs mt-1">{errors.fromDate}</p>
                                                    )}
                                                </div>

                                                <div className="relative" ref={toDateRef}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Check-out
                                                    </label>
                                                    <div
                                                        className="relative w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm cursor-pointer bg-white flex items-center justify-between"
                                                        onClick={() => {
                                                            setIsToDateOpen(true);
                                                            setIsFromDateOpen(false);
                                                        }}
                                                    >
                                                        <span>{toDate ? toDate.toLocaleDateString() : 'Select date'}</span>
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                    </div>

                                                    {isToDateOpen && createPortal(
                                                        <div
                                                            className="fixed z-9999 bg-white border border-gray-300 rounded-xl shadow-2xl"
                                                            style={{
                                                                top: toDateRef.current ? toDateRef.current.getBoundingClientRect().bottom + 5 : 0,
                                                                left: toDateRef.current ? toDateRef.current.getBoundingClientRect().left : 0,
                                                                pointerEvents: 'auto'
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <DatePicker
                                                                selected={toDate}
                                                                onChange={(date) => {
                                                                    if (date) {
                                                                        setToDate(date);
                                                                        setErrors(prev => ({ ...prev, toDate: '' }));
                                                                        setTimeout(() => {
                                                                            setIsToDateOpen(false);
                                                                        }, 100);
                                                                    }
                                                                }}
                                                                minDate={fromDate || new Date()}
                                                                inline
                                                                calendarClassName="react-datepicker-calendar"
                                                            />
                                                        </div>,
                                                        document.body
                                                    )}

                                                    {errors.toDate && (
                                                        <p className="text-red-500 text-xs mt-1">{errors.toDate}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3: Contact Information */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                                <h3 className="text-lg font-semibold text-gray-900">Contact Info</h3>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Your full name"
                                                        value={name}
                                                        onChange={(e) => {
                                                            setName(e.target.value);
                                                            setErrors(prev => ({ ...prev, name: '' }));
                                                        }}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                    {errors.name && (
                                                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <input
                                                        type="email"
                                                        placeholder="Your email address"
                                                        value={email}
                                                        onChange={(e) => {
                                                            setEmail(e.target.value);
                                                            setErrors(prev => ({ ...prev, email: '' }));
                                                        }}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                    {errors.email && (
                                                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <input
                                                        type="tel"
                                                        placeholder="Your phone number"
                                                        value={phone}
                                                        onChange={(e) => {
                                                            setPhone(e.target.value);
                                                            setErrors(prev => ({ ...prev, phone: '' }));
                                                        }}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                    {errors.phone && (
                                                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Processing...
                                                </div>
                                            ) : (
                                                'Send Booking Request'
                                            )}
                                        </button>

                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                <span className="font-medium">Featured Property</span>
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="p-6 text-center">
                                        <div className="mb-6">
                                            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
                                            <p className="text-gray-600">Please sign in to book this property</p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={openLogin}
                                                className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                                            >
                                                Sign In to Book
                                            </button>

                                            <button
                                                onClick={openRegister}
                                                className="w-full bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                                            >
                                                Create New Account
                                            </button>
                                        </div>

                                        <p className="text-xs text-gray-500 mt-4">
                                            New to our platform? Sign up for free and start booking amazing properties!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}
