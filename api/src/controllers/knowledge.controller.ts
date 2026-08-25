import { Request, Response, NextFunction } from 'express';
import { knowledgeService } from '../services/knowledge.service';

export class KnowledgeController {
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, standard, search } = req.query;

      const documents = await knowledgeService.getDocuments({
        category: category as string,
        standard: standard as string,
        search: search as string,
      });

      return res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentByIdOrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const idOrCode = req.params.idOrCode as string;
      const document = await knowledgeService.getDocumentByIdOrCode(idOrCode);

      return res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const knowledgeController = new KnowledgeController();
