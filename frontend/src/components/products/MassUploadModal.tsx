import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { ProductFormData } from '../../validation/product.validation';

interface MassUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (products: ProductFormData[]) => Promise<void>;
    isLoading: boolean;
}

interface ParsedProductRow {
    isValid: boolean;
    errorMsg?: string;
    data: ProductFormData;
}

export const MassUploadModal: React.FC<MassUploadModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
    const [isParsing, setIsParsing] = useState(false);

    if (!isOpen) return null;

    // 1. Download Template Excel
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Nama Produk*': 'Kail Carbon Special No. 5',
                'Satuan Dasar*': 'Pcs',
                'HPP Dasar (Rp)*': 850,
                'Satuan Tambahan (Format: Nama:Rasio)': 'Pack:10, Dus:200',
            },
            {
                'Nama Produk*': 'Senar Pancing Monofilament 0.25mm',
                'Satuan Dasar*': 'Roll',
                'HPP Dasar (Rp)*': 15000,
                'Satuan Tambahan (Format: Nama:Rasio)': 'Slop:10',
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        worksheet['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 18 }, { wch: 40 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Produk');
        XLSX.writeFile(workbook, 'Template_Mass_Upload_Produk.xlsx');
    };

    // 2. Parse File Excel
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsParsing(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

                const parsed: ParsedProductRow[] = rawData.map((row) => {
                    // Cari field secara fleksibel jika ada perbedaan spasi / tanda *
                    const name = (row['Nama Produk*'] || row['Nama Produk'] || row['nama'] || '').toString().trim();
                    const baseUnit = (row['Satuan Dasar*'] || row['Satuan Dasar'] || row['baseUnit'] || 'Pcs').toString().trim();
                    const rawCost = row['HPP Dasar (Rp)*'] || row['HPP Dasar'] || row['costPrice'] || 0;
                    const costPrice = Math.max(0, parseInt(String(rawCost).replace(/\D/g, ''), 10) || 0);
                    const rawAdditional = (row['Satuan Tambahan (Format: Nama:Rasio)'] || row['Satuan Tambahan'] || '').toString().trim();

                    // Parse satuan tambahan (contoh: "Pack:10, Dus:200")
                    const additionalUnits: { unitName: string; conversionQty: number }[] = [];
                    if (rawAdditional) {
                        const pairs = rawAdditional.split(',');
                        for (const pair of pairs) {
                            const [uName, uQty] = pair.split(':');
                            if (uName && uQty) {
                                const qty = parseInt(uQty.trim(), 10);
                                if (!isNaN(qty) && qty > 1) {
                                    additionalUnits.push({
                                        unitName: uName.trim(),
                                        conversionQty: qty,
                                    });
                                }
                            }
                        }
                    }

                    // Validasi baris
                    let isValid = true;
                    let errorMsg = '';
                    if (!name) {
                        isValid = false;
                        errorMsg = 'Nama produk wajib diisi';
                    } else if (!baseUnit) {
                        isValid = false;
                        errorMsg = 'Satuan dasar wajib diisi';
                    }

                    return {
                        isValid,
                        errorMsg,
                        data: {
                            name,
                            baseUnit,
                            costPrice,
                            isProductionItem:true,
                            additionalUnits,
                        },
                    };
                });

                setParsedRows(parsed);
            } catch (err) {
                alert('Format file excel tidak valid atau rusak');
            } finally {
                setIsParsing(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    const validRows = parsedRows.filter((r) => r.isValid);
    const hasInvalid = parsedRows.some((r) => !r.isValid);

    const handleSubmit = async () => {
        if (validRows.length === 0) return;
        await onSubmit(validRows.map((r) => r.data));
    };

    const handleReset = () => {
        setFileName(null);
        setParsedRows([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => !isLoading && onClose()} />

            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileSpreadsheet size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Mass Upload Product</h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Panduan & Tombol Download Template */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900">
                        <div>
                            <p className="font-semibold">Download template untuk memastikan pengisian data produk dengan benar </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-blue-600 px-3.5 py-2 font-medium text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            <Download size={14} />
                            <span>Download Template</span>
                        </button>
                    </div>

                    {/* Area Pilih File */}
                    {!fileName ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <UploadCloud size={24} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-semibold text-slate-700">Klik untuk memilih berkas Excel</span>
                                <p className="text-xs text-slate-400">Mendukung file .xlsx, .xls, dan .csv</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                            <div className="flex items-center gap-2.5">
                                <FileSpreadsheet className="text-emerald-600" size={20} />
                                <div>
                                    <p className="text-xs font-semibold text-slate-800">{fileName}</p>
                                    <p className="text-[11px] text-slate-400">
                                        {parsedRows.length} total baris terdeteksi ({validRows.length} valid)
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isLoading}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                                Ganti File
                            </button>
                        </div>
                    )}

                    {/* Loading State saat parse */}
                    {isParsing && (
                        <div className="py-8 text-center text-slate-400">
                            <Loader2 size={24} className="mx-auto animate-spin text-blue-600" />
                            <span className="mt-2 block text-xs">Membaca isi berkas Excel...</span>
                        </div>
                    )}

                    {/* Tabel Preview Produk */}
                    {parsedRows.length > 0 && !isParsing && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Preview Data Produk
                                </span>
                                {hasInvalid && (
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                        <AlertTriangle size={13} />
                                        <span>Beberapa baris tidak lengkap dan akan dilewati saat submit</span>
                                    </div>
                                )}
                            </div>

                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="w-10 px-3 py-2 text-center">Status</th>
                                                <th className="px-4 py-2">Nama Produk</th>
                                                <th className="px-4 py-2">Satuan Dasar</th>
                                                <th className="px-4 py-2">HPP Modal</th>
                                                <th className="px-4 py-2">Satuan Tambahan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parsedRows.map((row, idx) => (
                                                <tr
                                                    key={idx}
                                                    className={row.isValid ? 'hover:bg-slate-50/60' : 'bg-rose-50/50'}
                                                >
                                                    <td className="px-3 py-2 text-center">
                                                        {row.isValid ? (
                                                            <CheckCircle2 size={15} className="mx-auto text-emerald-500" />
                                                        ) : (
                                                            <span title={row.errorMsg}>
                                                                <AlertTriangle size={15} className="mx-auto text-rose-500" />
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 font-medium text-slate-800">
                                                        {row.data.name || <span className="text-rose-500 italic">Kosong</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-600">{row.data.baseUnit}</td>
                                                    <td className="px-4 py-2 font-mono font-medium text-slate-700">
                                                        Rp {row.data.costPrice.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {row.data.additionalUnits.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {row.data.additionalUnits.map((u, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700"
                                                                    >
                                                                        {u.unitName} ({u.conversionQty} {row.data.baseUnit})
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-[10px]">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="flex items-center justify-between border-t border-slate-100 p-6 pt-4">
                    <span className="text-xs text-slate-500">
                        {validRows.length} dari {parsedRows.length} data siap didaftarkan
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={validRows.length === 0 || isLoading}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 size={13} className="animate-spin" />}
                            <span>Submit ({validRows.length} Produk)</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};