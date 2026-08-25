import { AppDataSource } from '../data-source';
import { Category, Product } from '../entities';

export class CategoriesService {
  private categoryRepo = AppDataSource.getRepository(Category);
  private productRepo = AppDataSource.getRepository(Product);

  async getAllCategories() {
    const categories = await this.categoryRepo.find({
      order: { name: 'ASC' },
    });

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await this.productRepo.count({
          where: { category: { id: cat.id } },
        });
        return {
          ...cat,
          productCount,
        };
      })
    );

    return categoriesWithCount;
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.categoryRepo.findOne({
      where: { slug },
    });

    if (!category) {
      const error: any = new Error(`Category not found with slug: ${slug}`);
      error.status = 404;
      throw error;
    }

    const productCount = await this.productRepo.count({
      where: { category: { id: category.id } },
    });

    return {
      ...category,
      productCount,
    };
  }
}

export const categoriesService = new CategoriesService();
