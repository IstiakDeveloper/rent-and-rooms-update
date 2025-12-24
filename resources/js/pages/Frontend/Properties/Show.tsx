import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import GuestLayout from '@/layouts/GuestLayout';
import AuthModal from '@/components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
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
    Sparkles,
    BookOpen,
    KeyRound
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

interface Amenity {
    id: number;
    name: string;
    amenity_type_id: number;
    amenityType?: {
        id: number;
        type: string;
    };
    pivot?: {
        is_paid: number;
        price?: number;
    };
}

interface Maintain {
    id: number;
    name: string;
    photo?: string;
    maintain_type_id: number;
    maintainType?: {
        id: number;
        type: string;
    };
    pivot?: {
        is_paid: number;
        price?: number;
    };
}

interface PackageAmenity {
    id: number;
    package_id: number;
    amenity_id: number;
    is_paid: number;
    price?: number;
    amenity: Amenity;
}

interface PackageMaintain {
    id: number;
    package_id: number;
    maintain_id: number;
    is_paid: number;
    price?: number;
    maintain: Maintain;
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
    amenities?: Amenity[];
    maintains?: Maintain[];
    packageAmenities?: PackageAmenity[];
    packageMaintains?: PackageMaintain[];
    // Snake case versions from Laravel
    package_amenities?: PackageAmenity[];
    package_maintains?: PackageMaintain[];
}

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    status?: string;
}

interface AuthUser {
    user: User | null;
}

interface Header {
    id: number;
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface Footer {
    footer_logo?: string;
    address?: string;
    email?: string;
    contact_number?: string;
    website?: string;
    terms_title?: string;
    terms_link?: string;
    privacy_title?: string;
    privacy_link?: string;
    rights_reserves_text?: string;
}

interface Props {
    package: Package;
    relatedPackages: Package[];
    footer: Footer;
    header: Header;
    countries: any[];
    selectedCountry: number;
    auth?: AuthUser;
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

    // Debug: Log package services data
    console.log('Show Page - Package Services:', {
        amenities: pkg.amenities,
        maintains: pkg.maintains,
        packageAmenities: pkg.packageAmenities,
        packageMaintains: pkg.packageMaintains,
        package_amenities: pkg.package_amenities,
        package_maintains: pkg.package_maintains,
    });

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [showMore, setShowMore] = useState(false);    // Auth modal state
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);


