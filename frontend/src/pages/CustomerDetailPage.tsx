import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    ExternalLink,
    ShoppingBag,
    CreditCard,
    Loader2,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Truck,
    Banknote,
} from 'lucide-react';
import { customerApi } from '../api/customer';
import {
    OrderDetailModal,
    OrderDetailRecord,
} from '@/components/orders/ViewDetailsModal';
import { DeliveryStatus } from '@/api/order';
import { PaymentMethod } from '@/api/payment';

export const CustomerDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');
    const [orderForDetail, setOrderForDetail] =
        useState<OrderDetailRecord | null>(null);

    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => customerApi.getById(id!),
        enabled: !!id,
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

    if (isLoading) {
        return (
            <div className="flex h-96 flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <span className="mt-3 text-sm">Loading Customer Data</span>
            </div>
        );
    }
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>Paid</span>
                    </span>
                );
            case 'PARTIALLY_PAID':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                        <Clock size={12} />
                        <span>Partially Paid</span>
                    </span>
                );
            case 'UNPAID':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                        <AlertCircle size={12} />
                        <span>Unpaid</span>
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
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

    const renderDeliveryBadge = (deliveryStatus: DeliveryStatus) => {
        if (deliveryStatus === 'SHIPPED') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    <span>Shipped</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-semibold text-amber-700 border border-amber-200">
                <Truck size={11} className="text-amber-600" />
                <span>Not Shipped</span>
            </span>
        );
    };

    const renderPaymentMethodBadge = (method: PaymentMethod) => {
        switch (method) {
            case 'CASH':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700 border border-emerald-200">
                        <Banknote size={11} className="text-emerald-600" />
                        <span>CASH</span>
                    </span>
                );
            case 'TRANSFER':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[12px] font-semibold text-blue-700 border border-blue-200">
                        <CreditCard size={11} className="text-blue-600" />
                        <span>TRANSFER</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {method}
                    </span>
                );
        }
    };

    if (!customer) {
        return (
            <div className="p-8 text-center text-slate-500">
                Customer Data Not Found
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tombol Kembali & Header */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/customers')}
                    className="sm:block hidden cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Back"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">
                        {customer.name}
                    </h1>
                </div>
            </div>

            {/* Informasi Customer Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                {/* Kolom Kontak & Identitas */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <User size={16} className="text-blue-600" />
                        <span>Contact Information</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <span>
                                {customer.phone || 'Phone number not available'}
                            </span>
                        </div>
                        {customer.notes && (
                            <div className="flex items-start gap-2 pt-1">
                                <FileText
                                    size={14}
                                    className="text-slate-400 mt-0.5"
                                />
                                <span className="italic">{customer.notes}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Kolom Alamat & Lokasi */}
                <div className="space-y-3 md:border-l md:border-slate-100 md:pl-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <MapPin size={16} className="text-rose-500" />
                            <span>Delivery Address</span>
                        </div>
                        {customer.mapsUrl && (
                            <a
                                href={customer.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                            >
                                <span>Open in Maps</span>
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                        <p className="font-medium text-slate-800">
                            {customer.address}
                        </p>
                        <p className="text-slate-500">
                            {[
                                customer.subdistrict,
                                customer.district,
                                customer.city,
                                customer.province,
                            ]
                                .filter(Boolean)
                                .join(', ') || '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigasi Tab */}
            <div className="border-b border-slate-200">
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('orders')}
                        className={`cursor-pointer flex items-center gap-2 pb-3 text-sm font-semibold transition-colors ${
                            activeTab === 'orders'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <ShoppingBag size={16} />
                        <span>
                            Order History ({customer.orders?.length || 0})
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('payments')}
                        className={`cursor-pointer flex items-center gap-2 pb-3 text-sm font-semibold transition-colors ${
                            activeTab === 'payments'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <CreditCard size={16} />
                        <span>
                            Payment History ({customer.payments?.length || 0})
                        </span>
                    </button>
                </div>
            </div>

            {/* Konten Tab */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                {activeTab === 'orders' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 whitespace-nowrap">Order No.</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Date</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Shipped?</th>
                                    <th className="px-5 py-3 whitespace-nowrap">
                                        Total Amount
                                    </th>
                                    <th className="px-5 py-3">
                                        Paid
                                    </th>
                                    <th className="px-5 py-3">
                                        Remaining
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {!customer.orders?.length ? (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="py-8 text-center text-slate-400"
                                        >
                                            No order history yet.
                                        </td>
                                    </tr>
                                ) : (
                                    customer.orders.map((ord) => {
                                        const remaining = Math.max(
                                            0,
                                            ord.totalAmount -
                                                (ord.paidAmount || 0)
                                        );
                                        return (
                                            <tr
                                                key={ord.id}
                                                onClick={() =>
                                                    setOrderForDetail({
                                                        ...ord,
                                                        customer: {
                                                            id: customer.id,
                                                            name: customer.name,
                                                            phone: customer.phone,
                                                        },
                                                    } as unknown as OrderDetailRecord)
                                                }
                                                className="hover:bg-slate-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-5 py-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                                                    {ord.orderNo}
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                                                    {formatDate(ord.orderDate)}
                                                </td>
                                                <td className="px-5 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                                                    {renderStatusBadge(
                                                        ord.status
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                                                    {renderDeliveryBadge(
                                                        ord.deliveryStatus
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                                                    {formatIDR(ord.totalAmount)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right text-slate-600">
                                                    {formatIDR(
                                                        ord.paidAmount || 0
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-bold text-rose-600">
                                                    {formatIDR(remaining)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 whitespace-nowrap">Receipt No.</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Payment Date</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Method</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Order No.</th>
                                    <th className="px-5 py-3 whitespace-nowrap">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {!customer.payments?.length ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-slate-400"
                                        >
                                            No payment history yet.
                                        </td>
                                    </tr>
                                ) : (
                                    customer.payments.map((pay) => (
                                        <tr
                                            key={pay.id}
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="px-5 py-3.5 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                                                {pay.receiptNo || '-'}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                                                {formatDate(pay.paymentDate)}
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                                                {renderPaymentMethodBadge(pay.method)}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {pay.orderNo ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            // 1. Cari data order yang cocok dari array customer.orders
                                                            const targetOrder =
                                                                customer.orders?.find(
                                                                    (o: any) =>
                                                                        o.orderNo ===
                                                                            pay.orderNo ||
                                                                        o.id ===
                                                                            (
                                                                                pay as any
                                                                            )
                                                                                .orderId
                                                                );

                                                            if (!targetOrder)
                                                                return;

                                                            // 2. Set detail order lengkap ke state modal
                                                            setOrderForDetail({
                                                                ...targetOrder,
                                                                items: (
                                                                    targetOrder.items ||
                                                                    []
                                                                ).map(
                                                                    (
                                                                        it: any
                                                                    ) => ({
                                                                        id: it.id,
                                                                        name:
                                                                            it.productName ||
                                                                            it.name,
                                                                        unitName:
                                                                            it.unitName,
                                                                        quantity:
                                                                            Number(
                                                                                it.quantity
                                                                            ),
                                                                        unitPrice:
                                                                            Number(
                                                                                it.unitPrice
                                                                            ),
                                                                        subTotal:
                                                                            Number(
                                                                                it.subTotal ??
                                                                                    it.subtotal ??
                                                                                    it.quantity *
                                                                                        it.unitPrice
                                                                            ),
                                                                    })
                                                                ),
                                                                payments:
                                                                    targetOrder.payments ||
                                                                    [],
                                                                customer: {
                                                                    id: customer.id,
                                                                    name: customer.name,
                                                                    phone: customer.phone,
                                                                },
                                                            } as unknown as OrderDetailRecord);
                                                        }}
                                                        className="cursor-pointer font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline focus:outline-none transition-colors"
                                                        title="Lihat Detail Pesanan"
                                                    >
                                                        {pay.orderNo}
                                                    </button>
                                                ) : (
                                                    <span className="font-mono text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                                                {formatIDR(pay.amount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Modal Order Detail */}
            <OrderDetailModal
                isOpen={!!orderForDetail}
                order={orderForDetail}
                onClose={() => setOrderForDetail(null)}
            />
        </div>
    );
};
