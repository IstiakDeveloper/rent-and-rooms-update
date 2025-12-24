import { Head, router, useForm } from '@inertiajs/react';
import GuestDashboardLayout from '@/layouts/GuestDashboardLayout';
import AdminLayout from '@/layouts/AdminLayout';
import PartnerDocuments from './Components/PartnerDocuments';
import { useState, useEffect } from 'react';
import {
    User,
    Lock,
    FileText,
    CreditCard,
    Save,
    Upload,
    Trash2,
    Edit2,
    X,
    Eye,
    Building2,
} from 'lucide-react';

// Interfaces
interface UserDocument {
    id: number;
    person_name: string;
    passport?: string;
    nid_or_other?: string;
    payslip?: string;
    student_card?: string;
}

interface PartnerDocument {
    id?: number;
    user_id?: number;
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
    created_at?: string;
    updated_at?: string;
}

interface PartnerDocumentItem {
    id: number;
    user_id: number;
    package_id: number;
    document_type: 'partner' | 'package';
    document_name: string;
    file_path: string | null;
    expiry_date: string | null;
    status: 'active' | 'expired' | 'pending';
    notes: string | null;
    created_at: string;
    updated_at: string;
    file_url?: string | null;
}

interface Package {
    id: number;
    name: string;
    address?: string;
    title?: string;
    status?: string;
}

interface AgreementDetailData {
    id?: number;
    agreement_type?: string;
    duration?: string;
    amount?: number;
    deposit?: number;
}

interface BankDetailData {
    id?: number;
    name?: string;
    sort_code?: string;
    account?: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    documents?: UserDocument[];
    partner_documents?: PartnerDocument;
    partner_document_items?: PartnerDocumentItem[];
    agreement_detail?: AgreementDetailData;
    bank_detail?: BankDetailData;
    packages?: Package[];
}

interface Props {
    user: UserData;
    role: string;
    userPackages?: Package[];
    availablePackages?: Package[];
}

