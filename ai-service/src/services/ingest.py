import logging
from typing import Any
import httpx
from sqlalchemy import text
from src.config import settings
from src.db.session import init_db, get_db
from src.db.models import VectorEmbedding
from src.services.chunker import chunk_product, chunk_knowledge_document
from src.services.embeddings import embeddings_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("buildstack.ai.ingest")

def fetch_products() -> list[dict[str, Any]]:
    """Fetches all catalog products with category metadata directly from the database (or Core API)."""
    try:
        with get_db() as session:
            rows = session.execute(text("""
                SELECT 
                    p.id, p.sku, p.name, p.slug, p.manufacturer, p.description,
                    p.price, p.unit, p.image_url as "imageUrl", p.data,
                    c.name as "category_name", c.slug as "category_slug"
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY p.name ASC;
            """)).mappings().all()
            
            if rows:
                products = []
                for r in rows:
                    p_dict = dict(r)
                    p_dict["category"] = {
                        "name": r.get("category_name") or "Building Materials",
                        "slug": r.get("category_slug") or "general"
                    }
                    products.append(p_dict)
                logger.info(f"[Ingest] Retrieved {len(products)} products from database.")
                return products
    except Exception as e:
        logger.warning(f"[Ingest] Direct DB product fetch failed ({e}), falling back to Core API...")

    # Fallback via HTTP API
    response = httpx.get(f"{settings.CORE_API_URL}/products?limit=500", timeout=settings.HTTP_TIMEOUT_SECONDS)
    response.raise_for_status()
    products = response.json().get("data", [])
    logger.info(f"[Ingest] Retrieved {len(products)} products from Core API.")
    return products

def fetch_knowledge() -> list[dict[str, Any]]:
    """Fetches all knowledge documents and standards from database (or Core API)."""
    try:
        with get_db() as session:
            rows = session.execute(text("""
                SELECT id, code, title, category, standard, summary, content, metadata
                FROM knowledge_documents
                ORDER BY code ASC;
            """)).mappings().all()
            if rows:
                docs = [dict(r) for r in rows]
                logger.info(f"[Ingest] Retrieved {len(docs)} knowledge documents from database.")
                return docs
    except Exception as e:
        logger.warning(f"[Ingest] Direct DB knowledge fetch failed ({e}), falling back to Core API...")

    response = httpx.get(f"{settings.CORE_API_URL}/knowledge", timeout=settings.HTTP_TIMEOUT_SECONDS)
    response.raise_for_status()
    docs = response.json().get("data", [])
    logger.info(f"[Ingest] Retrieved {len(docs)} knowledge documents from Core API.")
    return docs

def run_ingestion() -> dict[str, Any]:
    """Runs the vector ingestion pipeline: fetch -> chunk -> embed -> store."""
    logger.info("[Ingest] Starting BuildStack Vector Ingestion Pipeline...")
    init_db()

    products = fetch_products()
    knowledge_docs = fetch_knowledge()

    chunks: list[dict[str, Any]] = [chunk_product(p) for p in products]
    chunks.extend([chunk_knowledge_document(k) for k in knowledge_docs])

    logger.info(f"[Ingest] Prepared {len(chunks)} chunks ({len(products)} products, {len(knowledge_docs)} standards).")
    if not chunks:
        logger.warning("[Ingest] No data found to embed.")
        return {"status": "empty", "inserted": 0}

    logger.info(f"[Ingest] Generating embeddings with model '{settings.EMBEDDING_MODEL}'...")
    embeddings = embeddings_client.embed_documents([c["content"] for c in chunks])

    with get_db() as session:
        session.execute(text(f"DELETE FROM {settings.VECTOR_SCHEMA}.vector_embeddings;"))
        orm_records = [
            VectorEmbedding(
                entity_id=chunk["entity_id"],
                entity_type=chunk["entity_type"],
                code=chunk["code"],
                title=chunk["title"],
                category=chunk["category"],
                content=chunk["content"],
                metadata_=chunk["metadata"],
                embedding=emb,
            )
            for chunk, emb in zip(chunks, embeddings)
        ]
        session.add_all(orm_records)
        session.commit()
        logger.info(f"[Ingest] Stored {len(orm_records)} vector records in '{settings.VECTOR_SCHEMA}.vector_embeddings'.")

    return {
        "status": "success",
        "products_indexed": len(products),
        "knowledge_docs_indexed": len(knowledge_docs),
        "total_embeddings_stored": len(chunks),
        "embedding_model": settings.EMBEDDING_MODEL,
        "embedding_dim": len(embeddings[0]) if embeddings else 0,
    }

if __name__ == "__main__":
    result = run_ingestion()
    print("\n--- Ingestion Result ---")
    for k, v in result.items():
        print(f"  {k}: {v}")