    // Modern booking form state with Date objects
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedAmenities, setSelectedAmenities] = useState<Array<{ id: number, name: string, price: number }>>([]);
    const [selectedMaintains, setSelectedMaintains] = useState<Array<{ id: number, name: string, price: number }>>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calendar popup states
    const [isFromDateOpen, setIsFromDateOpen] = useState(false);
    const [isToDateOpen, setIsToDateOpen] = useState(false);
    const fromDateRef = useRef<HTMLDivElement>(null);
    const toDateRef = useRef<HTMLDivElement>(null);

    // Check if user is authenticated
    const isAuthenticated = auth?.user ? true : false;

    // Pre-fill form with user data if authenticated
    useEffect(() => {
        if (isAuthenticated && auth?.user) {
            setName(auth.user.name || '');
            setEmail(auth.user.email || '');
            // Phone is not available in auth, so leave it empty for user to fill
        }
    }, [isAuthenticated, auth?.user]);

    // Calculate total price based on selections with smart pricing
    const calculateTotalPrice = () => {
        let total = 0;

        // Add selected amenities
        total += selectedAmenities.reduce((sum, amenity) => sum + Number(amenity.price || 0), 0);

        // Add selected maintains
        total += selectedMaintains.reduce((sum, maintain) => sum + Number(maintain.price || 0), 0);

        // Add room price if room and dates are selected
        if (selectedRoom && fromDate && toDate) {
            const room = pkg.rooms?.find(r => r.id.toString() === selectedRoom);
            if (room) {
                const prices = room.roomPrices || room.room_prices || room.prices || [];
                const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

                const dayPrice = prices.find(p => p.type === 'Day');
                const weekPrice = prices.find(p => p.type === 'Week');
                const monthPrice = prices.find(p => p.type === 'Month');

                // Smart pricing logic based on duration
                if (totalDays >= 30) {
                    // For 30+ days, prefer Month price
                    if (monthPrice) {
                        const months = Math.ceil(totalDays / 30);
                        total += (monthPrice.discount_price || monthPrice.fixed_price) * months;
                    } else if (weekPrice) {
                        const weeks = Math.ceil(totalDays / 7);
                        total += (weekPrice.discount_price || weekPrice.fixed_price) * weeks;
                    } else if (dayPrice) {
                        total += (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                    }
                } else if (totalDays >= 7) {
                    // For 7-29 days, prefer Week price
                    if (weekPrice) {
                        const weeks = Math.ceil(totalDays / 7);
                        total += (weekPrice.discount_price || weekPrice.fixed_price) * weeks;
                    } else if (dayPrice) {
                        total += (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                    } else if (monthPrice) {
                        // Calculate from month price
                        const dailyRate = (monthPrice.discount_price || monthPrice.fixed_price) / 30;
                        total += dailyRate * totalDays;
                    }
                } else {
                    // For less than 7 days, prefer Day price
                    if (dayPrice) {
                        total += (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                    } else if (weekPrice) {
                        // Calculate from week price
                        const dailyRate = (weekPrice.discount_price || weekPrice.fixed_price) / 7;
                        total += dailyRate * totalDays;
                    } else if (monthPrice) {
                        // Calculate from month price
                        const dailyRate = (monthPrice.discount_price || monthPrice.fixed_price) / 30;
                        total += dailyRate * totalDays;
                    }
                }
            }
        }

        return total;
    };

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

    // Smart price calculation - shows per day price intelligently
    const getSmartDailyPrice = () => {
        let prices: RoomPrice[] | EntirePropertyPrice[] = [];

        if (pkg.rooms && pkg.rooms.length > 0) {
            const firstRoom = pkg.rooms[0];
            prices = firstRoom.roomPrices || firstRoom.room_prices || firstRoom.prices || [];
        } else if (pkg.entireProperty?.prices) {
            prices = pkg.entireProperty.prices;
        }

        if (prices.length === 0) return null;

        const dayPrice = prices.find(p => p.type === 'Day');
        const weekPrice = prices.find(p => p.type === 'Week');
        const monthPrice = prices.find(p => p.type === 'Month');

        // Priority: Day price first
        if (dayPrice) {
            return {
                price: dayPrice.discount_price || dayPrice.fixed_price,
                type: 'Day',
                original: dayPrice
            };
        }

        // If no Day price, calculate from Week price
        if (weekPrice) {
            const pricePerDay = (weekPrice.discount_price || weekPrice.fixed_price) / 7;
            return {
                price: pricePerDay,
                type: 'Week',
                original: weekPrice,
                calculated: true
            };
        }

        // If no Day or Week price, calculate from Month price
        if (monthPrice) {
            const pricePerDay = (monthPrice.discount_price || monthPrice.fixed_price) / 30;
            return {
                price: pricePerDay,
                type: 'Month',
                original: monthPrice,
                calculated: true
            };
        }

        return null;
    };

    const smartDailyPrice = getSmartDailyPrice();

    // Form validation
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

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

    // const handleBookingSubmit = () => {
    //     if (!validateForm()) return;

    //     setIsSubmitting(true);

    //     // Directly visit checkout with data
    //     router.visit('/checkout', {
    //         method: 'post',
    //         data: {
    //             package_id: pkg.id,
    //             selected_room: selectedRoom,
    //             from_date: fromDate?.toISOString().split('T')[0] || '',
    //             to_date: toDate?.toISOString().split('T')[0] || '',
    //             name,
    //             email,
    //             phone,
    //             amenities: selectedAmenities,
    //             maintains: selectedMaintains
    //         },
    //         preserveState: false,
    //         preserveScroll: false,
    //         onError: (errors) => {
    //             setErrors(errors);
    //             setIsSubmitting(false);
    //         }
    //     });
    // };

    const handleBookingSubmit = () => {
        if (!validateForm()) return;
        setShowCheckoutModal(true);
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

    // Auth modal functions
    const openLoginModal = () => {
        setAuthModalTab('login');
        setIsAuthModalOpen(true);
    };

    const openRegisterModal = () => {
        setAuthModalTab('register');
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    return (
        <>
            <GuestLayout footer={footer} header={header} countries={countries} selectedCountry={selectedCountry} auth={auth}>
                <Head title={`${pkg.name} - Property Details`} />

                {/* Back Button */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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
                    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
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

                                        {/* Smart Price Display */}
                                        {smartDailyPrice && (
                                            <div className="shrink-0">
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                        £{smartDailyPrice.price.toFixed(2)}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        per day
                                                        {smartDailyPrice.calculated && (
                                                            <span className="text-xs text-gray-400 ml-1">
                                                                (from {smartDailyPrice.type.toLowerCase()} rate)
                                                            </span>
                                                        )}
                                                    </div>
                                                    {smartDailyPrice.original.discount_price && (
                                                        <div className="text-sm text-gray-400 line-through">
                                                            £{smartDailyPrice.calculated
                                                                ? (smartDailyPrice.original.fixed_price / (smartDailyPrice.type === 'Week' ? 7 : 30)).toFixed(2)
                                                                : smartDailyPrice.original.fixed_price.toFixed(2)
                                                            }
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
                                            {pkg.rooms.map((room) => {
                                                const prices = room.roomPrices || room.room_prices || room.prices || [];
                                                const dayPrice = prices.find(p => p.type === 'Day');
                                                const weekPrice = prices.find(p => p.type === 'Week');
                                                const monthPrice = prices.find(p => p.type === 'Month');

                                                return (
                                                    <div key={room.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <h3 className="font-bold text-gray-900 text-lg">{room.name}</h3>
                                                            {/* Display per day rate prominently */}
                                                            {(dayPrice || weekPrice || monthPrice) && (
                                                                <div className="text-right">
                                                                    <div className="text-2xl font-bold text-indigo-600">
                                                                        £{dayPrice
                                                                            ? (dayPrice.discount_price || dayPrice.fixed_price).toFixed(2)
                                                                            : weekPrice
                                                                            ? ((weekPrice.discount_price || weekPrice.fixed_price) / 7).toFixed(2)
                                                                            : ((monthPrice!.discount_price || monthPrice!.fixed_price) / 30).toFixed(2)
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">per day</div>
                                                                </div>
                                                            )}
                                                        </div>
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
                                                        {/* Show all available pricing options */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {dayPrice && (
                                                                <div className="bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-4 py-2 rounded-full">
                                                                    <span className="font-bold text-gray-900">
                                                                        £{dayPrice.discount_price || dayPrice.fixed_price}
                                                                    </span>
                                                                    <span className="text-gray-600 text-sm"> / day</span>
                                                                </div>
                                                            )}
                                                            {weekPrice && (
                                                                <div className="bg-linear-to-r from-purple-50 to-pink-50 border border-purple-200 px-4 py-2 rounded-full">
                                                                    <span className="font-bold text-gray-900">
                                                                        £{weekPrice.discount_price || weekPrice.fixed_price}
                                                                    </span>
                                                                    <span className="text-gray-600 text-sm"> / week</span>
                                                                </div>
                                                            )}
                                                            {monthPrice && (
                                                                <div className="bg-linear-to-r from-pink-50 to-orange-50 border border-pink-200 px-4 py-2 rounded-full">
                                                                    <span className="font-bold text-gray-900">
                                                                        £{monthPrice.discount_price || monthPrice.fixed_price}
                                                                    </span>
                                                                    <span className="text-gray-600 text-sm"> / month</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Amenities */}
                                {((pkg.amenities && pkg.amenities.length > 0) || (pkg.packageAmenities && pkg.packageAmenities.length > 0) || (pkg.package_amenities && pkg.package_amenities.length > 0)) && (
                                    <div className="bg-white rounded-2xl shadow-sm p-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Sparkles className="w-6 h-6 text-indigo-600" />
                                            Amenities & Services
                                        </h2>

                                        {/* Get amenities from either direct relationship or through packageAmenities */}
                                        {(() => {
                                            const amenitiesData = pkg.amenities ||
                                                pkg.packageAmenities?.map(pa => ({
                                                    ...pa.amenity,
                                                    pivot: { is_paid: pa.is_paid, price: pa.price }
                                                })) ||
                                                pkg.package_amenities?.map(pa => ({
                                                    ...pa.amenity,
                                                    pivot: { is_paid: pa.is_paid, price: pa.price }
                                                })) || []; return (
                                                    <>
                                                        {/* Free Amenities */}
                                                        {amenitiesData.filter(amenity => amenity.pivot?.is_paid === 0).length > 0 && (
                                                            <div className="mb-6">
                                                                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                                    Included Amenities
                                                                </h3>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                    {amenitiesData
                                                                        .filter(amenity => amenity.pivot?.is_paid === 0)
                                                                        .map((amenity) => (
                                                                            <div key={amenity.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                                                <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                                                                                <span className="text-green-800 font-medium text-sm">{amenity.name}</span>
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Paid Amenities */}
                                                        {amenitiesData.filter(amenity => amenity.pivot?.is_paid === 1).length > 0 && (
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                                                                    <Star className="w-5 h-5 text-blue-600" />
                                                                    Premium Services (Additional Cost)
                                                                </h3>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                    {amenitiesData
                                                                        .filter(amenity => amenity.pivot?.is_paid === 1)
                                                                        .map((amenity) => {
                                                                            const isSelected = selectedAmenities.some(selected => selected.id === amenity.id);
                                                                            const price = Number(amenity.pivot?.price || 0);

                                                                            return (
                                                                                <div key={amenity.id} className="relative">
                                                                                    <label className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                                                                        ? 'bg-blue-100 border-blue-500'
                                                                                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                                                                                        }`}>
                                                                                        <div className="flex items-center gap-3">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={isSelected}
                                                                                                onChange={(e) => {
                                                                                                    if (e.target.checked) {
                                                                                                        setSelectedAmenities(prev => [...prev, {
                                                                                                            id: amenity.id,
                                                                                                            name: amenity.name,
                                                                                                            price: price
                                                                                                        }]);
                                                                                                    } else {
                                                                                                        setSelectedAmenities(prev =>
                                                                                                            prev.filter(item => item.id !== amenity.id)
                                                                                                        );
                                                                                                    }
                                                                                                }}
                                                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                                            />
                                                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                                                <Star className="w-4 h-4 text-blue-600" />
                                                                                            </div>
                                                                                            <span className="text-blue-900 font-medium">{amenity.name}</span>
                                                                                        </div>
                                                                                        {price > 0 && (
                                                                                            <span className="text-blue-700 font-bold">£{price.toFixed(2)}</span>
                                                                                        )}
                                                                                    </label>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                        })()}
                                    </div>
                                )}                            {/* Maintenance & Services */}
                                {/* Maintenance & Services */}
                                {((pkg.maintains && pkg.maintains.length > 0) || (pkg.packageMaintains && pkg.packageMaintains.length > 0) || (pkg.package_maintains && pkg.package_maintains.length > 0)) && (
                                    <div className="bg-white rounded-2xl shadow-sm p-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <KeyRound className="w-6 h-6 text-indigo-600" />
                                            Maintenance & Support
                                        </h2>

                                        {/* Get maintains from either direct relationship or through packageMaintains */}
                                        {(() => {
                                            const maintainsData = pkg.maintains ||
                                                pkg.packageMaintains?.map(pm => ({
                                                    ...pm.maintain,
                                                    pivot: { is_paid: pm.is_paid, price: pm.price }
                                                })) ||
                                                pkg.package_maintains?.map(pm => ({
                                                    ...pm.maintain,
                                                    pivot: { is_paid: pm.is_paid, price: pm.price }
                                                })) || []; return (
                                                    <>
                                                        {/* Free Maintenance */}
                                                        {maintainsData.filter(maintain => maintain.pivot?.is_paid === 0).length > 0 && (
                                                            <div className="mb-6">
                                                                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                                    Included Services
                                                                </h3>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {maintainsData
                                                                        .filter(maintain => maintain.pivot?.is_paid === 0)
                                                                        .map((maintain) => (
                                                                            <div key={maintain.id} className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                                                                {maintain.photo && (
                                                                                    <div className="w-12 h-12 bg-green-100 rounded-lg overflow-hidden shrink-0">
                                                                                        <img
                                                                                            src={`/storage/${maintain.photo}`}
                                                                                            alt={maintain.name}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex-1">
                                                                                    <div className="font-medium text-green-900">{maintain.name}</div>
                                                                                    {maintain.maintainType && (
                                                                                        <div className="text-sm text-green-600">{maintain.maintainType.type}</div>
                                                                                    )}
                                                                                </div>
                                                                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Paid Maintenance */}
                                                        {maintainsData.filter(maintain => maintain.pivot?.is_paid === 1).length > 0 && (
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
                                                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                                                    Additional Services (On Request)
                                                                </h3>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {maintainsData
                                                                        .filter(maintain => maintain.pivot?.is_paid === 1)
                                                                        .map((maintain) => {
                                                                            const isSelected = selectedMaintains.some(selected => selected.id === maintain.id);
                                                                            const price = Number(maintain.pivot?.price || 0);

                                                                            return (
                                                                                <div key={maintain.id} className="relative">
                                                                                    <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                                                                        ? 'bg-orange-100 border-orange-500'
                                                                                        : 'bg-orange-50 border-orange-200 hover:border-orange-300'
                                                                                        }`}>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isSelected}
                                                                                            onChange={(e) => {
                                                                                                if (e.target.checked) {
                                                                                                    setSelectedMaintains(prev => [...prev, {
                                                                                                        id: maintain.id,
                                                                                                        name: maintain.name,
                                                                                                        price: price
                                                                                                    }]);
                                                                                                } else {
                                                                                                    setSelectedMaintains(prev =>
                                                                                                        prev.filter(item => item.id !== maintain.id)
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                                                        />
                                                                                        {maintain.photo && (
                                                                                            <div className="w-12 h-12 bg-orange-100 rounded-lg overflow-hidden shrink-0">
                                                                                                <img
                                                                                                    src={`/storage/${maintain.photo}`}
                                                                                                    alt={maintain.name}
                                                                                                    className="w-full h-full object-cover"
                                                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex-1">
                                                                                            <div className="font-medium text-orange-900">{maintain.name}</div>
                                                                                            {maintain.maintainType && (
                                                                                                <div className="text-sm text-orange-600">{maintain.maintainType.type}</div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="text-right shrink-0">
                                                                                            {price > 0 ? (
                                                                                                <span className="text-orange-700 font-bold">£{price.toFixed(2)}</span>
                                                                                            ) : (
                                                                                                <span className="text-orange-600 text-sm">On Request</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </label>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                        })()}
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
                                                // Generate proper URL based on the package route pattern
                                                const partnerSlug = related.assignedPartner
                                                    ? related.assignedPartner.name.toLowerCase().replace(/\s+/g, '-')
                                                    : 'unknown-partner';
                                                const packageSlug = `${related.id}-${related.name.toLowerCase().replace(/\s+/g, '-')}`;

                                                return (
                                                    <Link
                                                        key={related.id}
                                                        href={`/properties/${partnerSlug}/${packageSlug}`}
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
                                            <div className="p-2 bg-white rounded-lg shadow-md">
                                                <BookOpen className="w-5 h-5 text-indigo-600" />
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

                                                                // Smart pricing for dropdown - show per day rate
                                                                const dayPrice = prices.find(p => p.type === 'Day');
                                                                const weekPrice = prices.find(p => p.type === 'Week');
                                                                const monthPrice = prices.find(p => p.type === 'Month');

                                                                let displayPrice = 'Price on request';
                                                                if (dayPrice) {
                                                                    displayPrice = `£${dayPrice.discount_price || dayPrice.fixed_price}/day`;
                                                                } else if (weekPrice) {
                                                                    const perDay = ((weekPrice.discount_price || weekPrice.fixed_price) / 7).toFixed(2);
                                                                    displayPrice = `£${perDay}/day (from weekly)`;
                                                                } else if (monthPrice) {
                                                                    const perDay = ((monthPrice.discount_price || monthPrice.fixed_price) / 30).toFixed(2);
                                                                    displayPrice = `£${perDay}/day (from monthly)`;
                                                                }

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

                                                {/* Selected Room Details with Smart Pricing */}
                                                {selectedRoom && (
                                                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                                        {(() => {
                                                            const room = pkg.rooms.find(r => r.id.toString() === selectedRoom);
                                                            if (!room) return null;
                                                            const prices = room.roomPrices || room.room_prices || room.prices || [];

                                                            const dayPrice = prices.find(p => p.type === 'Day');
                                                            const weekPrice = prices.find(p => p.type === 'Week');
                                                            const monthPrice = prices.find(p => p.type === 'Month');

                                                            return (
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckCircle className="w-5 h-5 text-indigo-600" />
                                                                            <span className="font-semibold text-indigo-900">{room.name}</span>
                                                                        </div>
                                                                        {/* Smart per day rate */}
                                                                        <div className="text-right">
                                                                            <div className="text-xl font-bold text-indigo-600">
                                                                                £{dayPrice
                                                                                    ? (dayPrice.discount_price || dayPrice.fixed_price)
                                                                                    : weekPrice
                                                                                    ? ((weekPrice.discount_price || weekPrice.fixed_price) / 7).toFixed(2)
                                                                                    : monthPrice
                                                                                    ? ((monthPrice.discount_price || monthPrice.fixed_price) / 30).toFixed(2)
                                                                                    : '0'
                                                                                }
                                                                            </div>
                                                                            <div className="text-xs text-indigo-500">per day</div>
                                                                        </div>
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
                                                                    {/* All available pricing options */}
                                                                    {prices.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            <div className="text-xs font-medium text-indigo-700 mb-1">Available rates:</div>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {dayPrice && (
                                                                                    <div className="bg-white border border-indigo-300 px-3 py-1.5 rounded-full text-sm">
                                                                                        <span className="font-bold text-indigo-600">
                                                                                            £{dayPrice.discount_price || dayPrice.fixed_price}
                                                                                        </span>
                                                                                        <span className="text-indigo-500 ml-1">/day</span>
                                                                                    </div>
                                                                                )}
                                                                                {weekPrice && (
                                                                                    <div className="bg-white border border-purple-300 px-3 py-1.5 rounded-full text-sm">
                                                                                        <span className="font-bold text-purple-600">
                                                                                            £{weekPrice.discount_price || weekPrice.fixed_price}
                                                                                        </span>
                                                                                        <span className="text-purple-500 ml-1">/week</span>
                                                                                    </div>
                                                                                )}
                                                                                {monthPrice && (
                                                                                    <div className="bg-white border border-pink-300 px-3 py-1.5 rounded-full text-sm">
                                                                                        <span className="font-bold text-pink-600">
                                                                                            £{monthPrice.discount_price || monthPrice.fixed_price}
                                                                                        </span>
                                                                                        <span className="text-pink-500 ml-1">/month</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
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

                                            {/* Price Summary */}
                                            {(selectedRoom && fromDate && toDate) && (
                                                <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                                                    <h4 className="text-sm font-semibold text-indigo-900 mb-3">Booking Summary</h4>

                                                    {(() => {
                                                        const room = pkg.rooms?.find(r => r.id.toString() === selectedRoom);
                                                        if (!room) return null;

                                                        const prices = room.roomPrices || room.room_prices || room.prices || [];
                                                        const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

                                                        // Smart price selection based on duration
                                                        const dayPrice = prices.find(p => p.type === 'Day');
                                                        const weekPrice = prices.find(p => p.type === 'Week');
                                                        const monthPrice = prices.find(p => p.type === 'Month');

                                                        let selectedPrice: any = null;
                                                        let priceType = '';
                                                        let quantity = 0;
                                                        let roomTotal = 0;

                                                        // Smart pricing logic
                                                        if (totalDays >= 30) {
                                                            // For 30+ days, prefer Month price
                                                            if (monthPrice) {
                                                                selectedPrice = monthPrice;
                                                                priceType = 'Month';
                                                                quantity = Math.ceil(totalDays / 30);
                                                                roomTotal = (monthPrice.discount_price || monthPrice.fixed_price) * quantity;
                                                            } else if (weekPrice) {
                                                                selectedPrice = weekPrice;
                                                                priceType = 'Week';
                                                                quantity = Math.ceil(totalDays / 7);
                                                                roomTotal = (weekPrice.discount_price || weekPrice.fixed_price) * quantity;
                                                            } else if (dayPrice) {
                                                                selectedPrice = dayPrice;
                                                                priceType = 'Day';
                                                                quantity = totalDays;
                                                                roomTotal = (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                                                            }
                                                        } else if (totalDays >= 7) {
                                                            // For 7-29 days, prefer Week price
                                                            if (weekPrice) {
                                                                selectedPrice = weekPrice;
                                                                priceType = 'Week';
                                                                quantity = Math.ceil(totalDays / 7);
                                                                roomTotal = (weekPrice.discount_price || weekPrice.fixed_price) * quantity;
                                                            } else if (dayPrice) {
                                                                selectedPrice = dayPrice;
                                                                priceType = 'Day';
                                                                quantity = totalDays;
                                                                roomTotal = (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                                                            } else if (monthPrice) {
                                                                // Calculate from month price
                                                                selectedPrice = monthPrice;
                                                                priceType = 'Day';
                                                                quantity = totalDays;
                                                                const dailyRate = (monthPrice.discount_price || monthPrice.fixed_price) / 30;
                                                                roomTotal = dailyRate * totalDays;
                                                            }
                                                        } else {
                                                            // For less than 7 days, prefer Day price
                                                            if (dayPrice) {
                                                                selectedPrice = dayPrice;
                                                                priceType = 'Day';
                                                                quantity = totalDays;
                                                                roomTotal = (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                                                            } else if (weekPrice) {
                                                                // Calculate from week price
                                                                selectedPrice = weekPrice;
                                                                priceType = 'Day';
                                                                quantity = totalDays;
                                                                const dailyRate = (weekPrice.discount_price || weekPrice.fixed_price) / 7;
                                                                roomTotal = dailyRate * totalDays;
                                                            } else if (monthPrice) {
                                                                // Calculate from month price
                                                                selectedPrice = monthPrice;
                                                                priceType = 'Day';
                                                                quantity = totalDays;
                                                                const dailyRate = (monthPrice.discount_price || monthPrice.fixed_price) / 30;
                                                                roomTotal = dailyRate * totalDays;
                                                            }
                                                        }

                                                        if (!selectedPrice) return null;

                                                        return (
                                                            <>
                                                                <div className="space-y-2 mb-3">
                                                                    {/* Room Price with clear breakdown */}
                                                                    <div className="bg-white/50 rounded p-2 space-y-1">
                                                                        <div className="flex justify-between text-sm font-medium text-indigo-900">
                                                                            <span>{room.name}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-xs text-indigo-600">
                                                                            <span>
                                                                                {totalDays} {totalDays === 1 ? 'night' : 'nights'}
                                                                                {priceType !== 'Day' && quantity !== totalDays && (
                                                                                    <span className="text-indigo-500"> ({quantity} {priceType.toLowerCase()}{quantity > 1 ? 's' : ''})</span>
                                                                                )}
                                                                            </span>
                                                                            <span className="font-semibold">£{roomTotal.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>

                                                                    {selectedAmenities.length > 0 && (
                                                                        <div className="flex justify-between text-sm text-indigo-700">
                                                                            <span>Premium Amenities</span>
                                                                            <span>£{selectedAmenities.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2)}</span>
                                                                        </div>
                                                                    )}

                                                                    {selectedMaintains.length > 0 && (
                                                                        <div className="flex justify-between text-sm text-indigo-700">
                                                                            <span>Additional Services</span>
                                                                            <span>£{selectedMaintains.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="border-t border-indigo-300 pt-2">
                                                                    <div className="flex justify-between text-base font-bold text-indigo-900">
                                                                        <span>Total Amount:</span>
                                                                        <span>£{calculateTotalPrice().toFixed(2)}</span>
                                                                    </div>
                                                                    <p className="text-xs text-indigo-600 mt-1">*Final amount may include additional fees</p>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {/* Submit Button */}
                                            <button
                                                type="button"
                                                onClick={handleBookingSubmit}
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
                                        /* Unauthenticated User - Show form but intercept clicks */
                                        <div className="p-6 space-y-6 relative">
                                            {/* Overlay that intercepts clicks */}
                                            <div
                                                className="absolute inset-0 z-10 bg-transparent cursor-pointer rounded-xl"
                                                onClick={() => {
                                                    setAuthModalTab('login');
                                                    setIsAuthModalOpen(true);
                                                }}
                                            />

                                            {/* Form fields shown but disabled */}
                                            <div className="space-y-4 opacity-75">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                                    <h3 className="text-lg font-semibold text-gray-900">Select Room</h3>
                                                </div>

                                                {pkg.rooms && pkg.rooms.length > 0 ? (
                                                    <div className="relative">
                                                        <select
                                                            disabled
                                                            className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-medium cursor-not-allowed appearance-none"
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
                                            </div>

                                            {/* Step 2: Select Dates */}
                                            <div className="space-y-4 opacity-75">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                                    <h3 className="text-lg font-semibold text-gray-900">Select Dates</h3>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Check-in
                                                        </label>
                                                        <div className="relative w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed flex items-center justify-between">
                                                            <span className="text-gray-500">Select date</span>
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Check-out
                                                        </label>
                                                        <div className="relative w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 cursor-not-allowed flex items-center justify-between">
                                                            <span className="text-gray-500">Select date</span>
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Step 3: Contact Information */}
                                            <div className="space-y-4 opacity-75">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                                    <h3 className="text-lg font-semibold text-gray-900">Contact Info</h3>
                                                </div>

                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Your full name"
                                                        disabled
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    />
                                                    <input
                                                        type="email"
                                                        placeholder="Your email address"
                                                        disabled
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    />
                                                    <input
                                                        type="tel"
                                                        placeholder="Your phone number"
                                                        disabled
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            {/* Call to Action Overlay */}
                                            <div className="relative z-20 text-center bg-linear-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 mb-4">
                                                <div className="mb-4">
                                                    <User className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                                                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Sign in to Complete Booking</h3>
                                                    <p className="text-indigo-700 text-sm">Create an account or sign in to unlock all booking features</p>
                                                </div>

                                                <div className="space-y-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAuthModalTab('login');
                                                            setIsAuthModalOpen(true);
                                                        }}
                                                        className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                                                    >
                                                        Sign In to Book
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAuthModalTab('register');
                                                            setIsAuthModalOpen(true);
                                                        }}
                                                        className="w-full bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                                                    >
                                                        Create New Account
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="relative z-20 mt-6 pt-6 border-t border-gray-200">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                    <span className="font-medium">Featured Property</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </GuestLayout>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                initialTab={authModalTab}
            />


            {/* Checkout Modal with Smart Pricing */}
            {showCheckoutModal && selectedRoom && fromDate && toDate && (() => {
                const room = pkg.rooms?.find(r => r.id.toString() === selectedRoom);
                if (!room) return null;

                const prices = room.roomPrices || room.room_prices || room.prices || [];
                const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

                // Smart price selection
                const dayPrice = prices.find(p => p.type === 'Day');
                const weekPrice = prices.find(p => p.type === 'Week');
                const monthPrice = prices.find(p => p.type === 'Month');

                let priceType = 'Day';
                let quantity = totalDays;
                let roomTotal = 0;

                // Smart pricing logic based on duration
                if (totalDays >= 30) {
                    // For 30+ days, prefer Month price
                    if (monthPrice) {
                        priceType = 'Month';
                        quantity = Math.ceil(totalDays / 30);
                        roomTotal = (monthPrice.discount_price || monthPrice.fixed_price) * quantity;
                    } else if (weekPrice) {
                        priceType = 'Week';
                        quantity = Math.ceil(totalDays / 7);
                        roomTotal = (weekPrice.discount_price || weekPrice.fixed_price) * quantity;
                    } else if (dayPrice) {
                        roomTotal = (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                    }
                } else if (totalDays >= 7) {
                    // For 7-29 days, prefer Week price
                    if (weekPrice) {
                        priceType = 'Week';
                        quantity = Math.ceil(totalDays / 7);
                        roomTotal = (weekPrice.discount_price || weekPrice.fixed_price) * quantity;
                    } else if (dayPrice) {
                        roomTotal = (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                    } else if (monthPrice) {
                        const dailyRate = (monthPrice.discount_price || monthPrice.fixed_price) / 30;
                        roomTotal = dailyRate * totalDays;
                    }
                } else {
                    // For less than 7 days, prefer Day price
                    if (dayPrice) {
                        roomTotal = (dayPrice.discount_price || dayPrice.fixed_price) * totalDays;
                    } else if (weekPrice) {
                        const dailyRate = (weekPrice.discount_price || weekPrice.fixed_price) / 7;
                        roomTotal = dailyRate * totalDays;
                    } else if (monthPrice) {
                        const dailyRate = (monthPrice.discount_price || monthPrice.fixed_price) / 30;
                        roomTotal = dailyRate * totalDays;
                    }
                }

                if (roomTotal === 0) return null;

                return (
                    <CheckoutModal
                        isOpen={showCheckoutModal}
                        onClose={() => setShowCheckoutModal(false)}
                        package={pkg}
                        room={room}
                        fromDate={fromDate}
                        toDate={toDate}
                        name={name}
                        email={email}
                        phone={phone}
                        selectedAmenities={selectedAmenities}
                        selectedMaintains={selectedMaintains}
                        roomTotal={roomTotal}
                        totalDays={totalDays}
                        priceType={priceType}
                        quantity={quantity}
                    />
                );
            })()}
        </>
    );
}
