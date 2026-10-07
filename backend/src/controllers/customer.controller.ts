import { Request, Response } from "express";
import { customerService } from "../services/customer.service";
import { success } from "../utils/response";

export class CustomerController {
    async getAll(req:Request, res:Response) {
        const search = req.query.search as string | undefined;
        const customers = await customerService.getAllCustomers(search);
        return success (
            res,
            200,
            "Berhasil mengambil data pelanggan",
            customers
        );
    }

    async getById(req:Request, res:Response) {
        const { id } = req.params;
        const customer = await customerService.getCustomerById(id.toString());
        return success (
            res,
            200,
            "Berhasil mengambil detail pelanggan",
            customer
        );
    }

    async create(req: Request, res: Response) {
        const { name, phone, notes, maxUnpaidInvoices } = req.body;
        const newCustomer = await customerService.createCustomer({ 
            name, 
            phone, 
            notes, 
            maxUnpaidInvoices: maxUnpaidInvoices !== undefined?Number(maxUnpaidInvoices):undefined });
        return success(res, 201, "Pelanggan berhasil ditambahkan", newCustomer);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { name, phone, notes, maxUnpaidInvoices } = req.body;
        const updatedCustomer = await customerService.updateCustomer(id.toString(), { name, phone, notes, maxUnpaidInvoices });
        return success(res, 200, "Data pelanggan berhasil diperbarui", updatedCustomer);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        await customerService.deleteCustomer(id.toString());
        return success(res, 200, "Pelanggan berhasil dihapus");
    }
}

export const customerController = new CustomerController();