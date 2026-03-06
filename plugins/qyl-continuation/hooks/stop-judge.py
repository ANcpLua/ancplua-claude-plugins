#!/usr/bin/env python3
"""
qyl-continuation stop hook.
Based on double-shot-latte (MIT) by Jesse/Anthropic.
Phase 1: Heuristic pre-filter (~80% of stops, no Haiku call).
Phase 2: Haiku judge (ambiguous ~20% only).
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import NoReturn

MAX_CONTINUATIONS = 3
WINDOW_SECONDS = 300
TAIL_LINES = 6
MAX_CONTEXT_BYTES = 32_000
JUDGE_TIMEOUT = int(os.environ.get("QYL_CONTINUATION_TIMEOUT", "30"))
JUDGE_MODEL = os.environ.get("QYL_CONTINUATION_MODEL", "haiku")


def approve(reason: str) -> NoReturn:
    json.dump({"decision": "approve", "reason": reason}, sys.stdout)
    sys.exit(0)


def block(reason: str) -> NoReturn:
    json.dump({"decision": "block", "reason": reason}, sys.stdout)
    sys.exit(0)


if os.environ.get("CLAUDE_HOOK_JUDGE_MODE") == "true":
    approve("Judge mode, allowing stop")

event = json.loads(sys.stdin.read())
transcript_path = event.get("transcript_path", "")
session_id = event.get("session_id", "unknown")
throttle_file = Path(f"/tmp/.qyl-continue-{session_id.replace('/', '_')}")


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


if event.get("stop_hook_active", False):
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
    tail = subprocess.run(
        ["tail", "-n", str(TAIL_LINES), transcript_path],
        capture_output=True, text=True, timeout=5
    )
    lines = [l.strip() for l in tail.stdout.strip().split("\n") if l.strip()]
except (subprocess.TimeoutExpired, OSError):
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

def role_of(msg: dict) -> str:
    return msg.get("role", msg.get("type", ""))


def text_of(msg: dict) -> str:
    content = msg.get("content", "")
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
    content = msg.get("content", "")
    return isinstance(content, list) and any(
        isinstance(b, dict) and b.get("type") == block_type for b in content
    )


# --- Phase 1: Heuristics ---

last_assistant = ""
for msg in reversed(messages):
    if role_of(msg) == "assistant":
        last_assistant = text_of(msg)
        break

# H1: Assistant asked user a question
QUESTION_RX = re.compile(
    r"\?\s*$|(?i)(?:would you like|do you want|shall I|should I|"
    r"what do you think|does this look|let me know|how would you like|"
    r"which (?:one|option|approach))"
)
if last_assistant and QUESTION_RX.search(last_assistant):
    clear_throttle()
    approve("Heuristic: question to user")

# H2: Completion signals (only if no stated next steps)
COMPLETION_RX = re.compile(
    r"(?i)\b(?:done|complete|finished|ready|all set)\b|"
    r"(?i)successfully (?:created|updated|fixed|applied|installed|configured)|"
    r"(?i)that(?:'s| should be) (?:it|all|everything)|"
    r"(?i)here(?:'s| is) (?:the|your|a) (?:summary|result|output)"
)
NEXT_STEP_RX = re.compile(
    r"(?i)(?:next|now) (?:I(?:'ll| will| need to)|let me)|"
    r"moving on to|(?:still|also) need to|remaining (?:items|tasks|steps)"
)
if last_assistant and COMPLETION_RX.search(last_assistant) and not NEXT_STEP_RX.search(last_assistant):
    clear_throttle()
    approve("Heuristic: completion signal")

# H3: Tool result already addressed — assistant text after tool result
saw_tool = False
addressed = False
for msg in messages:
    r = role_of(msg)
    if has_block_type(msg, "tool_result") or r == "tool":
        saw_tool = True
    elif r == "assistant" and saw_tool and len(text_of(msg)) > 50:
        addressed = True

last_role = role_of(messages[-1]) if messages else ""
if addressed and last_role == "assistant":
    clear_throttle()
    approve("Heuristic: tool results already addressed")

# H4: Substantial text-only response (no pending tool calls)
last_msg = messages[-1]
if role_of(last_msg) == "assistant" and not has_block_type(last_msg, "tool_use"):
    if len(text_of(last_msg)) > 100:
        clear_throttle()
        approve("Heuristic: substantial text-only response")


# --- Phase 2: Haiku judge ---

transcript_json = json.dumps(messages, ensure_ascii=False)[:MAX_CONTEXT_BYTES]

EVAL_PROMPT = f"""Does the assistant have more autonomous work to do RIGHT NOW?

Conversation:
{transcript_json}

CONTINUE (true) ONLY IF ALL true:
1. Assistant explicitly stated next action ("Next I need to...", "Now I'll...")
2. That action has NOT been performed yet
3. No user input needed

STOP (false) in ALL other cases:
- Completion signals, questions to user, presenting results
- Tool results/images the assistant ALREADY responded to
- Errors, blockers, offering optional follow-ups

A tool_result or image does NOT mean unaddressed work — check for assistant text AFTER it.
Default: STOP."""

work_dir = Path.home() / ".claude" / "qyl-continuation"
work_dir.mkdir(parents=True, exist_ok=True)
env = os.environ.copy()
env["CLAUDE_HOOK_JUDGE_MODE"] = "true"

try:
    proc = subprocess.run(
        ["claude", "--print", "--model", JUDGE_MODEL,
         "--output-format", "json",
         "--json-schema", '{"type":"object","properties":{"should_continue":{"type":"boolean"},"reasoning":{"type":"string"}},"required":["should_continue","reasoning"]}',
         "--system-prompt", "Conversation state classifier. Output JSON only. No code, no tools.",
         "--disallowedTools", "*"],
        input=EVAL_PROMPT, capture_output=True, text=True,
        timeout=JUDGE_TIMEOUT, cwd=str(work_dir), env=env,
    )
except (subprocess.TimeoutExpired, OSError):
    approve("Judge unavailable, allowing stop")

if proc.returncode != 0:
    approve("Judge failed, allowing stop")

try:
    evaluation = json.loads(proc.stdout).get("structured_output", {})
except (json.JSONDecodeError, AttributeError, TypeError):
    approve("Judge response unparseable, allowing stop")

if evaluation.get("should_continue", False):
    count, last_time = read_throttle()
    if time.time() - last_time > WINDOW_SECONDS:
        count = 0
    write_throttle(count + 1)
    block(f"Judge: {evaluation.get('reasoning', '')}")
else:
    clear_throttle()
    approve(f"Judge: {evaluation.get('reasoning', '')}")
