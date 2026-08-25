import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller';

const router = Router();

router.get('/', (req, res, next) => categoriesController.getAllCategories(req, res, next));
router.get('/:slug', (req, res, next) => categoriesController.getCategoryBySlug(req, res, next));

export default router;
