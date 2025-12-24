import GuestLayout from '@/layouts/GuestLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, CheckCircle, Clock, RefreshCw, Home, AlertCircle } from 'lucide-react';

interface Booking {
    id: number;
    package: {
        name: string;
    };
    from_date: string;
    to_date: string;
    total_amount: string | number;
    number_of_days: number;
    booking_verified_at: string | null;
}

interface VerificationPendingProps {
    booking: Booking;
    header?: any;
    footer?: any;
    countries?: any[];
    selectedCountry?: number;
    auth?: any;
}

export default function VerificationPending({
    booking,
    header,
    footer,
    countries,
    selectedCountry,
    auth
}: VerificationPendingProps) {
    const [isResending, setIsResending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleResendEmail = async () => {
        setIsResending(true);
        router.post(`/booking/${booking.id}/resend-verification`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 5000);
            },
            onFinish: () => {
                setIsResending(false);
            },
        });
    };

    const goToHome = () => {
        router.visit('/');
    };

    return (
        <GuestLayout
            header={header}
            footer={footer}
            countries={countries}
            selectedCountry={selectedCountry}
            auth={auth}
        >
            <Head title="Verify Your Booking" />

            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <div className="max-w-3xl w-full space-y-8">
                    {/* Animated Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                            <div className="relative bg-white rounded-full p-8 shadow-2xl border-4 border-indigo-100">
                                <Clock className="h-24 w-24 text-indigo-600 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-100 space-y-6">
                        {/* Header */}
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Verify Your Booking
                            </h1>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                                We've sent a verification email to <strong>{auth?.user?.email}</strong>.
                                Please check your inbox and click the verification link to confirm this booking.
                            </p>
                        </div>

                        {/* Success Message */}
                        {showSuccess && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 animate-in slide-in-from-top duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-green-900 mb-1">
                                            Verification Email Sent!
                                        </h3>
                                        <p className="text-sm text-green-700 leading-relaxed">
                                            A new verification link has been sent to your email. Please check your inbox and spam folder.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Booking Details */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <Mail className="h-6 w-6" />
                                Booking Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-semibold">Booking ID:</span>
                                    <span className="text-sm text-gray-900 font-bold">#{booking.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-semibold">Property:</span>
                                    <span className="text-sm text-gray-900 font-bold">{booking.package.name}</span>
                                </div>
                                {booking.from_date && booking.to_date && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 font-semibold">Check-in:</span>
                                            <span className="text-sm text-gray-900 font-bold">
                                                {new Date(booking.from_date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 font-semibold">Check-out:</span>
                                            <span className="text-sm text-gray-900 font-bold">
                                                {new Date(booking.to_date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-semibold">Duration:</span>
                                    <span className="text-sm text-gray-900 font-bold">{booking.number_of_days} Days</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t-2 border-indigo-200">
                                    <span className="text-base text-gray-700 font-bold">Total Amount:</span>
                                    <span className="text-xl text-indigo-600 font-black">
                                        £{parseFloat(booking.total_amount.toString()).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Important Warning */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-yellow-100 rounded-full p-2 flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-yellow-900 mb-2">
                                        ⚠️ Action Required
                                    </h3>
                                    <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
                                        <li>Your booking is NOT confirmed until you verify via email</li>
                                        <li>Check your email inbox and spam/junk folder</li>
                                        <li>Click the verification link within 24 hours</li>
                                        <li>If not verified, the booking will be automatically cancelled</li>
                                        <li>You must verify EVERY booking for security</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-4">
                            {/* Resend Button */}
                            <button
                                onClick={handleResendEmail}
                                disabled={isResending}
                                className="w-full group relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center justify-center gap-3">
                                    {isResending ? (
                                        <>
                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-5 w-5" />
                                            <span>Resend Verification Email</span>
                                        </>
                                    )}
                                </span>
                            </button>

                            {/* Home Button */}
                            <button
                                onClick={goToHome}
                                className="w-full group bg-white text-gray-700 font-semibold py-4 px-8 rounded-2xl border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <span className="flex items-center justify-center gap-3">
                                    <Home className="h-5 w-5" />
                                    <span>Back to Home</span>
                                </span>
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="text-center pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Need help?{' '}
                                <button
                                    onClick={() => {
                                        const contactTrigger = document.querySelector('[data-contact-trigger]') as HTMLElement;
                                        contactTrigger?.click();
                                    }}
                                    className="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2 transition-colors"
                                >
                                    Contact our support team
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center text-sm text-gray-500 space-y-2">
                        <p>🔒 This verification ensures your booking security</p>
                        <p>📧 Verification email sent to: <strong>{auth?.user?.email}</strong></p>
                        <p>⏰ Verification link expires in 24 hours</p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
