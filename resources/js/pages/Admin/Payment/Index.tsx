import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { CreditCard, Eye, Calendar, User, Package, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
    id: number;
    amount: number;
    payment_method: string;
    status: string;
    payment_type: string;
    reference_number: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    booking: {
        id: number;
        package: {
            id: number;
            name: string;
        } | null;
    } | null;
}

interface Props {
    payments: {
        data: Payment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    userRole: {
        isPartner: boolean;
        isAdmin: boolean;
        isSuperAdmin: boolean;
    };
}

export default function Index({ payments, userRole = { isPartner: false, isAdmin: false, isSuperAdmin: false } }: Props) {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
            refunded: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Refunded' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title="Payments" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                    <p className="text-gray-600 mt-1">Manage all payment transactions</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Package</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {payments.data.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            #{payment.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.user && (
                                                <div>
                                                    <Link
                                                        href={`/admin/users/${payment.user.id}`}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        {payment.user.name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500">{payment.user.email}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.booking?.package && (
                                                <p className="text-sm text-gray-900">{payment.booking.package.name}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                            £{Number(payment.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {payment.payment_method}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Link
                                                href={`/admin/payments/${payment.id}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>

                                            {/* If payment has no user, show Edit (to add user) and Delete - only for Admin/Super Admin */}
                                            {!userRole.isPartner && !payment.user && (
                                                <>
                                                    <Link
                                                        href={`/admin/payments/${payment.id}/edit`}
                                                        className="text-green-600 hover:text-green-800"
                                                        title="Edit Payment"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!window.confirm('Delete this payment? This action cannot be undone.')) return;
                                                            router.delete(`/admin/payments/${payment.id}`);
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete Payment"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {payments.data.length === 0 && (
                        <div className="text-center py-12">
                            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                            <p className="text-gray-500">Payment records will appear here</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {payments.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing {((payments.current_page - 1) * payments.per_page) + 1} to{' '}
                            {Math.min(payments.current_page * payments.per_page, payments.total)} of{' '}
                            {payments.total} results
                        </p>
                        <div className="flex gap-2">
                            {Array.from({ length: payments.last_page }, (_, i) => i + 1).map((page) => (
                                <Link
                                    key={page}
                                    href={`/admin/payments?page=${page}`}
                                    className={`px-4 py-2 rounded-lg ${
                                        page === payments.current_page
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
