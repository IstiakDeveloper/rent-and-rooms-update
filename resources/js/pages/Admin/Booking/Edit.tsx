import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Booking, Package, User } from '@/types/booking';
import * as bookingRoutes from '@/routes/admin/bookings';
import axios from 'axios';
import { ArrowLeft, Save, Calendar, User as UserIcon, Home, CreditCard } from 'lucide-react';

interface Props {
    booking: Booking;
    packages: Package[];
    users: User[];
}

export default function Edit({ booking, packages, users }: Props) {
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(
        packages.find(p => p.id === booking.package_id) || null
    );
    const [availableRooms, setAvailableRooms] = useState(selectedPackage?.rooms || []);

    const { data, setData, patch, processing, errors } = useForm({
        user_id: booking.user_id,
        package_id: booking.package_id,
        selected_room: booking.room_ids[0] || null,
        room_ids: booking.room_ids,
        from_date: booking.from_date,
        to_date: booking.to_date,
        phone: booking.user?.phone || '',
        payment_option: booking.payment_option as 'booking_only' | 'full',
        payment_method: 'bank_transfer' as 'cash' | 'card' | 'bank_transfer',
        bank_transfer_reference: '',
        price_type: booking.price_type,
        price: booking.price,
        total_amount: booking.price,
        booking_price: booking.booking_price,
        price_breakdown: [],
        status: booking.status,
        payment_status: booking.payment_status,
        amenities: [] as number[],
        maintains: [] as number[],
        room_prices: [] as any[],
        auto_renewal: false,
        renewal_period_days: null as number | null,
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    // Handle package change
    const handlePackageChange = (packageId: string) => {
        const pkg = packages.find(p => p.id === Number(packageId));
        setSelectedPackage(pkg || null);
        setAvailableRooms(pkg?.rooms || []);
        setData(prev => ({
            ...prev,
            package_id: Number(packageId),
            selected_room: null,
        }));
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

        patch(bookingRoutes.update(booking.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                router.visit(bookingRoutes.show(booking.id).url);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title={`Edit Booking #${booking.id}`} />

            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.visit(bookingRoutes.show(booking.id).url)}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Booking Details
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Booking #{booking.id}</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Update booking information
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {booking.status}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Selection */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <UserIcon className="w-5 h-5 mr-2" />
                            User Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select User *
                                </label>
                                <select
                                    value={data.user_id || ''}
                                    onChange={(e) => {
                                        const userId = Number(e.target.value);
                                        const user = users.find(u => u.id === userId);
                                        setData(prev => ({
                                            ...prev,
                                            user_id: userId,
                                            phone: user?.phone || '',
                                        }));
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Select a user</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                                {errors.user_id && (
                                    <p className="text-sm text-red-600 mt-1">{errors.user_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter phone number"
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Package & Room Selection */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Home className="w-5 h-5 mr-2" />
                            Package & Room Selection
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Package *
                                </label>
                                <select
                                    value={data.package_id || ''}
                                    onChange={(e) => handlePackageChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Select a package</option>
                                    {packages.map((pkg) => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} - {pkg.area?.name}, {pkg.city?.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.package_id && (
                                    <p className="text-sm text-red-600 mt-1">{errors.package_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Room *
                                </label>
                                <select
                                    value={data.selected_room || ''}
                                    onChange={(e) => {
                                        const roomId = Number(e.target.value);
                                        setData(prev => ({
                                            ...prev,
                                            selected_room: roomId,
                                            room_ids: [roomId],
                                        }));
                                    }}
                                    disabled={!selectedPackage}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                                >
                                    <option value="">Select a room</option>
                                    {availableRooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} - {room.number_of_beds} bed(s)
                                        </option>
                                    ))}
                                </select>
                                {errors.selected_room && (
                                    <p className="text-sm text-red-600 mt-1">{errors.selected_room}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Booking Dates */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Booking Dates
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Check-in Date *
                                </label>
                                <input
                                    type="date"
                                    value={formatDate(data.from_date)}
                                    onChange={(e) => setData('from_date', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {errors.from_date && (
                                    <p className="text-sm text-red-600 mt-1">{errors.from_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Check-out Date *
                                </label>
                                <input
                                    type="date"
                                    value={formatDate(data.to_date)}
                                    onChange={(e) => setData('to_date', e.target.value)}
                                    min={formatDate(data.from_date)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {errors.to_date && (
                                    <p className="text-sm text-red-600 mt-1">{errors.to_date}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <CreditCard className="w-5 h-5 mr-2" />
                            Payment Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price Type
                                </label>
                                <input
                                    type="text"
                                    value={data.price_type}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Total Amount
                                </label>
                                <input
                                    type="text"
                                    value={formatCurrency(data.total_amount)}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Booking Price
                                </label>
                                <input
                                    type="text"
                                    value={formatCurrency(data.booking_price)}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Option
                                </label>
                                <input
                                    type="text"
                                    value={data.payment_option}
                                    readOnly
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 capitalize"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Booking Status
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Status
                                </label>
                                <select
                                    value={data.payment_status}
                                    onChange={(e) => setData('payment_status', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.visit(bookingRoutes.show(booking.id).url)}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
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
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Update Booking
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
