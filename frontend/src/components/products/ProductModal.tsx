import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2, Loader2, AlertCircle, Layers } from 'lucide-react';
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
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            baseUnit: 'Pcs',
            additionalUnits: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'additionalUnits',
    });

    const baseUnitValue = watch('baseUnit') || 'Satuan Dasar';

    useEffect(() => {
        if (initialData) {
            // Satuan dasar adalah unit dengan conversionQty === 1
            const baseUnitItem = initialData.units?.find((u) => Number(u.conversionQty) === 1);
            const secondaryUnits =
                initialData.units
                    ?.filter((u) => Number(u.conversionQty) > 1)
                    .map((u) => ({
                        unitName: u.unitName,
                        conversionQty: Number(u.conversionQty),
                    })) || [];

            reset({
                name: initialData.name,
                baseUnit: initialData.baseUnit || baseUnitItem?.unitName || 'Pcs',
                additionalUnits: secondaryUnits,
            });
        } else {
            reset({
                name: '',
                baseUnit: 'Pcs',
                additionalUnits: [],
            });
        }
    }, [initialData, reset, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {initialData ? 'Edit Product' : 'Add New Product'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {serverError && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
                        <span>{serverError}</span>
                    </div>
                )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
            <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                    Product Name *
                </label>
                <input
                    type="text"
                    placeholder="Contoh: Kail Carbon No. 5"
                    {...register('name')}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none ${
                        errors.name
                            ? 'border-rose-400 focus:ring-1 focus:ring-rose-400'
                            : 'border-slate-200 focus:border-blue-600'
                    }`}
                />
                {errors.name && (
                    <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="block text-xs font-semibold uppercase text-slate-600">
                    Base Unit *
                </label>
                <input
                    type="text"
                    placeholder="Misal: Pcs, Bungkus, Ons"
                    {...register('baseUnit')}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none ${
                        errors.baseUnit ? 'border-rose-400' : 'border-slate-200'
                    }`}
                />
                {errors.baseUnit && (
                    <p className="mt-1 text-xs text-rose-600">{errors.baseUnit.message}</p>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                    Smallest unit for stock and conversion.
                </p>
            </div>

            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Layers size={16} className="text-slate-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Additional Units (UOM)
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => append({ unitName: '', conversionQty: 10 })}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                        <Plus size={14} />
                        <span>Add Unit</span>
                    </button>
                </div>

                {fields.length === 0 ? (
                    <p className="text-center py-3 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                        Only sold per base unit ({baseUnitValue}).
                    </p>
                ) : (
                    <div className="space-y-2">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
                            >
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Nama Satuan (misal: Pack, Dus)"
                                        {...register(`additionalUnits.${index}.unitName` as const)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div className="w-44">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="2"
                                            placeholder="Isi Qty"
                                            {...register(`additionalUnits.${index}.conversionQty` as const)}
                                            className="w-full rounded-lg border border-slate-200 py-1.5 pl-2.5 pr-14 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                                        />
                                        <span className="absolute inset-y-0 right-2 flex items-center text-[11px] text-slate-400">
                                            {baseUnitValue}
                                        </span>
                                    </div>
                                </div>

                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Hapus Satuan"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                            <span>{initialData ? 'Save Changes' : 'Add Product'}</span>
                        </button>
                    </div>
        </form>
    </div>
</div>
);
};
