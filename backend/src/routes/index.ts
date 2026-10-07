import { Router } from "express";
import { success } from "../utils/response";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import customerRouter from "./customer.route";
import orderRouter from "./order.route";
import productRouter from "./product.route";
import paymentRouter from "./payment.route";

const router = Router();

router.get("/health", (req,res) => {
    return success(res, 200, "API is running");
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use("/customers", customerRouter);
router.use("/orders", orderRouter);
router.use("/products", productRouter);
router.use("/payments", paymentRouter);

export default router;