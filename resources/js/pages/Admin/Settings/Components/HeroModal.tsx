import React, { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface HeroSection {
    id: number;
    background_image: string | null;
    title_small: string | null;
    title_big: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    heroSection: HeroSection | null;
}

export default function HeroModal({ isOpen, onClose, heroSection }: Props) {
    const [formData, setFormData] = useState({
        title_small: heroSection?.title_small || '',
        title_big: heroSection?.title_big || '',
    });
    const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        heroSection?.background_image ? `/storage/${heroSection.background_image}` : null
    );
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBackgroundImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setUploading(true);

        const data = new FormData();
        data.append('title_small', formData.title_small);
        data.append('title_big', formData.title_big);
        if (backgroundImage) {
            data.append('background_image', backgroundImage);
        }

        router.patch('/admin/settings/hero', data, {
            forceFormData: true,
            onSuccess: () => {
                onClose();
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
                alert('Failed to update hero section');
            },
            onFinish: () => {
                setUploading(false);
            },
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Hero Section Settings</h2>
                        <p className="text-sm text-gray-600 mt-1">Configure your homepage hero section</p>
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
                    {/* Title Small */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Small Title
                        </label>
                        <input
                            type="text"
                            value={formData.title_small}
                            onChange={(e) => setFormData({ ...formData, title_small: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter small title"
                        />
                    </div>

                    {/* Title Big */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Big Title
                        </label>
                        <textarea
                            value={formData.title_big}
                            onChange={(e) => setFormData({ ...formData, title_big: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter big title"
                        />
                    </div>

                    {/* Current Background */}
                    {imagePreview && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current/Preview Background
                            </label>
                            <div className="relative h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                                <img
                                    src={imagePreview}
                                    alt="Hero Background"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Background Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload New Background Image
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-10 h-10 mb-3 text-purple-500" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF or WebP (MAX. 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
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
                            disabled={uploading}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating...
                                </span>
                            ) : (
                                'Update Hero Section'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
