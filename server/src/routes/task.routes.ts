import { Router } from 'express';
import {
  listProjectTasks,
  getTask,
  createTask,
  updateTask,
  getTaskHistory,
  carryForwardTask
} from '../controllers/task.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema, carryForwardTaskSchema } from '../validators/schemas';

const router = Router();

router.get('/projects/:projectId/tasks', listProjectTasks);
router.post('/projects/:projectId/tasks', validateRequest({ body: createTaskSchema }), createTask);

router.get('/tasks/:taskId', getTask);
router.patch('/tasks/:taskId', validateRequest({ body: updateTaskSchema }), updateTask);
router.get('/tasks/:taskId/history', getTaskHistory);
router.post(
  '/tasks/:taskId/carry-forward',
  validateRequest({ body: carryForwardTaskSchema }),
  carryForwardTask
);

export default router;
