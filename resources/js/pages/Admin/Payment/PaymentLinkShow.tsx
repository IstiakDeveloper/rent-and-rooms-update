import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Link2,
    CheckCircle,
    Clock,
    XCircle,
    ArrowLeft,
    User,
    Package,
    Calendar,
    CreditCard,
    Building,
    Send,
    AlertCircle,
    Copy,
} from 'lucide-react';

interface PaymentLink {
    id: number;
    unique_id: string;
    user_id: number;
    booking_id?: number;
    booking_payment_id?: number;
    amount: string;
    status: string;
    transaction_id?: string;
    expires_at?: string;
    paid_at?: string;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
    booking?: {
        id: number;
        from_date: string;
        to_date: string;
        price: number;
        booking_price: number;
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
    paymentLink: PaymentLink;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PaymentLinkShow({ paymentLink, flash }: Props) {
    const [submitting, setSubmitting] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({
        payment_method: 'BankTransfer' as 'BankTransfer' | 'Stripe',
        bank_reference: '',
    });

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
                return <CheckCircle className="h-5 w-5" />;
            case 'pending':
            case 'active':
                return <Clock className="h-5 w-5" />;
            case 'expired':
            case 'revoked':
                return <XCircle className="h-5 w-5" />;
            default:
                return <Link2 className="h-5 w-5" />;
        }
    };

    const copyToClipboard = () => {
        const url = `${window.location.origin}/admin/payment-links/${paymentLink.unique_id}`;
        navigator.clipboard.writeText(url);
        alert('Payment link copied to clipboard!');
    };

