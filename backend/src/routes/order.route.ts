import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { orderController } from "../controllers/order.controller";
import { cancelOrderSchema, crateOrderSchema, updateDeliveryStatusSchema, updateOrderSchema } from "../validation/order.validator";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.use(authenticate);
router.get("/", orderController.getAll);
router.get("/:id", orderController.getById);
router.post("/", validate(crateOrderSchema), orderController.create);
router.put("/:id", validate(updateOrderSchema), orderController.update);
router.patch("/:id/cancel", validate(cancelOrderSchema), orderController.cancel);
router.patch("/:id/delivery-status", validate(updateDeliveryStatusSchema), orderController.updateDeliveryStatus);
export default router;