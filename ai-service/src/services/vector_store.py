import logging
from typing import Optional, Any
from sqlalchemy import select
from src.config import settings
from src.db.session import get_db
from src.db.models import VectorEmbedding
from src.services.embeddings import embeddings_client

logger = logging.getLogger("buildstack.ai.vector_store")

class VectorStoreService:
    def similarity_search(
        self,
        query: str,
        limit: int = settings.DEFAULT_SIMILARITY_LIMIT,
        entity_type: Optional[str] = None,
        category: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """Executes semantic vector search against ai.vector_embeddings."""
        logger.info(f"[VectorStore] Searching for: '{query}' (limit={limit}, type={entity_type}, category={category})")
        
        query_vector = embeddings_client.embed_query(query)

        with get_db() as session:
            distance_expr = VectorEmbedding.embedding.cosine_distance(query_vector)
            
            stmt = select(
                VectorEmbedding,
                distance_expr.label("distance")
            ).order_by(distance_expr)

            if entity_type:
                stmt = stmt.where(VectorEmbedding.entity_type == entity_type)

            if category:
                stmt = stmt.where(VectorEmbedding.category == category)

            stmt = stmt.limit(limit)
            results = session.execute(stmt).all()

            output = []
            for row in results:
                record: VectorEmbedding = row[0]
                distance: float = float(row[1])
                similarity = max(0.0, min(1.0, 1.0 - (distance / 2.0)))

                output.append({
                    "id": str(record.id),
                    "entity_id": record.entity_id,
                    "entity_type": record.entity_type,
                    "code": record.code,
                    "title": record.title,
                    "category": record.category,
                    "content": record.content,
                    "metadata": record.metadata_,
                    "similarity_score": round(similarity, 4),
                    "distance": round(distance, 4)
                })

            logger.info(f"[VectorStore] Returned {len(output)} semantic matches.")
            return output

    def search_products(self, query: str, limit: int = settings.DEFAULT_SIMILARITY_LIMIT, category: Optional[str] = None) -> list[dict[str, Any]]:
        return self.similarity_search(query=query, limit=limit, entity_type="product", category=category)

    def search_knowledge(self, query: str, limit: int = settings.DEFAULT_SIMILARITY_LIMIT, category: Optional[str] = None) -> list[dict[str, Any]]:
        return self.similarity_search(query=query, limit=limit, entity_type="knowledge_doc", category=category)

vector_store_service = VectorStoreService()
