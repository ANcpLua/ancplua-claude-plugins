#!/usr/bin/env python3
"""Elegance pipeline state manager for Claude Code.

Manages persistent workflow state for the multi-agent elegance pipeline:
4 scouts -> 2 judges -> 1 planner -> 1 verifier -> 1 gated implementer.

Templates are bundled with the plugin (relative to this script).
State is project-local at {cwd}/.claude/elegance_pipeline/state/.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import sys
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Dict, List, Optional

SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = SCRIPT_DIR / "templates"
DEFAULT_STATE_DIR = Path.cwd() / ".claude" / "elegance_pipeline" / "state"

SCOUT_COUNT = 4
JUDGE_COUNT = 2


@dataclass
class AgentRecord:
    role: str
    slot: str
    status: str = "pending"
    scope: Optional[str] = None
    output_file: Optional[str] = None
    submitted_at: Optional[str] = None


@dataclass
class WorkflowConfig:
    project_anchor: str
    scopes: List[str]
    project_root: str


@dataclass
class WorkflowState:
    implementation_signal: bool = False
    verifier_signal_source: Optional[str] = None
    agents: Dict[str, AgentRecord] = field(default_factory=dict)


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
            raise SystemExit(
                f"Missing config: {self.config_path}. Run init first."
            )
        data = json.loads(self.config_path.read_text(encoding="utf-8"))
        return WorkflowConfig(**data)

    def save_config(self, cfg: WorkflowConfig) -> None:
        self.ensure_dirs()
        self.config_path.write_text(json.dumps(asdict(cfg), indent=2), encoding="utf-8")

    def load_state(self, cfg: WorkflowConfig) -> WorkflowState:
        if not self.state_path.exists():
            state = self._fresh_state(cfg)
            self.save_state(state)
            return state
        raw = json.loads(self.state_path.read_text(encoding="utf-8"))
        agents = {
            key: AgentRecord(**value)
            for key, value in raw.get("agents", {}).items()
        }
        return WorkflowState(
            implementation_signal=raw.get("implementation_signal", False),
            verifier_signal_source=raw.get("verifier_signal_source"),
            agents=agents,
        )

    def save_state(self, state: WorkflowState) -> None:
        self.ensure_dirs()
        payload = {
            "implementation_signal": state.implementation_signal,
            "verifier_signal_source": state.verifier_signal_source,
            "agents": {k: asdict(v) for k, v in state.agents.items()},
        }
        self.state_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _fresh_state(self, cfg: WorkflowConfig) -> WorkflowState:
        agents: Dict[str, AgentRecord] = {}
        for index in range(1, SCOUT_COUNT + 1):
            scope = cfg.scopes[index - 1] if index - 1 < len(cfg.scopes) else None
            agents[f"scout-{index}"] = AgentRecord(role="scout", slot=f"scout-{index}", scope=scope)
        for index in range(1, JUDGE_COUNT + 1):
            agents[f"judge-{index}"] = AgentRecord(role="judge", slot=f"judge-{index}")
        agents["planner-1"] = AgentRecord(role="planner", slot="planner-1")
        agents["verifier-1"] = AgentRecord(role="verifier", slot="verifier-1")
        agents["implementer-1"] = AgentRecord(role="implementer", slot="implementer-1")
        return WorkflowState(agents=agents)


class TemplateRenderer:
    def render(self, name: str, context: Dict[str, str]) -> str:
        template_path = TEMPLATE_DIR / f"{name}.md"
        if not template_path.exists():
            raise SystemExit(f"Missing template: {template_path}")
        text = template_path.read_text(encoding="utf-8")
        for key, value in context.items():
            text = text.replace("{" + key + "}", value)
        return text


class WorkflowCoordinator:
    def __init__(self, state_dir: Path, explicit_state_dir: bool) -> None:
        self.store = FileStore(state_dir)
        self.renderer = TemplateRenderer()
        self.explicit_state_dir = explicit_state_dir

    def _state_dir_label(self) -> str:
        if self.explicit_state_dir:
            return str(self.store.state_dir)
        return f"{self.store.state_dir} (default shared state)"

    def _pipeline_cmd(self) -> str:
        script = shlex.quote(str(SCRIPT_DIR / "pipeline.py"))
        if not self.explicit_state_dir:
            return f"python {script}"
        state_dir = shlex.quote(str(self.store.state_dir))
        return f"python {script} --state-dir {state_dir}"

    def init(self, project_anchor: str, scopes: List[str], project_root: Optional[str]) -> None:
        scopes = [scope.strip() for scope in scopes if scope.strip()]
        if not project_anchor.strip():
            raise SystemExit("project_anchor must not be empty")
        if not scopes:
            raise SystemExit("At least one scope is required")
        if len(scopes) < SCOUT_COUNT:
            scopes = scopes + [scopes[-1]] * (SCOUT_COUNT - len(scopes))
        cfg = WorkflowConfig(
            project_anchor=project_anchor.strip(),
            scopes=scopes[:SCOUT_COUNT],
            project_root=(project_root or os.getcwd()).strip(),
        )
        if not self.explicit_state_dir and self.store.config_path.exists():
            print(
                f"Warning: reusing default shared state at {self.store.state_dir}. "
                "Use --state-dir for one team per spec."
            )
        self.store.save_config(cfg)
        state = self.store._fresh_state(cfg)
        self.store.save_state(state)
        print(f"Initialized elegance pipeline for {cfg.project_anchor}")
        print(f"State dir: {self._state_dir_label()}")
        print("Scout scopes:")
        for index, scope in enumerate(cfg.scopes, start=1):
            print(f"  scout-{index}: {scope}")

    def status(self) -> None:
        cfg = self.store.load_config()
        state = self.store.load_state(cfg)
        print(f"Project anchor: {cfg.project_anchor}")
        print(f"Project root: {cfg.project_root}")
        print(f"State dir: {self._state_dir_label()}")
        print(f"Implementation signal: {'READY' if state.implementation_signal else 'BLOCKED'}")
        print("")
        for key in sorted(state.agents.keys()):
            record = state.agents[key]
            extra = f" scope={record.scope}" if record.scope else ""
            out = f" output={record.output_file}" if record.output_file else ""
            print(f"- {key}: {record.status}{extra}{out}")
        print("")
        print("Ready now:")
        for item in self.ready_agents(state):
            print(f"  - {item}")

    def ready_agents(self, state: WorkflowState) -> List[str]:
        ready: List[str] = []
        for index in range(1, SCOUT_COUNT + 1):
            slot = f"scout-{index}"
            if state.agents[slot].status == "pending":
                ready.append(slot)
        if all(state.agents[f"scout-{i}"].status == "submitted" for i in range(1, SCOUT_COUNT + 1)):
            for index in range(1, JUDGE_COUNT + 1):
                slot = f"judge-{index}"
                if state.agents[slot].status == "pending":
                    ready.append(slot)
        if all(state.agents[f"judge-{i}"].status == "submitted" for i in range(1, JUDGE_COUNT + 1)):
            if state.agents["planner-1"].status == "pending":
                ready.append("planner-1")
        if state.agents["planner-1"].status == "submitted" and state.agents["verifier-1"].status == "pending":
            ready.append("verifier-1")
        if state.implementation_signal and state.agents["implementer-1"].status == "pending":
            ready.append("implementer-1")
        return ready

    def prompt(self, role: str, slot: str) -> None:
        cfg = self.store.load_config()
        state = self.store.load_state(cfg)
        record = self._record_for_slot(state, slot, role)
        self._assert_ready(state, record)
        context = self._context_for(cfg, state, record)
        print(self.renderer.render(role, context))

    def submit(self, role: str, slot: str, text: str) -> None:
        cfg = self.store.load_config()
        state = self.store.load_state(cfg)
        record = self._record_for_slot(state, slot, role)
        output_rel = f"outputs/{slot}.md"
        output_path = self.store.state_dir / output_rel
        output_path.write_text(text, encoding="utf-8")
        record.status = "submitted"
        record.output_file = str(output_rel)
        from datetime import datetime, timezone
        record.submitted_at = datetime.now(timezone.utc).isoformat()
        if role == "verifier":
            approved = self._parse_bool(text, r"Implementation approved:\s*(yes|no)")
            if approved is None:
                approved = self._parse_bool(text, r"Implementation warranted:\s*(yes|no)")
            if approved:
                state.implementation_signal = True
                state.verifier_signal_source = slot
            else:
                state.implementation_signal = False
                state.verifier_signal_source = slot
        self.store.save_state(state)
        print(f"Saved output to {output_path}")
        print("Ready now:")
        for item in self.ready_agents(state):
            print(f"  - {item}")

    def signal(self, on: bool) -> None:
        cfg = self.store.load_config()
        state = self.store.load_state(cfg)
        state.implementation_signal = on
        state.verifier_signal_source = "manual"
        self.store.save_state(state)
        print(f"Implementation signal set to {'READY' if on else 'BLOCKED'}")

    def _record_for_slot(self, state: WorkflowState, slot: str, role: str) -> AgentRecord:
        record = state.agents.get(slot)
        if record is None:
            raise SystemExit(f"Unknown slot: {slot}")
        if record.role != role:
            raise SystemExit(f"Slot {slot} is role={record.role}, not role={role}")
        return record

    def _assert_ready(self, state: WorkflowState, record: AgentRecord) -> None:
        ready = set(self.ready_agents(state))
        if record.slot not in ready and record.status != "submitted":
            reasons = {
                "judge": "All 4 scouts must be submitted first.",
                "planner": "Both judges must be submitted first.",
                "verifier": "Planner must be submitted first.",
                "implementer": "Verifier must approve implementation first or set signal manually.",
            }
            raise SystemExit(reasons.get(record.role, "This slot is not ready yet."))

    def _read_output(self, state: WorkflowState, slot: str) -> str:
        record = state.agents.get(slot)
        if not record or not record.output_file:
            return ""
        path = self.store.state_dir / record.output_file
        if not path.exists():
            return ""
        return path.read_text(encoding="utf-8").strip()

    def _join_outputs(self, heading: str, chunks: List[str]) -> str:
        filtered = [chunk.strip() for chunk in chunks if chunk.strip()]
        if not filtered:
            return f"{heading}\n<none yet>"
        return heading + "\n\n" + "\n\n---\n\n".join(filtered)

    def _context_for(self, cfg: WorkflowConfig, state: WorkflowState, record: AgentRecord) -> Dict[str, str]:
        scout_outputs = [self._read_output(state, f"scout-{i}") for i in range(1, SCOUT_COUNT + 1)]
        judge_outputs = [self._read_output(state, f"judge-{i}") for i in range(1, JUDGE_COUNT + 1)]
        planner_output = self._read_output(state, "planner-1")
        verifier_output = self._read_output(state, "verifier-1")
        scouts_block = self._join_outputs("Scout outputs", scout_outputs)
        judges_block = self._join_outputs("Judge outputs", judge_outputs)
        return {
            "project_anchor": cfg.project_anchor,
            "package_or_folder_scope": record.scope or "<assign a scope>",
            "slot_name": record.slot,
            "scout_outputs": scouts_block,
            "judge_outputs": judges_block,
            "planner_output": planner_output or "<none yet>",
            "verifier_output": verifier_output or "<none yet>",
            "implementation_signal": "READY" if state.implementation_signal else "BLOCKED",
            "ready_agents": ", ".join(self.ready_agents(state)) or "<none>",
            "pipeline_cmd": self._pipeline_cmd(),
        }

    @staticmethod
    def _parse_bool(text: str, pattern: str) -> Optional[bool]:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            return None
        return match.group(1).strip().lower() == "yes"


def _read_submission_text(file_path: Optional[str], use_stdin: bool) -> str:
    if file_path:
        return Path(file_path).read_text(encoding="utf-8")
    if use_stdin:
        return sys.stdin.read()
    raise SystemExit("Use --file or --stdin to provide submission text")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Elegance pipeline state manager")
    parser.add_argument("--state-dir")
    sub = parser.add_subparsers(dest="command", required=True)

    p_init = sub.add_parser("init", help="Initialize or reset the workflow")
    p_init.add_argument("--project-anchor", required=True)
    p_init.add_argument("--scope", action="append", default=[])
    p_init.add_argument("--project-root")

    sub.add_parser("status", help="Show workflow status")

    p_prompt = sub.add_parser("prompt", help="Render the prompt for a role and slot")
    p_prompt.add_argument("--role", required=True, choices=["scout", "judge", "planner", "verifier", "implementer"])
    p_prompt.add_argument("--slot", required=True)

    p_submit = sub.add_parser("submit", help="Submit an agent result")
    p_submit.add_argument("--role", required=True, choices=["scout", "judge", "planner", "verifier", "implementer"])
    p_submit.add_argument("--slot", required=True)
    p_submit.add_argument("--file")
    p_submit.add_argument("--stdin", action="store_true")

    p_signal = sub.add_parser("signal", help="Manually set implementation signal")
    p_signal.add_argument("value", choices=["on", "off"])

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    state_dir = DEFAULT_STATE_DIR if not args.state_dir else Path(args.state_dir).expanduser().resolve()
    coordinator = WorkflowCoordinator(state_dir=state_dir, explicit_state_dir=bool(args.state_dir))

    if args.command == "init":
        coordinator.init(args.project_anchor, args.scope, args.project_root)
        return
    if args.command == "status":
        coordinator.status()
        return
    if args.command == "prompt":
        coordinator.prompt(args.role, args.slot)
        return
    if args.command == "submit":
        text = _read_submission_text(args.file, args.stdin)
        coordinator.submit(args.role, args.slot, text)
        return
    if args.command == "signal":
        coordinator.signal(args.value == "on")
        return
    raise SystemExit("Unknown command")


if __name__ == "__main__":
    main()
