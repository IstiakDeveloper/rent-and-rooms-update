import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft, Link as LinkIcon, User, Package, Calendar, CreditCard, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentLink {
    id: number;
    unique_id: string;
    amount: number;
    status: string;
    expires_at: string | null;
    created_at: string;
    transaction_id: number | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    booking: {
        id: number;
        from_date: string;
        to_date: string;
        package: {
            id: number;
            name: string;
            address: string;
        } | null;
    } | null;
    bookingPayment: {
        id: number;
        milestone_type: string;
        due_date: string;
        status: string;
    } | null;
}

interface Props {
    paymentLink: PaymentLink;
}

export default function PaymentLinkShow({ paymentLink }: Props) {
    const [copied, setCopied] = useState(false);

    const paymentUrl = `${window.location.origin}/pay/${paymentLink.unique_id}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(paymentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isExpired = paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date();

    const getStatusBadge = (status: string) => {
        if (isExpired && status === 'active') {
            return <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">Expired</span>;
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
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const handleRevoke = () => {
        if (confirm('Are you sure you want to revoke this payment link?')) {
            router.patch(`/admin/payment-links/${paymentLink.id}/revoke`);
        }
    };

    return (
        <AdminLayout>
            <Head title={`Payment Link #${paymentLink.id}`} />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">Payment Link Details</h1>
                            {getStatusBadge(paymentLink.status)}
                        </div>
                        <p className="text-gray-600">ID: #{paymentLink.id}</p>
                    </div>
                    <Link
                        href="/admin/payment-links"
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Link */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <LinkIcon className="w-5 h-5" />
                                Payment Link URL
                            </h2>
                            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-3">
                                <code className="text-sm text-gray-700 flex-1 break-all">{paymentUrl}</code>
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shrink-0"
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Link Information */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment Information
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">£{Number(paymentLink.amount).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Status</p>
                                    {getStatusBadge(paymentLink.status)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Created</p>
                                    <p className="font-semibold text-gray-900">
                                        {format(new Date(paymentLink.created_at), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                                {paymentLink.expires_at && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Expires</p>
                                        <p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                                            {format(new Date(paymentLink.expires_at), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Information */}
                        {paymentLink.user && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    User Information
                                </h2>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <Link
                                            href={`/admin/users/${paymentLink.user.id}`}
                                            className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                            {paymentLink.user.name}
                                        </Link>
                                        <p className="text-sm text-gray-600">{paymentLink.user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Booking Information */}
                        {paymentLink.booking && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Booking Information
                                </h2>
                                {paymentLink.booking.package && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-1">Property</p>
                                        <p className="text-lg font-semibold text-gray-900">{paymentLink.booking.package.name}</p>
                                        <p className="text-sm text-gray-600">{paymentLink.booking.package.address}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Check-in</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(paymentLink.booking.from_date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Check-out</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(paymentLink.booking.to_date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Milestone Information */}
                        {paymentLink.bookingPayment && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Milestone Information
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Milestone Type</p>
                                        <p className="font-semibold text-gray-900">{paymentLink.bookingPayment.milestone_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Due Date</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(paymentLink.bookingPayment.due_date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            paymentLink.bookingPayment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            paymentLink.bookingPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {paymentLink.bookingPayment.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Actions */}
                    <div className="space-y-6">
                        {paymentLink.status === 'active' && !isExpired && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                                <button
                                    onClick={handleRevoke}
                                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Revoke Link
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    Revoking this link will prevent the user from making payment using it.
                                </p>
                            </div>
                        )}

                        {paymentLink.transaction_id && (
                            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">Transaction Record</h3>
                                <p className="text-sm text-blue-700">
                                    Payment has been made. Transaction ID: #{paymentLink.transaction_id}
                                </p>
                                <Link
                                    href={`/admin/payments/${paymentLink.transaction_id}`}
                                    className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View Payment Details →
                                </Link>
                            </div>
                        )}

                        {isExpired && (
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Link Expired</h3>
                                <p className="text-sm text-gray-600">
                                    This payment link has expired and can no longer be used.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
