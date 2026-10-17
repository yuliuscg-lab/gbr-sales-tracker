import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
    Package,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Tag,
} from 'lucide-react';
import { productApi } from '../api/product';
import { ProductFormData } from '../validation/product.validation';
import { Product } from '../types/product.type';
import { ProductModal } from '../components/products/ProductModal';
import { SearchBar } from '@/components/common/SearchBar';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

export const ProductsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

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

    // 1. Fetch Produk dari cache / server
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products', debouncedSearch],
        queryFn: () => productApi.getAll(debouncedSearch),
    });

    // 2. Mutasi Simpan (Create / Update)
    const saveMutation = useMutation({
        mutationFn: async (formData: ProductFormData) => {
            if (selectedProduct) {
                return await productApi.update(selectedProduct.id, formData);
            }
            return await productApi.create(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast(
                selectedProduct
                    ? 'Data produk berhasil diperbarui'
                    : 'Produk baru berhasil ditambahkan'
            );
            setIsModalOpen(false);
        },
        onError: (err: unknown) => {
            if (err instanceof AxiosError && err.response?.data?.message) {
                setServerError(err.response.data.message);
            } else {
                setServerError('Gagal memproses data produk');
            }
        },
    });

    // 3. Mutasi Hapus (Soft Delete)
    const deleteMutation = useMutation({
        mutationFn: (id: string) => productApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast('Produk berhasil dihapus');
        },
        onError: (err: unknown) => {
            if (err instanceof AxiosError && err.response?.data?.message) {
                alert(err.response.data.message);
            } else {
                alert('Gagal menghapus produk');
            }
        },
    });

    const handleOpenCreateModal = () => {
        setSelectedProduct(null);
        setServerError(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (prod: Product) => {
        setSelectedProduct(prod);
        setServerError(null);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (formData: ProductFormData) => {
        setServerError(null);
        await saveMutation.mutateAsync(formData);
    };

    const handleDeleteClick = (id: string, name:string) => {
        setProductToDelete({id, name});
    }
    const handleConfirmDelete = () => {
        if (productToDelete) {
            deleteMutation.mutate(productToDelete.id, {
                onSettled: () => {
                    setProductToDelete(null);
                }
            });
        }
    }
    return (
        <div className="space-y-6">
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-in fade-in">
                {toastMessage}
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-3xl">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Product Master Data</h1>
                    </div>
                    <p className="text-sm text-slate-500">Manage product catalog, base units, and wholesale packaging ratios</p>
                </div>
                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors hover:cursor-pointer"
                >
                    <Plus size={18} />
                    <span>Add New Product</span>
                </button>
            </div>

            <SearchBar search={search} setSearch={setSearch} text="Search SKU or Product Name..."/>

            {/* Tabel Produk */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs max-w-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="w-12 px-4 py-3.5 text-center">No.</th>
                                <th className="px-6 py-3.5">Product Name</th>
                                <th className="px-6 py-3.5">Sales UOM</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-400">
                                    <Loader2 size={24} className="mx-auto animate-spin text-blue-600" />
                                    <span className="mt-2 block text-xs">Loading Product Catalog...</span>
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-400">
                                    <Package size={32} className="mx-auto text-slate-300" />
                                    <p className="mt-2 text-sm">No product registered.</p>
                                </td>
                            </tr>
                        ) : (
                            products.map((prod, index) => {
                            const secondaryUnits = prod.units?.filter((u) => Number(u.conversionQty) > 1) || [];

                            return (
                                <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                                    {/* 1. Nomor Urut */}
                                    <td className="px-4 py-4 text-center font-medium text-slate-500">
                                        {index + 1}
                                    </td>

                                    {/* 2. Nama Produk & SKU No. di bawahnya */}
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-800 text-xs lg:text-sm ">{prod.name}</div>
                                        <div className="font-mono text-[12px] text-blue-600">
                                            {prod.code}
                                        </div>
                                    </td>

                                    {/* 3. Sales UOM (Base Unit + Additional Units) */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {/* Base Unit Tag */}
                                            <span className="inline-flex items-center rounded-md gap-1 border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                                <Tag size={11} className="text-blue-400" />
                                                <strong>{prod.baseUnit}</strong>
                                            </span>

                                            {/* Additional Units Tag */}
                                            {secondaryUnits.map((u) => (
                                            <span
                                                key={u.id}
                                                className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                                            >
                                                <Tag size={11} className="text-blue-400" />
                                                <span>
                                                    <strong>{u.unitName}</strong>  ( {u.conversionQty} {prod.baseUnit} )
                                                </span>
                                            </span>
                                            ))}
                                        </div>
                                    </td>

                                    {/* 4. Action Buttons */}
                                    <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditModal(prod)}
                                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                                            title="Edit Produk"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClick(prod.id, prod.name)}
                                            disabled={deleteMutation.isPending}
                                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
                                            title="Hapus Produk"
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
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedProduct}
                serverError={serverError}
            />
            <ConfirmDeleteModal
                title='Delete Product'
                message={
                    <span className="text-sm">
                        Are you sure you want to delete product <br/>
                        <strong>{productToDelete?.name}</strong>?
                    </span>
                }
                onClose={() => setProductToDelete(null)}
                onConfirm={handleConfirmDelete}
                isLoading={deleteMutation.isPending} 
                isOpen={!!productToDelete}
            />
        </div>
    );
};