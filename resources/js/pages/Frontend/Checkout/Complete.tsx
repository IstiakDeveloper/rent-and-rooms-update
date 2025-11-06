import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import { Clock, Calendar, Home, Mail, Phone, ArrowRight, AlertCircle } from 'lucide-react';

export default function Complete() {
    const props = usePage().props as any;
    const { booking, footer, header, countries, selectedCountry, auth } = props;

    return (
        <GuestLayout footer={footer} header={header} countries={countries} selectedCountry={selectedCountry} auth={auth}>
            <Head title="Booking Submitted" />

            <div className="min-h-screen bg-gray-50 py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex justify-center mb-6">
                            <div className="bg-yellow-100 rounded-full p-4">
                                <Clock className="h-16 w-16 text-yellow-600" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                            Booking Submitted!
                        </h1>
                        <p className="text-gray-600 mb-8 text-center">
                            Your booking request has been submitted successfully. We'll confirm your booking once we verify your payment.
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-blue-900">Payment Verification</h3>
                                    <p className="text-sm text-blue-800 mt-1">
                                        Please allow 1-2 business days for us to verify your bank transfer. You'll receive an email once your payment is confirmed.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 mb-8">
                            <h3 className="font-semibold text-lg mb-4">Booking Details</h3>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Home className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Property</p>
                                        <p className="font-semibold">{booking?.package?.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Check-in / Check-out</p>
                                        <p className="font-semibold">
                                            {booking?.from_date && new Date(booking.from_date).toLocaleDateString('en-GB')} - {booking?.to_date && new Date(booking.to_date).toLocaleDateString('en-GB')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-semibold">{booking?.user?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Pending Verification
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 mb-8">
                            <h3 className="font-semibold text-lg mb-3">Next Steps</h3>
                            <ol className="space-y-2 text-sm text-gray-600">
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary-600">1.</span>
                                    <span>Check your email for booking details and payment confirmation</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary-600">2.</span>
                                    <span>Wait for payment verification (1-2 business days)</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary-600">3.</span>
                                    <span>You'll receive a confirmation email once verified</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-primary-600">4.</span>
                                    <span>View your booking details in the dashboard</span>
                                </li>
                            </ol>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                            >
                                View My Bookings
                            </Link>
                            <Link
                                href="/properties"
                                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors gap-2"
                            >
                                Browse More Properties
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
