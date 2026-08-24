from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="BuildStack AI Copilot Service")

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
        "timestamp": datetime.utcnow().isoformat()
    }
