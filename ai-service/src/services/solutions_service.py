import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from src.config import settings
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger("buildstack.ai.solutions")

class DynamicQuestionsOutput(BaseModel):
    question_1: str = Field(description="First clarifying question about preferred material, style, or purpose")
    question_2: str = Field(description="Second clarifying question about daily usage, traffic, or durability needs")
    question_3: str = Field(description="Third clarifying question about subfloor/wall condition or installation constraints")

llm = ChatOpenAI(
    base_url=settings.AI_BASE_URL,
    api_key=settings.AI_API_KEY,
    model=settings.LLM_MODEL,
    temperature=0.4,
    timeout=30.0,
    max_retries=1,
)

structured_llm = llm.with_structured_output(DynamicQuestionsOutput)

SYSTEM_PROMPT = """You are a helpful building and renovation advisor on BuildStack.
A user describes a project in plain English. Your goal is to generate EXACTLY 3 direct, friendly clarifying questions to understand their practical project needs.

EXAMPLES OF GOOD QUESTIONS:
- For flooring:
  question_1: What type of flooring material do you prefer for this space?
  question_2: How much foot traffic and daily wear does this area receive?
  question_3: What is the condition of the existing subfloor?
- For walls/partitions:
  question_1: What is the primary purpose of this wall or partition?
  question_2: Do you need sound dampening between these rooms?
  question_3: Will you be mounting heavy cabinets, TVs, or tiles on the wall?
- For ceilings:
  question_1: Are you looking to improve acoustic comfort or hide pipes and wiring?
  question_2: What is the current ceiling height and structure?
  question_3: Do you plan to install recessed lighting or suspended fixtures?

RULES:
1. You must provide question_1, question_2, and question_3.
2. Never include 'e.g.' or suggestions in the question text.
3. No technical jargon or building code numbers (no DIN, EN, CW, UW).
4. Keep questions concise, friendly, and practical."""

def generate_dynamic_questions(prompt: str, static_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generates exactly 3 dynamic clarifying questions as a simple list of strings.
    """
    logger.info(f"[SolutionsService] Generating exactly 3 dynamic questions for: '{prompt}'")
    static_params = static_params or {}
    budget = static_params.get("budget", "mid")
    moisture = static_params.get("moisture_level", "normal")

    user_message = f"""Project description: "{prompt}"
Budget preference: {budget}
Moisture condition: {moisture}

Generate 3 clarifying questions for this project."""

    result = structured_llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_message)
    ])

    questions = []
    if isinstance(result, DynamicQuestionsOutput):
        questions = [result.question_1, result.question_2, result.question_3]
    elif isinstance(result, dict):
        if "question_1" in result and "question_2" in result and "question_3" in result:
            questions = [result["question_1"], result["question_2"], result["question_3"]]
        elif "questions" in result and isinstance(result["questions"], list):
            questions = [str(q) for q in result["questions"][:3]]

    return {
        "success": True,
        "questions": questions,
    }
