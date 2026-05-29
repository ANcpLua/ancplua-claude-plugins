"""Shared filesystem anchors for the elegance pipeline.

`pipeline.py` is launched directly as a script, so its directory is on
``sys.path[0]`` and these sibling modules import as flat top-level names.
``SCRIPT_DIR`` stays pinned to the package directory regardless of which
module asks, so template lookups and the self-referential ``pipeline.py``
command string keep working.
"""
from __future__ import annotations

from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = SCRIPT_DIR / "templates"
PIPELINE_SCRIPT = SCRIPT_DIR / "pipeline.py"
DEFAULT_STATE_DIR = Path.cwd() / ".claude" / "elegance_pipeline" / "state"
