import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { ArrowLeft, CreditCard, User, Package, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
    id: number;
    amount: number;
    payment_method: string;
    status: string;
    payment_type: string;
    reference_number: string | null;
    admin_notes: string | null;
    created_at: string;
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
    } | null;
}

interface Props {
    payment: Payment;
    userRole: {
        isPartner: boolean;
        isAdmin: boolean;
        isSuperAdmin: boolean;
    };
}

export default function Show({ payment, userRole = { isPartner: false, isAdmin: false, isSuperAdmin: false } }: Props) {
    const { data, setData, patch, processing } = useForm({
        status: payment.status,
        admin_notes: payment.admin_notes || '',
    });

    const handleUpdateStatus = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/admin/payments/${payment.id}/status`, {
            preserveScroll: true,
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
            refunded: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Refunded' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

        return (
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title={`Payment #${payment.id}`} />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
                            {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-gray-600">Payment ID: #{payment.id}</p>
                    </div>
                    <Link
                        href="/admin/payments"
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Information */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment Information
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">£{Number(payment.amount).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                                    <p className="text-lg font-semibold text-gray-900">{payment.payment_method}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Payment Type</p>
                                    <p className="text-lg font-semibold text-gray-900">{payment.payment_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Date</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                                {payment.reference_number && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600 mb-1">Reference Number</p>
                                        <p className="text-lg font-semibold text-gray-900">{payment.reference_number}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Information */}
                        {payment.user && (
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
                                            href={`/admin/users/${payment.user.id}`}
                                            className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                            {payment.user.name}
                                        </Link>
                                        <p className="text-sm text-gray-600">{payment.user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Booking Information */}
                        {payment.booking && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Booking Information
                                </h2>
                                {payment.booking.package && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-1">Property</p>
                                        <p className="text-lg font-semibold text-gray-900">{payment.booking.package.name}</p>
                                        <p className="text-sm text-gray-600">{payment.booking.package.address}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Check-in</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(payment.booking.from_date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Check-out</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(payment.booking.to_date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Milestone Information */}
                        {payment.bookingPayment && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Milestone Information
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Milestone Type</p>
                                        <p className="font-semibold text-gray-900">{payment.bookingPayment.milestone_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Due Date</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(payment.bookingPayment.due_date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Update Status */}
                    <div className="space-y-6">
                        {!userRole.isPartner && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Update Status
                                </h2>
                                <form onSubmit={handleUpdateStatus} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Payment Status
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                            <option value="refunded">Refunded</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Admin Notes
                                        </label>
                                        <textarea
                                            value={data.admin_notes}
                                            onChange={(e) => setData('admin_notes', e.target.value)}
                                            rows={4}
                                            placeholder="Add notes about this payment..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        {processing ? 'Updating...' : 'Update Status'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {payment.admin_notes && (
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Notes</h3>
                                <p className="text-sm text-gray-600">{payment.admin_notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
