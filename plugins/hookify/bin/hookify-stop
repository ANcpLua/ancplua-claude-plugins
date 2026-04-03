#!/usr/bin/env python3
"""Stop hook executor for hookify plugin."""

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
    run_hook(hook_event_name='Stop', fixed_event='stop')
