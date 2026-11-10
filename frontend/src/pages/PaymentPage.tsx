import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    CreditCard,
    Search,
    Calendar,
    Loader2,
    RotateCcw,
    Receipt,
    Banknote,
    Plus,
    SlidersHorizontal,
    X,
    Check,
} from 'lucide-react';
import { paymentApi, PaymentRecord } from '../api/payment';
import { AddPaymentModal } from '@/components/orders/AddPaymentModal';
import { OrderDetailModal, OrderDetailRecord } from '@/components/orders/ViewDetailsModal';
import { orderApi } from '@/api/order';

type SortOption =
    | 'PAYMENT_DATE_DESC'
    | 'PAYMENT_DATE_ASC'
    | 'AMOUNT_DESC'
    | 'AMOUNT_ASC';

type PaymentMethodType = 'CASH' | 'TRANSFER';

const METHOD_OPTIONS: { label: string; value: PaymentMethodType }[] = [
    { label: 'CASH', value: 'CASH' },
    { label: 'TRANSFER', value: 'TRANSFER' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Latest Payment Date', value: 'PAYMENT_DATE_DESC' },
    { label: 'Earliest Payment Date', value: 'PAYMENT_DATE_ASC' },
    { label: 'Highest Payment Amount', value: 'AMOUNT_DESC' },
    { label: 'Lowest Payment Amount', value: 'AMOUNT_ASC' },
];

export const PaymentsPage: React.FC = () => {
    // Search
    const [search, setSearch] = useState('');

    // Modal Filter & Sort visibility
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Active Filter & Sort State
    const [selectedMethods, setSelectedMethods] = useState<PaymentMethodType[]>(
        []
    );
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('PAYMENT_DATE_DESC');

    // Temporary modal state (Draft sebelum klik Apply)
    const [tempMethods, setTempMethods] = useState<PaymentMethodType[]>([]);
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');
    const [tempSortBy, setTempSortBy] =
        useState<SortOption>('PAYMENT_DATE_DESC');

    // Add Payment Modal State
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

    // Fetch data riwayat pembayaran
    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: () => paymentApi.getAll(),
    });

    // Buka Modal & sinkronkan draft filter
    const handleOpenModal = () => {
        setTempMethods([...selectedMethods]);
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setTempSortBy(sortBy);
        setIsFilterModalOpen(true);
    };

    // Toggle multi-select payment method
    const toggleTempMethod = (method: PaymentMethodType) => {
        if (tempMethods.includes(method)) {
            setTempMethods(tempMethods.filter((m) => m !== method));
        } else {
            setTempMethods([...tempMethods, method]);
        }
    };

    // Terapkan filter & sort dari modal
    const handleApplyFilterSort = () => {
        setSelectedMethods(tempMethods);
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setSortBy(tempSortBy);
        setIsFilterModalOpen(false);
    };

    // Reset semua filter & sorting
    const handleResetAll = () => {
        setSelectedMethods([]);
        setStartDate('');
        setEndDate('');
        setSortBy('PAYMENT_DATE_DESC');

        setTempMethods([]);
        setTempStartDate('');
        setTempEndDate('');
        setTempSortBy('PAYMENT_DATE_DESC');
    };

    // Hitung jumlah filter yang sedang aktif untuk indikator badge
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedMethods.length > 0) count += selectedMethods.length;
        if (startDate || endDate) count += 1;
        if (sortBy !== 'PAYMENT_DATE_DESC') count += 1;
        return count;
    }, [selectedMethods, startDate, endDate, sortBy]);

    // Client-side filtering & sorting
    const processedPayments = useMemo(() => {
        let result = [...payments];

        // 1. Filter Search (Receipt No, Order No, Customer Name)
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((item) => {
                const receiptNo = item.receiptNo?.toLowerCase() || '';
                const orderNo = item.order?.orderNo?.toLowerCase() || '';
                const customerName =
                    item.order?.customer?.name?.toLowerCase() || '';
                return (
                    receiptNo.includes(q) ||
                    orderNo.includes(q) ||
                    customerName.includes(q)
                );
            });
        }

        // 2. Filter Multi Payment Method
        if (selectedMethods.length > 0) {
            result = result.filter((item) => {
                const currentMethod = (
                    item.paymentMethod ||
                    (item as any).method ||
                    ''
                ).toUpperCase();
                return selectedMethods.includes(
                    currentMethod as PaymentMethodType
                );
            });
        }

        // 3. Filter Rentang Tanggal Pembayaran
        if (startDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
            result = result.filter((item) => {
                const pDate = item.paymentDate
                    ? new Date(item.paymentDate).getTime()
                    : 0;
                return pDate >= start;
            });
        }
        if (endDate) {
            const end = new Date(`${endDate}T23:59:59.999Z`).getTime();
            result = result.filter((item) => {
                const pDate = item.paymentDate
                    ? new Date(item.paymentDate).getTime()
                    : 0;
                return pDate <= end;
            });
        }

        // 4. Sorting Data yang telah difilter
        result.sort((a, b) => {
            const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
            const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;

            const amountA = Number(a.amount) || 0;
            const amountB = Number(b.amount) || 0;

            switch (sortBy) {
                case 'PAYMENT_DATE_DESC': // Latest Payment Date
                    return dateB - dateA;
                case 'PAYMENT_DATE_ASC': // Earliest Payment Date
                    return dateA - dateB;
                case 'AMOUNT_DESC': // Highest Payment Amount
                    return amountB - amountA;
                case 'AMOUNT_ASC': // Lowest Payment Amount
                    return amountA - amountB;
                default:
                    return 0;
            }
        });

        return result;
    }, [payments, search, selectedMethods, startDate, endDate, sortBy]);

    // Format IDR Currency
    const formatIDR = (val: number) =>
        Number(val).toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        });

    // Format Tanggal
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // State untuk Order Detail Modal
    const [selectedOrderDetail, setSelectedOrderDetail] =
        useState<OrderDetailRecord | null>(null);
    const [_isLoadingDetail, setIsLoadingDetail] = useState(false);

    const handleOpenOrderDetail = async (
        orderId?: string,
        fallbackOrder?: any
    ) => {
        if (!orderId) {
            if (fallbackOrder) {
                setSelectedOrderDetail(fallbackOrder as OrderDetailRecord);
            }
            return;
        }

        try {
            setIsLoadingDetail(true);
            // Mengambil data order lengkap (termasuk items dan payments)
            const orderData = await orderApi.getById(orderId);
            setSelectedOrderDetail(orderData as OrderDetailRecord);
        } catch (err) {
            // Fallback jika API getById gagal, gunakan data yang ada di item payment
            setSelectedOrderDetail(fallbackOrder as OrderDetailRecord);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-4 sm:gap-5">
            {/* 1. Header Bar */}
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                            Payment History
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500">
                        Payment history list and transaction details
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsAddPaymentModalOpen(true)}
                    className="hidden sm:flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    <span>Add Payments</span>
                </button>
            </div>

            {/* 2. Baris Search Bar & Button Filter & Sort (Sejajar di pojok kanan) */}
            <div className="flex shrink-0 gap-3 sm:items-center sm:justify-between">
                {/* Search Bar */}
                <div className="relative flex-1  max-w-md">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Type Receipt No, Order No, or Customer Name..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                {/* Tombol Filter & Sort & Reset */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleOpenModal}
                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors shadow-xs ${
                            activeFilterCount > 0
                                ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <SlidersHorizontal size={16} />
                        <span className="hidden md:block">Filter & Sort</span>
                        {activeFilterCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Reset All Filters"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* 3. Tabel Data Payments */}
            <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="h-full overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-5 py-3.5 text-center w-14">
                                    No.
                                </th>
                                <th className="px-5 py-3.5">Payment Date</th>
                                <th className="px-5 py-3.5">Receipt No.</th>
                                <th className="px-5 py-3.5">Order No.</th>
                                <th className="px-5 py-3.5">Customer Name</th>
                                <th className="px-5 py-3.5 text-right">
                                    Amount
                                </th>
                                <th className="px-5 py-3.5 text-center">
                                    Payment Method
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-16 text-center text-slate-400"
                                    >
                                        <Loader2
                                            size={24}
                                            className="mx-auto animate-spin text-blue-600"
                                        />
                                        <span className="mt-2 block text-xs">
                                            Memuat data pembayaran...
                                        </span>
                                    </td>
                                </tr>
                            ) : processedPayments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-16 text-center text-slate-400"
                                    >
                                        <Receipt
                                            size={36}
                                            className="mx-auto text-slate-300"
                                        />
                                        <p className="mt-2 text-sm font-semibold text-slate-600">
                                            Payment history not found.
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            No payment transactions recorded or
                                            matching the current filter.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                processedPayments.map(
                                    (item: PaymentRecord, idx: number) => {
                                        const methodValue =
                                            item.paymentMethod ||
                                            (item as any).method;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/70 transition-colors"
                                            >
                                                {/* 1. No */}
                                                <td className="px-5 py-3.5 text-center font-medium text-slate-400">
                                                    {idx + 1}
                                                </td>

                                                {/* 2. PaymentDate */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="font-medium text-slate-800">
                                                        {formatDate(
                                                            item.paymentDate
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 3. Receipt No. */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                                        <Receipt size={12} />
                                                        {item.receiptNo || '-'}
                                                    </span>
                                                </td>

                                                {/* 4. Order No. */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    {item.order?.orderNo ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenOrderDetail(
                                                                    item.orderId ||
                                                                        item
                                                                            .order
                                                                            ?.id,
                                                                    item.order
                                                                )
                                                            }
                                                            className="cursor-pointer font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline focus:outline-none transition-colors"
                                                            title="Lihat Detail Pesanan"
                                                        >
                                                            {item.order.orderNo}
                                                        </button>
                                                    ) : (
                                                        <span className="font-mono text-slate-400">
                                                            -
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 5. Customer Name */}
                                                <td className="px-5 py-3.5">
                                                    <div className="font-semibold text-slate-800">
                                                        {item.order?.customer
                                                            ?.name ||
                                                            'Pelanggan Umum'}
                                                    </div>
                                                    {item.order?.customer
                                                        ?.phone && (
                                                        <div className="text-[11px] text-slate-400">
                                                            {
                                                                item.order
                                                                    .customer
                                                                    .phone
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 6. Amount */}
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                    <span className="font-bold text-slate-900">
                                                        {formatIDR(item.amount)}
                                                    </span>
                                                </td>

                                                {/* 7. PaymentMethod */}
                                                <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                    {methodValue ===
                                                    'TRANSFER' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200/50">
                                                            <CreditCard
                                                                size={12}
                                                            />
                                                            TRANSFER
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200/50">
                                                            <Banknote
                                                                size={12}
                                                            />
                                                            CASH
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Modal Dialog Filter & Sort (Desain serasi dengan OrdersPage) */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsFilterModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal
                                    size={18}
                                    className="text-blue-600"
                                />
                                <h3 className="text-base font-bold text-slate-800">
                                    Filter & Sort Payments
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFilterModalOpen(false)}
                                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-5 text-sm">
                            {/* A. SORT OPTIONS */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Sort By
                                </label>
                                <select
                                    value={tempSortBy}
                                    onChange={(e) =>
                                        setTempSortBy(
                                            e.target.value as SortOption
                                        )
                                    }
                                    className="cursor-pointer w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {SORT_OPTIONS.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* B. MULTI-SELECT PAYMENT METHOD */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Payment Method (Pilih 1 atau lebih)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {METHOD_OPTIONS.map((item) => {
                                        const isSelected = tempMethods.includes(
                                            item.value
                                        );
                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() =>
                                                    toggleTempMethod(item.value)
                                                }
                                                className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span>{item.label}</span>
                                                {isSelected && (
                                                    <Check
                                                        size={14}
                                                        className="text-blue-600"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* C. FILTER PAYMENT DATE */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    <Calendar
                                        size={13}
                                        className="text-blue-500"
                                    />
                                    Payment Date Range
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-[11px] text-slate-400">
                                            From
                                        </span>
                                        <input
                                            type="date"
                                            value={tempStartDate}
                                            onChange={(e) =>
                                                setTempStartDate(e.target.value)
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400">
                                            To
                                        </span>
                                        <input
                                            type="date"
                                            value={tempEndDate}
                                            min={tempStartDate}
                                            onChange={(e) =>
                                                setTempEndDate(e.target.value)
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setTempMethods([]);
                                    setTempStartDate('');
                                    setTempEndDate('');
                                    setTempSortBy('PAYMENT_DATE_DESC');
                                }}
                                className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <RotateCcw size={13} />
                                <span>Reset Modal</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFilterModalOpen(false)}
                                    className="cursor-pointer rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApplyFilterSort}
                                    className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <OrderDetailModal
                isOpen={!!selectedOrderDetail}
                order={selectedOrderDetail}
                onClose={() => setSelectedOrderDetail(null)}
            />
            {/* Modal Tambah Pembayaran */}
            <AddPaymentModal
                isOpen={isAddPaymentModalOpen}
                order={null}
                onClose={() => setIsAddPaymentModalOpen(false)}
            />

            {/* Tombol Add Payment Sticky Bulat (Hanya tampil di Mobile View) */}
            <button
                type="button"
                onClick={() => setIsAddPaymentModalOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 sm:hidden cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all focus:outline-none"
                title="Add Payment"
                aria-label="Add Payment"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};
