import GuestLayout from '@/layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Lock, CheckCircle, AlertCircle, KeyRound, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';

interface ResetPasswordProps {
    token: string;
    email: string;
    header?: any;
    footer?: any;
    countries?: any[];
    selectedCountry?: number;
    auth?: any;
}

export default function ResetPassword({
    token,
    email,
    header,
    footer,
    countries,
    selectedCountry,
    auth
}: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/reset-password', {
            preserveScroll: true,
            onSuccess: () => {
                reset('password', 'password_confirmation');
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
            <Head title="Reset Password" />

            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
                <div className="max-w-2xl w-full space-y-8">
                    {/* Animated Key Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                            <div className="relative bg-white rounded-full p-8 shadow-2xl border-4 border-green-100">
                                <KeyRound className="h-20 w-20 text-green-600 animate-bounce" />
                                <div className="absolute -top-2 -right-2 bg-teal-400 rounded-full p-2 animate-ping">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-100 space-y-6">
                        {/* Header */}
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                Reset Your Password
                            </h1>
                            <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                                Create a strong new password for your account. Make sure it's something you'll remember!
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                                    <ShieldCheck className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-green-900 mb-2">
                                        Password Requirements:
                                    </h3>
                                    <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                                        <li>Minimum 8 characters long</li>
                                        <li>Mix of letters and numbers recommended</li>
                                        <li>Avoid common words or patterns</li>
                                        <li>Both passwords must match</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                            {/* Email (Read-only) */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-bold text-gray-700 mb-2"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    readOnly
                                    className="block w-full px-4 py-4 text-base border-2 border-gray-200 rounded-2xl bg-gray-50 text-gray-600 cursor-not-allowed"
                                />
                                {errors.email && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>{errors.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-bold text-gray-700 mb-2"
                                >
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter new password"
                                        autoComplete="new-password"
                                        autoFocus
                                        required
                                        className="block w-full pl-12 pr-12 py-4 text-base border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>{errors.password}</span>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-sm font-bold text-gray-700 mb-2"
                                >
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                        required
                                        className="block w-full pl-12 pr-12 py-4 text-base border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <span>{errors.password_confirmation}</span>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full group relative overflow-hidden bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center justify-center gap-3">
                                    {processing ? (
                                        <>
                                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Resetting Password...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-5 w-5" />
                                            <span>Reset Password</span>
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Help Text */}
                        <div className="text-center pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Remember your password?{' '}
                                <a
                                    href="/login"
                                    className="text-green-600 hover:text-green-700 font-semibold underline underline-offset-2 transition-colors"
                                >
                                    Back to Login
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-center text-sm text-gray-500 space-y-2">
                        <p>🔒 Your password is encrypted and stored securely.</p>
                        <p>✨ This link will expire after being used once.</p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
