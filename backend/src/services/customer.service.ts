import { AppError } from '../errors/AppError';
import { customerRepository } from '../repositories/customer.repository';
import { CreateCustomerDTO, UpdateCustomerDTO } from '../types/customer.type';
import { normalizePhoneNumber } from '../utils/normalizePhoneNumber';

export class CustomerService {
    async getAllCustomers(search?: string) {
        return customerRepository.findMany(search);
    }

    async getCustomerById(id: string) {
        const customer = await customerRepository.findById(id);

        if (!customer) {
            throw new AppError('Customer tidak ditemukan', 404);
        }
        const allPayments = customer.orders
            .flatMap((ord) =>
                ord.payments.map((p) => ({
                    id: p.id,
                    receiptNo: p.receiptNo,
                    amount: Number(p.amount),
                    method: p.paymentMethod,
                    paymentDate: p.paymentDate,
                    orderNo: ord.orderNo,
                }))
            )
            .sort(
                (a, b) =>
                    new Date(b.paymentDate).getTime() -
                    new Date(a.paymentDate).getTime()
            );

        // Format list order
        const formattedOrders = customer.orders.map((ord) => ({
            id: ord.id,
            orderNo: ord.orderNo,
            orderDate: ord.orderDate || ord.createdAt,
            deliveryDate: ord.deliveryDate,
            deliveryFee: Number(ord.deliveryFee || 0),
            dueDate: ord.dueDate,
            totalAmount: Number(ord.totalAmount),
            paidAmount: Number(ord.paidAmount),
            status: ord.status,
            notes: ord.notes,
            cancelReason: ord.cancelReason,
            cancelledAt: ord.cancelledAt,
            deliveryStatus: ord.deliveryStatus,
            items: ord.items,
            payments: ord.payments,
        }));

        return {
            ...customer,
            orders: formattedOrders,
            payments: allPayments,
        };
    }

    async createCustomer(data: CreateCustomerDTO) {
        const trimmedName = data.name.trim();

        if (!trimmedName) {
            throw new AppError('Nama Customer Wajib Diisi', 400);
        }

        const exist = await customerRepository.findByName(trimmedName);

        if (exist) {
            throw new AppError('Customer dengan nama ini sudah ada', 400);
        }

        return customerRepository.create({
            name: trimmedName,
            phone: normalizePhoneNumber(data.phone?.trim()) || null,
            notes: data.notes?.trim() || null,
            totalOrders: 0,
            unpaidOrdersCount: 0,
            address: data.address?.trim() || null,
            subdistrict: data.subdistrict?.trim() || null,
            district: data.district?.trim() || null,
            city: data.city?.trim() || null,
            province: data.province?.trim() || null,
            mapsUrl: data.mapsUrl?.trim() || null,
        });
    }

    async updateCustomer(id: string, data: UpdateCustomerDTO) {
        const customer = await customerRepository.findById(id);

        if (!customer) {
            throw new AppError('Customer tidak ditemukan', 404);
        }

        if (data.name) {
            const trimmedName = data.name?.trim();
            if (!trimmedName) {
                throw new AppError('Nama Customer Wajib Diisi', 400);
            }

            if (trimmedName && trimmedName !== customer.name) {
                const exist = await customerRepository.findByName(trimmedName);

                if (exist) {
                    throw new AppError(
                        'Customer dengan nama ini sudah ada',
                        400
                    );
                }
            }
            ``;
        }

        return customerRepository.update(id, {
            name: data.name?.trim(),
            phone: normalizePhoneNumber(data.phone?.trim()) || null,
            notes: data.notes?.trim() || null,
            address: data.address?.trim() || null,
            subdistrict: data.subdistrict?.trim() || null,
            district: data.district?.trim() || null,
            city: data.city?.trim() || null,
            province: data.province?.trim() || null,
            mapsUrl: data.mapsUrl?.trim() || null,
        });
    }

    async deleteCustomer(id: string) {
        const customer = await customerRepository.findById(id);

        if (!customer) {
            throw new AppError('Customer tidak ditemukan', 404);
        }

        if (customer.unpaidOrdersCount > 0) {
            throw new AppError(
                'Customer tidak bisa dihapus karena ada order yang belum dibayar!',
                400
            );
        }

        return customerRepository.delete(id);
    }
}

export const customerService = new CustomerService();
