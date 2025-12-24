import GuestLayout from '@/layouts/GuestLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw, LogOut, Sparkles } from 'lucide-react';

interface VerifyEmailProps {
    status?: string;
    header?: any;
    footer?: any;
    countries?: any[];
    selectedCountry?: number;
    auth?: any;
}

export default function VerifyEmail({
    status,
    header,
    footer,
    countries,
    selectedCountry,
    auth
}: VerifyEmailProps) {
    const [isResending, setIsResending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(status === 'verification-link-sent');

    const handleResendEmail = async () => {
        setIsResending(true);
        router.post('/email/verification-notification', {}, {
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

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <GuestLayout
            header={header}
            footer={footer}
            countries={countries}
            selectedCountry={selectedCountry}
            auth={auth}
        >
            <Head title="Verify Email Address" />

            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="max-w-2xl w-full space-y-8">
                    {/* Animated Email Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                            <div className="relative bg-white rounded-full p-8 shadow-2xl border-4 border-blue-100">
                                <Mail className="h-20 w-20 text-blue-600 animate-bounce" />
                                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-ping">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-100 space-y-6">
                        {/* Header */}
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Verify Your Email
                            </h1>
                            <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                                Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?
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
                                            Verification Link Sent!
                                        </h3>
                                        <p className="text-sm text-green-700 leading-relaxed">
                                            A fresh verification link has been sent to your email address. Please check your inbox and spam folder.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-blue-900 mb-2">
                                        Didn't receive the email?
                                    </h3>
                                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                        <li>Check your spam or junk folder</li>
                                        <li>Make sure the email address is correct</li>
                                        <li>Wait a few minutes, it might be delayed</li>
                                        <li>Click the button below to resend</li>
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
                                className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full group bg-white text-gray-700 font-semibold py-4 px-8 rounded-2xl border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <span className="flex items-center justify-center gap-3">
                                    <LogOut className="h-5 w-5" />
                                    <span>Log Out</span>
                                </span>
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="text-center pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Need help?{' '}
                                <button
                                    onClick={() => {
                                        // Trigger contact modal from GuestLayout
                                        const contactTrigger = document.querySelector('[data-contact-trigger]') as HTMLElement;
                                        contactTrigger?.click();
                                    }}
                                    className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors"
                                >
                                    Contact our support team
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center text-sm text-gray-500 space-y-2">
                        <p>🔒 Your email is safe with us. We'll never share it with anyone.</p>
                        <p>✨ Email verification helps us keep your account secure.</p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
