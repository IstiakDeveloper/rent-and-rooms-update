import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Country {
    id: number;
    name: string;
    code?: string;
}

export interface City {
    id: number;
    name: string;
    country_id: number;
    country?: Country;
}

export interface Area {
    id: number;
    name: string;
    city_id: number;
    city?: City;
}

export interface Property {
    id: number;
    name: string;
    description?: string;
}

export interface Amenity {
    id: number;
    name: string;
    icon?: string;
}

export interface Maintain {
    id: number;
    name: string;
    description?: string;
}

export interface RoomPrice {
    id: number;
    room_id: number;
    type: string;
    price_type: string;
    fixed_price: number;
    discount_price: number | null;
    booking_price: number;
    price: string;
    no_of_guest: number;
}

export interface Room {
    id: number;
    package_id: number;
    name: string;
    room_name: string;
    number_of_beds: number;
    number_of_bathrooms: number;
    bed_rooms: number;
    bath_rooms: number;
    prices: RoomPrice[];
    roomPrices?: RoomPrice[];
}

export interface PackageInstruction {
    id: number;
    package_id: number;
    title: string;
    instruction_title: string;
    description: string;
    instruction_description: string;
    order: number;
}

export interface PackagePhoto {
    id: number;
    package_id: number;
    photo_path: string;
}

export interface PackageAmenity {
    id: number;
    package_id: number;
    amenity_id: number;
    is_paid: boolean;
    price: number | null;
    amenity?: Amenity;
}

export interface PackageMaintain {
    id: number;
    package_id: number;
    maintain_id: number;
    is_paid: boolean;
    price: number | null;
    maintain?: Maintain;
}

export interface Package {
    id: number;
    user_id: number;
    assigned_to: number | null;
    assigned_by: number | null;
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
    bed_rooms: number;
    bath_rooms: number;
    details: string | null;
    package_description: string | null;
    video_link: string | null;
    creator?: User;
    assignedPartner?: User;
    assignedBy?: User;
    country?: Country;
    city?: City;
    area?: Area;
    property?: Property;
    rooms?: Room[];
    instructions?: PackageInstruction[];
    packageInstructions?: PackageInstruction[];
    photos?: PackagePhoto[];
    packagePhotos?: PackagePhoto[];
    package_amenities?: PackageAmenity[];
    packageAmenities?: PackageAmenity[];
    package_maintains?: PackageMaintain[];
    packageMaintains?: PackageMaintain[];
    free_amenities?: Amenity[];
    free_maintains?: Maintain[];
    paid_amenities?: Array<{ amenity_id: number; price: number; amenity?: Amenity }>;
    paid_maintains?: Array<{ maintain_id: number; price: number; maintain?: Maintain }>;
    current_bookings?: number;
    created_at: string;
    updated_at: string;
}

export interface BookingRoomPrice {
    id: number;
    booking_id: number;
    room_id: number;
    room_price_id: number;
    price: number;
    room?: Room;
    roomPrice?: RoomPrice;
}

export interface Booking {
    id: number;
    package_id: number;
    user_id: number;
    guest_name: string;
    guest_email: string;
    from_date: string | null;
    to_date: string | null;
    checkin_date: string;
    checkout_date: string;
    status: string;
    payment_status: string;
    price: number;
    booking_price: number;
    total_amount: string;
    number_of_days: number;
    price_type: string;
    auto_renewal: boolean;
    package?: Package;
    user?: User;
    booking_room_prices?: BookingRoomPrice[];
    bookingRoomPrices?: BookingRoomPrice[];
    created_at: string;
    updated_at: string;
}
