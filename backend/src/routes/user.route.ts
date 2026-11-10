import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.post("/", userController.create);
router.get("/", userController.getAll);
router.get("/:id", userController.getById);


export default router;