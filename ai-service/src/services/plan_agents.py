import logging
import json
import asyncio
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from src.config import settings
from src.services.tools.definitions import (
    search_catalog_and_standards,
    get_product,
)

logger = logging.getLogger("buildstack.ai.plan_agents")

# -----------------------------------------------------------------------------
# PYDANTIC DATA SCHEMAS
# -----------------------------------------------------------------------------

class SolutionProductItem(BaseModel):
    name: str = Field(description="Exact product name from catalog")
    slug: str = Field(description="Exact catalog product slug")
    category: str = Field(description="Category slug")
    role: str = Field(description="Role in this assembly (e.g. 'Primary Wallboard', 'Moisture Barrier', 'Acoustic Insulation')")
    unit_price: float = Field(description="Unit price in EUR")
    unit: str = Field(default="m²", description="Measurement unit")

class SolutionPricing(BaseModel):
    cost_per_m2: float = Field(default=0.0, description="Estimated material cost per square meter in EUR")
    total_estimated_cost: float = Field(default=0.0, description="Total estimated cost for the specified dimensions in EUR")
    currency: str = Field(default="EUR", description="Currency code (e.g. EUR)")

class SolutionOption(BaseModel):
    id: Literal["budget", "balanced", "premium"] = Field(description="Option ID")
    tier: Literal["budget", "balanced", "premium"] = Field(description="Solution tier category")
    title: str = Field(description="Clean descriptive title for this assembly (no badges or marketing fluff)")
    tagline: str = Field(description="One-sentence high-level summary")
    description: str = Field(description="Plain-English explanation of why this assembly works")
    pricing: SolutionPricing = Field(default_factory=SolutionPricing, description="Detailed cost and price calculation breakdown")
    products: List[SolutionProductItem] = Field(default_factory=list, description="List of real catalog products")
    key_benefits: List[str] = Field(default_factory=list, description="2 to 3 bullet points")
    installation_notes: List[str] = Field(default_factory=list, description="1 to 2 practical tips")

class GeneratePlansResponse(BaseModel):
    success: bool = True
    query: str
    dimensions: Dict[str, Any] = Field(description="{ length_m: float, height_m: float, area_m2: float }")
    options: List[SolutionOption] = Field(description="List of the 3 engineered solution options")

# -----------------------------------------------------------------------------
# LLM INSTANCE
# -----------------------------------------------------------------------------

llm = ChatOpenAI(
    base_url=settings.AI_BASE_URL,
    api_key=settings.AI_API_KEY,
    model=settings.LLM_MODEL,
    temperature=0.3,
    timeout=45.0,
    max_retries=1,
)

structured_option_llm = llm.with_structured_output(SolutionOption)

# -----------------------------------------------------------------------------
# CATALOG RETRIEVAL HELPER
# -----------------------------------------------------------------------------

