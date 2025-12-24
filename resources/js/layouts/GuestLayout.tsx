import React, { PropsWithChildren, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Menu, X as CloseIcon, MapPin, Phone, Mail, Globe, Facebook, Instagram, Linkedin, Youtube, User, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { AuthModalProvider, useAuthModal } from '@/contexts/AuthModalContext';
import AuthModal from '@/components/AuthModal';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    role?: string;
    role_name?: string; // Spatie role name
    status?: string;
}

interface AuthUser {
    user: User | null;
}

interface Country {
    id: number;
    name: string;
    code: string;
}

interface Header {
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface FooterSectionTwo {
    heading: string;
    link_text_1?: string;
    link_url_1?: string;
    link_text_2?: string;
    link_url_2?: string;
    link_text_3?: string;
    link_url_3?: string;
    link_text_4?: string;
    link_url_4?: string;
}

interface FooterSectionThree {
    heading: string;
    link_text_1?: string;
    link_url_1?: string;
    link_text_2?: string;
    link_url_2?: string;
    link_text_3?: string;
    link_url_3?: string;
    link_text_4?: string;
    link_url_4?: string;
}

interface SocialLink {
    id: number;
    icon_class?: string;
    link?: string;
}

interface FooterLink {
    id: number;
    title?: string;
    link?: string;
}

interface FooterSectionFour {
    id: number;
    title?: string;
    description?: string;
    socialLinks?: SocialLink[];
}

interface Footer {
    footer_logo?: string;
    address?: string;
    email?: string;
    contact_number?: string;
    website?: string;
    terms_title?: string;
    terms_link?: string;
    privacy_title?: string;
    privacy_link?: string;
    rights_reserves_text?: string;
    footerSectionTwo?: FooterLink[];
    footerSectionThree?: FooterLink[];
    footerSectionFour?: FooterSectionFour;
}

interface TermsCondition {
    id: number;
    title: string;
    content: string;
}

interface PrivacyPolicy {
    id: number;
    title: string;
    content: string;
}

interface GuestLayoutProps {
    header?: Header;
    footer?: Footer;
    countries?: Country[];
    selectedCountry?: number;
    auth?: AuthUser;
    termsConditions?: TermsCondition[];
    privacyPolicies?: PrivacyPolicy[];
    children?: React.ReactNode;
}

function GuestLayout({
    children,
    header,
    footer,
    countries = [],
    selectedCountry = 1,
    auth,
    termsConditions = [],
    privacyPolicies = []
}: PropsWithChildren<GuestLayoutProps>) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [aboutModalOpen, setAboutModalOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
    const { openLogin, openRegister } = useAuthModal();

    // Get termsConditions and privacyPolicies from Inertia page props
    const { props } = usePage();
    const terms = (props.termsConditions as TermsCondition[]) || termsConditions;
    const privacy = (props.privacyPolicies as PrivacyPolicy[]) || privacyPolicies;    // Get dashboard URL based on user role
    const getDashboardUrl = (user: User | null | undefined): string => {
        if (!user) return '/dashboard';

        // Check Spatie role first (role_name), then fallback to role column
        const userRole = user.role_name || user.role;

        if (!userRole) return '/dashboard';

        // Super Admin, Admin, and Partner go to admin dashboard
        if (['Super Admin', 'Admin', 'Partner'].includes(userRole)) {
            return '/admin/dashboard';
        }

        // Guest role goes to guest dashboard
        if (userRole === 'Guest') {
            return '/guest/dashboard';
        }

        // User role goes to guest dashboard (User = Guest)
        if (userRole === 'User') {
            return '/guest/dashboard';
        }

        // Default fallback
        return '/dashboard';
    };

    // Get profile URL based on user role
    const getProfileUrl = (user: User | null | undefined): string => {
        if (!user) return '/profile';

        // Check Spatie role first (role_name), then fallback to role column
        const userRole = user.role_name || user.role;

        if (!userRole) return '/profile';

        // Super Admin, Admin, and Partner go to admin profile
        if (['Super Admin', 'Admin', 'Partner'].includes(userRole)) {
            return '/admin/profile';
        }

        // Guest and User roles go to guest profile
        if (['Guest', 'User'].includes(userRole)) {
            return '/guest/profile';
        }

        // Default fallback to guest profile
        return '/guest/profile';
    };

    // Display role - show "Guest" for User role
    const getDisplayRole = (user: User | null | undefined): string => {
        if (!user) return 'Guest';

        // Check Spatie role first (role_name), then fallback to role column
        const userRole = user.role_name || user.role;

        if (!userRole) return 'Guest';

        // If role is "User", display as "Guest"
        if (userRole === 'User') return 'Guest';

        // Otherwise return the actual role
        return userRole;
    };

    const handleVerifyEmail = () => {
        router.visit('/email/verify');
    };

    const handleCountryChange = async (countryId: number) => {
        try {
            await axios.post('/set-country', { country_id: countryId });
            router.reload();
            setCountryDropdownOpen(false);
        } catch (error) {
            console.error('Failed to set country:', error);
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    const currentCountry = countries.find(c => c.id === selectedCountry);

    // Check if user needs email verification (not Super Admin and email not verified)
    const needsEmailVerification = auth?.user && !auth.user.email_verified_at && auth.user.role_name !== 'Super Admin';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
                {/* Top Bar - Modern Gradient */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
                    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-12 text-xs sm:text-sm">
                            <div className="flex items-center space-x-6">
                                {footer?.contact_number && (
                                    <a
                                        href={`tel:${footer.contact_number}`}
                                        className="flex items-center space-x-2 hover:text-yellow-300 transition-all duration-300 transform hover:scale-105 font-medium"
                                    >
                                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <Phone className="h-3 w-3" />
                                        </div>
                                        <span className="hidden sm:inline">{footer.contact_number}</span>
                                    </a>
                                )}
                                {footer?.email && (
                                    <a
                                        href={`mailto:${footer.email}`}
                                        className="hidden md:flex items-center space-x-2 hover:text-yellow-300 transition-all duration-300 transform hover:scale-105 font-medium"
                                    >
                                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <Mail className="h-3 w-3" />
                                        </div>
                                        <span>{footer.email}</span>
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                {/* Country Selector */}
                                <div className="relative">
                                    <button
                                        onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                                        className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                                    >
                                        <Globe className="h-3 w-3" />
                                        <span className="hidden sm:inline">{currentCountry?.name || 'Select Country'}</span>
                                        <span className="sm:hidden">{currentCountry?.code || 'UK'}</span>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {countryDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                                            {countries.map((country) => (
                                                <button
                                                    key={country.id}
                                                    onClick={() => handleCountryChange(country.id)}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                        country.id === selectedCountry
                                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {country.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Header */}
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="shrink-0">
                            {header && header.logo ? (
                                <img
                                    src={`/storage/${header.logo}`}
                                    alt="RentAndRooms Logo"
                                    className="h-10 w-auto"
                                    onError={(e) => {
                                        console.error('Logo failed to load:', `/storage/${header.logo}`);
                                        // Hide the broken image and show fallback text
                                        const imgElement = e.currentTarget;
                                        imgElement.style.display = 'none';

                                        // Create fallback div if it doesn't exist
                                        if (!imgElement.nextElementSibling) {
                                            const fallbackDiv = document.createElement('div');
                                            fallbackDiv.className = 'text-2xl font-bold text-blue-600';
                                            fallbackDiv.textContent = 'RentAndRooms';
                                            imgElement.parentElement!.appendChild(fallbackDiv);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="text-2xl font-bold text-blue-600">
                                    RentAndRooms
                                </div>
                            )}
                        </Link>                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-6">
                            <Link
                                href="/"
                                className="relative text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 group"
                            >
                                Home
                                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-8 group-hover:left-1/2 transform group-hover:-translate-x-1/2"></span>
                            </Link>
                            <Link
                                href="/properties"
                                className="relative text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 group"
                            >
                                Properties
                                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-8 group-hover:left-1/2 transform group-hover:-translate-x-1/2"></span>
                            </Link>
                            <button
                                onClick={() => setAboutModalOpen(true)}
                                className="relative text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 group"
                            >
                                About
                                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-8 group-hover:left-1/2 transform group-hover:-translate-x-1/2"></span>
                            </button>
                            <button
                                onClick={() => setContactModalOpen(true)}
                                data-contact-trigger
                                className="relative text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 group"
                            >
                                Contact
                                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-8 group-hover:left-1/2 transform group-hover:-translate-x-1/2"></span>
                            </button>
                            <Link
                                href="/join-with-us"
                                className="relative px-5 py-2.5 ml-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 animate-pulse group"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Join With Us
                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </Link>

                            {auth?.user ? (
                                /* Authenticated User Menu - Professional Design */
                                <div className="relative ml-4">
                                    <button
                                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                        className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                            {auth.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-gray-800 font-semibold text-sm leading-tight">{auth.user.name}</span>
                                            <span className="text-gray-500 text-xs">{auth.user.email}</span>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-500 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {userDropdownOpen && (
                                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 backdrop-blur-sm">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                        {auth.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{auth.user.name}</p>
                                                        <p className="text-sm text-gray-500">{auth.user.email}</p>
                                                        <p className="text-xs text-blue-600 font-medium mt-1">{getDisplayRole(auth.user)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-2">
                                                <Link
                                                    href={getDashboardUrl(auth.user)}
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-medium">Dashboard</span>
                                                </Link>
                                                <Link
                                                    href={getProfileUrl(auth?.user)}
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                                        <User className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <span className="font-medium">Profile Settings</span>
                                                </Link>
                                            </div>
                                            <div className="border-t border-gray-100 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setUserDropdownOpen(false);
                                                        handleLogout();
                                                    }}
                                                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                                        <LogOut className="h-4 w-4 text-red-600" />
                                                    </div>
                                                    <span className="font-medium">Sign Out</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Unauthenticated User - Professional Login Button */
                                <div className="flex items-center space-x-3 ml-4">
                                    <button
                                        onClick={openLogin}
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Sign In</span>
                                    </button>
                                    <button
                                        onClick={openRegister}
                                        className="px-6 py-2.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}
                        </nav>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
                        >
                            {mobileMenuOpen ? (
                                <CloseIcon className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
                        <div className="px-4 pt-4 pb-3 space-y-2">
                            <Link
                                href="/"
                                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/properties"
                                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Properties
                            </Link>
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    setAboutModalOpen(true);
                                }}
                                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                            >
                                About
                            </button>
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    setContactModalOpen(true);
                                }}
                                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                            >
                                Contact
                            </button>
                            <Link
                                href="/join-with-us"
                                className="block w-full text-center px-4 py-3 mt-3 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] animate-pulse"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Join With Us
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </Link>

                            {auth?.user ? (
                                /* Authenticated User Mobile Menu - Professional */
                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <div className="flex items-center px-4 py-4 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg mr-4">
                                            {auth.user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-base font-semibold text-gray-900">{auth.user.name}</p>
                                            <p className="text-sm text-gray-600">{auth.user.email}</p>
                                            <p className="text-xs text-blue-600 font-medium mt-1">{getDisplayRole(auth.user)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Link
                                            href={getDashboardUrl(auth.user)}
                                            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                                                </svg>
                                            </div>
                                            <span>Dashboard</span>
                                        </Link>
                                        <Link
                                            href={getProfileUrl(auth?.user)}
                                            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                                <User className="h-4 w-4 text-green-600" />
                                            </div>
                                            <span>Profile Settings</span>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                <LogOut className="h-4 w-4 text-red-600" />
                                            </div>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Unauthenticated User Mobile Menu - Professional */
                                <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            openLogin();
                                        }}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 transform active:scale-95 flex items-center justify-center space-x-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Sign In</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            openRegister();
                                        }}
                                        className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold transition-all duration-300 transform active:scale-95"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Email Verification Alert */}
            {needsEmailVerification && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-400 sticky top-0 z-40">
                    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 animate-pulse" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                        Email Verification Required
                                    </p>
                                    <p className="text-xs text-gray-700 mt-0.5">
                                        Please verify your email address to access all features.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleVerifyEmail}
                                className="ml-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-semibold rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2 flex-shrink-0"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <span>Verify Email</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Footer - Modern Design */}
            <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 border-t border-gray-800">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {/* Column 1 - About & Logo */}
                        <div className="space-y-6">
                            {footer?.footer_logo ? (
                                <img
                                    src={`/storage/${footer.footer_logo}`}
                                    alt="RentAndRooms Logo"
                                    className="h-14 w-auto brightness-110"
                                />
                            ) : (
                                <h3 className="text-2xl font-black text-white">
                                    Rent<span className="text-indigo-400">And</span>Rooms
                                </h3>
                            )}

                            <p className="text-gray-400 text-sm leading-relaxed">
                                {footer?.address || 'Your trusted platform for finding quality rental properties. We connect landlords with tenants across the UK.'}
                            </p>

                            {/* Social Media Links */}
                            <div>
                                <h4 className="text-white font-bold text-sm mb-4">Follow Us</h4>
                                <div className="flex gap-3">
                                    {footer?.footerSectionFour?.socialLinks && footer.footerSectionFour.socialLinks.length > 0 ? (
                                        footer.footerSectionFour.socialLinks.map((social) => (
                                            <a
                                                key={social.id}
                                                href={social.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                                                aria-label={social.icon_class}
                                            >
                                                <i className={`${social.icon_class} text-lg`}></i>
                                            </a>
                                        ))
                                    ) : (
                                        <>
                                            <a
                                                href="https://www.facebook.com/rentnroomsuk"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-blue-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-blue-600/50"
                                                aria-label="Facebook"
                                            >
                                                <Facebook className="h-5 w-5" />
                                            </a>
                                            <a
                                                href="https://www.instagram.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-pink-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-pink-600/50"
                                                aria-label="Instagram"
                                            >
                                                <Instagram className="h-5 w-5" />
                                            </a>
                                            <a
                                                href="https://x.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-black flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-gray-900/50"
                                                aria-label="X (formerly Twitter)"
                                            >
                                                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                                </svg>
                                            </a>
                                            <a
                                                href="https://www.youtube.com/@rentandrooms"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-red-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-red-600/50"
                                                aria-label="YouTube"
                                            >
                                                <Youtube className="h-5 w-5" />
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2 - Quick Links */}
                        <div className="space-y-6">
                            <h3 className="text-white font-bold text-lg border-b-2 border-indigo-600 pb-3 inline-block">
                                Quick Links
                            </h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        href="/"
                                        className="text-gray-400 hover:text-indigo-400 transition-all duration-200 text-sm flex items-center group"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/properties"
                                        className="text-gray-400 hover:text-indigo-400 transition-all duration-200 text-sm flex items-center group"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                        Properties
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setAboutModalOpen(true)}
                                        className="text-gray-400 hover:text-indigo-400 transition-all duration-200 text-sm flex items-center group"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                        About Us
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setContactModalOpen(true)}
                                        className="text-gray-400 hover:text-indigo-400 transition-all duration-200 text-sm flex items-center group"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                        Contact
                                    </button>
                                </li>
                                {footer?.footerSectionTwo && footer.footerSectionTwo.map((link) => (
                                    <li key={link.id}>
                                        <a
                                            href={link.link || '#'}
                                            className="text-gray-400 hover:text-indigo-400 transition-all duration-200 text-sm flex items-center group"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-indigo-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                            {link.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 3 - Legal */}
                        <div className="space-y-6">
                            <h3 className="text-white font-bold text-lg border-b-2 border-purple-600 pb-3 inline-block">
                                Legal
                            </h3>
                            <ul className="space-y-3">
                                {footer?.terms_title && footer?.terms_link && (
                                    <li>
                                        <button
                                            onClick={() => setTermsModalOpen(true)}
                                            className="text-gray-400 hover:text-purple-400 transition-all duration-200 text-sm flex items-center group"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-purple-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                            {footer.terms_title}
                                        </button>
                                    </li>
                                )}
                                {footer?.privacy_title && footer?.privacy_link && (
                                    <li>
                                        <button
                                            onClick={() => setPrivacyModalOpen(true)}
                                            className="text-gray-400 hover:text-purple-400 transition-all duration-200 text-sm flex items-center group"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-purple-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                            {footer.privacy_title}
                                        </button>
                                    </li>
                                )}
                                {footer?.footerSectionThree && footer.footerSectionThree.map((link) => (
                                    <li key={link.id}>
                                        <a
                                            href={link.link || '#'}
                                            className="text-gray-400 hover:text-purple-400 transition-all duration-200 text-sm flex items-center group"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-purple-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                            {link.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 4 - Contact Info */}
                        <div className="space-y-6">
                            <h3 className="text-white font-bold text-lg border-b-2 border-pink-600 pb-3 inline-block">
                                Contact Us
                            </h3>
                            <ul className="space-y-4">
                                {footer?.address && (
                                    <li className="flex items-start group">
                                        <div className="w-11 h-11 rounded-xl bg-gray-800 group-hover:bg-gradient-to-br group-hover:from-pink-600 group-hover:to-purple-600 flex items-center justify-center shrink-0 mr-3 transition-all duration-300 group-hover:shadow-lg">
                                            <MapPin className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <span className="text-gray-400 text-sm leading-relaxed pt-2.5">{footer.address}</span>
                                    </li>
                                )}
                                {footer?.contact_number && (
                                    <li className="flex items-start group">
                                        <div className="w-11 h-11 rounded-xl bg-gray-800 group-hover:bg-gradient-to-br group-hover:from-pink-600 group-hover:to-purple-600 flex items-center justify-center shrink-0 mr-3 transition-all duration-300 group-hover:shadow-lg">
                                            <Phone className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <a href={`tel:${footer.contact_number}`} className="text-gray-400 hover:text-pink-400 transition-colors text-sm pt-2.5">
                                            {footer.contact_number}
                                        </a>
                                    </li>
                                )}
                                {footer?.email && (
                                    <li className="flex items-start group">
                                        <div className="w-11 h-11 rounded-xl bg-gray-800 group-hover:bg-gradient-to-br group-hover:from-pink-600 group-hover:to-purple-600 flex items-center justify-center shrink-0 mr-3 transition-all duration-300 group-hover:shadow-lg">
                                            <Mail className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <a href={`mailto:${footer.email}`} className="text-gray-400 hover:text-pink-400 transition-colors text-sm break-all pt-2.5">
                                            {footer.email}
                                        </a>
                                    </li>
                                )}
                                <li className="flex items-start group">
                                    <div className="w-11 h-11 rounded-xl bg-gray-800 group-hover:bg-gradient-to-br group-hover:from-pink-600 group-hover:to-purple-600 flex items-center justify-center shrink-0 mr-3 transition-all duration-300 group-hover:shadow-lg">
                                        <svg className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="pt-2.5">
                                        <p className="text-gray-400 text-sm font-semibold">Open Hours</p>
                                        <p className="text-gray-400 text-sm">Mon to FRI</p>
                                        <p className="text-gray-400 text-sm">11:00AM - 7:00PM</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-16 pt-8 border-t border-gray-800">
                        <p className="text-center text-sm text-gray-400">
                            {footer?.rights_reserves_text || `© ${new Date().getFullYear()} RentAndRooms. All rights reserved.`}
                        </p>
                    </div>
                </div>
            </footer>

            {/* About Us Modal */}
            {aboutModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAboutModalOpen(false)}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
                            <h2 className="text-3xl font-bold text-white">About Us</h2>
                            <button
                                onClick={() => setAboutModalOpen(false)}
                                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                            >
                                <CloseIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-88px)]">
                            <div className="space-y-6 text-gray-700 leading-relaxed">
                                <p className="text-lg">
                                    <span className="font-bold text-blue-600">Rent&Rooms</span> is the UK's all-in-one solution for complete Property Digitalization and modern letting services. Designed for today's landlords and guests, our platform brings simplicity, transparency, and efficiency to every part of the property journey.
                                </p>

                                <p>
                                    For landlords, we provide a seamless online letting platform where you can list and let your properties with ease. Our system supports full property management, including mandatory certifications, compliance tracking, and ongoing maintenance—handled by our experienced in-house maintenance team. From onboarding to ongoing care, we ensure your property remains safe, compliant, and profitable.
                                </p>

                                <p>
                                    For guests, Rent&Rooms offers flexible accommodation options nationwide. Whether you're looking to book an entire property, rent a single room in our shared HMO accommodations, or enjoy a stay in one of our quality holiday homes or serviced apartments, we offer clean, affordable, and well-located spaces to suit every need.
                                </p>

                                <p>
                                    At Rent&Rooms, our mission is to simplify property management while delivering comfortable, reliable, and budget-friendly stays across the UK—making us the trusted choice for both landlords and guests.
                                </p>

                                <div className="border-t-2 border-blue-200 pt-6 mt-6">
                                    <h3 className="text-2xl font-bold text-blue-600 mb-4">Our Vision</h3>
                                    <p className="mb-4">
                                        At Rent&Rooms, our vision is to become the UK's leading property digitalization and accommodation network through franchising:
                                    </p>

                                    <ul className="space-y-4">
                                        <li className="flex items-start">
                                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                                            <span>Creating a unified network of Rent&Rooms franchises that deliver consistent quality in property letting, HMO room rentals, serviced accommodation, and landlord support across every region in the UK.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                                            <span>Providing franchise partners with the tools, technology, training, and operational support they need to build profitable, long-term businesses while maintaining Rent&Rooms' high standards.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                                            <span>Ensuring every Rent&Rooms branch delivers the same reliability—digital processes, mandatory compliance tracking, maintenance access, and guest satisfaction—regardless of location.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                                            <span>Continuously enhancing our digital platform, automation tools, and property management systems to help franchisees operate efficiently and scale confidently in their local markets.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 shrink-0"></span>
                                            <span>Building a future where landlords enjoy simplified, compliant property management nationwide, while guests access clean, affordable, and well-managed accommodation wherever they go.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {contactModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setContactModalOpen(false)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 flex items-center justify-between">
                            <h2 className="text-3xl font-bold text-white">Contact Us</h2>
                            <button
                                onClick={() => setContactModalOpen(false)}
                                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                            >
                                <CloseIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="space-y-6">
                                <p className="text-gray-600 text-center mb-8">
                                    Get in touch with us. We're here to help and answer any questions you might have.
                                </p>

                                {/* Contact Information Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Address */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                                                <MapPin className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-2">Address</h3>
                                                <p className="text-gray-600 text-sm leading-relaxed">
                                                    60 Sceptre Street,<br />
                                                    Newcastle upon Tyne,<br />
                                                    NE45JN
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                                                <Phone className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-2">Call Us</h3>
                                                <a href="tel:03301339494" className="text-green-600 hover:text-green-700 font-medium">
                                                    03301339494
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                                                <Mail className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-2">Email Us</h3>
                                                <a href="mailto:rentandrooms@gmail.com" className="text-purple-600 hover:text-purple-700 font-medium break-all">
                                                    rentandrooms@gmail.com
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Open Hours */}
                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 mb-2">Open Hours</h3>
                                                <p className="text-gray-600 text-sm">
                                                    <span className="font-semibold">Mon to FRI</span><br />
                                                    11:00AM - 7:00PM
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h3 className="font-bold text-gray-900 text-center mb-4">Follow Us</h3>
                                    <div className="flex justify-center gap-4">
                                        <a
                                            href="https://www.facebook.com/rentnroomsuk"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                                        >
                                            <Facebook className="h-6 w-6" />
                                        </a>
                                        <a
                                            href="https://www.instagram.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 rounded-xl bg-pink-600 hover:bg-pink-700 flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                                        >
                                            <Instagram className="h-6 w-6" />
                                        </a>
                                        <a
                                            href="https://x.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 rounded-xl bg-black hover:bg-gray-900 flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                                        >
                                            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                        </a>
                                        <a
                                            href="https://www.youtube.com/@rentandrooms"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                                        >
                                            <Youtube className="h-6 w-6" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Terms and Conditions Modal */}
            {termsModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setTermsModalOpen(false)}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
                            <h2 className="text-3xl font-bold text-white">Terms & Conditions</h2>
                            <button
                                onClick={() => setTermsModalOpen(false)}
                                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                            >
                                <CloseIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-88px)]">
                            <div className="space-y-6 text-gray-700 leading-relaxed">
                                {terms && terms.length > 0 ? (
                                    terms.map((term) => (
                                        <div key={term.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                            <h3 className="text-xl font-bold text-purple-600 mb-3">{term.title}</h3>
                                            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                                                {term.content}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-600 text-center py-8">
                                        No terms and conditions available at the moment.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Privacy Policy Modal */}
            {privacyModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPrivacyModalOpen(false)}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 flex items-center justify-between">
                            <h2 className="text-3xl font-bold text-white">Privacy Policy</h2>
                            <button
                                onClick={() => setPrivacyModalOpen(false)}
                                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                            >
                                <CloseIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-88px)]">
                            <div className="space-y-6 text-gray-700 leading-relaxed">
                                {privacy && privacy.length > 0 ? (
                                    privacy.map((policy) => (
                                        <div key={policy.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                            <h3 className="text-xl font-bold text-green-600 mb-3">{policy.title}</h3>
                                            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                                                {policy.content}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-600 text-center py-8">
                                        No privacy policy available at the moment.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Wrapper component with AuthModal context
function GuestLayoutWithModal(props: GuestLayoutProps) {
    return (
        <AuthModalProvider>
            <GuestLayoutContent {...props} />
        </AuthModalProvider>
    );
}

// Inner component that uses the context
function GuestLayoutContent({ children, header, footer, countries, selectedCountry, auth, termsConditions, privacyPolicies }: GuestLayoutProps) {
    const { isOpen, activeTab, closeModal } = useAuthModal();

    return (
        <>
            <GuestLayout
                header={header}
                footer={footer}
                countries={countries}
                selectedCountry={selectedCountry}
                auth={auth}
                termsConditions={termsConditions}
                privacyPolicies={privacyPolicies}
            >
                {children}
            </GuestLayout>
            <AuthModal
                isOpen={isOpen}
                onClose={closeModal}
                initialTab={activeTab}
            />
        </>
    );
}

export default GuestLayoutWithModal;
