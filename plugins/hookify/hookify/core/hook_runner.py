#!/usr/bin/env python3
"""Shared hook handler logic for hookify plugin.

All 4 hook handlers (pretooluse, posttooluse, stop, userpromptsubmit) share
identical boilerplate: sys.path setup, imports, JSON I/O, error handling.
This module extracts that into a single function.
"""

import json
import shlex
import subprocess
import sys
from typing import Any, Dict, List, Optional


def _run_execute_commands(commands: List[Dict[str, Any]], hook_event_name: str) -> Dict[str, Any]:
    """Run execute-action commands and return additionalContext with results.

    Called by hook_runner when the rule engine returns _execute_commands.
    Side effects (subprocess) live here, not in the rule engine.
    """
    exec_messages = []
    for cmd_info in commands:
        command = cmd_info['command']
        name = cmd_info['name']
        message = cmd_info.get('message', '')
        try:
            args = shlex.split(command)
            proc = subprocess.run(args, capture_output=True, text=True, timeout=10)
            if proc.returncode == 0:
                exec_messages.append(f"**[{name}]** {message}")
            else:
                stderr = proc.stderr.strip()[:200] if proc.stderr else 'unknown error'
                exec_messages.append(f"**[{name}]** Failed (exit {proc.returncode}): {stderr}")
        except subprocess.TimeoutExpired:
            exec_messages.append(f"**[{name}]** Timed out after 10s")
        except (FileNotFoundError, PermissionError, OSError) as e:
            exec_messages.append(f"**[{name}]** Error: {e}")

    return {
        "hookSpecificOutput": {
            "hookEventName": hook_event_name,
            "additionalContext": "\n\n".join(exec_messages)
        }
    }


def run_hook(hook_event_name: str, fixed_event: Optional[str] = None):
    """Execute a hookify hook handler.

    Args:
        hook_event_name: The Claude Code hook event name
            ('PreToolUse', 'PostToolUse', 'Stop', 'UserPromptSubmit').
        fixed_event: If set, use this event filter directly instead of
            inferring from tool_name. Used by 'stop' and 'userpromptsubmit'
            handlers where the event type is known upfront.
    """
    try:
        from hookify.core.config_loader import load_rules
        from hookify.core.rule_engine import RuleEngine
    except ImportError as e:
        # stderr with exit 2 ensures Claude sees the error on PreToolUse
        print(f"Hookify import error: {e}", file=sys.stderr)
        sys.exit(2)

    try:
        input_data = json.load(sys.stdin)

        if fixed_event is not None:
            event = fixed_event
        else:
            tool_name = input_data.get('tool_name', '')
            event = None
            if tool_name == 'Bash':
                event = 'bash'
            elif tool_name in ['Edit', 'Write', 'MultiEdit']:
                event = 'file'

        rules = load_rules(event=event)

        input_data['hook_event_name'] = hook_event_name

        engine = RuleEngine()
        result = engine.evaluate_rules(rules, input_data)

        # Handle execute commands — side effects live here, not in the engine
        execute_commands = result.pop('_execute_commands', None)
        if execute_commands:
            exec_result = _run_execute_commands(execute_commands, hook_event_name)

            # Merge any existing warnings from engine into execute result
            existing = result.get('hookSpecificOutput', {}).get('additionalContext', '')
            if existing:
                exec_context = exec_result['hookSpecificOutput']['additionalContext']
                exec_result['hookSpecificOutput']['additionalContext'] = existing + "\n\n" + exec_context

            result = exec_result

        print(json.dumps(result), file=sys.stdout)

    except Exception as e:
        # stderr with exit 2 ensures Claude sees the error on PreToolUse
        print(f"Hookify error: {str(e)}", file=sys.stderr)
        sys.exit(2)
