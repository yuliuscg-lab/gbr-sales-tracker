import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2, Loader2, Package, Coins, Factory } from 'lucide-react';
import {
    productSchema,
    ProductFormData,
} from '../../validation/product.validation';
import { Product } from '@/types/product.type';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProductFormData) => Promise<void>;
    initialData?: Product | null;
    serverError?: string | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    serverError,
}) => {
    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            baseUnit: 'Pcs',
            costPrice: 0,
            isProductionItem: true, // Default aktif
            additionalUnits: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'additionalUnits',
    });

    const baseUnitValue = watch('baseUnit') || 'Pcs';
    const rawCostPrice = watch('costPrice');
    const isProductionItemValue = watch('isProductionItem');

    useEffect(() => {
        if (initialData) {
            const nonBaseUnits = (initialData.units || [])
                .filter((u) => Number(u.conversionQty) > 1)
                .map((u) => ({
                    id: u.id,
                    unitName: u.unitName,
                    conversionQty: Number(u.conversionQty),
                }));

            reset({
                name: initialData.name,
                baseUnit: initialData.baseUnit,
                costPrice: initialData.costPrice ?? 0,
                isProductionItem: initialData.isProductionItem ?? true,
                additionalUnits: nonBaseUnits,
            });
        } else {
            reset({
                name: '',
                baseUnit: 'Pcs',
                costPrice: 0,
                isProductionItem: true,
                additionalUnits: [],
            });
        }
    }, [initialData, isOpen, reset]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                onClick={() => !isSubmitting && onClose()}
            />

            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Package size={18} />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                            {initialData ? 'Edit Product' : 'Create Product'}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-4 space-y-4"
                >
                    {serverError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                            {serverError}
                        </div>
                    )}

                    {/* 1. Nama Produk */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Product Name *
                        </label>
                        <input
                            type="text"
                            placeholder="Example: Kail Carbon No. 5"
                            {...register('name')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.name && (
                            <p className="mt-1 text-[11px] text-rose-600">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* 2. Grid Satuan Dasar & HPP Dasar */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* Satuan Dasar */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Base Unit *
                            </label>
                            <input
                                type="text"
                                placeholder="Pcs / Bungkus / Ons"
                                {...register('baseUnit')}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            {errors.baseUnit && (
                                <p className="mt-1 text-[11px] text-rose-600">
                                    {errors.baseUnit.message}
                                </p>
                            )}
                        </div>

                        {/* Input HPP (Cost Price) */}
                        <div>
                            <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                <Coins size={13} className="text-amber-500" />
                                Cost per Base Unit *
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-slate-400">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={
                                        rawCostPrice !== undefined && rawCostPrice !== null
                                            ? Number(rawCostPrice).toLocaleString('id-ID')
                                            : ''
                                    }
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/\D/g, '');
                                        const val = clean ? parseInt(clean, 10) : 0;
                                        setValue('costPrice', val, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs md:text-sm font-semibold text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            {errors.costPrice && (
                                <p className="mt-1 text-[11px] text-rose-600">
                                    {errors.costPrice.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* POSISI TOGGLE: Sifat Produk Produksi vs Trading */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition-colors">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                {...register('isProductionItem')}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                    <Factory size={13} className={isProductionItemValue ? "text-blue-600" : "text-slate-400"} />
                                    <span>Production Item</span>
                                </div>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                                    Centang jika barang ini harus diproduksi atau di-repack. Uncheck jika barang langsung siap jual/kirim.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* 3. Daftar Satuan Grosir Tambahan */}
                    <div className="border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Additional Units
                            </label>
                            <button
                                type="button"
                                onClick={() =>
                                    append({ unitName: '', conversionQty: 10 })
                                }
                                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                                <Plus size={14} />
                                <span>Add Unit</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            {fields.map((field, idx) => (
                                <div
                                    key={field.id}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        placeholder="Nama Satuan (Dus/Pack)"
                                        {...register(
                                            `additionalUnits.${idx}.unitName`
                                        )}
                                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-slate-400">
                                            =
                                        </span>
                                        <input
                                            type="number"
                                            min={2}
                                            placeholder="Qty"
                                            {...register(
                                                `additionalUnits.${idx}.conversionQty`,
                                                {
                                                    valueAsNumber: true,
                                                }
                                            )}
                                            className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 text-center focus:border-blue-600 focus:outline-none"
                                        />
                                        <span className="text-xs font-medium text-slate-500">
                                            {baseUnitValue}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => remove(idx)}
                                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Modal Action Buttons */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="cursor-pointer rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting && (
                                <Loader2 size={13} className="animate-spin" />
                            )}
                            <span>Save Product</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};