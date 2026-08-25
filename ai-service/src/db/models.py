import uuid
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy import String, Text, DateTime, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from src.config import settings

class Base(DeclarativeBase):
    pass

class VectorEmbedding(Base):
    """
    Unified vector embeddings store in the isolated 'ai' PostgreSQL schema.
    Stores semantic representations, chunks, and metadata for both products and knowledge documents.
    """
    __tablename__ = "vector_embeddings"
    __table_args__ = (
        Index("idx_vector_embeddings_entity_type", "entity_type"),
        Index("idx_vector_embeddings_category", "category"),
        Index("idx_vector_embeddings_code", "code"),
        {"schema": settings.VECTOR_SCHEMA}
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    entity_type: Mapped[str] = mapped_column(String(50))  # 'product' | 'knowledge_doc'
    code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, default=dict)
    
    # pgvector embedding representation
    embedding: Mapped[list[float]] = mapped_column(Vector(settings.EMBEDDING_DIM))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
