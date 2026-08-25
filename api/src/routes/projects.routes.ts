import { Router } from 'express';
import { projectsController } from '../controllers/projects.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// All project endpoints require authentication and are scoped to the authenticated user
router.use(requireAuth);

router.get('/', (req, res, next) => projectsController.getProjects(req, res, next));
router.get('/:id', (req, res, next) => projectsController.getProjectById(req, res, next));
router.post('/', (req, res, next) => projectsController.createProject(req, res, next));
router.put('/:id', (req, res, next) => projectsController.updateProject(req, res, next));
router.delete('/:id', (req, res, next) => projectsController.deleteProject(req, res, next));

export default router;
