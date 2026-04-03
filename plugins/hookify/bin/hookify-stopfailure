#!/usr/bin/env python3
"""StopFailure hook executor for hookify plugin.

Fires when a turn ends due to an API error (rate limit, auth failure, etc.).
New in Claude Code 2.1.78.
"""

import os
import sys

PLUGIN_ROOT = os.environ.get('CLAUDE_PLUGIN_ROOT')
if PLUGIN_ROOT:
    parent_dir = os.path.dirname(PLUGIN_ROOT)
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    if PLUGIN_ROOT not in sys.path:
        sys.path.insert(0, PLUGIN_ROOT)

from hookify.core.hook_runner import run_hook

if __name__ == '__main__':
    run_hook(hook_event_name='StopFailure', fixed_event='stopfailure')
