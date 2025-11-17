import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GuestDashboardLayout from '@/layouts/GuestDashboardLayout';
import { type Auth } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface BookingPayment {
    id: number;
    booking_id: number;
    milestone_type: string;
    milestone_number: number;
    due_date: string | null;
    amount: number;
    payment_status: string;
    payment_method: string | null;
    paid_at: string | null;
    is_booking_fee: boolean;
    start_date: string | null;
    end_date: string | null;
}

interface Booking {
    id: number;
    package_id: number;
    from_date: string;
    to_date: string;
    number_of_days: number;
    price_type: string;
    price: number;
    total_amount: number;
    booking_price: number;
    status: string;
    payment_status: string;
    payment_option: string;
    auto_renewal: boolean;
    renewal_period_days: number | null;
    next_renewal_date: string | null;
    created_at: string;
    package: {
        id: number;
        name: string;
        address: string;
    };
    booking_payments: BookingPayment[];
}

interface Payment {
    id: number;
    booking_id: number;
    booking_payment_id: number | null;
    payment_method: string;
    amount: number;
    transaction_id: string | null;
    status: string;
    payment_type: string;
    created_at: string;
    booking: {
        package: {
            id: number;
            name: string;
        };
    };
}

interface Statistics {
    totalBookings: number;
    activeBookings: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
}

interface DashboardProps {
    auth: Auth;
    bookings: Booking[];
    statistics: Statistics;
    recentPayments: Payment[];
}

export default function Dashboard({ auth, bookings, statistics, recentPayments }: DashboardProps) {
    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            unpaid: 'bg-red-100 text-red-800',
            partial: 'bg-yellow-100 text-yellow-800',
        };
        return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            paid: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            overdue: 'bg-red-100 text-red-800',
            failed: 'bg-red-100 text-red-800',
        };
        return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    return (
        <GuestDashboardLayout>
            <Head title="Guest Dashboard" />

            {/* Welcome Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, {auth.user.name}!</CardTitle>
                    <CardDescription>
                        Here's an overview of your bookings and payments
                    </CardDescription>
                </CardHeader>
            </Card>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Bookings</CardDescription>
                                <CardTitle className="text-3xl">
                                    {statistics.totalBookings}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Active Bookings</CardDescription>
                                <CardTitle className="text-3xl text-blue-600">
                                    {statistics.activeBookings}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Paid</CardDescription>
                                <CardTitle className="text-3xl text-green-600">
                                    £{statistics.totalPaid.toFixed(2)}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Pending Payment</CardDescription>
                                <CardTitle className="text-3xl text-yellow-600">
                                    £{statistics.totalPending.toFixed(2)}
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Overdue Payment</CardDescription>
                                <CardTitle className="text-3xl text-red-600">
                                    £{statistics.totalOverdue.toFixed(2)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Bookings List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Bookings</CardTitle>
                            <CardDescription>
                                View all your property bookings and their payment status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bookings.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>You don't have any bookings yet.</p>
                                    <Link
                                        href="/properties"
                                        className="text-blue-600 hover:underline mt-2 inline-block"
                                    >
                                        Browse Properties
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold">
                                                        {booking.package.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {booking.package.address}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 mt-2 md:mt-0">
                                                    <Badge
                                                        className={getStatusBadge(booking.status)}
                                                    >
                                                        {booking.status}
                                                    </Badge>
                                                    <Badge
                                                        className={getStatusBadge(
                                                            booking.payment_status
                                                        )}
                                                    >
                                                        {booking.payment_status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                                                <div>
                                                    <span className="text-gray-600">Check-in:</span>
                                                    <p className="font-medium">
                                                        {format(
                                                            new Date(booking.from_date),
                                                            'dd MMM yyyy'
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Check-out:</span>
                                                    <p className="font-medium">
                                                        {format(
                                                            new Date(booking.to_date),
                                                            'dd MMM yyyy'
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Duration:</span>
                                                    <p className="font-medium">
                                                        {booking.number_of_days} days
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-medium">
                                                        Payment Milestones
                                                    </h4>
                                                    <span className="text-sm text-gray-600">
                                                        Total: £{(Number(booking.total_amount) || (booking.price + booking.booking_price)).toFixed(2)}
                                                    </span>
                                                </div>

                                                {booking.booking_payments.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {booking.booking_payments.map(
                                                            (payment) => (
                                                                <div
                                                                    key={payment.id}
                                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">
                                                                            {payment.is_booking_fee
                                                                                ? 'Booking Fee'
                                                                                : `${payment.milestone_type} ${payment.milestone_number}`}
                                                                        </p>
                                                                        {payment.due_date && (
                                                                            <p className="text-xs text-gray-600">
                                                                                Due:{' '}
                                                                                {format(
                                                                                    new Date(
                                                                                        payment.due_date
                                                                                    ),
                                                                                    'dd MMM yyyy'
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-medium">
                                                                            £
                                                                            {Number(payment.amount).toFixed(
                                                                                2
                                                                            )}
                                                                        </span>
                                                                        <Badge
                                                                            className={getPaymentStatusBadge(
                                                                                payment.payment_status
                                                                            )}
                                                                        >
                                                                            {
                                                                                payment.payment_status
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">
                                                        No payment milestones yet
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Payments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Payments</CardTitle>
                            <CardDescription>Your latest payment transactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentPayments.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">
                                    No payment history yet
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b">
                                            <tr>
                                                <th className="text-left py-2">Date</th>
                                                <th className="text-left py-2">Property</th>
                                                <th className="text-left py-2">Method</th>
                                                <th className="text-left py-2">Amount</th>
                                                <th className="text-left py-2">Status</th>
                                                <th className="text-left py-2">Transaction ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentPayments.map((payment) => (
                                                <tr key={payment.id} className="border-b">
                                                    <td className="py-2">
                                                        {format(
                                                            new Date(payment.created_at),
                                                            'dd MMM yyyy'
                                                        )}
                                                    </td>
                                                    <td className="py-2">
                                                        {payment.booking.package.name}
                                                    </td>
                                                    <td className="py-2 capitalize">
                                                        {payment.payment_method}
                                                    </td>
                                                    <td className="py-2 font-medium">
                                                        £{Number(payment.amount).toFixed(2)}
                                                    </td>
                                                    <td className="py-2">
                                                        <Badge
                                                            className={getStatusBadge(
                                                                payment.status
                                                            )}
                                                        >
                                                            {payment.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 text-xs text-gray-600">
                                                        {payment.transaction_id || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
        </GuestDashboardLayout>
    );
}
