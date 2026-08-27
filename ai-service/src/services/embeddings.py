import logging
from typing import Sequence
from fastembed import TextEmbedding
from src.config import settings

logger = logging.getLogger("buildstack.ai.embeddings")

class EmbeddingsClient:
    def __init__(self):
        model_name = "nomic-ai/nomic-embed-text-v1.5"
        logger.info(f"[Embeddings] Initializing FastEmbed model '{model_name}' (dim={settings.EMBEDDING_DIM})...")
        self.model = TextEmbedding(model_name=model_name)

    def embed_query(self, text: str) -> list[float]:
        """Generates 768-dim embedding vector for a single query text locally."""
        try:
            embeddings = list(self.model.embed([text]))
            return embeddings[0].tolist()
        except Exception as e:
            logger.error(f"[Embeddings] Failed to embed query locally: {e}")
            raise

    def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        """Generates 768-dim embedding vectors for a list of document chunks locally."""
        text_list = list(texts)
        if not text_list:
            return []
        try:
            logger.info(f"[Embeddings] Embedding {len(text_list)} documents with FastEmbed...")
            embeddings = list(self.model.embed(text_list))
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"[Embeddings] Failed to embed documents locally: {e}")
            raise

embeddings_client = EmbeddingsClient()
