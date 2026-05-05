# Evaluation Result Schema

The canonical `cc-plugin-eval` result is JSON with this top-level shape:

```json
{
  "schemaVersion": 1,
  "tool": {
    "name": "cc-plugin-eval",
    "version": "0.1.0"
  },
  "createdAt": "2026-05-05T00:00:00.000Z",
  "target": {
    "kind": "plugin",
    "path": "/abs/path/to/target",
    "entryPath": "/abs/path/to/target/.claude-plugin/plugin.json",
    "name": "target-name",
    "relativePath": "fixtures/full-plugin"
  },
  "summary": {
    "score": 92,
    "grade": "A",
    "riskLevel": "low",
    "topRecommendations": []
  },
  "budgets": {
    "method": "estimated-static",
    "trigger_cost_tokens": {
      "value": 48,
      "band": "good",
      "thresholds": {
        "goodMax": 48,
        "moderateMax": 92,
        "heavyMax": 150
      },
      "components": []
    },
    "invoke_cost_tokens": {
      "value": 220,
      "band": "good",
      "thresholds": {
        "goodMax": 220,
        "moderateMax": 480,
        "heavyMax": 900
      },
      "components": []
    },
    "deferred_cost_tokens": {
      "value": 180,
      "band": "good",
      "thresholds": {
        "goodMax": 180,
        "moderateMax": 520,
        "heavyMax": 1200
      },
      "components": []
    },
    "total_tokens": {
      "value": 448,
      "band": "good"
    }
  },
  "checks": [],
  "metrics": [],
  "artifacts": [],
  "extensions": [],
  "improvementBrief": {}
}
```

The evaluation result may also include:

- `observedUsage`
- `measurementPlan`
- `nextAction`

Separate `inspect` runs use a `inspect-result` payload kind:

```json
{
  "kind": "inspect-result",
  "target": {},
  "componentsRequested": ["hooks"],
  "findings": [],
  "metrics": [],
  "summary": {}
}
```

Separate benchmark runs use a `benchmark-run` payload with:

- `mode`
- `config`
- `usageLogPath`
- `summary`
- `scenarios[]`
- `nextSteps[]`

## Checks

Checks use:

- `id` (doubles as the `CC###` error code)
- `category`
- `severity`
- `status`
- `message`
- `evidence[]`
- `remediation[]`
- `source`

## Findings

The eight Claude-native evaluators emit `findings` with:

- `severity` (`info` | `warn` | `error`)
- `code` (`CC###`)
- `message`
- `location` (`{file, line?}` or null)
- `fix` (optional remediation)

The orchestrator (`evaluatePlugin`) converts every finding to a `check` via `findingToCheck` so the canonical payload exposes only `checks[]`. The `findings` shape is internal to evaluators only. The error-code field on the converted check is the `id` field.

## Metrics

Metrics use:

- `id`
- `category`
- `value`
- `unit`
- `band`
- `source`

## Extensions

`extensions[]` holds metric-pack outputs. Each extension records:

- `name`
- `version`
- `manifestPath`
- `checks[]`
- `metrics[]`
- `artifacts[]`
