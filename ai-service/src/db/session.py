import logging
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from src.config import settings
from src.db.models import Base

logger = logging.getLogger("buildstack.ai.db")

def get_sqlalchemy_url() -> str:
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return db_url

engine = create_engine(
    get_sqlalchemy_url(),
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

@contextmanager
def get_db() -> Generator[Session, None, None]:
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def init_db() -> bool:
    try:
        with engine.begin() as conn:
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("[Database] Extension 'vector' (pgvector) initialized.")
            except Exception as e:
                logger.warning(f"[Database] Notice on 'vector' extension creation: {e}")

            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {settings.VECTOR_SCHEMA};"))
            logger.info(f"[Database] Schema '{settings.VECTOR_SCHEMA}' ready.")

            Base.metadata.create_all(conn)

            try:
                conn.execute(text(
                    f"ALTER TABLE {settings.VECTOR_SCHEMA}.vector_embeddings "
                    f"ALTER COLUMN embedding TYPE vector({settings.EMBEDDING_DIM});"
                ))
            except Exception as dim_err:
                logger.debug(f"[Database] Dimension alter notice: {dim_err}")

            logger.info(f"[Database] Table '{settings.VECTOR_SCHEMA}.vector_embeddings' verified (dim={settings.EMBEDDING_DIM}).")
            return True
    except Exception as e:
        logger.error(f"[Database] Initialization failed: {e}")
        return False