"""
Wrapper script for the LangGraph blog-writing agent.
It imports and runs the real root main.py workflow, emits simple step events
to stdout, and finally prints a RESULT JSON object for the Node backend.
"""
import json
import os
import re
import sys
from datetime import date

from dotenv import load_dotenv


AGENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

load_dotenv(os.path.join(AGENT_DIR, ".env"))
load_dotenv(os.path.join(AGENT_DIR, "..", ".env"))

sys.path.insert(0, AGENT_DIR)


def emit_step(index, status):
    print(f'STEP:{json.dumps({"index": index, "status": status})}', flush=True)


def build_sections(plan, final_markdown):
    if not final_markdown:
        return []

    chunks = re.split(r"(?m)^##\s+", final_markdown)
    sections = []

    if chunks and chunks[0].startswith("# "):
        chunks = chunks[1:]

    for index, chunk in enumerate(chunks, start=1):
        chunk = chunk.strip()
        if not chunk:
            continue

        lines = chunk.splitlines()
        title = lines[0].strip() if lines else f"Section {index}"
        content = f"## {chunk}".strip()
        sections.append(
            {
                "id": index,
                "title": title,
                "content": content,
            }
        )

    if not sections and plan and getattr(plan, "tasks", None):
        return [{"id": task.id, "title": task.title, "content": ""} for task in plan.tasks]

    return sections


def main():
    topic = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "AI in 2026"
    llm_provider = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2].strip() else "groq"
    llm_model = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3].strip() else ""

    from langgraph.graph import START, END, StateGraph
    from main import (
        BlogState,
        DEFAULT_MODEL_BY_PROVIDER,
        configure_llm,
        next_route,
        router_node,
        research_node,
        orchestrator_node,
        worker_node,
        reducer_subgraph,
    )

    configure_llm(llm_provider, llm_model or DEFAULT_MODEL_BY_PROVIDER.get(llm_provider, ""))

    def router_with_progress(state):
        emit_step(0, "active")
        result = router_node(state)
        emit_step(0, "done")
        return result

    def research_with_progress(state):
        emit_step(1, "active")
        result = research_node(state)
        emit_step(1, "done")
        return result

    def orchestrator_with_progress(state):
        emit_step(2, "active")
        result = orchestrator_node(state)
        emit_step(2, "done")
        return result

    def fanout_with_progress(state):
        emit_step(3, "active")
        from main import fanout

        return fanout(state)

    def worker_with_progress(payload):
        return worker_node(payload)

    def reducer_with_progress(state):
        emit_step(3, "done")
        emit_step(4, "active")
        result = reducer_subgraph.invoke(state)
        emit_step(4, "done")
        return result

    graph = StateGraph(BlogState)
    graph.add_node("router", router_with_progress)
    graph.add_node("research", research_with_progress)
    graph.add_node("orchestrator", orchestrator_with_progress)
    graph.add_node("worker", worker_with_progress)
    graph.add_node("reducer", reducer_with_progress)

    graph.add_edge(START, "router")
    graph.add_conditional_edges("router", next_route, {"research": "research", "orchestrator": "orchestrator"})
    graph.add_edge("research", "orchestrator")
    graph.add_conditional_edges("orchestrator", fanout_with_progress, ["worker"])
    graph.add_edge("worker", "reducer")
    graph.add_edge("reducer", END)

    workflow = graph.compile()

    out = workflow.invoke(
        {
            "topic": topic,
            "llm_provider": llm_provider,
            "llm_model": llm_model or DEFAULT_MODEL_BY_PROVIDER.get(llm_provider, ""),
            "mode": "",
            "needs_research": False,
            "queries": [],
            "evidence": [],
            "plan": None,
            "as_of": date.today().isoformat(),
            "recency_days": 7,
            "sections": [],
            "merged_md": "",
            "md_with_placeholders": "",
            "image_specs": [],
            "final": "",
        }
    )

    plan = out.get("plan")
    final_markdown = out.get("final", "")
    sections = build_sections(plan, final_markdown)

    result = {
        "topic": topic,
        "mode": out.get("mode"),
        "llmProvider": llm_provider,
        "llmModel": llm_model or DEFAULT_MODEL_BY_PROVIDER.get(llm_provider, ""),
        "plan": plan.model_dump() if plan else None,
        "sections": sections,
        "finalMarkdown": final_markdown,
        "imageSpecs": out.get("image_specs", []),
        "wordCount": len(final_markdown.split()),
    }

    print(f"RESULT:{json.dumps(result)}", flush=True)


if __name__ == "__main__":
    main()
