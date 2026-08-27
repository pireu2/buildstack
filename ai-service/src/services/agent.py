import logging
from typing import TypedDict, Annotated, List
from langgraph.graph import StateGraph, START
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import BaseMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from src.services.tools.definitions import ALL_TOOLS
from src.config import settings

logger = logging.getLogger("buildstack.ai.agent")

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], "add_messages"]

llm = ChatOpenAI(
    base_url=settings.AI_BASE_URL,
    api_key=settings.AI_API_KEY,
    model=settings.LLM_MODEL,
    streaming=True,
)

llm_with_tools = llm.bind_tools(ALL_TOOLS)

def agent_node(state: AgentState):
    """
    Executes a reasoning step of the ReAct agent with native bound tools.
    Guarantees every ToolMessage and tool_call has explicit name, id, and content.
    """
    messages = state["messages"]
    tool_call_names = {}
    for m in messages:
        tool_calls = getattr(m, "tool_calls", None) or []
        for tc in tool_calls:
            tc_id = tc.get("id") if isinstance(tc, dict) else getattr(tc, "id", None)
            tc_name = tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None)
            if tc_id and tc_name:
                tool_call_names[str(tc_id)] = str(tc_name)

    fixed_messages = []
    for m in messages:
        m_type = getattr(m, "type", "")
        if m_type == "tool" or isinstance(m, ToolMessage):
            tool_id = str(getattr(m, "tool_call_id", None) or "call_0")
            tool_name = str(
                getattr(m, "name", None)
                or tool_call_names.get(tool_id)
                or "search_catalog_and_standards"
            )
            fixed_messages.append(ToolMessage(
                content=str(m.content) if m.content is not None else "",
                tool_call_id=tool_id,
                name=tool_name,
            ))
        elif hasattr(m, "tool_calls") and m.tool_calls:
            fixed_calls = []
            for tc in m.tool_calls:
                call_id = str((tc.get("id") if isinstance(tc, dict) else getattr(tc, "id", None)) or "call_0")
                call_name = str((tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None)) or "search_catalog_and_standards")
                call_args = (tc.get("args") if isinstance(tc, dict) else getattr(tc, "args", {})) or {}
                fixed_calls.append({
                    "id": call_id,
                    "name": call_name,
                    "args": call_args,
                })
            fixed_messages.append(AIMessage(
                content=str(m.content or ""),
                tool_calls=fixed_calls,
                id=getattr(m, "id", None),
            ))
        else:
            fixed_messages.append(m)

    response = llm_with_tools.invoke(fixed_messages)
    return {"messages": [response]}

tool_node = ToolNode(ALL_TOOLS)

def build_graph():
    """
    Constructs the LangGraph ReAct agent workflow.
    """
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)

    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", tools_condition)
    workflow.add_edge("tools", "agent")

    return workflow.compile()

agent_graph = build_graph()
