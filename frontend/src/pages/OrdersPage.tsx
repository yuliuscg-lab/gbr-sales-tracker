import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
    ShoppingCart,
    Plus,
    Calendar,
    User,
    Loader2,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Package,
    Eye,
    Edit,
    Ban,
    RotateCcw,
    CreditCard,
    FileText,
    SlidersHorizontal,
    X,
    Check,
} from 'lucide-react';
import { orderApi, OrderStatus, OrderRecord } from '../api/order';
import { ConfirmCancelOrderModal } from '../components/orders/ConfirmCancelOrderModal';
import { SearchBar } from '@/components/common/SearchBar';
import { AddPaymentModal } from '@/components/orders/AddPaymentModal';
import { OrderDetailModal, OrderDetailRecord } from '@/components/orders/ViewDetailsModal';
import { downloadInvoicePdf } from '@/utils/generateInvoicePdf';

type SortOption =
    | 'REMAINING_DESC'
    | 'REMAINING_ASC'
    | 'ORDER_DATE_DESC'
    | 'ORDER_DATE_ASC'
    | 'DUE_DATE_ASC'
    | 'DUE_DATE_DESC';

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
    { label: 'Unpaid', value: 'UNPAID' },
    { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Cancelled', value: 'CANCELLED' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Highest Remaining Amount', value: 'REMAINING_DESC' },
    { label: 'Lowest Remaining Amount', value: 'REMAINING_ASC' },
    { label: 'Latest Order Date', value: 'ORDER_DATE_DESC' },
    { label: 'Oldest Order Date', value: 'ORDER_DATE_ASC' },
    { label: 'Nearest Due Date', value: 'DUE_DATE_ASC' },
    { label: 'Longest Due Date', value: 'DUE_DATE_DESC' },
];

