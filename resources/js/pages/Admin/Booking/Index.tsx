import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Booking } from '@/types/booking';
import * as bookingRoutes from '@/routes/admin/bookings';
import * as adminBookingRoutes from '@/routes/admin/admin-bookings';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Calendar,
    User as UserIcon,
    MapPin,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Home,
    Trash2,
} from 'lucide-react';

interface PaginatedBookings {
    data: Booking[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    bookings: PaginatedBookings;
    userRole: {
        isPartner: boolean;
        isAdmin: boolean;
        isSuperAdmin: boolean;
    };
}

export default function Index({ bookings, userRole }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    const handleSearch = () => {
        router.get(bookingRoutes.index().url, {
            search: search,
            status: statusFilter,
            payment_status: paymentStatusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get(bookingRoutes.index().url, {
            page: page,
            search: search,
            status: statusFilter,
            payment_status: paymentStatusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
            pending: {
                color: 'bg-yellow-100 text-yellow-800',
                icon: <Clock className="w-3 h-3 mr-1" />,
                label: 'Pending'
            },
            approved: {
                color: 'bg-green-100 text-green-800',
                icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
                label: 'Approved'
            },
            rejected: {
                color: 'bg-red-100 text-red-800',
                icon: <XCircle className="w-3 h-3 mr-1" />,
                label: 'Rejected'
            },
            cancelled: {
                color: 'bg-gray-100 text-gray-800',
                icon: <XCircle className="w-3 h-3 mr-1" />,
                label: 'Cancelled'
            },
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
            pending: {
                color: 'bg-orange-100 text-orange-800',
                icon: <Clock className="w-3 h-3 mr-1" />,
                label: 'Pending'
            },
            paid: {
                color: 'bg-green-100 text-green-800',
                icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
                label: 'Paid'
            },
            partial: {
                color: 'bg-blue-100 text-blue-800',
                icon: <AlertCircle className="w-3 h-3 mr-1" />,
                label: 'Partial'
            },
            failed: {
                color: 'bg-red-100 text-red-800',
                icon: <XCircle className="w-3 h-3 mr-1" />,
                label: 'Failed'
            },
        };

        const config = statusConfig[paymentStatus] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    const handleDeleteClick = (bookingId: number) => {
        setBookingToDelete(bookingId);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (bookingToDelete) {
            router.delete(bookingRoutes.destroy(bookingToDelete).url, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setBookingToDelete(null);
                },
                onError: () => {
                    alert('Failed to delete booking. Please try again.');
                }
            });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setBookingToDelete(null);
    };

    return (
        <AdminLayout>
            <Head title="Booking Management" />

            <div className="p-6 mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {bookings.total} booking{bookings.total !== 1 ? 's' : ''} found
                        </p>
                    </div>
                    <button
                        onClick={() => router.visit(adminBookingRoutes.create().url)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Booking
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by user name, email, or package..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Payment Status Filter */}
                        <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Payment Status</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="failed">Failed</option>
                        </select>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Booking ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Package
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dates
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {bookings.data.length > 0 ? (
                                    bookings.data.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{booking.id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking.user?.name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {booking.user?.email || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start">
                                                    <Home className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking.package?.name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {booking.package?.area?.name}, {booking.package?.city?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="text-gray-900">
                                                            {formatDate(booking.from_date)}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            to {formatDate(booking.to_date)}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {booking.number_of_days} days
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm">
                                                    <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="text-gray-900 font-medium">
                                                            {formatCurrency(booking.total_amount)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {booking.price_type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(booking.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPaymentStatusBadge(booking.payment_status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.visit(bookingRoutes.show(booking.id).url)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {!userRole.isPartner && (
                                                        <>
                                                            <button
                                                                onClick={() => router.visit(adminBookingRoutes.edit(booking.id).url)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Edit Booking"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(booking.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Booking"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <Calendar className="w-12 h-12 mb-3 text-gray-400" />
                                                <p className="text-lg font-medium">No bookings found</p>
                                                <p className="text-sm mt-1">Create your first booking to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {bookings.last_page > 1 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing page {bookings.current_page} of {bookings.last_page}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(bookings.current_page - 1)}
                                        disabled={bookings.current_page === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(bookings.current_page + 1)}
                                        disabled={bookings.current_page === bookings.last_page}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">Delete Booking</h3>
                                <p className="text-sm text-gray-500">Booking #{bookingToDelete}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete this booking? This will permanently remove:
                        </p>
                        <ul className="text-sm text-gray-600 mb-6 space-y-2 list-disc list-inside">
                            <li>Booking details</li>
                            <li>All payment records</li>
                            <li>Milestone payments</li>
                            <li>Amenities and maintenance records</li>
                            <li>Room price information</li>
                        </ul>
                        <p className="text-sm text-red-600 font-medium mb-6">
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleDeleteCancel}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Delete Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
