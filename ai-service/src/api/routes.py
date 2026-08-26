import logging
import json
from typing import Optional, Dict, Any, List, AsyncGenerator
from fastapi import APIRouter, Query, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.config import settings
from src.services.vector_store import vector_store_service
from src.api.rate_limiter import search_rate_limiter, chat_rate_limiter
from src.services.agent import agent_graph
from src.services.tools.definitions import get_product
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

logger = logging.getLogger("buildstack.ai.api")
router = APIRouter(tags=["AI Services"])

class MessageItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    messages: Optional[List[MessageItem]] = None
    user_id: Optional[str] = None

async def event_generator(request: ChatRequest) -> AsyncGenerator[str, None]:
    try:
        context = request.context or {}
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

        system_prompt = f"""You are the BuildStack Senior AI Solution Architect Copilot, an authoritative civil engineer and building acoustics & fire-safety consultant.

Your mission is to provide authoritative, highly structured, beautifully formatted engineering recommendations for drywall systems, partition assemblies, ceilings, and wet-room constructions based on European and German building standards (DIN 4109, DIN 4102 / EN 13501, DIN 18181/18182, DIN 18534).
{product_context_str}

CRITICAL PRODUCT LINKING MANDATE:
For every product in the tool results or active context, you MUST use its exact `catalog_link` (e.g. `[Product Name](/catalog/{{slug}})`) everywhere in your text, headers, and bullet points. Never output the raw product name without its markdown link.

Bad (Forbidden): CemArmor Inorganic Portland Cement Board 12.5mm
Bad (Forbidden): **CemArmor Inorganic Portland Cement Board 12.5mm**
Good (Required): [CemArmor Inorganic Portland Cement Board 12.5mm](/catalog/cemarmor-portland-cement-board-12-5mm)

Examples:
- In itemized lists:
  1. [CemArmor Inorganic Portland Cement Board 12.5mm](/catalog/cemarmor-portland-cement-board-12-5mm)
     - Price: 28.50 EUR/m²
     - Tile Loading Capacity: 55 kg/m²
  2. [HydroBloc WetRoom Board H1 12.5mm](/catalog/hydrobloc-wetroom-board-h1-12-5mm)
     - Price: 12.40 EUR/m²
     - Tile Loading Capacity: 32 kg/m²
- In headers: `### [CemArmor Inorganic Portland Cement Board 12.5mm](/catalog/cemarmor-portland-cement-board-12-5mm)`
- In comparisons: "Comparing [NordicGips Standard Wallboard 12.5mm](/catalog/nordicgips-standard-wallboard-12-5mm) with [CurvForm Flexible Gypsum Board 6.5mm](/catalog/curvform-flexible-gypsum-board-6-5mm)..."

CRITICAL RULES FOR BEHAVIOR & OUTPUT:
1. Direct Engineering Response: Deliver the final answer directly to the client. Execute tools silently without narrating your tool-calling intentions.
2. Product Formatting: Every single catalog product mentioned MUST use the `[Product Name](/catalog/{{slug}})` format.
3. Tool Invocation: When engineering calculations (DIN 4109 acoustics, EN 13501 fire resistance, framing BOM) or product searches are requested, invoke the available tools.
4. Standards Citation: Building regulations and standards (DIN 4109, EN 13501-2, DIN 18181, DIN 18534) are NOT website links. Write them in *italic text* (e.g. *DIN 4109*, *EN 13501-2*).
5. Tables for Build-ups: ALWAYS format system build-ups as Markdown Tables (`| Layer | Component | Specification | Standard |`). NEVER use raw code blocks (```).
6. No External Links: NEVER generate external links or URLs (no http://, no https://, no localhost). Always use relative `/catalog/{{slug}}`.
7. No Emojis: Maintain an objective engineering tone."""

        graph_messages = [SystemMessage(content=system_prompt)]
        if request.messages:
            for m in request.messages:
                if m.role == "user":
                    graph_messages.append(HumanMessage(content=m.content))
                elif m.role == "assistant" and m.content:
                    graph_messages.append(AIMessage(content=m.content))

        if not request.messages or request.messages[-1].content != request.prompt:
            graph_messages.append(HumanMessage(content=request.prompt))

        initial_state = {
            "messages": graph_messages,
        }

        current_step_buffer = []
        is_final_step = False

        async for event in agent_graph.astream_events(initial_state, version="v2"):
            kind = event["event"]

            if kind == "on_chat_model_start":
                current_step_buffer = []

            elif kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if is_final_step:
                    if chunk.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
                else:
                    if chunk.content and not chunk.tool_call_chunks:
                        current_step_buffer.append(chunk.content)

            elif kind == "on_chat_model_end":
                output = event["data"]["output"]
                has_tool_calls = bool(getattr(output, "tool_calls", None))
                if has_tool_calls:
                    current_step_buffer = []
                else:
                    is_final_step = True
                    if current_step_buffer:
                        for text in current_step_buffer:
                            yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"
                        current_step_buffer = []

            elif kind == "on_tool_start":
                tool_name = event["name"]
                yield f"data: {json.dumps({'type': 'tool_start', 'tool': tool_name})}\n\n"

            elif kind == "on_tool_end":
                tool_name = event["name"]
                yield f"data: {json.dumps({'type': 'tool_end', 'tool': tool_name})}\n\n"

            elif kind == "on_chain_end" and event["name"] == "LangGraph":
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        logger.error(f"[ChatStream] Stream error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

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
    return StreamingResponse(event_generator(request), media_type="text/event-stream")
