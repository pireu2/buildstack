import { Router } from 'express';
import { productsController } from '../controllers/products.controller';

const router = Router();

router.get('/', (req, res, next) => productsController.getProducts(req, res, next));
router.get('/:identifier', (req, res, next) => productsController.getProductByIdentifier(req, res, next));

export default router;
