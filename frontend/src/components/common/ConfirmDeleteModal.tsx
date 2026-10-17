import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: React.ReactNode;
    isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi Hapus',
    message,
    isLoading = false,
}) => {
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
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-base font-bold text-slate-800">
                        {title}
                    </h3>
                    <div className="mt-2 text-xs text-slate-500 leading-relaxed">
                        {message}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading && (
                            <Loader2 size={14} className="animate-spin" />
                        )}
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
