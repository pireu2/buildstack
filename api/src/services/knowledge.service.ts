import { AppDataSource } from '../data-source';
import { KnowledgeDocument } from '../entities';
import { FindOptionsWhere, ILike } from 'typeorm';

export interface KnowledgeQueryParams {
  category?: string;
  standard?: string;
  search?: string;
}

export class KnowledgeService {
  private knowledgeRepo = AppDataSource.getRepository(KnowledgeDocument);

  async getDocuments(params: KnowledgeQueryParams = {}): Promise<KnowledgeDocument[]> {
    const where: FindOptionsWhere<KnowledgeDocument> = {};

    if (params.category) {
      where.category = params.category;
    }

    if (params.standard) {
      where.standard = ILike(`%${params.standard.trim()}%`);
    }

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      return this.knowledgeRepo.find({
        where: [
          { ...where, title: ILike(searchPattern) },
          { ...where, summary: ILike(searchPattern) },
          { ...where, code: ILike(searchPattern) },
        ],
        order: { category: 'ASC', title: 'ASC' },
      });
    }

    return this.knowledgeRepo.find({
      where,
      order: { category: 'ASC', title: 'ASC' },
    });
  }

  async getDocumentByIdOrCode(idOrCode: string): Promise<KnowledgeDocument> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrCode
      );

    const doc = await this.knowledgeRepo.findOne({
      where: isUuid ? { id: idOrCode } : { code: idOrCode },
    });

    if (!doc) {
      const error: any = new Error(`Knowledge document not found: ${idOrCode}`);
      error.status = 404;
      throw error;
    }

    return doc;
  }
}

export const knowledgeService = new KnowledgeService();
