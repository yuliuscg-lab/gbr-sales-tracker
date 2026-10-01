import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", userController.create);

router.use(authenticate);
router.get("/", userController.getAll);
router.get("/:id", userController.getById);


export default router;