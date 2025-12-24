import React from 'react';
import { Head } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { User, Building, Sparkles } from 'lucide-react';

export default function AuthTest({ header, footer, countries, selectedCountry }: any) {
    const { openLogin, openRegister } = useAuthModal();

    return (
        <GuestLayout
            header={header}
            footer={footer}
            countries={countries}
            selectedCountry={selectedCountry}
        >
            <Head title="Authentication Test" />

            <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 py-12">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl">
                                <Sparkles className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Authentication Modal Test
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Test the common authentication modal system with both login and registration flows
                        </p>
                    </div>

                    {/* Test Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {/* Login Test */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Test Login Modal</h3>
                                <p className="text-gray-600 mb-6">
                                    Open the login modal to test existing user authentication
                                </p>
                                <button
                                    onClick={openLogin}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                                >
                                    Open Login Modal
                                </button>
                            </div>
                        </div>

                        {/* User Registration Test */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Test User Registration</h3>
                                <p className="text-gray-600 mb-6">
                                    Open registration modal to test user account creation with terms
                                </p>
                                <button
                                    onClick={openRegister}
                                    className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                                >
                                    Register as User
                                </button>
                            </div>
                        </div>

                        {/* Partner Registration Test */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Building className="w-8 h-8 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Test Partner Registration</h3>
                                <p className="text-gray-600 mb-6">
                                    Test partner registration with different terms & conditions
                                </p>
                                <button
                                    onClick={openRegister}
                                    className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                                >
                                    Register as Partner
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Features Overview */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Modal Features Implemented
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">✅ Authentication Features</h3>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Common modal for all pages</li>
                                    <li>• Login & Registration tabs</li>
                                    <li>• Partner/User type selection</li>
                                    <li>• Form validation & error handling</li>
                                    <li>• Password visibility toggle</li>
                                    <li>• Remember me option</li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">✅ Terms & Conditions</h3>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Different terms for Partners/Users</li>
                                    <li>• Terms acceptance requirement</li>
                                    <li>• Modal-within-modal for terms</li>
                                    <li>• Registration blocked without acceptance</li>
                                    <li>• Responsive design</li>
                                    <li>• Global context state management</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Usage Instructions */}
                    <div className="mt-12 bg-linear-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use in Your Pages</h2>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <pre className="text-sm text-gray-800 overflow-x-auto">
{`// Import the hook
import { useAuthModal } from '@/contexts/AuthModalContext';

// Use in component
function YourComponent() {
    const { openLogin, openRegister } = useAuthModal();

    return (
        <div>
            <button onClick={openLogin}>Login</button>
            <button onClick={openRegister}>Register</button>
        </div>
    );
}`}
                            </pre>
                        </div>
                        <p className="text-gray-600 mt-4">
                            The modal is automatically included in the GuestLayout, so any page using GuestLayout
                            will have access to the authentication modal system.
                        </p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
