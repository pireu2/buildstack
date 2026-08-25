import { MigrationInterface, QueryRunner } from 'typeorm';
import { KnowledgeDocument } from '../entities';
import seedKnowledge from '../data/seed-knowledge.json';

export class SeedKnowledgeData1740442000000 implements MigrationInterface {
  name = 'SeedKnowledgeData1740442000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Creating knowledge_documents table if needed...');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "knowledge_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(100) NOT NULL,
        "title" character varying(255) NOT NULL,
        "category" character varying(100) NOT NULL,
        "standard" character varying(100),
        "summary" text NOT NULL,
        "content" text NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_knowledge_documents_code" UNIQUE ("code"),
        CONSTRAINT "PK_knowledge_documents_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_knowledge_documents_category" ON "knowledge_documents" ("category");
      CREATE INDEX IF NOT EXISTS "IDX_knowledge_documents_standard" ON "knowledge_documents" ("standard");
    `);

    console.log('[Migration] Seeding knowledge documents and building standards...');
    const knowledgeRepo = queryRunner.manager.getRepository(KnowledgeDocument);
    const documentsToInsert: KnowledgeDocument[] = [];

    for (const docData of seedKnowledge) {
      const existing = await knowledgeRepo.findOne({ where: { code: docData.code } });
      if (existing) {
        continue;
      }

      const doc = knowledgeRepo.create({
        code: docData.code,
        title: docData.title,
        category: docData.category,
        standard: docData.standard,
        summary: docData.summary,
        content: docData.content,
        metadata: docData.metadata,
      });
      documentsToInsert.push(doc);
    }

    if (documentsToInsert.length > 0) {
      await knowledgeRepo.save(documentsToInsert);
    }
    console.log(`[Migration] Successfully seeded ${documentsToInsert.length} knowledge documents.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Reverting knowledge documents seed data...');
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_documents";`);
    console.log('[Migration] Knowledge documents table dropped.');
  }
}
