"""Presentation helpers: turn workflow state into the CLI's printed output.

Kept apart from the coordinator so orchestration stays free of formatting
detail. Everything here is a pure string builder plus a couple of printers.
"""
from __future__ import annotations

import shlex
from pathlib import Path

from models import AgentRecord, WorkflowConfig, WorkflowState
from paths import PIPELINE_SCRIPT
from readiness import ready_agents
from store import FileStore


def signal_label(state: WorkflowState) -> str:
    return "READY" if state.implementation_signal else "BLOCKED"


def state_dir_label(state_dir: Path, explicit: bool) -> str:
    if explicit:
        return str(state_dir)
    return f"{state_dir} (default shared state)"


def pipeline_cmd(state_dir: Path, explicit: bool) -> str:
    script = shlex.quote(str(PIPELINE_SCRIPT))
    if not explicit:
        return f"python {script}"
    return f"python {script} --state-dir {shlex.quote(str(state_dir))}"


def agent_line(record: AgentRecord) -> str:
    extra = f" scope={record.scope}" if record.scope else ""
    out = f" output={record.output_file}" if record.output_file else ""
    return f"- {record.slot}: {record.status}{extra}{out}"


def print_ready(state: WorkflowState) -> None:
    print("Ready now:")
    for item in ready_agents(state):
        print(f"  - {item}")


def report_init(cfg: WorkflowConfig, label: str) -> None:
    print(f"Initialized elegance pipeline for {cfg.project_anchor}")
    print(f"State dir: {label}")
    print("Scout scopes:")
    for index, scope in enumerate(cfg.scopes, start=1):
        print(f"  scout-{index}: {scope}")


def warn_on_shared_reuse(store: FileStore, explicit: bool) -> None:
    reusing_shared = not explicit and store.config_path.exists()
    if reusing_shared:
        print(
            f"Warning: reusing default shared state at {store.state_dir}. "
            "Use --state-dir for one team per spec."
        )
