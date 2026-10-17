import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { OrderRecord } from '../../api/order';
import { X, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { PaymentRequest } from '@/types/payment.type';
import { paymentApi } from '@/api/payment';

interface AddPaymentModalProps {
    isOpen: boolean;
    order: OrderRecord | null;
    onClose: () => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
    isOpen,
    order,
    onClose,
}) => {
    const queryClient = useQueryClient();

    const remaining = order
        ? Math.max(0, order.totalAmount - (order.paidAmount || 0))
        : 0;
    const today = new Date().toISOString().split('T')[0];

    const [amount, setAmount] = useState<number | string>(remaining);
    const [method, setMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
    const [paymentDate, setPaymentDate] = useState(today);
    const [note, setNote] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Set ulang form saat order berubah
    React.useEffect(() => {
        if (order) {
            const rem = Math.max(
                0,
                order.totalAmount - (order.paidAmount || 0)
            );
            setAmount(rem);
            setMethod('CASH');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setNote('');
            setErrorMsg(null);
        }
    }, [order]);

    const paymentMutation = useMutation({
        mutationFn: async (payload: PaymentRequest) => {
            return await paymentApi.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            onClose();
        },
        onError: (err: any) => {
            setErrorMsg(
                err.response?.data?.message || 'Gagal menyimpan pembayaran'
            );
        },
    });

    if (!isOpen || !order) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

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
            orderId: order.id,
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
                            <p className="text-[12px] text-slate-400 font-mono">
                                {order.orderNo}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={paymentMutation.isPending}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                    {/* Info Sisa Tagihan */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm border border-slate-100">
                        <span className="text-slate-500">Remaining Amount :</span>
                        <span className="font-bold text-rose-600">
                            Rp {remaining.toLocaleString('id-ID')}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold tracking-wider text-slate-600">
                            Amount (Rp) *
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
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
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
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
                            disabled={paymentMutation.isPending}
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