def search_relevant_products_for_project(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """Searches vector store for products and enriches with verified Core API product details."""
    try:
        from src.services.vector_store import vector_store_service
        raw_results = vector_store_service.similarity_search(
            query=query,
            limit=limit,
            entity_type="product",
        )
        
        verified_products = []
        seen_slugs = set()

        def extract_item_slug(item: Dict[str, Any]) -> Optional[str]:
            if not isinstance(item, dict):
                return None
            slug = item.get("slug")
            if not slug and isinstance(item.get("metadata"), dict):
                slug = item["metadata"].get("slug")
            if not slug and "catalog_link" in item:
                link = item["catalog_link"]
                if "/catalog/" in link:
                    slug = link.split("/catalog/")[1].rstrip(")")
            if not slug and item.get("sku"):
                slug = str(item["sku"]).lower()
            return slug

        for item in raw_results:
            slug = extract_item_slug(item)
            if slug and slug not in seen_slugs:
                seen_slugs.add(slug)
                name = item.get("product_name") or item.get("title") or item.get("name")
                price = float(item.get("price_eur") or (item.get("metadata", {}).get("price") if isinstance(item.get("metadata"), dict) else 0) or 0.0)
                cat = item.get("category") or (item.get("metadata", {}).get("category") if isinstance(item.get("metadata"), dict) else "")

                # Try to enrich via get_product
                try:
                    prod_data = get_product.invoke({"identifier": slug})
                    prod = prod_data.get("data") if isinstance(prod_data, dict) and "data" in prod_data else prod_data
                    if isinstance(prod, dict) and "name" in prod:
                        name = prod.get("name", name)
                        price = float(prod.get("price") or price)
                        cat = prod.get("category", {}).get("slug") if isinstance(prod.get("category"), dict) else cat
                        slug = prod.get("slug", slug)
                except Exception:
                    pass

                if name:
                    verified_products.append({
                        "name": name,
                        "slug": slug,
                        "category": cat,
                        "price": price,
                        "unit": "m²",
                        "description": item.get("description", ""),
                    })

        return verified_products
    except Exception as e:
        logger.warning(f"[PlanAgents] Catalog search error: {e}")
        return []

# -----------------------------------------------------------------------------
# PRODUCT RECONCILIATION HELPER
# -----------------------------------------------------------------------------

def match_product_against_catalog(prod_name_or_slug: str, catalog_candidates: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Fuzzy matches a product name or slug to an authoritative catalog item."""
    query = prod_name_or_slug.lower().strip()
    
    # 1. Exact slug or exact name
    for c in catalog_candidates:
        if c.get("slug") and c["slug"].lower() == query:
            return c
        if c.get("name") and c["name"].lower() == query:
            return c

    # 2. Substring match
    for c in catalog_candidates:
        c_name = (c.get("name") or "").lower()
        c_slug = (c.get("slug") or "").lower()
        if query in c_name or query in c_slug or c_name in query or c_slug in query:
            return c

    # 3. Keyword token overlap
    query_tokens = set(query.split())
    best_match = None
    best_score = 0
    for c in catalog_candidates:
        cand_tokens = set((c.get("name") or "").lower().split())
        common = len(query_tokens.intersection(cand_tokens))
        if common > best_score:
            best_score = common
            best_match = c

    return best_match if best_score > 0 else None

def reconcile_products_with_catalog(
    option: SolutionOption,
    catalog_candidates: List[Dict[str, Any]],
    area_m2: float,
    tier: str = "balanced"
) -> SolutionOption:
    """Ensures all product items in an option strictly match verified catalog candidates."""
    valid_products = []
    seen_slugs = set()

    for item in option.products:
        matched = match_product_against_catalog(item.slug or item.name, catalog_candidates)
        if matched and matched["slug"] not in seen_slugs:
            seen_slugs.add(matched["slug"])
            valid_products.append(SolutionProductItem(
                name=matched["name"],
                slug=matched["slug"],
                category=matched.get("category", ""),
                role=item.role or "Assembly Component",
                unit_price=float(matched.get("price", 0.0)),
                unit=matched.get("unit", "m²"),
            ))

    # Calculate cost per m2 and total cost directly from valid products
    cost_m2 = round(sum(p.unit_price for p in valid_products), 2)
    total_cost = round(cost_m2 * area_m2, 2)

    option.products = valid_products
    option.pricing = SolutionPricing(
        cost_per_m2=cost_m2,
        total_estimated_cost=total_cost,
        currency="EUR"
    )
    return option

# -----------------------------------------------------------------------------
# SUB-AGENT SYSTEM PROMPTS
# -----------------------------------------------------------------------------

BUDGET_PROMPT = """You are the BuildStack Budget Solution Specialist.
Your goal is to engineer the "budget" option (Budget-Friendly, cost-effective essentials) for the user's project.

STRICT CATALOG REQUIREMENT:
- You MUST select products from the provided CATALOG CANDIDATES list.
- Use the exact `name`, `slug`, `category`, and `unit_price` from the candidate list.

GUIDELINES:
- Select 2 to 3 economical, compliant products from the candidate list.
- Set id: "budget", tier: "budget".
- Write a clean descriptive title (e.g. "Value-Optimized Moisture Resistant Assembly").
- Write a short tagline and clear description.
- Provide 2-3 key benefits and 1-2 practical installation tips."""

BALANCED_PROMPT = """You are the BuildStack Balanced Standard Solution Specialist.
Your goal is to engineer the "balanced" option (Standard Commercial Quality, optimal durability & value) for the user's project.

STRICT CATALOG REQUIREMENT:
- You MUST select products from the provided CATALOG CANDIDATES list.
- Use the exact `name`, `slug`, `category`, and `unit_price` from the candidate list.

GUIDELINES:
- Select 3 to 4 commercial-grade products from the candidate list.
- Set id: "balanced", tier: "balanced".
- Write a clean descriptive title (e.g. "Standard Commercial Moisture & Acoustic Assembly").
- Write a short tagline and clear description.
- Provide 2-3 key benefits and 1-2 practical installation tips."""

PREMIUM_PROMPT = """You are the BuildStack Premium Performance Specialist.
Your goal is to engineer the "premium" option (High-End Studio Grade, Maximum performance) for the user's project.

STRICT CATALOG REQUIREMENT:
- You MUST select products from the provided CATALOG CANDIDATES list.
- Use the exact `name`, `slug`, `category`, and `unit_price` from the candidate list.

GUIDELINES:
- Select 3 to 4 high-spec products from the candidate list.
- Set id: "premium", tier: "premium".
- Write a clean descriptive title (e.g. "High-Performance Structural Wetroom & Decoupled Assembly").
- Write a short tagline and clear description.
- Provide 2-3 key benefits and 1-2 practical installation tips."""

# -----------------------------------------------------------------------------
# SPECIALIST AGENT EXECUTION FUNCTIONS
# -----------------------------------------------------------------------------

def build_budget_solution(prompt: str, answers: List[Dict[str, str]], dimensions: Dict[str, Any], catalog_products: List[Dict[str, Any]]) -> SolutionOption:
    area_m2 = float(dimensions.get("area_m2", 14.0))
    catalog_summary = [
        {"name": p["name"], "slug": p["slug"], "category": p["category"], "unit_price": p["price"], "description": p.get("description", "")}
        for p in catalog_products
    ]
    catalog_str = json.dumps(catalog_summary, indent=2)
    answers_str = json.dumps(answers, indent=2)

    user_msg = f"""PROJECT REQUIREMENTS:
- User Prompt: "{prompt}"
- Area: {area_m2} m²
- Answers:
{answers_str}

AVAILABLE CATALOG CANDIDATES:
{catalog_str}

Select products strictly from the candidate list and construct the 'budget' solution."""

    try:
        res = structured_option_llm.invoke([
            SystemMessage(content=BUDGET_PROMPT),
            HumanMessage(content=user_msg)
        ])
        if isinstance(res, SolutionOption):
            return reconcile_products_with_catalog(res, catalog_products, area_m2, tier="budget")
    except Exception as e:
        logger.error(f"[PlanAgents] Budget agent error: {e}")

    opt = SolutionOption(
        id="budget",
        tier="budget",
        title="Value-Optimized Certified Assembly",
        tagline="Cost-effective, reliable material assembly for standard performance.",
        description="A straightforward, value-optimized system engineered for reliable everyday performance and easy installation.",
        pricing=SolutionPricing(),
        products=[],
        key_benefits=["Lowest upfront material cost", "Fast and straightforward installation", "Reliable certified quality"],
        installation_notes=["Ensure clean substrate before fastening.", "Apply continuous sealing tape along perimeters."]
    )
    return reconcile_products_with_catalog(opt, catalog_products, area_m2, tier="budget")

def build_balanced_solution(prompt: str, answers: List[Dict[str, str]], dimensions: Dict[str, Any], catalog_products: List[Dict[str, Any]]) -> SolutionOption:
    area_m2 = float(dimensions.get("area_m2", 14.0))
    catalog_summary = [
        {"name": p["name"], "slug": p["slug"], "category": p["category"], "unit_price": p["price"], "description": p.get("description", "")}
        for p in catalog_products
    ]
    catalog_str = json.dumps(catalog_summary, indent=2)
    answers_str = json.dumps(answers, indent=2)

    user_msg = f"""PROJECT REQUIREMENTS:
- User Prompt: "{prompt}"
- Area: {area_m2} m²
- Answers:
{answers_str}

AVAILABLE CATALOG CANDIDATES:
{catalog_str}

Select products strictly from the candidate list and construct the 'balanced' solution."""

    try:
        res = structured_option_llm.invoke([
            SystemMessage(content=BALANCED_PROMPT),
            HumanMessage(content=user_msg)
        ])
        if isinstance(res, SolutionOption):
            return reconcile_products_with_catalog(res, catalog_products, area_m2, tier="balanced")
    except Exception as e:
        logger.error(f"[PlanAgents] Balanced agent error: {e}")

    opt = SolutionOption(
        id="balanced",
        tier="balanced",
        title="Commercial Standard Durability Assembly",
        tagline="Optimal commercial balance of durability, acoustic insulation, and longevity.",
        description="The contractor-standard assembly providing robust durability, verified sound isolation, and high wear resistance.",
        pricing=SolutionPricing(),
        products=[],
        key_benefits=["Commercial-grade durability", "High acoustic dampening", "Excellent long-term wear resistance"],
        installation_notes=["Stagger board joints by at least 400mm.", "Use recommended acoustic perimeter sealants."]
    )
    return reconcile_products_with_catalog(opt, catalog_products, area_m2, tier="balanced")

def build_premium_solution(prompt: str, answers: List[Dict[str, str]], dimensions: Dict[str, Any], catalog_products: List[Dict[str, Any]]) -> SolutionOption:
    area_m2 = float(dimensions.get("area_m2", 14.0))
    catalog_summary = [
        {"name": p["name"], "slug": p["slug"], "category": p["category"], "unit_price": p["price"], "description": p.get("description", "")}
        for p in catalog_products
    ]
    catalog_str = json.dumps(catalog_summary, indent=2)
    answers_str = json.dumps(answers, indent=2)

    user_msg = f"""PROJECT REQUIREMENTS:
- User Prompt: "{prompt}"
- Area: {area_m2} m²
- Answers:
{answers_str}

AVAILABLE CATALOG CANDIDATES:
{catalog_str}

Select products strictly from the candidate list and construct the 'premium' solution."""

    try:
        res = structured_option_llm.invoke([
            SystemMessage(content=PREMIUM_PROMPT),
            HumanMessage(content=user_msg)
        ])
        if isinstance(res, SolutionOption):
            return reconcile_products_with_catalog(res, catalog_products, area_m2, tier="premium")
    except Exception as e:
        logger.error(f"[PlanAgents] Premium agent error: {e}")

    opt = SolutionOption(
        id="premium",
        tier="premium",
        title="High-Performance Structural & Decoupled Assembly",
        tagline="Maximum engineered acoustic isolation, heavy fire safety, and luxury longevity.",
        description="Top-tier multi-layer assembly engineered for critical soundproofing, heavy load-bearing capacity, and maximum structural life.",
        pricing=SolutionPricing(),
        products=[],
        key_benefits=["Maximum sound isolation & silence", "Highest fire & impact resistance", "Decoupled structural framework"],
        installation_notes=["Use resilient sound channels for vibration decoupling.", "Seal all perimeter gaps with acoustic mastic."]
    )
    return reconcile_products_with_catalog(opt, catalog_products, area_m2, tier="premium")

# -----------------------------------------------------------------------------
# MAIN ASYNC MULTI-AGENT RUNNER
# -----------------------------------------------------------------------------

async def generate_3_solution_plans(
    prompt: str,
    answers: Optional[List[Dict[str, str]]] = None,
    dimensions: Optional[Dict[str, Any]] = None,
    budget: Optional[str] = "mid",
    moisture_level: Optional[str] = "dry",
) -> GeneratePlansResponse:
    """
    Executes the 3 specialized sub-agents in parallel to synthesize the 3 solution options
    with verified real catalog items.
    """
    logger.info(f"[PlanAgents] Starting 3-agent fan-out for: '{prompt}'")
    answers = answers or []
    dimensions = dimensions or {}
    length_m = float(dimensions.get("length_m") or 5.0)
    height_m = float(dimensions.get("height_m") or 2.8)
    area_m2 = round(length_m * height_m, 2)
    dim_dict = {"length_m": length_m, "height_m": height_m, "area_m2": area_m2}

    # 1. Fetch relevant catalog products from vector store & Core API
    search_query = f"{prompt} {moisture_level} {'waterproof wetroom' if moisture_level != 'dry' else 'acoustic sound drywall insulation'}"
    catalog_candidates = await asyncio.to_thread(search_relevant_products_for_project, search_query, 15)

    # 2. Fan-out 3 agents in parallel
    budget_task = asyncio.to_thread(build_budget_solution, prompt, answers, dim_dict, catalog_candidates)
    balanced_task = asyncio.to_thread(build_balanced_solution, prompt, answers, dim_dict, catalog_candidates)
    premium_task = asyncio.to_thread(build_premium_solution, prompt, answers, dim_dict, catalog_candidates)

    opt_budget, opt_balanced, opt_premium = await asyncio.gather(budget_task, balanced_task, premium_task)

    return GeneratePlansResponse(
        success=True,
        query=prompt,
        dimensions=dim_dict,
        options=[opt_budget, opt_balanced, opt_premium]
    )
