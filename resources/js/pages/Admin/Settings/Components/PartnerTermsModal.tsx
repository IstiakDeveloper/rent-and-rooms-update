import React, { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { X, Plus, Edit2, Trash2, FileText, Briefcase } from 'lucide-react';

interface PartnerTermsCondition {
    id: number;
    title: string;
    content: string;
    created_at: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    partnerTermsConditions: PartnerTermsCondition[];
}

export default function PartnerTermsModal({ isOpen, onClose, partnerTermsConditions }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [selectedTerms, setSelectedTerms] = useState<PartnerTermsCondition | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleEdit = (terms: PartnerTermsCondition) => {
        setSelectedTerms(terms);
        setFormData({ title: terms.title, content: terms.content });
        setShowForm(true);
    };

    const handleNew = () => {
        setSelectedTerms(null);
        setFormData({ title: '', content: '' });
        setShowForm(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const data = {
            ...formData,
            id: selectedTerms?.id,
        };

        router.patch('/admin/settings/partner-terms-conditions', data, {
            onSuccess: () => {
                setShowForm(false);
                setSelectedTerms(null);
                setFormData({ title: '', content: '' });
            },
            onError: (errors) => {
                console.error('Save failed:', errors);
                alert('Failed to save partner terms & conditions');
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this partner terms & conditions?')) {
            router.delete(`/admin/settings/partner-terms-conditions/${id}`, {
                onError: (errors) => {
                    console.error('Delete failed:', errors);
                    alert('Failed to delete partner terms & conditions');
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-center space-x-3">
                        <Briefcase className="w-8 h-8 text-orange-600" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Partner Terms & Conditions</h2>
                            <p className="text-sm text-gray-600 mt-1">Manage partner-specific terms and conditions</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <div className="p-6">
                    {!showForm ? (
                        <>
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={handleNew}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-300"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add New</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {partnerTermsConditions.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>No partner terms & conditions found. Click "Add New" to create one.</p>
                                    </div>
                                ) : (
                                    partnerTermsConditions.map((terms) => (
                                        <div key={terms.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg text-gray-900">{terms.title}</h3>
                                                    <p className="text-gray-600 mt-2 line-clamp-2">{terms.content}</p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        Created: {new Date(terms.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button
                                                        onClick={() => handleEdit(terms)}
                                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(terms.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder="Enter partner terms & conditions title"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={10}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    placeholder="Enter partner terms & conditions content"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-300 font-medium disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : selectedTerms ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
