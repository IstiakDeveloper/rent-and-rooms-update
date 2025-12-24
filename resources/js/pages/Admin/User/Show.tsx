import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, User, CreditCard, FileText, Settings, Download, Mail, Link2, Trash2, Package } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import UserInfo from './Components/UserInfo';
import BookingCard from './Components/BookingCard';
import DocumentSection from './Components/DocumentSection';
import PartnerSection from './Components/PartnerSection';
import EditUserModal from './Components/Modals/EditUserModal';
import MilestoneModal from './Components/Modals/MilestoneModal';
import Toast from '@/components/Toast';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role?: string;
    roles?: Array<{
        id: number;
        name: string;
    }>;
}

interface Booking {
    id: number;
    from_date: string;
    to_date: string;
    price: number;
    booking_price: number;
    payment_status: string;
    package?: {
        id?: number;
        name: string;
        title?: string;
        address?: string;
    };
    payments: Array<{
        id: number;
        amount: string;
        status: string;
        payment_method?: string;
        created_at: string;
    }>;
    payment_summary: {
        total_price: number;
        total_paid: number;
        remaining_balance: number;
        payment_percentage: number;
    };
}

interface Package {
    id: number;
    name: string;
    title?: string;
    status?: string;
    user_id?: number;
    assigned_to?: number;
    assigned_by?: number;
    assigned_at?: string;
    documents?: Array<{
        id: number;
        type: string;
        path: string;
        expires_at?: string;
    }>;
}

interface Document {
    id: number;
    type: string;
    file_path: string;
    uploaded_at: string;
}

interface PartnerDocument {
    id: number;
    user_id: number;
    // Partner Personal Documents
    photo_id?: string;
    photo_id_expiry?: string;
    authorised_letter?: string;
    authorised_letter_expiry?: string;
    management_agreement?: string;
    management_agreement_expiry?: string;
    management_maintain_agreement?: string;
    management_maintain_agreement_expiry?: string;
    franchise_agreement?: string;
    franchise_agreement_expiry?: string;
    investor_agreement?: string;
    investor_agreement_expiry?: string;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    user: User;
    bookings: Booking[];
    packages: Package[];
    documents: Document[];
    bankDetails?: {
        name?: string;
        sort_code?: string;
        account?: string;
        account_name?: string;
        account_number?: string;
        bank_name?: string;
    };
    agreementDetails?: {
        agreement_type?: string;
        duration?: string;
        amount?: number;
        deposit?: number;
        start_date?: string;
        end_date?: string;
        monthly_rent?: number;
    };
    partnerDocuments?: PartnerDocument | null;
    partnerDocumentItems?: Array<{
        id: number;
        document_type: 'partner' | 'package';
        document_name: string;
        file_path: string | null;
        expiry_date: string | null;
        status: 'active' | 'expired' | 'pending';
        notes: string | null;
        created_at: string;
        updated_at: string;
        file_url: string | null;
    }>;
}

