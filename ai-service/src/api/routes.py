import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import StreamingResponse

from src.config import settings
from src.services.vector_store import vector_store_service
from src.api.rate_limiter import (
    search_rate_limiter,
    chat_rate_limiter,
    questions_rate_limiter,
    solutions_generate_rate_limiter,
)
from src.services.streaming import stream_copilot_chat, stream_solutions_chat
from src.services.solutions_service import generate_dynamic_questions
from src.services.plan_agents import generate_3_solution_plans
from src.api.schemas import (
    ChatRequest,
    QuestionsRequest,
    GeneratePlansRequest,
    SolutionsChatRequest,
)

logger = logging.getLogger("buildstack.ai.api")
router = APIRouter(tags=["AI Services"])

# ---------------------------------------------------------
# HEALTH
# ---------------------------------------------------------

@router.get("/health")
@router.get("/api/v1/ai/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
    }

# ---------------------------------------------------------
# SEARCH
# ---------------------------------------------------------

@router.get("/search", dependencies=[Depends(search_rate_limiter)])
@router.get("/api/v1/ai/search", dependencies=[Depends(search_rate_limiter)])
def semantic_search(
    q: str = Query(..., min_length=settings.MIN_SEARCH_QUERY_LENGTH, description="Natural language search query"),
    limit: int = Query(settings.DEFAULT_SEARCH_LIMIT, ge=1, le=settings.MAX_SEARCH_LIMIT, description="Max number of results to return"),
    type: Optional[str] = Query(None, description="Filter by entity type: 'product' or 'knowledge_doc'"),
    category: Optional[str] = Query(None, description="Filter by category slug"),
):
    try:
        results = vector_store_service.similarity_search(
            query=q,
            limit=limit,
            entity_type=type,
            category=category,
        )
        return {
            "success": True,
            "query": q,
            "count": len(results),
            "data": results,
        }
    except Exception as e:
        logger.error(f"[Search] Semantic search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

# ---------------------------------------------------------
# COPILOT CHAT STREAM
# ---------------------------------------------------------

@router.post("/chat/stream", dependencies=[Depends(chat_rate_limiter)])
@router.post("/api/v1/ai/chat/stream", dependencies=[Depends(chat_rate_limiter)])
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_copilot_chat(request.prompt, request.context, request.messages),
        media_type="text/event-stream"
    )

# ---------------------------------------------------------
# SOLUTION BUILDER ENDPOINTS
# ---------------------------------------------------------

@router.post("/solutions/questions", dependencies=[Depends(questions_rate_limiter)])
@router.post("/api/v1/ai/solutions/questions", dependencies=[Depends(questions_rate_limiter)])
def get_solutions_questions(request: QuestionsRequest):
    try:
        return generate_dynamic_questions(request.prompt, request.static_params)
    except Exception as e:
        logger.error(f"[Solutions] Questions generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/solutions/generate", dependencies=[Depends(solutions_generate_rate_limiter)])
@router.post("/api/v1/ai/solutions/generate", dependencies=[Depends(solutions_generate_rate_limiter)])
async def generate_solutions_endpoint(request: GeneratePlansRequest):
    try:
        res = await generate_3_solution_plans(
            prompt=request.prompt,
            answers=request.answers,
            dimensions=request.dimensions,
            budget=request.budget,
            moisture_level=request.moisture_level,
        )
        return res.model_dump()
    except Exception as e:
        logger.error(f"[Solutions] Plan generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/solutions/chat/stream", dependencies=[Depends(chat_rate_limiter)])
@router.post("/api/v1/ai/solutions/chat/stream", dependencies=[Depends(chat_rate_limiter)])
async def solutions_chat_stream(request: SolutionsChatRequest):
    return StreamingResponse(
        stream_solutions_chat(request.prompt, request.context, request.messages),
        media_type="text/event-stream"
    )
