import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmCancelOrderModalProps {
    isOpen: boolean;
    orderNo: string;
    isLoading?: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export const ConfirmCancelOrderModal: React.FC<
    ConfirmCancelOrderModalProps
> = ({ isOpen, orderNo, isLoading = false, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                onClick={() => !isLoading && onClose()}
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-base font-bold text-slate-800">
                        Cancel Order
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Are you sure you want to cancel order<br/>
                        <strong className="text-slate-700 font-mono">
                            {orderNo}
                        </strong>
                        ?
                    </p>

                    <div className="mt-4 w-full text-left">
                        <label className="block text-xs font-semibold text-slate-700">
                            Cancel Reason (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="Example: Wrong input / Customer canceled"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-200"
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading && (
                            <Loader2 size={14} className="animate-spin" />
                        )}
                        <span>Cancel Order</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
