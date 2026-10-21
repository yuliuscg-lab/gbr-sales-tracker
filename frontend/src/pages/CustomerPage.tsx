import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import {
    Users,
    UserPlus,
    Phone,
    Edit2,
    Trash2,
    Loader2,
    Plus,
} from 'lucide-react';
import { customerApi } from '../api/customer';
import { CustomerFormData } from '../validation/customer.validation';
import { CustomerModal } from '../components/customers/CustomerModal';
import type { Customer } from '../types/customer.type';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { SearchBar } from '@/components/common/SearchBar';

export const CustomersPage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [customerToDelete, setCustomerToDelete] = useState<{id:string; name: string} | null>(null);
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
        null
    );
    const [serverError, setServerError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    //Debounce input search agar tidak request di setiap ketukan keyboard
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers', debouncedSearch],
        queryFn: () => customerApi.getAll(debouncedSearch),
    });

    const saveMutation = useMutation({
        mutationFn: async (formData: CustomerFormData) => {
            if (selectedCustomer) {
                return await customerApi.update(selectedCustomer.id, formData);
            }
            return await customerApi.create(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['customers'],
            });
            showToast(
                selectedCustomer
                    ? "Customer's data successfully updated"
                    : 'New customer data successfully added'
            );
            setIsModalOpen(false);
        },
        onError: (err: unknown) => {
            if (err instanceof AxiosError && err.response?.data?.message) {
                setServerError(err.response.data.message);
            } else {
                setServerError('Failed to process customer data.');
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => customerApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['customers'],
            });
            showToast('Customer data successfully deleted');
        },
        onError: (err: unknown) => {
            if (err instanceof AxiosError && err.response?.data?.message) {
                alert(err.response.data.message);
            } else {
                alert('Failed to delete customer data.');
            }
        },
    });

    const handleOpenCreateModal = () => {
        setSelectedCustomer(null);
        setServerError(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (cust: Customer) => {
        setSelectedCustomer(cust);
        setServerError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (formData: CustomerFormData) => {
        setServerError(null);
        await saveMutation.mutateAsync(formData);
    };

    const handleDeleteClick = (id: string, name:string) => {
        setCustomerToDelete({id, name});
    }
    const handleConfirmDelete = () => {
        if (customerToDelete) {
            deleteMutation.mutate(customerToDelete.id, {
                onSettled: () => {
                    setCustomerToDelete(null);
                }
            });
        }
    }

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
                    {toastMessage}
                </div>
            )}

            {/* Header Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                        Customer Master Data
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Manage customer master data and limit quota
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="hidden md:flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                >
                    <UserPlus size={18} />
                    <span>New Customer</span>
                </button>
            </div>

            {/* Search Bar */}
            <SearchBar search={search} setSearch={setSearch} text="Search Name or Phone Number..." />

            {/* Customer Data Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="w-12 px-4 py-3.5 text-center">
                                    No.
                                </th>
                                <th className="px-6 py-3.5">Customer</th>
                                <th className="px-6 py-3.5">
                                    Phone / Whatsapp
                                </th>
                                <th className="px-6 py-3.5 text-center">
                                    Total Orders
                                </th>
                                <th className="px-6 py-3.5 text-center">
                                    Unpaid Orders
                                </th>
                                <th className="px-6 py-3.5">Notes</th>
                                <th className="px-6 py-3.5 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-slate-400"
                                    >
                                        <Loader2
                                            size={24}
                                            className="mx-auto animate-spin text-blue-600"
                                        />
                                        <span className="mt-2 block text-xs">
                                            Loading Customer Data
                                        </span>
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-slate-400"
                                    >
                                        <Users
                                            size={32}
                                            className="mx-auto text-slate-300"
                                        />
                                        <p className="mt-2 text-sm">
                                            No Customers Found.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((cust, index) => {
                                    const unpaidCount =
                                        cust.unpaidOrdersCount || 0;
                                    const totalCount = cust.totalOrders || 0;

                                    return (
                                        <tr
                                            key={cust.id}
                                            className="hover:bg-slate-50/70 transition-colors"
                                        >
                                            {/* 1. No. */}
                                            <td className="px-4 py-4 text-center font-medium text-slate-400">
                                                {index + 1}
                                            </td>

                                            {/* 2. Customer Name */}
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">
                                                    {cust.name}
                                                </div>
                                            </td>

                                            {/* 3. Phone / Whatsapp */}
                                            <td className="px-6 py-4">
                                                {cust.phone ? (
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <Phone
                                                            size={14}
                                                            className="text-slate-400"
                                                        />
                                                        <span>
                                                            {cust.phone}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            {/* 4. Total Orders */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                                                    {totalCount}
                                                </span>
                                            </td>

                                            {/* 5. Unpaid Orders */}
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                                                        unpaidCount > 0
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-emerald-50 text-emerald-700'
                                                    }`}
                                                >
                                                    {unpaidCount}
                                                </span>
                                            </td>

                                            {/* 6. Notes */}
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {cust.notes || '-'}
                                            </td>

                                            {/* 7. Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenEditModal(
                                                                cust
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                                                        title="Edit Customer"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                cust.id,
                                                                cust.name
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                        title="Delete Customer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Dialog */}
            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedCustomer}
                serverError={serverError}
            />
            <ConfirmDeleteModal
                isOpen={!!customerToDelete}
                onClose={() => setCustomerToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirm Delete Customer"
                message={
                    <span className="text-sm">
                        Are you sure you want to delete customer<br/>
                        <strong>{customerToDelete?.name}</strong>?
                    </span>
                }
            />
            <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 sm:hidden cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all focus:outline-none"
                            title="Add New Customer"
                            aria-label="Add New Customer"
                        >
                            <Plus size={28} />
                        </button>
        </div>
    );
};
