import { Router } from "express";
import { success } from "../utils/response";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import customerRouter from "./customer.route";
import invoiceRouter from "./invoice.route";
import productRouter from "./product.route";

const router = Router();

router.get("/health", (req,res) => {
    return success(res, 200, "API is running");
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use("/customers", customerRouter);
router.use("/invoices", invoiceRouter);
router.use("products", productRouter);

export default router;