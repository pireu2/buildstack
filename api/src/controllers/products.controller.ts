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

      // Parse & validate pagination
      let parsedPage: number | undefined;
      if (page !== undefined) {
        const num = Number(page);
        if (!Number.isFinite(num) || num < 1) {
          return res.status(400).json({
            success: false,
            error: 'invalid_query',
            message: 'Page parameter must be a positive integer.',
          });
        }
        parsedPage = Math.floor(num);
      }

      let parsedLimit: number | undefined;
      if (limit !== undefined) {
        const num = Number(limit);
        if (!Number.isFinite(num) || num < 1 || num > 500) {
          return res.status(400).json({
            success: false,
            error: 'invalid_query',
            message: 'Limit parameter must be an integer between 1 and 500.',
          });
        }
        parsedLimit = Math.floor(num);
      }

      // Parse & validate price range
      let parsedMinPrice: number | undefined;
      if (minPrice !== undefined && minPrice !== '') {
        const num = Number(minPrice);
        if (!Number.isFinite(num) || num < 0) {
          return res.status(400).json({
            success: false,
            error: 'invalid_query',
            message: 'minPrice must be a non-negative number.',
          });
        }
        parsedMinPrice = num;
      }

      let parsedMaxPrice: number | undefined;
      if (maxPrice !== undefined && maxPrice !== '') {
        const num = Number(maxPrice);
        if (!Number.isFinite(num) || num < 0) {
          return res.status(400).json({
            success: false,
            error: 'invalid_query',
            message: 'maxPrice must be a non-negative number.',
          });
        }
        parsedMaxPrice = num;
      }

      if (
        parsedMinPrice !== undefined &&
        parsedMaxPrice !== undefined &&
        parsedMinPrice > parsedMaxPrice
      ) {
        return res.status(400).json({
          success: false,
          error: 'invalid_query',
          message: 'minPrice cannot be greater than maxPrice.',
        });
      }

      // Normalize manufacturer (string or array of strings)
      let parsedManufacturer: string | string[] | undefined;
      if (Array.isArray(manufacturer)) {
        parsedManufacturer = manufacturer.filter(
          (m): m is string => typeof m === 'string' && m.trim().length > 0
        );
      } else if (typeof manufacturer === 'string' && manufacturer.trim().length > 0) {
        parsedManufacturer = manufacturer.trim();
      }

      const queryParams: ProductQueryParams = {
        page: parsedPage,
        limit: parsedLimit,
        search: typeof search === 'string' ? search.trim() : undefined,
        category: typeof category === 'string' ? category.trim() : undefined,
        manufacturer: parsedManufacturer,
        minPrice: parsedMinPrice,
        maxPrice: parsedMaxPrice,
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
