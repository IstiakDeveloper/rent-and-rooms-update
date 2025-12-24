import { useState, PropsWithChildren, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Home,
    Calendar,
    CreditCard,
    User,
    FileText,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Bell,
    MessageSquare,
    ChevronRight,
    LayoutDashboard,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';

interface NavItem {
    name: string;
    href?: string;
    icon: React.ComponentType<any>;
    children?: NavItem[];
}

interface AuthUser {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    role?: string;
    role_name?: string;
    status?: string;
}

interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

interface PageProps {
    auth: {
        user: AuthUser;
    };
    unreadMessagesCount?: number;
    unreadNotificationsCount?: number;
    flash?: FlashMessages;
    [key: string]: any;
}

interface GuestDashboardLayoutProps {
    children: React.ReactNode;
}

export default function GuestDashboardLayout({ children }: PropsWithChildren<GuestDashboardLayoutProps>) {
    const { auth, flash, unreadMessagesCount = 0, unreadNotificationsCount = 0 } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (sidebarOpen && !target.closest('.sidebar') && !target.closest('.mobile-menu-button')) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    // Display role - show "Guest" for User role
    const getDisplayRole = (user: AuthUser): string => {
        if (!user.role) return 'Guest';
        if (user.role === 'User') return 'Guest';
        return user.role;
    };

    // Check if user needs email verification (not Super Admin and email not verified)
    const userRole = auth.user?.role_name || auth.user?.role;
    const isSuperAdmin = userRole === 'Super Admin';
    const needsEmailVerification = auth?.user && !auth.user.email_verified_at && !isSuperAdmin;

    const handleVerifyEmail = () => {
        router.visit('/email/verify');
    };

    const navigation: NavItem[] = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Dashboard', href: '/guest/dashboard', icon: LayoutDashboard },
        { name: 'My Bookings', href: '/guest/bookings', icon: Calendar },
        { name: 'Payments', href: '/guest/payments', icon: CreditCard },
        { name: 'Documents', href: '/guest/documents', icon: FileText },
        { name: 'Messages', href: '/guest/messages', icon: MessageSquare },
        { name: 'Profile', href: '/guest/profile', icon: User },
    ];

    const handleLogout = () => {
        router.post('/logout');
    };

    const isActive = (href: string) => {
        return window.location.pathname === href;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className={`sidebar fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            RentAndRooms
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* User Info */}
                <div className="px-4 py-5 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {auth.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {auth.user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {auth.user.email}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                {getDisplayRole(auth.user)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href || '#');
                        const showBadge = item.name === 'Messages' && unreadMessagesCount > 0;

                        return (
                            <Link
                                key={item.name}
                                href={item.href || '#'}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    active
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                                    active ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                                }`} />
                                <span className="flex-1">{item.name}</span>
                                {showBadge && (
                                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                                    </span>
                                )}
                                {active && !showBadge && (
                                    <ChevronRight className="h-4 w-4 text-white" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="px-3 py-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full group flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="mobile-menu-button p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Page Title - Will be dynamic based on route */}
                        <div className="flex-1 lg:flex-none">
                            <h1 className="text-lg font-semibold text-gray-900 ml-2 lg:ml-0">
                                {navigation.find(item => isActive(item.href || ''))?.name || 'Dashboard'}
                            </h1>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-3">
                            {/* Notifications */}
                            <Link
                                href="/guest/messages"
                                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-pulse">
                                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow">
                                        {auth.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                                </button>

                                {userDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-900">{auth.user.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{auth.user.email}</p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                                                {getDisplayRole(auth.user)}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-100 pt-2">
                                            <button
                                                onClick={() => {
                                                    setUserDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Email Verification Alert */}
                {needsEmailVerification && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-400 sticky top-16 z-30">
                        <div className="px-4 sm:px-6 lg:px-8 py-4">
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

                {/* Flash Messages */}
                {flash && (
                    <div className="px-4 sm:px-6 lg:px-8 pt-4">
                        {flash.success && (
                            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-r-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="ml-3 text-sm font-medium">{flash.success}</p>
                                </div>
                            </div>
                        )}
                        {flash.error && (
                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="ml-3 text-sm font-medium">{flash.error}</p>
                                </div>
                            </div>
                        )}
                        {flash.warning && (
                            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 rounded-r-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="ml-3 text-sm font-medium">{flash.warning}</p>
                                </div>
                            </div>
                        )}
                        {flash.info && (
                            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-lg shadow-sm">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="ml-3 text-sm font-medium">{flash.info}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                            <p className="text-sm text-gray-500">
                                © {new Date().getFullYear()} RentAndRooms. All rights reserved.
                            </p>
                            <div className="flex space-x-6">
                                <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                    Privacy Policy
                                </a>
                                <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                    Terms of Service
                                </a>
                                <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                    Help Center
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
