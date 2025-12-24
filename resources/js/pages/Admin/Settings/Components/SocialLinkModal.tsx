import React, { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { X, Plus, Edit2, Trash2, Share2 } from 'lucide-react';

interface SocialLink {
    id: number;
    icon_class: string;
    link: string;
    footer_section_four_id: number;
    created_at: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    socialLinks: SocialLink[];
}

export default function SocialLinkModal({ isOpen, onClose, socialLinks }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [selectedLink, setSelectedLink] = useState<SocialLink | null>(null);
    const [formData, setFormData] = useState({ icon_class: '', link: '' });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleEdit = (link: SocialLink) => {
        setSelectedLink(link);
        setFormData({ icon_class: link.icon_class, link: link.link });
        setShowForm(true);
    };

    const handleNew = () => {
        setSelectedLink(null);
        setFormData({ icon_class: '', link: '' });
        setShowForm(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (selectedLink) {
            // Update existing
            router.patch(`/admin/settings/social-links/${selectedLink.id}`, formData, {
                onSuccess: () => {
                    setShowForm(false);
                    setSelectedLink(null);
                    setFormData({ icon_class: '', link: '' });
                },
                onError: (errors) => {
                    console.error('Update failed:', errors);
                    alert('Failed to update social link');
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            });
        } else {
            // Create new
            router.post('/admin/settings/social-links', formData, {
                onSuccess: () => {
                    setShowForm(false);
                    setFormData({ icon_class: '', link: '' });
                },
                onError: (errors) => {
                    console.error('Create failed:', errors);
                    alert('Failed to create social link');
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this social link?')) {
            router.delete(`/admin/settings/social-links/${id}`, {
                onError: (errors) => {
                    console.error('Delete failed:', errors);
                    alert('Failed to delete social link');
                },
            });
        }
    };

    // Common social media icon classes
    const commonIcons = [
        { name: 'Facebook', class: 'fab fa-facebook-f' },
        { name: 'Twitter', class: 'fab fa-twitter' },
        { name: 'Instagram', class: 'fab fa-instagram' },
        { name: 'LinkedIn', class: 'fab fa-linkedin-in' },
        { name: 'YouTube', class: 'fab fa-youtube' },
        { name: 'Pinterest', class: 'fab fa-pinterest' },
        { name: 'TikTok', class: 'fab fa-tiktok' },
        { name: 'WhatsApp', class: 'fab fa-whatsapp' },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center space-x-3">
                        <Share2 className="w-8 h-8 text-indigo-600" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Social Media Links</h2>
                            <p className="text-sm text-gray-600 mt-1">Manage social media links in footer</p>
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
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add New</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {socialLinks.length === 0 ? (
                                    <div className="col-span-2 text-center py-12 text-gray-500">
                                        <Share2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>No social links found. Click "Add New" to create one.</p>
                                    </div>
                                ) : (
                                    socialLinks.map((link) => (
                                        <div key={link.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                        <i className={`${link.icon_class} text-indigo-600`}></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 truncate">{link.icon_class}</p>
                                                        <a
                                                            href={link.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline truncate block"
                                                        >
                                                            {link.link}
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 ml-2">
                                                    <button
                                                        onClick={() => handleEdit(link)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(link.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Icon Class</label>
                                <input
                                    type="text"
                                    value={formData.icon_class}
                                    onChange={(e) => setFormData({ ...formData, icon_class: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., fab fa-facebook-f"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use Font Awesome icon classes (e.g., fab fa-facebook-f, fab fa-twitter)
                                </p>
                            </div>

                            {/* Quick select common icons */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {commonIcons.map((icon) => (
                                        <button
                                            key={icon.class}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon_class: icon.class })}
                                            className={`p-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-500 transition-colors ${
                                                formData.icon_class === icon.class ? 'bg-indigo-100 border-indigo-500' : 'border-gray-300'
                                            }`}
                                        >
                                            <i className={`${icon.class} text-xl`}></i>
                                            <p className="text-xs mt-1">{icon.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                                <input
                                    type="url"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://facebook.com/yourpage"
                                    required
                                />
                            </div>

                            {/* Preview */}
                            {formData.icon_class && formData.link && (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <i className={`${formData.icon_class} text-indigo-600`}></i>
                                        </div>
                                        <a
                                            href={formData.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline truncate"
                                        >
                                            {formData.link}
                                        </a>
                                    </div>
                                </div>
                            )}

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
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : selectedLink ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
