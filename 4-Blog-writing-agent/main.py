from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Annotated, Literal, Optional
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langgraph.types import Send
from langchain.messages import HumanMessage, AIMessage, SystemMessage
import operator
from pathlib import Path



# --------------------------------------------llm--------------------------------------------
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)


#----------------------------------------------structured Outputs----------------------------
class Task(BaseModel):
    id: int
    title: str

    goal: str = Field(
        ...,
        description="One sentence describing what the reader should be able to do/understand after this section.",
    )
    bullets: List[str] = Field(
        ...,
        min_length=3,
        max_length=6,
        description="3–6 concrete, non-overlapping subpoints to cover in this section.",
    )
    target_words: int = Field(..., description="Target word count for this section (120–550).")

    tags: List[str] = Field(default_factory=list)
    requires_research: bool = False
    requires_citations: bool = False
    requires_code: bool = False



class Plan(BaseModel):
    blog_title: str
    audience: str
    tone: str
    blog_kind: Literal["explainer", "tutorial", "news_roundup", "comparison", "system_design"] = "explainer"
    constraints: List[str] = Field(default_factory=list)
    tasks: List[Task]



class EvidenceItem(BaseModel):
    title: str
    url: str
    published_at: Optional[str] = None  
    snippet: Optional[str] = None
    source: Optional[str] = None



class RouterDecision(BaseModel):
    needs_research: bool
    mode: Literal["closed_book", "hybrid", "open_book"]
    queries: List[str] = Field(default_factory=list)



class EvidencePack(BaseModel):
    evidence: List[EvidenceItem] = Field(default_factory=list)




# --------------------------------------------state of graph----------------------------------
class BlogState(TypedDict):
   topic : str
   mode : str
   needs_research: bool
   queries: List[str]
   evidence : List[EvidenceItem]
   plan : Plan

   sections : Annotated[List[tuple[str, int]], operator.add]  #[ (1, "Introduction"),(2, "How AI Works"),]
   final : str



# ----------------------------------------------functions--------------------------------------

ROUTER_SYSTEM = """You are a routing module for a technical blog planner.

Decide whether web research is needed BEFORE planning.

Modes:
- closed_book (needs_research=false):
  Evergreen topics where correctness does not depend on recent facts (concepts, fundamentals).
- hybrid (needs_research=true):
  Mostly evergreen but needs up-to-date examples/tools/models to be useful.
- open_book (needs_research=true):
  Mostly volatile: weekly roundups, "this week", "latest", rankings, pricing, policy/regulation.

If needs_research=true:
- Output 3–10 high-signal queries.
- Queries should be scoped and specific (avoid generic queries like just "AI" or "LLM").
- If user asked for "last week/this week/latest", reflect that constraint IN THE QUERIES.
"""

def router_node(state : BlogState) -> dict:
    
    topic = state["topic"]
    decider = llm.with_structured_output(RouterDecision)
    decision = decider.invoke([
        SystemMessage(content=ROUTER_SYSTEM),
        HumanMessage(content=f"Topic: {topic}"),   
        ])
    
    return {
        "needs_research": decision.needs_research,
        "mode": decision.mode,
        "queries": decision.queries,
    }


   
def _tavily_search(query: str, max_results : int) :
    results = TavilySearch(max_results = 5).invoke({"query": query})
    items = results.get("results", []) if isinstance(results, dict) else results

    output = []
    for r in items:
        output.append({
        "title": r.get("title", ""),
        "url": r.get("url", ""),
        "published_at": r.get("published_at", ""),
        "snippet": r.get("content", ""),
        "source": r.get("source", ""),
        })

    return output



RESEARCH_SYSTEM = """You are a research synthesizer for technical writing.

Given raw web search results, produce a deduplicated list of EvidenceItem objects.

Rules:
- Only include items with a non-empty url.
- Prefer relevant + authoritative sources (company blogs, docs, reputable outlets).
- If a published date is explicitly present in the result payload, keep it as YYYY-MM-DD.
  If missing or unclear, set published_at=null. Do NOT guess.
- Keep snippets short.
- Deduplicate by URL.
"""

def research_node(state : BlogState):
    
    queries = state.get('queries' or [])
    max_results = 5
    raw_results: List[dict] = []
    for query in queries:
        raw_results.extend(_tavily_search(query, max_results))

    if not raw_results:
        return {"evidence": []}

    extractor = llm.with_structured_output(EvidencePack)
    pack = extractor.invoke(
        [
            SystemMessage(content=RESEARCH_SYSTEM),
            HumanMessage(content=f"Raw results:\n{raw_results}"),
        ]
    )

     # Deduplicate by URL
    dedup = {}
    for e in pack.evidence:
        if e.url:
            dedup[e.url] = e

    return {"evidence": list(dedup.values())}



def orchestrator_node(state : BlogState):
    pass

def worker_node(state : BlogState):
    pass

def reducer_node(state : BlogState):
    pass

def next_route(state : BlogState):
    pass

def fanout(state : BlogState):
    pass







#-----------------------------------------------graph -----------------------------------------

graph = StateGraph(BlogState)

# -----------------------------nodes--------------------------
graph.add_node('router', router_node)
graph.add_node('research', research_node)
graph.add_node('orchestrator', orchestrator_node)
graph.add_node('worker', worker_node)
graph.add_node('reducer', reducer_node)


# -----------------------------edges--------------------------
graph.add_edge(START, 'router')
graph.add_conditional_edges('rounter', next_route,  {"research": "research", "orchestrator": "orchestrator"})
graph.add_edge('research', 'orchestrator')
graph.add_conditional_edges('orchestrator', fanout, ['worker'])
graph.add_edge('worker', 'reducer')
graph.add_edge('reducer', END)

workflow = graph.compile()

