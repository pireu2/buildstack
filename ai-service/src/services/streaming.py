import logging
import json
from typing import List, AsyncGenerator
from langchain_core.messages import BaseMessage
from src.services.agent import agent_graph

logger = logging.getLogger("buildstack.ai.streaming")

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
