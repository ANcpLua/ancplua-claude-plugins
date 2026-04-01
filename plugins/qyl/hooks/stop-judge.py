#!/usr/bin/env python3
"""
qyl-continuation stop hook.
Based on double-shot-latte (MIT) by Jesse/Anthropic.
Heuristic-only mode (Phase 2 Haiku judge removed).
"""

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import NoReturn

MAX_CONTINUATIONS = 3
WINDOW_SECONDS = 300
TAIL_LINES = 6

WORK_DIR = Path(os.environ.get("CLAUDE_PLUGIN_DATA", str(Path.home() / ".claude" / "qyl-continuation")))
WORK_DIR.mkdir(parents=True, exist_ok=True)


def approve(reason: str) -> NoReturn:
    json.dump({"decision": "approve", "reason": reason}, sys.stdout)
    sys.exit(0)


def block(reason: str) -> NoReturn:
    json.dump({"decision": "block", "reason": reason}, sys.stdout)
    sys.exit(0)


event = json.loads(sys.stdin.read())
transcript_path = event.get("transcript_path", "")
session_id = os.environ.get("CLAUDE_SESSION_ID") or event.get("session_id") or "unknown"
throttle_file = WORK_DIR / f"throttle-{session_id.replace('/', '_')}"


def read_throttle() -> tuple[int, float]:
    if not throttle_file.exists():
        return 0, 0.0
    try:
        parts = throttle_file.read_text().strip().split(":")
        return int(parts[0]), float(parts[1])
    except (ValueError, IndexError):
        return 0, 0.0


def write_throttle(count: int) -> None:
    throttle_file.write_text(f"{count}:{time.time()}")


def clear_throttle() -> None:
    throttle_file.unlink(missing_ok=True)


# Throttle guard — always check, not gated on stop_hook_active
count, last_time = read_throttle()
if time.time() - last_time > WINDOW_SECONDS:
    count = 0
if count >= MAX_CONTINUATIONS:
    clear_throttle()
    approve("Max continuation cycles reached")


# --- Load transcript ---

if not transcript_path or not Path(transcript_path).exists():
    approve("No transcript")

try:
    p = Path(transcript_path)
    raw = p.read_bytes()
    tail_bytes = raw[-(TAIL_LINES * 8192):] if len(raw) > TAIL_LINES * 8192 else raw
    lines = [l.strip() for l in tail_bytes.decode("utf-8", errors="ignore").split("\n") if l.strip()]
    lines = lines[-TAIL_LINES:]
except OSError:
    approve("Failed to read transcript")

messages: list[dict] = []
for line in lines:
    try:
        messages.append(json.loads(line))
    except json.JSONDecodeError:
        pass

if not messages:
    approve("Empty transcript")


# --- Transcript helpers ---

def _get_content(msg: dict):
    content = msg.get("content", "")
    if not content and isinstance(msg.get("message"), dict):
        content = msg["message"].get("content", "")
    return content


def role_of(msg: dict) -> str:
    return msg.get("role", msg.get("type", ""))


def text_of(msg: dict) -> str:
    content = _get_content(msg)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(
            b.get("text", "") or b.get("content", "")
            for b in content
            if isinstance(b, dict) and b.get("type") in ("text", "tool_result")
        )
    return ""


def has_block_type(msg: dict, block_type: str) -> bool:
    content = _get_content(msg)
    return isinstance(content, list) and any(
        isinstance(b, dict) and b.get("type") == block_type for b in content
    )


# --- Phase 1: Heuristics ---

NEXT_STEP_RX = re.compile(
    r"(?:next|now) (?:I(?:'ll| will| need to)|let me)|"
    r"moving on to|(?:still|also) need to|remaining (?:items|tasks|steps)",
    re.IGNORECASE,
)

last_assistant = ""
for msg in reversed(messages):
    if role_of(msg) == "assistant":
        last_assistant = text_of(msg)
        break

# H1: Assistant asked user a question
QUESTION_RX = re.compile(
    r"\?\s*$|(?:would you like|do you want|shall I|should I|"
    r"what do you think|does this look|let me know|how would you like|"
    r"which (?:one|option|approach))",
    re.IGNORECASE,
)
if last_assistant and QUESTION_RX.search(last_assistant):
    clear_throttle()
    approve("Heuristic: question to user")

# H2: Completion signals (only if no stated next steps)
COMPLETION_RX = re.compile(
    r"\b(?:done|complete|finished|ready|all set)\b|"
    r"successfully (?:created|updated|fixed|applied|installed|configured)|"
    r"that(?:'s| should be) (?:it|all|everything)|"
    r"here(?:'s| is) (?:the|your|a) (?:summary|result|output)",
    re.IGNORECASE,
)
if last_assistant and COMPLETION_RX.search(last_assistant) and not NEXT_STEP_RX.search(last_assistant):
    clear_throttle()
    approve("Heuristic: completion signal")

# H3: Tool result already addressed — assistant text after tool result (but not if next steps stated)
saw_tool = False
addressed = False
for msg in messages:
    r = role_of(msg)
    if has_block_type(msg, "tool_result") or r == "tool":
        saw_tool = True
    elif r == "assistant" and saw_tool and len(text_of(msg)) > 50:
        addressed = True

last_role = role_of(messages[-1]) if messages else ""
if addressed and last_role == "assistant" and not NEXT_STEP_RX.search(last_assistant):
    clear_throttle()
    approve("Heuristic: tool results already addressed")

# H4: Substantial text-only response (no pending tool calls, no stated next steps)
last_msg = messages[-1]
if role_of(last_msg) == "assistant" and not has_block_type(last_msg, "tool_use"):
    text = text_of(last_msg)
    if len(text) > 100 and not NEXT_STEP_RX.search(text):
        clear_throttle()
        approve("Heuristic: substantial text-only response")


# --- Phase 2 disabled: heuristic-only mode ---
# Haiku LLM judge removed — if no heuristic matched, check for stated next steps
# and default to allowing the stop.

if last_assistant and NEXT_STEP_RX.search(last_assistant):
    count, last_time = read_throttle()
    if time.time() - last_time > WINDOW_SECONDS:
        count = 0
    write_throttle(count + 1)
    block("Heuristic: assistant stated next steps")

clear_throttle()
approve("Heuristic: no continuation signal detected")
