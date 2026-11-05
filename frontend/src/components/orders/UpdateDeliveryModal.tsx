// src/components/orders/UpdateDeliveryModal.tsx
import React, { useState, useEffect } from 'react';
import { Truck, Loader2, X, CheckCircle2 } from 'lucide-react';
import { DeliveryStatus } from '../../api/order';

interface UpdateDeliveryModalProps {
    isOpen: boolean;
    orderNo: string;
    currentStatus: DeliveryStatus;
    customerName: string;
    isLoading?: boolean;
    onClose: () => void;
    onConfirm: (
        deliveryStatus: DeliveryStatus,
        shippedAt: string | null
    ) => void;
}

const getTodayISODate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const UpdateDeliveryModal: React.FC<UpdateDeliveryModalProps> = ({
    isOpen,
    orderNo,
    isLoading = false,
    customerName,
    onClose,
    onConfirm,
}) => {
    const [shippedDate, setShippedDate] = useState<string>(getTodayISODate());

    useEffect(() => {
        if (isOpen) {
            setShippedDate(getTodayISODate());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                onClick={() => !isLoading && onClose()}
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="cursor-pointer absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div
                        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600`}
                    >
                        <Truck size={24} />
                    </div>

                    <h3 className="text-xs md:text-lg font-bold text-slate-800">
                        Shipping Confirmation
                    </h3>
                    <p className="mt-1 text-xs md:text-sm text-slate-500">
                        Order{' '}
                        <strong className="font-mono text-xs md:text-sm text-slate-700">
                            {orderNo}
                        </strong>
                    </p>
                    <p className="mt-1 text-xs md:text-sm text-slate-500">
                        Customer{' '}
                        <strong className="font-mono text-xs md:text-sm text-slate-700">
                            {customerName}
                        </strong>
                    </p>

                    <div className="mt-4 w-full text-left">
                        <label className="block text-xs md:text-sm font-semibold text-slate-700">
                            Shipping Date *
                        </label>
                        <div className="relative mt-1.5 flex items-center">
                            <input
                                type="date"
                                value={shippedDate}
                                onChange={(e) => setShippedDate(e.target.value)}
                                className="block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs md:text-sm font-medium text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={isLoading || !shippedDate}
                        onClick={() => onConfirm('SHIPPED', shippedDate)}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <CheckCircle2 size={14} />
                        )}
                        <span>Confirm</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
