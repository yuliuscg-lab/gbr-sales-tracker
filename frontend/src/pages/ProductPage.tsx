import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Package, Plus, Edit2, Trash2, Loader2, Tag, UploadCloud, ChevronDown } from 'lucide-react';
import { productApi } from '../api/product';
import { ProductFormData } from '../validation/product.validation';
import { Product } from '../types/product.type';
import { ProductModal } from '../components/products/ProductModal';
import { MassUploadModal } from '../components/products/MassUploadModal';
import { SearchBar } from '@/components/common/SearchBar';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

export const ProductsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMassUploadOpen, setIsMassUploadOpen] = useState(false);
    const massMenuRef = useRef<HTMLDivElement>(null);

    const [productToDelete, setProductToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
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

    // 1. Fetch Produk
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products', debouncedSearch],
        queryFn: () => productApi.getAll(debouncedSearch),
    });

    // 2. Mutasi Simpan Single Produk
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

    // 3. Mutasi Mass Upload Produk
    const massUploadMutation = useMutation({
        mutationFn: async (items: ProductFormData[]) => productApi.createMany(items),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast(`${res.count} produk berhasil didaftarkan secara massal`);
            setIsMassUploadOpen(false);
        },
        onError: () => {
            alert('Terjadi kesalahan saat memproses pendaftaran massal produk.');
        },
    });

    // 4. Mutasi Hapus
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

    const handleDeleteClick = (id: string, name: string) => {
        setProductToDelete({ id, name });
    };

    const handleConfirmDelete = () => {
        if (productToDelete) {
            deleteMutation.mutate(productToDelete.id, {
                onSettled: () => {
                    setProductToDelete(null);
                },
            });
        }
    };

    return (
        <div className="space-y-6">
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-in fade-in">
                    {toastMessage}
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                        Product Master Data
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500">
                        Manage product catalog, base units, and wholesale packaging ratios
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Tombol Opsi Mass Upload */}
                    <div className="relative" ref={massMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsMassUploadOpen(!isMassUploadOpen)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                        >
                            <UploadCloud size={16} className="text-slate-500" />
                            <span>Mass Upload</span>
                        </button>

                        
                    </div>

                    {/* Tombol Add New Product */}
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="hidden md:flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Add New Product</span>
                    </button>
                </div>
            </div>

            <SearchBar
                search={search}
                setSearch={setSearch}
                text="Search SKU or Product Name..."
            />

            {/* Tabel Produk */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="w-12 px-4 py-3.5 text-center">No.</th>
                                <th className="px-6 py-3.5">Product Name</th>
                                <th className="px-6 py-3.5">Sales UOM</th>
                                <th className="px-6 py-3.5">HPP per Base Unit</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <Loader2 size={24} className="mx-auto animate-spin text-blue-600" />
                                        <span className="mt-2 block text-xs">Loading Product Catalog...</span>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <Package size={32} className="mx-auto text-slate-300" />
                                        <p className="mt-2 text-sm">No product registered.</p>
                                    </td>
                                </tr>
                            ) : (
                                products.map((prod, index) => {
                                    const secondaryUnits =
                                        prod.units?.filter(
                                            (u) => Number(u.conversionQty) > 1
                                        ) || [];

                                    return (
                                        <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-4 text-center font-medium text-slate-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800 text-xs lg:text-sm">
                                                    {prod.name}
                                                </div>
                                                <div className="font-mono text-[12px] text-blue-600">
                                                    {prod.code}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="inline-flex items-center rounded-md gap-1 border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                                        <Tag size={11} className="text-blue-400" />
                                                        <strong>{prod.baseUnit}</strong>
                                                    </span>
                                                    {secondaryUnits.map((u) => (
                                                        <span
                                                            key={u.id}
                                                            className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                                                        >
                                                            <Tag size={11} className="text-blue-400" />
                                                            <span>
                                                                <strong>{u.unitName}</strong> ({u.conversionQty} {prod.baseUnit})
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-left font-semibold text-slate-800">
                                                {Number(prod.costPrice || 0).toLocaleString('id-ID', {
                                                    style: 'currency',
                                                    currency: 'IDR',
                                                    maximumFractionDigits: 0,
                                                })}
                                            </td>
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

            {/* Modal Tambah/Edit Tunggal */}
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={selectedProduct}
                serverError={serverError}
            />

            {/* Modal Mass Upload Excel */}
            <MassUploadModal
                isOpen={isMassUploadOpen}
                onClose={() => setIsMassUploadOpen(false)}
                onSubmit={async (data: ProductFormData[]) => {
                    await massUploadMutation.mutateAsync(data);
                }}
                isLoading={massUploadMutation.isPending}
            />

            {/* Modal Konfirmasi Hapus */}
            <ConfirmDeleteModal
                title="Delete Product"
                message={
                    <span className="text-sm">
                        Are you sure you want to delete product <br />
                        <strong>{productToDelete?.name}</strong>?
                    </span>
                }
                onClose={() => setProductToDelete(null)}
                onConfirm={handleConfirmDelete}
                isLoading={deleteMutation.isPending}
                isOpen={!!productToDelete}
            />

            {/* Floating Action Button (Mobile) */}
            <button
                type="button"
                onClick={handleOpenCreateModal}
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 sm:hidden cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all focus:outline-none"
                title="Add New Product"
                aria-label="Add New Product"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};