import { Router } from 'express';
import categoriesRoutes from './categories.routes';
import productsRoutes from './products.routes';
import projectsRoutes from './projects.routes';

const router = Router();

router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/projects', projectsRoutes);

export default router;
