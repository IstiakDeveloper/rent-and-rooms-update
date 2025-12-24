import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Package, User, Room, BookingFormData, BookingCalculationResult, PriceBreakdownItem } from '@/types/booking';
import AdminLayout from '@/layouts/AdminLayout';
import * as adminBookingRoutes from '@/routes/admin/admin-bookings';
import * as bookingRoutes from '@/routes/admin/bookings';
import axios from 'axios';
import { ArrowLeft, Search, X, Calendar, User as UserIcon, CreditCard, AlertCircle } from 'lucide-react';

interface Props {
    packages: Package[];
}

export default function Create({ packages }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: null as number | null,
        package_id: null as number | null,
        selected_room: null as number | null,
        from_date: '',
        to_date: '',
        phone: '',
        payment_option: 'booking_only' as 'booking_only' | 'full',
        payment_method: 'bank_transfer' as 'cash' | 'card' | 'bank_transfer',
        bank_transfer_reference: '',
        price_type: '',
        total_amount: 0,
        booking_price: 0,
        price_breakdown: [] as PriceBreakdownItem[],
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [disabledDates, setDisabledDates] = useState<string[]>([]);
    const [calculation, setCalculation] = useState<BookingCalculationResult | null>(null);
    const [loading, setLoading] = useState(false);

    // Search users
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const response = await axios.get(`/admin/api/search-users?q=${searchQuery}`);
                    setUsers(response.data);
                } catch (error) {
                    console.error('Error searching users:', error);
                }
            }, 300);

            return () => clearTimeout(timer);
        } else {
            setUsers([]);
        }
    }, [searchQuery]);

    // Handle user selection
    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setData('user_id', user.id);
        setData('phone', user.phone || '');
        setSearchQuery('');
        setUsers([]);
    };

    // Handle package selection
    const handlePackageChange = (packageId: number) => {
        const pkg = packages.find(p => p.id === packageId);
        setSelectedPackage(pkg || null);
        setData('package_id', packageId);
        setSelectedRoom(null);
        setData('selected_room', null);
        setShowCalendar(false);
        setCalculation(null);
    };

    // Handle room selection
    const handleRoomSelect = async (room: Room) => {
        setSelectedRoom(room);
        setData('selected_room', room.id);
        setShowCalendar(true);
        setCalculation(null);
        setData('from_date', '');
        setData('to_date', '');

        // Fetch disabled dates for this room
        if (selectedPackage) {
            try {
                const response = await axios.get('/admin/api/disabled-dates', {
                    params: {
                        package_id: selectedPackage.id,
                        room_id: room.id,
                    },
                });
                setDisabledDates(response.data);
            } catch (error) {
                console.error('Error fetching disabled dates:', error);
            }
        }
    };

    // Handle date selection and calculate pricing
    const handleDateChange = async (field: 'from_date' | 'to_date', value: string) => {
        setData(field, value);

        const newFromDate = field === 'from_date' ? value : data.from_date;
        const newToDate = field === 'to_date' ? value : data.to_date;

        // Auto-populate phone if not set
        if (selectedUser && !data.phone) {
            setData('phone', selectedUser.phone || '');
        }

        // Calculate pricing when both dates are selected
        if (newFromDate && newToDate && data.selected_room) {
            await calculatePricing(newFromDate, newToDate);
        }
    };

    // Calculate pricing
    const calculatePricing = async (fromDate: string, toDate: string) => {
        if (!data.selected_room) return;

        setLoading(true);
        try {
            const response = await axios.post<BookingCalculationResult>('/admin/api/calculate-pricing', {
                selected_room: data.selected_room,
                from_date: fromDate,
                to_date: toDate,
            });

            setCalculation(response.data);
            // Update pricing fields using callback to avoid race conditions
            setData(prev => ({
                ...prev,
                price_type: response.data.price_type,
                total_amount: response.data.total,
                booking_price: response.data.booking_price,
                price_breakdown: response.data.breakdown,
            }));
        } catch (error) {
            console.error('Error calculating pricing:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!data.user_id) {
            alert('Please select a user');
            return;
        }
        if (!data.package_id) {
            alert('Please select a package');
            return;
        }
        if (!data.selected_room) {
            alert('Please select a room');
            return;
        }
        if (!data.from_date) {
            alert('Please select check-in date');
            return;
        }
        if (!data.to_date) {
            alert('Please select check-out date');
            return;
        }
        if (!data.phone) {
            alert('Please enter phone number');
            return;
        }
        if (data.payment_method === 'bank_transfer' && !data.bank_transfer_reference) {
            alert('Please enter bank transfer reference');
            return;
        }

        console.log('Submitting booking data:', data);
        post(adminBookingRoutes.store().url);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    // Calculate total payment amount
    const totalPaymentAmount = data.payment_option === 'full'
        ? data.total_amount + data.booking_price
        : data.booking_price;

    return (
        <AdminLayout>
            <Head title="Create New Booking" />

            <div className="py-12">
                <div className=" mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create New Booking</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Create a new booking for a user
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit(bookingRoutes.index().url)}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Bookings
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* User Selection */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                User Information
                            </h2>

                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search User
                                    </label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, email, or phone"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />

                                    {users.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {users.map((user) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleSelectUser(user)}
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                                >
                                                    <div className="font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.email} {user.phone && `• ${user.phone}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedUser && (
                                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {selectedUser.name}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {selectedUser.email}
                                                </div>
                                                {selectedUser.phone && (
                                                    <div className="text-sm text-gray-600">
                                                        {selectedUser.phone}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedUser(null);
                                                    setData('user_id', null);
                                                }}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {errors.user_id && (
                                    <p className="text-sm text-red-600">{errors.user_id}</p>
                                )}
                            </div>
                        </div>

                        {/* Package Selection */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Package Selection
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Package
                                </label>
                                <select
                                    value={data.package_id || ''}
                                    onChange={(e) => handlePackageChange(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Choose a package...</option>
                                    {packages.map((pkg) => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} - {pkg.address}
                                        </option>
                                    ))}
                                </select>

                                {errors.package_id && (
                                    <p className="text-sm text-red-600 mt-1">{errors.package_id}</p>
                                )}
                            </div>
                        </div>

                        {/* Room Selection */}
                        {selectedPackage && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Room Selection
                                </h2>

                                {selectedPackage.rooms && selectedPackage.rooms.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {selectedPackage.rooms.map((room) => (
                                            <div
                                                key={room.id}
                                                onClick={() => handleRoomSelect(room)}
                                                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                                    selectedRoom?.id === room.id
                                                        ? 'border-indigo-600 bg-indigo-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <h3 className="font-semibold text-gray-900 mb-2">
                                                    {room.name}
                                                </h3>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <div>🛏️ {room.number_of_beds} Beds</div>
                                                    <div>🚿 {room.number_of_bathrooms} Bathrooms</div>
                                                </div>
                                                {selectedRoom?.id === room.id && (
                                                    <div className="mt-2 text-indigo-600 font-medium text-sm">
                                                        ✓ Selected
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No rooms available for this package
                                    </div>
                                )}

                                {errors.selected_room && (
                                    <p className="text-sm text-red-600 mt-2">{errors.selected_room}</p>
                                )}
                            </div>
                        )}

                        {/* Date Selection */}
                        {selectedRoom && showCalendar && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Date Selection
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Check-in Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.from_date}
                                            onChange={(e) => handleDateChange('from_date', e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.from_date && (
                                            <p className="text-sm text-red-600 mt-1">{errors.from_date}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Check-out Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.to_date}
                                            onChange={(e) => handleDateChange('to_date', e.target.value)}
                                            min={data.from_date || new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {errors.to_date && (
                                            <p className="text-sm text-red-600 mt-1">{errors.to_date}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact Information */}
                        {data.from_date && data.to_date && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Contact Information
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="Enter phone number"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Booking Summary */}
                        {calculation && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Booking Summary
                                </h2>

                                {/* Booking Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Check-in Date</div>
                                        <div className="font-semibold">
                                            {new Date(data.from_date).toLocaleDateString('en-GB', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Check-out Date</div>
                                        <div className="font-semibold">
                                            {new Date(data.to_date).toLocaleDateString('en-GB', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Duration</div>
                                        <div className="font-semibold">
                                            {calculation.number_of_days} {calculation.number_of_days === 1 ? 'day' : 'days'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Price Type</div>
                                        <div className="font-semibold">{calculation.price_type}</div>
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                                    <div className="space-y-2">
                                        {calculation.breakdown.map((item, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {item.description}
                                                    {item.note && (
                                                        <span className="text-xs text-gray-500 ml-1">
                                                            {item.note}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(item.total)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-sm pt-2 border-t">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">
                                                {formatCurrency(calculation.total)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Booking Price</span>
                                            <span className="font-medium">
                                                {formatCurrency(calculation.booking_price)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t-2">
                                            <span>Total Amount</span>
                                            <span className="text-indigo-600">
                                                {formatCurrency(calculation.total + calculation.booking_price)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Schedule Info */}
                                <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-blue-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm text-blue-700">
                                                <strong>Payment Schedule:</strong> The booking price is due immediately.
                                                {data.payment_option === 'booking_only' && (
                                                    <> The remaining amount will be divided into milestones based on the price type.</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Details */}
                        {calculation && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Payment Details
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Option
                                        </label>
                                        <select
                                            value={data.payment_option}
                                            onChange={(e) => setData('payment_option', e.target.value as 'booking_only' | 'full')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="booking_only">
                                                Pay Booking Price Only ({formatCurrency(calculation.booking_price)})
                                            </option>
                                            <option value="full">
                                                Pay Full Amount ({formatCurrency(calculation.total + calculation.booking_price)})
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Method
                                        </label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value as 'cash' | 'card' | 'bank_transfer')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="card">Card Payment</option>
                                            <option value="cash">Cash</option>
                                        </select>
                                    </div>

                                    {data.payment_method === 'bank_transfer' && (
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-3">
                                                Bank Transfer Details
                                            </h4>
                                            <div className="space-y-2 text-sm text-gray-700 mb-4">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Bank Name:</span>
                                                    <span>Your Bank Name</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Account Name:</span>
                                                    <span>Account Holder Name</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Account Number:</span>
                                                    <span>12345678</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Sort Code:</span>
                                                    <span>12-34-56</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Transfer Reference Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.bank_transfer_reference}
                                                    onChange={(e) => setData('bank_transfer_reference', e.target.value)}
                                                    placeholder="Enter transfer reference"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                {errors.bank_transfer_reference && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        {errors.bank_transfer_reference}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Total Payment Amount */}
                                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold text-gray-900">
                                                Amount to Pay Now:
                                            </span>
                                            <span className="text-2xl font-bold text-indigo-600">
                                                {formatCurrency(totalPaymentAmount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        {calculation && (
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-6 py-3 bg-indigo-600 border border-transparent rounded-md font-semibold text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="-ml-1 mr-2 h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            Create Booking
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
