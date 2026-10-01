import { Router } from "express";
import { success } from "../utils/response";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import customerRouter from "./customer.route";

const router = Router();

router.get("/health", (req,res) => {
    return success(res, 200, "API is running");
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use("/customers", customerRouter);

export default router;