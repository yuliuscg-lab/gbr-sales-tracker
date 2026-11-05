import React, { useState } from 'react';
import { MonthlyTrendRecord } from '../../api/dashboard';

interface YearlyTrendChartProps {
    data: MonthlyTrendRecord[];
    isLoading?: boolean;
}

export const YearlyTrendChart: React.FC<YearlyTrendChartProps> = ({
    data,
    isLoading,
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const formatShortIDR = (val: number) => {
        if (Math.abs(val) >= 1_000_000_000)
            return `${(val / 1_000_000_000).toFixed(1)}M`;
        if (Math.abs(val) >= 1_000_000)
            return `${(val / 1_000_000).toFixed(1)}Jt`;
        if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}Rb`;
        return val.toString();
    };

    const formatIDR = (val: number) =>
        Number(val || 0).toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        });

    if (isLoading) {
        return (
            <div className="flex h-72 items-center justify-center text-xs text-slate-400">
                Memuat grafik tren...
            </div>
        );
    }

    // Cari nilai batas atas & bawah untuk skala sumbu Y
    const allValues = data.flatMap((d) => [d.revenue, d.netProfit]);
    const maxValue = Math.max(10_000_000, ...allValues);
    const minValue = Math.min(0, ...allValues);
    const range = maxValue - minValue || 1;

    // Dimensi SVG
    const width = 1000;
    const height = 300;
    const paddingX = 60;
    const paddingTop = 25;
    const paddingBottom = 40;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingTop - paddingBottom;

    const getX = (idx: number) => paddingX + (idx / 11) * plotWidth;
    const getY = (val: number) =>
        paddingTop + plotHeight - ((val - minValue) / range) * plotHeight;

    // Titik koordinat garis
    const revPoints = data
        .map((d, i) => `${getX(i)},${getY(d.revenue)}`)
        .join(' ');
    const netPoints = data
        .map((d, i) => `${getX(i)},${getY(d.netProfit)}`)
        .join(' ');

    // Garis horizontal Grid
    const gridTicks = [
        minValue,
        minValue + range * 0.33,
        minValue + range * 0.66,
        maxValue,
    ];

    return (
        <div className="relative w-full overflow-x-auto">
            <div className="min-w-170">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full overflow-visible"
                >
                    {/* Garis Grid Horizontal */}
                    {gridTicks.map((val, idx) => {
                        const y = getY(val);
                        return (
                            <g key={idx}>
                                <line
                                    x1={paddingX}
                                    y1={y}
                                    x2={width - paddingX}
                                    y2={y}
                                    stroke="#E2E8F0"
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                />
                                <text
                                    x={paddingX - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    className="fill-slate-400 text-[10px] font-mono"
                                >
                                    {formatShortIDR(val)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Garis Baseline Rp 0 (jika ada nilai minus) */}
                    {minValue < 0 && (
                        <line
                            x1={paddingX}
                            y1={getY(0)}
                            x2={width - paddingX}
                            y2={getY(0)}
                            stroke="#CBD5E1"
                            strokeWidth="1.5"
                        />
                    )}

                    {/* 1. Line Revenue (Biru) */}
                    <polyline
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={revPoints}
                    />

                    {/* 2. Line Est. Net Profit (Emerald / Hijau) */}
                    <polyline
                        fill="none"
                        stroke="#059669"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="2 0"
                        points={netPoints}
                    />

                    {/* Titik & Interaksi Hover */}
                    {data.map((item, idx) => {
                        const x = getX(idx);
                        const yRev = getY(item.revenue);
                        const yNet = getY(item.netProfit);
                        const isHovered = hoveredIndex === idx;

                        return (
                            <g
                                key={item.monthIndex}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredIndex(idx)}
                            >
                                {/* Garis Vertikal Bantu saat hover */}
                                {isHovered && (
                                    <line
                                        x1={x}
                                        y1={paddingTop}
                                        x2={x}
                                        y2={height - paddingBottom}
                                        stroke="#94A3B8"
                                        strokeWidth="1"
                                        strokeDasharray="3 3"
                                    />
                                )}

                                {/* Dot Revenue */}
                                <circle
                                    cx={x}
                                    cy={yRev}
                                    r={isHovered ? 6 : 4}
                                    className="fill-white stroke-blue-600 stroke-[2.5] transition-all"
                                />

                                {/* Dot Net Profit */}
                                <circle
                                    cx={x}
                                    cy={yNet}
                                    r={isHovered ? 6 : 4}
                                    className="fill-white stroke-emerald-600 stroke-[2.5] transition-all"
                                />

                                {/* Label Bulan (Sumbu X) */}
                                <text
                                    x={x}
                                    y={height - paddingBottom + 20}
                                    textAnchor="middle"
                                    className={`text-[11px] font-semibold transition-colors ${
                                        isHovered
                                            ? 'fill-blue-600 font-bold'
                                            : 'fill-slate-500'
                                    }`}
                                >
                                    {item.monthLabel}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Floating Tooltip Box saat Titik Di-hover */}
                {hoveredIndex !== null && data[hoveredIndex] && (
                    <div
                        className="pointer-events-none absolute -top-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs transition-all text-xs"
                        style={{
                            left: `${(getX(hoveredIndex) / width) * 100}%`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <p className="font-bold text-slate-800 pb-1 border-b border-slate-100">
                            Bulan {data[hoveredIndex].monthLabel}
                        </p>
                        <div className="mt-1.5 space-y-1">
                            <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                                    Revenue:
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                    {formatIDR(data[hoveredIndex].revenue)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                                    Est. Net Profit:
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                    {formatIDR(data[hoveredIndex].netProfit)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
