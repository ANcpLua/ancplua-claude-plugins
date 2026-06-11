---
name: source-command-elegance-pipeline-status
description: Show elegance pipeline workflow status
---

# source-command-elegance-pipeline-status

Use this skill when the user asks to run the migrated Claude slash command `/elegance-pipeline:status`.

## Command Template

Show the current elegance pipeline status.

Run:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py [--state-dir <dir>] status
```

Report the output to the user, highlighting which agents are ready to run next.

## MANUAL MIGRATION REQUIRED

Migrated from Claude slash command `/elegance-pipeline:status` into a Codex skill. Invoke it as `$source-command-elegance-pipeline-status` and rewrite provider-specific runtime behavior before relying on it for unattended execution.

Review unsupported Claude slash-command metadata manually: `disable-model-invocation`.
