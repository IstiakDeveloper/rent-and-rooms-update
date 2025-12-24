import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';

interface Props {
    payment: any;
    users: Array<{ id: number; name: string; email: string }>;
}

export default function Edit({ payment, users }: Props) {
    const form = useForm({ user_id: payment.user ? payment.user.id : '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.patch(`/admin/payments/${payment.id}`);
    }

    return (
        <AdminLayout>
            <Head title={`Edit Payment #${payment.id}`} />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Edit Payment #{payment.id}</h1>
                    <Link href={`/admin/payments/${payment.id}`} className="text-blue-600">Back</Link>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-lg">
                    <form onSubmit={submit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign User</label>
                            <select
                                value={form.data.user_id}
                                onChange={(e) => form.setData('user_id', e.target.value || '')}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="">-- Select user (optional) --</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                                ))}
                            </select>
                            {form.errors.user_id && <div className="text-red-600 text-sm mt-1">{form.errors.user_id}</div>}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Link href={`/admin/payments`} className="px-4 py-2 border rounded">Cancel</Link>
                            <button type="submit" disabled={form.processing} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
