from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class MessageItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    messages: Optional[List[MessageItem]] = None
    user_id: Optional[str] = None

class QuestionsRequest(BaseModel):
    prompt: str
    static_params: Optional[Dict[str, Any]] = None

class GeneratePlansRequest(BaseModel):
    prompt: str
    budget: Optional[str] = "mid"
    moisture_level: Optional[str] = "dry"
    dimensions: Optional[Dict[str, Any]] = None
    answers: Optional[List[Dict[str, str]]] = None

class SolutionsChatRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None
    messages: Optional[List[MessageItem]] = None
    user_id: Optional[str] = None
