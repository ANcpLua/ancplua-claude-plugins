#!/usr/bin/env python3
"""Elegance pipeline state manager for Claude Code.

Manages persistent workflow state for the multi-agent elegance pipeline:
4 scouts -> 2 judges -> 1 planner -> 1 verifier -> 1 gated implementer.

Templates are bundled with the plugin (relative to this script).
State is project-local at {cwd}/.claude/elegance_pipeline/state/.

This entry point owns argument parsing; the workflow logic lives in the
sibling modules (models, store, renderer, readiness, prompts, coordinator),
which import as flat names because the script's directory sits on sys.path.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Optional

from coordinator import WorkflowCoordinator
from paths import DEFAULT_STATE_DIR

ROLES = ["scout", "judge", "planner", "verifier", "implementer"]


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
    p_prompt.add_argument("--role", required=True, choices=ROLES)
    p_prompt.add_argument("--slot", required=True)

    p_submit = sub.add_parser("submit", help="Submit an agent result")
    p_submit.add_argument("--role", required=True, choices=ROLES)
    p_submit.add_argument("--slot", required=True)
    p_submit.add_argument("--file")
    p_submit.add_argument("--stdin", action="store_true")

    p_signal = sub.add_parser("signal", help="Manually set implementation signal")
    p_signal.add_argument("value", choices=["on", "off"])

    return parser


def _dispatch(coordinator: WorkflowCoordinator, args: argparse.Namespace) -> None:
    handlers = {
        "init": lambda: coordinator.init(args.project_anchor, args.scope, args.project_root),
        "status": coordinator.status,
        "prompt": lambda: coordinator.prompt(args.role, args.slot),
        "submit": lambda: coordinator.submit(
            args.role, args.slot, _read_submission_text(args.file, args.stdin)
        ),
        "signal": lambda: coordinator.signal(args.value == "on"),
    }
    handlers[args.command]()


def main() -> None:
    args = build_parser().parse_args()
    state_dir = Path(args.state_dir).expanduser().resolve() if args.state_dir else DEFAULT_STATE_DIR
    coordinator = WorkflowCoordinator(state_dir=state_dir, explicit_state_dir=bool(args.state_dir))
    _dispatch(coordinator, args)


if __name__ == "__main__":
    main()
