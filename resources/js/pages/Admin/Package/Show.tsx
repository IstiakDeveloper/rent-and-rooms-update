import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { format } from 'date-fns';
import * as packageRoutes from '@/routes/admin/packages';
import {
    ArrowLeft,
    Edit,
    MapPin,
    Calendar,
    Bed,
    Bath,
    CheckCircle2,
    XCircle,
    Tag,
    Clock,
    User as UserIcon,
    FileText,
    Image as ImageIcon,
    Utensils,
    Armchair,
    Video,
    RotateCcw,
} from 'lucide-react';

interface RoomPrice {
    id: number;
    type: string;
    fixed_price: number;
    discount_price: number | null;
    booking_price: number;
}

interface Room {
    id: number;
    name: string;
    number_of_beds: number;
    number_of_bathrooms: number;
    prices: RoomPrice[];
}

interface PackageAmenity {
    id: number;
    is_paid: boolean;
    price: number | null;
    amenity: { id: number; name: string } | null;
}

interface PackageMaintain {
    id: number;
    is_paid: boolean;
    price: number | null;
    maintain: { id: number; name: string } | null;
}

interface Instruction {
    id: number;
    title: string;
    description: string;
    order: number;
}

interface Photo {
    id: number;
    photo_path: string;
}

interface BookingRoomPrice {
    id: number;
    price: number;
    room: { id: number; name: string } | null;
}

interface BookingData {
    id: number;
    from_date: string;
    to_date: string;
    price: number;
    booking_price: number;
    number_of_days: number;
    price_type: string;
    auto_renewal: boolean;
    payment_status: string;
    status: string;
    user: { id: number; name: string; email: string } | null;
    bookingRoomPrices: BookingRoomPrice[];
}

interface ShowPackage {
    id: number;
    name: string;
    address: string;
    map_link: string | null;
    video_link: string | null;
    details: string | null;
    expiration_date: string;
    number_of_kitchens: number;
    number_of_rooms: number;
    common_bathrooms: number;
    seating: number;
    creator: { id: number; name: string; email: string } | null;
    assignedPartner: { id: number; name: string; email: string } | null;
    assignedBy: { id: number; name: string } | null;
    country: { id: number; name: string } | null;
    city: { id: number; name: string } | null;
    area: { id: number; name: string } | null;
    property: { id: number; name: string } | null;
    rooms: Room[];
    packageAmenities: PackageAmenity[];
    packageMaintains: PackageMaintain[];
    instructions: Instruction[];
    photos: Photo[];
}

interface Props {
    package: ShowPackage;
    bookings: BookingData[];
}

