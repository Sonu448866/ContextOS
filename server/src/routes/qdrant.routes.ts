import { Router } from 'express';
import { getQdrantStatus, syncQdrant } from '../controllers/qdrant.controller';

const router = Router();

router.get('/qdrant/status', getQdrantStatus);
router.post('/qdrant/sync', syncQdrant);

export default router;
