#!/usr/bin/env python3
"""Shared hook handler logic for hookify plugin.

All 4 hook handlers (pretooluse, posttooluse, stop, userpromptsubmit) share
identical boilerplate: sys.path setup, imports, JSON I/O, error handling.
This module extracts that into a single function.
"""

import json
import sys
from typing import Optional


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

        print(json.dumps(result), file=sys.stdout)

    except Exception as e:
        # stderr with exit 2 ensures Claude sees the error on PreToolUse
        print(f"Hookify error: {str(e)}", file=sys.stderr)
        sys.exit(2)
