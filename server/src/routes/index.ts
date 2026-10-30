import { Router } from 'express';
import healthRoutes from './health.routes';
import projectRoutes from './project.routes';
import knowledgeRoutes from './knowledge.routes';
import taskRoutes from './task.routes';
import askRoutes from './ask.routes';
import contextTransferRoutes from './contextTransfer.routes';
import contextGapRoutes from './contextGap.routes';
import activityRoutes from './activity.routes';
import dashboardRoutes from './dashboard.routes';
import seedRoutes from './seed.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/projects', projectRoutes);
router.use('/', knowledgeRoutes);
router.use('/', taskRoutes);
router.use('/', askRoutes);
router.use('/', contextTransferRoutes);
router.use('/', contextGapRoutes);
router.use('/', activityRoutes);
router.use('/', dashboardRoutes);
router.use('/', seedRoutes);

export default router;
