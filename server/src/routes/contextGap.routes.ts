import { Router } from 'express';
import {
  analyzeGaps,
  listProjectGaps,
  updateGapStatus
} from '../controllers/contextGap.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { updateGapStatusSchema } from '../validators/schemas';

const router = Router();

router.get('/projects/:projectId/context-gaps', listProjectGaps);
router.post('/projects/:projectId/context-gaps/analyze', analyzeGaps);
router.patch(
  '/context-gaps/:gapId',
  validateRequest({ body: updateGapStatusSchema }),
  updateGapStatus
);

export default router;