export const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Search state
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modal Filter & Sort visibility
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Active Filters & Sort State
    const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
    const [orderStartDate, setOrderStartDate] = useState('');
    const [orderEndDate, setOrderEndDate] = useState('');
    const [dueStartDate, setDueStartDate] = useState('');
    const [dueEndDate, setDueEndDate] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('ORDER_DATE_DESC');

    // Temporary modal state (Draft sebelum apply)
    const [tempStatuses, setSelectedTempStatuses] = useState<OrderStatus[]>([]);
    const [tempOrderStartDate, setTempOrderStartDate] = useState('');
    const [tempOrderEndDate, setTempOrderEndDate] = useState('');
    const [tempDueStartDate, setTempDueStartDate] = useState('');
    const [tempDueEndDate, setTempDueEndDate] = useState('');
    const [tempSortBy, setTempSortBy] = useState<SortOption>('ORDER_DATE_DESC');

    // Modals data state
    const [orderToCancel, setOrderToCancel] = useState<{
        id: string;
        orderNo: string;
    } | null>(null);
    const [orderToPay, setOrderToPay] = useState<OrderRecord | null>(null);
    const [orderForDetail, setOrderForDetail] = useState<OrderDetailRecord | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // Buka Modal & Sinkronisasi state draft
    const handleOpenModal = () => {
        setSelectedTempStatuses([...selectedStatuses]);
        setTempOrderStartDate(orderStartDate);
        setTempOrderEndDate(orderEndDate);
        setTempDueStartDate(dueStartDate);
        setTempDueEndDate(dueEndDate);
        setTempSortBy(sortBy);
        setIsFilterModalOpen(true);
    };

    // Toggle multi-select status
    const toggleTempStatus = (status: OrderStatus) => {
        if (tempStatuses.includes(status)) {
            setSelectedTempStatuses(tempStatuses.filter((s) => s !== status));
        } else {
            setSelectedTempStatuses([...tempStatuses, status]);
        }
    };

    const handleApplyFilterSort = () => {
        setSelectedStatuses(tempStatuses);
        setOrderStartDate(tempOrderStartDate);
        setOrderEndDate(tempOrderEndDate);
        setDueStartDate(tempDueStartDate);
        setDueEndDate(tempDueEndDate);
        setSortBy(tempSortBy);
        setIsFilterModalOpen(false);
    };

    const handleResetAll = () => {
        setSelectedStatuses([]);
        setOrderStartDate('');
        setOrderEndDate('');
        setDueStartDate('');
        setDueEndDate('');
        setSortBy('ORDER_DATE_DESC');

        setSelectedTempStatuses([]);
        setTempOrderStartDate('');
        setTempOrderEndDate('');
        setTempDueStartDate('');
        setTempDueEndDate('');
        setTempSortBy('ORDER_DATE_DESC');
    };

    // Hitung jumlah filter yang sedang aktif
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedStatuses.length > 0) count += selectedStatuses.length;
        if (orderStartDate || orderEndDate) count += 1;
        if (dueStartDate || dueEndDate) count += 1;
        if (sortBy !== 'ORDER_DATE_DESC') count += 1;
        return count;
    }, [selectedStatuses, orderStartDate, orderEndDate, dueStartDate, dueEndDate, sortBy]);

    // Fetch data orders (Fetch semua / berdasarkan search text)
    const { data: rawOrders = [], isLoading } = useQuery({
        queryKey: ['orders', debouncedSearch],
        queryFn: () =>
            orderApi.getAll({
                search: debouncedSearch || undefined,
            }),
    });

    // Mutasi Pembatalan Order
    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            orderApi.cancel(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setOrderToCancel(null);
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || 'Gagal membatalkan pesanan');
        },
    });

    // FILTER & SORTING DATA
    const processedOrders = useMemo(() => {
        let result = [...rawOrders];

        // 1. Filter Multi-Status
        if (selectedStatuses.length > 0) {
            result = result.filter((item) => selectedStatuses.includes(item.status));
        }

        // 2. Filter Order Date
        if (orderStartDate) {
            const start = new Date(`${orderStartDate}T00:00:00.000Z`).getTime();
            result = result.filter((item) => {
                const dateVal = item.createdAt ? new Date(item.createdAt).getTime() : 0;
                return dateVal >= start;
            });
        }
        if (orderEndDate) {
            const end = new Date(`${orderEndDate}T23:59:59.999Z`).getTime();
            result = result.filter((item) => {
                const dateVal = item.createdAt ? new Date(item.createdAt).getTime() : 0;
                return dateVal <= end;
            });
        }

        // 3. Filter Due Date
        if (dueStartDate) {
            const start = new Date(`${dueStartDate}T00:00:00.000Z`).getTime();
            result = result.filter((item) => {
                if (!item.dueDate) return false;
                return new Date(item.dueDate).getTime() >= start;
            });
        }
        if (dueEndDate) {
            const end = new Date(`${dueEndDate}T23:59:59.999Z`).getTime();
            result = result.filter((item) => {
                if (!item.dueDate) return false;
                return new Date(item.dueDate).getTime() <= end;
            });
        }

        // 4. SORTING DATA
        result.sort((a, b) => {
            const remA = Math.max(0, a.totalAmount - (a.paidAmount || 0));
            const remB = Math.max(0, b.totalAmount - (b.paidAmount || 0));

            const orderDateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const orderDateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

            const dueDateA = a.dueDate ? new Date(a.dueDate).getTime() : null;
            const dueDateB = b.dueDate ? new Date(b.dueDate).getTime() : null;

            switch (sortBy) {
                case 'REMAINING_DESC':
                    return remB - remA;
                case 'REMAINING_ASC':
                    return remA - remB;
                case 'ORDER_DATE_DESC':
                    return orderDateB - orderDateA;
                case 'ORDER_DATE_ASC':
                    return orderDateA - orderDateB;
                case 'DUE_DATE_ASC': // Nearest Due Date (terdekat duluan, item tanpa due date di bawah)
                    if (dueDateA === null && dueDateB === null) return 0;
                    if (dueDateA === null) return 1;
                    if (dueDateB === null) return -1;
                    return dueDateA - dueDateB;
                case 'DUE_DATE_DESC': // Longest Due Date (terjauh duluan)
                    if (dueDateA === null && dueDateB === null) return 0;
                    if (dueDateA === null) return 1;
                    if (dueDateB === null) return -1;
                    return dueDateB - dueDateA;
                default:
                    return 0;
            }
        });

        return result;
    }, [
        rawOrders,
        selectedStatuses,
        orderStartDate,
        orderEndDate,
        dueStartDate,
        dueEndDate,
        sortBy,
    ]);

    const formatIDR = (val: number) =>
        Number(val).toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        });

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case 'PAID':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>Paid</span>
                    </span>
                );
            case 'PARTIALLY_PAID':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[12px] font-semibold text-blue-700 border border-blue-200">
                        <Clock size={12} />
                        <span>Partially Paid</span>
                    </span>
                );
            case 'UNPAID':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-semibold text-amber-700 border border-amber-200">
                        <AlertCircle size={12} />
                        <span>Unpaid</span>
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-semibold text-rose-700 border border-rose-200">
                        <XCircle size={12} />
                        <span>Cancelled</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8.5rem)] gap-4 sm:gap-6">
            {/* 1. Header Bar */}
            <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className=" text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                            Orders
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500">
                        Track order status, notes, and customer billing
                    </p>
                </div>

                {/* Tombol Buat Order Baru */}
                <button
                    type="button"
                    onClick={() => navigate('/orders/new')}
                    className="hidden md:flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    <span>Create New Order</span>
                </button>
            </div>

            {/* 2. Baris Search Bar & Button Filter & Sort (Sejajar di pojok kanan) */}
            <div className="flex shrink-0 gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                    <SearchBar
                        search={search}
                        setSearch={setSearch}
                        text="Search Order No. or Customer Name..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Tombol Filter & Sort */}
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

                    {/* Tombol Reset Cepat jika filter aktif */}
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

            {/* 3. Area Scroll Tunggal: Kartu Pesanan */}
            <div className="flex-1 min-h-0 pr-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-400">
                        <Loader2
                            size={28}
                            className="animate-spin text-blue-600"
                        />
                        <span className="mt-3 text-xs font-medium">
                            Loading orders...
                        </span>
                    </div>
                ) : processedOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
                        <ShoppingCart size={40} className="text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-600">
                            No orders found
                        </p>
                        <p className="text-xs text-slate-400">
                            Please adjust your search, filter, or sorting criteria.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
                        {processedOrders.map((ord: OrderRecord) => {
                            const remaining = Math.max(
                                0,
                                ord.totalAmount - (ord.paidAmount || 0)
                            );
                            const items = ord.items || [];
                            const firstItem = items[0];
                            const extraItemsCount = items.length - 1;

                            return (
                                <div
                                    key={ord.id}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
                                >
                                    <div>
                                        {/* Top Header: Order No, Tanggal, dan Status */}
                                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                            <div>
                                                <span className="font-mono text-sm font-bold text-slate-900">
                                                    {ord.orderNo}
                                                </span>
                                                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-600">
                                                    <Calendar size={12} />
                                                    <span>
                                                        {formatDate(
                                                            ord.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                {renderStatusBadge(ord.status)}
                                            </div>
                                        </div>

                                        {/* Customer & Due Date */}
                                        <div className="mt-3 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                <User
                                                    size={18}
                                                    className="text-slate-400"
                                                />
                                                <span className="truncate max-w-32.5 sm:max-w-37.5 text-sm font-bold">
                                                    {ord.customer?.name!}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 text-[12px] text-slate-500">
                                                <span>Due:</span>
                                                <span className="font-medium text-slate-700">
                                                    {formatDate(ord.dueDate)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ringkasan Barang yang Dibeli */}
                                        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                                            <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-slate-500">
                                                <span className="flex items-center gap-1.5 tracking-wider">
                                                    <Package
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                    Item Details
                                                </span>
                                                {extraItemsCount > 0 && (
                                                    <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[12px] font-bold text-blue-700">
                                                        +{extraItemsCount} Items
                                                    </span>
                                                )}
                                            </div>

                                            {firstItem ? (
                                                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                                                    <span className="truncate pr-2">
                                                        {firstItem.name}
                                                    </span>
                                                    <span className="shrink-0 font-mono text-sm text-slate-600">
                                                        {firstItem.quantity}{' '}
                                                        {firstItem.unitName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-slate-400">
                                                    No Item Details Found
                                                </span>
                                            )}
                                        </div>

                                        {/* Rincian Finansial: Total, Terbayar, dan Sisa */}
                                        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span>Total Amount :</span>
                                                <span className="font-bold text-slate-800">
                                                    {formatIDR(ord.totalAmount)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-slate-500">
                                                <span>Amount Paid :</span>
                                                <span className="font-medium text-slate-600">
                                                    {formatIDR(
                                                        ord.paidAmount || 0
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-1.5">
                                                <span className="font-semibold text-slate-700">
                                                    Remaining Amount:
                                                </span>
                                                <span
                                                    className={`text-sm font-semibold ${
                                                        remaining > 0
                                                            ? 'text-rose-600'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {formatIDR(remaining)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Action Buttons */}
                                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setOrderToPay(ord)}
                                            disabled={
                                                ord.status === 'CANCELLED' ||
                                                ord.status === 'PAID'
                                            }
                                            className="flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={
                                                ord.status === 'PAID'
                                                    ? 'Order already paid'
                                                    : ord.status === 'CANCELLED'
                                                        ? 'Order already cancelled'
                                                        : 'Add Payment'
                                            }
                                        >
                                            <CreditCard size={18} />
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    downloadInvoicePdf(ord)
                                                }
                                                disabled={
                                                    ord.status === 'CANCELLED'
                                                }
                                                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                                title="Download Invoice"
                                            >
                                                <FileText
                                                    size={18}
                                                    className="text-slate-500"
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOrderForDetail(ord)
                                                }
                                                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                                title="View Order Details"
                                            >
                                                <Eye
                                                    size={18}
                                                    className="text-slate-500"
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/orders/${ord.id}`
                                                    )
                                                }
                                                disabled={
                                                    ord.status === 'CANCELLED' || ord.status === 'PAID'
                                                }
                                                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Edit Order"
                                            >
                                                <Edit size={18} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOrderToCancel({
                                                        id: ord.id,
                                                        orderNo: ord.orderNo,
                                                    })
                                                }
                                                disabled={
                                                    ord.status ===
                                                        'CANCELLED' ||
                                                    (ord.paidAmount || 0) > 0
                                                }
                                                className="flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={
                                                    (ord.paidAmount || 0) > 0
                                                        ? 'Order has payment history, cannot cancel'
                                                        : 'Cancel Order'
                                                }
                                            >
                                                <Ban size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 4. Modal Dialog Filter & Sort */}
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
                                <SlidersHorizontal size={18} className="text-blue-600" />
                                <h3 className="text-base font-bold text-slate-800">
                                    Filter & Sort Orders
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
                                    onChange={(e) => setTempSortBy(e.target.value as SortOption)}
                                    className="cursor-pointer w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {SORT_OPTIONS.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* B. MULTI-SELECT STATUS */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Status
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {STATUS_OPTIONS.map((item) => {
                                        const isSelected = tempStatuses.includes(item.value);
                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => toggleTempStatus(item.value)}
                                                className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span>{item.label}</span>
                                                {isSelected && <Check size={14} className="text-blue-600" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* C. FILTER ORDER DATE */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    <Calendar size={13} className="text-blue-500" />
                                    Order Date Range
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-[11px] text-slate-400">From</span>
                                        <input
                                            type="date"
                                            value={tempOrderStartDate}
                                            onChange={(e) => setTempOrderStartDate(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400">To</span>
                                        <input
                                            type="date"
                                            value={tempOrderEndDate}
                                            min={tempOrderStartDate}
                                            onChange={(e) => setTempOrderEndDate(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* D. FILTER DUE DATE */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    <Calendar size={13} className="text-amber-500" />
                                    Due Date Range
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-[11px] text-slate-400">From</span>
                                        <input
                                            type="date"
                                            value={tempDueStartDate}
                                            onChange={(e) => setTempDueStartDate(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400">To</span>
                                        <input
                                            type="date"
                                            value={tempDueEndDate}
                                            min={tempDueStartDate}
                                            onChange={(e) => setTempDueEndDate(e.target.value)}
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
                                    setSelectedTempStatuses([]);
                                    setTempOrderStartDate('');
                                    setTempOrderEndDate('');
                                    setTempDueStartDate('');
                                    setTempDueEndDate('');
                                    setTempSortBy('ORDER_DATE_DESC');
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

            {/* Modal Dialog Konfirmasi Batal */}
            <ConfirmCancelOrderModal
                isOpen={!!orderToCancel}
                orderNo={orderToCancel?.orderNo || ''}
                isLoading={cancelMutation.isPending}
                onClose={() => setOrderToCancel(null)}
                onConfirm={(reason) => {
                    if (orderToCancel) {
                        cancelMutation.mutate({ id: orderToCancel.id, reason });
                    }
                }}
            />

            {/* Modal Dialog Tambah Pembayaran */}
            <AddPaymentModal
                isOpen={!!orderToPay}
                order={orderToPay}
                onClose={() => setOrderToPay(null)}
            />

            {/* Modal Order Detail */}
            <OrderDetailModal
                isOpen={!!orderForDetail}
                order={orderForDetail}
                onClose={() => setOrderForDetail(null)}
            />
            {/* Tombol Create New Order Sticky Bulat (Hanya tampil di Mobile View) */}
            <button
                type="button"
                onClick={() => navigate('/orders/new')}
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 sm:hidden cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all focus:outline-none"
                title="Create New Order"
                aria-label="Create New Order"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};