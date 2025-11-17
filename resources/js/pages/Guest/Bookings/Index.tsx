import { Head, Link, router } from '@inertiajs/react';
import GuestDashboardLayout from '@/layouts/GuestDashboardLayout';
import { useState } from 'react';
import {
    Calendar,
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
    MapPin,
} from 'lucide-react';
import { format } from 'date-fns';

interface Package {
    id: number;
    name: string;
    address?: string;
    city?: string;
    price_type?: string;
}

interface BookingPayment {
    id: number;
    milestone_number: number;
    due_date: string;
    amount: number;
    payment_status: string;
}

interface Booking {
    id: number;
    package: Package;
    from_date: string | null;
    to_date: string | null;
    status: string;
    payment_status: string;
    price: number;
    booking_price: number;
    number_of_days: number;
    price_type: string;
    auto_renewal: boolean;
    bookingPayments: BookingPayment[];
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedBookings {
    data: Booking[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Statistics {
    total: number;
    active: number;
    pending: number;
    completed: number;
}

interface Filters {
    status: string;
    payment_status: string;
    search: string;
}

interface Props {
    bookings: PaginatedBookings;
    statistics: Statistics;
    filters: Filters;
}

export default function Index({ bookings, statistics, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search);
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(filters.payment_status);

    const handleSearch = () => {
        router.get('/guest/bookings', {
            search: searchTerm,
            status: statusFilter,
            payment_status: paymentStatusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (type: 'status' | 'payment_status', value: string) => {
        router.get('/guest/bookings', {
            search: searchTerm,
            status: type === 'status' ? value : statusFilter,
            payment_status: type === 'payment_status' ? value : paymentStatusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-blue-100 text-blue-700',
            active: 'bg-green-100 text-green-700',
            finished: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'active':
                return <CheckCircle2 className="h-4 w-4" />;
            case 'pending':
                return <Clock className="h-4 w-4" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    return (
        <GuestDashboardLayout>
            <Head title="My Bookings" />

            {/* Compact Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-sm text-gray-600 mt-1">{bookings.total} total bookings</p>
                </div>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-600">Active</div>
                    <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-600">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-gray-600">{statistics.completed}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
                </div>
            </div>

            {/* Compact Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search bookings..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            handleFilterChange('status', e.target.value);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="active">Active</option>
                        <option value="finished">Finished</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Payment Status Filter */}
                    <select
                        value={paymentStatusFilter}
                        onChange={(e) => {
                            setPaymentStatusFilter(e.target.value);
                            handleFilterChange('payment_status', e.target.value);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Payments</option>
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="completed">Completed</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>
            </div>

            {/* Bookings List - Compact Table Style */}
            {bookings.data.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 mb-4">
                        <Calendar className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-600 mb-6">
                        {filters.search || filters.status !== 'all' || filters.payment_status !== 'all'
                            ? 'Try adjusting your filters'
                            : "You haven't made any bookings yet"}
                    </p>
                    {filters.search || filters.status !== 'all' || filters.payment_status !== 'all' ? (
                        <button
                            onClick={() => router.get('/guest/bookings')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Clear Filters
                        </button>
                    ) : (
                        <Link
                            href="/"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Browse Properties
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Booking</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Dates</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {bookings.data.map((booking) => {
                                        const totalAmount = booking.price + booking.booking_price;
                                        const paidCount = booking.bookingPayments?.filter(p => p.payment_status === 'paid').length || 0;
                                        const totalCount = booking.bookingPayments?.length || 0;

                                        return (
                                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                                {/* Booking Info */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="text-xs text-gray-500">#{booking.id}</span>
                                                                {booking.auto_renewal && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                                        Auto
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Link
                                                                href={`/guest/bookings/${booking.id}`}
                                                                className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                                                            >
                                                                {booking.package.name}
                                                            </Link>
                                                            {booking.package.address && (
                                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                                                                    <span className="truncate">{booking.package.address}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Dates */}
                                                <td className="px-4 py-4">
                                                    {booking.from_date && booking.to_date ? (
                                                        <div className="text-sm">
                                                            <div className="text-gray-900 font-medium whitespace-nowrap">
                                                                {format(new Date(booking.from_date), 'MMM dd')} - {format(new Date(booking.to_date), 'MMM dd, yyyy')}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {booking.number_of_days} {booking.price_type}(s)
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                                                        {getStatusIcon(booking.status)}
                                                        <span className="capitalize">{booking.status}</span>
                                                    </span>
                                                </td>

                                                {/* Payment Progress */}
                                                <td className="px-4 py-4">
                                                    <div className="w-32">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs text-gray-600">{paidCount}/{totalCount}</span>
                                                            <span className="text-xs font-medium text-gray-900">
                                                                {totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-green-500 transition-all"
                                                                style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="px-4 py-4 text-right">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        £{Number(totalAmount).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 capitalize">
                                                        {booking.payment_status}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-4 text-center">
                                                    <Link
                                                        href={`/guest/bookings/${booking.id}`}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        View
                                                        <ChevronRight className="h-4 w-4 ml-1" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Compact Pagination */}
                    {bookings.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4 px-2">
                            <p className="text-sm text-gray-600">
                                Page {bookings.current_page} of {bookings.last_page}
                            </p>
                            <div className="flex items-center space-x-1">
                                {bookings.links.map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url || link.active}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </GuestDashboardLayout>
    );
}
