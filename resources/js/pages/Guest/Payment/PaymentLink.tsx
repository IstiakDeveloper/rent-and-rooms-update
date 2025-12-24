import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import { CreditCard, Building2, Calendar, CheckCircle2, AlertCircle, Clock, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentLinkProps {
    paymentLink: {
        unique_id: string;
        amount: number;
        status: string;
        expires_at: string | null;
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
    };
}

export default function PaymentLink({ paymentLink }: PaymentLinkProps) {
    const [selectedMethod, setSelectedMethod] = useState<'BankTransfer' | 'Stripe'>('BankTransfer');

    const { data, setData, post, processing, errors } = useForm({
        payment_method: 'BankTransfer',
        bank_reference: '',
        bank_name: '',
        account_holder: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('Form submitting with data:', data);

        post(`/pay/${paymentLink.unique_id}/process`, {
            onSuccess: () => {
                console.log('Payment submitted successfully');
            },
            onError: (errors) => {
                console.error('Payment submission error:', errors);
            }
        });
    };

    const isExpired = paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date();

    return (
        <GuestLayout>
            <Head title="Payment Link" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Request</h1>
                        <p className="text-gray-600">Complete your payment securely</p>
                    </div>

                    {/* Error/Expired State */}
                    {isExpired ? (
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Link Expired</h2>
                            <p className="text-gray-600">This payment link has expired. Please contact support for assistance.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Payment Details Card */}
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                                    <div className="flex items-center justify-between text-white">
                                        <div>
                                            <p className="text-blue-100 text-sm mb-1">Amount Due</p>
                                            <h2 className="text-4xl font-bold">£{Number(paymentLink.amount).toFixed(2)}</h2>
                                        </div>
                                        {paymentLink.expires_at && (
                                            <div className="text-right">
                                                <p className="text-blue-100 text-sm mb-1">Due Date</p>
                                                <p className="text-xl font-semibold">
                                                    {format(new Date(paymentLink.expires_at), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* User Info */}
                                    {paymentLink.user && (
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{paymentLink.user.name}</p>
                                                <p className="text-sm text-gray-600">{paymentLink.user.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Booking Info */}
                                    {paymentLink.booking && (
                                        <div className="space-y-3">
                                            {paymentLink.booking.package && (
                                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                                    <Building2 className="w-5 h-5 text-gray-600 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{paymentLink.booking.package.name}</p>
                                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {paymentLink.booking.package.address}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                                <Calendar className="w-5 h-5 text-gray-600" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Booking Period</p>
                                                    <p className="font-semibold text-gray-900">
                                                        {format(new Date(paymentLink.booking.from_date), 'MMM dd, yyyy')} - {format(new Date(paymentLink.booking.to_date), 'MMM dd, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Milestone Info */}
                                    {paymentLink.bookingPayment && (
                                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="text-sm text-blue-600 font-medium">Payment Type</p>
                                                <p className="font-semibold text-gray-900">{paymentLink.bookingPayment.milestone_type}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="bg-white rounded-2xl shadow-xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Select Payment Method</h3>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Payment Method Selection */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMethod('BankTransfer');
                                                setData('payment_method', 'BankTransfer');
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                selectedMethod === 'BankTransfer'
                                                    ? 'border-blue-600 bg-blue-50 shadow-md'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    selectedMethod === 'BankTransfer' ? 'bg-blue-100' : 'bg-gray-100'
                                                }`}>
                                                    <Building2 className={`w-5 h-5 ${
                                                        selectedMethod === 'BankTransfer' ? 'text-blue-600' : 'text-gray-600'
                                                    }`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold text-gray-900">Bank Transfer</p>
                                                    <p className="text-xs text-gray-500">Direct bank payment</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMethod('Stripe');
                                                setData('payment_method', 'Stripe');
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                selectedMethod === 'Stripe'
                                                    ? 'border-blue-600 bg-blue-50 shadow-md'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    selectedMethod === 'Stripe' ? 'bg-blue-100' : 'bg-gray-100'
                                                }`}>
                                                    <CreditCard className={`w-5 h-5 ${
                                                        selectedMethod === 'Stripe' ? 'text-blue-600' : 'text-gray-600'
                                                    }`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold text-gray-900">Card Payment</p>
                                                    <p className="text-xs text-gray-500">Stripe secure payment</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Bank Transfer Details */}
                                    {selectedMethod === 'BankTransfer' && (
                                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Bank Reference Number <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.bank_reference}
                                                    onChange={(e) => setData('bank_reference', e.target.value)}
                                                    placeholder="Enter your transaction reference"
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                        errors.bank_reference ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    required
                                                />
                                                {errors.bank_reference && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.bank_reference}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Bank Name (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.bank_name}
                                                    onChange={(e) => setData('bank_name', e.target.value)}
                                                    placeholder="e.g., HSBC, Barclays"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Account Holder Name (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.account_holder}
                                                    onChange={(e) => setData('account_holder', e.target.value)}
                                                    placeholder="Enter account holder name"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Display */}
                                    {Object.keys(errors).length > 0 && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-red-900">Please fix the following errors:</h4>
                                                    <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                                                        {Object.values(errors).map((error, index) => (
                                                            <li key={index}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing Payment...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Submit Payment - £{Number(paymentLink.amount).toFixed(2)}
                                            </span>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Security Notice */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-semibold mb-1">Secure Payment</p>
                                        <p className="text-blue-700">Your payment information is encrypted and secure. After submission, an admin will review and confirm your payment.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
