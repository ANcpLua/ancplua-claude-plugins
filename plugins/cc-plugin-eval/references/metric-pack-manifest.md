# Metric Pack Manifest

Metric packs are user-authored local evaluators that output `cc-plugin-eval`-compatible findings.

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

## Merge Rules

- Metric-pack findings are stored under `extensions[]`.
- Metric packs do not overwrite the core summary.
- Metric packs should use unique IDs that do not collide with the built-in `CC1xx`-`CC9xx` codes.
- Repeated runs should use stable IDs so `cc-plugin-eval compare` stays meaningful.
