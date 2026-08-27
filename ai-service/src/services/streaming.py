import asyncio
import json
import logging
from typing import List, AsyncGenerator, Optional
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage
from src.services.agent import llm, llm_with_tools
from src.services.tools.definitions import ALL_TOOLS
from src.services.prompts import build_copilot_system_prompt, build_solutions_consultant_prompt

logger = logging.getLogger("buildstack.ai.streaming")

tools_by_name = {t.name: t for t in ALL_TOOLS}

def build_chat_messages(prompt: str, system_prompt: str, history: Optional[list] = None) -> List[BaseMessage]:
    """
    Constructs the sequence of LangChain message objects including system prompt, user history, and latest query.
    """
    messages: List[BaseMessage] = [SystemMessage(content=system_prompt)]
    has_user = False

    if history:
        for m in history:
            role = m.role if hasattr(m, 'role') else m.get('role') if isinstance(m, dict) else getattr(m, 'role', None)
            content = m.content if hasattr(m, 'content') else m.get('content') if isinstance(m, dict) else getattr(m, 'content', None)
            if role == "user" and content:
                messages.append(HumanMessage(content=str(content)))
                has_user = True
            elif role == "assistant" and content:
                messages.append(AIMessage(content=str(content)))

    last_history_content = (
        (history[-1].content if hasattr(history[-1], 'content') else history[-1].get('content'))
        if history and len(history) > 0
        else None
    )

    if prompt and (not history or last_history_content != prompt):
        messages.append(HumanMessage(content=prompt))
        has_user = True

    if not has_user:
        messages.append(HumanMessage(content=prompt if prompt else "Hello"))

    return messages

async def stream_agent_graph_events(messages: List[BaseMessage]) -> AsyncGenerator[str, None]:
    """
    Executes a high-performance, robust 2-pass ReAct agent:
    1. First pass: Detects if any specialized tools (catalog search, acoustic calc, BOM) are needed.
    2. Runs matched tools locally and yields `tool_start` and `tool_end` SSE events.
    3. Second pass: Streams tokens to the client with the retrieved authoritative specifications.
    Uses standard Human/System/AI messages that work 100% reliably with ANY LLM provider.
    """
    try:
        # Step 1: Query LLM with tools to detect required tools
        first_pass = await llm_with_tools.ainvoke(messages)
        tool_calls = getattr(first_pass, "tool_calls", []) or []

        if tool_calls:
            tool_outputs = []
            for tc in tool_calls:
                t_name = tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", "tool")
                t_args = tc.get("args") if isinstance(tc, dict) else getattr(tc, "args", {}) or {}

                yield f"data: {json.dumps({'type': 'tool_start', 'tool': t_name})}\n\n"

                tool_fn = tools_by_name.get(t_name)
                if tool_fn:
                    try:
                        res = await asyncio.to_thread(tool_fn.invoke, t_args)
                    except Exception as te:
                        logger.error(f"[Tool Execution Error] {t_name}: {te}")
                        res = {"error": str(te)}
                else:
                    res = {"error": f"Tool {t_name} not found"}

                tool_outputs.append(f"### [Tool: {t_name}]\n{json.dumps(res, indent=2, default=str)}")
                yield f"data: {json.dumps({'type': 'tool_end', 'tool': t_name})}\n\n"

            # Step 2: Synthesize final answer with tool outputs as verified context
            tool_context = "\n\n".join(tool_outputs)
            synthesis_messages = list(messages) + [
                HumanMessage(content=f"Verified Specifications & Catalog Data from internal tools:\n{tool_context}\n\nPlease synthesize a clear, helpful, expert answer for the user based strictly on these verified specifications.")
            ]
            async for chunk in llm.astream(synthesis_messages):
                if chunk.content:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
        else:
            # No tools needed, stream answer directly
            if first_pass.content:
                yield f"data: {json.dumps({'type': 'token', 'content': first_pass.content})}\n\n"
            else:
                async for chunk in llm.astream(messages):
                    if chunk.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

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
