'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
            <div className={`
                flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border
                ${type === 'success'
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : 'bg-red-500/20 border-red-500/30 text-red-400'
                }
                min-w-[300px] max-w-md
            `}>
                {type === 'success' ? (
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                ) : (
                    <XCircle className="w-6 h-6 flex-shrink-0" />
                )}

                <p className="flex-1 font-medium text-white">{message}</p>

                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
