FROM python:3.12-slim

# Install uv for extremely fast package resolution and installation
RUN pip install uv

WORKDIR /app
COPY pyproject.toml .

# Install dependencies system-wide in the container using uv
RUN uv pip install --system .

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
