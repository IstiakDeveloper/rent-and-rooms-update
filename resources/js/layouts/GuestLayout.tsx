import React, { PropsWithChildren, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Menu, X as CloseIcon, MapPin, Phone, Mail, Globe, Facebook, Instagram, Linkedin, Youtube, User, LogOut } from 'lucide-react';
import axios from 'axios';
import { AuthModalProvider, useAuthModal } from '@/contexts/AuthModalContext';
import AuthModal from '@/components/AuthModal';

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
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

interface GuestLayoutProps {
    header?: Header;
    footer?: Footer;
    countries?: Country[];
    selectedCountry?: number;
    auth?: AuthUser;
    children?: React.ReactNode;
}

function GuestLayout({
    children,
    header,
    footer,
    countries = [],
    selectedCountry = 1,
    auth
}: PropsWithChildren<GuestLayoutProps>) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const { openLogin, openRegister } = useAuthModal();    const handleCountryChange = async (countryId: number) => {
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
                {/* Top Bar - Modern Gradient */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            <Link
                                href="/about"
                                className="relative text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 group"
                            >
                                About
                                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-8 group-hover:left-1/2 transform group-hover:-translate-x-1/2"></span>
                            </Link>
                            <Link
                                href="/contact"
                                className="relative text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-blue-50 group"
                            >
                                Contact
                                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-8 group-hover:left-1/2 transform group-hover:-translate-x-1/2"></span>
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
                                                        <p className="text-xs text-blue-600 font-medium mt-1">{auth.user.role || 'User'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-2">
                                                <Link
                                                    href="/dashboard"
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
                                                    href="/profile"
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
                            <Link
                                href="/about"
                                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                href="/contact"
                                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Contact
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
                                            <p className="text-xs text-blue-600 font-medium mt-1">{auth.user.role || 'User'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Link
                                            href="/dashboard"
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
                                            href="/profile"
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

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Footer - Modern Design */}
            <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                                Your trusted platform for finding quality rental properties. We connect landlords with tenants across the UK.
                            </p>

                            {/* Social Media Links */}
                            <div>
                                <h4 className="text-white font-bold text-sm mb-4">Follow Us</h4>
                                <div className="flex gap-3">
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
                                    <Link
                                        href="/about"
                                        className="text-gray-400 hover:text-indigo-400 transition-all duration-200 text-sm flex items-center group"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/contact"
                                        className="text-gray-400 hover:text-indigo-400 transition-all duration-200 text-sm flex items-center group"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                        Contact
                                    </Link>
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
                                        <a
                                            href={footer.terms_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-purple-400 transition-all duration-200 text-sm flex items-center group"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-purple-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                            {footer.terms_title}
                                        </a>
                                    </li>
                                )}
                                {footer?.privacy_title && footer?.privacy_link && (
                                    <li>
                                        <a
                                            href={footer.privacy_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-purple-400 transition-all duration-200 text-sm flex items-center group"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-purple-600 mr-3 group-hover:scale-150 transition-transform duration-200"></span>
                                            {footer.privacy_title}
                                        </a>
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
                                        <div className="pt-2.5">
                                            <a href={`tel:${footer.contact_number}`} className="text-gray-400 hover:text-pink-400 transition-colors text-sm block">
                                                {footer.contact_number}
                                            </a>
                                            {footer?.website && (
                                                <a href={`tel:${footer.website}`} className="text-gray-400 hover:text-pink-400 transition-colors text-sm block mt-1">
                                                    {footer.website}
                                                </a>
                                            )}
                                        </div>
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
function GuestLayoutContent({ children, header, footer, countries, selectedCountry, auth }: GuestLayoutProps) {
    const { isOpen, activeTab, closeModal } = useAuthModal();

    return (
        <>
            <GuestLayout
                header={header}
                footer={footer}
                countries={countries}
                selectedCountry={selectedCountry}
                auth={auth}
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
