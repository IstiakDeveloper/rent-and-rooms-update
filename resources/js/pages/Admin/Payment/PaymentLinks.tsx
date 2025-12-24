import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Link as LinkIcon, Eye, Calendar, User, Package, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentLink {
    id: number;
    unique_id: string;
    amount: number;
    status: string;
    expires_at: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    booking: {
        id: number;
        package: {
            id: number;
            name: string;
        } | null;
    } | null;
    bookingPayment: {
        id: number;
        milestone_type: string;
    } | null;
}

interface Props {
    paymentLinks: {
        data: PaymentLink[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function PaymentLinks({ paymentLinks }: Props) {
    const getStatusBadge = (status: string, expiresAt: string | null) => {
        const isExpired = expiresAt && new Date(expiresAt) < new Date();

        if (isExpired && status === 'active') {
            return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Expired</span>;
        }

        const statusConfig = {
            active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
            revoked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Revoked' },
            expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Expired' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const copyToClipboard = (uniqueId: string) => {
        const url = `${window.location.origin}/pay/${uniqueId}`;
        navigator.clipboard.writeText(url);
        alert('Payment link copied to clipboard!');
    };

    return (
        <AdminLayout>
            <Head title="Payment Links" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Payment Links</h1>
                    <p className="text-gray-600 mt-1">Manage payment links sent to users</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Package</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Milestone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Expires</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paymentLinks.data.map((link) => (
                                    <tr key={link.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            #{link.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            {link.user && (
                                                <div>
                                                    <Link
                                                        href={`/admin/users/${link.user.id}`}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        {link.user.name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500">{link.user.email}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {link.booking?.package && (
                                                <p className="text-sm text-gray-900">{link.booking.package.name}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {link.bookingPayment && (
                                                <p className="text-sm text-gray-900">{link.bookingPayment.milestone_type}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                            £{Number(link.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(link.status, link.expires_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {link.expires_at ? (
                                                <div>
                                                    <p>{format(new Date(link.expires_at), 'MMM dd, yyyy')}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {format(new Date(link.expires_at), 'HH:mm')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">No expiry</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/payment-links/${link.unique_id}`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => copyToClipboard(link.unique_id)}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="Copy Link"
                                                >
                                                    <LinkIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {paymentLinks.data.length === 0 && (
                        <div className="text-center py-12">
                            <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment links found</h3>
                            <p className="text-gray-500">Payment links will appear here</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {paymentLinks.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing {((paymentLinks.current_page - 1) * paymentLinks.per_page) + 1} to{' '}
                            {Math.min(paymentLinks.current_page * paymentLinks.per_page, paymentLinks.total)} of{' '}
                            {paymentLinks.total} results
                        </p>
                        <div className="flex gap-2">
                            {Array.from({ length: paymentLinks.last_page }, (_, i) => i + 1).map((page) => (
                                <Link
                                    key={page}
                                    href={`/admin/payment-links?page=${page}`}
                                    className={`px-4 py-2 rounded-lg ${
                                        page === paymentLinks.current_page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
