import React, { useState, FormEvent } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { login as loginRoute, register as registerRoute } from '@/routes';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface PageProps {
    status?: string;
}

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { status } = usePage<PageProps>().props;

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        post(loginRoute.url(), {
            onFinish: () => reset('password'),
        });
    };    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen flex">
                {/* Left Side - Login Form */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl">R&R</span>
                                </div>
                            </div>
                            <h2 className="mt-6 text-3xl font-bold text-gray-900">
                                Welcome back
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Sign in to your account to continue
                            </p>
                        </div>

                        {/* Success Message */}
                        {status && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 animate-in slide-in-from-top duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 rounded-full p-1.5 flex-shrink-0">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-800">
                                            {status}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Login Form */}
                        <form className="mt-8 space-y-6" onSubmit={submit}>
                            <div className="space-y-4">
                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email address
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                                                errors.email
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    {errors.email && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.email}
                                        </div>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            required
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className={`block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                                                errors.password
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.password}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        name="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
                                >
                                    {processing ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Signing in...
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            Sign in
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* Sign Up Link */}
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <Link
                                        href={registerRoute.url()}
                                        className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                                    >
                                        Sign up here
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side - Image/Illustration */}
                <div className="hidden lg:flex lg:flex-1 lg:relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                        <div className="absolute inset-0 bg-black opacity-20"></div>
                    </div>
                    <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
                        <div className="max-w-md text-center">
                            <h3 className="text-3xl font-bold mb-6">
                                Welcome to RentAndRoom
                            </h3>
                            <p className="text-lg opacity-90 mb-8">
                                Your trusted platform for property rental and room booking.
                                Connect with property owners and find your perfect space.
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                    <div className="font-semibold">For Users</div>
                                    <div className="opacity-80">Find & book rooms</div>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                    <div className="font-semibold">For Partners</div>
                                    <div className="opacity-80">List your properties</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
