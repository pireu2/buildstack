import json
from typing import Any

def format_product_specs(data: dict[str, Any]) -> str:
    """Formats JSONB product technical specifications into readable markdown bullet points."""
    if not data:
        return "None specified"
    lines = []
    for k, v in data.items():
        if isinstance(v, list):
            lines.append(f"- {k.replace('_', ' ').title()}: {', '.join(str(x) for x in v)}")
        elif isinstance(v, dict):
            lines.append(f"- {k.replace('_', ' ').title()}: {json.dumps(v)}")
        else:
            lines.append(f"- {k.replace('_', ' ').title()}: {v}")
    return "\n".join(lines)

def chunk_product(product: dict[str, Any]) -> dict[str, Any]:
    """
    Transforms a catalog product JSON into a rich semantic chunk for vector embedding.
    Preserves all fields including description, image URL, category, and technical specs.
    """
    sku = product.get("sku", "")
    name = product.get("name", "")
    category = product.get("category", {})
    category_name = category.get("name", "Building Materials") if isinstance(category, dict) else product.get("categoryName", "Building Materials")
    category_slug = category.get("slug", "general") if isinstance(category, dict) else product.get("categorySlug", "general")
    manufacturer = product.get("manufacturer") or "BuildStack Certified"
    price = product.get("price", 0)
    unit = product.get("unit", "piece")
    description = product.get("description") or ""
    image_url = product.get("imageUrl") or product.get("image_url") or ""
    data = product.get("data") or {}

    specs_text = format_product_specs(data)

    content = f"""Product: {name}
SKU: {sku}
Category: {category_name} ({category_slug})
Manufacturer: {manufacturer}
Price: {price} EUR / {unit}
Description: {description}

Technical Specifications & Performance:
{specs_text}
"""

    return {
        "entity_id": str(product.get("id")),
        "entity_type": "product",
        "code": sku,
        "title": name,
        "category": category_slug,
        "content": content.strip(),
        "metadata": {
            "sku": sku,
            "name": name,
            "slug": product.get("slug"),
            "category_name": category_name,
            "category_slug": category_slug,
            "manufacturer": manufacturer,
            "description": description,
            "imageUrl": image_url,
            "price": float(price),
            "unit": unit,
            "specs": data,
        }
    }

def chunk_knowledge_document(doc: dict[str, Any]) -> dict[str, Any]:
    """
    Transforms a knowledge document (building standard, code, or assembly recipe) into a semantic chunk.
    """
    code = doc.get("code", "")
    title = doc.get("title", "")
    category = doc.get("category", "general")
    standard = doc.get("standard") or "Building Standard"
    summary = doc.get("summary", "")
    body_content = doc.get("content", "")
    metadata = doc.get("metadata") or {}

    content = f"""Building Regulation / Assembly Standard: {title}
Code: {code}
Standard Reference: {standard}
Category: {category}
Summary: {summary}

Full Technical Content:
{body_content}
"""

    return {
        "entity_id": str(doc.get("id")),
        "entity_type": "knowledge_doc",
        "code": code,
        "title": title,
        "category": category,
        "content": content.strip(),
        "metadata": {
            "code": code,
            "title": title,
            "standard": standard,
            "category": category,
            "summary": summary,
            "technical_metadata": metadata
        }
    }
