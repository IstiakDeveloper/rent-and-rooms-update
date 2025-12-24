import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import { AlertCircle, Home, Mail } from 'lucide-react';

interface LinkExpiredProps {
    message: string;
}

export default function LinkExpired({ message }: LinkExpiredProps) {
    return (
        <GuestLayout>
            <Head title="Payment Link Expired" />

            <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        {/* Error Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>

                        {/* Error Message */}
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">
                            Payment Link Unavailable
                        </h1>
                        <p className="text-lg text-gray-600 mb-8">
                            {message}
                        </p>

                        {/* Help Section */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
                            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                Need Help?
                            </h3>
                            <p className="text-sm text-blue-800 mb-4">
                                If you believe this is an error or need assistance with your payment, please contact our support team.
                            </p>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Request a new payment link from your booking dashboard</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Contact support for immediate assistance</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>Check your email for the latest payment link</span>
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
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-300"
                            >
                                <Mail className="w-5 h-5 mr-2" />
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
