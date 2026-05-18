---
name: metric-pack-designer
description: This skill should be used when the user asks to "add a rubric for X to cc-plugin-eval", "write a metric pack", "make cc-plugin-eval check Y", "emit my own findings", "create a custom rubric", "extend cc-plugin-eval with custom checks", or "build a domain-specific report on top of the deterministic engine". Designs a local metric pack — manifest plus a script that prints JSON to stdout — that emits schema-compatible checks, metrics, and artifacts the core engine merges into its result.
version: 0.1.0
author: AncpLua
---

# Metric Pack Designer

Use this skill when the user wants to extend `cc-plugin-eval` with a local rubric.

## Workflow

1. Clarify the custom rubric categories and target kinds (`skill`, `plugin`, `directory`).
2. Define the smallest useful `checks[]` and `metrics[]` payload that answers the user's actual question.
3. Create a metric-pack manifest plus a script that prints JSON to stdout.
4. Wire the pack into a run with `cc-plugin-eval analyze <path> --metric-pack <manifest.json>`. Repeat the flag for multiple packs.

## Manifest Shape

```json
{
  "name": "team-rubric",
  "version": "1.0.0",
  "supportedTargetKinds": ["skill", "plugin"],
  "command": ["node", "./emit-team-rubric.js"]
}
```

## Runtime Contract

- The manifest is passed to `cc-plugin-eval analyze --metric-pack <manifest.json>`.
- The command runs from the manifest directory.
- The target path and target kind are appended as CLI arguments.
- The process also receives:
  - `CC_PLUGIN_EVAL_TARGET`
  - `CC_PLUGIN_EVAL_TARGET_KIND`
  - `CC_PLUGIN_EVAL_METRIC_PACK_MANIFEST`

## Output Contract

The metric pack must print JSON to stdout in this shape:

```json
{
  "checks": [
    {
      "id": "team-style",
      "category": "custom",
      "severity": "warning",
      "status": "warn",
      "message": "Custom rubric finding",
      "evidence": ["detail"],
      "remediation": ["fix detail"]
    }
  ],
  "metrics": [
    {
      "id": "team-score",
      "category": "custom",
      "value": 4,
      "unit": "points",
      "band": "good"
    }
  ],
  "artifacts": []
}
```

## Design Rules

- Keep IDs stable across runs so `cc-plugin-eval compare` stays meaningful.
- Emit only `checks[]`, `metrics[]`, and optional `artifacts[]`.
- Do not try to overwrite the core `summary` or the budget bucket totals.
- Prefer deterministic local signals over subjective text generation.
- Use unique IDs that do not collide with the built-in `CC1xx`-`CC9xx` codes.

## References

- `../../references/metric-pack-manifest.md`
- `../../references/evaluation-result-schema.md`
