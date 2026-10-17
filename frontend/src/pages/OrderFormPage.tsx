import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { AxiosError } from 'axios';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    User,
    Search,
    AlertCircle,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    Package,
    Receipt,
    X,
    AlertTriangle,
    Truck,
    Lock,
} from 'lucide-react';

import { customerApi } from '../api/customer';
import { productApi } from '../api/product';
import { priceMatrixApi } from '../api/priceMatrix';
import { orderApi } from '../api/order';
import {
    createOrderSchema,
    OrderFormData,
    UpdateOrderFormData,
    updateOrderSchema,
} from '../validation/order.validation';
import { Product } from '../types/product.type';
import { Customer } from '@/types/customer.type';

export const OrderFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [serverError, setServerError] = useState<string | null>(null);

    // Autocomplete Customer
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    // Modal Konfirmasi Pergantian Customer (Hanya saat Create)
    const [pendingCustomer, setPendingCustomer] = useState<Customer | null>(
        null
    );

    // Autocomplete Produk per Baris
    const [productSearches, setProductSearches] = useState<{
        [key: number]: string;
    }>({});
    const [activeProductDropdown, setActiveProductDropdown] = useState<
        number | null
    >(null);
    const productDropdownRefs = useRef<{
        [key: number]: HTMLDivElement | null;
    }>({});

    const formatDateForInput = (dateValue?: string | Date | null) => {
        if (!dateValue) return '';
        const d = new Date(dateValue);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<OrderFormData>({
        resolver: zodResolver(
            isEditMode ? (updateOrderSchema as any) : createOrderSchema
        ),
        defaultValues: {
            customerId: '',
            orderNo: '',
            dueDate: getTodayDateString(),
            deliveryDate: getTodayDateString(),
            notes: '',
            deliveryFee: 0,
            items: [
                {
                    productId: '',
                    productUnitId: '',
                    name: '',
                    unitName: '',
                    conversionQty: 1,
                    quantity: 1,
                    unitPrice: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const selectedCustomerId = watch('customerId');
    const watchedItems = watch('items');

    // Fetch Order saat Edit Mode
    const { data: existingOrder, isLoading: isOrderLoading } = useQuery({
        queryKey: ['order', id],
        queryFn: () => orderApi.getById(id!),
        enabled: isEditMode,
    });

    // Fetch Customers
    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => customerApi.getAll(),
    });

    // Fetch Produk
    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: () => productApi.getAll(),
    });

    // Fetch Matrix Harga Customer Terpilih
    const { data: customerPriceMatrix = [] } = useQuery({
        queryKey: ['price-matrix', selectedCustomerId],
        queryFn: () => priceMatrixApi.getByCustomerId(selectedCustomerId),
        enabled: !!selectedCustomerId && !isEditMode,
    });

    // Sinkronisasi data awal saat edit mode
    useEffect(() => {
        if (isEditMode && existingOrder) {
            const formattedItems = (existingOrder.items || []).map(
                (item: any) => ({
                    productId: item.productId || item.product?.id || '',
                    productUnitId: item.productUnitId || item.unit?.id || '',
                    name:
                        item.name ||
                        item.productName ||
                        item.product?.name ||
                        '',
                    unitName: item.unitName || item.unit?.unitName || '',
                    conversionQty: Number(item.conversionQty) || 1,
                    quantity: Number(item.quantity) || 1,
                    unitPrice: Number(item.unitPrice) || 0,
                })
            );

            reset({
                customerId: existingOrder.customerId || '',
                orderNo: existingOrder.orderNo || '',
                dueDate: formatDateForInput(existingOrder.dueDate),
                deliveryDate: formatDateForInput(existingOrder.deliveryDate),
                notes: existingOrder.notes || '',
                deliveryFee: Number(existingOrder.deliveryFee) || 0,
                items: formattedItems.length > 0 ? formattedItems : [],
            });

            if (existingOrder.customer?.name) {
                setCustomerSearch(existingOrder.customer.name);
            }

            const initialSearches: { [key: number]: string } = {};
            formattedItems.forEach((item: any, idx: number) => {
                initialSearches[idx] = item.name;
            });
            setProductSearches(initialSearches);
        }
    }, [isEditMode, existingOrder, reset]);

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

    useEffect(() => {
        if (selectedCustomer && !customerSearch) {
            setCustomerSearch(selectedCustomer.name);
        }
    }, [selectedCustomer, customerSearch]);

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(customerSearch))
    );

    // Event listener klik di luar dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                customerDropdownRef.current &&
                !customerDropdownRef.current.contains(event.target as Node)
            ) {
                setIsCustomerDropdownOpen(false);
            }

            if (
                activeProductDropdown !== null &&
                productDropdownRefs.current[activeProductDropdown] &&
                !productDropdownRefs.current[activeProductDropdown]?.contains(
                    event.target as Node
                )
            ) {
                setActiveProductDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [activeProductDropdown]);

    const lookupCustomerPrice = (
        matrix: typeof customerPriceMatrix,
        productId: string,
        productUnitId: string
    ): number | null => {
        if (!matrix || matrix.length === 0) return null;
        const matchedProduct = matrix.find((p) => p.productId === productId);
        const matchedUnit = matchedProduct?.units?.find(
            (u) => u.productUnitId === productUnitId
        );
        return matchedUnit &&
            matchedUnit.price !== null &&
            matchedUnit.price !== undefined
            ? matchedUnit.price
            : null;
    };

    const handleSelectCustomer = (customer: Customer) => {
        if (isEditMode) return;

        const hasExistingItems = watchedItems.some((item) => !!item.productId);
        if (
            hasExistingItems &&
            selectedCustomerId &&
            selectedCustomerId !== customer.id
        ) {
            setPendingCustomer(customer);
            setIsCustomerDropdownOpen(false);
            return;
        }

        applySelectedCustomer(customer);
    };

    const applySelectedCustomer = (customer: Customer) => {
        setValue('customerId', customer.id, { shouldValidate: true });
        setCustomerSearch(customer.name);
        setIsCustomerDropdownOpen(false);
        setPendingCustomer(null);
    };

    useEffect(() => {
        if (
            !isEditMode &&
            selectedCustomerId &&
            customerPriceMatrix.length > 0
        ) {
            watchedItems.forEach((item, idx) => {
                if (item.productId && item.productUnitId) {
                    const customPrice = lookupCustomerPrice(
                        customerPriceMatrix,
                        item.productId,
                        item.productUnitId
                    );
                    setValue(`items.${idx}.unitPrice`, customPrice ?? 0, {
                        shouldValidate: true,
                    });
                }
            });
        }
    }, [customerPriceMatrix, selectedCustomerId, isEditMode]);

    const handleClearCustomer = () => {
        if (isEditMode) return;
        setValue('customerId', '', { shouldValidate: true });
        setCustomerSearch('');
    };

    const handleSelectProduct = (index: number, product: Product) => {
        if (isEditMode) return;
        setValue(`items.${index}.productId`, product.id, {
            shouldValidate: true,
        });
        setValue(`items.${index}.name`, product.name, { shouldValidate: true });
        setProductSearches((prev) => ({ ...prev, [index]: product.name }));

        setValue(`items.${index}.productUnitId`, '', { shouldValidate: true });
        setValue(`items.${index}.unitName`, '');
        setValue(`items.${index}.conversionQty`, 1);
        setValue(`items.${index}.unitPrice`, 0, { shouldValidate: true });

        setActiveProductDropdown(null);
    };

    const handleClearSelectProduct = (index: number) =>{
        if (isEditMode) return;
        setValue(`items.${index}.productId`, '', { shouldValidate: true });
        setValue(`items.${index}.name`, '', { shouldValidate: true });
        setProductSearches((prev) => ({ ...prev, [index]: '' }));
        setValue(`items.${index}.productUnitId`, '', { shouldValidate: true });
        setValue(`items.${index}.unitName`, '');
        setValue(`items.${index}.conversionQty`, 1);
        setValue(`items.${index}.unitPrice`, 0, { shouldValidate: true });
        setActiveProductDropdown(null);
    }

    const handleUnitChange = (index: number, productUnitId: string) => {
        if (isEditMode) return;
        const currentProductId = watch(`items.${index}.productId`);
        const prod = products.find((p) => p.id === currentProductId);
        if (!prod) return;

        if (!productUnitId) {
            setValue(`items.${index}.productUnitId`, '');
            setValue(`items.${index}.unitName`, '');
            setValue(`items.${index}.conversionQty`, 1);
            setValue(`items.${index}.unitPrice`, 0, { shouldValidate: true });
            return;
        }

        const unit = prod.units?.find((u) => u.id === productUnitId);
        if (unit) {
            setValue(`items.${index}.productUnitId`, unit.id, {
                shouldValidate: true,
            });
            setValue(`items.${index}.unitName`, unit.unitName, {
                shouldValidate: true,
            });
            setValue(
                `items.${index}.conversionQty`,
                Number(unit.conversionQty) || 1
            );

            const customPrice = lookupCustomerPrice(
                customerPriceMatrix,
                currentProductId,
                unit.id
            );
            setValue(`items.${index}.unitPrice`, customPrice ?? 0, {
                shouldValidate: true,
            });
        }
    };

    const handleQtyChange = (index: number, delta: number) => {
        if (isEditMode) return;
        const currentQty = Number(watch(`items.${index}.quantity`)) || 1;
        const newQty = Math.max(1, currentQty + delta);
        setValue(`items.${index}.quantity`, newQty, { shouldValidate: true });
    };

    const grandTotal =
        watchedItems.reduce((acc, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unitPrice) || 0;
            return acc + qty * price;
        }, 0) + Number(watch('deliveryFee') || 0);

    // Helper konversi 'YYYY-MM-DD' ke ISO string
    const toISOStringOrNull = (dateStr?: string | null) => {
        if (!dateStr || dateStr.trim() === '') return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.toISOString();
    };

    const mutation = useMutation({
        mutationFn: (formData: OrderFormData) => {
            if (isEditMode) {
                const updatePayload: UpdateOrderFormData = {
                    deliveryDate: toISOStringOrNull(formData.deliveryDate),
                    dueDate: toISOStringOrNull(formData.dueDate),
                    notes: formData.notes?.trim() || '',
                };
                return orderApi.update(id!, updatePayload);
            }
            return orderApi.create(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            if (isEditMode) {
                queryClient.invalidateQueries({ queryKey: ['order', id] });
            }
            navigate('/orders');
        },
        onError: (err: unknown) => {
            if (err instanceof AxiosError && err.response?.data?.message) {
                setServerError(err.response.data.message);
            } else {
                setServerError(
                    `Gagal ${isEditMode ? 'memperbarui' : 'menyimpan'} pesanan. Silakan periksa kembali input Anda.`
                );
            }
        },
    });

    const onSubmit = (data: OrderFormData) => {
        setServerError(null);
        mutation.mutate(data);
    };

    const formatIDR = (val: number) =>
        Number(val).toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        });

    const validProductsCount = (watchedItems || []).filter(
        (item) => item.name && item.name.trim() !== ''
    ).length;

    if (isEditMode && isOrderLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2
                    size={32}
                    className="animate-spin text-blue-600 mb-3"
                />
                <p className="text-sm font-medium text-slate-600">
                    Memuat data pesanan...
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-16">
            {/* Header Halaman */}
            <div className="flex items-center gap-3 relative">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        {isEditMode
                            ? `Edit Order #${watch('orderNo')}`
                            : 'Create New Order'}
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/orders')}
                    className="absolute -left-12 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
            </div>

            {serverError && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
                    <AlertCircle size={18} className="shrink-0 text-rose-500" />
                    <span>{serverError}</span>
                </div>
            )}

            <form
                onSubmit={handleSubmit(onSubmit, (validationErrors) => {
                    console.error('validation error:', validationErrors);
                })}
                className="space-y-6"
                noValidate
            >
                {/* PANEL 1: CUSTOMER (TERKUNCI SAAT EDIT) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                            <User size={16} className="text-blue-600" />
                            <span>Customer</span>
                        </h2>
                        {isEditMode && (
                            <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                <Lock size={12} />
                                Locked
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="relative" ref={customerDropdownRef}>
                            <div className="relative mt-1.5">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    disabled={isEditMode}
                                    value={customerSearch}
                                    onChange={(e) => {
                                        setCustomerSearch(e.target.value);
                                        setIsCustomerDropdownOpen(true);
                                        if (selectedCustomerId) {
                                            setValue('customerId', '');
                                        }
                                    }}
                                    onFocus={() => {
                                        if (!isEditMode)
                                            setIsCustomerDropdownOpen(true);
                                    }}
                                    placeholder="Ketik untuk mencari customer..."
                                    className={`w-full rounded-xl border py-2.5 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed ${
                                        errors.customerId
                                            ? 'border-rose-400 focus:ring-rose-100'
                                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                    }`}
                                />
                                {customerSearch && !isEditMode && (
                                    <button
                                        type="button"
                                        onClick={handleClearCustomer}
                                        className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Customer (Hanya Create Mode) */}
                            {!isEditMode && isCustomerDropdownOpen && (
                                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                    {filteredCustomers.length === 0 ? (
                                        <div className="px-4 py-3 text-xs text-slate-400 text-center">
                                            Customer Not Found
                                        </div>
                                    ) : (
                                        filteredCustomers.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectCustomer(c)
                                                }
                                                className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors"
                                            >
                                                <div>
                                                    <div className="font-semibold text-slate-800">
                                                        {c.name}
                                                    </div>
                                                    {c.phone && (
                                                        <div className="text-[11px] text-slate-400">
                                                            {c.phone}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right text-[11px] text-slate-400 grid grid-cols-2 gap-2">
                                                    <div className="text-right">
                                                        Total :{' '}
                                                        <strong className="text-slate-600">
                                                            {c.totalOrders || 0}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        Unpaid :{' '}
                                                        <strong className="text-amber-600">
                                                            {c.unpaidOrdersCount ||
                                                                0}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedCustomer && (
                            <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="text-sm font-bold text-slate-800">
                                        {selectedCustomer.name}
                                    </div>
                                    <div className="text-[12px] text-slate-500">
                                        {selectedCustomer.phone ||
                                            'No Phone Number'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 border border-slate-200 shadow-2xs">
                                        <Package
                                            size={14}
                                            className="text-blue-500"
                                        />
                                        <span className="text-[12px] text-slate-600">
                                            Total Order:
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-800">
                                            {selectedCustomer.totalOrders || 0}
                                        </span>
                                    </div>

                                    <div
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border shadow-2xs ${
                                            (selectedCustomer.unpaidOrdersCount ||
                                                0) > 0
                                                ? 'border-amber-200 bg-amber-50 text-amber-800'
                                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        }`}
                                    >
                                        <Receipt size={14} />
                                        <span className="text-[12px] font-medium">
                                            Unpaid Orders:
                                        </span>
                                        <span className="text-[12px] font-bold">
                                            {selectedCustomer.unpaidOrdersCount ||
                                                0}{' '}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* PANEL 2: ORDER DETAILS (TERKUNCI SAAT EDIT) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                            <ShoppingCart size={16} className="text-blue-600" />
                            <span>Order Details</span>
                        </h2>

                        {isEditMode ? (
                            <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                <Lock size={12} />
                                Items locked in edit mode
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    append({
                                        productId: '',
                                        productUnitId: '',
                                        name: '',
                                        unitName: '',
                                        conversionQty: 1,
                                        quantity: 1,
                                        unitPrice: 0,
                                    });
                                }}
                                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                                <Plus size={15} />
                                <span>Add Product</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {fields.map((field, index) => {
                            const currentProductId = watch(
                                `items.${index}.productId`
                            );
                            const currentProduct = products.find(
                                (p) => p.id === currentProductId
                            );
                            const availableUnits = currentProduct?.units || [];
                            const quantity =
                                watch(`items.${index}.quantity`) || 0;
                            const unitPrice =
                                watch(`items.${index}.unitPrice`) || 0;
                            const subtotal = quantity * unitPrice;

                            const searchInput = productSearches[index] ?? '';
                            const filteredProducts = products.filter(
                                (p) =>
                                    p.name
                                        .toLowerCase()
                                        .includes(searchInput.toLowerCase()) ||
                                    p.code
                                        ?.toLowerCase()
                                        .includes(searchInput.toLowerCase())
                            );

                            return (
                                <div
                                    key={field.id}
                                    className={`rounded-xl border p-4 transition-all ${
                                        isEditMode
                                            ? 'border-slate-200 bg-slate-100/50'
                                            : 'border-slate-200 bg-slate-50/40'
                                    }`}
                                >
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                                        {/* Produk */}
                                        <div
                                            className="relative sm:col-span-4"
                                            ref={(el) => {
                                                productDropdownRefs.current[
                                                    index
                                                ] = el;
                                            }}
                                        >
                                            <label className="block text-[12px] font-bold tracking-wider text-slate-500 mb-1">
                                                Product *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    disabled={isEditMode}
                                                    placeholder="Type product name / SKU..."
                                                    value={
                                                        productSearches[
                                                            index
                                                        ] ??
                                                        watch(
                                                            `items.${index}.name`
                                                        ) ??
                                                        ''
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value;
                                                        setProductSearches(
                                                            (prev) => ({
                                                                ...prev,
                                                                [index]: val,
                                                            })
                                                        );
                                                        setActiveProductDropdown(
                                                            index
                                                        );

                                                        if (val === '') {
                                                            setValue(
                                                                `items.${index}.productId`,
                                                                ''
                                                            );
                                                            setValue(
                                                                `items.${index}.name`,
                                                                ''
                                                            );
                                                            setValue(
                                                                `items.${index}.productUnitId`,
                                                                ''
                                                            );
                                                            setValue(
                                                                `items.${index}.unitName`,
                                                                ''
                                                            );
                                                            setValue(
                                                                `items.${index}.unitPrice`,
                                                                0
                                                            );
                                                        }
                                                    }}
                                                    onFocus={() => {
                                                        if (!isEditMode)
                                                            setActiveProductDropdown(
                                                                index
                                                            );
                                                    }}
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                                                />
                                                {watchedItems[index].productId &&
                                                    !isEditMode && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleClearSelectProduct(index)}
                                                            className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                            </div>

                                            {!isEditMode &&
                                                activeProductDropdown ===
                                                    index && (
                                                    <div className="absolute left-0 z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                                                        {filteredProducts.length ===
                                                        0 ? (
                                                            <div className="px-3 py-2 text-[12px] text-slate-400 text-center">
                                                                Product not
                                                                found
                                                            </div>
                                                        ) : (
                                                            filteredProducts.map(
                                                                (p) => (
                                                                    <button
                                                                        key={
                                                                            p.id
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleSelectProduct(
                                                                                index,
                                                                                p
                                                                            )
                                                                        }
                                                                        className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-[12px] hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        <div>
                                                                            <div className="font-semibold text-slate-800">
                                                                                {
                                                                                    p.name
                                                                                }
                                                                            </div>
                                                                            <div className="text-[11px] text-slate-400 font-mono">
                                                                                {
                                                                                    p.code
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-[12px] text-blue-600 font-medium">
                                                                            {
                                                                                p.baseUnit
                                                                            }
                                                                        </span>
                                                                    </button>
                                                                )
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>

                                        {/* Unit Satuan */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-[12px] font-bold tracking-wider text-slate-500 mb-1">
                                                Unit *
                                            </label>
                                            <select
                                                {...register(
                                                    `items.${index}.productUnitId`
                                                )}
                                                disabled={
                                                    isEditMode ||
                                                    !currentProductId
                                                }
                                                onChange={(e) =>
                                                    handleUnitChange(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                className="cursor-pointer w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[12px] font-medium text-slate-800 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                                            >
                                                <option value="">
                                                    {watch(
                                                        `items.${index}.unitName`
                                                    ) || '-- Select --'}
                                                </option>
                                                {availableUnits.map((u) => (
                                                    <option
                                                        key={u.id}
                                                        value={u.id}
                                                    >
                                                        {u.unitName}{' '}
                                                        {Number(
                                                            u.conversionQty
                                                        ) > 1
                                                            ? `(${u.conversionQty})`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Qty */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-[12px] font-bold tracking-wider text-slate-500 mb-1">
                                                Quantity
                                            </label>
                                            <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                                                <button
                                                    type="button"
                                                    disabled={isEditMode}
                                                    onClick={() =>
                                                        handleQtyChange(
                                                            index,
                                                            -1
                                                        )
                                                    }
                                                    className="flex h-8 w-8 items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <input
                                                    type="text"
                                                    disabled={isEditMode}
                                                    inputMode="numeric"
                                                    value={
                                                        quantity === 0
                                                            ? ''
                                                            : quantity
                                                    }
                                                    onChange={(e) => {
                                                        const clean =
                                                            e.target.value.replace(
                                                                /\D/g,
                                                                ''
                                                            );
                                                        const val =
                                                            clean === ''
                                                                ? 0
                                                                : parseInt(
                                                                      clean,
                                                                      10
                                                                  );
                                                        setValue(
                                                            `items.${index}.quantity`,
                                                            val,
                                                            {
                                                                shouldValidate: true,
                                                            }
                                                        );
                                                    }}
                                                    onBlur={() => {
                                                        if (
                                                            !quantity ||
                                                            quantity < 1
                                                        ) {
                                                            setValue(
                                                                `items.${index}.quantity`,
                                                                1,
                                                                {
                                                                    shouldValidate: true,
                                                                }
                                                            );
                                                        }
                                                    }}
                                                    className="w-full text-center text-[12px] font-semibold text-slate-800 focus:outline-none  disabled:text-slate-600 disabled:cursor-not-allowed"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={isEditMode}
                                                    onClick={() =>
                                                        handleQtyChange(
                                                            index,
                                                            1
                                                        )
                                                    }
                                                    className="flex h-8 w-8 items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Harga Satuan & Subtotal */}
                                        <div className="sm:col-span-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-[12px] font-bold tracking-wider text-slate-500">
                                                    Price (Rp)
                                                </label>
                                                <span className="block text-[12px] font-bold tracking-wider text-slate-500">
                                                    Subtotal
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        disabled={
                                                            isEditMode ||
                                                            !watch(
                                                                `items.${index}.productUnitId`
                                                            )
                                                        }
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        value={
                                                            unitPrice
                                                                ? Number(
                                                                      unitPrice
                                                                  ).toLocaleString(
                                                                      'id-ID'
                                                                  )
                                                                : ''
                                                        }
                                                        onChange={(e) => {
                                                            const clean =
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    ''
                                                                );
                                                            const num = clean
                                                                ? parseInt(
                                                                      clean,
                                                                      10
                                                                  )
                                                                : 0;
                                                            setValue(
                                                                `items.${index}.unitPrice`,
                                                                num,
                                                                {
                                                                    shouldValidate: true,
                                                                }
                                                            );
                                                        }}
                                                        className="w-full text-right rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                                                    />
                                                </div>

                                                <div className="shrink-0 text-right text-[12px] font-bold text-slate-700 min-w-18.75">
                                                    {formatIDR(subtotal)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hapus Baris */}
                                        <div className="sm:col-span-1 flex justify-end">
                                            <button
                                                type="button"
                                                disabled={
                                                    isEditMode ||
                                                    fields.length === 1
                                                }
                                                onClick={() => remove(index)}
                                                className="cursor-pointer p-1.5 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                                title="Hapus Baris"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PANEL 3: DELIVERY DETAILS (DELIVERY DATE BISA DIEDIT) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                        <Truck size={16} className="text-blue-600" />
                        <span>Delivery Details</span>
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* 1. Delivery Fee (Terkunci saat Edit) */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-[12px] font-semibold tracking-wider text-slate-700">
                                    Delivery Fee (Rp)
                                </label>
                                {isEditMode && (
                                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                        <Lock size={11} /> Locked
                                    </span>
                                )}
                            </div>
                            <div className="relative mt-1.5">
                                <input
                                    type="text"
                                    disabled={isEditMode}
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={
                                        watch('deliveryFee')
                                            ? Number(
                                                  watch('deliveryFee')
                                              ).toLocaleString('id-ID')
                                            : ''
                                    }
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(
                                            /\D/g,
                                            ''
                                        );
                                        const num = clean
                                            ? parseInt(clean, 10)
                                            : 0;
                                        setValue('deliveryFee', num, {
                                            shouldValidate: true,
                                        });
                                    }}
                                    className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* 2. Delivery Date (DAPAT DIEDIT) */}
                        <div>
                            <label className="block text-[12px] font-semibold tracking-wider text-slate-700">
                                Delivery Due Date
                            </label>
                            <div className="relative mt-1.5">
                                <input
                                    type="date"
                                    {...register('deliveryDate')}
                                    className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* PANEL 4: PAYMENT DATE & NOTES (DAPAT DIEDIT) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            {/* Payment Date / Due Date (DAPAT DIEDIT) */}
                            <div>
                                <label className="block text-[12px] font-semibold tracking-wider text-slate-700">
                                    Payment Due Date
                                </label>
                                <div className="relative mt-1.5">
                                    <input
                                        type="date"
                                        {...register('dueDate')}
                                        className="block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Order Notes (DAPAT DIEDIT) */}
                            <div>
                                <label className="block text-[12px] font-semibold tracking-wider text-slate-700">
                                    Order Notes (Optional)
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Notes for delivery, warehouse address, or any special notes..."
                                    {...register('notes')}
                                    className="mt-1.5 block w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        {/* Ringkasan Biaya */}
                        <div className="flex flex-col justify-between rounded-xl bg-slate-50 p-5 border border-slate-100">
                            <div className="space-y-3">
                                <div className="text-sm font-bold tracking-wider text-slate-500">
                                    Order Summary
                                </div>
                                <div className="flex items-center justify-between text-[12px] text-slate-600">
                                    <span>Total Products :</span>
                                    <span className="font-semibold">
                                        {`${validProductsCount} product(s)`}
                                    </span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-800">
                                        Grand Total :
                                    </span>
                                    <span className="text-xl font-extrabold text-blue-600">
                                        {formatIDR(grandTotal)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => navigate('/orders')}
                                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting || mutation.isPending
                                    }
                                    className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting || mutation.isPending ? (
                                        <Loader2
                                            size={15}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <CheckCircle2 size={15} />
                                    )}
                                    <span>
                                        {isEditMode
                                            ? 'Save Changes'
                                            : 'Create Order'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Modal Pergantian Customer (Hanya Create Mode) */}
            {!isEditMode && pendingCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
                        onClick={() => setPendingCustomer(null)}
                    />
                    <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">
                                Change Customer?
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                You are changing the customer to{' '}
                                <strong className="text-slate-700">
                                    {pendingCustomer.name}
                                </strong>
                                . The list of items will be saved, but the unit
                                price will be adjusted automatically with the
                                new customer price list.
                            </p>
                        </div>

                        <div className="mt-6 flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => setPendingCustomer(null)}
                                className="w-full cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    applySelectedCustomer(pendingCustomer)
                                }
                                className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
