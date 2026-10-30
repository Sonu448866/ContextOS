import { Router } from 'express';
import multer from 'multer';
import {
  createKnowledge,
  uploadKnowledgeFile,
  listProjectKnowledge,
  getKnowledgeSource,
  deleteKnowledgeSource,
  analyzeKnowledgeSource,
  commitReviewedExtraction
} from '../controllers/knowledge.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createKnowledgeSchema, commitExtractionSchema } from '../validators/schemas';
import { env } from '../config/env';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024
  }
});

const router = Router();

// Project nested routes
router.get('/projects/:projectId/knowledge', listProjectKnowledge);
router.post(
  '/projects/:projectId/knowledge',
  validateRequest({ body: createKnowledgeSchema }),
  createKnowledge
);
router.post(
  '/projects/:projectId/knowledge/upload',
  upload.single('file'),
  uploadKnowledgeFile
);

// Source direct routes
router.get('/knowledge/:sourceId', getKnowledgeSource);
router.delete('/knowledge/:sourceId', deleteKnowledgeSource);
router.post('/knowledge/:sourceId/analyze', analyzeKnowledgeSource);
router.post(
  '/knowledge/:sourceId/commit',
  validateRequest({ body: commitExtractionSchema }),
  commitReviewedExtraction
);

export default router;
