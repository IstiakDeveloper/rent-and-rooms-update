import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, Settings, Package, CheckCircle, X } from 'lucide-react';

interface JoinPackage {
    id: number;
    title: string;
    subtitle: string | null;
    description: string;
    whats_included: string[];
    ideal_for: string | null;
    price: string | null;
    price_note: string | null;
    display_order: number;
    is_active: boolean;
}

interface JoinWithUsHeader {
    id: number;
    main_title: string;
    subtitle: string;
    is_active: boolean;
}

interface Props {
    packages: JoinPackage[];
    header: JoinWithUsHeader | null;
}

export default function Index({ packages, header }: Props) {
    const [showHeaderModal, setShowHeaderModal] = useState(false);
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<JoinPackage | null>(null);
    const [headerForm, setHeaderForm] = useState({
        main_title: header?.main_title || 'Rent & Rooms Packages',
        subtitle: header?.subtitle || '',
        is_active: header?.is_active ?? true,
    });
    const [packageForm, setPackageForm] = useState({
        title: '',
        subtitle: '',
        description: '',
        whats_included: [''],
        ideal_for: '',
        price: '',
        price_note: '',
        display_order: packages.length + 1,
        is_active: true,
    });

    const resetPackageForm = () => {
        setPackageForm({
            title: '',
            subtitle: '',
            description: '',
            whats_included: [''],
            ideal_for: '',
            price: '',
            price_note: '',
            display_order: packages.length + 1,
            is_active: true,
        });
        setEditingPackage(null);
    };

    const openEditModal = (pkg: JoinPackage) => {
        setEditingPackage(pkg);
        setPackageForm({
            title: pkg.title,
            subtitle: pkg.subtitle || '',
            description: pkg.description,
            whats_included: pkg.whats_included,
            ideal_for: pkg.ideal_for || '',
            price: pkg.price || '',
            price_note: pkg.price_note || '',
            display_order: pkg.display_order,
            is_active: pkg.is_active,
        });
        setShowPackageModal(true);
    };

    const handleHeaderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.patch('/admin/join-packages/header/update', headerForm, {
            onSuccess: () => setShowHeaderModal(false),
        });
    };

    const handlePackageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPackage) {
            router.patch(`/admin/join-packages/${editingPackage.id}`, packageForm, {
                onSuccess: () => {
                    setShowPackageModal(false);
                    resetPackageForm();
                },
            });
        } else {
            router.post('/admin/join-packages', packageForm, {
                onSuccess: () => {
                    setShowPackageModal(false);
                    resetPackageForm();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this package?')) {
            router.delete(`/admin/join-packages/${id}`);
        }
    };

    const addIncludedItem = () => {
        setPackageForm({
            ...packageForm,
            whats_included: [...packageForm.whats_included, ''],
        });
    };

    const updateIncludedItem = (index: number, value: string) => {
        const updated = [...packageForm.whats_included];
        updated[index] = value;
        setPackageForm({ ...packageForm, whats_included: updated });
    };

    const removeIncludedItem = (index: number) => {
        setPackageForm({
            ...packageForm,
            whats_included: packageForm.whats_included.filter((_, i) => i !== index),
        });
    };

    const movePackage = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= packages.length) return;

        const reordered = [...packages];
        [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

        const updates = reordered.map((pkg, idx) => ({
            id: pkg.id,
            display_order: idx + 1,
        }));

        router.post('/admin/join-packages/update-order', { packages: updates });
    };

    return (
        <AdminLayout>
            <Head title="Join Packages Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl shadow-lg mb-8">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                                        <Settings className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900">Page Header</h2>
                                </div>
                                <button
                                    onClick={() => setShowHeaderModal(true)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <Pencil className="w-5 h-5" />
                                    Edit Header
                                </button>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                    {header?.main_title || 'Rent & Rooms Packages'}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">{header?.subtitle}</p>
                            </div>
                        </div>
                    </div>

                    {/* Packages List */}
                    <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-lg">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900">Packages</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        resetPackageForm();
                                        setShowPackageModal(true);
                                    }}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Package
                                </button>
                            </div>

                            <div className="space-y-4">
                                {packages.map((pkg, index) => (
                                    <div key={pkg.id} className="border-2 border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 bg-gradient-to-r from-white to-slate-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold shadow-lg">
                                                        {index + 1}
                                                    </span>
                                                    <h3 className="text-xl font-bold text-slate-900">{pkg.title}</h3>
                                                    {!pkg.is_active && (
                                                        <span className="px-3 py-1 text-xs font-semibold bg-slate-200 text-slate-600 rounded-full">
                                                            Inactive
                                                        </span>
                                                    )}
                                                    {pkg.is_active && (
                                                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                {pkg.subtitle && (
                                                    <p className="text-sm text-slate-600 mb-2 ml-13">{pkg.subtitle}</p>
                                                )}
                                                {pkg.price && (
                                                    <p className="text-base font-bold text-indigo-600 ml-13">{pkg.price}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => movePackage(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Move up"
                                                >
                                                    <ArrowUp className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => movePackage(index, 'down')}
                                                    disabled={index === packages.length - 1}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Move down"
                                                >
                                                    <ArrowDown className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(pkg)}
                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit package"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pkg.id)}
                                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete package"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header Modal */}
            {showHeaderModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                    <Settings className="w-7 h-7" />
                                    Edit Page Header
                                </h3>
                                <button
                                    onClick={() => setShowHeaderModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleHeaderSubmit} className="p-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Main Title
                                    </label>
                                    <input
                                        type="text"
                                        value={headerForm.main_title}
                                        onChange={(e) =>
                                            setHeaderForm({ ...headerForm, main_title: e.target.value })
                                        }
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Subtitle
                                    </label>
                                    <textarea
                                        value={headerForm.subtitle}
                                        onChange={(e) =>
                                            setHeaderForm({ ...headerForm, subtitle: e.target.value })
                                        }
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                    <input
                                        type="checkbox"
                                        checked={headerForm.is_active}
                                        onChange={(e) =>
                                            setHeaderForm({ ...headerForm, is_active: e.target.checked })
                                        }
                                        className="w-5 h-5 text-indigo-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <label className="text-sm font-semibold text-slate-700">Active</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t-2 border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowHeaderModal(false)}
                                    className="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Package Modal */}
            {showPackageModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                    <Package className="w-7 h-7" />
                                    {editingPackage ? 'Edit Package' : 'Add New Package'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowPackageModal(false);
                                        resetPackageForm();
                                    }}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handlePackageSubmit} className="p-8">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={packageForm.title}
                                            onChange={(e) =>
                                                setPackageForm({ ...packageForm, title: e.target.value })
                                            }
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Subtitle
                                        </label>
                                        <input
                                            type="text"
                                            value={packageForm.subtitle}
                                            onChange={(e) =>
                                                setPackageForm({ ...packageForm, subtitle: e.target.value })
                                            }
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        value={packageForm.description}
                                        onChange={(e) =>
                                            setPackageForm({ ...packageForm, description: e.target.value })
                                        }
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                                        What's Included *
                                    </label>
                                    {packageForm.whats_included.map((item, index) => (
                                        <div key={index} className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => updateIncludedItem(index, e.target.value)}
                                                className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                                placeholder="Feature or benefit"
                                                required
                                            />
                                            {packageForm.whats_included.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeIncludedItem(index)}
                                                    className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all flex items-center gap-2 font-semibold"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addIncludedItem}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Item
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Ideal For
                                    </label>
                                    <textarea
                                        value={packageForm.ideal_for}
                                        onChange={(e) =>
                                            setPackageForm({ ...packageForm, ideal_for: e.target.value })
                                        }
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        rows={2}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Price
                                        </label>
                                        <input
                                            type="text"
                                            value={packageForm.price}
                                            onChange={(e) =>
                                                setPackageForm({ ...packageForm, price: e.target.value })
                                            }
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            placeholder="e.g., £40/month or £400/year"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Price Note
                                        </label>
                                        <input
                                            type="text"
                                            value={packageForm.price_note}
                                            onChange={(e) =>
                                                setPackageForm({ ...packageForm, price_note: e.target.value })
                                            }
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            placeholder="e.g., *"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                                    <input
                                        type="checkbox"
                                        checked={packageForm.is_active}
                                        onChange={(e) =>
                                            setPackageForm({ ...packageForm, is_active: e.target.checked })
                                        }
                                        className="w-5 h-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <label className="text-sm font-semibold text-slate-700">Active</label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t-2 border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPackageModal(false);
                                        resetPackageForm();
                                    }}
                                    className="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {editingPackage ? 'Update Package' : 'Create Package'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
