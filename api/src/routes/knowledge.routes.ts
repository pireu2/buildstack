import { Router } from 'express';
import { knowledgeController } from '../controllers/knowledge.controller';

const router = Router();

router.get('/', knowledgeController.getDocuments.bind(knowledgeController));
router.get('/:idOrCode', knowledgeController.getDocumentByIdOrCode.bind(knowledgeController));

export default router;
