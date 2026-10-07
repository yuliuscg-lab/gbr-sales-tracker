import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { validate } from "../middlewares/validate.middleware";
import { createPaymentSchema } from "../validation/payment.validator";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/", paymentController.getAll);
router.get("/:id", paymentController.getById);
router.post("/", validate(createPaymentSchema), paymentController.create);
router.patch("/:id", paymentController.deletePayment);

export default router;