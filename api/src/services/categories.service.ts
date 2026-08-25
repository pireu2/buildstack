import { AppDataSource } from '../data-source';
import { Category } from '../entities';

export class CategoriesService {
  private categoryRepo = AppDataSource.getRepository(Category);

  async getAllCategories() {
    return await this.categoryRepo.find({
      order: { name: 'ASC' },
    });
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.categoryRepo.findOne({
      where: { slug },
      relations: { products: true },
    });

    if (!category) {
      const error: any = new Error(`Category not found with slug: ${slug}`);
      error.status = 404;
      throw error;
    }

    return category;
  }
}

export const categoriesService = new CategoriesService();
