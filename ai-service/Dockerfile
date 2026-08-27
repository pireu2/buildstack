FROM python:3.12-slim

# Install uv for extremely fast package resolution and installation
RUN pip install uv

WORKDIR /app
COPY pyproject.toml .

# Install dependencies system-wide in the container using uv
RUN uv pip install --system .

# Pre-download FastEmbed model during docker build so container starts in 0.1 seconds
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('nomic-ai/nomic-embed-text-v1.5')"

COPY . .

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
