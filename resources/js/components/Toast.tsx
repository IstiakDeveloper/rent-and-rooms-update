import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const styles = {
        success: {
            bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
            border: 'border-green-500',
            icon: <CheckCircle className="h-5 w-5 text-green-600" />,
            text: 'text-green-800'
        },
        error: {
            bg: 'bg-gradient-to-r from-red-50 to-pink-50',
            border: 'border-red-500',
            icon: <XCircle className="h-5 w-5 text-red-600" />,
            text: 'text-red-800'
        },
        warning: {
            bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
            border: 'border-yellow-500',
            icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
            text: 'text-yellow-800'
        },
        info: {
            bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
            border: 'border-blue-500',
            icon: <Info className="h-5 w-5 text-blue-600" />,
            text: 'text-blue-800'
        }
    };

    const style = styles[type];

    return (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
            <div className={`${style.bg} ${style.border} border-l-4 rounded-lg shadow-2xl p-4 max-w-md min-w-[320px]`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                        {style.icon}
                    </div>
                    <div className="ml-3 flex-1">
                        <p className={`text-sm font-semibold ${style.text}`}>
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`ml-3 flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
