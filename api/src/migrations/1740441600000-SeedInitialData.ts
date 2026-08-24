import { MigrationInterface, QueryRunner } from 'typeorm';
import { Category, Product } from '../entities';
import seedData from '../data/seed-data.json';

export class SeedInitialData1740441600000 implements MigrationInterface {
  name = 'SeedInitialData1740441600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Seeding initial categories and products...');

    const categoryRepo = queryRunner.manager.getRepository(Category);
    const productRepo = queryRunner.manager.getRepository(Product);

    const categoryMap = new Map<string, Category>();

    for (const catData of seedData.categories) {
      const category = categoryRepo.create({
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        icon: catData.icon,
      });
      const savedCategory = await categoryRepo.save(category);
      categoryMap.set(catData.slug, savedCategory);
    }

    const productsToInsert: Product[] = [];

    for (const prodData of seedData.products) {
      const category = categoryMap.get(prodData.categorySlug);
      if (!category) {
        continue;
      }

      const product = productRepo.create({
        sku: prodData.sku,
        name: prodData.name,
        slug: prodData.slug,
        manufacturer: prodData.manufacturer,
        description: prodData.description,
        price: prodData.price,
        unit: prodData.unit,
        imageUrl: prodData.imageUrl,
        data: prodData.data,
        category: category,
      });
      productsToInsert.push(product);
    }

    await productRepo.save(productsToInsert);
    console.log(`[Migration] Successfully seeded ${categoryMap.size} categories and ${productsToInsert.length} products.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Reverting initial seed data...');
    await queryRunner.query('DELETE FROM products');
    await queryRunner.query('DELETE FROM categories');
    console.log('[Migration] Initial seed data deleted.');
  }
}
