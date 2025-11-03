import React, { useState } from 'react';
import { X, Link2, Copy, Loader2, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface Milestone {
    id: number;
    description: string;
    amount: number;
    due_date: string;
    status: string;
    is_booking_fee: boolean;
    payment_link?: string;
    last_updated?: string;
}

interface Props {
    isOpen: boolean;
    userId: number;
    bookingId: number;
    onClose: () => void;
}

export default function MilestoneModal({ isOpen, userId, bookingId, onClose }: Props) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState<number | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            fetchMilestones();
        }
    }, [isOpen, bookingId]);

    const fetchMilestones = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/admin/users/${userId}/booking/${bookingId}/milestones`);
            setMilestones(response.data.milestones || response.data);
        } catch (error) {
            console.error('Failed to load milestones', error);
            alert('Failed to load milestones. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generatePaymentLink = async (milestone: Milestone) => {
        setGenerating(milestone.id);
        try {
            const response = await axios.post(
                `/admin/users/${userId}/booking-payments/${milestone.id}/payment-link`
            );

            // Update milestone with new payment link
            setMilestones(prev =>
                prev.map(m =>
                    m.id === milestone.id
                        ? { ...m, payment_link: response.data.payment_link, last_updated: new Date().toLocaleString() }
                        : m
                )
            );

            alert(response.data.message || 'Payment link generated successfully');
        } catch (error: any) {
            console.error('Failed to generate payment link', error);
            alert(error.response?.data?.message || 'Failed to generate payment link');
        } finally {
            setGenerating(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Payment link copied to clipboard!');
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactElement }> = {
            pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3" /> },
            paid: { color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="h-3 w-3" /> },
            overdue: { color: 'bg-red-100 text-red-800 border-red-200', icon: <AlertTriangle className="h-3 w-3" /> },
        };

        const config = statusConfig[status.toLowerCase()] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                {config.icon}
                <span>{status}</span>
            </span>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl transform transition-all">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Link2 className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Milestone Payment Links</h3>
                                <p className="text-sm text-gray-600 mt-1">Generate and manage payment links for booking milestones</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-16">
                            <Loader2 className="h-12 w-12 text-indigo-600 mx-auto animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Loading milestones...</p>
                            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the milestone data</p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl p-1">
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg shadow-sm overflow-hidden">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>Milestone</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                <div className="flex items-center space-x-2">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>Amount</span>
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Due Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Payment Link</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {milestones.map((milestone) => (
                                            <tr key={milestone.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {milestone.description}
                                                    </div>
                                                    {milestone.is_booking_fee && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                                            Booking Fee
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        £{milestone.amount.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                    {milestone.due_date}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(milestone.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {milestone.payment_link ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2 max-w-xs">
                                                                <input
                                                                    type="text"
                                                                    value={milestone.payment_link}
                                                                    readOnly
                                                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs bg-gray-50 font-mono"
                                                                />
                                                                <button
                                                                    onClick={() => copyToClipboard(milestone.payment_link!)}
                                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                                    title="Copy to clipboard"
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            {milestone.last_updated && (
                                                                <p className="text-xs text-gray-500">
                                                                    Last updated: {milestone.last_updated}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm italic">No link generated</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => generatePaymentLink(milestone)}
                                                        disabled={generating === milestone.id || milestone.status === 'paid'}
                                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {generating === milestone.id ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Link2 className="h-4 w-4 mr-2" />
                                                                {milestone.payment_link ? 'Regenerate' : 'Generate'}
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {milestones.length === 0 && !loading && (
                                    <div className="text-center py-16 bg-white rounded-lg">
                                        <Link2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones Found</h3>
                                        <p className="text-gray-500">No milestones were found for this booking.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
