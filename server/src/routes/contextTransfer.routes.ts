import { Router } from 'express';
import {
  generateTransfer,
  listProjectTransfers,
  getTransfer
} from '../controllers/contextTransfer.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { generateTransferSchema } from '../validators/schemas';

const router = Router();

router.get('/projects/:projectId/context-transfers', listProjectTransfers);
router.post(
  '/projects/:projectId/context-transfers/generate',
  validateRequest({ body: generateTransferSchema }),
  generateTransfer
);
router.get('/context-transfers/:transferId', getTransfer);

export default router;
