import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import { CheckCircle2, Home, FileText } from 'lucide-react';

interface PaymentSuccessProps {
    payment: any;
    message: string;
}

export default function PaymentSuccess({ payment, message }: PaymentSuccessProps) {
    return (
        <GuestLayout>
            <Head title="Payment Submitted" />

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        {/* Success Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
                            <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>

                        {/* Success Message */}
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">
                            Payment Submitted Successfully!
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            {message}
                        </p>

                        {/* Payment Details */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
                            <div className="space-y-3">
                                {payment.id && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Payment ID:</span>
                                        <span className="font-semibold text-gray-900">#{payment.id}</span>
                                    </div>
                                )}
                                {payment.amount && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className="font-bold text-green-600 text-lg">£{Number(payment.amount).toFixed(2)}</span>
                                    </div>
                                )}
                                {payment.payment_method && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Payment Method:</span>
                                        <span className="font-semibold text-gray-900">{payment.payment_method}</span>
                                    </div>
                                )}
                                {payment.reference_number && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600">Reference:</span>
                                        <span className="font-semibold text-gray-900">{payment.reference_number}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                        Pending Review
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
                            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                What Happens Next?
                            </h3>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">1.</span>
                                    <span>An admin will review your payment submission</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">2.</span>
                                    <span>You'll receive an email confirmation once approved</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">3.</span>
                                    <span>Your booking will be updated automatically</span>
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
