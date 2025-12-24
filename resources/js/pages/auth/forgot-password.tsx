import GuestLayout from '@/layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Send, ArrowLeft, Sparkles, Lock } from 'lucide-react';

interface ForgotPasswordProps {
    status?: string;
    header?: any;
    footer?: any;
    countries?: any[];
    selectedCountry?: number;
    auth?: any;
}

export default function ForgotPassword({
    status,
    header,
    footer,
    countries,
    selectedCountry,
    auth
}: ForgotPasswordProps) {
    const [showSuccess, setShowSuccess] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/forgot-password', {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccess(true);
                reset('email');
                setTimeout(() => setShowSuccess(false), 10000);
            },
        });
    };

    return (
        <GuestLayout
            header={header}
            footer={footer}
            countries={countries}
            selectedCountry={selectedCountry}
            auth={auth}
        >
            <Head title="Forgot Password" />

            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
                <div className="max-w-2xl w-full space-y-8">
                    {/* Animated Lock Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                            <div className="relative bg-white rounded-full p-8 shadow-2xl border-4 border-purple-100">
                                <Lock className="h-20 w-20 text-purple-600 animate-bounce" />
                                <div className="absolute -top-2 -right-2 bg-pink-400 rounded-full p-2 animate-ping">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-100 space-y-6">
                        {/* Header */}
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                                Forgot Password?
                            </h1>
                            <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                                No worries! Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        {/* Success Message */}
                        {(showSuccess || status) && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 animate-in slide-in-from-top duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-green-900 mb-1">
                                            Reset Link Sent Successfully!
                                        </h3>
                                        <p className="text-sm text-green-700 leading-relaxed">
                                            {status || 'We have emailed your password reset link! Please check your inbox and spam folder.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-purple-900 mb-2">
                                        How it works:
                                    </h3>
                                    <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                                        <li>Enter your registered email address</li>
                                        <li>Click "Send Reset Link" button</li>
                                        <li>Check your email for the reset link</li>
                                        <li>Click the link and create a new password</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-bold text-gray-700 mb-2"
                                >
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Enter your email address"
                                        autoComplete="email"
                                        autoFocus
                                        required
                                        className="block w-full pl-12 pr-4 py-4 text-base border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 placeholder-gray-400"
                                    />
                                </div>
                                {errors.email && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>{errors.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center justify-center gap-3">
                                    {processing ? (
                                        <>
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            <span>Send Reset Link</span>
                                        </>
                                    )}
                                </span>
                            </button>

                            {/* Back to Login */}
                            <button
                                type="button"
                                onClick={() => window.location.href = '/login'}
                                className="w-full group bg-white text-gray-700 font-semibold py-4 px-8 rounded-2xl border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <span className="flex items-center justify-center gap-3">
                                    <ArrowLeft className="h-5 w-5" />
                                    <span>Back to Login</span>
                                </span>
                            </button>
                        </form>

                        {/* Help Text */}
                        <div className="text-center pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Still having trouble?{' '}
                                <button
                                    onClick={() => {
                                        // Trigger contact modal from GuestLayout
                                        const contactTrigger = document.querySelector('[data-contact-trigger]') as HTMLElement;
                                        contactTrigger?.click();
                                    }}
                                    className="text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2 transition-colors"
                                >
                                    Contact our support team
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center text-sm text-gray-500 space-y-2">
                        <p>🔒 Your information is safe and secure with us.</p>
                        <p>✨ Reset links expire after 60 minutes for security.</p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
