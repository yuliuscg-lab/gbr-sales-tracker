import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { invoiceController } from "../controllers/invoice.controller";

const router = Router();

router.use(authenticate);
router.get("/", invoiceController.getAll);
router.get("/:id", invoiceController.getById);
router.post("/", invoiceController.create);
router.put("/:id", invoiceController.update);
router.patch("/:id/cancel", invoiceController.cancel);
export default router;