export default function Show({ user, role, userPackages = [], availablePackages = [] }: Props) {
    const isPartner = role === 'Partner';
    const isAdmin = ['Super Admin', 'Admin'].includes(role);
    const isGuest = ['User', 'Guest'].includes(role);

    const routePrefix = isAdmin ? '/admin' : isPartner ? '/admin' : '/guest';
    const Layout = isAdmin || isPartner ? AdminLayout : GuestDashboardLayout;

    const [activeTab, setActiveTab] = useState<string>('personal');
    const [editingDocument, setEditingDocument] = useState<UserDocument | null>(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);

    // Forms
    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const agreementForm = useForm({
        agreement_type: user.agreement_detail?.agreement_type || '',
        duration: user.agreement_detail?.duration || '',
        amount: user.agreement_detail?.amount || '',
        deposit: user.agreement_detail?.deposit || '',
    });

    const bankForm = useForm({
        name: user.bank_detail?.name || '',
        sort_code: user.bank_detail?.sort_code || '',
        account: user.bank_detail?.account || '',
    });

    const documentForm = useForm({
        person_name: '',
        passport: null as File | null,
        nid_or_other: null as File | null,
        payslip: null as File | null,
        student_card: null as File | null,
    });

    // Update forms when user data changes
    useEffect(() => {
        console.log('User data changed:', {
            agreement_detail: user.agreement_detail,
            bank_detail: user.bank_detail,
            partner_documents: user.partner_documents
        });

        if (user.agreement_detail) {
            agreementForm.setData({
                agreement_type: user.agreement_detail.agreement_type || '',
                duration: user.agreement_detail.duration || '',
                amount: user.agreement_detail.amount || '',
                deposit: user.agreement_detail.deposit || '',
            });
        }
        if (user.bank_detail) {
            bankForm.setData({
                name: user.bank_detail.name || '',
                sort_code: user.bank_detail.sort_code || '',
                account: user.bank_detail.account || '',
            });
        }
    }, [user.agreement_detail, user.bank_detail]);

    const partnerDocumentForm = useForm({
        hmo_licence: null as File | null,
        hmo_licence_expiry: user.partner_documents?.hmo_licence_expiry || '',
        gas_certificate: null as File | null,
        gas_certificate_expiry: user.partner_documents?.gas_certificate_expiry || '',
        eicr_certificate: null as File | null,
        eicr_certificate_expiry: user.partner_documents?.eicr_certificate_expiry || '',
        epc_certificate: null as File | null,
        epc_certificate_expiry: user.partner_documents?.epc_certificate_expiry || '',
        smoke_fire_certificate: null as File | null,
        smoke_fire_certificate_expiry: user.partner_documents?.smoke_fire_certificate_expiry || '',
        floor_plan: null as File | null,
        floor_plan_expiry: user.partner_documents?.floor_plan_expiry || '',
        agreement_paper: null as File | null,
        agreement_paper_expiry: user.partner_documents?.agreement_paper_expiry || '',
        authorization_letter: null as File | null,
        authorization_letter_expiry: user.partner_documents?.authorization_letter_expiry || '',
    });

    // Form handlers
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.post(`${routePrefix}/profile`, {
            preserveScroll: true,
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.post(`${routePrefix}/profile/password`, {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handleAgreementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        agreementForm.post(`${routePrefix}/profile/agreement`, {
            preserveScroll: true,
            onSuccess: () => {
                // Reload the page to get fresh data
                router.reload({ only: ['user'] });
            },
        });
    };

    const handleBankSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bankForm.post(`${routePrefix}/profile/bank`, {
            preserveScroll: true,
            onSuccess: () => {
                // Reload the page to get fresh data
                router.reload({ only: ['user'] });
            },
        });
    };

    const handleDocumentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDocument) {
            documentForm.post(`${routePrefix}/profile/documents/${editingDocument.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowDocumentModal(false);
                    setEditingDocument(null);
                    documentForm.reset();
                },
            });
        } else {
            documentForm.post(`${routePrefix}/profile/documents`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowDocumentModal(false);
                    documentForm.reset();
                },
            });
        }
    };

    const handleDeleteDocument = (id: number) => {
        if (confirm('Are you sure you want to delete this document?')) {
            router.delete(`${routePrefix}/profile/documents/${id}`, {
                preserveScroll: true,
            });
        }
    };

    const handleDeleteAgreement = () => {
        if (confirm('Are you sure you want to delete this agreement?')) {
            router.delete(`${routePrefix}/profile/agreement`, {
                preserveScroll: true,
                onSuccess: () => {
                    // Reload the page to get fresh data
                    router.reload({ only: ['user'] });
                },
            });
        }
    };

    const openEditModal = (doc: UserDocument) => {
        setEditingDocument(doc);
        documentForm.setData({
            person_name: doc.person_name,
            passport: null,
            nid_or_other: null,
            payslip: null,
            student_card: null,
        });
        setShowDocumentModal(true);
    };

    const openAddModal = () => {
        setEditingDocument(null);
        documentForm.reset();
        setShowDocumentModal(true);
    };

    // Define tabs based on role
    const guestTabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'documents', label: 'Documents', icon: FileText },
    ];

    const partnerTabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'partner-info', label: 'Partner Information', icon: Building2 },
    ];

    const adminTabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'agreement', label: 'Agreement', icon: FileText },
        { id: 'bank', label: 'Bank Details', icon: CreditCard },
    ];

    const tabs = isPartner ? partnerTabs : isAdmin ? adminTabs : guestTabs;

    return (
        <Layout>
            <Head title="Profile" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <User className="h-8 w-8 text-blue-600" />
                        Profile Information
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Manage your profile and account settings ({role})
                    </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <Icon className="h-5 w-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab: Personal Info (সবার জন্য) */}
                {activeTab === 'personal' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Personal Information
                            </h2>
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.data.name}
                                        onChange={(e) =>
                                            profileForm.setData('name', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {profileForm.errors.name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {profileForm.errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) =>
                                            profileForm.setData('email', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {profileForm.errors.email && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {profileForm.errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.data.phone}
                                        onChange={(e) =>
                                            profileForm.setData('phone', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        value={profileForm.data.address}
                                        onChange={(e) =>
                                            profileForm.setData('address', e.target.value)
                                        }
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {profileForm.processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Lock className="h-5 w-5 text-blue-600" />
                                Security Settings
                            </h2>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.current_password}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'current_password',
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {passwordForm.errors.current_password && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {passwordForm.errors.current_password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) =>
                                            passwordForm.setData('password', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {passwordForm.errors.password && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {passwordForm.errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) =>
                                            passwordForm.setData(
                                                'password_confirmation',
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Lock className="h-4 w-4" />
                                    {passwordForm.processing
                                        ? 'Updating...'
                                        : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Tab: Documents (শুধু User/Guest এবং Admin এর জন্য) */}
                {(isGuest || isAdmin) && activeTab === 'documents' && (
                    <div className="space-y-6">
                        {/* Upload New Document Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={openAddModal}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Upload New Document
                            </button>
                        </div>

                        {/* Documents Table */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Person Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Passport
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            NID/Other
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Payslip
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Student/Employee Card
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {user.documents && user.documents.length > 0 ? (
                                        user.documents.map((doc, index) => (
                                            <tr key={doc.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {doc.person_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {doc.passport ? (
                                                        <a
                                                            href={`/guest/profile/documents/${doc.id}/passport/download`}
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            Not Uploaded
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {doc.nid_or_other ? (
                                                        <a
                                                            href={`/guest/profile/documents/${doc.id}/nid_or_other/download`}
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            Not Uploaded
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {doc.payslip ? (
                                                        <a
                                                            href={`/guest/profile/documents/${doc.id}/payslip/download`}
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            Not Uploaded
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {doc.student_card ? (
                                                        <a
                                                            href={`/guest/profile/documents/${doc.id}/student_card/download`}
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            Not Uploaded
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(doc)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDocument(doc.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                                <p>No documents have been uploaded yet.</p>
                                                <button
                                                    onClick={openAddModal}
                                                    className="mt-3 text-blue-600 hover:text-blue-800"
                                                >
                                                    Upload your first document
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab: Agreement (শুধু Partner এবং Admin এর জন্য) */}
                {(isPartner || isAdmin) && activeTab === 'agreement' && (
                    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Agreement Details
                            </h2>
                            {user.agreement_detail && (
                                <button
                                    onClick={handleDeleteAgreement}
                                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleAgreementSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Agreement Type
                                    </label>
                                    <input
                                        type="text"
                                        value={agreementForm.data.agreement_type}
                                        onChange={(e) =>
                                            agreementForm.setData('agreement_type', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Duration
                                    </label>
                                    <input
                                        type="text"
                                        value={agreementForm.data.duration}
                                        onChange={(e) =>
                                            agreementForm.setData('duration', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount (£)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={agreementForm.data.amount}
                                        onChange={(e) =>
                                            agreementForm.setData('amount', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Deposit (£)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={agreementForm.data.deposit}
                                        onChange={(e) =>
                                            agreementForm.setData('deposit', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={agreementForm.processing}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {agreementForm.processing ? 'Saving...' : 'Save Agreement'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab: Partner Information (শুধু Partner এর জন্য) */}
                {isPartner && activeTab === 'partner-info' && (
                    <PartnerDocuments
                        packages={userPackages}
                        partnerDocuments={user.partner_documents}
                        partnerDocumentItems={user.partner_document_items}
                        bankDetails={user.bank_detail}
                        agreementDetails={user.agreement_detail}
                    />
                )}

                {/* Tab: Bank Details (শুধু Partner এবং Admin এর জন্য) */}
                {(isPartner || isAdmin) && activeTab === 'bank' && (
                    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            Bank Details
                        </h2>
                        <form onSubmit={handleBankSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    value={bankForm.data.name}
                                    onChange={(e) => bankForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sort Code
                                    </label>
                                    <input
                                        type="text"
                                        value={bankForm.data.sort_code}
                                        onChange={(e) =>
                                            bankForm.setData('sort_code', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        value={bankForm.data.account}
                                        onChange={(e) =>
                                            bankForm.setData('account', e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={bankForm.processing}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {bankForm.processing ? 'Saving...' : 'Save Bank Details'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Document Upload/Edit Modal */}
            {showDocumentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">
                                    {editingDocument ? 'Edit Document' : 'Upload New Document'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDocumentModal(false);
                                        setEditingDocument(null);
                                        documentForm.reset();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleDocumentSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Person Name
                                    </label>
                                    <input
                                        type="text"
                                        value={documentForm.data.person_name}
                                        onChange={(e) =>
                                            documentForm.setData('person_name', e.target.value)
                                        }
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {documentForm.errors.person_name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {documentForm.errors.person_name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Passport
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                documentForm.setData(
                                                    'passport',
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            NID/Other
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                documentForm.setData(
                                                    'nid_or_other',
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Payslip
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                documentForm.setData(
                                                    'payslip',
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Student/Employee Card
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) =>
                                                documentForm.setData(
                                                    'student_card',
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDocumentModal(false);
                                            setEditingDocument(null);
                                            documentForm.reset();
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={documentForm.processing}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {documentForm.processing
                                            ? 'Saving...'
                                            : editingDocument
                                            ? 'Update'
                                            : 'Upload'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
