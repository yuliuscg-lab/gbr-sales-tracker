import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, AlertCircle, MapPin, User, FileText } from 'lucide-react';
import {
    customerSchema,
    CustomerFormData,
} from '../../validation/customer.validation';
import { Customer } from '../../types/customer.type';

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
            address: '',
            subdistrict: '',
            district: '',
            city: '',
            province: '',
            mapsUrl: '',
            totalOrders: 0,
            unpaidOrdersCount: 0,
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                phone: initialData.phone || '',
                notes: initialData.notes || '',
                address: (initialData as any).address || '',
                subdistrict: (initialData as any).subdistrict || '',
                district: (initialData as any).district || '',
                city: (initialData as any).city || '',
                province: (initialData as any).province || '',
                mapsUrl: (initialData as any).mapsUrl || '',
                totalOrders: initialData.totalOrders || 0,
                unpaidOrdersCount: initialData.unpaidOrdersCount || 0,
            });
        } else {
            reset({
                name: '',
                phone: '',
                notes: '',
                address: '',
                subdistrict: '',
                district: '',
                city: '',
                province: '',
                mapsUrl: '',
                totalOrders: 0,
                unpaidOrdersCount: 0,
            });
        }
    }, [initialData, reset, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
                    <h2 className="text-lg font-bold text-slate-800">
                        {initialData ? 'Edit Customer Data' : 'Add New Customer'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form (Scrollable) */}
                <div className="overflow-y-auto p-5 sm:p-6">
                    {serverError && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                            <AlertCircle size={16} className="shrink-0 text-rose-500" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <form
                        id="customer-form"
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        {/* Section 1: Customer Identity */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                                <User size={14} className="text-blue-600" />
                                <span>Customer Profile</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
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
                                        <p className="mt-1 text-xs text-rose-600">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Phone / WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="8123456789"
                                        {...register('phone')}
                                        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Address Details */}
                        <div className="space-y-3 pt-1">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                                <MapPin size={14} className="text-rose-500" />
                                <span>Delivery Address</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                    Alamat Lengkap
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Nama jalan, RT/RW, nomor rumah / patokan kolam..."
                                    {...register('address')}
                                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Kelurahan / Desa
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Sukajadi"
                                        {...register('subdistrict')}
                                        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Kecamatan
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Sukajadi"
                                        {...register('district')}
                                        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Kota / Kabupaten
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Kota Bandung"
                                        {...register('city')}
                                        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                        Provinsi
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Jawa Barat"
                                        {...register('province')}
                                        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                    Link Google Maps
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://maps.app.goo.gl/..."
                                    {...register('mapsUrl')}
                                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        {/* Section 3: Notes */}
                        <div className="space-y-3 pt-1">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                                <FileText size={14} className="text-amber-500" />
                                <span>Additional Info</span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                                    Notes
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Rute pemancingan, catatan khusus pengiriman, patokan..."
                                    {...register('notes')}
                                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Buttons */}
                <div className="flex shrink-0 justify-end gap-2.5 border-t border-slate-100 p-4 bg-slate-50 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="customer-form"
                        disabled={isSubmitting}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                    >
                        {isSubmitting && (
                            <Loader2 size={16} className="animate-spin" />
                        )}
                        <span>{initialData ? 'Save Changes' : 'Add Customer'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};