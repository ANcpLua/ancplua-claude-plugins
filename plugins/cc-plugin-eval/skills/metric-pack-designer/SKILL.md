---
name: metric-pack-designer
description: "Build a local rubric extension so a team can add custom checks that emit schema-compatible findings, metrics, and artifacts on top of the deterministic engine. Use when the user wants their own scoring rules, domain-specific audits, or a custom report wired into analyze runs."
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

## Reference

- `../../references/metric-pack-manifest.md`
- `../../references/evaluation-result-schema.md`
