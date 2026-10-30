import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProject,
  updateProject
} from '../controllers/project.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema } from '../validators/schemas';

const router = Router();

router.get('/', listProjects);
router.post('/', validateRequest({ body: createProjectSchema }), createProject);
router.get('/:projectId', getProject);
router.patch('/:projectId', validateRequest({ body: updateProjectSchema }), updateProject);

export default router;
