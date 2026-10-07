import { Router } from "express";
import { customerController } from "../controllers/customer.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createCustomerSchema, updateCustomerSchema } from "../validation/customer.validatior";

const router = Router();

router.use(authenticate);
router.get("/", customerController.getAll);
router.get("/:id", customerController.getById);
router.post("/", validate(createCustomerSchema), customerController.create);
router.put("/:id", validate(updateCustomerSchema), customerController.update);
router.delete("/:id", customerController.delete);

export default router;