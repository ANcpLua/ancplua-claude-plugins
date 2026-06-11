---
name: source-command-elegance-pipeline-init
description: Initialize the elegance pipeline for this repository
---

# source-command-elegance-pipeline-init

Use this skill when the user asks to run the migrated Claude slash command `/elegance-pipeline:init`.

## Command Template

Initialize the elegance pipeline state manager.

Run:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py [--state-dir <dir>] init \
  --project-anchor $ARGUMENTS \
  --scope <scope-1> \
  --scope <scope-2> \
  --scope <scope-3> \
  --scope <scope-4>
```

If `$ARGUMENTS` is empty, ask the user for the project anchor file and 4 scout scopes.

The project anchor is any meaningful root file (e.g., `CLAUDE.md`, `package.json`, `*.sln`).
Scout scopes are directories that each scout will analyze independently.
Use `--state-dir` when you want one isolated pipeline per spec instead of reusing the shared default state.

## MANUAL MIGRATION REQUIRED

Migrated from Claude slash command `/elegance-pipeline:init` into a Codex skill. Invoke it as `$source-command-elegance-pipeline-init` and rewrite provider-specific runtime behavior before relying on it for unattended execution.

Claude argument placeholders like `$ARGUMENTS`, `$0`, or `$1` were preserved as text; replace them with explicit Codex instructions for the current task.

Review unsupported Claude slash-command metadata manually: `disable-model-invocation`.
