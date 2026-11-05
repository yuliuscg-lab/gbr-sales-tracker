import React from 'react';
import {
    X,
    Calendar,
    Phone,
    Package,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    CreditCard,
    Receipt,
    FileText,
    Truck,
    User,
    Ban,
} from 'lucide-react';
import { OrderRecord, OrderStatus } from '../../api/order';

interface PaymentHistoryItem {
    id?: string;
    paymentDate: string;
    receiptNo?: string | null;
    amount: number;
    paymentMethod: string;
    note?: string | null;
}

export interface OrderDetailRecord extends OrderRecord {
    deliveryFee?: number;
    deliveryDate?: string;
    cancelReason?: string | null;
    cancelledAt?: string | Date | null;
    items?: Array<{
        id: string;
        name: string;
        unitName: string;
        quantity: number;
        unitPrice: number;
        subTotal?: number;
    }>;
    payments?: PaymentHistoryItem[];
    notes?: string | null;
}

interface OrderDetailModalProps {
    isOpen: boolean;
    order: OrderDetailRecord | null;
    onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
    isOpen,
    order,
    onClose,
}) => {
    if (!isOpen || !order) return null;

    const remaining = Math.max(0, order.totalAmount - (order.paidAmount || 0));

    const formatIDR = (val: number | string) =>
        Number(val).toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        });

    const formatDate = (dateStr?: string | Date | null) => {
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={12} />
                        <span>Paid</span>
                    </span>
                );
            case 'PARTIALLY_PAID':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        <Clock size={12} />
                        <span>Partially Paid</span>
                    </span>
                );
            case 'UNPAID':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <AlertCircle size={12} />
                        <span>Unpaid</span>
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        <XCircle size={12} />
                        <span>Cancelled</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                {/* Header Modal */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm md:text-md font-bold text-blue-600">
                                {order.orderNo}
                            </span>
                            {renderStatusBadge(order.status)}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Order : {formatDate(order.createdAt)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                                Due : {formatDate(order.dueDate)}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto space-y-4 pr-1 mt-4">
                    {/* 1. Cancel Reason Section (Muncul jika pesanan dibatalkan) */}
                    {(order.status === 'CANCELLED' || order.cancelReason) && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800">
                            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-700 mb-1">
                                <Ban size={14} className="text-rose-600" />
                                <span>Order Cancelled</span>
                                {order.cancelledAt && (
                                    <span className="font-normal text-rose-500 text-[11px] lowercase">
                                        (pada {formatDate(order.cancelledAt)})
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-rose-700">
                                <strong>Reason :</strong>{' '}
                                {order.cancelReason ||
                                    'Tidak ada alasan pembatalan yang dicantumkan.'}
                            </p>
                        </div>
                    )}

                    {/* 2. Customer Info Section */}
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase mb-2">
                            <User size={14} className="text-slate-400" />
                            <span>Customer</span>
                        </div>
                        <div className="rounded-xl p-3 text-sm border border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 text-sm">
                                    {order.customer?.name || 'Pelanggan Umum'}
                                </span>
                                {order.customer?.phone && (
                                    <a
                                        href={`https://wa.me/${order.customer?.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[12px] text-emerald-600 hover:underline"
                                    >
                                        <Phone size={10} />
                                        <span>{order.customer?.phone}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Item Details Section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                            <Package size={14} className="text-slate-400" />
                            <span>Item Details</span>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-slate-100 bg-slate-50 text-[12px] font-bold tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2 text-center w-8">
                                                No.
                                            </th>
                                            <th className="px-3 py-2">
                                                Product Name
                                            </th>
                                            <th className="px-3 py-2 text-center">
                                                Qty
                                            </th>
                                            <th className="px-3 py-2 text-center">
                                                Unit
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                Price
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                                SubTotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {order.items &&
                                        order.items.length > 0 ? (
                                            order.items.map((item, idx) => {
                                                const subtotal =
                                                    item.subTotal ??
                                                    item.quantity *
                                                        item.unitPrice;
                                                return (
                                                    <tr
                                                        key={item.id || idx}
                                                        className="hover:bg-slate-50/50"
                                                    >
                                                        <td className="px-3 py-2.5 text-center text-slate-400 font-medium">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-medium text-slate-800">
                                                            {item.name}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-slate-600">
                                                            {item.unitName}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right text-slate-600">
                                                            {formatIDR(
                                                                item.unitPrice
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                                                            {formatIDR(
                                                                subtotal
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-3 py-4 text-center text-slate-400 italic"
                                                >
                                                    No order details.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 4. Delivery Details Section (Delivery Fee & Delivery Date bersebelahan) */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                            <Truck size={14} className="text-slate-400" />
                            <span>Delivery Details</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* Delivery Fee */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-xs">
                                <span className="text-slate-600 font-medium">
                                    Delivery Fee :
                                </span>
                                <span className="font-semibold text-slate-800">
                                    {formatIDR(order.deliveryFee ?? 0)}
                                </span>
                            </div>

                            {/* Delivery Date */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-2.5 text-xs">
                                <span className="text-slate-600 font-medium">
                                    Delivery Date :
                                </span>
                                <span className="font-semibold text-slate-800">
                                    {formatDate(
                                        order.deliveryDate || order.dueDate
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 5. Summary Section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                            <FileText size={14} className="text-slate-400" />
                            <span>Summary</span>
                        </div>
                        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs">
                            <div className="flex items-center justify-between text-slate-600 pt-1">
                                <span>Total Billed :</span>
                                <span className="font-bold text-slate-800 text-sm">
                                    {formatIDR(order.totalAmount)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Paid Amount :</span>
                                <span className="font-medium text-slate-600 text-sm">
                                    {formatIDR(order.paidAmount || 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 font-semibold">
                                <span className="text-slate-700">
                                    Remaining Amount :
                                </span>
                                <span
                                    className={`text-sm ${
                                        remaining > 0
                                            ? 'text-rose-600 font-bold'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    {formatIDR(remaining)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 6. Catatan Order */}
                    {order.notes && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-100">
                            <FileText
                                size={14}
                                className="text-amber-600 shrink-0 mt-0.5"
                            />
                            <span>
                                <strong>Notes :</strong> {order.notes}
                            </span>
                        </div>
                    )}

                    {/* 7. Riwayat Pembayaran */}
                    <div className="pt-2 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase">
                                <CreditCard
                                    size={13}
                                    className="text-slate-500"
                                />
                                <span>Payment History</span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">
                                {order.payments?.length || 0} Payments
                            </span>
                        </div>

                        {!order.payments || order.payments.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                                No payments recorded yet.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {order.payments.map((pay, idx) => (
                                    <div
                                        key={pay.id || idx}
                                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs hover:border-slate-300 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Receipt
                                                    size={14}
                                                    className="text-blue-600"
                                                />
                                                <span className="font-mono text-xs font-bold text-slate-800">
                                                    {pay.receiptNo ||
                                                        'Kwitansi -'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] flex items-center gap-1 text-slate-500">
                                                <Calendar
                                                    size={11}
                                                    className="text-slate-400"
                                                />
                                                {formatDate(pay.paymentDate)}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                                            <span className="rounded bg-slate-100 px-2 py-0.5 font-medium uppercase text-slate-600 text-[10px]">
                                                {pay.paymentMethod}
                                            </span>
                                            <span className="text-xs font-bold text-emerald-600">
                                                {formatIDR(pay.amount)}
                                            </span>
                                        </div>

                                        {pay.note && (
                                            <p className="mt-1.5 text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                                                "{pay.note}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
