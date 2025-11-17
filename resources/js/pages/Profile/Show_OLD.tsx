import { Head, router, useForm } from '@inertiajs/react';
import GuestDashboardLayout from '@/layouts/GuestDashboardLayout';
import AdminLayout from '@/layouts/AdminLayout';
import { useState } from 'react';
import {
    User,
    Lock,
    FileText,
    CreditCard,
    Building2,
    Save,
    Upload,
    Trash2,
    Edit2,
    X,
    Calendar,
    Phone,
    MapPin,
    Mail,
    AlertCircle,
} from 'lucide-react';

interface UserDetailData {
    id?: number;
    phone?: string;
    occupied_address?: string;
    package_id?: number;
    booking_type?: string;
    entry_date?: string;
    package_price?: number;
    security_amount?: number;
    stay_status?: string;
    package?: Package;
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

interface UserDocument {
    id: number;
    person_name: string;
    passport?: string;
    nid_or_other?: string;
    payslip?: string;
    student_card?: string;
}

interface Package {
    id: number;
    name: string;
    address?: string;
    city?: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    proof_type_1?: string;
    proof_path_1?: string;
    proof_type_2?: string;
    proof_path_2?: string;
    proof_type_3?: string;
    proof_path_3?: string;
    proof_type_4?: string;
    proof_path_4?: string;
    documents?: UserDocument[];
    agreementDetail?: AgreementDetailData;
    bankDetail?: BankDetailData;
    userDetail?: UserDetailData;
}

interface Props {
    user: UserData;
    role: string;
    packages: Package[];
    bookings: any[];
}

export default function Show({ user, role, packages, bookings }: Props) {
    const [activeTab, setActiveTab] = useState<'personal' | 'documents' | 'agreement' | 'bank' | 'user-details'>('personal');
    const [editingDocument, setEditingDocument] = useState<UserDocument | null>(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);

    // Determine if user is admin/partner or guest
    const isAdmin = ['Super Admin', 'Admin', 'Partner'].includes(role);
    const routePrefix = isAdmin ? '/admin' : '/guest';
    const Layout = isAdmin ? AdminLayout : GuestDashboardLayout;

    // Profile Form
    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
    });

    // Password Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // User Detail Form
    const userDetailForm = useForm({
        phone: user.userDetail?.phone || '',
        occupied_address: user.userDetail?.occupied_address || '',
        package_id: user.userDetail?.package_id || '',
        booking_type: user.userDetail?.booking_type || '',
        entry_date: user.userDetail?.entry_date || '',
        package_price: user.userDetail?.package_price || '',
        security_amount: user.userDetail?.security_amount || '',
        stay_status: user.userDetail?.stay_status || 'not_staying',
    });

    // Agreement Form
    const agreementForm = useForm({
        agreement_type: user.agreementDetail?.agreement_type || '',
        duration: user.agreementDetail?.duration || '',
        amount: user.agreementDetail?.amount || '',
        deposit: user.agreementDetail?.deposit || '',
    });

    // Bank Form
    const bankForm = useForm({
        name: user.bankDetail?.name || '',
        sort_code: user.bankDetail?.sort_code || '',
        account: user.bankDetail?.account || '',
    });

    // Document Form
    const documentForm = useForm({
        person_name: '',
        passport: null as File | null,
        nid_or_other: null as File | null,
        payslip: null as File | null,
        student_card: null as File | null,
    });

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

    const handleUserDetailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        userDetailForm.post(`${routePrefix}/profile/user-detail`, {
            preserveScroll: true,
        });
    };

    const handleAgreementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        agreementForm.post(`${routePrefix}/profile/agreement`, {
            preserveScroll: true,
        });
    };

    const handleBankSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bankForm.post(`${routePrefix}/profile/bank`, {
            preserveScroll: true,
        });
    };

    const handleDocumentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('person_name', documentForm.data.person_name);
        if (documentForm.data.passport) formData.append('passport', documentForm.data.passport);
        if (documentForm.data.nid_or_other) formData.append('nid_or_other', documentForm.data.nid_or_other);
        if (documentForm.data.payslip) formData.append('payslip', documentForm.data.payslip);
        if (documentForm.data.student_card) formData.append('student_card', documentForm.data.student_card);

        router.post(`${routePrefix}/profile/documents`, formData, {
            onSuccess: () => {
                setShowDocumentModal(false);
                documentForm.reset();
            },
        });
    };

    const handleDeleteDocument = (id: number) => {
        if (confirm('Are you sure you want to delete this document?')) {
            router.delete(`${routePrefix}/profile/documents/${id}`);
        }
    };

    const tabs = [
        { key: 'personal' as const, label: 'Personal Info', icon: User },
        { key: 'documents' as const, label: 'Documents', icon: FileText },
        { key: 'agreement' as const, label: 'Agreement', icon: Building2 },
        { key: 'bank' as const, label: 'Bank Details', icon: CreditCard },
        ...(role !== 'User' ? [{ key: 'user-details' as const, label: 'User Details', icon: MapPin }] : []),
    ];

    return (
        <Layout>
            <Head title="Profile" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <div className="flex space-x-8 overflow-x-auto">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeTab === key
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
                <div className="space-y-6">
                    {/* Profile Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Information
                        </h2>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="text"
                                        value={profileForm.data.phone}
                                        onChange={(e) => profileForm.setData('phone', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <input
                                        type="text"
                                        value={profileForm.data.address}
                                        onChange={(e) => profileForm.setData('address', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                Save Changes
                            </button>
                        </form>
                    </div>

                    {/* Password Change */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                        </h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="mt-1 text-sm text-red-600">{passwordForm.errors.current_password}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Lock className="h-4 w-4" />
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Uploaded Documents
                        </h2>
                        <button
                            onClick={() => setShowDocumentModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Upload className="h-4 w-4" />
                            Upload New
                        </button>
                    </div>

                    {user.documents && user.documents.length > 0 ? (
                        <div className="space-y-4">
                            {user.documents.map((doc) => (
                                <div key={doc.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">{doc.person_name}</h3>
                                        <button
                                            onClick={() => handleDeleteDocument(doc.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        {doc.passport && (
                                            <a
                                                href={`/storage/${doc.passport}`}
                                                target="_blank"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Passport
                                            </a>
                                        )}
                                        {doc.nid_or_other && (
                                            <a
                                                href={`/storage/${doc.nid_or_other}`}
                                                target="_blank"
                                                className="text-blue-600 hover:underline"
                                            >
                                                NID/Other
                                            </a>
                                        )}
                                        {doc.payslip && (
                                            <a
                                                href={`/storage/${doc.payslip}`}
                                                target="_blank"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Payslip
                                            </a>
                                        )}
                                        {doc.student_card && (
                                            <a
                                                href={`/storage/${doc.student_card}`}
                                                target="_blank"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Student Card
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No documents uploaded yet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Agreement Tab */}
            {activeTab === 'agreement' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Agreement Details
                    </h2>
                    <form onSubmit={handleAgreementSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Type</label>
                                <input
                                    type="text"
                                    value={agreementForm.data.agreement_type}
                                    onChange={(e) => agreementForm.setData('agreement_type', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                <input
                                    type="text"
                                    value={agreementForm.data.duration}
                                    onChange={(e) => agreementForm.setData('duration', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (£)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={agreementForm.data.amount}
                                    onChange={(e) => agreementForm.setData('amount', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Deposit (£)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={agreementForm.data.deposit}
                                    onChange={(e) => agreementForm.setData('deposit', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={agreementForm.processing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            Save Agreement
                        </button>
                    </form>
                </div>
            )}

            {/* Bank Details Tab */}
            {activeTab === 'bank' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Bank Details
                    </h2>
                    <form onSubmit={handleBankSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                                <input
                                    type="text"
                                    value={bankForm.data.name}
                                    onChange={(e) => bankForm.setData('name', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sort Code</label>
                                <input
                                    type="text"
                                    value={bankForm.data.sort_code}
                                    onChange={(e) => bankForm.setData('sort_code', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                                <input
                                    type="text"
                                    value={bankForm.data.account}
                                    onChange={(e) => bankForm.setData('account', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={bankForm.processing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            Save Bank Details
                        </button>
                    </form>
                </div>
            )}

            {/* User Details Tab (Admin/Partner only) */}
            {activeTab === 'user-details' && role !== 'User' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        User Details
                    </h2>
                    <form onSubmit={handleUserDetailSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={userDetailForm.data.phone}
                                    onChange={(e) => userDetailForm.setData('phone', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Stay Status</label>
                                <select
                                    value={userDetailForm.data.stay_status}
                                    onChange={(e) => userDetailForm.setData('stay_status', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="not_staying">Not Staying</option>
                                    <option value="staying">Staying</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Occupied Address</label>
                                <input
                                    type="text"
                                    value={userDetailForm.data.occupied_address}
                                    onChange={(e) => userDetailForm.setData('occupied_address', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {userDetailForm.data.stay_status === 'staying' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Package</label>
                                        <select
                                            value={userDetailForm.data.package_id}
                                            onChange={(e) => userDetailForm.setData('package_id', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Package</option>
                                            {packages.map((pkg) => (
                                                <option key={pkg.id} value={pkg.id}>
                                                    {pkg.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Booking Type</label>
                                        <input
                                            type="text"
                                            value={userDetailForm.data.booking_type}
                                            onChange={(e) => userDetailForm.setData('booking_type', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Entry Date</label>
                                        <input
                                            type="date"
                                            value={userDetailForm.data.entry_date}
                                            onChange={(e) => userDetailForm.setData('entry_date', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Package Price (£)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={userDetailForm.data.package_price}
                                            onChange={(e) => userDetailForm.setData('package_price', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Security Amount (£)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={userDetailForm.data.security_amount}
                                            onChange={(e) => userDetailForm.setData('security_amount', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={userDetailForm.processing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            Save User Details
                        </button>
                    </form>
                </div>
            )}

            {/* Document Upload Modal */}
            {showDocumentModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <h3 className="text-lg font-semibold text-white">Upload Document</h3>
                            <button onClick={() => setShowDocumentModal(false)} className="text-white hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleDocumentSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Person Name</label>
                                <input
                                    type="text"
                                    value={documentForm.data.person_name}
                                    onChange={(e) => documentForm.setData('person_name', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Passport</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => documentForm.setData('passport', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">NID/Other</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => documentForm.setData('nid_or_other', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payslip</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => documentForm.setData('payslip', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Card</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => documentForm.setData('student_card', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowDocumentModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={documentForm.processing}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
