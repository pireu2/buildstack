import { MigrationInterface, QueryRunner } from 'typeorm';
import { Category, Product } from '../entities';
import seedData from '../data/seed-data.json';

export class SeedInitialData1740441600000 implements MigrationInterface {
  name = 'SeedInitialData1740441600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const categoryRepo = queryRunner.manager.getRepository(Category);
    const productRepo = queryRunner.manager.getRepository(Product);

    console.log('[Migration] Seeding categories...');
    const categoryEntities = seedData.categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
    }));
    await categoryRepo.upsert(categoryEntities as any, ['slug']);

    const categories = await categoryRepo.find();
    const categoryMap = new Map(categories.map((c) => [c.slug, c]));

    console.log('[Migration] Seeding products...');
    const productEntities = seedData.products
      .filter((p) => categoryMap.has(p.categorySlug))
      .map((p) => ({
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        manufacturer: p.manufacturer,
        description: p.description,
        price: p.price,
        unit: p.unit,
        imageUrl: p.imageUrl,
        data: p.data,
        category: categoryMap.get(p.categorySlug)!,
      }));

    await productRepo.upsert(productEntities as any, ['sku']);
    console.log(`[Migration] Successfully seeded ${categories.length} categories and ${productEntities.length} products.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.getRepository(Product).clear();
    await queryRunner.manager.getRepository(Category).clear();
  }
}
