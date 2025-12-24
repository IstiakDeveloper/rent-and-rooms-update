import React from 'react';
import { Calendar, Download, Mail, Link2, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, MapPin, Package } from 'lucide-react';

interface Booking {
    id: number;
    from_date: string;
    to_date: string;
    price: number;
    booking_price: number;
    rent_advance_price?: number;
    payment_status: string;
    package?: {
        id?: number;
        name: string;
        title?: string;
        address?: string;
    };
    payments: Array<{
        id: number;
        amount: string;
        status: string;
        payment_method?: string;
        created_at: string;
    }>;
    booking_payments?: Array<{
        id: number;
        amount: string;
        payment_status: string;
        due_date: string;
        is_booking_fee: boolean;
        milestone_type: string;
    }>;
    payment_summary: {
        total_price: number;
        total_paid: number;
        remaining_balance: number;
        payment_percentage: number;
    };
}

interface Props {
    booking: Booking;
    onDownloadInvoice: (id: number) => void;
    onEmailInvoice: (id: number) => void;
    onGeneratePaymentLink: (id: number) => void;
    onUpdatePaymentStatus: (paymentId: number, status: string) => void;
}

export default function BookingCard({
    booking,
    onDownloadInvoice,
    onEmailInvoice,
    onGeneratePaymentLink,
    onUpdatePaymentStatus
}: Props) {
    // Console log for debugging
    console.log('BookingCard - Booking Data:', {
        id: booking.id,
        rent_advance_price: booking.rent_advance_price,
        payment_status: booking.payment_status,
        full_booking: booking
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'bg-green-100 text-green-800 border-green-200';
            case 'partially_paid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return <CheckCircle className="h-4 w-4" />;
            case 'partially_paid': return <Clock className="h-4 w-4" />;
            case 'pending': return <AlertCircle className="h-4 w-4" />;
            case 'cancelled': return <XCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const headerBgClass =
        booking.payment_status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-red-600' :
        booking.payment_status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
        booking.payment_status === 'paid' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
        'bg-gradient-to-r from-blue-500 to-indigo-600';

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
            {/* Header with gradient background */}
            <div className={`p-5 ${headerBgClass}`}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/90 rounded-lg">
                            <CreditCard className={`h-5 w-5 ${headerBgClass.replace('from-', 'text-').split(' ')[0]}`} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-gray-900">Booking #{booking.id}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200">
                                    {getStatusIcon(booking.payment_status)}
                                    <span className="ml-1 capitalize">{booking.payment_status.replace('_', ' ')}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => onDownloadInvoice(booking.id)}
                            className="inline-flex items-center px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                            title="Download Invoice"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Invoice
                        </button>
                        <button
                            onClick={() => onEmailInvoice(booking.id)}
                            className="inline-flex items-center px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                            title="Email Invoice"
                        >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                        </button>
                        <button
                            onClick={() => onGeneratePaymentLink(booking.id)}
                            className="inline-flex items-center px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                            title="Generate Payment Link"
                        >
                            <Link2 className="h-4 w-4 mr-1" />
                            Payment Link
                        </button>
                    </div>
                </div>

                {/* Package Info Card */}
                {booking.package && (
                    <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
                        <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                                <Package className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">Package</p>
                                    <p className="text-sm font-bold text-gray-900">{booking.package.name || booking.package.title}</p>
                                </div>
                            </div>

                            {booking.package.address && (
                                <div className="flex items-start space-x-2 pt-2 border-t border-gray-200">
                                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-700 leading-relaxed">{booking.package.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Booking Period */}
                <div className="flex items-center space-x-2 mt-3 text-gray-700 bg-white/80 rounded-lg px-3 py-1.5 w-fit">
                    <Calendar className="h-4 w-4" />
                    <p className="text-sm font-medium">
                        {formatDate(booking.from_date)} to {formatDate(booking.to_date)}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 bg-white">
                {booking.payment_status === 'cancelled' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <span className="text-red-800 font-medium">This booking has been cancelled.</span>
                    </div>
                )}

                {/* Payment Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                            Payment Breakdown
                        </h5>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Package Price:</span>
                                <span className="font-semibold text-gray-900">£{parseFloat(booking.price.toString()).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Booking Fee:</span>
                                <span className="font-semibold text-gray-900">£{parseFloat(booking.booking_price.toString()).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Rent Advance:</span>
                                <span className="font-semibold text-blue-900">£{parseFloat((booking.rent_advance_price || 0).toString()).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
                                <span>Total Amount:</span>
                                <span className="text-indigo-600">£{booking.payment_summary.total_price.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                            Payment Status
                        </h5>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Paid:</span>
                                <span className="font-semibold text-green-600">£{booking.payment_summary.total_paid.toFixed(2)}</span>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600">Progress</span>
                                    <span className="font-semibold text-gray-900">{booking.payment_summary.payment_percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${Math.min(booking.payment_summary.payment_percentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Upcoming Payment */}
                {booking.booking_payments && booking.booking_payments.length > 0 && (() => {
                    const nextPayment = booking.booking_payments.find(p => p.payment_status !== 'paid');
                    return nextPayment ? (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
                            <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                                Next Upcoming Payment
                            </h5>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="shrink-0">
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {nextPayment.is_booking_fee ? 'Booking Fee' : `${nextPayment.milestone_type} Payment`}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Due: {formatDate(nextPayment.due_date)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="font-semibold text-gray-900">
                                            £{parseFloat(nextPayment.amount).toFixed(2)}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            {nextPayment.payment_status}
                                        </span>
                                    </div>
                                </div>

                                {/* Rent Advance Display */}
                                <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-indigo-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="shrink-0">
                                            <CreditCard className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                Rent Advance
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Refundable deposit
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-indigo-900">
                                        £{parseFloat((booking.rent_advance_price || 0).toString()).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : null;
                })()}

                {/* Payment History */}
                {booking.payments && booking.payments.length > 0 && (() => {
                    const paidPayments = booking.payments.filter(p => p.status === 'Paid');
                    const lastPaidPayment = paidPayments.length > 0
                        ? paidPayments.reduce((latest, current) =>
                            new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                        )
                        : null;

                    // Sort payments by date descending (newest first)
                    const sortedPayments = [...booking.payments].sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );

                    return (
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                                Payment History
                            </h5>
                            <div className="space-y-3">
                                {sortedPayments.map((payment) => {
                                    const isLastPayment = lastPaidPayment && payment.id === lastPaidPayment.id && payment.status === 'Paid';
                                    return (
                                        <div
                                            key={payment.id}
                                            className={`flex justify-between items-center p-4 rounded-lg border transition-all duration-200 ${
                                                isLastPayment
                                                    ? 'bg-yellow-50 border-yellow-300'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    {getStatusIcon(payment.status)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold text-gray-900">£{parseFloat(payment.amount).toFixed(2)}</span>
                                                        <span className="text-sm text-gray-500">
                                                            {formatDate(payment.created_at)}
                                                        </span>
                                                    </div>
                                                    {payment.payment_method && (
                                                        <span className="text-xs text-gray-500">
                                                            via {payment.payment_method}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                                    isLastPayment
                                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                        : getStatusBadgeClass(payment.status)
                                                }`}>
                                                    {isLastPayment ? 'LAST PAYMENT' : payment.status}
                                                </span>
                                                <button
                                                    onClick={() => onUpdatePaymentStatus(payment.id, payment.status === 'Paid' ? 'Pending' : 'Paid')}
                                                    className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                        payment.status === 'Paid'
                                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300'
                                                            : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                                                    }`}
                                                >
                                                    {payment.status === 'Paid' ? 'Reset' : 'Mark Paid'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Empty Payment History */}
                {(!booking.payments || booking.payments.length === 0) && (
                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No payment history available</p>
                        <p className="text-sm text-gray-400 mt-1">Payments will appear here once made</p>
                    </div>
                )}
            </div>
        </div>
    );
}