    const canProcessPayment = paymentLink.status.toLowerCase() === 'pending' || paymentLink.status.toLowerCase() === 'active';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!canProcessPayment) {
            alert('This payment link is no longer active');
            return;
        }

        if (data.payment_method === 'BankTransfer' && !data.bank_reference.trim()) {
            alert('Please enter the bank reference number');
            return;
        }

        setSubmitting(true);

        post(`/admin/payment-links/${paymentLink.unique_id}/process`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSubmitting(false);
            },
            onError: (errors) => {
                console.error('Payment processing errors:', errors);
                setSubmitting(false);
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title={`Payment Link - ${paymentLink.unique_id}`} />

            <div className="space-y-8">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-green-800">{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                        <span className="text-red-800">{flash.error}</span>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/payment-links"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Payment Links
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Payment Link
                            </h1>
                            <p className="mt-1 text-gray-600 font-mono text-sm">
                                {paymentLink.unique_id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Link Info */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Link2 className="h-5 w-5 mr-2 text-indigo-600" />
                                    Payment Details
                                </h2>
                                <span
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
                                        paymentLink.status
                                    )}`}
                                >
                                    {getStatusIcon(paymentLink.status)}
                                    {paymentLink.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount to Pay</label>
                                    <p className="mt-1 text-3xl font-bold text-indigo-600">
                                        {formatCurrency(paymentLink.amount)}
                                    </p>
                                </div>

                                {paymentLink.booking_payment?.milestone_type && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Payment Type</label>
                                        <p className="mt-1 text-gray-900 font-medium">
                                            {paymentLink.booking_payment.milestone_type}
                                        </p>
                                    </div>
                                )}

                                {paymentLink.expires_at && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Expires At</label>
                                        <p className="mt-1 text-gray-900">
                                            {formatDate(paymentLink.expires_at)}
                                        </p>
                                    </div>
                                )}

                                {paymentLink.paid_at && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Paid At</label>
                                        <p className="mt-1 text-green-600 font-medium">
                                            {formatDate(paymentLink.paid_at)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Form */}
                        {canProcessPayment && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                                    <CreditCard className="h-5 w-5 mr-2 text-indigo-600" />
                                    Process Payment
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Payment Method Selection */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-3">
                                            Payment Method
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label
                                                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                    data.payment_method === 'BankTransfer'
                                                        ? 'border-indigo-600 bg-indigo-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value="BankTransfer"
                                                    checked={data.payment_method === 'BankTransfer'}
                                                    onChange={() => setData('payment_method', 'BankTransfer')}
                                                    className="sr-only"
                                                />
                                                <Building className={`h-6 w-6 mr-3 ${
                                                    data.payment_method === 'BankTransfer' ? 'text-indigo-600' : 'text-gray-400'
                                                }`} />
                                                <div>
                                                    <span className={`font-medium ${
                                                        data.payment_method === 'BankTransfer' ? 'text-indigo-600' : 'text-gray-900'
                                                    }`}>
                                                        Bank Transfer
                                                    </span>
                                                    <p className="text-sm text-gray-500">
                                                        Manual bank payment
                                                    </p>
                                                </div>
                                            </label>

                                            <label
                                                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                    data.payment_method === 'Stripe'
                                                        ? 'border-indigo-600 bg-indigo-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value="Stripe"
                                                    checked={data.payment_method === 'Stripe'}
                                                    onChange={() => setData('payment_method', 'Stripe')}
                                                    className="sr-only"
                                                />
                                                <CreditCard className={`h-6 w-6 mr-3 ${
                                                    data.payment_method === 'Stripe' ? 'text-indigo-600' : 'text-gray-400'
                                                }`} />
                                                <div>
                                                    <span className={`font-medium ${
                                                        data.payment_method === 'Stripe' ? 'text-indigo-600' : 'text-gray-900'
                                                    }`}>
                                                        Stripe
                                                    </span>
                                                    <p className="text-sm text-gray-500">
                                                        Card payment
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                        {errors.payment_method && (
                                            <p className="mt-2 text-sm text-red-600">{errors.payment_method}</p>
                                        )}
                                    </div>

                                    {/* Bank Reference (for Bank Transfer) */}
                                    {data.payment_method === 'BankTransfer' && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-2">
                                                Bank Reference Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.bank_reference}
                                                onChange={(e) => setData('bank_reference', e.target.value)}
                                                placeholder="Enter bank transfer reference"
                                                className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                                    errors.bank_reference ? 'border-red-300' : ''
                                                }`}
                                                required={data.payment_method === 'BankTransfer'}
                                            />
                                            {errors.bank_reference && (
                                                <p className="mt-2 text-sm text-red-600">{errors.bank_reference}</p>
                                            )}
                                            <p className="mt-2 text-sm text-gray-500">
                                                Enter the reference number from the bank transfer
                                            </p>
                                        </div>
                                    )}

                                    {/* Display any other errors */}
                                    {Object.keys(errors).length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center mb-2">
                                                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                                <span className="font-medium text-red-800">Please fix the following errors:</span>
                                            </div>
                                            <ul className="list-disc list-inside text-sm text-red-700">
                                                {Object.entries(errors).map(([key, value]) => (
                                                    <li key={key}>{value}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={processing || submitting}
                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="h-5 w-5 mr-2" />
                                            {processing || submitting ? 'Processing...' : 'Process Payment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Completed Payment Info */}
                        {paymentLink.status.toLowerCase() === 'completed' && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                <div className="flex items-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-800">Payment Completed</h3>
                                        <p className="text-green-600">This payment has been successfully processed.</p>
                                    </div>
                                </div>
                                {paymentLink.paid_at && (
                                    <p className="text-sm text-green-700">
                                        Paid on: {formatDate(paymentLink.paid_at)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Expired/Revoked Payment Info */}
                        {(paymentLink.status.toLowerCase() === 'expired' || paymentLink.status.toLowerCase() === 'revoked') && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                <div className="flex items-center">
                                    <XCircle className="h-8 w-8 text-red-600 mr-3" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-red-800">
                                            Payment Link {paymentLink.status}
                                        </h3>
                                        <p className="text-red-600">
                                            This payment link is no longer valid. Please contact support for assistance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Booking Info */}
                        {paymentLink.booking && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                                    <Package className="h-5 w-5 mr-2 text-indigo-600" />
                                    Booking Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Package</label>
                                        <p className="mt-1 text-gray-900 font-medium">
                                            {paymentLink.booking.package?.name || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Booking ID</label>
                                        <p className="mt-1 text-gray-900">#{paymentLink.booking.id}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Check-in Date</label>
                                        <p className="mt-1 text-gray-900">{paymentLink.booking.from_date}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Check-out Date</label>
                                        <p className="mt-1 text-gray-900">{paymentLink.booking.to_date}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Total Price</label>
                                        <p className="mt-1 text-gray-900">
                                            {formatCurrency(paymentLink.booking.price + paymentLink.booking.booking_price)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Link
                                        href={`/admin/bookings/${paymentLink.booking.id}`}
                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                                    >
                                        View Booking Details →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* User Info */}
                        {paymentLink.user && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                                    <User className="h-5 w-5 mr-2 text-indigo-600" />
                                    Customer Details
                                </h2>

                                <div className="flex items-center mb-4">
                                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-lg font-medium text-indigo-600">
                                            {paymentLink.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">{paymentLink.user.name}</p>
                                        <p className="text-sm text-gray-500">{paymentLink.user.email}</p>
                                    </div>
                                </div>

                                {paymentLink.user.phone && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Phone</label>
                                        <p className="mt-1 text-gray-900">{paymentLink.user.phone}</p>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <Link
                                        href={`/admin/users/${paymentLink.user.id}`}
                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                                    >
                                        View Customer Profile →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Milestone Info */}
                        {paymentLink.booking_payment && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                                    <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                                    Milestone Details
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Type</label>
                                        <p className="mt-1 text-gray-900">
                                            {paymentLink.booking_payment.milestone_type || 'N/A'}
                                        </p>
                                    </div>

                                    {paymentLink.booking_payment.due_date && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Due Date</label>
                                            <p className="mt-1 text-gray-900">
                                                {paymentLink.booking_payment.due_date}
                                            </p>
                                        </div>
                                    )}

                                    {paymentLink.booking_payment.amount && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Milestone Amount</label>
                                            <p className="mt-1 text-gray-900 font-medium">
                                                {formatCurrency(paymentLink.booking_payment.amount)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Created</label>
                                    <p className="mt-1 text-gray-900">{formatDate(paymentLink.created_at)}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                                    <p className="mt-1 text-gray-900">{formatDate(paymentLink.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
