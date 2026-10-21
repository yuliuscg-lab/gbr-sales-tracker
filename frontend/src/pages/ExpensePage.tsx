import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DollarSign,
    Search,
    Calendar,
    Loader2,
    Plus,
    Trash2,
    Edit2,
    Tag,
    RotateCcw,
    Boxes,
    ReceiptText,
    SlidersHorizontal,
    X,
    Check,
} from 'lucide-react';
import { expenseApi, ExpenseRecord, ExpensePayload, ExpenseType } from '../api/expense';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';

type SortOption =
    | 'EXPENSE_DATE_DESC'
    | 'EXPENSE_DATE_ASC'
    | 'AMOUNT_DESC'
    | 'AMOUNT_ASC';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Latest Expense Date', value: 'EXPENSE_DATE_DESC' },
    { label: 'Earliest Expense Date', value: 'EXPENSE_DATE_ASC' },
    { label: 'Highest Amount', value: 'AMOUNT_DESC' },
    { label: 'Lowest Amount', value: 'AMOUNT_ASC' },
];

const TYPE_OPTIONS: { label: string; value: ExpenseType }[] = [
    { label: 'Operational', value: 'OPERATIONAL' },
    { label: 'Material/Stock', value: 'MATERIAL' },
];

// Daftar kategori standar
export const OPERATIONAL_CATEGORIES = [
    'Gaji / Upah',
    'Utilitas (Listrik, Air, Internet)',
    'Transportasi / Bensin',
    'Perlengkapan Toko / ATK',
    'Konsumsi / Kas Kecil',
    'Pemeliharaan / Perbaikan',
    'Lainnya',
];

export const MATERIAL_CATEGORIES = [
    'Kulakan Bahan Umpan',
    'Kulakan Alat Pancing',
    'Packaging / Dus / Botol',
    'Lainnya',
];

