import logging
from typing import Sequence
from langchain_openai import OpenAIEmbeddings
from src.config import settings

logger = logging.getLogger("buildstack.ai.embeddings")

class EmbeddingsClient:
    def __init__(self):
        logger.info(
            f"[Embeddings] Initializing provider: base_url={settings.AI_BASE_URL}, "
            f"model={settings.EMBEDDING_MODEL}, dim={settings.EMBEDDING_DIM}"
        )
        self.client = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_base=settings.AI_BASE_URL,
            openai_api_key=settings.AI_API_KEY,
            check_embedding_ctx_length=False,
        )

    def embed_query(self, text: str) -> list[float]:
        """Generates embedding vector for a single query text."""
        try:
            return self.client.embed_query(text)
        except Exception as e:
            logger.error(f"[Embeddings] Failed to embed query: {e}")
            raise

    def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        """Generates embedding vectors for a batch of text chunks."""
        try:
            return self.client.embed_documents(list(texts))
        except Exception as e:
            logger.error(f"[Embeddings] Failed to embed batch of {len(texts)} documents: {e}")
            raise

embeddings_client = EmbeddingsClient()
