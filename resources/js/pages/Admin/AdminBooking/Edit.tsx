import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Package, User, Room, BookingFormData, BookingCalculationResult, PriceBreakdownItem, Booking } from '@/types/booking';
import AdminLayout from '@/layouts/AdminLayout';
import * as adminBookingRoutes from '@/routes/admin/admin-bookings';
import * as bookingRoutes from '@/routes/admin/bookings';
import axios from 'axios';
import { ArrowLeft, Search, X, Calendar, User as UserIcon, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    booking: Booking;
    packages: Package[];
    selectedRoom: Room | null;
}

export default function Edit({ booking, packages, selectedRoom: initialRoom }: Props) {
    // Safely parse room_ids in case it's a string
    const getRoomId = () => {
        if (!booking.room_ids) return null;

        // If it's a string, parse it
        if (typeof booking.room_ids === 'string') {
            try {
                const parsed = JSON.parse(booking.room_ids);
                return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
            } catch (e) {
                return null;
            }
        }

        // If it's already an array
        if (Array.isArray(booking.room_ids) && booking.room_ids.length > 0) {
            return booking.room_ids[0];
        }

        return null;
    };

    // Format dates to YYYY-MM-DD for date inputs
    const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    const { data, setData, patch, processing, errors } = useForm({
        user_id: booking.user_id as number | null,
        package_id: booking.package_id as number | null,
        selected_room: getRoomId(),
        from_date: formatDateForInput(booking.from_date) || '',
        to_date: formatDateForInput(booking.to_date) || '',
        phone: booking.user?.phone || '',
        payment_option: (booking.payment_option as 'booking_only' | 'full') || 'booking_only',
        payment_method: (booking.bookingPayments?.[0]?.payment_method as 'cash' | 'card' | 'bank_transfer') || 'bank_transfer',
        bank_transfer_reference: booking.bookingPayments?.[0]?.transaction_id || '',
        price_type: booking.price_type || '',
        total_amount: booking.price || 0,
        booking_price: booking.booking_price || 0,
        price_breakdown: (booking.milestone_breakdown as PriceBreakdownItem[]) || [],
        payment_status: booking.payment_status || 'pending',
        status: booking.status || 'pending',
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(booking.user || null);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(
        packages.find(p => p.id === booking.package_id) || null
    );
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(initialRoom);
    const [showCalendar, setShowCalendar] = useState(true);
    const [disabledDates, setDisabledDates] = useState<string[]>([]);

    // Initialize calculation with existing booking data
    const [calculation, setCalculation] = useState<BookingCalculationResult | null>(
        booking.milestone_breakdown && booking.from_date && booking.to_date ? {
            breakdown: (booking.milestone_breakdown as PriceBreakdownItem[]) || [],
            total: booking.price || 0,
            booking_price: booking.booking_price || 0,
            price_type: booking.price_type || '',
            number_of_days: booking.number_of_days || 0,
        } : null
    );
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Load initial package rooms and fetch disabled dates
    useEffect(() => {
        if (selectedPackage && selectedPackage.rooms) {
            setAvailableRooms(selectedPackage.rooms);
        }

        // Fetch disabled dates for the selected room if exists
        if (selectedPackage && selectedRoom) {
            axios.get('/admin/api/edit/disabled-dates', {
                params: {
                    package_id: selectedPackage.id,
                    room_id: selectedRoom.id,
                    booking_id: booking.id,
                },
            })
            .then(response => {
                setDisabledDates(response.data);
            })
            .catch(error => {
                console.error('Error fetching disabled dates:', error);
            });
        }
    }, []);

    // Search users
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const response = await axios.get(`/admin/api/edit/search-users?q=${searchQuery}`);
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
        setHasChanges(true);
    };

    // Handle package selection
    const handlePackageChange = async (packageId: number) => {
        const pkg = packages.find(p => p.id === packageId);
        setSelectedPackage(pkg || null);
        setData('package_id', packageId);
        setSelectedRoom(null);
        setData('selected_room', null);
        setCalculation(null);
        setHasChanges(true);

        // Fetch package details with rooms
        if (pkg) {
            try {
                const response = await axios.get(`/admin/api/edit/package-details/${packageId}`);
                setAvailableRooms(response.data.rooms || []);
            } catch (error) {
                console.error('Error fetching package details:', error);
            }
        }
    };

    // Handle room selection
    const handleRoomSelect = async (room: Room) => {
        setSelectedRoom(room);
        setData('selected_room', room.id);
        setShowCalendar(true);
        setCalculation(null);
        setHasChanges(true);

        // Fetch disabled dates for this room (excluding current booking)
        if (selectedPackage) {
            try {
                const response = await axios.get('/admin/api/edit/disabled-dates', {
                    params: {
                        package_id: selectedPackage.id,
                        room_id: room.id,
                        booking_id: booking.id,
                    },
                });
                setDisabledDates(response.data);
            } catch (error) {
                console.error('Error fetching disabled dates:', error);
            }
        }

        // Recalculate if dates are already set
        if (data.from_date && data.to_date) {
            await calculatePricing(data.from_date, data.to_date);
        }
    };

    // Handle date selection and calculate pricing
    const handleDateChange = async (field: 'from_date' | 'to_date', value: string) => {
        setData(field, value);
        setHasChanges(true);

        const newFromDate = field === 'from_date' ? value : data.from_date;
        const newToDate = field === 'to_date' ? value : data.to_date;

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
            const response = await axios.post<BookingCalculationResult>('/admin/api/edit/calculate-pricing', {
                selected_room: data.selected_room,
                from_date: fromDate,
                to_date: toDate,
            });

            setCalculation(response.data);
            // Update pricing fields
            setData(prev => ({
                ...prev,
                price_type: response.data.price_type,
                total_amount: response.data.total,
                booking_price: response.data.booking_price,
                price_breakdown: response.data.breakdown,
            }));
            setErrorMessage(null);
        } catch (error: any) {
            console.error('Error calculating pricing:', error);
            const errorMsg = error.response?.data?.error || 'Failed to calculate pricing. Please try again.';
            setErrorMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Recalculate pricing with current data
    const handleRecalculate = async () => {
        if (data.from_date && data.to_date && data.selected_room) {
            await calculatePricing(data.from_date, data.to_date);
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous messages
        setErrorMessage(null);
        setSuccessMessage(null);

        // Validate required fields - errors will be shown via field validation
        if (!data.user_id) {
            setErrorMessage('Please select a user');
            return;
        }
        if (!data.package_id) {
            setErrorMessage('Please select a package');
            return;
        }
        if (!data.selected_room) {
            setErrorMessage('Please select a room');
            return;
        }
        if (!data.from_date) {
            setErrorMessage('Please select check-in date');
            return;
        }
        if (!data.to_date) {
            setErrorMessage('Please select check-out date');
            return;
        }
        if (!data.phone) {
            setErrorMessage('Please enter phone number');
            return;
        }

        patch(adminBookingRoutes.update(booking.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage('Booking updated successfully!');
                setTimeout(() => {
                    router.visit(bookingRoutes.show(booking.id).url);
                }, 1000);
            },
            onError: (errors) => {
                console.error('Update errors:', errors);
                // Get first error message
                const firstError = Object.values(errors)[0];
                setErrorMessage(typeof firstError === 'string' ? firstError : 'Failed to update booking. Please check all fields.');
            },
        });
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
            <Head title={`Edit Booking #${booking.id}`} />

            <div className="py-12">
                <div className="mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Booking #{booking.id}</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Update booking details and recalculate pricing
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit(bookingRoutes.show(booking.id).url)}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Booking
                        </button>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-md animate-slide-in">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-green-800">{successMessage}</p>
                                </div>
                                <button
                                    onClick={() => setSuccessMessage(null)}
                                    className="ml-3 text-green-600 hover:text-green-800 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md animate-slide-in">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800">{errorMessage}</p>
                                </div>
                                <button
                                    onClick={() => setErrorMessage(null)}
                                    className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Validation Errors from Backend */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md animate-slide-in">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {Object.entries(errors).map(([key, value]) => (
                                            <li key={key} className="text-sm text-red-700">{value}</li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={() => {
                                        // Clear errors by resetting form
                                        setErrorMessage(null);
                                    }}
                                    className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Warning Message */}
                    {hasChanges && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                                <div>
                                    <h3 className="text-sm font-semibold text-yellow-800">Changes Detected</h3>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        You have made changes to the booking. Make sure to review the updated pricing before saving.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* User Information */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                User Information
                            </h2>

                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Change User (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, email, or phone"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                                            errors.user_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
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
                                                <div className="text-sm text-gray-600 mb-1">Current User</div>
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
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Contact Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => {
                                            setData('phone', e.target.value);
                                            setHasChanges(true);
                                        }}
                                        placeholder="Enter phone number"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                                            errors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                                    )}
                                </div>

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
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                                        errors.package_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
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
                        {selectedPackage && availableRooms.length > 0 && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Room Selection
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {availableRooms.map((room) => (
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

                                {errors.selected_room && (
                                    <p className="text-sm text-red-600 mt-2">{errors.selected_room}</p>
                                )}
                            </div>
                        )}

                        {/* Date Selection */}
                        {selectedRoom && showCalendar && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Date Selection
                                    </h2>
                                    {calculation && (
                                        <button
                                            type="button"
                                            onClick={handleRecalculate}
                                            disabled={loading}
                                            className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                        >
                                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                            Recalculate
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Check-in Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.from_date}
                                            onChange={(e) => handleDateChange('from_date', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                                                errors.from_date ? 'border-red-500' : 'border-gray-300'
                                            }`}
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
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                                                errors.to_date ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.to_date && (
                                            <p className="text-sm text-red-600 mt-1">{errors.to_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-700">
                                        <strong>Note:</strong> You can update dates to any past or future date.
                                        The system will automatically recalculate all prices and milestones.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Booking Summary */}
                        {calculation && (
                            <div className="bg-white shadow-sm rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Updated Booking Summary
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

                                {/* Comparison with original */}
                                {(booking.price !== calculation.total || booking.booking_price !== calculation.booking_price) && (
                                    <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-semibold text-amber-800">Price Changes Detected</h3>
                                                <div className="mt-2 text-sm text-amber-700 space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Original Rent:</span>
                                                        <span>{formatCurrency(booking.price)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>New Rent:</span>
                                                        <span className="font-semibold">{formatCurrency(calculation.total)}</span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 border-t border-amber-300">
                                                        <span>Difference:</span>
                                                        <span className={`font-semibold ${calculation.total > booking.price ? 'text-green-700' : 'text-red-700'}`}>
                                                            {calculation.total > booking.price ? '+' : ''}{formatCurrency(calculation.total - booking.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
                                                <strong>Updated Payment Schedule:</strong> All existing milestones will be deleted and recreated with new dates and amounts based on the updated booking details.
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
                                    Payment Options
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Option
                                        </label>
                                        <select
                                            value={data.payment_option}
                                            onChange={(e) => {
                                                setData('payment_option', e.target.value as 'booking_only' | 'full');
                                                setHasChanges(true);
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="booking_only">
                                                Booking Price Only ({formatCurrency(calculation.booking_price)})
                                            </option>
                                            <option value="full">
                                                Full Amount ({formatCurrency(calculation.total + calculation.booking_price)})
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Method
                                        </label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => {
                                                setData('payment_method', e.target.value as 'cash' | 'card' | 'bank_transfer');
                                                setHasChanges(true);
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="card">Card Payment</option>
                                            <option value="cash">Cash</option>
                                        </select>
                                    </div>

                                    {data.payment_method === 'bank_transfer' && (
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Transfer Reference Number (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.bank_transfer_reference}
                                                    onChange={(e) => setData('bank_transfer_reference', e.target.value)}
                                                    placeholder="Enter transfer reference"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Updates */}
                        <div className="bg-white shadow-sm rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Booking Status
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Booking Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => {
                                            setData('status', e.target.value);
                                            setHasChanges(true);
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Status
                                    </label>
                                    <select
                                        value={data.payment_status}
                                        onChange={(e) => {
                                            setData('payment_status', e.target.value);
                                            setHasChanges(true);
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="partial">Partial</option>
                                        <option value="completed">Completed</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between bg-white shadow-sm rounded-lg p-6">
                            <button
                                type="button"
                                onClick={() => router.visit(bookingRoutes.show(booking.id).url)}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing || loading}
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
                                        Updating...
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
                                        Update Booking
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
