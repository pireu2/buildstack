import logging
from typing import Optional, Dict, Any, List
import httpx
from pydantic import BaseModel, Field
from langchain_core.tools import tool
from src.services.vector_store import vector_store_service
from src.config import settings

logger = logging.getLogger("buildstack.ai.tools")

CORE_API_URL = settings.CORE_API_URL

@tool
def search_catalog_and_standards(
    query: str,
    entity_type: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Searches the vector embeddings database for products, building codes, and certified assembly standards matching the user's project requirements.
    
    Args:
        query: The search query describing the requirements (e.g., 'metal studs', 'insulation', 'DIN 4109').
        entity_type: Optional filter, 'product' or 'knowledge_doc'.
        category: Optional category slug filter (e.g. 'drywall-systems', 'insulation-acoustics', 'metal-framing', 'plasters-compounds', 'fasteners-accessories').
        limit: Max results to return.
    """
    logger.info(f"[Tool] search_catalog_and_standards: query='{query}', entity_type={entity_type}, category={category}")
    try:
        results = vector_store_service.similarity_search(
            query=query,
            limit=limit,
            entity_type=entity_type,
            category=category,
        )
        if not results and category:
            results = vector_store_service.similarity_search(
                query=query,
                limit=limit,
                entity_type=entity_type,
                category=None,
            )

        cleaned_results = []
        for item in results:
            slug = item.get("metadata", {}).get("slug") or item.get("slug") or item.get("code", "").lower()
            title = item.get("title") or item.get("name")
            if slug and title:
                cleaned_results.append({
                    "product_name": title,
                    "catalog_link": f"[{title}](/catalog/{slug})",
                    "sku": item.get("code"),
                    "category": item.get("category"),
                    "price_eur": item.get("metadata", {}).get("price"),
                    "specs": item.get("metadata", {}).get("specs") or {},
                    "description": item.get("metadata", {}).get("description") or item.get("content"),
                })
            else:
                cleaned_results.append(item)

        return cleaned_results
    except Exception as e:
        logger.error(f"[Tool] search_catalog_and_standards error: {e}")
        return [{"error": f"Search failed: {str(e)}"}]

@tool
def get_product(identifier: str) -> Dict[str, Any]:
    """
    Fetches complete authoritative specifications, dimensions, price, manufacturer data, and acoustic/fire ratings for a product from the Core API.
    
    Args:
        identifier: The product slug or SKU to fetch.
    """
    logger.info(f"[Tool] get_product: identifier='{identifier}'")
    try:
        with httpx.Client() as client:
            response = client.get(f"{CORE_API_URL}/products/{identifier}")
            if response.status_code == 200:
                data = response.json()
                prod = data.get("data") if isinstance(data, dict) and "data" in data else data
                if isinstance(prod, dict) and "name" in prod and "slug" in prod:
                    prod["catalog_link"] = f"[{prod['name']}](/catalog/{prod['slug']})"
                return data
            return {"error": f"Failed to fetch product, status code {response.status_code}"}
    except Exception as e:
        logger.error(f"[Tool] get_product error: {e}")
        return {"error": f"Request failed: {str(e)}"}

@tool
def get_knowledge_document(identifier: str) -> Dict[str, Any]:
    """
    Retrieves the full authoritative building regulation, standard table, or certified assembly recipe (e.g. DIN 4109, EN 13501) from the Core API.
    
    Args:
        identifier: The document slug or code to fetch.
    """
    logger.info(f"[Tool] get_knowledge_document: identifier='{identifier}'")
    try:
        with httpx.Client() as client:
            response = client.get(f"{CORE_API_URL}/knowledge/{identifier}")
            if response.status_code == 200:
                return response.json()
            return {"error": f"Failed to fetch document, status code {response.status_code}"}
    except Exception as e:
        logger.error(f"[Tool] get_knowledge_document error: {e}")
        return {"error": f"Request failed: {str(e)}"}

class AcousticPerformanceArgs(BaseModel):
    stud_profile_mm: int = Field(description="The width of the stud profile in mm (e.g., 50, 75, 100)")
    board_layers_per_side: int = Field(description="Number of board layers on each side of the wall (e.g., 1, 2)")
    board_type: str = Field(description="Type of board, e.g., 'standard', 'acoustic', 'fire'")
    cavity_insulation_thickness_mm: int = Field(description="Thickness of cavity insulation in mm (e.g., 40, 60)")
    resilient_channel: bool = Field(description="Whether resilient channels are used")

@tool("calculate_acoustic_performance", args_schema=AcousticPerformanceArgs)
def calculate_acoustic_performance(
    stud_profile_mm: int,
    board_layers_per_side: int,
    board_type: str,
    cavity_insulation_thickness_mm: int,
    resilient_channel: bool,
) -> Dict[str, Any]:
    """
    Calculates predicted Rw (dB) and sound insulation performance under DIN 4109 mass-air-mass principles.
    """
    base_rw = 35
    if stud_profile_mm >= 75:
        base_rw += 5
    if stud_profile_mm >= 100:
        base_rw += 3
    base_rw += board_layers_per_side * 6
    if "acoustic" in str(board_type).lower():
        base_rw += 5
    if cavity_insulation_thickness_mm > 0:
        base_rw += 5
    if resilient_channel:
        base_rw += 8

    return {
        "rw_estimate_db": base_rw,
        "standard": "DIN 4109",
        "notes": "Calculated under DIN 4109 mass-air-mass acoustic principles.",
    }

class FireResistanceArgs(BaseModel):
    board_type: str = Field(description="Type of board, e.g., 'standard', 'fire'")
    board_thickness_mm: float = Field(description="Thickness of a single board in mm (e.g., 12.5, 15.0)")
    layers_per_side: int = Field(description="Number of board layers on each side")
    insulation_type: str = Field(description="Type of cavity insulation, e.g., 'mineral_wool', 'none'")

@tool("calculate_fire_resistance", args_schema=FireResistanceArgs)
def calculate_fire_resistance(
    board_type: str,
    board_thickness_mm: float,
    layers_per_side: int,
    insulation_type: str,
) -> Dict[str, Any]:
    """
    Evaluates fire resistance duration (EI 30 / 60 / 90 / 120) according to EN 13501-2.
    """
    ei = 0
    if "fire" in str(board_type).lower():
        ei += (board_thickness_mm / 12.5) * 30 * layers_per_side
    else:
        ei += (board_thickness_mm / 12.5) * 15 * layers_per_side

    if (
        "mineral" in str(insulation_type).lower()
        or "wool" in str(insulation_type).lower()
        or "rock" in str(insulation_type).lower()
    ):
        ei += 15

    rating = 0
    for threshold in [120, 90, 60, 30]:
        if ei >= threshold:
            rating = threshold
            break

    rating_str = f"EI {rating}" if rating > 0 else "Unclassified (<EI 30)"
    return {
        "ei_rating": rating_str,
        "standard": "EN 13501-2",
        "estimated_minutes": ei,
    }

class FramingBOMArgs(BaseModel):
    wall_length_m: float = Field(description="Length of the wall in meters")
    wall_height_m: float = Field(description="Height of the wall in meters")
    stud_spacing_mm: int = Field(description="Spacing between studs in mm (e.g., 600, 400)")
    double_sided: bool = Field(description="Whether the wall is boarded on both sides")
    layers_per_side: int = Field(default=1, description="Number of board layers per side")

@tool("calculate_framing_bill_of_materials", args_schema=FramingBOMArgs)
def calculate_framing_bill_of_materials(
    wall_length_m: float,
    wall_height_m: float,
    stud_spacing_mm: int,
    double_sided: bool,
    layers_per_side: int = 1,
) -> Dict[str, Any]:
    """
    Computes bill of materials (CW studs, UW tracks, boards, screws, acoustic tape, joint compound).
    """
    area_m2 = wall_length_m * wall_height_m

    num_studs = int((wall_length_m * 1000) / stud_spacing_mm) + 1
    stud_length_total = num_studs * wall_height_m
    track_length_total = wall_length_m * 2

    sides = 2 if double_sided else 1
    total_board_area = area_m2 * sides * layers_per_side
    board_size_m2 = 1.2 * 2.5
    num_boards = (total_board_area / board_size_m2) * 1.05

    screws_per_m2 = 15 if layers_per_side == 1 else 25
    total_screws = int(total_board_area * screws_per_m2)

    compound_kg_per_m2 = 0.3 * layers_per_side
    total_compound_kg = area_m2 * sides * compound_kg_per_m2

    return {
        "cw_studs_m": round(stud_length_total, 2),
        "cw_studs_count": num_studs,
        "uw_tracks_m": round(track_length_total, 2),
        "boards_pcs": int(num_boards) + 1,
        "screws_pcs": total_screws,
        "joint_compound_kg": round(total_compound_kg, 2),
        "acoustic_tape_m": round(track_length_total, 2),
    }

ALL_TOOLS = [
    search_catalog_and_standards,
    get_product,
    get_knowledge_document,
    calculate_acoustic_performance,
    calculate_fire_resistance,
    calculate_framing_bill_of_materials,
]
