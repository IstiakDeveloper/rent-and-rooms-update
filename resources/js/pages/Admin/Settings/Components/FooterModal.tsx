import React, { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { X, Upload } from 'lucide-react';

interface Footer {
    id: number;
    footer_logo: string | null;
    address: string | null;
    email: string | null;
    contact_number: string | null;
    website: string | null;
    terms_title: string | null;
    terms_link: string | null;
    privacy_title: string | null;
    privacy_link: string | null;
    rights_reserves_text: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    footer: Footer | null;
}

export default function FooterModal({ isOpen, onClose, footer }: Props) {
    const [formData, setFormData] = useState({
        address: footer?.address || '',
        email: footer?.email || '',
        contact_number: footer?.contact_number || '',
        website: footer?.website || '',
        terms_title: footer?.terms_title || '',
        terms_link: footer?.terms_link || '',
        privacy_title: footer?.privacy_title || '',
        privacy_link: footer?.privacy_link || '',
        rights_reserves_text: footer?.rights_reserves_text || '',
    });
    const [footerLogo, setFooterLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        footer?.footer_logo ? `/storage/${footer.footer_logo}` : null
    );
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFooterLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setUploading(true);

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });
        if (footerLogo) {
            data.append('footer_logo', footerLogo);
        }

        router.patch('/admin/settings/footer', data, {
            forceFormData: true,
            onSuccess: () => {
                onClose();
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
                alert('Failed to update footer');
            },
            onFinish: () => {
                setUploading(false);
            },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Footer Settings</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage footer content and contact information</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Logo */}
                    {logoPreview && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Footer Logo</label>
                            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                                <img src={logoPreview} alt="Footer Logo" className="max-h-24 max-w-full object-contain" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Footer Logo</label>
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="w-full" />
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="Enter address"
                            />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                                <input
                                    type="text"
                                    value={formData.contact_number}
                                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="+44 123 456 7890"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="https://example.com"
                        />
                    </div>

                    {/* Links Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Terms Title</label>
                            <input
                                type="text"
                                value={formData.terms_title}
                                onChange={(e) => setFormData({ ...formData, terms_title: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="Terms & Conditions"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Terms Link</label>
                            <input
                                type="text"
                                value={formData.terms_link}
                                onChange={(e) => setFormData({ ...formData, terms_link: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="/terms"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Title</label>
                            <input
                                type="text"
                                value={formData.privacy_title}
                                onChange={(e) => setFormData({ ...formData, privacy_title: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="Privacy Policy"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Link</label>
                            <input
                                type="text"
                                value={formData.privacy_link}
                                onChange={(e) => setFormData({ ...formData, privacy_link: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="/privacy"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rights Reserve Text</label>
                        <input
                            type="text"
                            value={formData.rights_reserves_text}
                            onChange={(e) => setFormData({ ...formData, rights_reserves_text: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="© 2025 All rights reserved"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-medium disabled:opacity-50"
                        >
                            {uploading ? 'Updating...' : 'Update Footer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
