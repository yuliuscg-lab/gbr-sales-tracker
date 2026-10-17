import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, AlertCircle } from 'lucide-react';
import {
    customerSchema,
    CustomerFormData,
} from '../../validation/customer.validation';
import { Customer } from '../../types/customer.type'

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CustomerFormData) => Promise<void>;
    initialData?: Customer | null;
    serverError?: string | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    serverError,
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: '',
            phone: '',
            notes: '',
            totalOrders: 0,
            unpaidOrdersCount:0
        },
    });

    useEffect(() => {
        if (initialData) {
        reset({
            name: initialData.name,
            phone: initialData.phone || '',
            notes: initialData.notes || '',
            totalOrders: initialData.totalOrders,
            unpaidOrdersCount:initialData.unpaidOrdersCount,
        });
        } else {
        reset({
            name: '',
            phone: '',
            notes: '',
            totalOrders:0,
            unpaidOrdersCount:0
        });
        }
    }, [initialData, reset, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

        {/* Modal Dialog */}
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">
                {initialData ? 'Edit Customer Data' : 'Add New Customer'}
            </h2>
            <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
                <X size={18} />
            </button>
            </div>

            {serverError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{serverError}</span>
            </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Full Name *
                </label>
                <input
                    type="text"
                    placeholder="Contoh: Pak Bambang Kolam"
                    {...register('name')}
                    className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.name
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                />
                {errors.name && (
                    <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Phone / WhatsApp
                </label>
                <input
                    type="text"
                    placeholder="08123456789"
                    {...register('phone')}
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
            </div>

            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Notes
                </label>
                <textarea
                    rows={2}
                    placeholder="Alamat, rute pemancingan, atau info tambahan..."
                    {...register('notes')}
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <span>{initialData ? 'Save Changes' : 'Add Customer'}</span>
                </button>
            </div>
            </form>
        </div>
        </div>
    );
};