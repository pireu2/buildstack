import { Request, Response, NextFunction } from 'express';
import { categoriesService } from '../services/categories.service';

export class CategoriesController {
  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.getAllCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const category = await categoriesService.getCategoryBySlug(slug as string);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
