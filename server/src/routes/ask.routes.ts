import { Router } from 'express';
import { askProjectQuestion } from '../controllers/ask.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { askQuestionSchema } from '../validators/schemas';

const router = Router();

router.post(
  '/projects/:projectId/ask',
  validateRequest({ body: askQuestionSchema }),
  askProjectQuestion
);

export default router;
