import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Layers,
    History,
    Printer,
    Calendar,
    User,
    Package,
    CheckSquare,
    Square,
    Loader2,
    FileText,
} from 'lucide-react';
import { productionApi, ProductionCardRecord } from '../api/production';
import { OrderRecord } from '../api/order';
import { downloadAggregateProductionPdf } from '../utils/generateAggregateProductionPdf';

export const ProductionPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    // 1. Fetch Data
    const { data: queue = [], isLoading: isLoadingQueue } = useQuery({
        queryKey: ['production-queue'],
        queryFn: productionApi.getQueue,
        enabled: activeTab === 'queue',
    });

    const { data: history = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['production-history'],
        queryFn: productionApi.getHistory,
        enabled: activeTab === 'history',
    });

    // 2. Mutasi Buat & Cetak Kartu Produksi
    const createCardMutation = useMutation({
        mutationFn: (orderIds: string[]) =>
            productionApi.createCard({ orderIds }),
        onSuccess: (newCard: ProductionCardRecord) => {
            queryClient.invalidateQueries({ queryKey: ['production-queue'] });
            queryClient.invalidateQueries({ queryKey: ['production-history'] });
            setSelectedOrderIds([]);

            // Otomatis download PDF saat batch berhasil dibuat
            downloadAggregateProductionPdf(newCard);
            setActiveTab('history');
        },
        onError: (err: any) => {
            alert(
                err.response?.data?.message || 'Gagal membuat kartu produksi'
            );
        },
    });

    // Selection Checkbox Handler
    const toggleSelectOrder = (id: string) => {
        setSelectedOrderIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedOrderIds.length === queue.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(queue.map((o) => o.id));
        }
    };

    const handlePrintBatch = () => {
        if (selectedOrderIds.length === 0) return;
        createCardMutation.mutate(selectedOrderIds);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Helper Agregasi Produk untuk Card Riwayat
    const getAggregatedProducts = (orders: OrderRecord[]) => {
        const map: Record<
            string,
            { name: string; unitName: string; total: number }
        > = {};
        orders.forEach((o) => {
            (o.items || []).forEach((it: any) => {
                const key =
                    `${it.name || it.productName}__${it.unitName}`.toLowerCase();
                if (!map[key]) {
                    map[key] = {
                        name: it.name || it.productName,
                        unitName: it.unitName || 'Pcs',
                        total: 0,
                    };
                }
                map[key].total += Number(it.quantity);
            });
        });
        return Object.values(map);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8.5rem)] gap-4 sm:gap-6">
            {/* 1. Header Bar & Tab Switcher */}
            <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Production
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage production queue & create production card
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('queue')}
                        className={`cursor-pointer flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                            activeTab === 'queue'
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Layers size={14} />
                        <span>Antrean ({queue.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`cursor-pointer flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                            activeTab === 'history'
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <History size={14} />
                        <span>Riwayat Kartu</span>
                    </button>
                </div>
            </div>

            {/* 2. Content Area */}
            {activeTab === 'queue' ? (
                <div className="flex flex-1 min-h-0 flex-col gap-3">
                    {/* Action Header Antrean */}
                    <div className="flex shrink-0 items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            disabled={queue.length === 0}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 disabled:opacity-50"
                        >
                            {selectedOrderIds.length === queue.length &&
                            queue.length > 0 ? (
                                <CheckSquare
                                    size={16}
                                    className="text-blue-600"
                                />
                            ) : (
                                <Square size={16} className="text-slate-400" />
                            )}
                            <span>
                                Pilih Semua ({selectedOrderIds.length}/
                                {queue.length})
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrintBatch}
                            disabled={
                                selectedOrderIds.length === 0 ||
                                createCardMutation.isPending
                            }
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-40 transition-colors"
                        >
                            {createCardMutation.isPending ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Printer size={14} />
                            )}
                            <span>
                                Cetak Kartu Produksi ({selectedOrderIds.length})
                            </span>
                        </button>
                    </div>

                    {/* Grid Antrean */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                        {isLoadingQueue ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-400">
                                <Loader2
                                    size={28}
                                    className="animate-spin text-blue-600"
                                />
                                <span className="mt-3 text-xs font-medium">
                                    Memuat antrean kerja...
                                </span>
                            </div>
                        ) : queue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
                                <Layers size={40} className="text-slate-300" />
                                <p className="mt-3 text-sm font-semibold text-slate-600">
                                    Tidak ada antrean pesanan
                                </p>
                                <p className="text-xs text-slate-400">
                                    Semua pesanan not-shipped sudah memiliki
                                    kartu produksi atau telah selesai.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
                                {queue.map((ord: OrderRecord) => {
                                    const isChecked = selectedOrderIds.includes(
                                        ord.id
                                    );

                                    return (
                                        <div
                                            key={ord.id}
                                            onClick={() =>
                                                toggleSelectOrder(ord.id)
                                            }
                                            className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all ${
                                                isChecked
                                                    ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-600'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                            }`}
                                        >
                                            <div>
                                                {/* Header Card Antrean */}
                                                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="mt-0.5 text-blue-600">
                                                            {isChecked ? (
                                                                <CheckSquare
                                                                    size={18}
                                                                />
                                                            ) : (
                                                                <Square
                                                                    size={18}
                                                                    className="text-slate-400"
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="font-mono text-sm font-bold text-slate-900">
                                                                {ord.orderNo}
                                                            </span>
                                                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                                <Calendar
                                                                    size={12}
                                                                />
                                                                <span>
                                                                    {formatDate(
                                                                        ord.createdAt
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                                                        Not Shipped
                                                    </span>
                                                </div>

                                                {/* Customer & Due Date */}
                                                <div className="mt-3 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                        <User
                                                            size={15}
                                                            className="text-slate-400"
                                                        />
                                                        <span className="truncate max-w-35">
                                                            {ord.customer
                                                                ?.name ||
                                                                'Pelanggan Umum'}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Due:{' '}
                                                        <span className="font-semibold text-slate-700">
                                                            {formatDate(
                                                                ord.dueDate
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Rincian Item pada Card Antrean */}
                                                <div className="mt-3 space-y-1 rounded-xl bg-slate-50 p-2.5 text-xs">
                                                    <div className="flex items-center gap-1 font-semibold text-slate-500 text-[11px] mb-1">
                                                        <Package size={13} />
                                                        <span>
                                                            Production Details:
                                                        </span>
                                                    </div>
                                                    {(() => {
                                                        // Filter HANYA item yang isProductionItem === true
                                                        const productionOnlyItems =
                                                            (
                                                                ord.items || []
                                                            ).filter(
                                                                (it: any) =>
                                                                    it.isProductionItem === true
                                                            );

                                                        if (
                                                            productionOnlyItems.length === 0
                                                        ) {
                                                            return (
                                                                <span className="text-xs italic text-slate-400">
                                                                    Tidak ada
                                                                    item
                                                                    produksi
                                                                </span>
                                                            );
                                                        }

                                                        return productionOnlyItems.map(
                                                            (
                                                                it: any,
                                                                i: number
                                                            ) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex justify-between text-slate-700 font-medium"
                                                                >
                                                                    <span className="truncate pr-2">
                                                                        {it.name ||
                                                                            it.productName}
                                                                    </span>
                                                                    <span className="font-mono text-slate-900 shrink-0">
                                                                        {
                                                                            it.quantity
                                                                        }{' '}
                                                                        {
                                                                            it.unitName
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )
                                                        );
                                                    })()}
                                                </div>

                                                {ord.notes && (
                                                    <p className="mt-2 text-[11px] italic text-slate-500">
                                                        Catatan: {ord.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Tab 2: Riwayat Kartu Produksi */
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    {isLoadingHistory ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-slate-400">
                            <Loader2
                                size={28}
                                className="animate-spin text-blue-600"
                            />
                            <span className="mt-3 text-xs font-medium">
                                Memuat riwayat kartu...
                            </span>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
                            <History size={40} className="text-slate-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-600">
                                Belum ada kartu produksi yang dicetak
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
                            {history.map((card: ProductionCardRecord) => {
                                const aggregated = getAggregatedProducts(
                                    card.orders || []
                                );

                                return (
                                    <div
                                        key={card.id}
                                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
                                    >
                                        <div>
                                            {/* Header Riwayat Card */}
                                            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                                <div>
                                                    <span className="font-mono text-base font-bold text-blue-600">
                                                        {card.cardNo}
                                                    </span>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                        <Calendar size={12} />
                                                        <span>
                                                            {formatDate(
                                                                card.createdAt
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                                                    {card.orders?.length || 0}{' '}
                                                    Order
                                                </span>
                                            </div>

                                            {/* Tag Daftar Order Terlibat */}
                                            <div className="mt-3">
                                                <span className="text-[11px] font-semibold uppercase text-slate-400">
                                                    Pesanan dalam Batch:
                                                </span>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {card.orders?.map((ord) => (
                                                        <span
                                                            key={ord.id}
                                                            className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-700"
                                                        >
                                                            {ord.orderNo}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Ringkasan Produk Agregat */}
                                            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                                <div className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                    <Package size={13} />
                                                    <span>
                                                        Total Produksi (Agregat)
                                                    </span>
                                                </div>
                                                <div className="divide-y divide-slate-200/60 text-xs">
                                                    {aggregated.map(
                                                        (item, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between py-1.5 text-slate-700"
                                                            >
                                                                <span className="truncate pr-2 font-medium">
                                                                    {item.name}
                                                                </span>
                                                                <span className="font-mono font-bold text-slate-900 shrink-0">
                                                                    {item.total}{' '}
                                                                    {
                                                                        item.unitName
                                                                    }
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tombol Cetak Ulang (Reprint) */}
                                        <div className="mt-5 border-t border-slate-100 pt-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    downloadAggregateProductionPdf(
                                                        card
                                                    )
                                                }
                                                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                                            >
                                                <FileText
                                                    size={14}
                                                    className="text-slate-500"
                                                />
                                                <span>Cetak Ulang Kartu Produksi</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
