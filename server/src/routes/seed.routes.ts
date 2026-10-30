import { Router } from 'express';
import { triggerSeed } from '../controllers/seed.controller';

const router = Router();
router.post('/seed', triggerSeed);

export default router;
