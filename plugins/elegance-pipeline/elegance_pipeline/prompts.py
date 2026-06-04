"""Build the substitution context handed to each role template.

Pulls prior-stage outputs from the store and packages them, plus run state,
into the flat ``{placeholder}`` dictionary the renderer expects.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional

from models import JUDGE_SLOTS, SCOUT_SLOTS, AgentRecord, WorkflowConfig, WorkflowState
from readiness import ready_agents
from store import FileStore


def join_outputs(heading: str, chunks: List[str]) -> str:
    filtered = [chunk.strip() for chunk in chunks if chunk.strip()]
    if not filtered:
        return f"{heading}\n<none yet>"
    return heading + "\n\n" + "\n\n---\n\n".join(filtered)


def parse_signal(text: str) -> Optional[bool]:
    """Read the verifier's approval verdict; None when no verdict is present."""
    patterns = (
        r"Implementation approved:\s*(yes|no)",
        r"Implementation warranted:\s*(yes|no)",
    )
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip().lower() == "yes"
    return None


def build_context(
    store: FileStore,
    cfg: WorkflowConfig,
    state: WorkflowState,
    record: AgentRecord,
    pipeline_cmd: str,
) -> Dict[str, str]:
    scout_outputs = [store.read_output(state, slot) for slot in SCOUT_SLOTS]
    judge_outputs = [store.read_output(state, slot) for slot in JUDGE_SLOTS]
    planner_output = store.read_output(state, "planner-1")
    verifier_output = store.read_output(state, "verifier-1")
    return {
        "project_anchor": cfg.project_anchor,
        "package_or_folder_scope": record.scope or "<assign a scope>",
        "slot_name": record.slot,
        "scout_outputs": join_outputs("Scout outputs", scout_outputs),
        "judge_outputs": join_outputs("Judge outputs", judge_outputs),
        "planner_output": planner_output or "<none yet>",
        "verifier_output": verifier_output or "<none yet>",
        "implementation_signal": state.signal_label,
        "ready_agents": ", ".join(ready_agents(state)) or "<none>",
        "pipeline_cmd": pipeline_cmd,
    }
