#!/usr/bin/env python3
"""Objective drift watchdog for lead-agent focus tracking.

Tracks one anchor document (spec, ADR, design doc) and warns when the agent
silently pivots to a different one without explicit re-anchoring.

Fixed in this rewrite:
- ANCHOR_PATH_RE no longer matches `plugins/` from within repo names like
  `ancplua-claude-plugins/CHANGELOG.md` (added negative lookbehind)
- Narrowed anchor paths to spec-like locations only (docs/specs/, docs/decisions/,
  docs/designs/, .feature-dev/, .eight-gates/artifacts/, .smart/artifacts/)
- Switched from filename blocklist to allowlist for anchorable names
- Cooldown is per-anchor, not per-target-file (stops warning floods)
- Anchor paths are validated against disk before setting
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

BLACKBOARD_DIR = Path(".blackboard")
STATE_PATH = BLACKBOARD_DIR / "objective.json"
WARNING_COOLDOWN_SECONDS = 60

# Matches spec-like paths ONLY — not infrastructure files (CLAUDE.md, README.md, etc.)
# Negative lookbehind prevents matching `plugins/` from within words like `ancplua-claude-plugins/`
ANCHOR_PATH_RE = re.compile(
    r"(?<![a-zA-Z0-9_-])"
    r"("
    r"(?:docs/(?:specs|decisions|designs|superpowers/specs)"
    r"|\.feature-dev"
    r"|\.eight-gates/artifacts"
    r"|\.smart/artifacts"
    r")/[A-Za-z0-9_./-]+\.md"
    r")",
    re.IGNORECASE,
)

# Only spec-like filenames can become anchors by name
# (replaces blocklist approach — allowlist is safer against false anchoring)
ANCHORABLE_NAME_RE = re.compile(
    r"\b((?:spec|adr|design|plan|rfc|proposal)-[A-Za-z0-9_.-]+\.md)\b",
    re.IGNORECASE,
)

ANCHORABLE_PROMPT_RE = re.compile(
    r"\b(fix|finish|update|implement|review|migrate|refactor|audit|clean|delete|continue|resume|launch|run|investigate)\b",
    re.IGNORECASE,
)
REANCHOR_RE = re.compile(
    r"\b(switch|pivot|instead|re-?anchor|move on|focus on|forget|abandon|drop|pause)\b",
    re.IGNORECASE,
)
ORCHESTRATION_RE = re.compile(
    r"(/elegance-pipeline|pipeline\.py\s+init|/exodia:|/hades\b|/deepthink:partner|eight[\s-]?gates|session-state\.sh\s+create|checkpoint\.sh\s+init)",
    re.IGNORECASE,
)
SHIP_RE = re.compile(
    r"\b(gh\s+pr\s+create|npm\s+publish|dotnet\s+nuget\s+push)\b",
    re.IGNORECASE,
)

TOKEN_STOPWORDS = {
    "about", "after", "agent", "anchor", "change", "codex", "continue",
    "current", "drift", "finish", "focus", "implement", "issue", "move",
    "next", "objective", "path", "plan", "please", "primary", "review",
    "session", "spec", "switch", "task", "this", "update", "work",
}


def load_event() -> dict:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def load_state() -> dict:
    if not STATE_PATH.exists():
        return {}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def save_state(state: dict) -> None:
    BLACKBOARD_DIR.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")


def emit_context(hook_event: str, message: str) -> None:
    payload = {
        "hookSpecificOutput": {
            "hookEventName": hook_event,
            "additionalContext": message,
        }
    }
    json.dump(payload, sys.stdout)


def normalize_anchor_path(value: str) -> str:
    return value.replace("\\", "/").lstrip("./")


def extract_anchor_paths(text: str) -> list[str]:
    """Extract spec-like paths from text. Only matches narrowed spec locations."""
    seen: set[str] = set()
    paths: list[str] = []
    for match in ANCHOR_PATH_RE.findall(text or ""):
        path = normalize_anchor_path(match)
        if path not in seen:
            seen.add(path)
            paths.append(path)
    return paths


def extract_anchorable_names(text: str) -> list[str]:
    """Extract spec-like markdown names (spec-*, adr-*, design-*, plan-*, rfc-*, proposal-*)."""
    seen: set[str] = set()
    names: list[str] = []
    for match in ANCHORABLE_NAME_RE.findall(text or ""):
        name = match.lower()
        if name not in seen:
            seen.add(name)
            names.append(name)
    return names


def extract_tokens(anchor_path: str | None, anchor_name: str | None, anchor_text: str) -> list[str]:
    seed = anchor_path or anchor_name or anchor_text
    values = re.split(r"[^a-z0-9]+", seed.lower())
    tokens: list[str] = []
    for value in values:
        if len(value) < 3 or value in TOKEN_STOPWORDS:
            continue
        if value not in tokens:
            tokens.append(value)
    return tokens[:8]


def anchor_display(anchor: dict) -> str:
    if anchor.get("path"):
        return anchor["path"]
    if anchor.get("name"):
        return anchor["name"]
    text = (anchor.get("text") or "current objective").strip()
    compact = " ".join(text.split())
    if len(compact) <= 80:
        return compact
    return compact[:77] + "..."


def validate_path(path: str | None) -> str | None:
    """Return path only if it resolves to an actual file on disk."""
    if not path:
        return None
    if Path(path).exists():
        return path
    return None


def set_anchor(state: dict, text: str, path: str | None, name: str | None) -> None:
    path = validate_path(path)
    anchor_name = name or (Path(path).name.lower() if path else None)
    state["anchor"] = {
        "text": (text or "").strip()[:400],
        "path": path,
        "name": anchor_name,
        "tokens": extract_tokens(path, anchor_name, text),
        "updated_at": int(time.time()),
    }


def same_anchor(anchor: dict, path: str | None, name: str | None) -> bool:
    current_path = (anchor.get("path") or "").lower()
    current_name = (anchor.get("name") or "").lower()
    if path and current_path:
        return normalize_anchor_path(path).lower() == current_path
    if name and current_name:
        return name.lower() == current_name
    return False


def is_anchor_related(anchor: dict, text: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    anchor_path = (anchor.get("path") or "").lower()
    anchor_name = (anchor.get("name") or "").lower()
    if anchor_path and anchor_path in lower:
        return True
    if anchor_name and anchor_name in lower:
        return True
    for token in anchor.get("tokens") or []:
        if re.search(rf"\b{re.escape(token)}\b", lower):
            return True
    return False


def should_emit_warning(state: dict, category: str) -> bool:
    """Cooldown per anchor+category, not per target file."""
    anchor = state.get("anchor", {})
    key = f"{category}:{anchor_display(anchor)}"
    now = int(time.time())
    if state.get("last_warning_key") == key and now - int(state.get("last_warning_at") or 0) < WARNING_COOLDOWN_SECONDS:
        return False
    state["last_warning_key"] = key
    state["last_warning_at"] = now
    return True


def warning_text(anchor: dict, target: str | None, action: str) -> str:
    prefix = f"Primary anchor is still `{anchor_display(anchor)}`."
    if target:
        return (
            f"{prefix} Do not branch to `{target}` for {action} yet. "
            f"Finish it, explicitly re-anchor, or tell the user you are abandoning it."
        )
    return (
        f"{prefix} Do not start {action} yet. "
        f"Finish it, explicitly re-anchor, or tell the user you are abandoning it."
    )


def handle_user_prompt(event: dict, state: dict) -> str | None:
    prompt = (event.get("user_prompt") or "").strip()
    if not prompt:
        return None

    paths = extract_anchor_paths(prompt)
    names = extract_anchorable_names(prompt)
    new_path = paths[0] if paths else None
    new_name = names[0] if names else None
    explicit_switch = bool(REANCHOR_RE.search(prompt))
    anchor = state.get("anchor")

    if not anchor:
        if new_path or new_name or ANCHORABLE_PROMPT_RE.search(prompt) or ORCHESTRATION_RE.search(prompt):
            set_anchor(state, prompt, new_path, new_name)
        return None

    if new_path or new_name:
        target = " ".join(part for part in [new_path, new_name] if part)
        if same_anchor(anchor, new_path, new_name) or (
            not anchor.get("path") and not anchor.get("name") and is_anchor_related(anchor, target)
        ):
            set_anchor(state, prompt, anchor.get("path") or new_path, anchor.get("name") or new_name)
            return None
        if explicit_switch:
            set_anchor(state, prompt, new_path, new_name)
            return None
        target = new_path or new_name
        if should_emit_warning(state, "user-pivot"):
            return warning_text(anchor, target, "a new spec")
        return None

    if explicit_switch:
        set_anchor(state, prompt, None, None)

    return None


def handle_post_tool(event: dict, state: dict) -> str | None:
    tool_input = event.get("tool_input") or {}
    serialized_input = json.dumps(tool_input, sort_keys=True)
    anchor = state.get("anchor")

    paths = extract_anchor_paths(serialized_input)
    names = extract_anchorable_names(serialized_input)
    new_path = paths[0] if paths else None
    new_name = names[0] if names else None

    if not anchor:
        if new_path or new_name:
            set_anchor(state, "", new_path, new_name)
        return None

    if new_path or new_name:
        target_text = " ".join(part for part in [new_path, new_name] if part)
        if same_anchor(anchor, new_path, new_name) or (
            not anchor.get("path") and not anchor.get("name") and is_anchor_related(anchor, target_text)
        ):
            set_anchor(state, anchor.get("text") or "", anchor.get("path") or new_path, anchor.get("name") or new_name)
            return None
        target = new_path or new_name
        if should_emit_warning(state, "tool-pivot"):
            return warning_text(anchor, target, "a different spec")
        return None

    tool_name = event.get("tool_name", "")
    command = (tool_input.get("command") or tool_input.get("cmd") or "").strip()
    if tool_name == "Bash" and command:
        if ORCHESTRATION_RE.search(command) and not is_anchor_related(anchor, command):
            if should_emit_warning(state, "orchestration"):
                return warning_text(anchor, None, "a new orchestration flow")
        if SHIP_RE.search(command) and not is_anchor_related(anchor, command):
            if should_emit_warning(state, "ship"):
                return warning_text(anchor, None, "shipping or completion")

    return None


def main() -> int:
    event = load_event()
    if not event or event.get("agent_type") == "subagent":
        return 0

    hook_event = "UserPromptSubmit" if "user_prompt" in event else "PostToolUse"
    state = load_state()
    message = handle_user_prompt(event, state) if hook_event == "UserPromptSubmit" else handle_post_tool(event, state)
    save_state(state)
    if message:
        emit_context(hook_event, message)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
