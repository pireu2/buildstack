import logging
import json
from typing import List, AsyncGenerator, Optional
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from src.services.agent import agent_graph
from src.services.prompts import build_copilot_system_prompt, build_solutions_consultant_prompt

logger = logging.getLogger("buildstack.ai.streaming")

def build_chat_messages(prompt: str, system_prompt: str, history: Optional[list] = None) -> List[BaseMessage]:
    """
    Constructs the sequence of LangChain message objects including system prompt, user history, and latest query.
    """
    messages: List[BaseMessage] = [SystemMessage(content=system_prompt)]
    if history:
        for m in history:
            role = m.role if hasattr(m, 'role') else m.get('role') if isinstance(m, dict) else getattr(m, 'role', None)
            content = m.content if hasattr(m, 'content') else m.get('content') if isinstance(m, dict) else getattr(m, 'content', None)
            if role == "user" and content:
                messages.append(HumanMessage(content=content))
            elif role == "assistant" and content:
                messages.append(AIMessage(content=content))

    last_history_content = (
        (history[-1].content if hasattr(history[-1], 'content') else history[-1].get('content'))
        if history and len(history) > 0
        else None
    )

    if not history or last_history_content != prompt:
        messages.append(HumanMessage(content=prompt))

    return messages

async def stream_agent_graph_events(messages: List[BaseMessage]) -> AsyncGenerator[str, None]:
    """
    Executes LangGraph agent_graph reasoning loop and yields Server-Sent Events (SSE).
    Filters out internal tool-call thoughts and streams final tokens, tool events, and completion markers.
    """
    try:
        initial_state = {"messages": messages}
        current_step_buffer = []
        is_final_step = False

        async for event in agent_graph.astream_events(initial_state, version="v2"):
            kind = event["event"]

            if kind == "on_chat_model_start":
                current_step_buffer = []

            elif kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if is_final_step:
                    if chunk.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
                else:
                    if chunk.content and not getattr(chunk, "tool_call_chunks", None):
                        current_step_buffer.append(chunk.content)

            elif kind == "on_chat_model_end":
                output = event["data"]["output"]
                has_tool_calls = bool(getattr(output, "tool_calls", None))
                if has_tool_calls:
                    current_step_buffer = []
                else:
                    is_final_step = True
                    if current_step_buffer:
                        for text in current_step_buffer:
                            yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"
                        current_step_buffer = []

            elif kind == "on_tool_start":
                tool_name = event["name"]
                yield f"data: {json.dumps({'type': 'tool_start', 'tool': tool_name})}\n\n"

            elif kind == "on_tool_end":
                tool_name = event["name"]
                yield f"data: {json.dumps({'type': 'tool_end', 'tool': tool_name})}\n\n"

            elif kind == "on_chain_end" and event["name"] == "LangGraph":
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        logger.error(f"[StreamAgentGraph] Execution error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

def stream_copilot_chat(
    prompt: str,
    context: Optional[dict] = None,
    messages: Optional[list] = None
) -> AsyncGenerator[str, None]:
    """
    Generates system prompt and streams reasoning events for the Copilot chat.
    """
    context = context or {}
    system_prompt = build_copilot_system_prompt(context)
    chat_messages = build_chat_messages(prompt, system_prompt, messages)
    return stream_agent_graph_events(chat_messages)

def stream_solutions_chat(
    prompt: str,
    context: Optional[dict] = None,
    messages: Optional[list] = None
) -> AsyncGenerator[str, None]:
    """
    Generates system prompt and streams reasoning events for the Solutions consultant chat.
    """
    context = context or {}
    system_prompt = build_solutions_consultant_prompt(context)
    chat_messages = build_chat_messages(prompt, system_prompt, messages)
    return stream_agent_graph_events(chat_messages)
