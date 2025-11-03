import React, { useState, FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle, Users, Building } from 'lucide-react';
import { register as registerRoute, login as loginRoute } from '@/routes';

interface RegisterForm {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    role: 'User' | 'Partner' | '';
    agree_user_terms: boolean;
    agree_partner_terms: boolean;
}

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role: '',
        agree_user_terms: false,
        agree_partner_terms: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        post(registerRoute.url(), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen flex">
                {/* Left Side - Registration Form */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-md w-full space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl">R&R</span>
                                </div>
                            </div>
                            <h2 className="mt-6 text-3xl font-bold text-gray-900">
                                Create your account
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Join our community and start your journey
                            </p>
                        </div>

                        {/* Registration Form */}
                        <form className="mt-8 space-y-6" onSubmit={submit}>
                            <div className="space-y-4">
                                {/* Name Field */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            required
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                                                errors.name
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    {errors.name && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.name}
                                        </div>
                                    )}
                                </div>

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

                                {/* Phone Field */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                        Phone Number
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            required
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                                                errors.phone
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                    {errors.phone && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.phone}
                                        </div>
                                    )}
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Account Type
                                    </label>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div
                                            className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ${
                                                data.role === 'User'
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => setData('role', 'User')}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value="User"
                                                    checked={data.role === 'User'}
                                                    onChange={(e) => setData('role', e.target.value as 'User')}
                                                    className="sr-only"
                                                />
                                                <Users className={`h-6 w-6 mr-3 ${data.role === 'User' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                <div>
                                                    <div className={`text-sm font-medium ${data.role === 'User' ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                        User
                                                    </div>
                                                    <div className={`text-xs ${data.role === 'User' ? 'text-indigo-600' : 'text-gray-500'}`}>
                                                        Find and book rooms
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ${
                                                data.role === 'Partner'
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => setData('role', 'Partner')}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value="Partner"
                                                    checked={data.role === 'Partner'}
                                                    onChange={(e) => setData('role', e.target.value as 'Partner')}
                                                    className="sr-only"
                                                />
                                                <Building className={`h-6 w-6 mr-3 ${data.role === 'Partner' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                <div>
                                                    <div className={`text-sm font-medium ${data.role === 'Partner' ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                        Partner
                                                    </div>
                                                    <div className={`text-xs ${data.role === 'Partner' ? 'text-indigo-600' : 'text-gray-500'}`}>
                                                        List your properties
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {errors.role && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.role}
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
                                            autoComplete="new-password"
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

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                                        Confirm Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={showPasswordConfirmation ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            required
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className={`block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                                                errors.password_confirmation
                                                    ? 'border-red-300 bg-red-50'
                                                    : 'border-gray-300 focus:border-indigo-500'
                                            }`}
                                            placeholder="Confirm your password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                        >
                                            {showPasswordConfirmation ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password_confirmation && (
                                        <div className="mt-2 flex items-center text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {errors.password_confirmation}
                                        </div>
                                    )}
                                </div>

                                {/* Terms Agreement */}
                                {data.role === 'User' && (
                                    <div className="flex items-center">
                                        <input
                                            id="agree_user_terms"
                                            name="agree_user_terms"
                                            type="checkbox"
                                            checked={data.agree_user_terms}
                                            onChange={(e) => setData('agree_user_terms', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="agree_user_terms" className="ml-2 block text-sm text-gray-700">
                                            I agree to the{' '}
                                            <a href="#" className="text-indigo-600 hover:text-indigo-500">
                                                Terms and Conditions
                                            </a>
                                        </label>
                                    </div>
                                )}

                                {data.role === 'Partner' && (
                                    <div className="flex items-center">
                                        <input
                                            id="agree_partner_terms"
                                            name="agree_partner_terms"
                                            type="checkbox"
                                            checked={data.agree_partner_terms}
                                            onChange={(e) => setData('agree_partner_terms', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="agree_partner_terms" className="ml-2 block text-sm text-gray-700">
                                            I agree to the{' '}
                                            <a href="#" className="text-indigo-600 hover:text-indigo-500">
                                                Partner Terms and Conditions
                                            </a>
                                        </label>
                                    </div>
                                )}

                                {(errors.agree_user_terms || errors.agree_partner_terms) && (
                                    <div className="flex items-center text-sm text-red-600">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        {errors.agree_user_terms || errors.agree_partner_terms}
                                    </div>
                                )}
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
                                            Creating account...
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            Create Account
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* Sign In Link */}
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link
                                        href={loginRoute.url()}
                                        className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                                    >
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side - Benefits */}
                <div className="hidden lg:flex lg:flex-1 lg:relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600">
                        <div className="absolute inset-0 bg-black opacity-20"></div>
                    </div>
                    <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
                        <div className="max-w-md text-center">
                            <h3 className="text-3xl font-bold mb-6">
                                Join RentAndRoom Community
                            </h3>
                            <p className="text-lg opacity-90 mb-8">
                                Whether you're looking for a place to stay or want to list your property,
                                we've got you covered.
                            </p>
                            <div className="space-y-4 text-sm">
                                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-left">
                                    <div className="flex items-center mb-2">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        <div className="font-semibold">Secure Platform</div>
                                    </div>
                                    <div className="opacity-80">Safe and verified listings</div>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-left">
                                    <div className="flex items-center mb-2">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        <div className="font-semibold">Easy Booking</div>
                                    </div>
                                    <div className="opacity-80">Quick and hassle-free process</div>
                                </div>
                                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-left">
                                    <div className="flex items-center mb-2">
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        <div className="font-semibold">24/7 Support</div>
                                    </div>
                                    <div className="opacity-80">Always here to help you</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
