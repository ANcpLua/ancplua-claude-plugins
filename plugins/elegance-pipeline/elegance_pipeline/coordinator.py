"""Workflow orchestration: the command surface behind the CLI subcommands.

Thin layer over the store, readiness gate, prompt builder, plus view. Each
public method maps to one CLI verb (init / status / prompt / submit / signal).
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import view
from models import AgentRecord, WorkflowConfig, WorkflowState, build_fresh_state, normalize_scopes
from prompts import build_context, parse_signal
from readiness import downstream_submitted, ready_agents
from renderer import TemplateRenderer
from store import FileStore

_NOT_READY = {
    "judge": "All 4 scouts must be submitted first.",
    "planner": "Both judges must be submitted first.",
    "verifier": "Planner must be submitted first.",
    "implementer": "Verifier must approve implementation first or set signal manually.",
}


class WorkflowCoordinator:
    def __init__(self, state_dir: Path, explicit_state_dir: bool) -> None:
        self.store = FileStore(state_dir)
        self.renderer = TemplateRenderer()
        self.explicit_state_dir = explicit_state_dir

    def init(self, project_anchor: str, scopes: List[str], project_root: Optional[str]) -> None:
        anchor = project_anchor.strip()
        if not anchor:
            raise SystemExit("project_anchor must not be empty")
        cfg = WorkflowConfig(
            project_anchor=anchor,
            scopes=normalize_scopes(scopes),
            project_root=(project_root or os.getcwd()).strip(),
        )
        view.warn_on_shared_reuse(self.store, self.explicit_state_dir)
        self.store.save_config(cfg)
        self.store.save_state(build_fresh_state(cfg))
        view.report_init(cfg, self._label())

    def status(self) -> None:
        cfg = self.store.load_config()
        state = self.store.load_state(cfg)
        print(f"Project anchor: {cfg.project_anchor}")
        print(f"Project root: {cfg.project_root}")
        print(f"State dir: {self._label()}")
        print(f"Implementation signal: {view.signal_line(state)}")
        print("")
        for slot in sorted(state.agents.keys()):
            print(view.agent_line(state.agents[slot]))
        print("")
        view.print_ready(state)

    def prompt(self, role: str, slot: str) -> None:
        cfg = self.store.load_config()
        state = self.store.load_state(cfg)
        record = self._record_for_slot(state, slot, role)
        self._assert_ready(state, record)
        cmd = view.pipeline_cmd(self.store.state_dir, self.explicit_state_dir)
        context = build_context(self.store, cfg, state, record, cmd)
        print(self.renderer.render(role, context))

    def submit(self, role: str, slot: str, text: str) -> None:
        cfg = self.store.load_config()
        state = self.store.load_state(cfg)
        record = self._record_for_slot(state, slot, role)
        if record.status == "submitted" and downstream_submitted(state, slot):
            raise SystemExit(
                f"{slot} is already submitted and a later stage has advanced. "
                "Re-init or roll back the downstream slots before re-submitting."
            )
        record.output_file = self.store.write_output(slot, text)
        record.status = "submitted"
        record.submitted_at = datetime.now(timezone.utc).isoformat()
        if role == "verifier":
            self._apply_verifier_verdict(state, slot, text)
        self.store.save_state(state)
        print(f"Saved output to {self.store.state_dir / record.output_file}")
        view.print_ready(state)

    def signal(self, on: bool) -> None:
        cfg = self.store.load_config()
        state = self.store.load_state(cfg)
        state.implementation_signal = on
        state.verifier_signal_source = "manual"
        self.store.save_state(state)
        print(f"Implementation signal set to {view.signal_line(state)}")

    # -- helpers --------------------------------------------------------

    def _label(self) -> str:
        return view.state_dir_label(self.store.state_dir, self.explicit_state_dir)

    def _apply_verifier_verdict(self, state: WorkflowState, slot: str, text: str) -> None:
        verdict = parse_signal(text)
        if verdict is None:
            print(
                "Warning: no verifier verdict found "
                "(expected 'Implementation approved: yes|no'). Gate left BLOCKED; "
                "use 'signal on' to override.",
                file=sys.stderr,
            )
        state.implementation_signal = bool(verdict)
        state.verifier_signal_source = slot

    def _record_for_slot(self, state: WorkflowState, slot: str, role: str) -> AgentRecord:
        record = state.agents.get(slot)
        if record is None:
            raise SystemExit(f"Unknown slot: {slot}")
        if record.role != role:
            raise SystemExit(f"Slot {slot} is role={record.role}, not role={role}")
        return record

    def _assert_ready(self, state: WorkflowState, record: AgentRecord) -> None:
        if record.status == "submitted" or record.slot in ready_agents(state):
            return
        raise SystemExit(_NOT_READY.get(record.role, "This slot is not ready yet."))
