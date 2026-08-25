import { Request, Response, NextFunction } from 'express';
import { productsService, ProductQueryParams } from '../services/products.service';

export class ProductsController {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        search,
        category,
        manufacturer,
        minPrice,
        maxPrice,
        sortBy,
      } = req.query;

      const queryParams: ProductQueryParams = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: typeof search === 'string' ? search : undefined,
        category: typeof category === 'string' ? category : undefined,
        manufacturer: typeof manufacturer === 'string' ? manufacturer : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy as ProductQueryParams['sortBy'],
      };

      const result = await productsService.getProducts(queryParams);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductByIdentifier(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.params;
      const product = await productsService.getProductByIdentifier(identifier as string);

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
