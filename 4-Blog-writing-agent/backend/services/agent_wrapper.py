"""
Session-based wrapper for the LangGraph blog-writing agent.

It starts the graph, pauses on LangGraph interrupts for human review, and can
resume from stdin commands without losing graph state.
"""
import json
import os
import re
import sys
import uuid
from datetime import date

from dotenv import load_dotenv
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command


PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(PROJECT_DIR, "backend")
AGENT_DIR = os.path.join(BACKEND_DIR, "agent")

load_dotenv(os.path.join(PROJECT_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(PROJECT_DIR), ".env"))

sys.path.insert(0, BACKEND_DIR)


def emit(prefix, payload):
    print(f"{prefix}:{json.dumps(payload)}", flush=True)


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


def parse_payload():
    raw_payload = sys.argv[1] if len(sys.argv) > 1 else ""
    if not raw_payload:
        return {}

    try:
        return json.loads(raw_payload)
    except json.JSONDecodeError:
        return {"topic": raw_payload}


def build_input_state(payload, default_model_by_provider):
    topic = (payload.get("topic") or "AI in 2026").strip()
    llm_provider = (payload.get("llmProvider") or "groq").strip()
    llm_model = (payload.get("llmModel") or default_model_by_provider.get(llm_provider, "")).strip()

    return {
        "topic": topic,
        "llm_provider": llm_provider,
        "llm_model": llm_model,
        "audience": (payload.get("audience") or "developers").strip(),
        "tone": (payload.get("tone") or "professional").strip(),
        "target_word_count": int(payload.get("targetWordCount") or 2000),
        "include_code": bool(payload.get("includeCode", True)),
        "include_citations": bool(payload.get("includeCitations", True)),
        "include_images": bool(payload.get("includeImages", False)),
        "mode": "",
        "needs_research": False,
        "queries": [],
        "evidence": [],
        "plan": None,
        "plan_approved": False,
        "as_of": date.today().isoformat(),
        "recency_days": 7,
        "sections": [],
        "merged_md": "",
        "md_with_placeholders": "",
        "image_specs": [],
        "final": "",
    }


def serialize_final_result(out, payload, default_model_by_provider):
    values = out.value if hasattr(out, "value") else out
    plan = values.get("plan")
    final_markdown = values.get("final", "")
    llm_provider = (payload.get("llmProvider") or "groq").strip()
    llm_model = (payload.get("llmModel") or default_model_by_provider.get(llm_provider, "")).strip()

    return {
        "topic": payload.get("topic", ""),
        "mode": values.get("mode"),
        "llmProvider": llm_provider,
        "llmModel": llm_model,
        "audience": payload.get("audience", "developers"),
        "tone": payload.get("tone", "professional"),
        "targetWordCount": int(payload.get("targetWordCount") or 2000),
        "includeCode": bool(payload.get("includeCode", True)),
        "includeCitations": bool(payload.get("includeCitations", True)),
        "includeImages": bool(payload.get("includeImages", False)),
        "plan": plan.model_dump() if plan else None,
        "sections": build_sections(plan, final_markdown),
        "finalMarkdown": final_markdown,
        "imageSpecs": values.get("image_specs", []),
        "wordCount": len(final_markdown.split()),
    }


def build_session_workflow():
    from agent.main import (
        DEFAULT_MODEL_BY_PROVIDER,
        build_workflow,
        configure_llm,
    )

    payload = parse_payload()
    llm_provider = (payload.get("llmProvider") or "groq").strip()
    llm_model = (payload.get("llmModel") or DEFAULT_MODEL_BY_PROVIDER.get(llm_provider, "")).strip()
    configure_llm(llm_provider, llm_model)

    workflow = build_workflow(checkpointer=InMemorySaver())
    return payload, DEFAULT_MODEL_BY_PROVIDER, workflow


def run_until_pause_or_complete(workflow, command_or_input, config, payload, default_model_by_provider):
    out = workflow.invoke(command_or_input, config=config)
    if hasattr(out, "interrupts"):
        interrupts = out.interrupts or ()
    elif isinstance(out, dict):
        interrupts = out.get("__interrupt__", ())
    else:
        interrupts = ()

    if interrupts:
        interrupt_value = interrupts[0].value
        emit(
            "INTERRUPT",
            {
                "threadId": config["configurable"]["thread_id"],
                "value": interrupt_value,
            },
        )
        return "interrupted"

    emit("RESULT", serialize_final_result(out, payload, default_model_by_provider))
    return "completed"


def main():
    payload, default_model_by_provider, workflow = build_session_workflow()
    initial_state = build_input_state(payload, default_model_by_provider)
    thread_id = payload.get("threadId") or payload.get("sessionId") or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    status = run_until_pause_or_complete(
        workflow,
        initial_state,
        config,
        payload,
        default_model_by_provider,
    )

    if status == "completed":
        return

    for line in sys.stdin:
        raw = line.strip()
        if not raw:
            continue

        try:
            command = json.loads(raw)
        except json.JSONDecodeError:
            emit("ERROR", {"message": "Malformed resume payload"})
            continue

        action = command.get("action")
        if action == "resume":
            status = run_until_pause_or_complete(
                workflow,
                Command(resume={"approved": bool(command.get("approved"))}),
                config,
                payload,
                default_model_by_provider,
            )
            if status == "completed":
                return
        elif action == "stop":
            return
        else:
            emit("ERROR", {"message": f"Unknown action: {action}"})


if __name__ == "__main__":
    main()
