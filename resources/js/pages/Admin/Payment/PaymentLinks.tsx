import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Link2,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    User,
    Calendar,
    Package,
    Copy,
    Ban,
} from 'lucide-react';
import axios from 'axios';

interface PaymentLink {
    id: number;
    unique_id: string;
    user_id: number;
    booking_id?: number;
    booking_payment_id?: number;
    amount: string;
    status: string;
    transaction_id?: string;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    booking?: {
        id: number;
        from_date: string;
        to_date: string;
        package?: {
            id: number;
            name: string;
        };
    };
    booking_payment?: {
        id: number;
        milestone_type?: string;
        due_date?: string;
        amount?: number;
    };
}

interface PaginatedPaymentLinks {
    data: PaymentLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    paymentLinks: PaginatedPaymentLinks;
}

export default function PaymentLinks({ paymentLinks }: Props) {
    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
            case 'active':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'expired':
            case 'revoked':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'paid':
                return <CheckCircle className="h-4 w-4" />;
            case 'pending':
            case 'active':
                return <Clock className="h-4 w-4" />;
            case 'expired':
            case 'revoked':
                return <XCircle className="h-4 w-4" />;
            default:
                return <Link2 className="h-4 w-4" />;
        }
    };

    const copyToClipboard = (uniqueId: string) => {
        const url = `${window.location.origin}/admin/payment-links/${uniqueId}`;
        navigator.clipboard.writeText(url);
        alert('Payment link copied to clipboard!');
    };

    const handleRevoke = async (paymentLinkId: number) => {
        if (!confirm('Are you sure you want to revoke this payment link?')) {
            return;
        }

        try {
            await axios.patch(`/admin/payment-links/${paymentLinkId}/revoke`);
            router.reload();
        } catch (error: any) {
            console.error('Failed to revoke payment link:', error);
            alert(error.response?.data?.message || 'Failed to revoke payment link');
        }
    };

    return (
        <AdminLayout>
            <Head title="Payment Links" />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Payment Links
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Manage payment links for bookings and milestones
                        </p>
                    </div>

                    <div className="mt-4 sm:mt-0">
                        <Link
                            href="/admin/payments"
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                        >
                            <Link2 className="h-4 w-4 mr-2" />
                            View All Payments
                        </Link>
                    </div>
                </div>

                {/* Payment Links Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {paymentLinks.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <Link2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No payment links found
                            </h3>
                            <p className="text-gray-500">
                                Payment links will appear here when generated
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Link ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Booking
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paymentLinks.data.map((link) => (
                                            <tr key={link.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-mono text-gray-900">
                                                            {link.unique_id.substring(0, 16)}...
                                                        </span>
                                                        <button
                                                            onClick={() => copyToClipboard(link.unique_id)}
                                                            className="ml-2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                                            title="Copy link"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {link.user ? (
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                                <User className="h-4 w-4 text-indigo-600" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {link.user.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {link.user.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {link.booking?.package ? (
                                                        <div className="flex items-center">
                                                            <Package className="h-4 w-4 text-gray-400 mr-2" />
                                                            <div>
                                                                <span className="text-sm text-gray-900">
                                                                    {link.booking.package.name}
                                                                </span>
                                                                {link.booking_payment?.milestone_type && (
                                                                    <div className="text-xs text-gray-500">
                                                                        {link.booking_payment.milestone_type}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatCurrency(link.amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                                            link.status
                                                        )}`}
                                                    >
                                                        {getStatusIcon(link.status)}
                                                        {link.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-4 w-4 mr-1" />
                                                        {formatDate(link.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <Link
                                                            href={`/admin/payment-links/${link.unique_id}`}
                                                            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Link>
                                                        {link.status.toLowerCase() === 'pending' || link.status.toLowerCase() === 'active' ? (
                                                            <button
                                                                onClick={() => handleRevoke(link.id)}
                                                                className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                                                            >
                                                                <Ban className="h-4 w-4 mr-1" />
                                                                Revoke
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {paymentLinks.last_page > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Showing {paymentLinks.data.length} of {paymentLinks.total} payment links
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {paymentLinks.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1 rounded text-sm ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