export default function Show({ user, bookings, packages, documents, bankDetails, agreementDetails, partnerDocuments, partnerDocumentItems = [] }: PageProps) {
    const [editUserModalOpen, setEditUserModalOpen] = useState(false);
    const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isEmailing, setIsEmailing] = useState(false);
    const [loadingBookingId, setLoadingBookingId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

    // Check if user is a Partner
    const isPartner = user.roles?.some(role => role.name.toLowerCase() === 'partner') || user.role?.toLowerCase() === 'partner';

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        setToast({ message, type });
    };

    const handleDownloadInvoice = async (bookingId: number) => {
        setIsDownloading(true);
        setLoadingBookingId(bookingId);

        try {
            const response = await axios.get(
                `/admin/users/${user.id}/booking/${bookingId}/invoice/download`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setIsDownloading(false);
            setLoadingBookingId(null);
            showToast('Invoice downloaded successfully!', 'success');
        } catch (error: any) {
            console.error('Download invoice error:', error);
            setIsDownloading(false);
            setLoadingBookingId(null);
            showToast('Failed to download invoice. Please try again.', 'error');
        }
    };

    const handleEmailInvoice = async (bookingId: number) => {
        setIsEmailing(true);
        setLoadingBookingId(bookingId);

        try {
            await axios.post(`/admin/users/${user.id}/booking/${bookingId}/invoice/email`);

            setIsEmailing(false);
            setLoadingBookingId(null);
            showToast(`Invoice has been successfully emailed to ${user.email}`, 'success');
        } catch (error: any) {
            console.error('Email invoice error:', error);
            setIsEmailing(false);
            setLoadingBookingId(null);
            showToast('Failed to send invoice email. Please try again.', 'error');
        }
    };

    const handleGeneratePaymentLink = (bookingId: number) => {
        setSelectedBookingId(bookingId);
        setMilestoneModalOpen(true);
    };

    const handleUpdatePaymentStatus = async (paymentId: number, status: string) => {
        try {
            await axios.patch(`/admin/users/${user.id}/payments/${paymentId}/status`, { status });
            router.reload();
        } catch (error: any) {
            console.error('Update payment status error:', error);
            router.reload();
        }
    };

    const handleUploadDocument = async (type: string, file: File) => {
        try {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('file', file);

            await axios.post(`/users/${user.id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            router.reload();
        } catch (error) {
            router.reload();
        }
    };

    const handleDeleteDocument = async (documentId: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await axios.delete(`/users/${user.id}/documents/${documentId}`);
            router.reload();
        } catch (error) {
            router.reload();
        }
    };

    const handleUpdateBankDetails = async (data: any) => {
        try {
            await axios.put(`/users/${user.id}/bank-details`, data);
            router.reload();
        } catch (error) {
            router.reload();
        }
    };

    const handleUpdateAgreementDetails = async (data: any) => {
        try {
            await axios.put(`/users/${user.id}/agreement-details`, data);
            router.reload();
        } catch (error) {
            router.reload();
        }
    };

    const handleUpdatePackageDocuments = async (packageId: number, type: string, file: File) => {
        try {
            const formData = new FormData();
            formData.append('type', type);
            formData.append('file', file);

            await axios.post(`/users/${user.id}/packages/${packageId}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            router.reload();
        } catch (error) {
            router.reload();
        }
    };

    const handleDeletePackageDocument = async (packageId: number, type: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await axios.delete(`/users/${user.id}/packages/${packageId}/documents/${type}`);
            router.reload();
        } catch (error) {
            router.reload();
        }
    };

    return (
        <AdminLayout>
            <Head title={`User: ${user.name}`} />

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center space-x-4 mb-4">
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Users
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200 border border-gray-200 p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="flex-shrink-0">
                                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                                        <div className="flex items-center space-x-4 mt-2">
                                            <div className="flex items-center text-gray-600">
                                                <Mail className="h-4 w-4 mr-2" />
                                                <span className="text-sm">{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center text-gray-600">
                                                    <span className="text-sm">{user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                                <User className="h-4 w-4 mr-1" />
                                                Role: {user.roles && user.roles.length > 0 ? user.roles[0].name : (user.role || 'User')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setEditUserModalOpen(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Edit User
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    {/* User Information - Always show */}
                    <div className="mb-8">
                        <UserInfo user={user} onEdit={() => setEditUserModalOpen(true)} />
                    </div>

                    {/* Assigned Packages Section - Show for all users if packages exist */}
                    {packages && packages.length > 0 && (
                        <div className="mb-8">
                            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200 border border-gray-200 overflow-hidden">
                                <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                                                <Package className="h-5 w-5 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Assigned Packages</h2>
                                            <p className="text-sm text-gray-600 mt-1">Packages assigned to this user</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="space-y-3">
                                        {packages.map((pkg) => (
                                            <div key={pkg.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:border-orange-400 transition-all duration-200 hover:shadow-md">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Package className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-gray-900">{pkg.name || 'Package'}</h3>
                                                        <p className="text-sm text-gray-500">Package ID: {pkg.id}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/admin/packages/${pkg.id}`}
                                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
                                                >
                                                    View Details
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User-specific sections (show for non-Partners) */}
                    {!isPartner && (
                        <>
                            {/* Bookings Section */}
                            {bookings.length > 0 && (
                                <div className="mb-8">
                                    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200 border border-gray-200 overflow-hidden">
                                        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                            <CreditCard className="h-5 w-5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900">User Bookings</h2>
                                                        <p className="text-sm text-gray-600 mt-1">Manage user bookings and payments</p>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                                                    <span className="font-semibold text-gray-700">{bookings.length}</span> active booking(s)
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8">
                                            <div className="space-y-6">
                                                {bookings.map((booking) => (
                                                    <div key={booking.id} className="relative">
                                                        {/* Loading Overlay */}
                                                        {loadingBookingId === booking.id && (isDownloading || isEmailing) && (
                                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                                                                <div className="flex flex-col items-center space-y-3">
                                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                                                    <p className="text-sm font-medium text-gray-700">
                                                                        {isDownloading ? 'Downloading Invoice...' : 'Sending Email...'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <BookingCard
                                                            booking={booking}
                                                            onDownloadInvoice={() => handleDownloadInvoice(booking.id)}
                                                            onEmailInvoice={() => handleEmailInvoice(booking.id)}
                                                            onGeneratePaymentLink={() => handleGeneratePaymentLink(booking.id)}
                                                            onUpdatePaymentStatus={(paymentId, status) =>
                                                                handleUpdatePaymentStatus(paymentId, status)
                                                            }
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {/* Empty State */}
                            {bookings.length === 0 && (
                                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200 border border-gray-200 p-12 text-center">
                                    <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
                                    <p className="text-gray-500">This user doesn't have any bookings yet.</p>
                                </div>
                            )}

                            {/* Documents Section */}
                            <div className="mb-8">
                                <DocumentSection
                                    userId={user.id}
                                    documents={documents}
                                />
                            </div>
                        </>
                    )}

                    {/* Partner Section (for partners only) */}
                    {isPartner && (
                        <div className="mb-8">
                            <PartnerSection
                                userId={user.id}
                                packages={packages}
                                bankDetails={bankDetails}
                                agreementDetails={agreementDetails}
                                partnerDocuments={partnerDocuments}
                                partnerDocumentItems={partnerDocumentItems}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <EditUserModal
                isOpen={editUserModalOpen}
                user={user}
                onClose={() => setEditUserModalOpen(false)}
                onSuccess={() => router.reload()}
            />

            {selectedBookingId && (
                <MilestoneModal
                    isOpen={milestoneModalOpen}
                    userId={user.id}
                    bookingId={selectedBookingId}
                    onClose={() => {
                        setMilestoneModalOpen(false);
                        setSelectedBookingId(null);
                    }}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </AdminLayout>
    );
}
