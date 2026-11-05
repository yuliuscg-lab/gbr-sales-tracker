import { Router } from "express";
import { expenseController } from "../controllers/expense.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", expenseController.getAll);
router.get("/:id", expenseController.getById);
router.post("/", expenseController.create);
router.put("/:id", expenseController.update);
router.delete("/:id", expenseController.delete);

export default router;