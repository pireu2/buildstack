import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Depends
from src.config import settings
from src.services.vector_store import vector_store_service
from src.services.ingest import run_ingestion
from src.api.rate_limiter import search_rate_limiter

logger = logging.getLogger("buildstack.ai.api")
router = APIRouter(tags=["AI Services"])

@router.get("/health")
@router.get("/api/v1/ai/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
    }

@router.get("/search", dependencies=[Depends(search_rate_limiter)])
@router.get("/api/v1/ai/search", dependencies=[Depends(search_rate_limiter)])
def semantic_search(
    q: str = Query(..., min_length=settings.MIN_SEARCH_QUERY_LENGTH, description="Natural language search query"),
    limit: int = Query(settings.DEFAULT_SEARCH_LIMIT, ge=1, le=settings.MAX_SEARCH_LIMIT, description="Max number of results to return"),
    type: Optional[str] = Query(None, description="Filter by entity type: 'product' or 'knowledge_doc'"),
    category: Optional[str] = Query(None, description="Filter by category slug"),
):
    """
    Performs hybrid semantic similarity search across product catalog and building knowledge documents.
    """
    try:
        results = vector_store_service.similarity_search(
            query=q,
            limit=limit,
            entity_type=type,
            category=category
        )
        return {
            "success": True,
            "query": q,
            "count": len(results),
            "data": results
        }
    except Exception as e:
        logger.error(f"[Search] Semantic search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@router.post("/ingest")
@router.post("/api/v1/ai/ingest")
def trigger_ingestion():
    """
    Triggers the vector embeddings ingestion pipeline to re-index all products and knowledge documents.
    """
    try:
        result = run_ingestion()
        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        logger.error(f"[Ingest] Ingestion pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")
