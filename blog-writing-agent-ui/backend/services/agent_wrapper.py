"""
Wrapper script for the LangGraph blog-writing agent.
Outputs step-by-step progress as JSON lines to stdout, and the final result as a JSON blob.
Usage: python agent_wrapper.py "<topic>" "<mode>"
"""
import sys
import json
import os

# Load .env from the root langgraph-agents directory
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(env_path)

# Import the agent components
sys.path.insert(0, os.path.dirname(__file__))
# We need to go to the 4-Blog-writing-agent directory
agent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '4-Blog-writing-agent')
sys.path.insert(0, agent_dir)

from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List, Annotated, Literal, Optional
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langgraph.types import Send
from langchain.messages import HumanMessage, SystemMessage
import operator


def emit_step(index, status):
    """Emit a step progress update."""
    print(f'STEP:{json.dumps({"index": index, "status": status})}', flush=True)


def main():
    topic = sys.argv[1] if len(sys.argv) > 1 else "AI in 2026"
    mode_hint = sys.argv[2] if len(sys.argv) > 2 else "hybrid"

    # Import from main.py
    from main import (
        BlogState, Plan, Task, EvidenceItem, RouterDecision, EvidencePack,
        ROUTER_SYSTEM, RESEARCH_SYSTEM, ORCH_SYSTEM, WORKER_SYSTEM,
        llm, _tavily_search
    )

    # Wrap nodes to emit progress
    def router_node(state):
        emit_step(0, 'active')
        topic = state["topic"]
        decider = llm.with_structured_output(RouterDecision)
        decision = decider.invoke([
            SystemMessage(content=ROUTER_SYSTEM),
            HumanMessage(content=f"Topic: {topic}"),
        ])
        emit_step(0, 'done')
        return {
            "needs_research": decision.needs_research,
            "mode": decision.mode,
            "queries": decision.queries,
        }

    def research_node(state):
        emit_step(1, 'active')
        queries = state.get('queries') or []
        raw_results = []
        for query in queries:
            raw_results.extend(_tavily_search(query, 2))
        if not raw_results:
            emit_step(1, 'done')
            return {"evidence": []}
        extractor = llm.with_structured_output(EvidencePack)
        pack = extractor.invoke([
            SystemMessage(content=RESEARCH_SYSTEM),
            HumanMessage(content=f"Raw results:\n{raw_results}"),
        ])
        dedup = {}
        for e in pack.evidence:
            if e.url:
                dedup[e.url] = e
        emit_step(1, 'done')
        return {"evidence": list(dedup.values())}

    def orchestrator_node(state):
        emit_step(2, 'active')
        evidence = state.get('evidence') or []
        mode = state.get("mode", "closed_book")
        plan = llm.with_structured_output(Plan).invoke([
            SystemMessage(ORCH_SYSTEM),
            HumanMessage(content=(
                f"Topic: {state['topic']}\n"
                f"Mode: {mode}\n\n"
                f"Evidence (ONLY use for fresh claims; may be empty):\n"
                f"{[e.model_dump() for e in evidence][:16]}"
            ))
        ])
        emit_step(2, 'done')
        return {"plan": plan}

    def fanout(state):
        emit_step(3, 'active')
        return [
            Send("worker", {
                "task": task,
                "topic": state["topic"],
                "plan": state["plan"],
                "mode": state["mode"],
                "evidence": [e.model_dump() for e in state.get("evidence", [])]
            })
            for task in state["plan"].tasks
        ]

    def worker_node(payload):
        task = payload["task"] if isinstance(payload["task"], Task) else Task(**payload["task"])
        plan = payload["plan"] if isinstance(payload["plan"], Plan) else Plan(**payload["plan"])
        evidence = [e if isinstance(e, EvidenceItem) else EvidenceItem(**e) for e in payload.get("evidence", [])]
        topic = payload["topic"]
        mode = payload.get("mode", "closed_book")

        bullets_text = "\n- " + "\n- ".join(task.bullets)
        evidence_text = ""
        if evidence:
            evidence_text = "\n".join(
                f"- {e.title} | {e.url} | {e.published_at or 'date:unknown'}".strip()
                for e in evidence[:20]
            )

        section_md = llm.invoke([
            SystemMessage(content=WORKER_SYSTEM),
            HumanMessage(content=(
                f"Blog title: {plan.blog_title}\n"
                f"Audience: {plan.audience}\n"
                f"Tone: {plan.tone}\n"
                f"Blog kind: {plan.blog_kind}\n"
                f"Constraints: {plan.constraints}\n"
                f"Topic: {topic}\n"
                f"Mode: {mode}\n\n"
                f"Section title: {task.title}\n"
                f"Goal: {task.goal}\n"
                f"Target words: {task.target_words}\n"
                f"Tags: {task.tags}\n"
                f"requires_research: {task.requires_research}\n"
                f"requires_citations: {task.requires_citations}\n"
                f"requires_code: {task.requires_code}\n"
                f"Bullets:{bullets_text}\n\n"
                f"Evidence (ONLY use these URLs when citing):\n{evidence_text}\n"
            )),
        ]).content.strip()

        return {"sections": [(task.id, section_md)]}

    def reducer_node(state):
        emit_step(3, 'done')
        emit_step(4, 'active')
        plan = state["plan"]
        ordered_sections = [md for _, md in sorted(state["sections"], key=lambda x: x[0])]
        body = "\n\n".join(ordered_sections).strip()
        final_md = f"# {plan.blog_title}\n\n{body}\n"
        emit_step(4, 'done')
        return {"final": final_md}

    def next_route(state):
        return "research" if state["needs_research"] else "orchestrator"

    # Build graph
    graph = StateGraph(BlogState)
    graph.add_node('router', router_node)
    graph.add_node('research', research_node)
    graph.add_node('orchestrator', orchestrator_node)
    graph.add_node('worker', worker_node)
    graph.add_node('reducer', reducer_node)

    graph.add_edge(START, 'router')
    graph.add_conditional_edges('router', next_route, {"research": "research", "orchestrator": "orchestrator"})
    graph.add_edge('research', 'orchestrator')
    graph.add_conditional_edges('orchestrator', fanout, ['worker'])
    graph.add_edge('worker', 'reducer')
    graph.add_edge(END, 'reducer')

    workflow = graph.compile()

    out = workflow.invoke({
        "topic": topic,
        "mode": "",
        "needs_research": False,
        "queries": [],
        "evidence": [],
        "plan": None,
        "sections": [],
        "final": "",
    })

    # Serialize the result
    plan_dict = out["plan"].model_dump() if out.get("plan") else None
    sections_list = []
    if out.get("sections"):
        for sid, content in sorted(out["sections"], key=lambda x: x[0]):
            sections_list.append({"id": sid, "title": f"Section {sid}", "content": content})

    result = {
        "topic": topic,
        "mode": out.get("mode", mode_hint),
        "plan": plan_dict,
        "sections": sections_list,
        "finalMarkdown": out.get("final", ""),
        "imageSpecs": [],
        "wordCount": len(out.get("final", "").split()),
    }

    print(f'RESULT:{json.dumps(result)}', flush=True)


if __name__ == "__main__":
    main()