export const ExpensesPage: React.FC = () => {
    const queryClient = useQueryClient();

    // Search state
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modal Filter & Sort visibility
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Active Filters & Sort State
    const [selectedTypes, setSelectedTypes] = useState<ExpenseType[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('EXPENSE_DATE_DESC');

    // Temporary modal state (Draft)
    const [tempTypes, setTempTypes] = useState<ExpenseType[]>([]);
    const [tempCategory, setTempCategory] = useState<string>('');
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');
    const [tempSortBy, setTempSortBy] = useState<SortOption>('EXPENSE_DATE_DESC');

    // Modal Create / Edit Expense state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

    // State untuk konfirmasi hapus modal
    const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; category: string } | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // 1. Fetch Expenses
    const {
        data: rawExpenses = [],
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['expenses'],
        queryFn: () => expenseApi.getAll(),
    });

    // 2. Mutations
    const createMutation = useMutation({
        mutationFn: (payload: ExpensePayload) => expenseApi.create(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: ExpensePayload }) =>
            expenseApi.update(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => expenseApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            setExpenseToDelete(null);
        },
    });

    // Filter modal handler
    const handleOpenModal = () => {
        setTempTypes([...selectedTypes]);
        setTempCategory(selectedCategory);
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setTempSortBy(sortBy);
        setIsFilterModalOpen(true);
    };

    const toggleTempType = (t: ExpenseType) => {
        if (tempTypes.includes(t)) {
            setTempTypes(tempTypes.filter((item) => item !== t));
        } else {
            setTempTypes([...tempTypes, t]);
        }
    };

    const handleApplyFilterSort = () => {
        setSelectedTypes(tempTypes);
        setSelectedCategory(tempCategory);
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setSortBy(tempSortBy);
        setIsFilterModalOpen(false);
    };

    const handleResetAll = () => {
        setSelectedTypes([]);
        setSelectedCategory('');
        setStartDate('');
        setEndDate('');
        setSortBy('EXPENSE_DATE_DESC');

        setTempTypes([]);
        setTempCategory('');
        setTempStartDate('');
        setTempEndDate('');
        setTempSortBy('EXPENSE_DATE_DESC');
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedTypes.length > 0) count += selectedTypes.length;
        if (selectedCategory) count += 1;
        if (startDate || endDate) count += 1;
        if (sortBy !== 'EXPENSE_DATE_DESC') count += 1;
        return count;
    }, [selectedTypes, selectedCategory, startDate, endDate, sortBy]);

    const availableCategories = useMemo(() => {
        const set = new Set<string>();
        OPERATIONAL_CATEGORIES.forEach((c) => set.add(c));
        MATERIAL_CATEGORIES.forEach((c) => set.add(c));
        rawExpenses.forEach((e) => {
            if (e.category) set.add(e.category);
        });
        return Array.from(set).filter((c) => c !== 'Lainnya');
    }, [rawExpenses]);

    // 3. Client Filter & Sort Logic
    const processedExpenses = useMemo(() => {
        let result = [...rawExpenses];

        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase();
            result = result.filter(
                (item) =>
                    item.category.toLowerCase().includes(q) ||
                    (item.note && item.note.toLowerCase().includes(q))
            );
        }

        if (selectedTypes.length > 0) {
            result = result.filter((item) => selectedTypes.includes(item.type));
        }

        if (selectedCategory) {
            result = result.filter(
                (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        if (startDate) {
            const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
            result = result.filter((item) => {
                const dateVal = item.expenseDate ? new Date(item.expenseDate).getTime() : 0;
                return dateVal >= start;
            });
        }
        if (endDate) {
            const end = new Date(`${endDate}T23:59:59.999Z`).getTime();
            result = result.filter((item) => {
                const dateVal = item.expenseDate ? new Date(item.expenseDate).getTime() : 0;
                return dateVal <= end;
            });
        }

        result.sort((a, b) => {
            const dateA = a.expenseDate ? new Date(a.expenseDate).getTime() : 0;
            const dateB = b.expenseDate ? new Date(b.expenseDate).getTime() : 0;
            const amountA = Number(a.amount) || 0;
            const amountB = Number(b.amount) || 0;

            switch (sortBy) {
                case 'EXPENSE_DATE_DESC':
                    return dateB - dateA;
                case 'EXPENSE_DATE_ASC':
                    return dateA - dateB;
                case 'AMOUNT_DESC':
                    return amountB - amountA;
                case 'AMOUNT_ASC':
                    return amountA - amountB;
                default:
                    return 0;
            }
        });

        return result;
    }, [rawExpenses, debouncedSearch, selectedTypes, selectedCategory, startDate, endDate, sortBy]);

    // 4. Perhitungan Ringkasan
    const { totalOperational, totalMaterial, totalCashOut } = useMemo(() => {
        let operational = 0;
        let material = 0;
        processedExpenses.forEach((item) => {
            if (item.type === 'OPERATIONAL') operational += Number(item.amount) || 0;
            if (item.type === 'MATERIAL') material += Number(item.amount) || 0;
        });
        return {
            totalOperational: operational,
            totalMaterial: material,
            totalCashOut: operational + material,
        };
    }, [processedExpenses]);

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

    const handleOpenCreate = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (expense: ExpenseRecord) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string, category: string) => {
        setExpenseToDelete({ id, category });
    };

    const handleConfirmDelete = () => {
        if (expenseToDelete) {
            deleteMutation.mutate(expenseToDelete.id);
        }
    };

    const handleSaveModal = async (data: ExpensePayload) => {
        if (editingExpense) {
            await updateMutation.mutateAsync({
                id: editingExpense.id,
                payload: data,
            });
        } else {
            await createMutation.mutateAsync(data);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-4 sm:gap-5">
            {/* 1. Header Bar */}
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                            Expenses & Cash Out
                        </h1>
                        {isFetching && !isLoading && (
                            <span className="inline-flex items-center text-xs font-medium text-slate-400">
                                <Loader2 size={12} className="mr-1 animate-spin text-blue-500" />
                                Updating...
                            </span>
                        )}
                    </div>
                    <p className="text-xs md:text-sm text-slate-500">
                        Recording operational expenses and inventory purchases
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="hidden sm:flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    <span>Add Expenses</span>
                </button>
            </div>

            {/* 2. Kartu Ringkasan Metrik (Kompak di Mobile View) */}
            <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
                {/* 1. Operational Expenses */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs md:text-sm font-semibold text-slate-500">
                        <span className="truncate">Operational</span>
                        <ReceiptText size={18} className="hidden sm:block text-blue-500 shrink-0" />
                    </div>
                    <div className="mt-1 sm:mt-4 text-xs sm:text-base md:text-lg font-bold text-slate-900 truncate">
                        {formatIDR(totalOperational)}
                    </div>
                </div>

                {/* 2. Material/Stock Purchases */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs md:text-sm font-semibold text-slate-500">
                        <span className="truncate">Material/Stock</span>
                        <Boxes size={18} className="hidden sm:block text-emerald-500 shrink-0" />
                    </div>
                    <div className="mt-1 sm:mt-4 text-xs sm:text-base md:text-lg font-bold text-slate-900 truncate">
                        {formatIDR(totalMaterial)}
                    </div>
                </div>

                {/* 3. Total Expenses */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs md:text-sm font-semibold text-slate-500">
                        <span className="truncate">Total Expenses</span>
                        <DollarSign size={16} className="hidden sm:block text-rose-500 shrink-0" />
                    </div>
                    <div className="mt-1 sm:mt-4 text-xs sm:text-base md:text-lg font-bold text-rose-600 truncate">
                        {formatIDR(totalCashOut)}
                    </div>
                </div>
            </div>

            {/* 3. Baris Search Bar & Button Filter & Sort */}
            <div className="flex shrink-0 gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search category or expense notes..."
                        className="w-full max-w-md rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>

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
                        <span className="hidden sm:block">Filter & Sort</span>
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

            {/* 4. Tabel Daftar Pengeluaran */}
            <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="h-full overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <tr>
                                <th className="px-5 py-3.5 text-center w-14">No.</th>
                                <th className="px-5 py-3.5">Date</th>
                                <th className="px-5 py-3.5">Type</th>
                                <th className="px-5 py-3.5">Category</th>
                                <th className="px-5 py-3.5">Notes</th>
                                <th className="px-5 py-3.5 text-right">Amount</th>
                                <th className="px-5 py-3.5 text-center w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-slate-400">
                                        <Loader2 size={24} className="mx-auto animate-spin text-blue-600" />
                                        <span className="mt-2 block text-xs">Loading expenses data...</span>
                                    </td>
                                </tr>
                            ) : processedExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-slate-400">
                                        <DollarSign size={36} className="mx-auto text-slate-300" />
                                        <p className="mt-2 text-sm font-semibold text-slate-600">
                                            Expenses Data Not Found
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            There are no transactions recorded or the data does not match the filter.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                processedExpenses.map((item: ExpenseRecord, idx: number) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-5 py-3.5 text-center font-medium text-slate-400">
                                            {idx + 1}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-800">
                                            {formatDate(item.expenseDate)}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            {item.type === 'OPERATIONAL' ? (
                                                <span className="inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                                    OPERATIONAL
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                    MATERIAL / STOCK
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                <Tag size={13} className="text-slate-400" />
                                                <span>{item.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                                            {item.note || '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                            <span className="font-bold text-slate-900">
                                                {formatIDR(item.amount)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer"
                                                    title="Edit Pengeluaran"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(item.id, item.category)}
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                                    title="Hapus Pengeluaran"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5. Modal Dialog Filter & Sort */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsFilterModalOpen(false)}
                    />

                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={18} className="text-blue-600" />
                                <h3 className="text-base font-bold text-slate-800">
                                    Filter & Sort Expenses
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
                            {/* SORT OPTIONS */}
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

                            {/* MULTI-SELECT EXPENSE TYPE */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Expense Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TYPE_OPTIONS.map((item) => {
                                        const isSelected = tempTypes.includes(item.value);
                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => toggleTempType(item.value)}
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

                            {/* FILTER CATEGORY */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    <Tag size={13} className="text-blue-500" />
                                    Expense Category
                                </label>
                                <select
                                    value={tempCategory}
                                    onChange={(e) => setTempCategory(e.target.value)}
                                    className="cursor-pointer w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">All Categories</option>
                                    {availableCategories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* FILTER EXPENSE DATE */}
                            <div>
                                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    <Calendar size={13} className="text-blue-500" />
                                    Expense Date Range
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-[11px] text-slate-400">From</span>
                                        <input
                                            type="date"
                                            value={tempStartDate}
                                            onChange={(e) => setTempStartDate(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-400">To</span>
                                        <input
                                            type="date"
                                            value={tempEndDate}
                                            min={tempStartDate}
                                            onChange={(e) => setTempEndDate(e.target.value)}
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
                                    setTempTypes([]);
                                    setTempCategory('');
                                    setTempStartDate('');
                                    setTempEndDate('');
                                    setTempSortBy('EXPENSE_DATE_DESC');
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

            {/* 6. Modal Input / Edit */}
            <ExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveModal}
                initialData={editingExpense}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            {/* 7. Modal Konfirmasi Hapus */}
            <ConfirmDeleteModal
                isOpen={!!expenseToDelete}
                onClose={() => setExpenseToDelete(null)}
                onConfirm={handleConfirmDelete}
                isLoading={deleteMutation.isPending}
                title="Hapus Pengeluaran"
                message={
                    <span>
                        Apakah Anda yakin ingin menghapus catatan pengeluaran kategori{' '}
                        <strong className="text-slate-700">"{expenseToDelete?.category}"</strong>? Tindakan ini tidak dapat dibatalkan.
                    </span>
                }
            />

            {/* 8. Floating Action Button Mobile View */}
            <button
                type="button"
                onClick={handleOpenCreate}
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 sm:hidden cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all focus:outline-none"
                title="Add Expenses"
                aria-label="Add Expenses"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};