import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderRecord, orderApi } from '../../api/order';
import { X, CreditCard, Loader2, AlertCircle, Search} from 'lucide-react';
import { PaymentRequest } from '@/types/payment.type';
import { paymentApi } from '@/api/payment';

interface AddPaymentModalProps {
    isOpen: boolean;
    order?: OrderRecord | null;
    onClose: () => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
    isOpen,
    order = null,
    onClose,
}) => {
    const queryClient = useQueryClient();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // State internal untuk menangani order terpilih
    const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(order);
    const [orderSearchText, setOrderSearchText] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Fetch daftar order yang belum lunas untuk autocomplete di PaymentsPage
    const isLocked = Boolean(order);
    const { data: availableOrders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['unpaid-orders-autocomplete'],
        queryFn: async () => {
            const res = await orderApi.getAll();
            // Ambil order yang aktif dan belum lunas
            return res.filter(
                (o) => o.status === 'UNPAID' || o.status === 'PARTIALLY_PAID'
            );
        },
        enabled: isOpen && !isLocked,
    });

    // Filter autocomplete berdasarkan ketikan user
    const filteredOrders = useMemo(() => {
        if (!orderSearchText.trim()) return availableOrders;
        const q = orderSearchText.toLowerCase();
        return availableOrders.filter(
            (o) =>
                o.orderNo.toLowerCase().includes(q) ||
                (o.customer?.name && o.customer.name.toLowerCase().includes(q))
        );
    }, [availableOrders, orderSearchText]);

    // Kalkulasi sisa tagihan dari order yang sedang aktif dipilih
    const remaining = selectedOrder
        ? Math.max(0, selectedOrder.totalAmount - (selectedOrder.paidAmount || 0))
        : 0;

    const today = new Date().toISOString().split('T')[0];
    const [amount, setAmount] = useState<number | string>('');
    const [method, setMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
    const [paymentDate, setPaymentDate] = useState(today);
    const [note, setNote] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Sinkronisasi state saat modal dibuka atau prop order berubah
    useEffect(() => {
        if (isOpen) {
            if (order) {
                setSelectedOrder(order);
                setOrderSearchText(order.orderNo);
                const rem = Math.max(0, order.totalAmount - (order.paidAmount || 0));
                setAmount(rem);
            } else {
                setSelectedOrder(null);
                setOrderSearchText('');
                setAmount('');
            }
            setMethod('CASH');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setNote('');
            setErrorMsg(null);
            setIsDropdownOpen(false);
        }
    }, [isOpen, order]);

    // Tutup dropdown saat klik di luar area
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const paymentMutation = useMutation({
        mutationFn: async (payload: PaymentRequest) => {
            return await paymentApi.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['unpaid-orders-autocomplete'] });
            onClose();
        },
        onError: (err: any) => {
            setErrorMsg(
                err.response?.data?.message || 'Gagal menyimpan pembayaran'
            );
        },
    });

    if (!isOpen) return null;

    const handleSelectOrder = (ord: OrderRecord) => {
        setSelectedOrder(ord);
        setOrderSearchText(ord.orderNo);
        const rem = Math.max(0, ord.totalAmount - (ord.paidAmount || 0));
        setAmount(rem);
        setIsDropdownOpen(false);
        setErrorMsg(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!selectedOrder) {
            setErrorMsg('Silakan pilih nomor order terlebih dahulu');
            return;
        }

        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            setErrorMsg('Amount must be greater than 0');
            return;
        }
        if (numAmount > remaining) {
            setErrorMsg(
                `Amount exceeds remaining balance (Rp ${remaining.toLocaleString('id-ID')})`
            );
            return;
        }

        paymentMutation.mutate({
            orderId: selectedOrder.id,
            amount: numAmount,
            paymentMethod: method,
            paymentDate: new Date(paymentDate).toISOString(),
            notes: note.trim() || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                onClick={() => !paymentMutation.isPending && onClose()}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">
                                Add Payment
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={paymentMutation.isPending}
                        className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {errorMsg && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 border border-rose-200">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                    {/* Field Order No. */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-semibold tracking-wider text-slate-600">
                            Order No. *
                        </label>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                placeholder={isLocked ? '' : 'Type Order No. or Customer...'}
                                value={orderSearchText}
                                disabled={isLocked}
                                onChange={(e) => {
                                    setOrderSearchText(e.target.value);
                                    setIsDropdownOpen(true);
                                    if (selectedOrder) {
                                        setSelectedOrder(null);
                                        setAmount('');
                                    }
                                }}
                                onFocus={() => !isLocked && setIsDropdownOpen(true)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm font-mono font-semibold focus:outline-none ${
                                    isLocked
                                        ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                                        : 'border-slate-300 bg-white text-slate-800 focus:border-emerald-600'
                                }`}
                                required
                            />
                            {!isLocked && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                    <Search size={14} />
                                </div>
                            )}
                        </div>

                        {/* Dropdown Auto-Complete (Khusus PaymentsPage) */}
                        {!isLocked && isDropdownOpen && (
                            <div className="absolute left-0 z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                {isLoadingOrders ? (
                                    <div className="flex items-center justify-center p-3 text-xs text-slate-400">
                                        <Loader2 size={14} className="animate-spin mr-1.5" />
                                        Loading orders...
                                    </div>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-400">
                                        No unpaid order found
                                    </div>
                                ) : (
                                    filteredOrders.map((ord) => {
                                        const ordRemaining = Math.max(
                                            0,
                                            ord.totalAmount - (ord.paidAmount || 0)
                                        );
                                        return (
                                            <button
                                                key={ord.id}
                                                type="button"
                                                onClick={() => handleSelectOrder(ord)}
                                                className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors"
                                            >
                                                <div>
                                                    <div className="font-mono font-bold text-slate-800">
                                                        {ord.orderNo}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {ord.customer?.name || 'Pelanggan Umum'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-semibold text-rose-600">
                                                        Rp {ordRemaining.toLocaleString('id-ID')}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400">
                                                        Remaining
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* Info Sisa Tagihan */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm border border-slate-100">
                        <span className="text-slate-500">Remaining Amount :</span>
                        <span className="font-bold text-rose-600">
                            {selectedOrder
                                ? `Rp ${remaining.toLocaleString('id-ID')}`
                                : '-'}
                        </span>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-semibold tracking-wider text-slate-600">
                            Amount (Rp) *
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            disabled={!selectedOrder}
                            value={
                                amount
                                    ? Number(amount).toLocaleString('id-ID')
                                    : ''
                            }
                            onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '');
                                let num = clean ? parseInt(clean, 10) : 0;
                                if (remaining && num > remaining) num = remaining;
                                setAmount(num);
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold tracking-wider text-slate-600">
                                Payment Method *
                            </label>
                            <select
                                value={method}
                                onChange={(e) =>
                                    setMethod(
                                        e.target.value as 'CASH' | 'TRANSFER'
                                    )
                                }
                                className="cursor-pointer mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-[12px] text-slate-800 focus:border-emerald-600 focus:outline-none"
                            >
                                <option className="text-[12px]" value="CASH">
                                    Tunai (Cash)
                                </option>
                                <option
                                    className="text-[12px]"
                                    value="TRANSFER"
                                >
                                    Transfer Bank
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold tracking-wider text-slate-600">
                                Payment Date *
                            </label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold tracking-wider text-slate-600">
                            Notes (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="Example: Deposit / installment"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                        />
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={paymentMutation.isPending}
                            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={paymentMutation.isPending || !selectedOrder}
                            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {paymentMutation.isPending && (
                                <Loader2 size={13} className="animate-spin" />
                            )}
                            <span>Save Payment</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};