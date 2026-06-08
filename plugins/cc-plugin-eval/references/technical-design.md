# cc-plugin-eval Technical Design

## Overview

`cc-plugin-eval` is a local-first Claude Code plugin and CLI for evaluating Claude Code plugins, skills, and the components a plugin can ship (hooks, MCP servers, LSP servers, monitors, agents, themes, userConfig, channels, dependencies, marketplace entries). The design centers on a deterministic local engine that emits a stable `evaluation-result` JSON document. Skills orchestrate the engine. Report renderers, comparison views, workflow guides, and component-only inspect views all consume the same JSON contract.

The first version is intentionally static:

- No live `claude` benchmarking unless the user opts in via `cc-plugin-eval benchmark`
- No remote repository evaluation
- No automatic test execution
- No external runtime dependencies beyond Node

## Primary Goals

- Evaluate local skill and plugin bundles with predictable, deterministic results.
- Make token and context costs visible early, especially for skill and plugin authors.
- Provide concrete quality signals for each Claude component (manifest, hooks, MCP, LSP, monitors, agents, marketplace, userConfig).
- Provide concrete quality signals for TypeScript and Python helper code.
- Create a normalized extension point for custom metric packs.
- Generate improvement briefs that pair naturally with the `skill-creator` skill (Anthropic's `skill-creator@claude-plugins-official`).
- Make the recommended chat-first workflow obvious for first-time plugin authors.

## Non-Goals For V1

- Measuring actual `claude` host token consumption end to end without an opt-in benchmark
- Running a skill inside the live `claude` host as part of the routine evaluation
- Replacing model or product-level eval frameworks
- Language-specific deep analysis for every language beyond TypeScript and Python
- Per-skill LLM grading or LLM-driven rewrites - those belong to `skill-creator`

## Architecture

### 1. Core Engine

The core engine lives under `src/core/` and owns:

- target resolution (`skill`, `plugin`, or generic directory/file)
- result schema creation and the `findings`/`checks` dual contract
- budget calculation and banding
- score and risk summary generation
- metric-pack execution
- improvement brief generation
- workflow-guide routing
- benchmark template generation, isolated workspace provisioning, and run orchestration

The engine is the source of truth. Other surfaces must not invent their own scoring logic.

### 2. Evaluators

Evaluators live under `src/evaluators/` and return normalized fragments with `checks[]`, `metrics[]`, and `artifacts[]`. Built-in evaluators:

- skill structure and frontmatter checks (Claude SKILL.md spec, CC2xx codes)
- plugin orchestrator (dispatches every Claude-native evaluator and merges the results)
- TypeScript metrics
- Python metrics
- coverage artifact ingestion

Plus eight Claude-native evaluators that emit `findings[]` (converted into `checks[]` by the orchestrator):

- `manifest.js` (CC1xx)
- `hooks.js` (CC3xx)
- `mcp.js` (CC4xx)
- `lsp.js` (CC5xx)
- `monitors.js` (CC6xx)
- `agents.js` (CC7xx)
- `marketplace.js` (CC8xx)
- `userconfig.js` (CC9xx in the userConfig safety subrange)

Path traversal across all evaluators uses `CC900`. See `references/component-validators.md` for the full table.

### 3. Renderers

Renderers live under `src/renderers/` and consume the canonical evaluation payload.

Supported report formats:

- JSON (source of truth)
- Markdown
- HTML

The report output is deliberately thin. It should present the existing result cleanly, not compute new conclusions. A separate `inspect-result` payload kind covers component-only output.

### 4. Claude Code Skills

The plugin exposes lightweight skills that route users into the engine:

- `cc-plugin-eval`
- `evaluate-skill`
- `evaluate-plugin`
- `metric-pack-designer`
- `improve-skill`

These skills stay small and point users to references and CLI commands instead of embedding bulky logic.

The beginner paved road is:

1. User asks in chat: "Evaluate this plugin." or "What should I run next?"
2. The umbrella skill or focused skill routes via `cc-plugin-eval start <path> --request "<user request>" --format markdown`.
3. The rendered output shows the routed chat request, the quick local entrypoint, and the first underlying workflow command side by side.

## Canonical Result Shape

The canonical result is a JSON object with:

- `target`
- `summary`
- `budgets`
- `checks[]`
- `metrics[]`
- `artifacts[]`
- `extensions[]`
- `improvementBrief`

### Summary

`summary` includes:

- `score`
- `grade`
- `riskLevel`
- `topRecommendations[]`
- `whyBullets[]`
- `fixFirst[]`
- `categoryDeductions[]`
- `riskReasons[]`

The summary is calculated from built-in checks only. Extension metric packs are stored under `extensions[]` and do not overwrite the core summary.

### Checks

Every check uses the normalized fields:

- `id` (doubles as the `CC###` error code)
- `category`
- `severity`
- `status`
- `message`
- `evidence[]`
- `remediation[]`
- `source`

### Findings

Internally, the eight Claude-native evaluators emit `findings` shaped as:

- `severity` (`info` | `warn` | `error`)
- `code` (`CC###`)
- `message`
- `location` (`{file, line?}` or null)
- `fix` (optional one-line remediation)

The orchestrator (`evaluatePlugin`) converts every finding into a `check` via `findingToCheck` so the canonical payload never exposes both shapes side by side.

### Metrics

Every metric uses the normalized fields:

- `id`
- `category`
- `value`
- `unit`
- `band`
- `source`

## Budget Model

The budget model is a first-class part of the evaluation result and uses three buckets:

- `trigger_cost_tokens`
- `invoke_cost_tokens`
- `deferred_cost_tokens`

### Definitions

- `trigger_cost_tokens`: text likely to matter before explicit invocation, such as names, descriptions, and keyword lists
- `invoke_cost_tokens`: core instruction payloads that are likely loaded when the skill or plugin is invoked
- `deferred_cost_tokens`: supporting references, scripts, and related text assets that are only pulled in later

### Measurement Mode In V1

The current implementation labels budget analysis as `estimated-static`.

That means:

- token counts are estimated locally from file contents
- the estimate is deterministic and repeatable
- budget bands are calibrated against a baseline corpus of installed Claude Code plugins when available locally (under `~/.claude/plugins/cache/`)

## Token Estimation

cc-plugin-eval uses static estimation (`estimated-static`) by counting characters and dividing by 4 (per `src/lib/tokens.js`). The `--observed-usage` flag accepts a JSONL shape that overlaps with both Claude Messages API and OpenAI Responses API payloads (`input_tokens`, `output_tokens`, `total_tokens`, optional `cached_tokens` and `reasoning_tokens`) so measured usage can layer onto static estimates without locking the parser to one provider.

Observed usage adds:

- a second budget signal based on real sessions
- a comparison of `trigger_cost_tokens + invoke_cost_tokens` against the observed average input tokens
- explicit cached and reasoning token reporting so warm-cache runs are not mistaken for cold-start runs

The default stays local-first; observed usage is opt-in.

## Benchmark Harness

The next layer is a guided benchmark harness designed to be approachable for first-time plugin authors:

- `cc-plugin-eval init-benchmark <path>` writes a starter benchmark config under `.cc-plugin-eval/`.
- `cc-plugin-eval benchmark <path>` runs the scenarios with real `claude` invocations in an isolated workspace, captures per-scenario logs, and writes a JSONL usage log.
- The resulting usage log can be fed directly back into `cc-plugin-eval analyze --observed-usage ...`.
- There is no `--dry-run` mode. The benchmark always runs `claude` in an isolated workspace.

The benchmark harness is intentionally not framed as a full scientific eval system. It is the paved road for collecting:

- representative token usage
- first-pass scenario coverage
- a reusable scenario file that teams can gradually improve

This keeps the workflow intuitive:

1. Generate starter scenarios.
2. Edit them to match the real task.
3. Run live.
4. Feed the usage file back into analysis.

## Chat-First Workflow Guide

The CLI includes a beginner router:

- `cc-plugin-eval start <path>`

It is intentionally small and deterministic. It does not replace the engine or invent new scoring. It only maps natural user intents such as:

- `Evaluate this plugin.`
- `Validate the manifest.`
- `Inspect the hooks.`
- `Measure the real token usage of this skill.`
- `Help me benchmark this plugin.`
- `What should I run next?`

to the existing local command sequences.

## Metric Packs

Metric packs are external evaluators that produce schema-compatible findings.

Manifest responsibilities:

- `name`
- `version`
- `supportedTargetKinds`
- `command`

Runtime contract:

- the pack executes locally
- the pack receives target path and target kind via CLI args
- the pack also receives `CC_PLUGIN_EVAL_TARGET`, `CC_PLUGIN_EVAL_TARGET_KIND`, `CC_PLUGIN_EVAL_METRIC_PACK_MANIFEST`
- the pack writes JSON to stdout
- the JSON may contain `checks[]`, `metrics[]`, and optional `artifacts[]`

The core engine stores the result under `extensions[]` without allowing packs to rewrite the main summary.

## Improvement Loop

The improvement loop is:

1. Evaluate a skill or plugin with `cc-plugin-eval analyze`.
2. Review the prioritized checks and budget findings.
3. Run `cc-plugin-eval improve` (or `analyze --brief-out`) to produce the rewrite brief.
4. Hand the brief to the `skill-creator` skill (Anthropic's `skill-creator@claude-plugins-official`) for the actual rewrite pass.
5. Re-run evaluation and use `cc-plugin-eval compare before.json after.json` to measure the delta.

## Testing Strategy

Fixture-driven tests verify:

- target resolution for `skill`, `plugin`, `directory`, `file`
- valid result JSON generation
- Markdown and HTML report rendering for every payload kind
- oversized descriptions and bloated `SKILL.md` detection
- broken plugin manifests and missing paths (the `broken-plugin` fixture exercises every CC code at least once)
- TypeScript and Python metrics
- coverage artifact ingestion
- custom metric-pack merging
- improvement brief generation
- comparison output
- benchmark workspace seeding with a fake `claude` executable
- end-to-end CLI invocations against the `full-plugin` fixture

## References

- Claude Code plugin reference: https://code.claude.com/docs/en/plugins-reference
- Claude Code skill reference: https://code.claude.com/docs/en/skills
- Claude Messages API token reporting: `https://docs.claude.com/en/api/messages`
