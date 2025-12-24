import React, { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface Header {
    id: number;
    logo: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    header: Header | null;
}

export default function HeaderModal({ isOpen, onClose, header }: Props) {
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        header?.logo ? `/storage/${header.logo}` : null
    );
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!logo) {
            alert('Please select a logo image');
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('logo', logo);

        router.patch('/admin/settings/header', formData, {
            forceFormData: true,
            onSuccess: () => {
                onClose();
                setLogo(null);
            },
            onError: (errors) => {
                console.error('Upload failed:', errors);
                alert('Failed to update header logo');
            },
            onFinish: () => {
                setUploading(false);
            },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Header Settings</h2>
                        <p className="text-sm text-gray-600 mt-1">Update your website logo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Current Logo */}
                    {logoPreview && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current/Preview Logo
                            </label>
                            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                                <img
                                    src={logoPreview}
                                    alt="Logo"
                                    className="max-h-32 max-w-full object-contain"
                                />
                            </div>
                        </div>
                    )}

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload New Logo
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {logoPreview ? (
                                        <Upload className="w-12 h-12 mb-4 text-indigo-500" />
                                    ) : (
                                        <ImageIcon className="w-12 h-12 mb-4 text-gray-400" />
                                    )}
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF, SVG or WebP (MAX. 2MB)</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !logo}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading...
                                </span>
                            ) : (
                                'Update Logo'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
