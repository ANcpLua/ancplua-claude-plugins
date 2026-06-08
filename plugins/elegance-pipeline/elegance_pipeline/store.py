"""Persistence for workflow config and state.

State is project-local at {cwd}/.claude/elegance_pipeline/state/ by default,
or under an explicit --state-dir.
"""
from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

from models import AgentRecord, WorkflowConfig, WorkflowState, build_fresh_state


class FileStore:
    def __init__(self, state_dir: Path) -> None:
        self.state_dir = state_dir

    @property
    def config_path(self) -> Path:
        return self.state_dir / "config.json"

    @property
    def state_path(self) -> Path:
        return self.state_dir / "workflow_state.json"

    def ensure_dirs(self) -> None:
        self.state_dir.mkdir(parents=True, exist_ok=True)
        (self.state_dir / "outputs").mkdir(parents=True, exist_ok=True)

    def load_config(self) -> WorkflowConfig:
        if not self.config_path.exists():
            raise SystemExit(f"Missing config: {self.config_path}. Run init first.")
        data = json.loads(self.config_path.read_text(encoding="utf-8"))
        return WorkflowConfig(**data)

    def save_config(self, cfg: WorkflowConfig) -> None:
        self.ensure_dirs()
        self.config_path.write_text(json.dumps(asdict(cfg), indent=2), encoding="utf-8")

    def load_state(self, cfg: WorkflowConfig) -> WorkflowState:
        if not self.state_path.exists():
            state = build_fresh_state(cfg)
            self.save_state(state)
            return state
        raw = json.loads(self.state_path.read_text(encoding="utf-8"))
        # Start from a fresh state so every required slot exists, then overlay the persisted
        # records. A partial or stale state file can't drop slots that downstream code indexes.
        state = build_fresh_state(cfg)
        state.implementation_signal = raw.get("implementation_signal", False)
        state.verifier_signal_source = raw.get("verifier_signal_source")
        for key, value in raw.get("agents", {}).items():
            state.agents[key] = AgentRecord(
                role=value["role"],
                slot=value["slot"],
                status=value["status"],
                scope=value["scope"],
                output_file=value["output_file"],
                submitted_at=value["submitted_at"],
            )
        return state

    def save_state(self, state: WorkflowState) -> None:
        self.ensure_dirs()
        payload = {
            "implementation_signal": state.implementation_signal,
            "verifier_signal_source": state.verifier_signal_source,
            "agents": {key: asdict(value) for key, value in state.agents.items()},
        }
        self.state_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def read_output(self, state: WorkflowState, slot: str) -> str:
        record = state.agents.get(slot)
        if not record or not record.output_file:
            return ""
        path = self.state_dir / record.output_file
        if not path.exists():
            return ""
        return path.read_text(encoding="utf-8").strip()

    def write_output(self, slot: str, text: str) -> str:
        self.ensure_dirs()
        output_rel = f"outputs/{slot}.md"
        (self.state_dir / output_rel).write_text(text, encoding="utf-8")
        return output_rel