export default function Show({ package: pkg, bookings }: Props) {
    const isExpired = new Date(pkg.expiration_date) < new Date();

    return (
        <AdminLayout>
            <Head title={`Package: ${pkg.name}`} />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{pkg.name}</h1>
                            <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${
                                isExpired
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                            }`}>
                                {isExpired ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                {isExpired ? 'Expired' : 'Active'}
                            </span>
                        </div>
                        <p className="text-gray-600 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {pkg.address}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={packageRoutes.index().url}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                        <Link
                            href={packageRoutes.edit(pkg.id).url}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Link>
                    </div>
                </div>

                {/* Creator Card */}
                {pkg.creator && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <UserIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Package Created By</p>
                                <h3 className="text-xl font-semibold text-gray-900">{pkg.creator.name}</h3>
                                <p className="text-sm text-gray-600">{pkg.creator.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Bookings */}
                {bookings && bookings.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Current Bookings ({bookings.length})
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Guest</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Booked Rooms</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Auto Renewal</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Duration</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                {booking.user && (
                                                    <div>
                                                        <p className="font-medium text-gray-900">{booking.user.name}</p>
                                                        <p className="text-sm text-gray-600">{booking.user.email}</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {booking.bookingRoomPrices.map((brp) => (
                                                        brp.room && (
                                                            <span key={brp.id} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                                {brp.room.name}
                                                            </span>
                                                        )
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {booking.auto_renewal ? (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <RotateCcw className="w-4 h-4" />
                                                        <span className="text-sm">Enabled</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <XCircle className="w-4 h-4" />
                                                        <span className="text-sm">Disabled</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm">
                                                    <p className="text-gray-900">{format(new Date(booking.from_date), 'MMM dd, yyyy')}</p>
                                                    <p className="text-gray-600">to {format(new Date(booking.to_date), 'MMM dd, yyyy')}</p>
                                                    <p className="text-gray-500 text-xs">{booking.number_of_days} days</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                £{Number(booking.booking_price).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                    booking.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    booking.payment_status === 'partially_paid' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {booking.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Package Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                            Basic Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Name</p>
                                <p className="font-semibold text-gray-900">{pkg.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Property Type</p>
                                <p className="font-semibold text-gray-900">{pkg.property?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Address</p>
                                <p className="font-semibold text-gray-900">{pkg.address}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Country</p>
                                    <p className="font-semibold text-gray-900">{pkg.country?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">City</p>
                                    <p className="font-semibold text-gray-900">{pkg.city?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Area</p>
                                    <p className="font-semibold text-gray-900">{pkg.area?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Property Features */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                            Property Features
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Utensils className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Kitchens</p>
                                    <p className="font-semibold text-gray-900">{pkg.number_of_kitchens}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Armchair className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Seating Capacity</p>
                                    <p className="font-semibold text-gray-900">{pkg.seating}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Bath className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Common Bathrooms</p>
                                    <p className="font-semibold text-gray-900">{pkg.common_bathrooms}</p>
                                </div>
                            </div>
                            {pkg.map_link && (
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    <a
                                        href={pkg.map_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
                                    >
                                        View on Map
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Available Rooms */}
                {pkg.rooms && pkg.rooms.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bed className="w-5 h-5" />
                            Available Rooms ({pkg.rooms.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pkg.rooms.map((room) => (
                                <div key={room.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                    <h4 className="font-semibold text-gray-900 mb-3">{room.name}</h4>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Bed className="w-4 h-4" />
                                            <span className="text-sm">{room.number_of_beds} Beds</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Bath className="w-4 h-4" />
                                            <span className="text-sm">{room.number_of_bathrooms} Baths</span>
                                        </div>
                                    </div>

                                    {room.prices && room.prices.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-700">Pricing Options:</p>
                                            {room.prices.map((price) => (
                                                <div key={price.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                                                    <span className="text-sm text-gray-700">{price.type}</span>
                                                    <div className="text-right">
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            £{Number(price.booking_price).toFixed(2)}
                                                        </span>
                                                        {price.discount_price && (
                                                            <span className="text-xs text-gray-500 line-through ml-2">
                                                                £{Number(price.fixed_price).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                {pkg.instructions && pkg.instructions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Instructions
                        </h3>
                        <div className="space-y-4">
                            {pkg.instructions.map((instruction, index) => (
                                <div key={instruction.id} className="flex gap-4">
                                    <div className="shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            {instruction.title}
                                        </h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {instruction.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Services Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Amenities */}
                    {pkg.packageAmenities && pkg.packageAmenities.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                Amenities
                            </h3>
                            <div className="space-y-2">
                                {pkg.packageAmenities.map((amenity) => (
                                    amenity.amenity && (
                                        <div key={amenity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-gray-700">{amenity.amenity.name}</span>
                                            {amenity.is_paid && amenity.price && Number(amenity.price) > 0 ? (
                                                <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
                                                    <Tag className="w-3 h-3" />
                                                    £{Number(amenity.price).toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-green-600 font-medium">Free</span>
                                            )}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Maintenance */}
                    {pkg.packageMaintains && pkg.packageMaintains.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Maintenance Services
                            </h3>
                            <div className="space-y-2">
                                {pkg.packageMaintains.map((maintain) => (
                                    maintain.maintain && (
                                        <div key={maintain.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-gray-700">{maintain.maintain.name}</span>
                                            {maintain.is_paid && maintain.price && Number(maintain.price) > 0 ? (
                                                <span className="text-sm font-medium text-blue-600 flex items-center gap-1">
                                                    <Tag className="w-3 h-3" />
                                                    £{Number(maintain.price).toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-green-600 font-medium">Free</span>
                                            )}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Photos Gallery */}
                {pkg.photos && pkg.photos.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Photos ({pkg.photos.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {pkg.photos.map((photo) => (
                                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
                                    <img
                                        src={photo.photo_path}
                                        alt={`Package photo ${photo.id}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Additional Details */}
                {(pkg.details || pkg.video_link) && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>

                        {pkg.details && (
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {pkg.details}
                                </p>
                            </div>
                        )}

                        {pkg.video_link && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Video Tour</h4>
                                <a
                                    href={pkg.video_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
                                >
                                    <Video className="w-4 h-4" />
                                    Watch video tour
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
