import { useState, PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Home,
    Users,
    Package,
    Calendar,
    MapPin,
    Building,
    Sparkles,
    Wrench,
    CreditCard,
    Mail,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
    FileText,
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
    role?: string;
    role_name?: string; // Spatie role name
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
    flash: FlashMessages;
}

export default function AdminLayout({ children }: PropsWithChildren) {
    const { auth, flash } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

    // Check if user is Partner (use Spatie role)
    const userRole = auth.user?.role_name || auth.user?.role;
    const isPartner = userRole === 'Partner';
    const isSuperAdmin = userRole === 'Super Admin';

    const toggleDropdown = (name: string) => {
        setOpenDropdowns(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    const navigation: NavItem[] = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
        // User Management - Only Super Admin & Admin
        ...(!isPartner ? [{
            name: 'User Management',
            icon: Users,
            children: [
                { name: 'All Users', href: '/admin/users', icon: Users },
                { name: 'Manage Users', href: '/admin/manage-users', icon: User },
            ],
        }] : []),
        {
            name: 'Packages',
            icon: Package,
            children: [
                { name: 'All Packages', href: '/admin/packages', icon: Package },
                { name: 'Create Package', href: '/admin/packages/create', icon: Sparkles },
            ],
        },
        {
            name: 'Bookings',
            icon: Calendar,
            children: [
                { name: 'All Bookings', href: '/admin/bookings', icon: Calendar },
                { name: 'Create Booking', href: '/admin/admin-bookings/create', icon: Calendar },
            ],
        },
        // Locations - Only Super Admin & Admin
        ...(!isPartner ? [{
            name: 'Locations',
            icon: MapPin,
            children: [
                { name: 'Countries', href: '/admin/countries', icon: MapPin },
                { name: 'Cities', href: '/admin/cities', icon: MapPin },
                { name: 'Areas', href: '/admin/areas', icon: MapPin },
            ],
        }] : []),
        // Properties - Only Super Admin & Admin
        ...(!isPartner ? [{
            name: 'Properties',
            icon: Building,
            children: [
                { name: 'Properties', href: '/admin/properties', icon: Building },
                { name: 'Property Types', href: '/admin/property-types', icon: Building },
            ],
        }] : []),
        // Amenities - Only Super Admin & Admin
        ...(!isPartner ? [{
            name: 'Amenities',
            icon: Sparkles,
            children: [
                { name: 'Amenities', href: '/admin/amenities', icon: Sparkles },
                { name: 'Amenity Types', href: '/admin/amenity-types', icon: Sparkles },
            ],
        }] : []),
        // Maintenance - Only Super Admin & Admin
        ...(!isPartner ? [{
            name: 'Maintenance',
            icon: Wrench,
            children: [
                { name: 'Maintains', href: '/admin/maintains', icon: Wrench },
                { name: 'Maintain Types', href: '/admin/maintain-types', icon: Wrench },
            ],
        }] : []),
        {
            name: 'Payments',
            icon: CreditCard,
            children: [
                { name: 'All Payments', href: '/admin/payments', icon: CreditCard },
                { name: 'Payment Links', href: '/admin/payment-links', icon: FileText },
            ],
        },
        // Mail - Only Super Admin & Admin
        ...(!isPartner ? [{ name: 'Mail', href: '/admin/mail', icon: Mail }] : []),
        { name: 'Profile', href: '/admin/profile', icon: User },
        // Settings - Only Super Admin
        // { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];


    const NavLink = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
        const isActive = window.location.pathname === item.href;
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openDropdowns.includes(item.name);
        const Icon = item.icon;

        if (hasChildren) {
            return (
                <div>
                    <button
                        onClick={() => toggleDropdown(item.name)}
                        className={`
                            w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl
                            transition-all duration-300 ease-in-out group hover:translate-x-1
                            ${depth > 0 ? 'pl-12' : ''}
                            ${isOpen
                                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50'
                            }
                        `}
                    >
                        <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                            <span>{item.name}</span>
                        </div>
                        <ChevronDown
                            className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                    <div
                        className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                        `}
                    >
                        <div className="space-y-1">
                            {item.children?.map((child) => (
                                <NavLink key={child.name} item={child} depth={depth + 1} />
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <Link
                href={item.href!}
                className={`
                    flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl
                    transition-all duration-300 ease-in-out group hover:translate-x-1
                    ${depth > 0 ? 'pl-12' : ''}
                    ${isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-105'
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-md'
                    }
                `}
            >
                <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                <span>{item.name}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-2xl
                    transform transition-transform duration-300 ease-in-out lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <Link href="/admin/dashboard" className="flex items-center space-x-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                            <span className="text-white font-bold text-xl">R</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            RentRooms
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all duration-200 hover:rotate-90"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* User info */}
                <div className="p-4 border-b border-gray-200 animate-slide-down">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold shadow-lg animate-pulse-slow">
                            {auth.user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {auth.user?.name}
                            </p>
                            <p className="text-xs text-indigo-600 font-medium truncate">
                                {userRole || 'Admin'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {navigation.map((item, index) => (
                        <div
                            key={item.name}
                            className="animate-slide-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <NavLink item={item} />
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200">
                    <Link href="/logout" method="post" as="button" className="w-full">
                        <div className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:translate-x-1 hover:shadow-md group">
                            <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
                            <span>Logout</span>
                        </div>
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white/80 border-b border-gray-200 backdrop-blur-md shadow-sm animate-slide-down">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <div className="flex-1" />

                        <div className="flex items-center space-x-4">
                            <Link href="/admin/profile">
                                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 cursor-pointer transform hover:scale-105">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                                        {auth.user?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                                        {auth.user?.name}
                                    </span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Flash messages */}
                {(flash?.success || flash?.error || flash?.warning || flash?.info) && (
                    <div className="px-4 sm:px-6 lg:px-8 pt-4">
                        {flash.success && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm animate-slide-in">
                                <p className="text-sm text-green-800 font-medium">{flash.success}</p>
                            </div>
                        )}
                        {flash.error && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm animate-slide-in">
                                <p className="text-sm text-red-800 font-medium">{flash.error}</p>
                            </div>
                        )}
                        {flash.warning && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl shadow-sm animate-slide-in">
                                <p className="text-sm text-yellow-800 font-medium">{flash.warning}</p>
                            </div>
                        )}
                        {flash.info && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm animate-slide-in">
                                <p className="text-sm text-blue-800 font-medium">{flash.info}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Page content */}
                <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
                    {children}
                </main>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-in-out;
                }

                .animate-slide-in {
                    animation: slide-in 0.4s ease-out forwards;
                    opacity: 0;
                }

                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 3px;
                    transition: background 0.2s;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
}
