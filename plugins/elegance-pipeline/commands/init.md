---
description: Initialize the elegance pipeline for this repository
disable-model-invocation: true
---

Initialize the elegance pipeline state manager.

Run:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py init \
  --project-anchor $ARGUMENTS \
  --scope <scope-1> \
  --scope <scope-2> \
  --scope <scope-3> \
  --scope <scope-4>
```

If `$ARGUMENTS` is empty, ask the user for the project anchor file and 4 scout scopes.

The project anchor is any meaningful root file (e.g., `CLAUDE.md`, `package.json`, `*.sln`).
Scout scopes are directories that each scout will analyze independently.
