import React, { useState, useEffect } from 'react';
import { X, Loader2, DollarSign } from 'lucide-react';
import { ExpensePayload, ExpenseRecord, ExpenseType } from '../../api/expense';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ExpensePayload) => Promise<void>;
    initialData?: ExpenseRecord | null;
    isLoading?: boolean;
}

const OPERATIONAL_CATEGORIES = [
    'Gaji / Upah',
    'Utilitas (Listrik, Air, Internet)',
    'Transportasi / Bensin',
    'Perlengkapan Toko / ATK',
    'Konsumsi / Kas Kecil',
    'Pemeliharaan / Perbaikan',
    'Packaging / Dus / Botol',
    'Lainnya',
];

const MATERIAL_CATEGORIES = [
    'Bahan Umpan / Bandul',
    'Alat Pancing / Aksesoris',
    'Essen / Minyak Ikan',
    'Plastik / Stiker'
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}) => {
    const [expenseDate, setExpenseDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [type, setType] = useState<ExpenseType>('OPERATIONAL');
    const [selectedCategory, setSelectedCategory] = useState(
        OPERATIONAL_CATEGORIES[0]
    );
    const [customCategory, setCustomCategory] = useState('');
    const [amountStr, setAmountStr] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setExpenseDate(
                initialData.expenseDate
                    ? initialData.expenseDate.split('T')[0]
                    : ''
            );
            setType(initialData.type);

            const list =
                initialData.type === 'OPERATIONAL'
                    ? OPERATIONAL_CATEGORIES
                    : MATERIAL_CATEGORIES;
            if (list.includes(initialData.category)) {
                setSelectedCategory(initialData.category);
                setCustomCategory('');
            } else {
                setSelectedCategory('Lainnya');
                setCustomCategory(initialData.category);
            }

            setAmountStr(
                initialData.amount
                    ? initialData.amount.toLocaleString('id-ID')
                    : ''
            );
            setNote(initialData.note || '');
        } else {
            setExpenseDate(new Date().toISOString().split('T')[0]);
            setType('OPERATIONAL');
            setSelectedCategory(OPERATIONAL_CATEGORIES[0]);
            setCustomCategory('');
            setAmountStr('');
            setNote('');
        }
        setError(null);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const currentCategories =
        type === 'OPERATIONAL' ? OPERATIONAL_CATEGORIES : MATERIAL_CATEGORIES;

    const handleTypeChange = (newType: ExpenseType) => {
        setType(newType);
        const nextCategories =
            newType === 'OPERATIONAL'
                ? OPERATIONAL_CATEGORIES
                : MATERIAL_CATEGORIES;
        setSelectedCategory(nextCategories[0]);
        setCustomCategory('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const numericAmount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;
        if (numericAmount <= 0) {
            setError('Nominal pengeluaran harus lebih dari Rp 0');
            return;
        }

        const category =
            selectedCategory === 'Lainnya'
                ? customCategory.trim()
                : selectedCategory;
        if (!category) {
            setError('Kategori pengeluaran wajib diisi');
            return;
        }

        try {
            await onSubmit({
                expenseDate,
                type,
                category,
                amount: numericAmount,
                note: note.trim() || null,
            });
            onClose();
        } catch (err: any) {
            setError(
                err?.response?.data?.message || 'Gagal menyimpan pengeluaran'
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                            <DollarSign size={18} />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                            {initialData ? 'Edit Expense' : 'Record New Expense'}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                            {error}
                        </div>
                    )}

                    {/* 1. Tipe Pengeluaran */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Expense Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleTypeChange('OPERATIONAL')}
                                className={`flex cursor-pointer items-center justify-center rounded-xl border py-2.5 text-xs md:text-sm font-semibold transition-all ${
                                    type === 'OPERATIONAL'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                Operational
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTypeChange('MATERIAL')}
                                className={`flex cursor-pointer items-center justify-center rounded-xl border py-2.5 text-xs md:text-sm font-semibold transition-all ${
                                    type === 'MATERIAL'
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                Material/Stock
                            </button>
                        </div>
                    </div>

                    {/* 2. Tanggal Pengeluaran */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Transaction Date *
                        </label>
                        <input
                            type="date"
                            required
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs md:text-sm text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
                        />
                    </div>

                    {/* 3. Kategori */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Expense Category *
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                            className="cursor-pointer w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                        >
                            {currentCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        {selectedCategory === 'Lainnya' && (
                            <input
                                type="text"
                                placeholder="Please write custom category..."
                                value={customCategory}
                                onChange={(e) =>
                                    setCustomCategory(e.target.value)
                                }
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                            />
                        )}
                    </div>

                    {/* 4. Nominal Amount */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Amount (Rp) *
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            required
                            placeholder="0"
                            value={amountStr}
                            onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '');
                                setAmountStr(
                                    clean
                                        ? parseInt(clean, 10).toLocaleString(
                                            'id-ID'
                                        )
                                        : ''
                                );
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                        />
                    </div>

                    {/* 5. Catatan / Note */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Notes (Optional)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Example: No nota supplier, rincian keperluan..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="cursor-pointer rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isLoading && (
                                <Loader2 size={13} className="animate-spin" />
                            )}
                            <span>Save</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
