// backend/src/routes/dashboard.routes.ts
import { Router } from 'express';
import { dashboardController, DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/summary', dashboardController.getSummary);
router.get('/yearly-trend', dashboardController.getYearlyTrend);

export default router;