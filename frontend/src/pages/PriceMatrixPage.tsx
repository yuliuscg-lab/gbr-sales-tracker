import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
    TableProperties,
    Save,
    RotateCcw,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Building2,
    HelpCircle,
} from 'lucide-react';
import { customerApi } from '../api/customer';
import { priceMatrixApi } from '../api/priceMatrix';
import { MatrixProductItem } from '@/types/priceMatrix.type';
import { SearchBar } from '@/components/common/SearchBar';

export const PriceMatrixPage: React.FC = () => {
    const queryClient = useQueryClient();

    // State Pelanggan Terpilih
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [search, setSearch] = useState<string>('');

    // State draft harga lokal: key = productUnitId, value = string input nominal
    const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
    const [toastMessage, setToastMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToastMessage({ type, text });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // 1. Fetch Daftar Pelanggan
    const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
        queryKey: ['customers'],
        queryFn: () => customerApi.getAll(),
    });

    // Otomatis pilih customer pertama jika belum ada yang dipilih
    useEffect(() => {
        if (!selectedCustomerId && customers.length > 0) {
            setSelectedCustomerId(customers[0].id);
        }
    }, [customers, selectedCustomerId]);

    // 2. Fetch Matrix Data Customer Terpilih
    const { data: matrix = [], isLoading: isLoadingMatrix } = useQuery({
        queryKey: ['price-matrix', selectedCustomerId],
        queryFn: () => priceMatrixApi.getByCustomerId(selectedCustomerId),
        enabled: !!selectedCustomerId,
    });

    // Sinkronkan data database ke local draft saat data berpindah customer atau selesai fetch
    useEffect(() => {
        if (matrix.length > 0) {
            const initialMap: Record<string, string> = {};
            matrix.forEach((prod) => {
                prod.units.forEach((u) => {
                    initialMap[u.productUnitId] =
                        u.price !== null ? String(u.price) : '';
                });
            });
            setPriceDrafts(initialMap);
        } else {
            setPriceDrafts({});
        }
    }, [matrix]);

    // 3. Mutasi Batch Update Matrix
    const updateMutation = useMutation({
        mutationFn: async () => {
            // Kumpulkan item yang diisi angka >= 0
            const pricesToSubmit: { productUnitId: string; price: number }[] =
                [];

            Object.entries(priceDrafts).forEach(([unitId, val]) => {
                if (val.trim() !== '') {
                    const num = Number(val);
                    if (!isNaN(num) && num >= 0) {
                        pricesToSubmit.push({
                            productUnitId: unitId,
                            price: num,
                        });
                    }
                }
            });

            await priceMatrixApi.updateMatrix(selectedCustomerId, {
                prices: pricesToSubmit,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['price-matrix', selectedCustomerId],
            });
            showToast('success', 'All prices have been updated successfully');
        },
        onError: (err: unknown) => {
            if (err instanceof AxiosError && err.response?.data?.message) {
                showToast('error', err.response.data.message);
            } else {
                showToast('error', 'Failed to update prices');
            }
        },
    });

    // Handler input harga
    const handlePriceChange = (unitId: string, val: string) => {
        // Hanya izinkan angka bulat
        const sanitized = val.replace(/\D/g, '');
        setPriceDrafts((prev) => ({
            ...prev,
            [unitId]: sanitized,
        }));
    };

    // Reset perubahan kembali ke state semula
    const handleReset = () => {
        const initialMap: Record<string, string> = {};
        matrix.forEach((prod) => {
            prod.units.forEach((u) => {
                initialMap[u.productUnitId] =
                    u.price !== null ? String(u.price) : '';
            });
        });
        setPriceDrafts(initialMap);
        showToast('success', 'All prices have been reset to initial data');
    };

    // Filter pencarian tabel
    const filteredMatrix = matrix.filter((item: MatrixProductItem) => {
        const q = search.toLowerCase();
        return (
            item.name.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q)
        );
    });

    // Deteksi apakah ada perbedaan draft dengan server
    const hasChanges = matrix.some((prod) =>
        prod.units.some((u) => {
            const serverVal = u.price !== null ? String(u.price) : '';
            const localVal = priceDrafts[u.productUnitId] ?? '';
            return serverVal !== localVal;
        })
    );

    const selectedCustomerObj = customers.find(
        (c) => c.id === selectedCustomerId
    );

    // 1. Map untuk mengecek baris mana saja yang harganya <= HPP
const invalidPriceMap: Record<string, string> = {};

matrix.forEach((prod) => {
    prod.units.forEach((unit) => {
        const inputVal = priceDrafts[unit.productUnitId];
        // Hanya cek jika input tidak kosong
        if (inputVal !== undefined && inputVal.trim() !== '') {
            const priceNum = Number(inputVal);
            const unitHpp = Number(prod.costPrice || 0) * Number(unit.conversionQty || 1);

            // Validasi: harga wajib > HPP
            if (priceNum <= unitHpp) {
                invalidPriceMap[unit.productUnitId] = 
                    `Harga harus lebih besar dari HPP (Rp ${unitHpp.toLocaleString('id-ID')})`;
            }
        }
    });
});

