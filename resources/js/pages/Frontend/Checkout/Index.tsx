import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import { CreditCard, Building2, Calendar, User, Mail, Phone, Home, Bed, Bath, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';

export default function CheckoutIndex() {
    const props = usePage().props as any;
    const {
        package: packageData,
        room,
        checkoutData,
        totalNights,
        priceBreakdown,
        roomTotal,
        bookingPrice,
        selectedAmenities = [],
        selectedMaintains = [],
        amenitiesTotal = 0,
        maintainsTotal = 0,
        bankDetails,
        footer,
        header,
        countries,
        selectedCountry,
        auth
    } = props;

    const [paymentOption, setPaymentOption] = useState<'booking_only' | 'full'>('booking_only');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | null>(null);
    const [bankTransferReference, setBankTransferReference] = useState<string>('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Convert values to numbers safely
    const safeRoomTotal = Number(roomTotal) || 0;
    const safeAmenitiesTotal = Number(amenitiesTotal) || 0;
    const safeMaintainsTotal = Number(maintainsTotal) || 0;
    const safeBookingPrice = Number(bookingPrice) || 50;

    const subtotal = safeRoomTotal + safeAmenitiesTotal + safeMaintainsTotal;
    const grandTotal = subtotal + safeBookingPrice;
    const paymentAmount = paymentOption === 'full' ? grandTotal : safeBookingPrice;

    const handleSubmitBooking = async () => {
        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }

        if (paymentMethod === 'bank_transfer' && !bankTransferReference.trim()) {
            alert('Please enter bank transfer reference number');
            return;
        }

        setIsProcessing(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch('/checkout/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    ...checkoutData,
                    amenities: selectedAmenities,
                    maintains: selectedMaintains,
                    paymentMethod,
                    paymentOption,
                    bankTransferReference: paymentMethod === 'bank_transfer' ? bankTransferReference : null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                if (data.stripe_url) {
                    window.location.href = data.stripe_url;
                } else if (data.redirect_url) {
                    window.location.href = data.redirect_url;
                }
            } else {
                alert(data.error || 'Something went wrong');
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('Failed to process booking');
            setIsProcessing(false);
        }
    };

    return (
        <GuestLayout footer={footer} header={header} countries={countries} selectedCountry={selectedCountry} auth={auth}>
            <Head title="Checkout" />

            {/* Back Button */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Property
                    </button>
                </div>
            </div>

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold mb-2">Complete Your Booking</h1>
                    <p className="text-gray-600 mb-8">Review your booking details and complete payment</p>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Booking Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Property Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold mb-3 text-gray-900">{packageData?.name}</h2>
                                <p className="text-gray-600 flex items-start gap-2">
                                    <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                                    {packageData?.address}
                                </p>
                            </div>

                            {/* Booking Dates */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-lg mb-4 text-gray-900">Booking Dates</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Check-in</p>
                                            <p className="font-semibold text-gray-900">{new Date(checkoutData?.from_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Check-out</p>
                                            <p className="font-semibold text-gray-900">{new Date(checkoutData?.to_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold text-gray-900">{totalNights}</span> {totalNights === 1 ? 'night' : 'nights'}
                                    </p>
                                </div>
                            </div>

                            {/* Room Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-lg mb-4 text-gray-900">Room Details</h3>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-indigo-50 rounded-lg">
                                        <Home className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-2">{room?.name}</h4>
                                        <div className="flex gap-6 text-sm text-gray-600">
                                            <span className="flex items-center gap-2">
                                                <Bed className="w-4 h-4" />
                                                {room?.number_of_beds} {room?.number_of_beds === 1 ? 'Bed' : 'Beds'}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Bath className="w-4 h-4" />
                                                {room?.number_of_bathrooms} {room?.number_of_bathrooms === 1 ? 'Bath' : 'Baths'}
                                            </span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-sm text-gray-900 font-semibold">£{safeRoomTotal.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Services */}
                            {(selectedAmenities.length > 0 || selectedMaintains.length > 0) && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="font-semibold text-lg mb-4 text-gray-900">Additional Services</h3>
                                    <div className="space-y-3">
                                        {selectedAmenities.map((amenity: any) => (
                                            <div key={amenity.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                                <span className="text-gray-700">{amenity.name}</span>
                                                <span className="font-semibold text-gray-900">£{Number(amenity.price).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {selectedMaintains.map((maintain: any) => (
                                            <div key={maintain.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                                <span className="text-gray-700">{maintain.name}</span>
                                                <span className="font-semibold text-gray-900">£{Number(maintain.price).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact Information */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-semibold text-lg mb-4 text-gray-900">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700">{checkoutData?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700">{checkoutData?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-700">{checkoutData?.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Payment Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
                                <h3 className="text-xl font-bold mb-6 text-gray-900">Payment Summary</h3>

                                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Room Total</span>
                                        <span className="font-semibold text-gray-900">£{safeRoomTotal.toFixed(2)}</span>
                                    </div>
                                    {safeAmenitiesTotal > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Amenities</span>
                                            <span className="font-semibold text-gray-900">£{safeAmenitiesTotal.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {safeMaintainsTotal > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Maintenance</span>
                                            <span className="font-semibold text-gray-900">£{safeMaintainsTotal.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                        <span className="text-gray-600">Booking Fee</span>
                                        <span className="font-semibold text-gray-900">£{safeBookingPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-bold text-indigo-600">£{grandTotal.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                                >
                                    Proceed to Payment
                                </button>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-start gap-2 text-xs text-gray-500">
                                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <p>Your booking is protected and secured</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-2xl font-bold mb-6 text-gray-900">Select Payment Method</h3>

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                                    paymentMethod === 'card'
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-indigo-300'
                                }`}
                            >
                                <div className={`p-3 rounded-lg ${paymentMethod === 'card' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                    <CreditCard className={`h-6 w-6 ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-gray-600'}`} />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">Card Payment</p>
                                    <p className="text-xs text-gray-500">Pay securely with Stripe</p>
                                </div>
                                {paymentMethod === 'card' && (
                                    <CheckCircle className="ml-auto h-5 w-5 text-indigo-600" />
                                )}
                            </button>

                            <button
                                onClick={() => setPaymentMethod('bank_transfer')}
                                className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                                    paymentMethod === 'bank_transfer'
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-indigo-300'
                                }`}
                            >
                                <div className={`p-3 rounded-lg ${paymentMethod === 'bank_transfer' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                    <Building2 className={`h-6 w-6 ${paymentMethod === 'bank_transfer' ? 'text-indigo-600' : 'text-gray-600'}`} />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-gray-900">Bank Transfer</p>
                                    <p className="text-xs text-gray-500">Transfer directly to our account</p>
                                </div>
                                {paymentMethod === 'bank_transfer' && (
                                    <CheckCircle className="ml-auto h-5 w-5 text-indigo-600" />
                                )}
                            </button>
                        </div>

                        {paymentMethod === 'bank_transfer' && (
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6">
                                <p className="font-semibold mb-2 text-gray-900">Bank Details</p>
                                <p className="text-sm text-gray-700 mb-4">{bankDetails}</p>
                                <input
                                    type="text"
                                    value={bankTransferReference}
                                    onChange={(e) => setBankTransferReference(e.target.value)}
                                    placeholder="Enter Transfer Reference Number"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentMethod(null);
                                    setBankTransferReference('');
                                }}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitBooking}
                                disabled={!paymentMethod || isProcessing}
                                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors shadow-md hover:shadow-lg"
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </GuestLayout>
    );
}
