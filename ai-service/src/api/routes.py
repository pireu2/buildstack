import logging
import json
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from src.config import settings
from src.services.vector_store import vector_store_service
from src.api.rate_limiter import (
    search_rate_limiter,
    chat_rate_limiter,
    questions_rate_limiter,
    solutions_generate_rate_limiter,
)
from src.services.tools.definitions import get_product
from src.services.streaming import stream_agent_graph_events
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
# SYSTEM PROMPTS
# ---------------------------------------------------------

def build_copilot_system_prompt(context: dict) -> str:
    identifier = context.get("sku") or context.get("slug") or context.get("id")
    if identifier and "full_data" not in context:
        try:
            full_product = get_product.invoke({"identifier": identifier})
            if isinstance(full_product, dict) and full_product.get("success") and "data" in full_product:
                context["full_data"] = full_product["data"]
            elif isinstance(full_product, dict) and "error" not in full_product:
                context["full_data"] = full_product
        except Exception as e:
            logger.error(f"[ChatStream] Failed to fetch active product context: {e}")

    full_data = context.get("full_data") or context
    product_context_str = ""
    if full_data and (full_data.get("name") or full_data.get("slug") or full_data.get("sku")):
        prod_slug = full_data.get("slug", "")
        prod_name = full_data.get("name", "N/A")
        product_context_str = f"""
ACTIVE MATERIAL IN VIEW (CURRENT CONTEXT):
- Name: {prod_name}
- Slug: {prod_slug}
- Catalog Markdown Link: [{prod_name}](/catalog/{prod_slug})
- SKU: {full_data.get('sku', 'N/A')}
- Price: {full_data.get('price', 'N/A')} EUR
- Category: {full_data.get('category', {}).get('name') if isinstance(full_data.get('category'), dict) else full_data.get('category', 'N/A')}
- Manufacturer: {full_data.get('manufacturer', 'N/A')}
- Description: {full_data.get('description', 'N/A')}
- Technical Specifications: {json.dumps(full_data.get('data') or full_data.get('specs') or {}, indent=2)}
"""

    return f"""You are the BuildStack Senior AI Solution Architect Copilot, an authoritative civil engineer and building acoustics & fire-safety consultant.

Your mission is to provide authoritative, highly structured, beautifully formatted engineering recommendations for drywall systems, partition assemblies, ceilings, and wet-room constructions based on European and German building standards (DIN 4109, DIN 4102 / EN 13501, DIN 18181/18182, DIN 18534).
{product_context_str}

CRITICAL PRODUCT LINKING MANDATE:
For every product in the tool results or active context, you MUST use its exact `catalog_link` (e.g. `[Product Name](/catalog/{{slug}})`) everywhere in your text, headers, and bullet points. Never output the raw product name without its markdown link.

CRITICAL RULES FOR BEHAVIOR & OUTPUT:
1. Direct Engineering Response: Deliver the final answer directly to the client. Execute tools silently without narrating your tool-calling intentions.
2. Product Formatting: Every single catalog product mentioned MUST use the `[Product Name](/catalog/{{slug}})` format.
3. Tool Invocation: When engineering calculations (DIN 4109 acoustics, EN 13501 fire resistance, framing BOM) or product searches are requested, invoke the available tools.
4. Standards Citation: Building regulations and standards (DIN 4109, EN 13501-2, DIN 18181, DIN 18534) are NOT website links. Write them in *italic text* (e.g. *DIN 4109*, *EN 13501-2*).
5. Tables for Build-ups: ALWAYS format system build-ups as Markdown Tables (`| Layer | Component | Specification | Standard |`). NEVER use raw code blocks (```).
6. No External Links: NEVER generate external links or URLs (no http://, no https://, no localhost). Always use relative `/catalog/{{slug}}`.
7. No Emojis: Maintain an objective engineering tone."""

def build_solutions_consultant_prompt(context: dict) -> str:
    options_str = json.dumps(context.get("options", []), indent=2)
    dimensions_str = json.dumps(context.get("dimensions", {}), indent=2)

    return f"""You are the BuildStack Senior Building Consultant and Solution Architect assisting a user with their 3 engineered building solutions.

USER PROJECT CONTEXT:
- Project Query: "{context.get('query', 'Construction project')}"
- Dimensions: {dimensions_str}
- 3 Engineered Solution Assemblies:
{options_str}

YOUR MISSION & CAPABILITIES:
1. Act as a senior architectural engineer. Help the user compare the 3 options (Budget, Balanced Standard, Premium Performance), analyze acoustic (Rw dB) and moisture exposure (DIN 18534 W1-I to W4) ratings, explain trade-offs, and recommend installation best practices.
2. You have access to tools (`search_catalog_and_standards`, `get_product`, `calculate_materials`, `calculate_acoustic_performance`) if you need to fetch extra product specs, check DIN/EN standards, or calculate precise material quantities.
3. Every catalog product mentioned MUST use clean markdown links (e.g. `[Product Name](/catalog/{{slug}})`).
4. Standards like *DIN 4109*, *EN 13501*, *DIN 18534* must be styled in *italics*.
5. Maintain a professional, helpful, authoritative tone. Avoid conversational filler or emojis."""

# ---------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------

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

@router.post("/chat/stream", dependencies=[Depends(chat_rate_limiter)])
@router.post("/api/v1/ai/chat/stream", dependencies=[Depends(chat_rate_limiter)])
async def chat_stream(request: ChatRequest):
    context = request.context or {}
    system_prompt = build_copilot_system_prompt(context)
    
    messages = [SystemMessage(content=system_prompt)]
    if request.messages:
        for m in request.messages:
            if m.role == "user":
                messages.append(HumanMessage(content=m.content))
            elif m.role == "assistant" and m.content:
                messages.append(AIMessage(content=m.content))

    if not request.messages or request.messages[-1].content != request.prompt:
        messages.append(HumanMessage(content=request.prompt))

    return StreamingResponse(stream_agent_graph_events(messages), media_type="text/event-stream")

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
    context = request.context or {}
    system_prompt = build_solutions_consultant_prompt(context)

    messages = [SystemMessage(content=system_prompt)]
    if request.messages:
        for m in request.messages:
            if m.role == "user":
                messages.append(HumanMessage(content=m.content))
            elif m.role == "assistant" and m.content:
                messages.append(AIMessage(content=m.content))

    if not request.messages or request.messages[-1].content != request.prompt:
        messages.append(HumanMessage(content=request.prompt))

    return StreamingResponse(stream_agent_graph_events(messages), media_type="text/event-stream")
