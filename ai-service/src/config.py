import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PORT: int = 8000
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/buildstack"
    )
    CORE_API_URL: str = os.getenv("CORE_API_URL", "http://localhost:5000/api/v1/core")

    AI_BASE_URL: str = os.getenv("AI_BASE_URL", "http://localhost:11434/v1")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "ollama")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-3.6-flash")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    EMBEDDING_DIM: int = int(os.getenv("EMBEDDING_DIM", "768"))
    VECTOR_SCHEMA: str = os.getenv("VECTOR_SCHEMA", "ai")

    # Rate Limiting & HTTP Constants
    SEARCH_RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("SEARCH_RATE_LIMIT_MAX_REQUESTS", "40"))
    SEARCH_RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("SEARCH_RATE_LIMIT_WINDOW_SECONDS", "60"))
    
    # Tiered 24h Chat Rate Limits: 100/24h for authenticated, 10/24h for anonymous
    CHAT_AUTH_RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("CHAT_AUTH_RATE_LIMIT_MAX_REQUESTS", "100"))
    CHAT_ANON_RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("CHAT_ANON_RATE_LIMIT_MAX_REQUESTS", "10"))
    CHAT_RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("CHAT_RATE_LIMIT_WINDOW_SECONDS", "86400"))

    # Project Solutions Generation Limits: 10/24h for authenticated, 2/24h for anonymous
    SOLUTIONS_GENERATE_AUTH_RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("SOLUTIONS_GENERATE_AUTH_RATE_LIMIT_MAX_REQUESTS", "10"))
    SOLUTIONS_GENERATE_ANON_RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("SOLUTIONS_GENERATE_ANON_RATE_LIMIT_MAX_REQUESTS", "2"))
    SOLUTIONS_GENERATE_RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("SOLUTIONS_GENERATE_RATE_LIMIT_WINDOW_SECONDS", "86400"))

    # Dynamic Questions Rate Limits (similar to search)
    QUESTIONS_RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("QUESTIONS_RATE_LIMIT_MAX_REQUESTS", "40"))
    QUESTIONS_RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("QUESTIONS_RATE_LIMIT_WINDOW_SECONDS", "60"))

    DEFAULT_SEARCH_LIMIT: int = 20
    MAX_SEARCH_LIMIT: int = 100
    MIN_SEARCH_QUERY_LENGTH: int = 2
    DEFAULT_SIMILARITY_LIMIT: int = 5
    HTTP_TIMEOUT_SECONDS: float = 10.0

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
