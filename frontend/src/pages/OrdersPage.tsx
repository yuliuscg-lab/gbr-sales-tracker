import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { orderApi, OrderStatus, OrderRecord } from '../api/order';
import { ConfirmCancelOrderModal } from '../components/orders/ConfirmCancelOrderModal';
import { SearchBar } from '@/components/common/SearchBar';
import { AddPaymentModal } from '@/components/orders/AddPaymentModal';
import { OrderDetailModal, OrderDetailRecord } from '@/components/orders/ViewDetailsModal';
import { downloadInvoicePdf } from '@/utils/generateInvoicePdf';

const STATUS_FILTERS: { label: string; value: string }[] = [
    { label: 'Semua Status', value: '' },
    { label: 'Belum Lunas (Unpaid)', value: 'UNPAID' },
    { label: 'Sebagian (Partial)', value: 'PARTIALLY_PAID' },
    { label: 'Lunas (Paid)', value: 'PAID' },
    { label: 'Dibatalkan', value: 'CANCELLED' },
];

export const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [orderToCancel, setOrderToCancel] = useState<{
        id: string;
        orderNo: string;
    } | null>(null);
    const [orderToPay, setOrderToPay] = useState<OrderRecord | null>(null);

    const [orderStartDate, setOrderStartDate] = useState('');
    const [orderEndDate, setOrderEndDate] = useState('');
    const [dueStartDate, setDueStartDate] = useState('');
    const [dueEndDate, setDueEndDate] = useState('');
    const [orderForDetail, setOrderForDetail] = useState<OrderDetailRecord | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const isDateFiltered = Boolean(
        orderStartDate || orderEndDate || dueStartDate || dueEndDate
    );

    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setOrderStartDate('');
        setOrderEndDate('');
        setDueStartDate('');
        setDueEndDate('');
    };

    // Query Fetch Order
    const { data: orders = [], isLoading } = useQuery({
        queryKey: [
            'orders',
            debouncedSearch,
            statusFilter,
            orderStartDate,
            orderEndDate,
            dueStartDate,
            dueEndDate,
        ],
        queryFn: () =>
            orderApi.getAll({
                search: debouncedSearch || undefined,
                status: statusFilter || undefined,
                startDate: orderStartDate || undefined,
                endDate: orderEndDate || undefined,
                dueStartDate: dueStartDate || undefined,
                dueEndDate: dueEndDate || undefined,
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
            {/* 1. Header Bar (Diam / Tetap di atas) */}
            <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                            Order List
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
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    <span>Create New Order</span>
                </button>
            </div>

            {/* 2. Baris Filter & Search (Diam / Tetap di atas) */}
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchBar
                    search={search}
                    setSearch={setSearch}
                    text="Search Order No. or Customer Name..."
                />
                <div className="w-full sm:w-56">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="cursor-pointer w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        {STATUS_FILTERS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                    {/* Filter Order Date */}
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                            <Calendar size={13} className="text-blue-500" />
                            Order Date:
                        </span>
                        <input
                            type="date"
                            value={orderStartDate}
                            onChange={(e) => setOrderStartDate(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                            title="Dari tanggal pesanan"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={orderEndDate}
                            min={orderStartDate}
                            onChange={(e) => setOrderEndDate(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                            title="Sampai tanggal pesanan"
                        />
                    </div>

                    {/* Filter Due Date */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                            <Calendar size={13} className="text-amber-500" />
                            Due Date:
                        </span>
                        <input
                            type="date"
                            value={dueStartDate}
                            onChange={(e) => setDueStartDate(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                            title="Dari tanggal tempo"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={dueEndDate}
                            min={dueStartDate}
                            onChange={(e) => setDueEndDate(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                            title="Sampai tanggal tempo"
                        />
                    </div>
                </div>

                {/* Tombol Reset jika ada filter yang terpasang */}
                {(isDateFiltered || statusFilter || search) && (
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                        <RotateCcw size={12} />
                        <span>Reset Filter</span>
                    </button>
                )}
            </div>
            {/* 3. Area Scroll Tunggal: Hanya bagian daftar kartu ini yang bisa di-scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
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
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
                        <ShoppingCart size={40} className="text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-600">
                            No orders found
                        </p>
                        <p className="text-xs text-slate-400">
                            Please create a new order or adjust your search
                            filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
                        {orders.map((ord: OrderRecord) => {
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
                                        {/* Tombol Tambah Payment di Pojok Kiri */}
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

                                        {/* Tombol Aksi Lainnya di Pojok Kanan */}
                                        <div className="flex items-center gap-1.5">
                                            {/* Download Invoice */}
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

                                            {/* Detail */}
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

                                            {/* Edit */}
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

                                            {/* Cancel */}
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

            {/* {Modal Order Detail} */}
            <OrderDetailModal
                isOpen={!!orderForDetail}
                order={orderForDetail}
                onClose={() => setOrderForDetail(null)}
            />
        </div>
    );
};
