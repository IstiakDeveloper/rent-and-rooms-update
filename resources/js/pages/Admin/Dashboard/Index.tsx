import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Users,
    Package,
    Calendar,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Eye,
    Edit,
    MapPin,
    Mail,
    UserCheck,
    Building,
    CheckCircle,
    TrendingUp,
    CreditCard,
    Home,
    UserPlus,
} from 'lucide-react';

interface Booking {
    id: number;
    booking_number: string;
    user: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
    package: {
        id: number;
        title: string;
        property: {
            name: string;
            area: {
                name: string;
                city: {
                    name: string;
                };
            };
        };
    };
    check_in_date: string;
    check_out_date: string;
    total_amount: number;
    payment_status: 'pending' | 'completed' | 'failed' | 'partial';
    booking_status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    created_at: string;
}

interface DashboardProps {
    totalUsers: number;
    totalPartner: number;
    totalPackages: number;
    totalBookings: number;
    monthlyRevenue: number;
    totalBookingRevenue: number;
    activePackages: number;
    upcomingBookings: number;
    totalSpent: number;
    recentBookings: Booking[];
    monthlyRentTotal: number;
    monthlyBookingTotal: number;
    totalRentIncome: number;
    totalBookingIncome: number;
    filterPeriod: 'month' | 'year' | 'all';
    totalCompletedRentPayments: number;
    totalCompletedBookingPayments: number;
    paymentSuccessRate: number;
    partnerUsers: number;
    partnerPackages: number;
    partnerBookings: number;
    partnerRevenue: number;
    partnerRentIncome: number;
    partnerBookingIncome: number;
    partnerRentPayments: number;
    partnerBookingPayments: number;
}

export default function Index(props: DashboardProps) {
    const [filterPeriod, setFilterPeriod] = useState(props.filterPeriod);
    const [isLoading, setIsLoading] = useState(false);

    const handleFilterChange = (period: 'month' | 'year' | 'all') => {
        setIsLoading(true);
        setFilterPeriod(period);
        router.get('/admin/dashboard', { filter_period: period }, {
            preserveState: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return new Intl.DateTimeFormat('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }).format(new Date(dateString));
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'confirmed':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'pending':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'failed':
            case 'cancelled':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'partial':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Dashboard Overview
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Welcome back! Here's what's happening with your business today.
                        </p>
                    </div>

                    {/* Filter Controls */}
                    <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                            {[
                                { key: 'month', label: 'Month' },
                                { key: 'year', label: 'Year' },
                                { key: 'all', label: 'All Time' },
                            ].map((period) => (
                                <button
                                    key={period.key}
                                    onClick={() => handleFilterChange(period.key as any)}
                                    disabled={isLoading}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                        filterPeriod === period.key
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => router.reload()}
                            disabled={isLoading}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                        >
                            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Users */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900">{props.totalUsers.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+12%</span>
                            <span className="text-gray-600 ml-1">vs last month</span>
                        </div>
                    </div>

                    {/* Total Partners */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Partners</p>
                                <p className="text-3xl font-bold text-gray-900">{props.totalPartner.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+8%</span>
                            <span className="text-gray-600 ml-1">vs last month</span>
                        </div>
                    </div>

                    {/* Total Packages */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Packages</p>
                                <p className="text-3xl font-bold text-gray-900">{props.totalPackages.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-indigo-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+15%</span>
                            <span className="text-gray-600 ml-1">vs last month</span>
                        </div>
                    </div>

                    {/* Total Bookings */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                                <p className="text-3xl font-bold text-gray-900">{props.totalBookings.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+23%</span>
                            <span className="text-gray-600 ml-1">vs last month</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Rent Revenue */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                Rent Income
                            </span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(props.monthlyRentTotal)}</p>
                            <p className="text-sm text-gray-600 mt-1">{props.totalCompletedRentPayments} payments completed</p>
                        </div>
                    </div>

                    {/* Booking Revenue */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                Booking Income
                            </span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(props.monthlyBookingTotal)}</p>
                            <p className="text-sm text-gray-600 mt-1">{props.totalCompletedBookingPayments} payments completed</p>
                        </div>
                    </div>

                    {/* Payment Success Rate */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                Success Rate
                            </span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{props.paymentSuccessRate}%</p>
                            <p className="text-sm text-gray-600 mt-1">Payment success rate</p>
                        </div>
                    </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                            <Link
                                href="/admin/bookings"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
                            >
                                View all
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {props.recentBookings.length > 0 ? (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Booking
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Package
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {props.recentBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        #{booking.booking_number}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatDate(booking.created_at)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-medium text-indigo-600">
                                                            {booking.user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking.user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {booking.user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {booking.package.title}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {booking.package.property.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(booking.total_amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.payment_status)}`}>
                                                    {booking.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        href={`/admin/bookings/${booking.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/bookings/${booking.id}/edit`}
                                                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                                <p className="text-gray-600">When customers make bookings, they'll appear here.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
