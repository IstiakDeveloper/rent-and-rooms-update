export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    address: string | null;
}

export interface Country {
    id: number;
    name: string;
    symbol: string;
    currency: string;
    photo: string | null;
}

export interface City {
    id: number;
    country_id: number;
    name: string;
    photo: string | null;
}

export interface Area {
    id: number;
    country_id: number;
    city_id: number;
    name: string;
    photo: string | null;
}

export interface Property {
    id: number;
    country_id: number;
    city_id: number;
    property_type_id: number;
    name: string;
    photo: string | null;
    user_id: number;
}

export interface RoomPrice {
    id: number;
    room_id: number;
    type: 'Day' | 'Week' | 'Month';
    fixed_price: number;
    discount_price: number | null;
    booking_price: number;
    user_id: number;
    created_at: string;
    updated_at: string;
}

export interface Room {
    id: number;
    package_id: number;
    name: string;
    number_of_beds: number;
    number_of_bathrooms: number;
    day_deposit: number | null;
    weekly_deposit: number | null;
    monthly_deposit: number | null;
    user_id: number;
    created_at: string;
    updated_at: string;
    room_prices?: RoomPrice[];
    roomPrices?: RoomPrice[];
}

export interface Package {
    id: number;
    country_id: number;
    city_id: number;
    area_id: number;
    property_id: number;
    name: string;
    address: string;
    map_link: string | null;
    number_of_rooms: number;
    number_of_kitchens: number;
    common_bathrooms: number;
    seating: number;
    details: string | null;
    video_link: string | null;
    status: string;
    expiration_date: string | null;
    user_id: number;
    created_at: string;
    updated_at: string;
    rooms?: Room[];
    country?: Country;
    city?: City;
    area?: Area;
    property?: Property;
}

export interface PriceBreakdownItem {
    type: 'Day' | 'Week' | 'Month';
    quantity: number;
    price: number;
    total: number;
    description: string;
    note?: string;
}

export interface BookingFormData {
    user_id: number | null;
    package_id: number | null;
    selected_room: number | null;
    from_date: string;
    to_date: string;
    phone: string;
    payment_option: 'booking_only' | 'full';
    payment_method: 'cash' | 'card' | 'bank_transfer';
    bank_transfer_reference: string;
    price_type: string;
    total_amount: number;
    booking_price: number;
    price_breakdown: PriceBreakdownItem[];
}

export interface BookingCalculationResult {
    breakdown: PriceBreakdownItem[];
    total: number;
    booking_price: number;
    price_type: string;
    number_of_days: number;
}

export interface Booking {
    id: number;
    user_id: number;
    package_id: number;
    from_date: string;
    to_date: string;
    room_ids: number[];
    number_of_days: number;
    price_type: string;
    price: number;
    booking_price: number;
    payment_option: string;
    total_amount: number;
    status: string;
    payment_status: string;
    total_milestones: number | null;
    milestone_amount: number | null;
    milestone_breakdown: PriceBreakdownItem[] | null;
    created_at: string;
    updated_at: string;
    user?: User;
    package?: Package;
}

export interface BookingPayment {
    id: number;
    booking_id: number;
    milestone_type: string;
    milestone_number: number;
    due_date: string;
    amount: number;
    payment_status: string;
    payment_method: string;
    transaction_reference: string | null;
    paid_at: string | null;
    is_booking_fee: boolean;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: number;
    booking_id: number;
    booking_payment_id: number | null;
    payment_method: string;
    amount: number;
    transaction_id: string | null;
    status: string;
    payment_type: string;
    created_at: string;
    updated_at: string;
}
