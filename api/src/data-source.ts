import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Category, Product, User, Project, KnowledgeDocument } from './entities';
import { SeedInitialData1740441600000 } from './migrations/1740441600000-SeedInitialData';
import { SeedKnowledgeData1740442000000 } from './migrations/1740442000000-SeedKnowledgeData';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('[Database] DATABASE_URL is not set in environment variables.');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: databaseUrl ? { rejectUnauthorized: false } : false,
  synchronize: true,
  migrationsRun: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [Category, Product, User, Project, KnowledgeDocument],
  migrations: [SeedInitialData1740441600000, SeedKnowledgeData1740442000000],
  subscribers: [],
});
