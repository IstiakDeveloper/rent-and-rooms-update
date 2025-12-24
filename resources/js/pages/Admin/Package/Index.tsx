import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Package, User } from '@/types';
import * as packageRoutes from '@/routes/admin/packages';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    UserPlus,
    MapPin,
    Calendar,
    Building2,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
    packages: Package[];
    availablePartners: User[];
    availableAdmins: User[];
    userRole: {
        isPartner: boolean;
        isAdmin: boolean;
        isSuperAdmin: boolean;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ packages, availablePartners, availableAdmins, userRole, filters }: Props) {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Debug: Check what data we're receiving
    React.useEffect(() => {
        console.log('Packages data:', packages);
        packages.forEach(pkg => {
            console.log(`Package ${pkg.id}:`, {
                name: pkg.name,
                assigned_to: pkg.assigned_to,
                assignedPartner: pkg.assignedPartner,
            });
        });
    }, [packages]);

    const assignForm = useForm({
        partner_id: '',
        admin_id: '',
    });

    const openAssignModal = (pkg: Package) => {
        setSelectedPackage(pkg);
        assignForm.setData({
            partner_id: pkg.assigned_to?.toString() || '',
            admin_id: (pkg as any).admin_id?.toString() || '',
        });
        setShowAssignModal(true);
    };

    const closeAssignModal = () => {
        setShowAssignModal(false);
        setSelectedPackage(null);
        assignForm.reset();
    };

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPackage) return;

        assignForm.post(packageRoutes.assign(selectedPackage.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                closeAssignModal();
                // Reload the page to fetch updated data
                router.reload({ only: ['packages'] });
            },
        });
    };

    const openDeleteModal = (pkg: Package) => {
        setSelectedPackage(pkg);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setSelectedPackage(null);
    };

    const handleDelete = () => {
        if (!selectedPackage) return;

        router.delete(packageRoutes.destroy(selectedPackage.id).url, {
            preserveScroll: true,
            onSuccess: () => closeDeleteModal(),
        });
    };

    const handleSearch = () => {
        router.get(packageRoutes.index().url, {
            search: search,
            status: statusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusBadge = (pkg: Package) => {
        const isExpired = new Date(pkg.expiration_date) < new Date();
        if (isExpired) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Expired
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title="Package Management" />

            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
                        <p className="text-sm text-gray-600 mt-1">{packages.length} packages available</p>
                    </div>
                    {!userRole.isPartner && (
                        <Link
                            href={packageRoutes.create().url}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Package
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or address..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                router.get(packageRoutes.index().url, {
                                    search: search,
                                    status: e.target.value,
                                }, {
                                    preserveState: true,
                                    preserveScroll: true,
                                });
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                        </select>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            Search
                        </button>

                        {/* Clear Filters */}
                        {(search || statusFilter) && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('');
                                    router.get(packageRoutes.index().url);
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Packages List */}
                {packages.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                        <p className="text-gray-500 mb-6">Get started by creating your first package.</p>
                        <Link
                            href={packageRoutes.create().url}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Package
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {packages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`rounded-lg border hover:shadow-md transition-shadow ${
                                    pkg.bookings && pkg.bookings.length > 0
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-gray-200'
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                                                {getStatusBadge(pkg)}
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span>{pkg.address}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span>Expires: {format(new Date(pkg.expiration_date), 'MMM dd, yyyy')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-gray-400" />
                                                        <span>{pkg.number_of_rooms} rooms</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm mb-3">
                                                <div>
                                                    <span className="text-gray-500">Created by:</span>
                                                    <span className="ml-2 font-medium text-gray-900">{pkg.creator?.name || 'Unknown'}</span>
                                                </div>
                                                {(pkg as any).franchise && (
                                                    <div>
                                                        <span className="text-gray-500">Franchise:</span>
                                                        <span className="ml-2 font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                                            {(pkg as any).franchise.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {(pkg as any).assignedAdmin && (
                                                    <div>
                                                        <span className="text-gray-500">Admin:</span>
                                                        <span className="ml-2 font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                                                            {(pkg as any).assignedAdmin.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {pkg.assignedPartner && (
                                                    <div>
                                                        <span className="text-gray-500">Partner:</span>
                                                        <span className="ml-2 font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                                            {pkg.assignedPartner.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {!pkg.assignedPartner && !(pkg as any).assignedAdmin && (
                                                    <div>
                                                        <span className="text-gray-500">Assignment:</span>
                                                        <span className="ml-2 text-gray-400 italic">Not assigned</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {pkg.current_bookings || 0} Bookings
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bookings List - Compact Grid Layout */}
                                            {pkg.bookings && pkg.bookings.length > 0 && (
                                                <div className="pt-3 border-t border-blue-200">
                                                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Active Bookings:
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {pkg.bookings.map((booking: any) => (
                                                            <div key={booking.id} className="bg-white rounded-md p-2 shadow-sm border border-gray-200">
                                                                <div className="flex items-start justify-between mb-1">
                                                                    {booking.user && (
                                                                        <Link
                                                                            href={`/admin/users/${booking.user.id}`}
                                                                            className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline truncate flex-1 mr-2"
                                                                        >
                                                                            {booking.user.name}
                                                                        </Link>
                                                                    )}
                                                                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded whitespace-nowrap ${
                                                                        booking.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                        booking.payment_status === 'partially_paid' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                        {booking.payment_status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-gray-600 truncate">
                                                                        {format(new Date(booking.from_date), 'MMM dd')} - {format(new Date(booking.to_date), 'MMM dd')}
                                                                    </span>
                                                                    <span className="font-bold text-gray-900 whitespace-nowrap ml-2">
                                                                        £{Number(booking.total_amount || 0).toFixed(0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 ml-4">
                                            <Link
                                                href={packageRoutes.show(pkg.id).url}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                            {!userRole.isPartner && (
                                                <>
                                                    <Link
                                                        href={packageRoutes.edit(pkg.id).url}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => openAssignModal(pkg)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Assign"
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(pkg)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Assign Modal */}
                {showAssignModal && selectedPackage && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Assign Package
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {selectedPackage.name}
                            </p>

                            {(selectedPackage.assignedPartner || (selectedPackage as any).assignedAdmin) && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
                                    {selectedPackage.assignedPartner && (
                                        <p className="text-sm text-blue-800">
                                            <span className="font-medium">Partner:</span> <span className="font-semibold">{selectedPackage.assignedPartner.name}</span>
                                        </p>
                                    )}
                                    {(selectedPackage as any).assignedAdmin && (
                                        <p className="text-sm text-blue-800">
                                            <span className="font-medium">Admin:</span> <span className="font-semibold">{(selectedPackage as any).assignedAdmin.name}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleAssign}>
                                {/* Admin Assignment */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assign Admin (Franchise)
                                    </label>
                                    <select
                                        value={assignForm.data.admin_id}
                                        onChange={(e) => assignForm.setData('admin_id', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">No Admin Assigned</option>
                                        {availableAdmins.map((admin) => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name} - {admin.email}
                                            </option>
                                        ))}
                                    </select>
                                    {assignForm.errors.admin_id && (
                                        <p className="mt-1 text-sm text-red-600">{assignForm.errors.admin_id}</p>
                                    )}
                                </div>

                                {/* Partner Assignment */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assign Partner
                                    </label>
                                    <select
                                        value={assignForm.data.partner_id}
                                        onChange={(e) => assignForm.setData('partner_id', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">No Partner Assigned</option>
                                        {availablePartners.map((partner) => (
                                            <option key={partner.id} value={partner.id}>
                                                {partner.name} - {partner.email}
                                            </option>
                                        ))}
                                    </select>
                                    {assignForm.errors.partner_id && (
                                        <p className="mt-1 text-sm text-red-600">{assignForm.errors.partner_id}</p>
                                    )}
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={closeAssignModal}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        disabled={assignForm.processing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        disabled={assignForm.processing}
                                    >
                                        {assignForm.processing ? 'Saving...' : 'Save Assignment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && selectedPackage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Delete Package
                                </h3>
                            </div>

                            <p className="text-gray-600 mb-2">
                                Are you sure you want to delete this package?
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <p className="font-medium text-gray-900">{selectedPackage.name}</p>
                                <p className="text-sm text-gray-600 mt-1">{selectedPackage.address}</p>
                            </div>
                            <p className="text-sm text-red-600 mb-6">
                                This action cannot be undone. All related data will be permanently deleted.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete Package
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
