import { prisma } from "../config/prisma";
import { AppError } from "../errors/AppError";
import { issuedTicketRepository } from "../repositories/issued-ticket.repository";
import { DB } from "../types/database.types";
import { generateTicketCode } from "../utils/generateTicketCode";

interface SalesOrderForIssue {
    id: string;
    ticketTypeId: number;
    ticketName: string;
    ticketPrice:number;
    qtyTickets: number;
}

export class IssuedTicketService {

    async getMyTickets(customerId:string) {
        return issuedTicketRepository.findTicketByCustomerId(customerId);
    }

    async issueTickets(tx:DB, salesOrder:SalesOrderForIssue):Promise<void> {
        const existing = await issuedTicketRepository.findBySalesOrderId(tx, salesOrder.id);
        
        if(existing.length > 0) {
            return;
        }

        const tickets = Array.from({length: salesOrder.qtyTickets}, () => ({
            ticketCode: generateTicketCode(),
            ticketTypeId: salesOrder.ticketTypeId,
            salesOrderId: salesOrder.id,
            ticketName: salesOrder.ticketName,
            ticketPrice: salesOrder.ticketPrice,
        }));

        await issuedTicketRepository.createMany(tx, tickets);
    }

    async checkIn(ticketCode:string):Promise<void> {
        const ticket = await issuedTicketRepository.findByTicketCode(prisma, ticketCode);
        
        if(!ticket) {
            throw new AppError("Tiket tidak ditemukan!", 404);
        }
        
        if(ticket.isUsed) {
            throw new AppError("Tiket sudah digunakan!", 400);
        }

        await issuedTicketRepository.markAsUsed(prisma, ticket.id);
    }
}

export const issuedTicketService = new IssuedTicketService();

