import { AppError } from "../errors/AppError";
import { customerRepository } from "../repositories/customer.repository";
import { CreateCustomerDTO, UpdateCustomerDTO } from "../types/customer.type";

export class CustomerService {
    async getAllCustomers(search?: string) {
        return customerRepository.findMany(search);
    }

    async getCustomerById(id: string) {
        const customer = await customerRepository.findById(id);

        if (!customer) {
            throw new AppError("Customer tidak ditemukan", 404);
        }
        return customer;
    }

    async createCustomer (data: CreateCustomerDTO) {
        const trimmedName = data.name.trim();

        if (!trimmedName) {
            throw new AppError("Nama Customer Wajib Diisi", 400);
        }

        const exist = await customerRepository.findByName(trimmedName);

        if(exist) {
            throw new AppError("Customer dengan nama ini sudah ada", 400);
        }

        return customerRepository.create({
            name:trimmedName,
            phone: data.phone?.trim() || null,
            notes: data.notes?.trim() || null,
            maxUnpaidInvoices: data.maxUnpaidInvoices || 2
        });
    }

    async updateCustomer (id:string, data: UpdateCustomerDTO) {
        const customer = await customerRepository.findById(id);

        if(!customer) {
            throw new AppError("Customer tidak ditemukan", 404);
        }

        if(data.maxUnpaidInvoices !== undefined && data.maxUnpaidInvoices! < 0) {
            throw new AppError("Batas Invoice Maksimal Tidak Boleh Negatif",400);
        }

        if (data.name) {
            const trimmedName = data.name?.trim();
            if (!trimmedName) {
                throw new AppError("Nama Customer Wajib Diisi", 400);
            }

            if (trimmedName && trimmedName !== customer.name) {
                const exist = await customerRepository.findByName(trimmedName);

                if(exist) {
                    throw new AppError("Customer dengan nama ini sudah ada", 400);
                }
            }``
        }

        return customerRepository.update(id,{
            name: data.name?.trim(),
            phone: data.phone?.trim() || null,
            notes: data.notes?.trim() || null,
            maxUnpaidInvoices: data.maxUnpaidInvoices || 2
        });
    }

    async deleteCustomer (id:string) {
        const customer = await customerRepository.findById(id);

        if(!customer) {
            throw new AppError("Customer tidak ditemukan", 404);
        }

        if(customer.numInvoices > 0) {
            throw new AppError("Customer tidak bisa dihapus karena ada invoice yang belum dibayar!",400);
        }

        return customerRepository.delete(id);
    }
}

export const customerService = new CustomerService();