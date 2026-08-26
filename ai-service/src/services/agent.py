import logging
from typing import TypedDict, Annotated, List
from langgraph.graph import StateGraph, START
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import BaseMessage, AIMessage
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
    """
    response = llm_with_tools.invoke(state["messages"])
    if response.tool_calls:
        # Clear thinking text during tool calls to ensure a clean final engineering answer
        response = AIMessage(content="", tool_calls=response.tool_calls)
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
