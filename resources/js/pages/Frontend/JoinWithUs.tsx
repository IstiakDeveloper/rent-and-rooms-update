import React from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, usePage } from '@inertiajs/react';
import { CheckCircle, ArrowRight, Star, Sparkles } from 'lucide-react';

interface JoinPackage {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    whats_included: string[];
    ideal_for: string;
    price: string | null;
    price_note: string | null;
    display_order: number;
    is_active: boolean;
}

interface HeaderData {
    id: number;
    main_title: string;
    subtitle: string;
    is_active: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface AuthUser {
    user: User | null;
}

interface Props {
    packages: JoinPackage[];
    header: HeaderData | null;
    footer: any;
    headerData: any;
    countries: any[];
    selectedCountry: number;
    auth?: AuthUser;
}

export default function JoinWithUs({
    packages,
    header,
    footer,
    headerData,
    countries,
    selectedCountry,
    auth
}: Props) {
    // Extract auth data from usePage hook if not provided as prop
    const { auth: pageAuth } = usePage<{ auth: AuthUser }>().props;
    const currentAuth = auth || pageAuth;

    const handleContactClick = (e: React.MouseEvent) => {
        e.preventDefault();
        // Find and click the Contact button in the navbar
        const contactButton = document.querySelector('[data-contact-trigger]') as HTMLButtonElement;
        if (contactButton) {
            contactButton.click();
        }
    };

    return (
        <GuestLayout
            footer={footer}
            header={headerData}
            countries={countries}
            selectedCountry={selectedCountry}
            auth={currentAuth}
        >
            <Head title={header?.main_title || 'Join With Us'} />

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full animate-pulse"></div>
                </div>
                <div className="relative max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-sm font-semibold">Partner Opportunities</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        {header?.main_title || 'Rent & Rooms Packages'}
                    </h1>
                    <p className="text-xl md:text-2xl text-indigo-100 max-w-4xl mx-auto leading-relaxed">
                        {header?.subtitle || 'Choose the perfect package to grow your property business with us'}
                    </p>
                </div>
            </div>

            {/* Packages Section */}
            <div className="py-16 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-12">
                        {packages.map((pkg, index) => (
                            <div
                                key={pkg.id}
                                className="group bg-white rounded-3xl overflow-hidden border-2 border-slate-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                            >
                                {/* Package Header with Gradient */}
                                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-10 overflow-hidden">
                                    <div className="absolute inset-0 bg-black/10"></div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                                    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3">
                                                <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold text-xl shadow-lg">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
                                                        {pkg.title}
                                                    </h2>
                                                    <p className="text-indigo-100 text-lg md:text-xl">
                                                        {pkg.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {pkg.price && (
                                            <div className="md:text-right">
                                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                                                    <p className="text-white/90 text-sm font-semibold mb-1">Starting from</p>
                                                    <p className="text-white text-3xl md:text-4xl font-bold">{pkg.price}</p>
                                                    {pkg.price_note && (
                                                        <p className="text-indigo-100 text-xs mt-2">{pkg.price_note}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Package Content */}
                                <div className="p-8 md:p-10">
                                    <div className="grid md:grid-cols-2 gap-10">
                                        {/* Left Column - What's Included */}
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                                <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></span>
                                                What's Included
                                            </h3>
                                            <ul className="space-y-4">
                                                {pkg.whats_included.map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 group/item">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <CheckCircle className="w-6 h-6 text-emerald-500 group-hover/item:scale-110 transition-transform" />
                                                        </div>
                                                        <span className="text-slate-700 leading-relaxed text-base">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Right Column - Description & Ideal For */}
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                                <span className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></span>
                                                Package Details
                                            </h3>
                                            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-indigo-100">
                                                <p className="text-slate-700 leading-relaxed text-base mb-6">
                                                    {pkg.description}
                                                </p>

                                                {pkg.ideal_for && (
                                                    <div className="pt-6 border-t-2 border-indigo-200">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                                            <p className="text-sm font-bold text-indigo-900">
                                                                Perfect For:
                                                            </p>
                                                        </div>
                                                        <p className="text-slate-700 leading-relaxed text-base">
                                                            {pkg.ideal_for}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>                                {/* Package Footer */}
                                <div className="bg-gradient-to-r from-slate-50 to-indigo-50 px-8 md:px-10 py-6 border-t-2 border-slate-200">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-2 bg-white rounded-full border-2 border-indigo-200 shadow-sm">
                                                <p className="text-slate-700 text-sm font-semibold">
                                                    Package {index + 1} of {packages.length}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleContactClick}
                                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2 group"
                                        >
                                            Get Started
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="mt-16 relative rounded-3xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative p-10 md:p-16 text-center text-white">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                <span className="text-sm font-semibold">Limited Time Offer</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">
                                Ready to Get Started?
                            </h2>
                            <p className="text-xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                                Choose the package that fits your needs and join the Rent & Rooms family today. Transform your property business with our expert support.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <button
                                    onClick={handleContactClick}
                                    className="group px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center gap-2"
                                >
                                    Contact Us
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <a
                                    href="/properties"
                                    className="px-10 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 border-2 border-white/30 hover:border-white/50 backdrop-blur-sm"
                                >
                                    View Properties
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why Choose Us Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-6">
                            <Star className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-900">Our Advantages</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                            Why Choose Rent & Rooms?
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            We provide transparency, flexibility, and exceptional value across all our packages.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-100 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full opacity-20 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Flexible Solutions</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Choose from a range of packages designed to fit your specific needs and budget. Scale up or down as your business grows.
                                </p>
                            </div>
                        </div>

                        <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full opacity-20 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Professional Support</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Our dedicated team is here to support you every step of the way with 24/7 assistance and expert guidance.
                                </p>
                            </div>
                        </div>

                        <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 rounded-full opacity-20 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Proven Results</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Join hundreds of successful landlords and partners who trust Rent & Rooms to grow their property portfolio.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