// Ada error jika ada minimal 1 unit yang inputnya <= HPP
const hasPriceError = Object.keys(invalidPriceMap).length > 0;

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 ${
                        toastMessage.type === 'success'
                            ? 'bg-emerald-700'
                            : 'bg-rose-700'
                    }`}
                >
                    {toastMessage.type === 'success' ? (
                        <CheckCircle2 size={18} />
                    ) : (
                        <AlertCircle size={18} />
                    )}
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* Header Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-bold tracking-wide text-slate-800">
                            Customer Prices Master Data
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500">
                        Set product prices per unit for each customer
                    </p>
                </div>
            </div>

            {/* Bar Navigasi Seleksi Customer & Search */}
            <div className=" ">
                {/* Pilih Pelanggan */}
                <div className="mb-4 max-w-md">
                    <label className="mb-1 block text-sm font-semibold text-slate-600">
                        Select Customer:
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Building2 size={16} />
                        </div>
                        <select
                            value={selectedCustomerId}
                            onChange={(e) =>
                                setSelectedCustomerId(e.target.value)
                            }
                            disabled={isLoadingCustomers}
                            className="cursor-pointer w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-slate-800 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.phone ? `(${c.phone})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <SearchBar
                    search={search}
                    setSearch={setSearch}
                    text="Search Product Name..."
                />
            </div>

            {/* Info Status Banner */}
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-xs text-blue-800 max-w-2xl">
                <div className="flex items-center gap-2">
                    <HelpCircle size={20} className="shrink-0 text-blue-600" />
                    <span className="text-xs md:text-sm">
                        Setting up specific prices for{' '}
                        <strong>
                            {selectedCustomerObj?.name || 'Customer'}
                        </strong>
                        .
                    </span>
                </div>
                {hasPriceError ? (
                    <span className="shrink-0 font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[13px] flex items-center gap-1">
                        <AlertCircle size={14} /> Harga di bawah HPP
                    </span>
                ) : hasChanges ? (
                    <span className="shrink-0 font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[13px]">
                        Unsaved Changes
                    </span>
                ) : null}
            </div>
            {/* Tabel Price Matrix: 4 Kolom (No, Product Name + SKU, HPP, Units & Prices) */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs max-w-2xl">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                {/* 1. No. Urut */}
                                <th className="w-10 px-2 py-3 text-center sm:px-3">
                                    No.
                                </th>

                                {/* 2. Product Name & SKU */}
                                <th className="px-3 py-3 sm:px-4">
                                    Product Name
                                </th>

                                {/* 3. Kolom HPP per Satuan */}
                                <th className="w-36 px-3 py-3 sm:px-4">HPP</th>

                                {/* 4. Units & Prices */}
                                <th className="w-52 px-3 py-3 sm:px-4">
                                    Units & Prices
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoadingMatrix ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-12 text-center text-slate-400"
                                    >
                                        <Loader2
                                            size={22}
                                            className="mx-auto animate-spin text-blue-600"
                                        />
                                        <span className="mt-2 block text-xs">
                                            Memuat katalog & harga khusus...
                                        </span>
                                    </td>
                                </tr>
                            ) : filteredMatrix.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-12 text-center text-slate-400"
                                    >
                                        <TableProperties
                                            size={32}
                                            className="mx-auto text-slate-300"
                                        />
                                        <p className="mt-2 text-sm">
                                            Tidak ada produk ditemukan.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMatrix.map((prod, index) => (
                                    <tr
                                        key={prod.productId}
                                        className="align-top transition-colors hover:bg-slate-50/60"
                                    >
                                        {/* 1. Kolom Nomor Urut */}
                                        <td className="px-2 py-3 text-center text-xs font-semibold text-slate-400 sm:px-3 sm:py-3.5">
                                            {index + 1}
                                        </td>

                                        {/* 2. Kolom Nama Produk + SKU */}
                                        <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                                            <div
                                                className="font-semibold text-slate-800 text-xs md:text-sm leading-snug"
                                                title={prod.name}
                                            >
                                                {prod.name}
                                            </div>
                                            <div className="mt-0.5 inline-block font-mono text-[12px] text-blue-600">
                                                {prod.code}
                                            </div>
                                        </td>

                                        {/* 3. Kolom HPP per Satuan */}
                                        <td className="p-0 border-l border-slate-50">
                                            <div className="divide-y divide-slate-100">
                                                {prod.units.map((unit) => {
                                                    const unitHpp =
                                                        Number(
                                                            prod.costPrice || 0
                                                        ) *
                                                        Number(
                                                            unit.conversionQty ||
                                                                1
                                                        );

                                                    return (
                                                        <div
                                                            key={
                                                                unit.productUnitId
                                                            }
                                                            className="flex items-center justify-start px-3 py-2 text-xs sm:px-4 h-12"
                                                        >
                                                            <span className="font-medium text-slate-400 text-[12px]">
                                                                {unitHpp > 0
                                                                    ? `Rp ${unitHpp.toLocaleString('id-ID')}`
                                                                    : '0'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        {/* Kolom 4: Units & Prices */}
                                        <td className="p-0 border-l border-slate-50">
                                            <div className="divide-y divide-slate-100">
                                                {prod.units.map((unit) => {
                                                    const currentVal =
                                                        priceDrafts[
                                                            unit.productUnitId
                                                        ] ?? '';
                                                    const isEdited =
                                                        (unit.price !== null
                                                            ? String(unit.price)
                                                            : '') !==
                                                        currentVal;
                                                    const unitHpp =
                                                        Number(
                                                            prod.costPrice || 0
                                                        ) *
                                                        Number(
                                                            unit.conversionQty ||
                                                                1
                                                        );
                                                    const errorMessage =
                                                        invalidPriceMap[
                                                            unit.productUnitId
                                                        ];
                                                    const isError =
                                                        Boolean(errorMessage);

                                                    return (
                                                        <div
                                                            key={
                                                                unit.productUnitId
                                                            }
                                                            className={`flex flex-col justify-center px-3 py-2 text-xs transition-colors sm:px-4 min-h-12 ${
                                                                isError
                                                                    ? 'bg-rose-50/60'
                                                                    : isEdited
                                                                      ? 'bg-amber-50/60'
                                                                      : ''
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                {/* Info Satuan & Rasio */}
                                                                <div className="flex flex-col min-w-0 pr-1">
                                                                    <span className="font-semibold text-slate-700 truncate text-xs">
                                                                        {
                                                                            unit.unitName
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            unit.unitName ===
                                                                            prod.baseUnit
                                                                                ? 'hidden'
                                                                                : 'text-[11px] text-slate-400 whitespace-nowrap'
                                                                        }
                                                                    >
                                                                        (
                                                                        {
                                                                            unit.conversionQty
                                                                        }{' '}
                                                                        {
                                                                            prod.baseUnit
                                                                        }
                                                                        )
                                                                    </span>
                                                                </div>

                                                                {/* Input Box Harga */}
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <div className="relative w-24 sm:w-28">
                                                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-[11px] font-medium text-slate-400">
                                                                            Rp
                                                                        </span>
                                                                        <input
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            placeholder="0"
                                                                            value={
                                                                                currentVal
                                                                                    ? Number(
                                                                                          currentVal
                                                                                      ).toLocaleString(
                                                                                          'id-ID'
                                                                                      )
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handlePriceChange(
                                                                                    unit.productUnitId,
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className={`w-full rounded-md border py-1 pl-6 pr-2 text-right text-[12px] font-medium transition-all focus:outline-none focus:ring-1 ${
                                                                                isError
                                                                                    ? 'border-rose-400 bg-white text-rose-900 focus:border-rose-600 focus:ring-rose-200'
                                                                                    : isEdited
                                                                                        ? 'border-amber-400 bg-white text-amber-900 focus:ring-amber-300'
                                                                                        : currentVal
                                                                                        ? 'border-slate-200 bg-white text-slate-800 focus:border-blue-600 focus:ring-blue-100'
                                                                                        : 'border-dashed border-slate-300 bg-slate-50 text-slate-400 focus:border-blue-600 focus:bg-white'
                                                                            }`}
                                                                        />
                                                                    </div>

                                                                    {/* Indikator Status */}
                                                                    {isError ? (
                                                                        <AlertCircle
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="shrink-0 text-rose-500 animate-pulse"
                                                                        />
                                                                    ) : isEdited ? (
                                                                        <span
                                                                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                                                                            title="Ada perubahan belum disimpan"
                                                                        />
                                                                    ) : null}
                                                                </div>
                                                            </div>

                                                            {/* Pesan Error di Bawah Input jika Harga <= HPP */}
                                                            {isError && (
                                                                <span className="mt-1 text-right text-[10px] font-semibold text-rose-600 leading-tight">
                                                                    Wajib &gt;
                                                                    Rp{' '}
                                                                    {unitHpp.toLocaleString(
                                                                        'id-ID'
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 max-w-2xl">
                {hasChanges && (
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 hover:cursor-pointer text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <RotateCcw size={14} />
                        <span>Reset</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => updateMutation.mutate()}
                    // DISABLE jika tidak ada perubahan, sedang loading, ATAU masih ada harga <= HPP
                    disabled={
                        !hasChanges || hasPriceError || updateMutation.isPending
                    }
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors ${
                        hasChanges &&
                        !hasPriceError &&
                        !updateMutation.isPending
                            ? 'bg-blue-600 hover:bg-blue-700 hover:cursor-pointer'
                            : 'bg-slate-300 cursor-not-allowed text-slate-500'
                    }`}
                >
                    {updateMutation.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                    ) : (
                        <Save size={15} />
                    )}
                    <span>
                        {updateMutation.isPending
                            ? 'Saving...'
                            : 'Save Changes'}
                    </span>
                </button>
            </div>
        </div>
    );
};
