import { Router } from "express";
import { success } from "../utils/response";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import customerRouter from "./customer.route";
import orderRouter from "./order.route";
import productRouter from "./product.route";
import paymentRouter from "./payment.route";
import priceMatrixRouter from "./priceMatrix.route";
import expenseRouter from "./expense.route";
import dashboardRouter from "./dashboard.route";
import productionRouter from "./production.route";

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
router.use("/price-matrix", priceMatrixRouter);
router.use("/expenses", expenseRouter);
router.use("/dashboard", dashboardRouter);
router.use("/production", productionRouter);

export default router;