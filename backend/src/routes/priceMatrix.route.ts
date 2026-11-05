import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { priceMatrixController } from "../controllers/priceMatrix.controller";

const router = Router();

router.use(authenticate);
router.get("/lookup", priceMatrixController.lookUp);
router.get("/:customerId", priceMatrixController.getMatrix);
router.put("/:customerId", priceMatrixController.update);

export default router;
