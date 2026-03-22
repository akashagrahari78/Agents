from langgraph.graph import StateGraph,START,END
from dotenv import load_dotenv
from typing import TypedDict, Annotated
import os
import requests
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langchain_community.tools import DuckDuckGoSearchRun
from langgraph.prebuilt import tools_condition,ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph.message import add_messages
from pathlib import Path


load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)


class researchState(TypedDict):
    messages : Annotated[list[BaseMessage], add_messages]



# tools  
tavily_search_tool = TavilySearch(max_results=5)
duckduckgo_search_tool = DuckDuckGoSearchRun()
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "XOSW3TU5IJ9K7Q74")

@tool
def tavily_search(query: str) -> str:
    """Search the web using Tavily."""
    return str(tavily_search_tool.invoke({"query": query}))


@tool
def duckduckgo_search(query: str) -> str:
    """Search the web using DuckDuckGo."""
    return str(duckduckgo_search_tool.invoke(query))


@tool
def get_stock_price(symbol: str) -> dict:
    """
    Get the latest stock price for a company.
    Input should be a valid stock ticker symbol like 'AAPL', 'TSLA', etc.
    """
    url = (
        "https://www.alphavantage.co/query"
        f"?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
    )

    response = requests.get(url, timeout=15)
    data = response.json()

    try:
        price_data = data["Global Quote"]

        return {
            "symbol": price_data["01. symbol"],
            "price": price_data["05. price"],
            "change": price_data["09. change"],
            "change_percent": price_data["10. change percent"]
        }
    except Exception:
        return {"error": "Could not fetch stock price"}

tools =  [tavily_search, duckduckgo_search, get_stock_price]

llm_with_tools = llm.bind_tools(tools=tools)



# nodes
def chat_node(state: researchState) -> researchState:
    messages = state['messages']
    routing_prompt = SystemMessage(
    content=(
        "You are a research assistant.\n"
        "If the user asks for real-time or external data (like stock prices, news, weather), "
        "you MUST call the appropriate tool.\n"
        "When calling a tool, strictly follow the correct JSON format.\n"
        "Do not generate malformed tool calls.\n"
        "If no tool is needed, answer directly."
     )
    )
    response = llm_with_tools.invoke([routing_prompt, *messages])
    # print(response)
    return {'messages': response}

tool_node = ToolNode(tools)



# graph
graph = StateGraph(researchState)

graph.add_node('chat_node', chat_node)
graph.add_node('tools', tool_node)


graph.add_edge(START, 'chat_node')
graph.add_conditional_edges('chat_node', tools_condition)
graph.add_edge('tools', 'chat_node')

chatbot = graph.compile()



# --------------------------------------------------------------
png_bytes = chatbot.get_graph().draw_mermaid_png()
png_path = Path(__file__).with_name("workflow.png")
png_path.write_bytes(png_bytes)
print(f"Workflow PNG saved to {png_path.name}")

# --------------------------------------------------------------
try:
    output = chatbot.invoke({'messages': [HumanMessage(content= "what is stock price of apple")]})
    print(output['messages'][-1].content)
    print(output)
except Exception:
        print("Tool calling failed, retrying...")

