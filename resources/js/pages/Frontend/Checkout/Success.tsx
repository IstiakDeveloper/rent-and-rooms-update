import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import { CheckCircle, Calendar, Home, Mail, Phone, ArrowRight } from 'lucide-react';

export default function Success() {
    const props = usePage().props as any;
    const { booking, footer, header, countries, selectedCountry, auth } = props;

    return (
        <GuestLayout footer={footer} header={header} countries={countries} selectedCountry={selectedCountry} auth={auth}>
            <Head title="Booking Confirmed" />

            <div className="min-h-screen bg-gray-50 py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-100 rounded-full p-4">
                                <CheckCircle className="h-16 w-16 text-green-600" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Booking Confirmed!
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Your booking has been successfully confirmed. We've sent a confirmation email with all the details.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
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
                                        <p className="text-sm text-gray-500">Confirmation sent to</p>
                                        <p className="font-semibold">{booking?.user?.email}</p>
                                    </div>
                                </div>
                            </div>
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
