import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
    TrendingUp,
    CreditCard,
    AlertTriangle,
    Truck,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Calendar,
    Package,
    Clock,
    UserCheck,
    ChevronRight,
    DollarSign,
    PhoneCall,
    RotateCcw,
    RefreshCw,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import { YearlyTrendChart } from '@/components/dashboard/YearlyTrendChart';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const AUTO_REFRESH_INTERVAL = 1000 * 60 * 5;

    // Helper rentang tanggal bulan ini
    const initialDates = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // '10' untuk Oktober

        // Tanggal awal: selalu tanggal '01'
        const start = `${year}-${month}-01`;

        // Tanggal akhir: ambil jumlah hari maksimal bulan tersebut
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate(); // 31
        const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

        return { start, end };
    }, []);

    const [startDate, setStartDate] = useState(initialDates.start);
    const [endDate, setEndDate] = useState(initialDates.end);

    const { data, isLoading, isFetching:isSummaryFetching } = useQuery({
        queryKey: ['dashboard-summary', startDate, endDate],
        queryFn: () =>
            dashboardApi.getSummary({
                startDate: startDate
                    ? new Date(startDate).toISOString()
                    : undefined,
                endDate: endDate
                    ? new Date(`${endDate}T23:59:59.999Z`).toISOString()
                    : undefined,
            }),
        refetchInterval: AUTO_REFRESH_INTERVAL,
        refetchIntervalInBackground: false
    });

    const formatIDR = (val: number) =>
        Number(val || 0).toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        });

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
        });

    const fin = data?.financials;
    const ops = data?.operations;

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);

    // 2. Query Line Graph Tren Tahunan
    const { data: trendData = [], isLoading: isTrendLoading, isFetching: isTrendFetching } = useQuery({
        queryKey: ['dashboard-yearly-trend', selectedYear],
        queryFn: () => dashboardApi.getYearlyTrend(selectedYear),
        refetchInterval: AUTO_REFRESH_INTERVAL,
        refetchIntervalInBackground:false,
    });

    // Pilihan tahun dropdown (misal: 3 tahun terakhir)
    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

    const isSyncing = isSummaryFetching || isTrendFetching;

    const handleSyncAll = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
            queryClient.invalidateQueries({ queryKey: ['dashboard-yearly-trend'] }),
        ]);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* 1. Header & Filter Periode */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                            Dashboard
                        </h1>
                        {isSummaryFetching && !isLoading && (
                            <span className="inline-flex items-center text-xs font-medium text-slate-400">
                                <Loader2
                                    size={12}
                                    className="mr-1 animate-spin text-blue-500"
                                />
                                Memperbarui...
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                {/* Global Date Filter */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs text-xs">
                    <Calendar size={14} className="text-blue-600 ml-1.5 hidden sm:block" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setStartDate(initialDates.start);
                            setEndDate(initialDates.end);
                        }}
                        title="Reset ke Bulan Berjalan"
                        className="cursor-pointer p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                    >
                        <RotateCcw size={12} />
                    </button>
                </div>
                {/* Tombol SYNC di Sebelah Kanan Filter Tanggal */}
                <button
                    type="button"
                    onClick={handleSyncAll}
                    disabled={isSyncing}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700ow-xs hover:bg-slate-100 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    title="Refetch dan Recalculate semua metrik"
                >
                    <RefreshCw size={14} className={`${isSyncing ? 'animate-spin text-slate-600' : 'text-slate-600'}`} />
                    <span className="hidden sm:block">Sync</span>
                </button>
            </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-24 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <span className="mt-3 text-xs font-medium">
                        Menghitung metrik performa usaha...
                    </span>
                </div>
            ) : (
                <>
                    {/* 2. Baris Utama: Kartu Finansial Kunci */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                        {/* Omzet & Realisasi */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-slate-500">
                                <span>Total Sales (Omzet)</span>
                                <TrendingUp
                                    size={16}
                                    className="text-blue-600"
                                />
                            </div>
                            <div className="mt-3">
                                <div className="text-md sm:text-xl font-bold text-slate-900 truncate">
                                    {formatIDR(fin?.grossRevenue || 0)}
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                                    <span>Payment Realization:</span>
                                    <span className="font-semibold text-emerald-600">
                                        {formatIDR(fin?.realizedRevenue || 0)} (
                                        {fin?.realizationRate.toFixed(0)}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Laba Bersih (Net Profit) */}
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-emerald-700">
                                <span>Est. Net Profit</span>
                                <DollarSign
                                    size={16}
                                    className="text-emerald-600"
                                />
                            </div>
                            <div className="mt-3">
                                <div className="text-md sm:text-xl font-bold text-emerald-800 truncate">
                                    {formatIDR(fin?.netProfit || 0)}
                                </div>
                                <p className="mt-1 text-[10px] text-emerald-600/80">
                                    Gross Profit - Operating Expenses
                                </p>
                            </div>
                        </div>

                        {/* Kas Masuk vs Kas Keluar */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-slate-500">
                                <span>Cash Flow (In / Out)</span>
                                <CreditCard
                                    size={16}
                                    className="text-indigo-600"
                                />
                            </div>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] md:text-sm">
                                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                        <ArrowDownRight size={13} /> Cash In:
                                    </span>
                                    <span className="font-bold text-slate-800">
                                        {formatIDR(fin?.totalCashIn || 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] md:text-sm">
                                    <span className="flex items-center gap-1 text-rose-600 font-medium">
                                        <ArrowUpRight size={13} /> Cash Out:
                                    </span>
                                    <span className="font-bold text-slate-800">
                                        {formatIDR(fin?.totalCashOut || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Total Piutang Berjalan */}
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-amber-800">
                                <span>Total Receivables</span>
                                <AlertTriangle
                                    size={16}
                                    className="text-amber-600"
                                />
                            </div>
                            <div className="mt-3">
                                <div className="text-md sm:text-xl font-bold text-amber-900 truncate">
                                    {formatIDR(fin?.totalOutstandingDebt || 0)}
                                </div>
                                <p className="mt-1 text-[10px] text-amber-700">
                                    Total unpaid/partially paid invoices
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Baris Ringkas: Beban Operasional & Status Logistik */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                    <Truck size={20} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-xs md:text-sm font-semibold text-slate-500">
                                        Orders Not Shipped :
                                    </h4>
                                    <p className="text-base font-bold text-slate-800">
                                        {ops?.pendingDeliveriesCount || 0}{' '}
                                        Orders
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/orders')}
                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <h4 className="text-xs md:text-sm font-semibold text-slate-500">
                                        Expenses
                                    </h4>
                                    <div className="flex items-center gap-4">
                                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                                            Operational :{' '}
                                            <span className="font-bold">
                                                {formatIDR(
                                                    fin?.totalOperationalExpenses ||
                                                        0
                                                )}
                                            </span>
                                        </p>
                                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                                            Material/Stock :{' '}
                                            <span className="font-bold">
                                                {formatIDR(
                                                    fin?.totalMaterialPurchases ||
                                                        0
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/expenses')}
                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* 4. Grid Utama: Top 15 Produk Terlaris (Kiri) & Prioritas Tagihan (Kanan) */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Widget: Top 15 Produk Terlaris (7 Kolom) */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Package
                                            size={18}
                                            className="text-blue-600"
                                        />
                                        <h3 className="font-bold text-slate-800 text-sm">
                                            Top 15 Best-Selling Products
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        Based on Revenue Contribution
                                    </span>
                                </div>

                                {/* List Scrollable Internal Top 15 */}
                                <div className="mt-2 max-h-115 overflow-y-auto divide-y divide-slate-100 pr-1">
                                    {!data?.top15Products ||
                                    data.top15Products.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400">
                                            No orders yet
                                        </div>
                                    ) : (
                                        data.top15Products.map((prod, idx) => (
                                            <div
                                                key={prod.productId}
                                                className="flex items-center justify-between py-2.5 text-xs hover:bg-slate-50/60 px-1 rounded transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span
                                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                                            idx < 3
                                                                ? 'bg-blue-600 text-white shadow-xs'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 truncate">
                                                            {prod.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {prod.totalBaseQty}{' '}
                                                            Unit Sold
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="font-bold text-slate-700">
                                                        {formatIDR(
                                                            prod.totalRevenue
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Top Pelanggan Menunggak & Transaksi Terkini (5 Kolom) */}
                        <div className="space-y-6 lg:col-span-5">
                            {/* Widget: Top Pelanggan Perlu Ditagih */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <UserCheck
                                            size={18}
                                            className="text-amber-600"
                                        />
                                        <h3 className="font-bold text-slate-800 text-sm">
                                            Billing Collection Priority
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/customers')}
                                        className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline"
                                    >
                                        See All
                                    </button>
                                </div>

                                <div className="mt-3 divide-y divide-slate-100">
                                    {!data?.topCustomersWithDebt ||
                                    data.topCustomersWithDebt.length === 0 ? (
                                        <div className="py-6 text-center text-xs text-slate-400">
                                            No outstanding debts.
                                        </div>
                                    ) : (
                                        data.topCustomersWithDebt.map(
                                            (cust) => (
                                                <div
                                                    key={cust.id}
                                                    className="flex items-center justify-between py-2.5 text-xs"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 truncate">
                                                            {cust.name}
                                                        </p>
                                                        {cust.phone && (
                                                            <a
                                                                href={`https://wa.me/${cust.phone.replace(/\D/g, '')}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:underline"
                                                            >
                                                                <PhoneCall
                                                                    size={10}
                                                                />
                                                                <span>
                                                                    {cust.phone}
                                                                </span>
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-rose-600">
                                                            {formatIDR(
                                                                cust.remaining
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Widget: 5 Pesanan Terkini */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Clock
                                            size={18}
                                            className="text-indigo-600"
                                        />
                                        <h3 className="font-bold text-slate-800 text-sm">
                                            Recent Orders
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/orders')}
                                        className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline"
                                    >
                                        See All
                                    </button>
                                </div>

                                <div className="mt-3 divide-y divide-slate-100">
                                    {!data?.recentOrders ||
                                    data.recentOrders.length === 0 ? (
                                        <div className="py-6 text-center text-xs text-slate-400">
                                            No orders yet.
                                        </div>
                                    ) : (
                                        data.recentOrders.map((ord) => (
                                            <div
                                                key={ord.id}
                                                className="flex items-center justify-between py-2 text-xs"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-blue-600">
                                                            {ord.orderNo}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {formatDate(
                                                                ord.createdAt
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 truncate max-w-37.5">
                                                        {ord.customer?.name ||
                                                            'Pelanggan Umum'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-semibold text-slate-800">
                                                        {formatIDR(
                                                            ord.totalAmount
                                                        )}
                                                    </span>
                                                    <div>
                                                        <span
                                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                                ord.status ===
                                                                'PAID'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : ord.status ===
                                                                        'PARTIALLY_PAID'
                                                                      ? 'bg-blue-50 text-blue-700'
                                                                      : 'bg-amber-50 text-amber-700'
                                                            }`}
                                                        >
                                                            {ord.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp
                                        size={18}
                                        className="text-blue-600"
                                    />
                                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                                        Monthly Sales Trend & Estimated Net Profit
                                    </h3>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Sales Trend & Net Profit (January –
                                    December) throughout {selectedYear}
                                </p>
                            </div>

                            {/* Filter Dropdown Tahun & Legend */}
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Legend Indikator */}
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                                        Revenue
                                    </span>
                                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
                                        Est. Net Profit
                                    </span>
                                </div>

                                {/* Dropdown Pemilihan Tahun */}
                                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs shadow-2xs">
                                    <Calendar
                                        size={13}
                                        className="text-blue-600"
                                    />
                                    <span className="font-semibold text-slate-600">
                                        Year :
                                    </span>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) =>
                                            setSelectedYear(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                                    >
                                        {yearOptions.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Visualisasi Line Graph */}
                        <div className="mt-4">
                            <YearlyTrendChart
                                data={trendData}
                                isLoading={isTrendLoading}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
