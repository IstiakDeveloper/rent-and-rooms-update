import { Head, Link, router, useForm } from '@inertiajs/react';
import GuestDashboardLayout from '@/layouts/GuestDashboardLayout';
import { useState } from 'react';
import {
    ChevronLeft,
    Calendar,
    MapPin,
    Clock,
    CheckCircle2,
    XCircle,
    CreditCard,
    Building2,
    X,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

interface Package {
    id: number;
    name: string;
    address?: string;
    city?: string;
    instructions?: Instruction[];
}

interface Instruction {
    id: number;
    heading: string;
    details: string;
}

interface BookingPayment {
    id: number;
    milestone_number: number;
    milestone_type: string;
    due_date: string;
    amount: number;
    payment_status: string;
    paid_at?: string;
    payment_method?: string;
}

interface Booking {
    id: number;
    package: Package;
    from_date: string | null;
    to_date: string | null;
    status: string;
    payment_status: string;
    price: number;
    booking_price: number;
    number_of_days: number;
    price_type: string;
    auto_renewal: boolean;
    renewal_period_days?: number;
    next_renewal_date?: string;
    bookingPayments?: BookingPayment[];
}

interface Room {
    id: number;
    name: string;
    room_number?: string;
}

interface PaymentStats {
    totalPrice: number;
    totalPaid: number;
    dueBill: number;
    paymentPercentage: number;
}

interface Props {
    booking: Booking;
    rooms: Room[];
    paymentStats: PaymentStats;
    currentMilestone: BookingPayment | null;
    hasOverdue: boolean;
    canManageAutoRenewal: boolean;
    bankDetails: string;
}

export default function Show({
    booking,
    rooms,
    paymentStats,
    currentMilestone,
    hasOverdue,
    canManageAutoRenewal,
    bankDetails,
}: Props) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showAutoRenewalModal, setShowAutoRenewalModal] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<BookingPayment | null>(null);

    const paymentForm = useForm({
        payment_method: 'bank_transfer',
        milestone_id: '',
        bank_transfer_reference: '',
    });

    const autoRenewalForm = useForm({
        auto_renewal: booking.auto_renewal,
    });

    const handlePaymentModalOpen = (milestone?: BookingPayment) => {
        const paymentMilestone = milestone || currentMilestone;
        if (paymentMilestone) {
            setSelectedMilestone(paymentMilestone);
            paymentForm.setData('milestone_id', paymentMilestone.id.toString());
            setShowPaymentModal(true);
        }
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        paymentForm.post(`/guest/bookings/${booking.id}/payment`, {
            onSuccess: () => {
                setShowPaymentModal(false);
                paymentForm.reset();
            },
        });
    };

    const handleAutoRenewalToggle = () => {
        autoRenewalForm.post(`/guest/bookings/${booking.id}/auto-renewal`, {
            onSuccess: () => {
                setShowAutoRenewalModal(false);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-blue-100 text-blue-700',
            active: 'bg-green-100 text-green-700',
            finished: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700',
            paid: 'bg-green-100 text-green-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const isMilestoneOverdue = (milestone: BookingPayment) => {
        return milestone.payment_status !== 'paid' && new Date(milestone.due_date) < new Date();
    };

    return (
        <GuestDashboardLayout>
            <Head title={`Booking #${booking.id}`} />

            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/guest/bookings"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-4"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Bookings
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.id}</h1>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            {booking.auto_renewal && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Auto-Renewal
                                </span>
                            )}
                        </div>
                        <p className="text-lg text-gray-700">{booking.package.name}</p>
                        {booking.package.address && (
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                {booking.package.address}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {canManageAutoRenewal && (
                            <button
                                onClick={() => setShowAutoRenewalModal(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                            >
                                Auto-Renewal
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Booking Details */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {booking.from_date && booking.to_date && (
                                <>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Check-in</div>
                                        <div className="font-medium">{format(new Date(booking.from_date), 'MMM dd, yyyy')}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Check-out</div>
                                        <div className="font-medium">{format(new Date(booking.to_date), 'MMM dd, yyyy')}</div>
                                    </div>
                                </>
                            )}
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Duration</div>
                                <div className="font-medium">{booking.number_of_days} {booking.price_type}(s)</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.payment_status)}`}>
                                    {booking.payment_status}
                                </span>
                            </div>
                        </div>

                        {rooms && rooms.length > 0 && (
                            <div>
                                <div className="text-sm text-gray-600 mb-2">Rooms</div>
                                <div className="flex flex-wrap gap-2">
                                    {rooms.map((room) => (
                                        <span key={room.id} className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                                            {room.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Timeline */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Payment Schedule</h2>
                            {hasOverdue && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Overdue
                                </span>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-semibold">{paymentStats.paymentPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500"
                                    style={{ width: `${paymentStats.paymentPercentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mt-1">
                                <span>Paid: £{Number(paymentStats.totalPaid).toFixed(2)}</span>
                                <span>Due: £{Number(paymentStats.dueBill).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Milestones */}
                        <div className="space-y-3">
                            {booking.bookingPayments && booking.bookingPayments.length > 0 ? (
                                booking.bookingPayments
                                    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                                    .map((milestone) => {
                                        const isOverdue = isMilestoneOverdue(milestone);
                                        const isPaid = milestone.payment_status === 'paid';

                                        return (
                                            <div
                                                key={milestone.id}
                                                className={`p-4 rounded-lg border-2 ${
                                                    isPaid
                                                        ? 'bg-green-50 border-green-200'
                                                        : isOverdue
                                                        ? 'bg-red-50 border-red-200'
                                                        : 'bg-white border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {isPaid ? (
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        ) : isOverdue ? (
                                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                                        ) : (
                                                            <Clock className="h-5 w-5 text-yellow-600" />
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {milestone.milestone_type || `Milestone ${milestone.milestone_number}`}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-gray-900">£{Number(milestone.amount).toFixed(2)}</div>
                                                        {!isPaid && (
                                                            <button
                                                                onClick={() => handlePaymentModalOpen(milestone)}
                                                                className={`mt-2 px-3 py-1 rounded text-xs font-medium ${
                                                                    isOverdue
                                                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                                }`}
                                                            >
                                                                Pay Now
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No payment milestones found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    {booking.package.instructions && booking.package.instructions.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
                            <div className="space-y-3">
                                {booking.package.instructions.map((instruction, index) => (
                                    <div key={instruction.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                        <div className="font-medium text-gray-900 mb-1">
                                            {index + 1}. {instruction.heading}
                                        </div>
                                        <div className="text-sm text-gray-700">{instruction.details}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Payment Summary */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Package Price</span>
                                <span className="font-medium">£{Number(booking.price).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Booking Fee</span>
                                <span className="font-medium">£{Number(booking.booking_price).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-3 border-t">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-bold text-gray-900">£{Number(paymentStats.totalPrice).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 bg-green-50 rounded px-3">
                                <span className="text-green-700 font-medium">Paid</span>
                                <span className="text-green-700 font-bold">£{Number(paymentStats.totalPaid).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 bg-red-50 rounded px-3">
                                <span className="text-red-700 font-medium">Due</span>
                                <span className="text-red-700 font-bold">£{Number(paymentStats.dueBill).toFixed(2)}</span>
                            </div>
                        </div>

                        {currentMilestone && paymentStats.dueBill > 0 && (
                            <button
                                onClick={() => handlePaymentModalOpen()}
                                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                            >
                                Pay Due Amount
                            </button>
                        )}
                    </div>

                    {/* Auto-Renewal Info */}
                    {booking.auto_renewal && booking.next_renewal_date && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <RefreshCw className="h-5 w-5 text-purple-600 mt-0.5" />
                                <div>
                                    <div className="font-medium text-purple-900 mb-1">Auto-Renewal Active</div>
                                    <div className="text-sm text-purple-700">
                                        Next renewal: {format(new Date(booking.next_renewal_date), 'MMM dd, yyyy')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedMilestone && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <h3 className="text-lg font-semibold text-white">Process Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-white hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="p-6">
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    £{Number(selectedMilestone.amount).toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {selectedMilestone.milestone_type} • Due: {format(new Date(selectedMilestone.due_date), 'MMM dd, yyyy')}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                <div className="space-y-2">
                                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            value="bank_transfer"
                                            checked={paymentForm.data.payment_method === 'bank_transfer'}
                                            onChange={(e) => paymentForm.setData('payment_method', e.target.value)}
                                            className="mr-3"
                                        />
                                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                                        <span className="text-sm font-medium">Bank Transfer</span>
                                    </label>
                                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            value="card"
                                            checked={paymentForm.data.payment_method === 'card'}
                                            onChange={(e) => paymentForm.setData('payment_method', e.target.value)}
                                            className="mr-3"
                                        />
                                        <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                                        <span className="text-sm font-medium">Credit/Debit Card</span>
                                    </label>
                                </div>
                            </div>

                            {paymentForm.data.payment_method === 'bank_transfer' && (
                                <>
                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                                        <strong>Bank Details:</strong> {bankDetails}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Transfer Reference *
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentForm.data.bank_transfer_reference}
                                            onChange={(e) => paymentForm.setData('bank_transfer_reference', e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter reference number"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {paymentForm.processing ? 'Processing...' : 'Proceed'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Auto-Renewal Modal */}
            {showAutoRenewalModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-purple-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
                            <h3 className="text-lg font-semibold text-white">Auto-Renewal Settings</h3>
                            <button onClick={() => setShowAutoRenewalModal(false)} className="text-white hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={autoRenewalForm.data.auto_renewal}
                                    onChange={(e) => autoRenewalForm.setData('auto_renewal', e.target.checked)}
                                    className="w-5 h-5 text-purple-600 rounded mr-3"
                                />
                                <span className="font-medium">Enable Auto-Renewal</span>
                            </label>

                            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
                                <strong>How it works:</strong>
                                <ul className="mt-2 space-y-1 list-disc list-inside text-gray-700">
                                    <li>Automatically renews 7 days before expiry</li>
                                    <li>Creates new milestone payment</li>
                                    <li>Can be cancelled anytime</li>
                                </ul>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAutoRenewalModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAutoRenewalToggle}
                                    disabled={autoRenewalForm.processing}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {autoRenewalForm.processing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </GuestDashboardLayout>
    );
}
