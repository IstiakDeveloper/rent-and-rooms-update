import React, { useState } from 'react';
import { Building2, CreditCard, FileText, Save, Plus, Edit2, Download, Trash2, Calendar, AlertCircle, X, Eye, Upload } from 'lucide-react';
import { useForm, router } from '@inertiajs/react';
import { format } from 'date-fns';

// Partner Personal Documents Component
function PartnerPersonalDocuments({ partnerDocuments }: { partnerDocuments?: PartnerDocument | null }) {
    const documentFields = [
        { key: 'photo_id', label: 'Photo ID' },
        { key: 'authorised_letter', label: 'Authorised Letter' },
        { key: 'management_agreement', label: 'Management Agreement' },
        { key: 'management_maintain_agreement', label: 'Management & Maintain Agreement' },
        { key: 'franchise_agreement', label: 'Franchise Agreement' },
        { key: 'investor_agreement', label: 'Investor Agreement' },
    ];

    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const handleUpload = (field: string, file: File, expiryDate: string) => {
        const formData = new FormData();
        formData.append(field, file);
        formData.append(`${field}_expiry`, expiryDate);

        router.post(`/profile/partner-documents`, formData, {
            onSuccess: () => {
                setUploadingField(null);
            },
        });
    };

    const handleDelete = (field: string) => {
        if (confirm('Are you sure you want to delete this document?')) {
            router.delete(`/profile/partner-documents/${field}`);
        }
    };

    const handleDownload = (field: string) => {
        window.location.href = `/profile/partner-documents/${field}/download`;
    };

    const getStatusBadge = (expiryDate: string | null | undefined) => {
        if (!expiryDate) return null;

        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
        } else if (daysUntilExpiry <= 30) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Expiring Soon</span>;
        } else {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Partner Personal Documents</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Upload identification, agreements, and other partner-specific documents
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documentFields.map(({ key, label }) => {
                    const hasDocument = partnerDocuments && (partnerDocuments as any)[key];
                    const expiryDate = partnerDocuments && (partnerDocuments as any)[`${key}_expiry`];
                    const isUploading = uploadingField === key;

                    return (
                        <div key={key} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
                                    {hasDocument && expiryDate && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm text-gray-600">
                                                Expires: {format(new Date(expiryDate), 'MMM dd, yyyy')}
                                            </span>
                                            {getStatusBadge(expiryDate)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!hasDocument || isUploading ? (
                                <div className="space-y-3">
                                    <DocumentUploadForm
                                        onUpload={(file, expiry) => handleUpload(key, file, expiry)}
                                        onCancel={() => setUploadingField(null)}
                                        isVisible={!hasDocument || isUploading}
                                    />
                                    {!isUploading && (
                                        <button
                                            onClick={() => setUploadingField(key)}
                                            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600"
                                        >
                                            <Upload className="h-5 w-5" />
                                            <span className="font-medium">Upload {label}</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDownload(key)}
                                        className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className="text-sm font-medium">Download</span>
                                    </button>
                                    <button
                                        onClick={() => setUploadingField(key)}
                                        className="flex-1 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Replace</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(key)}
                                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Document Upload Form Component
function DocumentUploadForm({ onUpload, onCancel, isVisible }: {
    onUpload: (file: File, expiryDate: string) => void,
    onCancel: () => void,
    isVisible: boolean
}) {
    const [file, setFile] = useState<File | null>(null);
    const [expiryDate, setExpiryDate] = useState('');

    if (!isVisible) return null;

    return (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select File *
                    </label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date (optional)
                    </label>
                    <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => file && onUpload(file, expiryDate)}
                        disabled={!file}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Upload
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}


interface Package {
    id: number;
    name: string;
    address?: string;
    title?: string;
    status?: string;
}

interface BankDetails {
    name?: string;
    sort_code?: string;
    account?: string;
}

interface AgreementDetails {
    agreement_type?: string;
    duration?: string;
    amount?: number;
    deposit?: number;
}

interface PartnerDocumentItem {
    id: number;
    package_id: number;
    document_type: 'partner' | 'package';
    document_name: string;
    file_path: string | null;
    expiry_date: string | null;
    status: 'active' | 'expired' | 'pending';
    notes: string | null;
    created_at: string;
    updated_at: string;
    file_url: string | null;
}

interface PartnerDocument {
    id: number;
    user_id: number;
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

interface Props {
    packages?: Package[];
    bankDetails?: BankDetails;
    agreementDetails?: AgreementDetails;
    partnerDocuments?: PartnerDocument | null;
    partnerDocumentItems?: PartnerDocumentItem[];
}

export default function PartnerDocuments({
    packages = [],
    bankDetails,
    agreementDetails,
    partnerDocuments,
    partnerDocumentItems = []
}: Props) {
    const [activeTab, setActiveTab] = useState<'partner-docs' | 'package-docs' | 'details'>('partner-docs');
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [editingDoc, setEditingDoc] = useState<PartnerDocumentItem | null>(null);
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

    const [docFormData, setDocFormData] = useState({
        package_id: null as number | null,
        document_type: 'package' as 'partner' | 'package',
        document_name: '',
        file: null as File | null,
        expiry_date: '',
        notes: ''
    });

    // Filter documents by type and group by package
    const partnerDocs = partnerDocumentItems.filter(doc => doc.document_type === 'partner');
    const packageDocs = partnerDocumentItems.filter(doc => doc.document_type === 'package');

    // Group package documents by package_id
    const documentsByPackage = packageDocs.reduce((acc, doc) => {
        const pkgId = doc.package_id;
        if (!acc[pkgId]) {
            acc[pkgId] = [];
        }
        acc[pkgId].push(doc);
        return acc;
    }, {} as Record<number, PartnerDocumentItem[]>);

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

    // Document handlers
    const handleAddDocument = () => {
        if (!docFormData.package_id) {
            alert('Please select a package');
            return;
        }

        const form = new FormData();
        form.append('package_id', docFormData.package_id.toString());
        form.append('document_type', docFormData.document_type);
        form.append('document_name', docFormData.document_name);
        if (docFormData.file) {
            form.append('file', docFormData.file);
        }
        if (docFormData.expiry_date) {
            form.append('expiry_date', docFormData.expiry_date);
        }
        if (docFormData.notes) {
            form.append('notes', docFormData.notes);
        }

        router.post(`/profile/package-documents`, form, {
            onSuccess: () => {
                setIsAddingDoc(false);
                resetDocForm();
            },
        });
    };

    const handleUpdateDocument = (docId: number) => {
        const form = new FormData();
        form.append('_method', 'PUT');
        form.append('document_name', docFormData.document_name);
        if (docFormData.file) {
            form.append('file', docFormData.file);
        }
        if (docFormData.expiry_date) {
            form.append('expiry_date', docFormData.expiry_date);
        }
        if (docFormData.notes) {
            form.append('notes', docFormData.notes);
        }

        router.post(`/profile/package-documents/${docId}`, form, {
            onSuccess: () => {
                setEditingDoc(null);
                resetDocForm();
            },
        });
    };

    const handleDeleteDocument = (docId: number) => {
        if (confirm('Are you sure you want to delete this document?')) {
            router.delete(`/profile/package-documents/${docId}`);
        }
    };

    const handleDownloadDocument = (docId: number) => {
        window.location.href = `/profile/package-documents/${docId}/download`;
    };

    const resetDocForm = () => {
        setDocFormData({
            package_id: selectedPackageId,
            document_type: activeTab === 'partner-docs' ? 'partner' : 'package',
            document_name: '',
            file: null,
            expiry_date: '',
            notes: ''
        });
    };

    const startEdit = (doc: PartnerDocumentItem) => {
        setEditingDoc(doc);
        setDocFormData({
            package_id: doc.package_id,
            document_type: doc.document_type,
            document_name: doc.document_name,
            file: null,
            expiry_date: doc.expiry_date || '',
            notes: doc.notes || ''
        });
    };

    const getStatusBadge = (doc: PartnerDocumentItem) => {
        if (!doc.expiry_date) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No Expiry</span>;
        }

        const expiryDate = new Date(doc.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>;
        } else if (daysUntilExpiry <= 30) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Expiring Soon</span>;
        } else {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
        }
    };

    const handleBankSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bankForm.post(`/profile/bank`);
    };

    const handleAgreementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        agreementForm.post(`/profile/agreement`);
    };

    const currentDocs = activeTab === 'partner-docs' ? partnerDocs : packageDocs;
    const currentDocType = activeTab === 'partner-docs' ? 'partner' : 'package';

    return (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200 border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
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
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex space-x-8 px-8">
                    <button
                        onClick={() => {
                            setActiveTab('package-docs');
                            setDocFormData({ ...docFormData, document_type: 'package' });
                        }}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'package-docs'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Package Documents ({packageDocs.length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('partner-docs');
                            setDocFormData({ ...docFormData, document_type: 'partner' });
                        }}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                            activeTab === 'partner-docs'
                                ? 'border-purple-600 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FileText className="h-4 w-4 inline mr-2" />
                        Partner Documents ({partnerDocs.length})
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
                {/* Partner Personal Documents Tab */}
                {activeTab === 'partner-docs' && (
                    <PartnerPersonalDocuments
                        partnerDocuments={partnerDocuments}
                    />
                )}                {/* Package Documents Tab */}
                {activeTab === 'package-docs' && (
                    <div className="space-y-6">
                        {/* Package Selection */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Package</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {packages.map((pkg) => {
                                    const packageDocCount = documentsByPackage[pkg.id]?.length || 0;
                                    const isSelected = selectedPackageId === pkg.id;

                                    return (
                                        <button
                                            key={pkg.id}
                                            onClick={() => setSelectedPackageId(pkg.id)}
                                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                                                isSelected
                                                    ? 'border-purple-600 bg-purple-50 shadow-md'
                                                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{pkg.address}</p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">{packageDocCount} documents</span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="ml-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Documents for Selected Package */}
                        {selectedPackageId ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {packages.find(p => p.id === selectedPackageId)?.name} - Documents
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Add property licenses, certificates, and other documents for this package
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsAddingDoc(true);
                                            setDocFormData({ ...docFormData, package_id: selectedPackageId, document_type: 'package' });
                                        }}
                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Document
                                    </button>
                                </div>

                        {/* Add/Edit Form */}
                        {(isAddingDoc || editingDoc) && (
                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900">
                                        {editingDoc ? 'Edit Document' : 'Add New Document'}
                                    </h4>
                                    <button
                                        onClick={() => {
                                            setIsAddingDoc(false);
                                            setEditingDoc(null);
                                            resetDocForm();
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Document Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={docFormData.document_name}
                                            onChange={(e) => setDocFormData({ ...docFormData, document_name: e.target.value })}
                                            placeholder="e.g., HMO Licence, Gas Certificate"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {editingDoc ? 'Replace File (optional)' : 'Upload File *'}
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setDocFormData({ ...docFormData, file: e.target.files?.[0] || null })}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Expiry Date (optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={docFormData.expiry_date}
                                            onChange={(e) => setDocFormData({ ...docFormData, expiry_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Notes (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={docFormData.notes}
                                            onChange={(e) => setDocFormData({ ...docFormData, notes: e.target.value })}
                                            placeholder="Additional notes"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => editingDoc ? handleUpdateDocument(editingDoc.id) : handleAddDocument()}
                                        disabled={!docFormData.document_name || (!editingDoc && !docFormData.file)}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {editingDoc ? 'Update Document' : 'Add Document'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAddingDoc(false);
                                            setEditingDoc(null);
                                            resetDocForm();
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Document List */}
                        {!documentsByPackage[selectedPackageId] || documentsByPackage[selectedPackageId].length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 font-medium">No documents added for this package yet</p>
                                <p className="text-sm text-gray-500 mt-2">Click "Add Document" to upload your first document</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {documentsByPackage[selectedPackageId].map((doc) => (
                                    <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-lg text-gray-900">{doc.document_name}</h4>
                                                    {getStatusBadge(doc)}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                                    {doc.expiry_date && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            <span>Expires: {format(new Date(doc.expiry_date), 'MMM dd, yyyy')}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span>Added: {format(new Date(doc.created_at), 'MMM dd, yyyy')}</span>
                                                    </div>
                                                </div>

                                                {doc.notes && (
                                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm flex items-start gap-2">
                                                        <AlertCircle className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                                        <span className="text-gray-700">{doc.notes}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleDownloadDocument(doc.id)}
                                                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => startEdit(doc)}
                                                    className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-600 font-medium">Please select a package</p>
                                <p className="text-sm text-gray-500 mt-2">Select a package above to view and manage its documents</p>
                            </div>
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter account holder name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Sort Code
                                    </label>
                                    <input
                                        type="text"
                                        value={bankForm.data.sort_code}
                                        onChange={(e) => bankForm.setData('sort_code', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="XX-XX-XX"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Account Number
                                    </label>
                                    <input
                                        type="text"
                                        value={bankForm.data.account}
                                        onChange={(e) => bankForm.setData('account', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="Enter account number"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={bankForm.processing}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Update Bank Details
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={agreementForm.processing}
                                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Update Agreement
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
