import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { productionController } from "../controllers/production.controller";
import { createProductionCardSchema } from "../validation/production.validator";
import { validate } from "../middlewares/validate.middleware";

const router = Router();
router.use(authenticate);
router.get("/queue", productionController.getQueue);
router.post("/cards", validate(createProductionCardSchema), productionController.createCard);
router.get("/history", productionController.getHistory);

export default router;