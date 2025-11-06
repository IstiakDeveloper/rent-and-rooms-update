import React, { useState } from 'react';
import { X, MapPin, Bed, Bath } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    package: any;
    room: any;
    fromDate: Date;
    toDate: Date;
    name: string;
    email: string;
    phone: string;
    selectedAmenities: any[];
    selectedMaintains: any[];
    roomTotal: number;
    totalDays: number;
    priceType: string;
    quantity: number;
}

export default function CheckoutModal(props: CheckoutModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    if (!props.isOpen) return null;

    const handleProceedToCheckout = async () => {
        setIsProcessing(true);
        setError('');

        try {
            const response = await fetch('/store-checkout-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    package_id: props.package.id,
                    selected_room: props.room.id,
                    from_date: props.fromDate.toISOString().split('T')[0],
                    to_date: props.toDate.toISOString().split('T')[0],
                    name: props.name,
                    email: props.email,
                    phone: props.phone,
                    amenities: props.selectedAmenities,
                    maintains: props.selectedMaintains,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Please sign in to continue booking');
                } else {
                    setError(data.error || 'Failed to process. Please try again.');
                }
                setIsProcessing(false);
                return;
            }

            if (data.success) {
                window.location.href = '/checkout';
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError('Network error. Please check your connection.');
            setIsProcessing(false);
        }
    };

    const amenitiesTotal = props.selectedAmenities.reduce((sum: number, item: any) => sum + Number(item.price), 0);
    const maintainsTotal = props.selectedMaintains.reduce((sum: number, item: any) => sum + Number(item.price), 0);
    const subtotal = props.roomTotal + amenitiesTotal + maintainsTotal;
    const bookingFee = 50;
    const total = subtotal + bookingFee;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white">Review Booking</h2>
                    <button onClick={props.onClose} className="text-white hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="bg-gray-50 rounded p-4">
                        <h3 className="font-bold">{props.package.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />{props.package.address}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="border rounded p-3">
                            <div className="text-xs text-gray-600">Check-in</div>
                            <div className="font-semibold">{props.fromDate.toLocaleDateString()}</div>
                        </div>
                        <div className="border rounded p-3">
                            <div className="text-xs text-gray-600">Check-out</div>
                            <div className="font-semibold">{props.toDate.toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div className="border rounded p-4">
                        <h4 className="font-semibold mb-2">{props.room.name}</h4>
                        <div className="flex gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1"><Bed className="w-4 h-4"/>{props.room.number_of_beds} Beds</span>
                            <span className="flex items-center gap-1"><Bath className="w-4 h-4"/>{props.room.number_of_bathrooms} Baths</span>
                        </div>
                        <div className="text-sm">
                            {props.totalDays} nights - £{props.roomTotal.toFixed(2)}
                        </div>
                    </div>

                    {(props.selectedAmenities.length > 0 || props.selectedMaintains.length > 0) && (
                        <div className="border rounded p-4">
                            <h4 className="font-semibold mb-2">Additional Services</h4>
                            {props.selectedAmenities.map((a: any) => (
                                <div key={a.id} className="flex justify-between text-sm py-1">
                                    <span>{a.name}</span><span>£{Number(a.price).toFixed(2)}</span>
                                </div>
                            ))}
                            {props.selectedMaintains.map((m: any) => (
                                <div key={m.id} className="flex justify-between text-sm py-1">
                                    <span>{m.name}</span><span>£{Number(m.price).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border rounded p-4">
                        <h4 className="font-semibold mb-2">Contact</h4>
                        <div className="text-sm space-y-1">
                            <div>{props.name}</div>
                            <div>{props.email}</div>
                            <div>{props.phone}</div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded p-4">
                        <h4 className="font-semibold mb-3">Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Room</span><span>£{props.roomTotal.toFixed(2)}</span></div>
                            {amenitiesTotal > 0 && <div className="flex justify-between"><span>Amenities</span><span>£{amenitiesTotal.toFixed(2)}</span></div>}
                            {maintainsTotal > 0 && <div className="flex justify-between"><span>Services</span><span>£{maintainsTotal.toFixed(2)}</span></div>}
                            <div className="flex justify-between"><span>Booking Fee</span><span>£{bookingFee.toFixed(2)}</span></div>
                            <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>£{total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t flex gap-3">
                    <button onClick={props.onClose} className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                    <button onClick={handleProceedToCheckout} disabled={isProcessing} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50">
                        {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                    </button>
                </div>
            </div>
        </div>
    );
}
