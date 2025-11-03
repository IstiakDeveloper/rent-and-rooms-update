import React, { useState } from 'react';
import { FileText, Upload, Trash2, Eye, X, Plus, User } from 'lucide-react';
import { useForm } from '@inertiajs/react';

interface Document {
    id: number;
    person_name?: string;
    passport?: string;
    nid_or_other?: string;
    payslip?: string;
    student_card?: string;
    type?: string;
    file_path?: string;
    uploaded_at?: string;
}

interface Props {
    userId: number;
    documents?: Document[];
}

export default function DocumentSection({ userId, documents: initialDocuments = [] }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingDocId, setEditingDocId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        person_name: '',
        passport: null as File | null,
        nid_or_other: null as File | null,
        payslip: null as File | null,
        student_card: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('person_name', data.person_name);
        if (data.passport) formData.append('passport', data.passport);
        if (data.nid_or_other) formData.append('nid_or_other', data.nid_or_other);
        if (data.payslip) formData.append('payslip', data.payslip);
        if (data.student_card) formData.append('student_card', data.student_card);

        const url = editingDocId
            ? `/admin/users/${userId}/documents/${editingDocId}`
            : `/admin/users/${userId}/documents`;

        post(url, {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setShowForm(false);
                setEditingDocId(null);
            },
        });
    };

    const handleDelete = (docId: number) => {
        if (confirm('Are you sure you want to delete this document?')) {
            // Using Inertia router to delete
            window.location.href = `/admin/users/${userId}/documents/${docId}`;
        }
    };

    const handleEdit = (doc: Document) => {
        setData({
            person_name: doc.person_name,
            passport: null,
            nid_or_other: null,
            payslip: null,
            student_card: null,
        });
        setEditingDocId(doc.id);
        setShowForm(true);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200 border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">User Documents</h2>
                            <p className="text-sm text-gray-600 mt-1">Manage identity documents and proofs</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setShowForm(!showForm);
                            if (showForm) {
                                reset();
                                setEditingDocId(null);
                            }
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    >
                        {showForm ? (
                            <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Document
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="p-8">
                {/* Add/Edit Form */}
                {showForm && (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {editingDocId ? 'Edit Document' : 'Add New Document'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <User className="h-4 w-4 inline mr-2" />
                                    Person Name
                                </label>
                                <input
                                    type="text"
                                    value={data.person_name}
                                    onChange={(e) => setData('person_name', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                    placeholder="Enter person name"
                                    required
                                />
                                {errors.person_name && <span className="text-red-500 text-sm mt-1 block">{errors.person_name}</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Passport */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <FileText className="h-4 w-4 inline mr-2" />
                                        Passport
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setData('passport', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {errors.passport && <span className="text-red-500 text-sm mt-1 block">{errors.passport}</span>}
                                </div>

                                {/* NID/Other */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <FileText className="h-4 w-4 inline mr-2" />
                                        NID/Other ID
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setData('nid_or_other', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {errors.nid_or_other && <span className="text-red-500 text-sm mt-1 block">{errors.nid_or_other}</span>}
                                </div>

                                {/* Payslip */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <FileText className="h-4 w-4 inline mr-2" />
                                        Payslip
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setData('payslip', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {errors.payslip && <span className="text-red-500 text-sm mt-1 block">{errors.payslip}</span>}
                                </div>

                                {/* Student Card */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <FileText className="h-4 w-4 inline mr-2" />
                                        Student/Employee Card
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setData('student_card', e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {errors.student_card && <span className="text-red-500 text-sm mt-1 block">{errors.student_card}</span>}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        reset();
                                        setEditingDocId(null);
                                    }}
                                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <>
                                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                                                <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full"></div>
                                            </div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            {editingDocId ? 'Update Document' : 'Save Document'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Documents Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Person Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Passport</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NID/Other</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Payslip</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student Card</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {initialDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</p>
                                        <p className="text-gray-500">Click "Add Document" to upload identity documents</p>
                                    </td>
                                </tr>
                            ) : (
                                initialDocuments.map((doc, index) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors duration-200">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <User className="h-5 w-5 text-gray-400 mr-2" />
                                                <span className="text-sm font-medium text-gray-900">{doc.person_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {doc.passport ? (
                                                <a
                                                    href={`/storage/${doc.passport}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors duration-200"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {doc.nid_or_other ? (
                                                <a
                                                    href={`/storage/${doc.nid_or_other}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors duration-200"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {doc.payslip ? (
                                                <a
                                                    href={`/storage/${doc.payslip}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors duration-200"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {doc.student_card ? (
                                                <a
                                                    href={`/storage/${doc.student_card}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors duration-200"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(doc)}
                                                    className="inline-flex items-center p-2 border border-transparent rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                                    title="Edit Document"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="inline-flex items-center p-2 border border-transparent rounded-lg text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                                                    title="Delete Document"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
