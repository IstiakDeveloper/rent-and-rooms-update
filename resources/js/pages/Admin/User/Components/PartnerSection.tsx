import React, { useState } from 'react';
import { Building2, CreditCard, FileText, Upload, Eye, X, Save } from 'lucide-react';
import { useForm, router } from '@inertiajs/react';

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

interface BankDetails {
    name?: string;
    sort_code?: string;
    account?: string;
    account_name?: string;
    account_number?: string;
    bank_name?: string;
}

interface AgreementDetails {
    agreement_type?: string;
    duration?: string;
    amount?: number;
    deposit?: number;
    start_date?: string;
    end_date?: string;
    monthly_rent?: number;
}

interface Props {
    userId: number;
    packages?: Package[];
    bankDetails?: BankDetails;
    agreementDetails?: AgreementDetails;
}

export default function PartnerSection({ userId, packages = [], bankDetails, agreementDetails }: Props) {
    const [activeTab, setActiveTab] = useState<'packages' | 'details'>('packages');

    const bankForm = useForm({
        name: bankDetails?.name || '',
        sort_code: bankDetails?.sort_code || '',
        account: bankDetails?.account || '',
    });

    const agreementForm = useForm({
        agreement_type: agreementDetails?.agreement_type || '',
        duration: agreementDetails?.duration || '',
        amount: agreementDetails?.amount || 0,
        deposit: agreementDetails?.deposit || 0,
    });

    const handleBankSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bankForm.patch(`/admin/users/${userId}/bank-details`, {
            onSuccess: () => {
                alert('Bank details updated successfully');
            },
        });
    };

    const handleAgreementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        agreementForm.patch(`/admin/users/${userId}/agreement-details`, {
            onSuccess: () => {
                alert('Agreement details updated successfully');
            },
        });
    };

    const handlePackageDocumentUpload = (packageId: number, type: string, file: File) => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('file', file);
        formData.append('_method', 'POST');

        router.post(`/admin/users/${userId}/packages/${packageId}/documents`, formData, {
            forceFormData: true,
            onSuccess: () => {
                alert('Document uploaded successfully');
            },
        });
    };

    const documentTypes = [
        { type: 'gas_certificate', label: 'Gas Certificate', icon: 'file-contract' },
        { type: 'electric_certificate', label: 'Electric Certificate', icon: 'bolt' },
        { type: 'landlord_certificate', label: 'Landlord Certificate', icon: 'home' },
        { type: 'building_insurance', label: 'Building Insurance', icon: 'shield-alt' },
        { type: 'pat_certificate', label: 'PAT Certificate', icon: 'plug' },
        { type: 'epc_certificate', label: 'EPC Certificate', icon: 'certificate' },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200 border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Partner Information</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage partner-specific details and documents</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex space-x-8 px-8">
                    <button
                        onClick={() => setActiveTab('packages')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'packages'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Package Documents
                    </button>
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'details'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <CreditCard className="h-4 w-4 inline mr-2" />
                        Partner Details
                    </button>
                </div>
            </div>

            <div className="p-8">
                {/* Package Documents Tab */}
                {activeTab === 'packages' && (
                    <div className="space-y-6">
                        {packages.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Packages Found</h3>
                                <p className="text-gray-500">This partner doesn't have any packages assigned yet.</p>
                            </div>
                        ) : (
                            packages.map((pkg) => (
                                <div key={pkg.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{pkg.name || pkg.title}</h3>
                                            <p className="text-sm text-gray-500">Package ID: {pkg.id}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {documentTypes.map((docType) => {
                                            const existingDoc = pkg.documents?.find(d => d.type === docType.type);

                                            return (
                                                <div key={docType.type} className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className="text-sm font-semibold text-gray-700">
                                                            <FileText className="h-4 w-4 inline mr-1" />
                                                            {docType.label}
                                                        </label>
                                                        {existingDoc && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Uploaded
                                                            </span>
                                                        )}
                                                    </div>

                                                    <input
                                                        type="file"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handlePackageDocumentUpload(pkg.id, docType.type, file);
                                                            }
                                                        }}
                                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all duration-200"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />

                                                    {existingDoc && (
                                                        <div className="mt-3 space-y-2">
                                                            <a
                                                                href={`/storage/${existingDoc.path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center w-full justify-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors duration-200"
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View Document
                                                            </a>
                                                            {existingDoc.expires_at && (
                                                                <p className="text-xs text-gray-500 text-center">
                                                                    Expires: {new Date(existingDoc.expires_at).toLocaleDateString('en-GB')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Partner Details Tab */}
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bank Details */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                                Bank Details
                            </h3>
                            <form onSubmit={handleBankSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Account Holder Name
                                    </label>
                                    <input
                                        type="text"
                                        value={bankForm.data.name}
                                        onChange={(e) => bankForm.setData('name', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="Enter account holder name"
                                    />
                                    {bankForm.errors.name && <span className="text-red-500 text-sm mt-1 block">{bankForm.errors.name}</span>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Sort Code
                                    </label>
                                    <input
                                        type="text"
                                        value={bankForm.data.sort_code}
                                        onChange={(e) => bankForm.setData('sort_code', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="XX-XX-XX"
                                    />
                                    {bankForm.errors.sort_code && <span className="text-red-500 text-sm mt-1 block">{bankForm.errors.sort_code}</span>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        value={bankForm.data.account}
                                        onChange={(e) => bankForm.setData('account', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="Enter account number"
                                    />
                                    {bankForm.errors.account && <span className="text-red-500 text-sm mt-1 block">{bankForm.errors.account}</span>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={bankForm.processing}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {bankForm.processing ? (
                                        <>
                                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                                                <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full"></div>
                                            </div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Update Bank Details
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Agreement Details */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                                Agreement Details
                            </h3>
                            <form onSubmit={handleAgreementSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Agreement Type
                                    </label>
                                    <input
                                        type="text"
                                        value={agreementForm.data.agreement_type}
                                        onChange={(e) => agreementForm.setData('agreement_type', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="e.g., Fixed Term, Month-to-Month"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Duration
                                    </label>
                                    <input
                                        type="text"
                                        value={agreementForm.data.duration}
                                        onChange={(e) => agreementForm.setData('duration', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="e.g., 12 months"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Amount
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-gray-500">£</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={agreementForm.data.amount}
                                                onChange={(e) => agreementForm.setData('amount', parseFloat(e.target.value))}
                                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Deposit
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-gray-500">£</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={agreementForm.data.deposit}
                                                onChange={(e) => agreementForm.setData('deposit', parseFloat(e.target.value))}
                                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={agreementForm.processing}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {agreementForm.processing ? (
                                        <>
                                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                                                <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full"></div>
                                            </div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Update Agreement
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
