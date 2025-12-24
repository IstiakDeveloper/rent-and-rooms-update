import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Booking, PriceBreakdownItem } from '@/types/booking';
import * as bookingRoutes from '@/routes/admin/bookings';
import * as adminBookingRoutes from '@/routes/admin/admin-bookings';
import {
    ArrowLeft,
    Calendar,
    User as UserIcon,
    MapPin,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Home,
    Edit,
    Phone,
    Mail,
    DollarSign,
    Ban,
} from 'lucide-react';

interface Props {
    booking: Booking;
    userRole: {
        isPartner: boolean;
        isAdmin: boolean;
        isSuperAdmin: boolean;
    };
}

export default function Show({ booking, userRole = { isPartner: false, isAdmin: false, isSuperAdmin: false } }: Props) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionType, setActionType] = useState<'approved' | 'rejected' | 'cancelled' | null>(null);
    const [processing, setProcessing] = useState(false);

    // Parse milestone_breakdown if it's a string
    const milestoneBreakdown = React.useMemo((): PriceBreakdownItem[] => {
        if (!booking.milestone_breakdown) return [];
        if (Array.isArray(booking.milestone_breakdown)) return booking.milestone_breakdown;
        if (typeof booking.milestone_breakdown === 'string') {
            try {
                return JSON.parse(booking.milestone_breakdown);
            } catch (e) {
                console.error('Failed to parse milestone_breakdown:', e);
                return [];
            }
        }
        return [];
    }, [booking.milestone_breakdown]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
            pending: {
                color: 'bg-yellow-100 text-yellow-800',
                icon: <Clock className="w-4 h-4 mr-1" />,
                label: 'Pending'
            },
            approved: {
                color: 'bg-green-100 text-green-800',
                icon: <CheckCircle2 className="w-4 h-4 mr-1" />,
                label: 'Approved'
            },
            rejected: {
                color: 'bg-red-100 text-red-800',
                icon: <XCircle className="w-4 h-4 mr-1" />,
                label: 'Rejected'
            },
            cancelled: {
                color: 'bg-gray-100 text-gray-800',
                icon: <XCircle className="w-4 h-4 mr-1" />,
                label: 'Cancelled'
            },
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (paymentStatus: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
            pending: {
                color: 'bg-orange-100 text-orange-800',
                icon: <Clock className="w-4 h-4 mr-1" />,
                label: 'Pending'
            },
            paid: {
                color: 'bg-green-100 text-green-800',
                icon: <CheckCircle2 className="w-4 h-4 mr-1" />,
                label: 'Paid'
            },
            partial: {
                color: 'bg-blue-100 text-blue-800',
                icon: <AlertCircle className="w-4 h-4 mr-1" />,
                label: 'Partial'
            },
            failed: {
                color: 'bg-red-100 text-red-800',
                icon: <XCircle className="w-4 h-4 mr-1" />,
                label: 'Failed'
            },
        };

        const config = statusConfig[paymentStatus] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const handleStatusUpdate = (newStatus: 'approved' | 'rejected' | 'cancelled') => {
        setActionType(newStatus);
        setShowConfirmModal(true);
    };

    const confirmAction = () => {
        if (!actionType) return;

        setProcessing(true);
        router.patch(
            bookingRoutes.updateStatus(booking.id).url,
            { status: actionType },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowConfirmModal(false);
                    setActionType(null);
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const cancelAction = () => {
        setShowConfirmModal(false);
        setActionType(null);
    };

    return (
        <AdminLayout>
            <Head title={`Booking #${booking.id}`} />

            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.visit(bookingRoutes.index().url)}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Bookings
                        </button>
                        {!userRole.isPartner && (
                            <button
                                onClick={() => router.visit(adminBookingRoutes.edit(booking.id).url)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Booking
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.id}</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Created on {formatDate(booking.created_at)}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {getStatusBadge(booking.status)}
                            {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                    </div>

                    {/* Status Action Buttons */}
                    {!userRole.isPartner && booking.status === 'pending' && (
                        <div className="mt-4 flex gap-3 justify-end">
                            <button
                                onClick={() => handleStatusUpdate('approved')}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('rejected')}
                                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </button>
                        </div>
                    )}

                    {!userRole.isPartner && booking.status === 'approved' && (
                        <div className="mt-4 flex gap-3 justify-end">
                            <button
                                onClick={() => handleStatusUpdate('cancelled')}
                                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                Cancel Booking
                            </button>
                        </div>
                    )}
                </div>

                {/* Confirmation Modal */}
                {showConfirmModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Confirm Action
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to {actionType} this booking? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={cancelAction}
                                    disabled={processing}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAction}
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* User Information */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <UserIcon className="w-5 h-5 mr-2" />
                                User Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Name</label>
                                    <p className="text-gray-900 mt-1">{booking.user?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900 mt-1 flex items-center">
                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                        {booking.user?.email || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Phone</label>
                                    <p className="text-gray-900 mt-1 flex items-center">
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                        {booking.user?.phone || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Role</label>
                                    <p className="text-gray-900 mt-1 capitalize">{booking.user?.role || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Package Information */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Home className="w-5 h-5 mr-2" />
                                Package Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Package Name</label>
                                    <p className="text-gray-900 mt-1 font-medium">{booking.package?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Location</label>
                                    <p className="text-gray-900 mt-1 flex items-center">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                        {booking.package?.area?.name}, {booking.package?.city?.name}, {booking.package?.country?.name}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Address</label>
                                    <p className="text-gray-900 mt-1">{booking.package?.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Booking Details */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                Booking Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Check-in Date</label>
                                    <p className="text-gray-900 mt-1">{formatDate(booking.from_date)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Check-out Date</label>
                                    <p className="text-gray-900 mt-1">{formatDate(booking.to_date)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Number of Days</label>
                                    <p className="text-gray-900 mt-1">{booking.number_of_days} days</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Price Type</label>
                                    <p className="text-gray-900 mt-1">{booking.price_type}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Payment Option</label>
                                    <p className="text-gray-900 mt-1 capitalize">{booking.payment_option}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Payment Summary
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-sm text-gray-600">Price</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(booking.price)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-sm text-gray-600">Booking Price</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(booking.booking_price)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                                    <span className="text-base font-semibold text-gray-900">Total Amount</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {formatCurrency(booking.total_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Milestone Breakdown */}
                        {milestoneBreakdown && milestoneBreakdown.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Milestone Breakdown
                                </h2>
                                <div className="space-y-3">
                                    {milestoneBreakdown.map((milestone, index) => (
                                        <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {milestone.description}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {milestone.type} × {milestone.quantity}
                                                </p>
                                                {milestone.note && (
                                                    <p className="text-xs text-gray-400 mt-1">{milestone.note}</p>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 ml-4">
                                                {formatCurrency(Number(milestone.total))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Status History */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            Booking Created
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(booking.created_at)}
                                        </p>
                                    </div>
                                </div>
                                {booking.updated_at !== booking.created_at && (
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                Last Updated
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDate(booking.updated_at)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
