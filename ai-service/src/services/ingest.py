import logging
import httpx
from typing import Any
from sqlalchemy import text
from src.config import settings
from src.db.session import init_db, get_db
from src.db.models import VectorEmbedding
from src.services.chunker import chunk_product, chunk_knowledge_document
from src.services.embeddings import embeddings_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("buildstack.ai.ingest")

def fetch_products() -> list[dict[str, Any]]:
    """Fetches catalog products via HTTP from the Core Express API."""
    url = f"{settings.CORE_API_URL}/products?limit=100"
    logger.info(f"[Ingest] Fetching products from API: {url}")
    response = httpx.get(url, timeout=settings.HTTP_TIMEOUT_SECONDS)
    response.raise_for_status()
    products = response.json().get("data", [])
    logger.info(f"[Ingest] Retrieved {len(products)} products from Core API.")
    return products

def fetch_knowledge() -> list[dict[str, Any]]:
    """Fetches knowledge documents via HTTP from the Core Express API."""
    url = f"{settings.CORE_API_URL}/knowledge"
    logger.info(f"[Ingest] Fetching knowledge documents from API: {url}")
    response = httpx.get(url, timeout=settings.HTTP_TIMEOUT_SECONDS)
    response.raise_for_status()
    documents = response.json().get("data", [])
    logger.info(f"[Ingest] Retrieved {len(documents)} knowledge documents from Core API.")
    return documents

def run_ingestion() -> dict[str, Any]:
    logger.info("[Ingest] Starting BuildStack Vector Ingestion Pipeline...")
    init_db()

    products = fetch_products()
    knowledge_docs = fetch_knowledge()

    chunks: list[dict[str, Any]] = [chunk_product(p) for p in products]
    chunks.extend([chunk_knowledge_document(k) for k in knowledge_docs])

    logger.info(f"[Ingest] Prepared {len(chunks)} total chunks for embedding ({len(products)} products, {len(knowledge_docs)} standards).")

    if not chunks:
        logger.warning("[Ingest] No chunks to embed. Exiting.")
        return {"status": "empty", "inserted": 0}

    texts_to_embed = [c["content"] for c in chunks]
    logger.info(f"[Ingest] Requesting embeddings from model '{settings.EMBEDDING_MODEL}'...")
    
    embeddings = embeddings_client.embed_documents(texts_to_embed)
    logger.info(f"[Ingest] Generated {len(embeddings)} embedding vectors.")

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
                embedding=embedding,
            )
            for chunk, embedding in zip(chunks, embeddings)
        ]

        session.add_all(orm_records)
        session.commit()
        logger.info(f"[Ingest] Successfully inserted {len(orm_records)} vector records into '{settings.VECTOR_SCHEMA}.vector_embeddings'.")

    return {
        "status": "success",
        "products_indexed": len(products),
        "knowledge_docs_indexed": len(knowledge_docs),
        "total_embeddings_stored": len(chunks),
        "embedding_model": settings.EMBEDDING_MODEL,
        "embedding_dim": len(embeddings[0]) if embeddings else 0,
        "schema": settings.VECTOR_SCHEMA
    }

if __name__ == "__main__":
    result = run_ingestion()
    print("\n--- Ingestion Result ---")
    for k, v in result.items():
        print(f"  {k}: {v}")
