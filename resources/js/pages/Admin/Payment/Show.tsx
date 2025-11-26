import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    CreditCard,
    CheckCircle,
    Clock,
    XCircle,
    ArrowLeft,
    User,
    Package,
    Calendar,
    Edit,
    Save,
    X,
} from 'lucide-react';
import axios from 'axios';

interface Payment {
    id: number;
    booking_id: number;
    booking_payment_id?: number;
    user_id?: number;
    amount: string;
    payment_method: string;
    payment_type?: string;
    status: string;
    reference_number?: string;
    transaction_id?: string;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
    booking?: {
        id: number;
        from_date: string;
        to_date: string;
        price: number;
        booking_price: number;
        user?: {
            id: number;
            name: string;
            email: string;
            phone?: string;
        };
        package?: {
            id: number;
            name: string;
            title?: string;
        };
    };
    booking_payment?: {
        id: number;
        milestone_type?: string;
        milestone_number?: number;
        due_date?: string;
        amount?: number;
    };
}

interface Props {
    payment: Payment;
}

export default function Show({ payment }: Props) {
    const [editing, setEditing] = useState(false);
    const [status, setStatus] = useState(payment.status);
    const [adminNotes, setAdminNotes] = useState(payment.admin_notes || '');
    const [loading, setLoading] = useState(false);

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed':
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'refunded':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'completed':
                return <CheckCircle className="h-5 w-5" />;
            case 'pending':
                return <Clock className="h-5 w-5" />;
            case 'failed':
            case 'cancelled':
            case 'refunded':
                return <XCircle className="h-5 w-5" />;
            default:
                return <CreditCard className="h-5 w-5" />;
        }
    };

    const handleUpdateStatus = async () => {
        setLoading(true);
        try {
            await axios.patch(`/admin/payments/${payment.id}/status`, {
                status,
                admin_notes: adminNotes,
            });
            setEditing(false);
            router.reload();
        } catch (error: any) {
            console.error('Failed to update payment status:', error);
            alert(error.response?.data?.message || 'Failed to update payment status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title={`Payment #${payment.id}`} />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/payments"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Payments
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Payment #{payment.id}
                            </h1>
                            <p className="mt-1 text-gray-600">
                                View and manage payment details
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Info */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <CreditCard className="h-5 w-5 mr-2 text-indigo-600" />
                                    Payment Details
                                </h2>
                                {!editing && (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit Status
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount</label>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {formatCurrency(payment.amount)}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    {editing ? (
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                            <option value="refunded">Refunded</option>
                                        </select>
                                    ) : (
                                        <div className="mt-1">
                                            <span
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
                                                    payment.status
                                                )}`}
                                            >
                                                {getStatusIcon(payment.status)}
                                                {payment.status}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                                    <p className="mt-1 text-gray-900">{payment.payment_method || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Payment Type</label>
                                    <p className="mt-1 text-gray-900">{payment.payment_type || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                                    <p className="mt-1 text-gray-900 font-mono text-sm">
                                        {payment.transaction_id || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Reference Number</label>
                                    <p className="mt-1 text-gray-900 font-mono text-sm">
                                        {payment.reference_number || 'N/A'}
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                                    {editing ? (
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="Add notes about this payment..."
                                        />
                                    ) : (
                                        <p className="mt-1 text-gray-900">
                                            {payment.admin_notes || 'No notes'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {editing && (
                                <div className="mt-6 flex items-center justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            setStatus(payment.status);
                                            setAdminNotes(payment.admin_notes || '');
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <X className="h-4 w-4 inline mr-1" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateStatus}
                                        disabled={loading}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4 inline mr-1" />
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Booking Info */}
                        {payment.booking && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                                    <Package className="h-5 w-5 mr-2 text-indigo-600" />
                                    Booking Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Package</label>
                                        <p className="mt-1 text-gray-900">
                                            {payment.booking.package?.name || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Booking ID</label>
                                        <p className="mt-1 text-gray-900">#{payment.booking.id}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Check-in Date</label>
                                        <p className="mt-1 text-gray-900">{payment.booking.from_date}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Check-out Date</label>
                                        <p className="mt-1 text-gray-900">{payment.booking.to_date}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Package Price</label>
                                        <p className="mt-1 text-gray-900">
                                            {formatCurrency(payment.booking.price)}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Booking Fee</label>
                                        <p className="mt-1 text-gray-900">
                                            {formatCurrency(payment.booking.booking_price)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Link
                                        href={`/admin/bookings/${payment.booking.id}`}
                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                                    >
                                        View Booking Details →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Milestone Info */}
                        {payment.booking_payment && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                                    <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                                    Milestone Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Milestone Type</label>
                                        <p className="mt-1 text-gray-900">
                                            {payment.booking_payment.milestone_type || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Due Date</label>
                                        <p className="mt-1 text-gray-900">
                                            {payment.booking_payment.due_date || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* User Info */}
                        {payment.booking?.user && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                                    <User className="h-5 w-5 mr-2 text-indigo-600" />
                                    Customer Details
                                </h2>

                                <div className="flex items-center mb-4">
                                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-lg font-medium text-indigo-600">
                                            {payment.booking.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">{payment.booking.user.name}</p>
                                        <p className="text-sm text-gray-500">{payment.booking.user.email}</p>
                                    </div>
                                </div>

                                {payment.booking.user.phone && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Phone</label>
                                        <p className="mt-1 text-gray-900">{payment.booking.user.phone}</p>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <Link
                                        href={`/admin/users/${payment.booking.user.id}`}
                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                                    >
                                        View Customer Profile →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Created</label>
                                    <p className="mt-1 text-gray-900">{formatDate(payment.created_at)}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                                    <p className="mt-1 text-gray-900">{formatDate(payment.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
