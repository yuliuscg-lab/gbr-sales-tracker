import { OrderStatus } from "@prisma/client";
import { Request, Response } from "express";
import { orderService } from "../services/order.service";
import { success } from "../utils/response";

export class OrderController {
    async getAll(req:Request, res:Response) {
        const { customerId, status, search } = req.query;

        const orders = await orderService.getAllOrders({
            customerId: customerId as string | undefined,
            status: status as OrderStatus | undefined,
            search: search as string | undefined,
        });

        return success (
            res,
            200,
            "Berhasil mengambil data order",
            orders
        );
    }

    async getById(req:Request, res:Response) {
        const { id } = req.params;
        const order = await orderService.getOrderById(id.toString());
        return success (
            res,
            200,
            "Berhasil mengambil data order",
            order
        );
    }

    async create(req: Request, res: Response) {
        const {customerId, orderNo, dueDate, notes, items } = req.body;

        const newOrder = await orderService.createOrder({
            customerId,
            orderNo,
            dueDate,
            notes,
            items,
        });

        return success(
            res,
            201, 
            "Order berhasil dibuat",
            newOrder
        );
    }

    async update(req:Request, res:Response) {
        const { id } = req.params;
        const { dueDate, notes, status } = req.body;

        const updatedOrder = await orderService.updateOrder(id.toString(), {
            dueDate,
            notes,
            status,
        });

        return success (
            res,
            200,
            "Order berhasil diperbarui",
            updatedOrder
        );
    }

    async cancel(req:Request, res:Response) {
        const { id } = req.params;
        const { reason } = req.body;

        const cancelledOrder = await orderService.cancelOrder(id.toString(),reason);
        return success (
            res,
            200,
            "Order berhasil dibatalkan", 
            cancelledOrder
        );
    }
}

export const orderController = new OrderController();