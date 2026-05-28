# cc-plugin-eval — Architectural Specification

**Status:** scaffolding spec for parallel implementation by 3 writers
**Source repo (MIT):** `/tmp/plugin-compare/openai-plugins/plugins/plugin-eval/` (forked from `openai/plugins`)
**Authoritative Claude refs:** `/tmp/plugin-compare/refs/claude-plugins-reference.md`, `/tmp/plugin-compare/refs/claude-skills-reference.md`
**Destination root:** `plugins/cc-plugin-eval/`

Writers MUST read sections 1, 2, 3, 4, 8, 9, 10 (everyone), and one of 5/6/7 (their assignment). Do NOT freelance outside your section without raising it back to the architect.

---

## 1. Mission and non-goals

**Mission.** `cc-plugin-eval` is a Claude-Code-native local-first evaluator and CLI for plugin authors. It analyzes a plugin or skill, scores it against a deterministic rubric, computes token budgets across `trigger / invoke / deferred` tiers, lints every Claude-Code plugin component (`.claude-plugin/plugin.json`, `hooks/hooks.json`, `.mcp.json`, `.lsp.json`, `monitors/monitors.json`, `agents/*.md`, `userConfig`, `channels`, `dependencies`, and the workspace's `.claude-plugin/marketplace.json`), produces an improvement brief, supports observed-usage ingestion, and runs real `claude` benchmarks via the same isolated-workspace harness the OpenAI fork uses for `codex exec`. It exposes the same outputs as the original (JSON / Markdown / HTML) plus a chat-first router (`start`) and 5 chat-facing skills.

The OpenAI version covers Codex skills (`SKILL.md`) and Codex plugin manifests (`.codex-plugin/plugin.json` with an `interface{}` block). cc-plugin-eval drops everything Codex-specific and replaces it with Claude-Code-native validators that have no upstream equivalent. The Claude manifest schema is documented in `/tmp/plugin-compare/refs/claude-plugins-reference.md` and is the only authority for required/optional fields, path rules, environment variables, and component file locations.

**Non-goals.**

- **Do not duplicate `skill-creator`'s per-skill LLM grader.** The `skill-creator` skill (Anthropic's `skill-creator@claude-plugins-official`) already handles single-skill grading with subagents and structured rubrics. cc-plugin-eval evaluates **structure, budget, and component validity** across an entire plugin, deterministically and without an LLM. The two are complementary; cc-plugin-eval's `improve-skill` skill explicitly hands off to skill-creator for rewrite work.
- **Do not invent Claude Code fields.** Use only what the cached refs document. If a field is not in `claude-plugins-reference.md`, do not validate against it.
- **Do not ship a Codex compatibility shim.** The `interface{}` block, `defaultPrompt`, `composerIcon`, `developerName`, `category`, and `capabilities` are Codex-specific and have NO place in cc-plugin-eval source, fixtures, or tests.

---

## 2. High-level architecture diff vs OpenAI plugin-eval

| OpenAI source path                              | cc-plugin-eval action                             | Owner    |
| ----------------------------------------------- | ------------------------------------------------- | -------- |
| `.codex-plugin/plugin.json`                     | **delete** — replaced by `.claude-plugin/plugin.json` (architect, already written) | architect |
| `package.json`                                  | **rewrite** (architect, already written)          | architect |
| `README.md`                                     | **rewrite**                                       | C        |
| `assets/plugin-eval.svg`                        | **delete**                                        | C        |
| `scripts/plugin-eval.js`                        | **port → `scripts/cc-plugin-eval.js`**            | A        |
| `src/cli.js`                                    | **rewrite (Claude commands + new subcommands)**   | A        |
| `src/index.js`                                  | **port (rename internal references only)**        | A        |
| `src/core/analyze.js`                           | **rewrite (dispatch new evaluators)**             | A        |
| `src/core/baseline.js`                          | **rewrite (`~/.claude` paths instead of `~/.codex`)** | A    |
| `src/core/budget.js`                            | **rewrite (manifest path, plugin trigger components)** | A   |
| `src/core/compare.js`                           | **port verbatim**                                 | A        |
| `src/core/improvement-brief.js`                 | **rewrite (drop skill-creator path string)**      | A        |
| `src/core/measurement-plan.js`                  | **port verbatim**                                 | A        |
| `src/core/metric-packs.js`                      | **port (env var rename `CC_PLUGIN_EVAL_*`)**      | A        |
| `src/core/observed-usage.js`                    | **port verbatim**                                 | A        |
| `src/core/presentation.js`                      | **rewrite (CLI name `cc-plugin-eval`, target labels)** | A    |
| `src/core/schema.js`                            | **rewrite (TOOL_NAME/TOOL_VERSION + Claude manifest schema)** | A |
| `src/core/scoring.js`                           | **port verbatim** (categories already generic)    | A        |
| `src/core/target.js`                            | **rewrite (`.claude-plugin/plugin.json` detection)** | A     |
| `src/core/workflow-guide.js`                    | **rewrite (CLI name and chat prompts)**           | A        |
| `src/core/benchmark.js`                         | **rewrite (`claude` not `codex`, env vars, provisioning)** | A |
| `src/core/benchmark-events.js`                  | **port verbatim** (event-shape detection is generic) | A     |
| `src/core/benchmark-workspace.js`               | **rewrite (Claude marketplace.json + `~/.claude` seeding)** | A |
| `src/evaluators/code.js`                        | **port verbatim**                                 | A        |
| `src/evaluators/coverage.js`                    | **port verbatim**                                 | A        |
| `src/evaluators/python.js`                      | **port verbatim**                                 | A        |
| `src/evaluators/typescript.js`                  | **port verbatim**                                 | A        |
| `src/evaluators/skill.js`                       | **rewrite (Claude frontmatter keys, `Skill(name)` permission hint)** | A |
| `src/evaluators/plugin.js`                      | **rewrite (no `interface{}` block; dispatches B's evaluators)** | A |
| `src/evaluators/manifest.js`                    | **NEW** (Claude-native manifest validator)        | B        |
| `src/evaluators/hooks.js`                       | **NEW** (`hooks/hooks.json` + inline)             | B        |
| `src/evaluators/mcp.js`                         | **NEW** (`.mcp.json` + inline)                    | B        |
| `src/evaluators/lsp.js`                         | **NEW** (`.lsp.json` + inline)                    | B        |
| `src/evaluators/monitors.js`                    | **NEW** (`monitors/monitors.json` + inline)       | B        |
| `src/evaluators/agents.js`                      | **NEW** (`agents/*.md` frontmatter)               | B        |
| `src/evaluators/marketplace.js`                 | **NEW** (`.claude-plugin/marketplace.json`)       | B        |
| `src/evaluators/userconfig.js`                  | **NEW** (`userConfig`/channels)                   | B        |
| `src/lib/files.js`                              | **port verbatim**                                 | A        |
| `src/lib/frontmatter.js`                        | **port verbatim**                                 | A        |
| `src/lib/tokens.js`                             | **port verbatim**                                 | A        |
| `src/renderers/index.js`                        | **port verbatim**                                 | A        |
| `src/renderers/markdown.js`                     | **rewrite (titles use `cc-plugin-eval`, drop "Codex chat" copy)** | A |
| `src/renderers/html.js`                         | **rewrite (titles + drop Codex copy)**            | A        |
| `skills/plugin-eval/SKILL.md`                   | **rewrite → `skills/cc-plugin-eval/SKILL.md`**    | C        |
| `skills/evaluate-plugin/SKILL.md`               | **rewrite**                                       | C        |
| `skills/evaluate-skill/SKILL.md`                | **rewrite**                                       | C        |
| `skills/improve-skill/SKILL.md`                 | **rewrite**                                       | C        |
| `skills/metric-pack-designer/SKILL.md`          | **rewrite**                                       | C        |
| `skills/*/agents/openai.yaml`                   | **delete (all of them)**                          | C        |
| `references/*.md` (6 files)                     | **rewrite (drop Codex names + Responses API refs)** | C      |
| `fixtures/minimal-plugin/`                      | **rewrite (Claude manifest, no `interface{}`)**   | C        |
| `fixtures/multi-skill-plugin/`                  | **delete**                                        | C        |
| `fixtures/full-plugin/`                         | **NEW** (every Claude component populated)        | C        |
| `fixtures/minimal-skill/`                       | **port (Claude-compliant frontmatter)**           | C        |
| `fixtures/coverage-samples/`                    | **port verbatim**                                 | C        |
| `fixtures/observed-usage/responses.jsonl`       | **port verbatim**                                 | C        |
| `fixtures/ts-python-sample/`                    | **port verbatim**                                 | C        |
| `fixtures/metric-pack/`                         | **rewrite (env var rename, JS unchanged)**        | C        |
| `tests/plugin-eval.test.js`                     | **rewrite → `tests/cc-plugin-eval.test.js` + new B tests** | C |
| `THIRD_PARTY_NOTICES.md`                        | **NEW**                                           | C        |

Writer A = Porter, Writer B = Claude-native evaluators, Writer C = Skills/fixtures/tests/docs. The architect already produced `.claude-plugin/plugin.json`, `package.json`, and the directory tree.

---

## 3. CLI surface (exact subcommands and flags)

The CLI lives at `scripts/cc-plugin-eval.js` (a 9-line wrapper that calls `runCli` from `src/cli.js`, identical to the OpenAI script). All subcommands accept `--format json|markdown|md|html` (default `json`) and `--output <file>` (default stdout). Flags are case-sensitive long-form, parsed by the same simple loop as `src/cli.js` in the OpenAI source.

### 3.1 Inherited subcommands (rewrite from OpenAI surface)

| Subcommand                    | Positional       | Flags                                                                                               | Notes |
| ----------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- | ----- |
| `analyze <path>`              | target path      | `--format`, `--output`, `--metric-pack <manifest.json>` (repeatable), `--observed-usage <file>` (repeatable), `--brief-out <file>` | Full evaluation. Dispatches every evaluator. |
| `start <path>`                | target path      | `--format`, `--output`, `--goal evaluate\|budget\|measure\|benchmark\|next\|analysis`, `--request "<chat request>"` | Chat-first router. Alias `guide` for backward muscle memory. |
| `explain-budget <path>`       | target path      | `--format`, `--output`                                                                              | Budget-only payload. |
| `measurement-plan <path>`     | target path      | `--format`, `--output`, `--observed-usage` (repeatable)                                             | Returns the measurement plan slice of `analyze`. |
| `init-benchmark <path>`       | target path      | `--output <benchmark.json>`, `--model <model>`, `--format`                                          | Writes starter `.cc-plugin-eval/benchmark.json`. |
| `benchmark <path>`            | target path      | `--config <benchmark.json>`, `--usage-out <usage.jsonl>`, `--result-out <result.json>`, `--model <model>`, `--format`, `--output` | Real `claude` runs in isolated workspaces. NO `--dry-run`. |
| `report <result.json>`        | result.json path | `--format`, `--output`                                                                              | Re-render an existing JSON report. |
| `compare <before> <after>`    | two json paths   | `--format`, `--output`                                                                              | Diff payload. |
| `improve <path>`              | target path      | `--format`, `--output`, `--brief-out <file>`                                                        | Alias for `analyze --brief-out`; also writes the improvement brief as the top-level payload. |

### 3.2 New Claude-native subcommands

| Subcommand                       | Positional     | Flags                                                                              | Behavior |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------- | -------- |
| `validate <path>`                | plugin root or skill path | `--format`, `--output`, `--strict` (treats every warn as fail in exit code) | Manifest-and-component lint only. Skips budget, code, coverage, measurement, observed-usage. Returns the same `findings`/`score` schema, but with `mode: "validate"`. Use case: CI hook. |
| `evaluate-skill <path>`          | skill path     | `--format`, `--output`, `--brief-out`                                              | Convenience alias that resolves the target as `skill` (errors out if not). Same payload as `analyze` for a skill. |
| `inspect <path>`                 | plugin root    | `--component manifest\|hooks\|mcp\|lsp\|monitors\|agents\|marketplace\|userconfig\|all` (default `all`), `--format`, `--output` | Runs ONLY the specified Claude-native evaluator(s) from Writer B. Output payload kind is `"inspect-result"` with `target`, `componentsRequested`, `findings[]`, `metrics[]`, `summary`. No budget, no code, no coverage. |

### 3.3 Aliases (backward compatibility)

- `guide` → `start`
- `recommend-measures` → `measurement-plan`

### 3.4 Help text

`runCli` writes a help block to stdout when invoked with no args, `--help`, or `-h`. The help block lists every subcommand from sections 3.1–3.2, including the chat-first examples (rewritten from the OpenAI source to use `cc-plugin-eval` and Claude-Code-style natural prompts: "Evaluate this plugin.", "Why did this score that way?", "What should I fix first?", "Validate the manifest.", "Inspect the hooks for this plugin.", "Help me benchmark this plugin.", "What should I run next?").

### 3.5 Exit codes

- `0` — success, regardless of findings (only `--strict` on `validate` makes warns count).
- `1` — uncaught exception, missing required arg, parse error.
- `2` — `--strict` set on `validate` and at least one `warn` or `fail` finding emitted (Writer A wires this in `src/cli.js`).

---

## 4. Manifest expectations

This section is the contract Writer B's `manifest.js` validates against. All field names, types, and rules below come verbatim from `/tmp/plugin-compare/refs/claude-plugins-reference.md`. Do not validate fields not listed here.

### 4.1 Required fields

| Field  | Type   | Rule                                                                                              |
| ------ | ------ | ------------------------------------------------------------------------------------------------- |
| `name` | string | Kebab-case, no spaces. Must match `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/`. Used for namespacing components. The only required field. |

### 4.2 Metadata fields

| Field         | Type   | Notes |
| ------------- | ------ | ----- |
| `$schema`     | string | Optional; ignored at load time. Validator emits `info` if missing, since editor autocomplete needs it. |
| `version`     | string | Optional. SemVer `MAJOR.MINOR.PATCH`. If set, must be bumped to ship updates (per ref). |
| `description` | string | Optional. Used by marketplace UIs. |
| `author`      | object | Optional. Subkeys `name`, `email`, `url` — none required. |
| `homepage`    | string | Optional. URL. |
| `repository`  | string | Optional. URL. |
| `license`     | string | Optional. SPDX identifier. |
| `keywords`    | array  | Optional. Strings. |

### 4.3 Component-path fields

| Field          | Type                  | Default if omitted        | Path rule |
| -------------- | --------------------- | ------------------------- | --------- |
| `skills`       | string \| array       | `./skills/` auto-scanned  | Must start with `./`. Replaces default if specified. |
| `commands`     | string \| array       | `./commands/` auto-scanned | Must start with `./`. |
| `agents`       | string \| array       | `./agents/` auto-scanned  | Must start with `./`. |
| `hooks`        | string \| array \| object | `./hooks/hooks.json`  | Inline object also valid. |
| `mcpServers`   | string \| array \| object | `./.mcp.json`         | Inline object also valid. |
| `lspServers`   | string \| array \| object | `./.lsp.json`         | Inline object also valid. |
| `monitors`     | string \| array       | `./monitors/monitors.json` | Path values only. |
| `outputStyles` | string \| array       | `./output-styles/`        | Path values only. |
| `themes`       | string \| array       | `./themes/`               | Path values only. |
| `userConfig`   | object                | none                      | Validated by `userconfig.js`. |
| `channels`     | array                 | none                      | Each entry has `server` (must match a `mcpServers` key) and optional per-channel `userConfig`. |
| `dependencies` | array                 | none                      | Strings or `{name, version}` objects. SemVer ranges. |

### 4.4 Environment variable substitution rules

`${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` are valid in: skill content, agent content, hook commands, monitor commands, MCP/LSP server configs. They are NOT valid in: manifest scalar fields like `description`, `homepage`, `repository`, `license`, `keywords`. Validator emits `warn` (`CC110`) if either appears in a metadata field.

### 4.5 Path traversal

Any path-like value (`skills`, `commands`, `agents`, `hooks`, `mcpServers`, `lspServers`, `monitors`, `outputStyles`, `themes`, theme `base` references, hook `command` if it points at a script) that contains `../` after the leading `./` is a `fail` (`CC900`). Symlinks inside the plugin tree are fine; symlinks outside the plugin tree are out-of-scope (the runtime caches the symlink target, but the validator does not need to follow them).

### 4.6 Default file locations table (cited from ref §"File locations reference")

```
.claude-plugin/plugin.json   manifest
skills/                       skills (each subdir has SKILL.md)
commands/                     flat .md skills
agents/                       agent .md files
hooks/hooks.json              hook config
.mcp.json                     MCP servers
.lsp.json                     LSP servers
monitors/monitors.json        monitor configs
output-styles/                output styles
themes/                       themes
bin/                          executables auto-added to PATH
settings.json                 plugin defaults (only `agent` and `subagentStatusLine` keys supported)
```

The `.claude-plugin/` directory contains ONLY `plugin.json`. Anything else inside `.claude-plugin/` is a `warn` (`CC120`) per the warning callout in the ref. Components MUST be at the plugin root.

---

## 5. Writer A — Porter assignments

Writer A owns 24 files in `src/`, the CLI script, the renderers, and the lib. The work splits into 3 buckets: **port verbatim**, **port with rename-only patches**, **rewrite**. Read `/tmp/plugin-compare/openai-plugins/plugins/plugin-eval/src/` files top-to-bottom before starting; the originals are well-factored and most rewrites are mechanical.

### 5.1 Port verbatim (copy file, no edits except moving any header comment)

| Source                                            | Destination                                              |
| ------------------------------------------------- | -------------------------------------------------------- |
| `src/index.js`                                    | `src/index.js`                                           |
| `src/core/compare.js`                             | `src/core/compare.js`                                    |
| `src/core/measurement-plan.js`                    | `src/core/measurement-plan.js`                           |
| `src/core/observed-usage.js`                      | `src/core/observed-usage.js`                             |
| `src/core/scoring.js`                             | `src/core/scoring.js`                                    |
| `src/core/benchmark-events.js`                    | `src/core/benchmark-events.js`                           |
| `src/lib/files.js`                                | `src/lib/files.js`                                       |
| `src/lib/frontmatter.js`                          | `src/lib/frontmatter.js`                                 |
| `src/lib/tokens.js`                               | `src/lib/tokens.js`                                      |
| `src/renderers/index.js`                          | `src/renderers/index.js`                                 |
| `src/evaluators/code.js`                          | `src/evaluators/code.js`                                 |
| `src/evaluators/coverage.js`                      | `src/evaluators/coverage.js`                             |
| `src/evaluators/python.js`                        | `src/evaluators/python.js`                               |
| `src/evaluators/typescript.js`                    | `src/evaluators/typescript.js`                           |

### 5.2 Port with rename-only patches

#### 5.2.1 `scripts/cc-plugin-eval.js` (from `scripts/plugin-eval.js`)

Identical 9 lines except the import path; mark executable (`chmod +x` is implicit via the `bin` field).

```js
#!/usr/bin/env node

import { runCli } from "../src/cli.js";

runCli(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
```

#### 5.2.2 `src/core/improvement-brief.js`

Verbatim port EXCEPT the suggested-prompt template. Replace the line `\`Use the skill-creator guidance to improve ${result.target.name}.\`` with `\`Hand the brief to skill-creator for the rewrite pass.\`` so we explicitly route improvement work back to the `skill-creator` skill (Anthropic's `skill-creator@claude-plugins-official`).

#### 5.2.3 `src/core/metric-packs.js`

Rename env vars: `PLUGIN_EVAL_TARGET` → `CC_PLUGIN_EVAL_TARGET`, `PLUGIN_EVAL_TARGET_KIND` → `CC_PLUGIN_EVAL_TARGET_KIND`, `PLUGIN_EVAL_METRIC_PACK_MANIFEST` → `CC_PLUGIN_EVAL_METRIC_PACK_MANIFEST`. Everything else identical.

### 5.3 Rewrites

#### 5.3.1 `src/cli.js`

Same parser shape, same `parseOptions` body. Required deltas:

1. Update `usage()` text with `cc-plugin-eval` everywhere, including the chat-first examples. New examples: `cc-plugin-eval start ./plugins/my-plugin --request "Evaluate this plugin." --format markdown`, `cc-plugin-eval start ./skills/my-skill --request "Why did this score that way?" --format markdown`, `cc-plugin-eval inspect ./plugins/my-plugin --component hooks --format markdown`.
2. Add `validate`, `evaluate-skill`, `inspect`, `improve` commands as defined in §3.
3. Wire `--strict` into `validate` to set `process.exitCode = 2` if `result.summary.checkCounts.fail > 0` OR (`--strict` AND `result.summary.checkCounts.warn > 0`).
4. `inspect` calls `analyzePath` with a new option `componentsOnly: ["manifest", "hooks", ...]`. Writer A passes that option through to `analyzePath` (see 5.3.2). When set, `analyze.js` runs only the listed Writer-B evaluators and skips skill/code/coverage/budget/measurement-plan/observed-usage logic. Output is wrapped as `{kind: "inspect-result", target, componentsRequested, findings, metrics, summary}`.

#### 5.3.2 `src/core/analyze.js`

Same skeleton, but the dispatch list expands to:

```
if target.kind === "plugin":
  appendFragment(result, await evaluatePlugin(target.path));
  // evaluatePlugin (5.3.7) internally calls every Writer-B evaluator
elif target.kind === "skill":
  appendFragment(result, await evaluateSkill(target.path));
else:
  // "directory" or "file" path — keep the OpenAI behavior
```

Add a shortcut path for `options.componentsOnly` (used by `inspect`) that calls only the requested Writer-B evaluators directly (not via `evaluatePlugin`) and returns a `{kind: "inspect-result", ...}` payload. Skip `loadBudgetBaseline`, `analyzeObservedUsage`, `analyzeCodeMetrics`, `analyzeCoverageArtifacts`, `runMetricPacks`, `buildMeasurementPlan`, `buildImprovementBrief`, `buildWorkflowGuide` for inspect. Compute a minimal `summary` using `computeSummary(result)`.

#### 5.3.3 `src/core/baseline.js`

Replace `~/.codex/skills` with `~/.claude/plugins/cache/*/skills/*` (the Claude plugin cache layout per ref §"Plugin caching and file resolution"). Replace `~/.codex/plugins/cache/openai-curated` and `~/.codex/.tmp/plugins/plugins` with `~/.claude/plugins/cache` (each immediate child is a plugin install). The `DEFAULT_BASELINE` constants stay the same numbers (they are heuristic ceilings, not Codex-specific). Also rename `manifestPath = path.join(directory, ".codex-plugin", "plugin.json")` → `path.join(directory, ".claude-plugin", "plugin.json")`.

#### 5.3.4 `src/core/budget.js`

Two surgical edits:

1. `manifestPath = path.join(pluginRoot, ".codex-plugin", "plugin.json")` → `path.join(pluginRoot, ".claude-plugin", "plugin.json")` (2 occurrences).
2. Plugin `triggerComponents` no longer includes `default-prompts`. Replace that component with: keyword list (`(manifest?.keywords || []).join(" ")` labeled `keywords`). Keep `plugin-description` as is. Plugin manifest in Claude does not have `interface.defaultPrompt`.
3. `discoverSkillDirs` uses the same `manifest?.skills || "./skills/"` logic — no change.

#### 5.3.5 `src/core/schema.js`

Three edits:

1. `TOOL_NAME = "cc-plugin-eval"`, `TOOL_VERSION = "0.1.0"`.
2. `SCHEMA_VERSION = 1`. Bump only when payload shape breaks.
3. Add a new exported helper `createFinding({severity, code, message, location, fix})` that returns `{severity, code, message, location: location || null, ...(fix ? {fix} : {})}`. Writer B uses this for the `findings[]` array. Existing `createCheck` stays for the legacy `checks[]` array (Writer A's evaluators emit checks; Writer B's emit findings; both arrays are folded together by `evaluatePlugin` — see 5.3.7).

#### 5.3.6 `src/core/target.js`

Replace `.codex-plugin/plugin.json` with `.claude-plugin/plugin.json` everywhere (4 occurrences). The `discoverPluginSkillDirectories` and `loadPluginManifest` helpers keep the same signature; only the directory string changes. Keep the SKILL.md detection for skill targets unchanged.

#### 5.3.7 `src/evaluators/plugin.js` (full rewrite)

Drop the entire `interface{}` validation (Codex-specific). Drop `defaultPrompt`, `composerIcon`, `logo`, `brandColor`, `category`, `capabilities`, `developerName`, `displayName`, `shortDescription`, `longDescription`, `websiteURL`, `privacyPolicyURL`, `termsOfServiceURL`. Drop `manifest-name-directory-mismatch` (Claude allows mismatch — `name` is authoritative for namespacing). Keep:

- `plugin-manifest-missing` (CC101) → fail/error if `.claude-plugin/plugin.json` does not exist.
- `plugin-manifest-invalid-json` (CC102) → fail/error.
- `plugin-skills-missing` (CC103) → warn if `discoverPluginSkillDirectories` returns empty AND no `commands` directory exists.

Then, if the manifest parses, dispatch to **all** Writer B evaluators (each receives the plugin root and the parsed manifest; each returns `{findings, metrics, artifacts}`):

```js
appendFragment(result, await evaluateManifest(manifest, pluginRoot));
appendFragment(result, await evaluateHooks(pluginRoot, manifest));
appendFragment(result, await evaluateMcp(pluginRoot, manifest));
appendFragment(result, await evaluateLsp(pluginRoot, manifest));
appendFragment(result, await evaluateMonitors(pluginRoot, manifest));
appendFragment(result, await evaluateAgents(pluginRoot, manifest));
appendFragment(result, await evaluateUserConfig(manifest, pluginRoot));
// Marketplace lives at ../../.claude-plugin/marketplace.json relative to plugin root
const marketplacePath = path.resolve(pluginRoot, "..", "..", ".claude-plugin", "marketplace.json");
if (await pathExists(marketplacePath)) {
  appendFragment(result, await evaluateMarketplace(marketplacePath, manifest.name));
}
```

For each Writer-B fragment, **convert findings → checks** before merging into the result.checks array using:

```js
function findingToCheck(finding) {
  return createCheck({
    id: finding.code,
    category: categoryFromCode(finding.code), // CC1xx → "manifest", CC2xx → "skill-structure", CC3xx → "hooks", etc.
    severity: finding.severity === "error" ? "error" : finding.severity === "warn" ? "warning" : "info",
    status: finding.severity === "error" ? "fail" : finding.severity === "warn" ? "warn" : "info",
    message: finding.message,
    evidence: finding.location ? [`${finding.location.file}${finding.location.line ? `:${finding.location.line}` : ""}`] : [],
    remediation: finding.fix ? [finding.fix] : [],
    targetPath: relativePath(process.cwd(), pluginRoot),
  });
}
```

Then iterate skills as the OpenAI version does (`for (const skillDir of skillDirs) { ... evaluateSkill(skillDir, {prefix: \`skill:${name}\`}) ... }`) and aggregate.

Emit the same plugin-level metrics the OpenAI version emits: `plugin_skill_count`, `plugin_keyword_count`. Drop `plugin_default_prompt_count`. Add `plugin_component_count` (count of declared component fields actually present on disk: skills, commands, agents, hooks, mcpServers, lspServers, monitors, outputStyles, themes, userConfig, channels, dependencies — anything truthy).

#### 5.3.8 `src/evaluators/skill.js`

Rewrite the `ALLOWED_FRONTMATTER_KEYS` set to match the Claude skill spec from `/tmp/plugin-compare/refs/claude-skills-reference.md` (the full reference table):

```js
const ALLOWED_FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "when_to_use",
  "argument-hint",
  "arguments",
  "disable-model-invocation",
  "user-invocable",
  "allowed-tools",
  "model",
  "effort",
  "context",
  "agent",
  "hooks",
  "paths",
  "shell",
  "license",
  "metadata",
  "compatibility", // skill-creator uses this; the ref doesn't list it but it appears in the wild; allow it as info-level
]);
```

Description rule:

- `description-missing` (CC201) — fail if absent.
- `description-too-long` (CC202) — warn if combined `description + when_to_use` exceeds **1536 chars** (Claude's per-entry cap, not the 1024 number from Codex).
- `description-trigger-weak` (CC203) — warn if neither "use when" nor "trigger" nor "triggers on" appears in description (case-insensitive).
- `description-keyword-list-missing` (CC204) — info if no "Triggers on:" line and no `when_to_use` field is set.

Other Claude-specific checks:

- `name-missing` (CC205), `name-not-kebab-case` (CC206) — same rules as Codex (kebab-case `[a-z0-9][a-z0-9-]*[a-z0-9]`), but the error code is `CC205`/`CC206` not the OpenAI string ID. Note: emit Codex string IDs are NOT used; rewriting evaluators emit `CC2xx` codes via `createCheck({id: "CC205", ...})`. The `id` field on the check is the code; the message remains human-readable.
- `name-mismatch-dir` (CC207) — info-only; Claude tolerates mismatch when `skills` path points to a directory containing SKILL.md directly (per ref §"Path behavior rules").
- `progressive-disclosure-missing` (CC208) — same threshold (>350 lines).
- `skill-too-large` / `skill-large` (CC209/CC210) — same thresholds (>800 / >500 lines).
- `broken-relative-links` (CC211) — keep the Codex implementation but extend the allow-list of URI schemes to include `claude://` (per Claude's hyperlink convention seen in skills); keep `app://`, `plugin://`, `rules://`, `mailto:`, `http://`, `https://`, `#`.
- `skill-frontmatter-extra-keys` (CC212) — warn for keys outside `ALLOWED_FRONTMATTER_KEYS`.
- `skill-frontmatter-invalid` (CC213) — fail if `parsed.errors.length > 0`.
- `extra-doc-files` (CC214) — same as OpenAI.
- New rule `skill-allowed-tools-syntax` (CC215) — info if `allowed-tools` is a string with commas (Claude expects space-separated or YAML list); warn if any tool name contains lowercase-only words like `bash` (Claude tool names are PascalCase: `Bash`, `Read`, `Edit`, `Skill`, `mcp__server__tool`).
- New rule `skill-disable-model-invocation-explicit` (CC216) — info-level recommendation if a `task-style` skill (heuristic: SKILL.md body contains imperative numbered list of >5 steps and lacks "use when" trigger) does not set `disable-model-invocation: true`. Heuristic threshold can be conservative; this is informational, not a fail.

Replace every check-creation `id:` value with `CC2xx` codes per the table above. The category stays `"skill-structure"` or `"best-practice"` or `"budget"` to match the OpenAI scoring categories.

#### 5.3.9 `src/core/workflow-guide.js`

Replace the literal `plugin-eval` strings with `cc-plugin-eval` everywhere (15+ occurrences in command templates). Replace the chat prompts:

- "Give me a full analysis of this skill, including benchmark setup." → keep
- "Help me benchmark this plugin." → keep
- "Measure the real token usage of this skill." → keep
- "What should I run next?" → keep
- "Why did this score that way?" → keep

Add new chat prompts to the request matcher:

- `validate` goal — phrases: `"validate"`, `"lint"`, `"check the manifest"`, `"is this manifest valid"` → routes to `cc-plugin-eval validate <path>`.
- `inspect` goal — phrases: `"inspect"`, `"check the hooks"`, `"check the mcp"`, `"audit the components"` → routes to `cc-plugin-eval inspect <path>`. Pick the component from the request text if it includes "hook", "mcp", "lsp", "monitor", "agent", "marketplace", "userconfig", otherwise `--component all`.

`benchmarkConfigPath` and `usageLogPath` change from `.plugin-eval/` to `.cc-plugin-eval/`.

#### 5.3.10 `src/core/presentation.js`

Two edits:

1. `buildStartCommand` uses `cc-plugin-eval start` not `plugin-eval start`.
2. `createBenchmarkRunNextAction` and `createBenchmarkTemplateNextAction` template strings use `cc-plugin-eval` and `.cc-plugin-eval/`.

Otherwise the routing logic (structural-failures-first, then budget-pressure, then observed-usage, etc.) is fine as written.

#### 5.3.11 `src/core/benchmark.js` (full rewrite)

Same structure as the OpenAI source but every Codex-specific assumption swaps to Claude:

- Default model: `defaultModelForTarget(target)` returns `claude-opus-4-8` for both plugins and skills (place these in a `DEFAULT_MODELS` constant; the user runs Opus 4.8 across the fleet — writer A picks reasonable defaults; flag in PR if uncertain).
- `runner.type` value: `"claude-cli"` not `"codex-cli"`. Reject anything else.
- `BENCHMARK_SCHEMA_VERSION = 1` (we are starting fresh, no v2 migration).
- `kind: "cc-plugin-eval-benchmark"` not `"plugin-eval-benchmark"`.
- `defaultBenchmarkConfigPath(target)` → `path.join(target.path, ".cc-plugin-eval", "benchmark.json")`.
- `defaultUsageLogPath(target)` → `path.join(target.path, ".cc-plugin-eval", "benchmark-usage.jsonl")`.
- Codex executable env var `PLUGIN_EVAL_CODEX_EXECUTABLE` → `CC_PLUGIN_EVAL_CLAUDE_EXECUTABLE`; default executable is `claude` not `codex`.
- `buildCodexExecArgs` → `buildClaudeExecArgs`. Claude Code's CLI invocation differs from `codex exec`. Use `claude --print` (or the equivalent that the user's installed `claude` accepts — Writer A: read `claude --help` output once and confirm; if uncertain, structure as `["--print", "--output-format", "json", "--cwd", workspacePath, ...]` and leave a TODO comment for Writer C's tests to mock with the fake-executable pattern in `tests/`). The fake executable used in tests bypasses real CLI behavior anyway, so the real-world correctness can be tightened post-merge.
- Scenario builders (`buildSkillScenarios`, `buildPluginScenarios`) — replace the prompt copy "Codex skill" / "Codex plugin" with "Claude Code skill" / "Claude Code plugin" but keep the scenario shapes (happy path, focused refinement, boundary case for skills; entrypoint routing, multi-skill follow-up, plugin boundary for plugins).
- Setup questions copy: replace "Codex" with "Claude Code".
- Notes copy: replace "real codex exec runs" with "real `claude` runs" and "There is no simulated dry-run mode." stays.
- Reject `--dry-run` with the same error message but s/codex/claude/.

#### 5.3.12 `src/core/benchmark-workspace.js` (full rewrite)

Mirror OpenAI but with Claude paths:

- `SNAPSHOT_IGNORED_DIRS` adds `.cc-plugin-eval` (drop `.plugin-eval`).
- `provisionSkillInstall(target, codexHomePath)` → `provisionSkillInstall(target, claudeHomePath)`. The skill goes to `path.join(claudeHomePath, "skills", target.name)` (per Claude's per-user skill location).
- `provisionPluginInstall(target, workspacePath)` writes a Claude marketplace.json at `path.join(workspacePath, ".claude-plugin", "marketplace.json")` (note: project-scope path is `.claude-plugin/` per the marketplace ref, NOT `.agents/plugins/` which is Codex). Marketplace JSON shape:

```json
{
  "name": "cc-plugin-eval-benchmark",
  "owner": {"name": "cc-plugin-eval"},
  "metadata": {"description": "Isolated workspace marketplace for cc-plugin-eval benchmarks."},
  "plugins": [
    {
      "name": "<target.name>",
      "description": "<manifest.description>",
      "version": "<manifest.version || '0.0.0'>",
      "source": "./plugins/<target.name>"
    }
  ]
}
```

- `seedClaudeHome` (renamed from `seedCodexHome`) seeds `~/.claude/auth.json` and `~/.claude/settings.json` (NOT `config.toml`). Env var `PLUGIN_EVAL_CODEX_HOME_SOURCE` → `CC_PLUGIN_EVAL_CLAUDE_HOME_SOURCE`. Source default `~/.claude`.
- `defaultTargetProvisioningMode(target)` returns `"isolated-skill-home"` for skills, `"workspace-plugin-marketplace"` for plugins (same names as OpenAI; the implementations are semantically equivalent across Codex and Claude — both isolate per-user skill and per-workspace marketplace install).

#### 5.3.13 `src/renderers/markdown.js`

Replace every literal `Plugin Eval` heading with `cc-plugin-eval`:

- `Plugin Eval Report:` → `cc-plugin-eval Report:`
- `Plugin Eval Start Here:` → `cc-plugin-eval Start Here:`
- `Plugin Eval Comparison:` → `cc-plugin-eval Comparison:`
- `Use From Codex Chat` → `Use From Claude Code Chat`

Add a new payload renderer `renderInspect(payload)` that emits a markdown report keyed by component (`## Manifest`, `## Hooks`, etc.), each section listing findings as `- [severity/code] message — fix`. Wire it via `renderMarkdown` checking `if (payload.kind === "inspect-result") return renderInspect(payload);`. Add a parallel HTML renderer in `html.js` (5.3.14).

#### 5.3.14 `src/renderers/html.js`

Title strings: `Plugin Eval Report` → `cc-plugin-eval Report`, etc. Remove the "Codex" copy. Add `renderInspectHtml(payload)` for the new inspect kind. Keep the styling block unchanged (the teal theme is fine).

### 5.4 Acceptance for Writer A

1. `node scripts/cc-plugin-eval.js analyze fixtures/minimal-plugin --format markdown` produces a non-empty report.
2. `node scripts/cc-plugin-eval.js validate fixtures/full-plugin --strict` exits 0 (full-plugin must be valid).
3. `node scripts/cc-plugin-eval.js inspect fixtures/full-plugin --component hooks --format json` returns `{kind: "inspect-result", findings: [...]}` with no other components.
4. No string `plugin-eval` (without the `cc-` prefix), `.codex-plugin`, `.plugin-eval`, `interface`, `defaultPrompt`, `composerIcon`, `brandColor`, `developerName`, `category`, or `capabilities` appears anywhere in `src/`. Run `rg -n '(?<!cc-)plugin-eval|\.codex-plugin|\.plugin-eval|interface\.[a-z]' src/` and confirm no hits.

---

## 6. Writer B — Claude-native evaluators

Writer B owns 8 brand-new evaluator files under `src/evaluators/`. Each file exports one async function with the signature `evaluateXxx(input, context) → {findings, metrics, artifacts}`. Writer A's `evaluatePlugin` (5.3.7) calls each, converts findings to checks, and merges them. Writer B does not touch any other file.

### 6.1 Common contract

Every evaluator returns:

```ts
{
  findings: Array<{
    severity: "info" | "warn" | "error",
    code: string,        // CC###, must match the assigned range for this evaluator
    message: string,     // human-readable, present-tense, ends with period
    location: {file: string, line?: number} | null,  // file relative to plugin root
    fix?: string,        // optional one-sentence remediation
  }>,
  metrics: Array<{       // same shape as core/schema.js createMetric
    id: string, category: string, value: number, unit: string, band: "good"|"moderate"|"heavy"|"info"
  }>,
  artifacts: Array<{...}>, // optional, same shape as createArtifact
}
```

Writer B imports `createMetric` and `createArtifact` from `../core/schema.js` (after Writer A's edits land) and uses the new `createFinding` helper. **Severity to status mapping is performed by Writer A's `findingToCheck` function** (5.3.7) so Writer B does NOT need to think about checks/status/category — only findings.

Error code assignments per ref §8: manifest CC1xx, skill CC2xx, hooks CC3xx, mcp CC4xx, lsp CC5xx, monitors CC6xx, agents CC7xx, marketplace CC8xx, security/path-traversal CC9xx.

### 6.2 `src/evaluators/manifest.js`

**Signature:** `export async function evaluateManifest(manifest, pluginRoot) → fragment`

**Lint rules (minimum 5; emit ALL applicable):**

| Code  | Severity | When                                                                                            |
| ----- | -------- | ----------------------------------------------------------------------------------------------- |
| CC101 | error    | `name` is missing or empty.                                                                     |
| CC102 | error    | `name` does not match `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/`.                                         |
| CC103 | warn     | `version` is set but not valid SemVer (`/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i`). The validator does not require `version`. |
| CC104 | info     | `$schema` is missing. Suggest `"https://json.schemastore.org/claude-code-plugin-manifest.json"`. |
| CC105 | warn     | `description` longer than 200 chars (marketplace UIs truncate).                                 |
| CC106 | warn     | `repository` is set but not a valid `https://` or `git+...` URL.                                |
| CC107 | info     | `keywords` is empty or absent — suggest at least 3 for marketplace discovery.                   |
| CC108 | info     | `license` is absent.                                                                            |
| CC110 | warn     | `${CLAUDE_PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_DATA}` appears in `description`, `homepage`, `repository`, `license`, or any keyword. Per ref §"Environment variables" these substitutions only fire in skill/agent content, hook/monitor commands, and MCP/LSP configs. |
| CC120 | warn     | `.claude-plugin/` directory contains files other than `plugin.json` (per ref §Warning callout). |
| CC130 | warn     | A path-like field (`skills`, `commands`, `agents`, `hooks`, `mcpServers`, `lspServers`, `monitors`, `outputStyles`, `themes`) does not start with `./`. |
| CC131 | error    | A path-like field points to a missing file or directory on disk.                                |
| CC132 | warn     | `commands` field is set (deprecated per ref — "use `skills/` for new plugins").                 |

Plus path-traversal rule: any path field whose normalized value starts with `..` after stripping `./` → CC900 `error`.

**Metrics:**

- `manifest_field_count` (count of distinct top-level fields present), `manifest_keyword_count`, `manifest_description_length_chars`. Bands: same heuristic as OpenAI's plugin metrics.

**Input contract:** `manifest` is the parsed object (already validated as JSON by `evaluatePlugin`). `pluginRoot` is an absolute path. Writer B uses `pathExists` from `../lib/files.js` to check `path.join(pluginRoot, value.replace(/^\.\//, ""))`.

### 6.3 `src/evaluators/hooks.js`

**Signature:** `export async function evaluateHooks(pluginRoot, manifest) → fragment`

**Behavior:** load hook config from one of 3 sources, in priority order (per ref):

1. `manifest.hooks` is an object → inline config.
2. `manifest.hooks` is a string → load that file.
3. Default `hooks/hooks.json` if it exists. If none of the above, return `{findings: [], metrics: [], artifacts: []}`.

If the config is an array, treat as a list of hook configs (per ref multi-source behavior). Otherwise it should be an object with event names as keys.

**Lint rules (minimum 5):**

| Code  | Severity | When                                                                                              |
| ----- | -------- | ------------------------------------------------------------------------------------------------- |
| CC301 | error    | The hook config file exists but does not parse as JSON.                                           |
| CC302 | error    | A top-level key is not a recognized event name. Valid events (case-sensitive): `SessionStart`, `Setup`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `Notification`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `Stop`, `StopFailure`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `PreCompact`, `PostCompact`, `Elicitation`, `ElicitationResult`, `SessionEnd`. (Hard-code this list in a `const VALID_HOOK_EVENTS` set.) |
| CC303 | warn     | A top-level key is a known event name but cased wrongly (`postToolUse` vs `PostToolUse`).          |
| CC304 | error    | A hook entry has a `type` field other than `command`, `http`, `mcp_tool`, `prompt`, `agent`.       |
| CC305 | warn     | A `command`-type hook references a script via `${CLAUDE_PLUGIN_ROOT}/...` and the script does not exist on disk. |
| CC306 | warn     | A `command`-type hook does not reference `${CLAUDE_PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_DATA}` at all and the command is not a system binary like `bash`, `node`, `python`, `npm`, `git`, `rg`, `jq` (heuristic: the first space-separated word is one of those allow-listed system bins). Path-traversal-resistant. |
| CC307 | info     | A `matcher` field is missing for a tool-related event (`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`). Per ref the matcher is recommended to scope to specific tools. |
| CC308 | warn     | A `command`-type hook command contains `../` after stripping `${CLAUDE_PLUGIN_ROOT}` → CC900 actually. |
| CC309 | warn     | A `prompt`-type hook does not reference `$ARGUMENTS` (the placeholder for context per ref).        |
| CC310 | warn     | A `mcp_tool`-type hook references an MCP server name not declared in `manifest.mcpServers` or `.mcp.json`. |

**Metrics:** `hooks_event_count`, `hooks_total_handler_count`, `hooks_command_count`, `hooks_http_count`, `hooks_mcp_tool_count`, `hooks_prompt_count`, `hooks_agent_count`. Band: `info` (these are descriptive).

### 6.4 `src/evaluators/mcp.js`

**Signature:** `export async function evaluateMcp(pluginRoot, manifest) → fragment`

**Behavior:** Load from `manifest.mcpServers` (inline object or path) or `.mcp.json` default. Expected shape: `{mcpServers: {<name>: {command, args?, env?, cwd?, ...}}}`.

**Lint rules (minimum 5):**

| Code  | Severity | When                                                                                            |
| ----- | -------- | ----------------------------------------------------------------------------------------------- |
| CC401 | error    | `.mcp.json` does not parse, or `manifest.mcpServers` is not an object.                          |
| CC402 | error    | A server entry is missing `command`.                                                            |
| CC403 | warn     | `command` references a script via `${CLAUDE_PLUGIN_ROOT}/...` and the file does not exist.       |
| CC404 | warn     | `command` is a relative path (e.g. `./server.js`) without `${CLAUDE_PLUGIN_ROOT}` prefix — CWD at runtime is unspecified, the ref's example uses `${CLAUDE_PLUGIN_ROOT}`. Suggest the prefix. |
| CC405 | warn     | `args` is set but is not an array of strings.                                                   |
| CC406 | warn     | `env` contains a non-string value.                                                              |
| CC407 | info     | `cwd` is hard-coded to an absolute path other than `${CLAUDE_PLUGIN_ROOT}`. Portability concern. |
| CC408 | warn     | Server name does not match `/^[a-z0-9][a-z0-9-]*$/` (Claude allows underscores in tool names like `mcp__server__tool`, but server name itself is kebab-case by convention; this is a soft rule, warn-level). |
| CC409 | info     | An `env` value contains a literal-looking secret (matches `/(token|key|secret|password|api[_-]?key)/i` in the KEY name AND value is non-empty AND not a `${user_config.*}` reference). Suggest moving to `userConfig` with `sensitive: true`. |

**Metrics:** `mcp_server_count`, `mcp_servers_with_env_count`.

### 6.5 `src/evaluators/lsp.js`

**Signature:** `export async function evaluateLsp(pluginRoot, manifest) → fragment`

**Behavior:** Load from `manifest.lspServers` or `.lsp.json`. Expected top-level shape: `{<lang>: {command, extensionToLanguage, ...}}` per ref. (The ref shows the inline form under `manifest.lspServers`; for the file form, the same keys go at the file root, no wrapper.)

**Lint rules (minimum 5):**

| Code  | Severity | When                                                                                          |
| ----- | -------- | --------------------------------------------------------------------------------------------- |
| CC501 | error    | `.lsp.json` does not parse.                                                                   |
| CC502 | error    | A server entry is missing `command`.                                                          |
| CC503 | error    | A server entry is missing `extensionToLanguage` (per ref this is required).                   |
| CC504 | warn     | `extensionToLanguage` keys do not start with `.` (e.g. `go` instead of `.go`).                |
| CC505 | warn     | `transport` is set to anything other than `stdio` or `socket`.                                |
| CC506 | info     | `command` looks like an installed binary (e.g. `gopls`, `pyright`, `rust-analyzer`) but the README/install instructions are not documented in the plugin (heuristic: README.md does not mention `command`). The ref §Warning notes "You must install the language server binary separately"; nudge authors to document. |
| CC507 | warn     | `startupTimeout` or `shutdownTimeout` is set to something not a positive integer.             |
| CC508 | warn     | `restartOnCrash: true` without `maxRestarts` set (could spin).                                |

**Metrics:** `lsp_server_count`, `lsp_extension_count`.

### 6.6 `src/evaluators/monitors.js`

**Signature:** `export async function evaluateMonitors(pluginRoot, manifest) → fragment`

**Behavior:** Load from `manifest.monitors` (string path) or default `monitors/monitors.json`. Expected: array of `{name, command, description, when?}`.

**Lint rules (minimum 5):**

| Code  | Severity | When                                                                                            |
| ----- | -------- | ----------------------------------------------------------------------------------------------- |
| CC601 | error    | The file does not parse, or the parsed value is not an array.                                   |
| CC602 | error    | A monitor entry is missing `name`, `command`, or `description`.                                 |
| CC603 | error    | Two monitor entries have the same `name` (per ref `name` must be unique within the plugin).     |
| CC604 | warn     | `when` value is set and is not `"always"` or matches `/^on-skill-invoke:[a-z0-9-]+$/`.          |
| CC605 | warn     | `when: "on-skill-invoke:<skill-name>"` references a skill name not present in the plugin's skills. |
| CC606 | warn     | `command` does not start with `cd "${CLAUDE_PLUGIN_ROOT}" && ` AND does not reference `${CLAUDE_PLUGIN_ROOT}` at all AND does not start with a system bin (`tail`, `watch`, `ping`, `curl`, `node`, `bash`). Per ref the recommended pattern is the `cd` prefix. Soft rule. |
| CC607 | info     | `description` is longer than 80 chars (shown in task panel, gets truncated).                    |
| CC608 | warn     | `${user_config.*}` reference points at a key not declared in `manifest.userConfig`.             |

**Metrics:** `monitor_count`, `monitor_on_skill_invoke_count`.

### 6.7 `src/evaluators/agents.js`

**Signature:** `export async function evaluateAgents(pluginRoot, manifest) → fragment`

**Behavior:** Discover agent files via `manifest.agents` (string or array of paths) or default `agents/*.md`. For each file, parse frontmatter via `parseFrontmatter` from `../lib/frontmatter.js`.

**Allowed frontmatter keys (per ref §Agents):** `name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, `isolation`. **Forbidden for security:** `hooks`, `mcpServers`, `permissionMode`.

**Lint rules (minimum 5):**

| Code  | Severity | When                                                                                            |
| ----- | -------- | ----------------------------------------------------------------------------------------------- |
| CC701 | error    | Agent file has no frontmatter.                                                                  |
| CC702 | error    | Agent frontmatter is missing `name` or `description`.                                           |
| CC703 | error    | Agent frontmatter contains `hooks`, `mcpServers`, or `permissionMode` (forbidden per ref).      |
| CC704 | warn     | `model` is set to anything other than `sonnet`, `opus`, `haiku`, `inherit`, or a known concrete model id. (Soft rule; don't enforce strict id, just warn for empty string or pure number.) |
| CC705 | warn     | `effort` is set to anything other than `low`, `medium`, `high`, `xhigh`, `max`.                 |
| CC706 | warn     | `maxTurns` is set to a non-positive-integer.                                                    |
| CC707 | warn     | `isolation` is set to anything other than `"worktree"` (ref says "only valid value").           |
| CC708 | info     | Agent body is shorter than 50 chars (probably a stub).                                          |
| CC709 | warn     | `tools` and `disallowedTools` overlap (same tool listed in both).                               |

**Metrics:** `agent_count`, `agent_with_isolation_count`, `agent_with_disallowed_tools_count`.

### 6.8 `src/evaluators/marketplace.js`

**Signature:** `export async function evaluateMarketplace(marketplacePath, pluginName) → fragment`

**Behavior:** Validate `.claude-plugin/marketplace.json` (the file at the marketplace root, NOT inside the plugin). Called only if such a file exists at `<plugin-parent>/<plugin-parent>/.claude-plugin/marketplace.json` (the user's monorepo case). Expected shape per the user's existing `marketplace.json` at `.claude-plugin/marketplace.json`: `{name, owner, metadata, plugins: [{name, description, version, source}]}`.

**Lint rules (minimum 5):**

| Code  | Severity | When                                                                                            |
| ----- | -------- | ----------------------------------------------------------------------------------------------- |
| CC801 | error    | File does not parse.                                                                            |
| CC802 | error    | Top-level `name`, `plugins` is missing.                                                         |
| CC803 | error    | The plugin being evaluated has no entry in `plugins[]` matching `name === pluginName`.          |
| CC804 | warn     | The matched entry's `version` is set but does not match `manifest.version` (drift).             |
| CC805 | warn     | The matched entry's `source` does not point at the plugin's directory (`./plugins/<pluginName>`). |
| CC806 | info     | The matched entry's `description` differs from `manifest.description` (suggest keeping aligned). |
| CC807 | warn     | Two entries in `plugins[]` share the same `name` (duplicate).                                   |

**Metrics:** `marketplace_plugin_count`.

### 6.9 `src/evaluators/userconfig.js`

**Signature:** `export async function evaluateUserConfig(manifest, pluginRoot) → fragment`

**Behavior:** Validate `manifest.userConfig` and per-channel `userConfig` blocks under `manifest.channels`.

**Per-key required structure (per ref §"User configuration"):** `{type, title, description, sensitive?, required?, default?, multiple?, min?, max?}`. `type` ∈ `string | number | boolean | directory | file`.

**Lint rules (minimum 5):**

| Code  | Severity | When                                                                                            |
| ----- | -------- | ----------------------------------------------------------------------------------------------- |
| CC910 | error    | A `userConfig` key contains characters outside `[A-Za-z0-9_]` (must be a valid identifier).     |
| CC911 | error    | A key is missing `type`, `title`, or `description`.                                             |
| CC912 | error    | `type` is not one of `string`, `number`, `boolean`, `directory`, `file`.                        |
| CC913 | warn     | `multiple: true` is set on a non-string `type` (ref says multiple is for strings only).         |
| CC914 | warn     | `min`/`max` is set on a non-number `type`.                                                      |
| CC915 | warn     | A field name matches `/^(api[_-]?key|token|secret|password|credential)/i` and `sensitive` is not `true`. |
| CC916 | warn     | A `channels[*].server` value does not match a key in `manifest.mcpServers` (ref says "must match"). |
| CC917 | info     | A `userConfig` field is unused (no `${user_config.<KEY>}` reference anywhere in `mcpServers`/`lspServers`/hooks/monitors/skill content). Heuristic; soft. |

**Metrics:** `userconfig_field_count`, `userconfig_sensitive_count`, `channel_count`.

### 6.10 Acceptance for Writer B

1. Each evaluator file has at least 5 lint rules implemented and tested.
2. Every error code listed in §6.2–6.9 is reachable by at least one fixture in Writer C's test set.
3. `evaluateManifest({}, ".")` returns at minimum `[{code: "CC101"}]` (missing name).
4. `evaluateHooks` correctly handles the inline-in-`plugin.json` form: pass `manifest = {hooks: {PostToolUse: [...]}}` and confirm it does not try to read `hooks/hooks.json`.
5. No imports outside `node:`-prefixed modules and `../core/schema.js`, `../lib/files.js`, `../lib/frontmatter.js`. Same external-deps-zero rule as Writer A.

---

## 7. Writer C — Skills, fixtures, tests, docs

Writer C owns five `SKILL.md` files, the entire `fixtures/` tree, all tests, the README, the THIRD_PARTY_NOTICES, and 5 reference docs.

### 7.1 Skills (5 files in `skills/<name>/SKILL.md`)

All skills follow the Claude SKILL.md spec from `/tmp/plugin-compare/refs/claude-skills-reference.md`. **Drop ALL `agents/openai.yaml` files** — they are Codex-specific and Claude does not have an analog (skills can request a fork-mode agent inline via `context: fork` and `agent:`, but separate yaml files belong to Codex).

#### 7.1.1 `skills/cc-plugin-eval/SKILL.md` (umbrella)

Frontmatter:

```yaml
---
name: cc-plugin-eval
description: |
  Evaluate a local Claude Code plugin or skill, explain why it scored that way, surface the highest-leverage fixes first, walk through the token budget, validate every component file (plugin.json, hooks, .mcp.json, .lsp.json, monitors, agents, userConfig, channels, dependencies, marketplace.json), or run a real claude benchmark in an isolated workspace. Use when the user says: "evaluate this plugin", "evaluate this skill", "give me an analysis of <name>", "why did this score that way", "what should I fix first", "explain the token budget for this plugin", "validate this manifest", "lint the hooks", "inspect the mcp servers", "measure the real token usage", "help me benchmark this plugin", or "what should I run next?".
---
```

Body sections (in this order):

1. `# cc-plugin-eval` — H1.
2. `## Start Here` — explain that the chat-first router is `cc-plugin-eval start <path> --request "<request>" --format markdown`. List the routing rules from `src/core/workflow-guide.js` in plain English.
3. `## Chat Requests To Recognize` — bullet list of the recognized phrases (12+, including the new `validate`/`inspect` ones).
4. `## Matching Commands` — fenced bash block with one line per recognized command.
5. `## Output Expectations` — describes the `At a Glance` / `Why It Matters` / `Fix First` / `Recommended Next Step` rendering pattern, and the fact that JSON is the source of truth.
6. `## When To Hand Off` — explicit handoffs: `improve-skill` for rewrite work hands off to the `skill-creator` skill (Anthropic's `skill-creator@claude-plugins-official`); `metric-pack-designer` for custom rubric design; `evaluate-plugin` and `evaluate-skill` for kind-specific paths.
7. `## References` — list `../../references/chat-first-workflows.md`, `../../references/technical-design.md`, `../../references/evaluation-result-schema.md`, `../../references/component-validators.md`.

No `agents:` block. No `agents/` subdirectory.

#### 7.1.2 `skills/evaluate-plugin/SKILL.md`

Frontmatter:

```yaml
---
name: evaluate-plugin
description: |
  Evaluate a local Claude Code plugin (a directory containing .claude-plugin/plugin.json). Use when the user says: "evaluate this plugin", "audit this plugin", "why did this plugin score that way", "what should I fix first in this plugin", "validate the manifest", "inspect the hooks", "inspect the mcp servers", "lint this plugin", or "help me benchmark this plugin".
---
```

Body sections:

1. `# Evaluate Plugin` H1.
2. `## When To Use` — explicitly: target has `.claude-plugin/plugin.json`. If the target is a single SKILL.md, hand off to `../evaluate-skill/SKILL.md`.
3. `## Workflow` — numbered, 6 steps mirroring the OpenAI skill but with Claude commands (`cc-plugin-eval analyze <root>`, `cc-plugin-eval validate <root> --strict`, `cc-plugin-eval inspect <root> --component all`, etc.).
4. `## Plugin-Specific Priorities` — list:
   - `.claude-plugin/plugin.json` validity (CC1xx)
   - hooks event-name casing (CC302) and `${CLAUDE_PLUGIN_ROOT}` usage (CC306)
   - MCP `command` portability (CC404), secret hygiene (CC409, CC915)
   - LSP `extensionToLanguage` correctness (CC503)
   - monitors uniqueness (CC603) and `when` syntax (CC604)
   - agent security boundaries (CC703 — no `hooks`/`mcpServers`/`permissionMode`)
   - marketplace alignment (CC803, CC804)
   - skill aggregate quality (delegated to `evaluate-skill`)
5. `## Chat Requests To Recognize` — list of phrases.
6. `## Commands` — fenced bash block.
7. `## Reference` — `../../references/chat-first-workflows.md`.

No `agents:` block.

#### 7.1.3 `skills/evaluate-skill/SKILL.md`

Frontmatter:

```yaml
---
name: evaluate-skill
description: |
  Evaluate a local Claude Code skill (a directory containing SKILL.md). Use when the user says: "evaluate this skill", "give me an analysis of <skill-name>", "audit this skill", "why did this skill score that way", "what should I fix first in this skill", "this skill is too big", "this skill is not triggering", or "measure the real token usage of this skill".
---
```

Body: mirror the OpenAI structure but with the new error codes and Claude SKILL.md spec details (`when_to_use`, `disable-model-invocation`, `allowed-tools` syntax, etc.). Add a sentence: "If the user wants a rewrite plan, hand off to the `skill-creator` skill (Anthropic's `skill-creator@claude-plugins-official`) — that skill specializes in single-skill grading and rewrites, while cc-plugin-eval focuses on structural and budget signals."

#### 7.1.4 `skills/improve-skill/SKILL.md`

Frontmatter:

```yaml
---
name: improve-skill
description: |
  Turn cc-plugin-eval findings into a concrete rewrite brief for a Claude Code skill, then hand off to skill-creator for the actual rewrite pass. Use when the user already evaluated a skill and now wants a rewrite plan.
---
```

Body sections:

1. `# Improve Skill` H1.
2. `## Workflow` — 4 steps:
   1. Run `cc-plugin-eval analyze <skill-path> --brief-out ./skill-brief.json`.
   2. Read the improvement brief, separate required fixes from recommended fixes.
   3. Hand the brief to skill-creator — it specializes in skill rewrites with subagent-driven evals.
   4. Re-run `cc-plugin-eval analyze` and use `cc-plugin-eval compare before.json after.json` to measure the delta.
3. `## What This Skill Does NOT Do` — explicitly say: this skill does not perform LLM-driven rewrites; that is `skill-creator`'s job. cc-plugin-eval produces structured findings and a rewrite brief; skill-creator turns the brief into edits.
4. `## Focus Areas` — bullet list (trigger/invoke budget, progressive disclosure, broken links, oversized descriptions, frontmatter validity).
5. `## Commands` and `## Reference`.

#### 7.1.5 `skills/metric-pack-designer/SKILL.md`

Frontmatter:

```yaml
---
name: metric-pack-designer
description: |
  Design a local metric pack so a team can extend cc-plugin-eval with custom evaluation criteria that emit schema-compatible findings, metrics, and artifacts. Use when the user wants their own rubric, custom checks, or a domain-specific report.
---
```

Body: same structure as the OpenAI version, but the runtime contract uses the renamed env vars (`CC_PLUGIN_EVAL_TARGET`, `CC_PLUGIN_EVAL_TARGET_KIND`, `CC_PLUGIN_EVAL_METRIC_PACK_MANIFEST`) and references `../../references/metric-pack-manifest.md`.

#### 7.1.6 No `disable-model-invocation` on any of these 5

These are router-style skills that Claude should auto-load when the user's request matches the description triggers. Setting `disable-model-invocation: true` would defeat the chat-first design.

### 7.2 Fixtures

Drop the OpenAI `multi-skill-plugin/` fixture (Codex-shaped). Create the following:

#### 7.2.1 `fixtures/minimal-plugin/`

```
minimal-plugin/
├── .claude-plugin/plugin.json   # Claude manifest, just {name, version, description, license, skills: "./skills/"}
└── skills/temp-skill/SKILL.md   # name, description with "Use when ...", short body
```

Manifest:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "minimal-plugin",
  "version": "0.1.0",
  "description": "Minimal Claude Code plugin fixture for cc-plugin-eval tests.",
  "license": "MIT",
  "keywords": ["fixture"],
  "skills": "./skills/"
}
```

#### 7.2.2 `fixtures/full-plugin/`

Populate every Claude component (this is the main acceptance fixture for Writer B's evaluators):

```
full-plugin/
├── .claude-plugin/plugin.json   # has skills, agents, hooks, mcpServers, lspServers, monitors, themes, userConfig, channels, dependencies
├── skills/example-skill/SKILL.md
├── agents/reviewer.md           # name, description, model, effort, maxTurns, tools, isolation: worktree
├── hooks/hooks.json             # PostToolUse with command type referencing ${CLAUDE_PLUGIN_ROOT}/scripts/format.sh
├── .mcp.json                    # one server with command, args, env using ${CLAUDE_PLUGIN_ROOT}
├── .lsp.json                    # one entry with command, extensionToLanguage
├── monitors/monitors.json       # one always-on, one on-skill-invoke
├── themes/dracula.json          # base, overrides
├── scripts/format.sh            # echo "hello"; chmod +x equivalent (writer C uses fs.chmod 0o755 in test setup OR ships it executable)
└── README.md                    # short
```

Manifest must include `userConfig` with one sensitive key (`api_token`) and one `channels` entry referencing the `.mcp.json` server name. **Every Writer-B evaluator MUST find zero errors and at most a few `info` findings on this fixture** — that is the validity acceptance test.

#### 7.2.3 `fixtures/minimal-skill/`

Identical to OpenAI's minimal-skill but with Claude-compliant frontmatter (use `when_to_use` and `description` in modern style):

```yaml
---
name: minimal-skill
description: A minimal Claude Code skill fixture for cc-plugin-eval tests. Use when running cc-plugin-eval against a tiny but well-formed skill.
---

# Minimal Skill

A short body that mentions one reference at `references/example.md`.
```

Plus `references/example.md` with a few lines.

#### 7.2.4 `fixtures/coverage-samples/`

Port verbatim — `lcov.info`, `coverage.xml`, `coverage-final.json`. The data is generic.

#### 7.2.5 `fixtures/observed-usage/responses.jsonl`

Port verbatim. The Responses API usage shape is generic enough that it parses on Claude usage data too (input_tokens / output_tokens / total_tokens are ubiquitous).

#### 7.2.6 `fixtures/ts-python-sample/`

Port verbatim — generic TS/Python sample for code/coverage evaluators.

#### 7.2.7 `fixtures/metric-pack/`

Same `manifest.json` shape (per `references/metric-pack-manifest.md`) and `emit-pack.js` that prints JSON. Update env-var read logic to `process.env.CC_PLUGIN_EVAL_TARGET` (writer C verifies with `node fixtures/metric-pack/emit-pack.js fixtures/minimal-plugin plugin`).

#### 7.2.8 `fixtures/broken-plugin/` (NEW, for Writer B's tests)

A deliberately broken plugin that triggers at least one finding from each Writer-B evaluator. Used by `tests/evaluators-claude.test.js`. Examples:

- `name: "Bad Name"` (CC102)
- `version: "not-a-version"` (CC103)
- `skills: "missing-dir/"` no `./` prefix (CC130) and missing on disk (CC131)
- `hooks/hooks.json` with `postToolUse` (lowercase, CC303) and a `mcp_tool` referencing an undeclared server (CC310)
- `.mcp.json` with one server missing `command` (CC402)
- `.lsp.json` with one server missing `extensionToLanguage` (CC503)
- `monitors/monitors.json` with two entries sharing `name` (CC603)
- `agents/insecure.md` with `permissionMode: bypassPermissions` in frontmatter (CC703)
- `userConfig.api-token` (invalid key with hyphen, CC910) and `api_token` without `sensitive: true` (CC915)

### 7.3 Tests

Single file: `tests/cc-plugin-eval.test.js`. Use `node:test` (zero-dep, native). Structure:

```js
import test from "node:test";
import assert from "node:assert/strict";
// ... imports from src/core/* and src/evaluators/*
```

**Test categories (each is one or more `test()` blocks; minimum case counts in parens):**

1. **Target detection (3)** — resolves SKILL.md as skill, `.claude-plugin/plugin.json` as plugin, generic dir as directory.
2. **Frontmatter parsing (port from OpenAI: 2 cases)** — folded and literal block scalars (port verbatim, the parser is verbatim-ported).
3. **Skill structure rules (port + extend: 5 cases)** — minimal skill renders, oversized description emits CC202, missing description emits CC201, broken links emit CC211, allowed-tools comma-form emits CC215.
4. **Manifest evaluator (Writer B contract: 5 cases)** — missing name (CC101), invalid name (CC102), invalid SemVer (CC103), missing path on disk (CC131), env-var leak in description (CC110).
5. **Hooks evaluator (5 cases)** — invalid event name (CC302), case-wrong event (CC303), invalid type (CC304), missing script file (CC305), `mcp_tool` referencing undeclared server (CC310).
6. **MCP evaluator (5 cases)** — missing command (CC402), missing referenced script (CC403), env with non-string (CC406), suspicious secret name (CC409), invalid server name (CC408).
7. **LSP evaluator (5 cases)** — missing command (CC502), missing extensionToLanguage (CC503), extension without dot (CC504), invalid transport (CC505), restartOnCrash without maxRestarts (CC508).
8. **Monitors evaluator (5 cases)** — duplicate name (CC603), invalid `when` syntax (CC604), `on-skill-invoke` referencing missing skill (CC605), `${user_config.X}` for missing X (CC608), oversized description (CC607).
9. **Agents evaluator (5 cases)** — forbidden `hooks` field (CC703), invalid `model` (CC704), invalid `effort` (CC705), invalid `isolation` (CC707), tool/disallowedTools overlap (CC709).
10. **Marketplace evaluator (5 cases)** — file missing → no findings emitted (skip path); plugin not in entries (CC803); version drift (CC804); source mismatch (CC805); duplicate entry (CC807).
11. **UserConfig evaluator (5 cases)** — invalid key (CC910), missing type (CC911), invalid type (CC912), `multiple` on number (CC913), secret without `sensitive: true` (CC915).
12. **Code/coverage/python/typescript (port verbatim: 4 cases)**.
13. **Observed usage (port: 2 cases)**.
14. **Metric pack merging (port: 1 case)** — env vars renamed.
15. **Workflow guide routing (port + extend: 3 cases)** — analyze, measure, validate (new).
16. **Improvement brief & comparison (port: 2 cases)**.
17. **Score summary (port: 2 cases)** — deductions, category totals.
18. **CLI integration (port + extend: 4 cases)** — analyze/report/compare/explain-budget chain (port), validate `--strict` exits 2 (new), inspect filters (new), evaluate-skill resolves correctly (new).
19. **Benchmark integration (port + adapt: 2 cases)** — fake `claude` binary (writer C ports the OpenAI fake-codex pattern, renames to `claude`), benchmark writes usage log + generated-code analysis.
20. **Full-plugin fixture validity (1 case)** — `validate fixtures/full-plugin --strict` exits 0 with no error/warn findings (only info allowed).
21. **Broken-plugin fixture coverage (1 case)** — `analyze fixtures/broken-plugin` emits at least one finding for every Writer-B error code in the broken fixture's coverage matrix from §7.2.8.

Total: ~60 test() blocks. The OpenAI test file has 27. Extra ~33 come from the new Claude-native evaluators.

### 7.4 README.md

Sections (each 1 paragraph unless noted):

1. **Title + 1-line tagline.** "Local-first Claude Code plugin evaluator."
2. **What this plugin contains.** Bullet list pointing at `scripts/cc-plugin-eval.js`, `.claude-plugin/plugin.json`, `skills/`, `src/`.
3. **Source.** Single sentence: "Forked from `openai/plugins` (`plugins/plugin-eval`, MIT). See `THIRD_PARTY_NOTICES.md`."
4. **Install as a CLI.** Two subsections: "Run without installing" (`node ./scripts/cc-plugin-eval.js --help`) and "Install globally" (`npm link`). Same shape as OpenAI README.
5. **CLI usage.** Subsections per the surface in §3 (Start From Chat, Core Commands, New Claude-Native Commands, Reports, Compatibility Aliases).
6. **Recommended workflow.** 5-step list mirroring OpenAI step-for-step but pointing at `cc-plugin-eval` and Claude commands.
7. **Local-first behavior.** 3 bullets explaining `analyze`/`validate`/`inspect` are pure-local; `benchmark` runs real `claude` in isolated workspaces.
8. **Safety and execution notes.** 4 bullets: file-only side effects of `analyze`/`validate`/`inspect`/`explain-budget`/`measurement-plan`; `init-benchmark` writes under `.cc-plugin-eval/`; `benchmark` runs a live `claude` workflow in an isolated temp workspace; review generated benchmark configs before running them.
9. **How it works as a Claude Code plugin.** Reference `.claude-plugin/plugin.json` and the `skills/` directory; mention the chat-first router. Use natural prompts: "Evaluate this plugin.", "Why did this score that way?", "Validate the manifest." (no `$plugin-name` syntax — Claude does not use that prefix).
10. **Manual plugin installation.** Reference the user's marketplace pattern at `.claude-plugin/marketplace.json`. Show one example entry that pins `cc-plugin-eval` at version `0.1.0` with `source: "./plugins/cc-plugin-eval"`.
11. **Use cases.** 5-bullet list (evaluate plugin, evaluate skill, validate before commit via `validate --strict`, benchmark, compare before/after).
12. **References.** Links to the 5 files in `references/`.

### 7.5 Reference docs (5 files in `references/`)

#### 7.5.1 `references/chat-first-workflows.md`

Port the OpenAI version, replace every `plugin-eval` with `cc-plugin-eval`, replace every "Codex chat" with "Claude Code chat", and add two new sections at the end:

- `### Validate this manifest` — routes to `cc-plugin-eval validate <path>`.
- `### Inspect the components` — routes to `cc-plugin-eval inspect <path> --component <name>`.

#### 7.5.2 `references/technical-design.md`

Port the OpenAI version with these section-level edits:

- "Architecture" — list the 3 file groups: `src/core/` (deterministic engine), `src/evaluators/` (per-component validators including the 8 Claude-native ones), `src/renderers/` (json/markdown/html).
- "Codex Skills" → rename "Claude Code Skills".
- Drop the entire "OpenAI Token Telemetry Notes" section (Responses API specifics — no longer load-bearing for cc-plugin-eval).
- Replace it with a "Token Estimation" section: "cc-plugin-eval uses static estimation (`estimated-static`) by counting characters and dividing by 4 (per `src/lib/tokens.js`). The `--observed-usage` flag accepts the same JSONL shape that Claude API responses use (input_tokens, output_tokens, total_tokens, optional cached_tokens and reasoning_tokens) to layer measured usage on top of static estimates."

#### 7.5.3 `references/evaluation-result-schema.md`

Port the OpenAI schema doc with `tool.name = "cc-plugin-eval"` and the new `findings[]` array (Writer B's output) listed alongside `checks[]`. Document that `findings` and `checks` are unioned by Writer A's `findingToCheck` adapter and live in the same `result.checks` array on the canonical payload — `findings` is internal to evaluators only.

#### 7.5.4 `references/component-validators.md` (NEW)

A table-driven reference. Each row is one error code from §6.2–6.9, columns: `code`, `evaluator`, `severity`, `category`, `summary`, `fix`. Total ~70 rows. Writer C copy-pastes from the SPEC.md tables. This file is what skill-creator-style downstream consumers cite when they want to map a finding to remediation copy.

#### 7.5.5 `references/observed-usage.md`, `references/metric-pack-manifest.md`, `references/benchmark-harness.md`

Port the OpenAI versions with renames:
- `plugin-eval` → `cc-plugin-eval`
- `.plugin-eval/` → `.cc-plugin-eval/`
- `codex exec` → `claude` (in benchmark-harness.md)
- `PLUGIN_EVAL_TARGET` → `CC_PLUGIN_EVAL_TARGET` etc.

### 7.6 THIRD_PARTY_NOTICES.md (new, plugin root)

Exact wording:

```
# Third-Party Notices

cc-plugin-eval is a fork of plugin-eval, originally from OpenAI's plugin-compare/openai-plugins repository (https://github.com/openai/plugins, path `plugins/plugin-eval`). The original code is MIT-licensed.

The MIT License (https://opensource.org/license/mit) terms apply to the ported files in this directory tree:

> MIT License
>
> Copyright (c) 2026 OpenAI
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## Modifications

cc-plugin-eval modifies the original to target Claude Code (https://docs.claude.com/en/code) instead of OpenAI Codex. Specifically:

- Replaces `.codex-plugin/plugin.json` detection with `.claude-plugin/plugin.json`.
- Replaces the Codex `interface{}` block validation with eight new evaluators (manifest, hooks, mcp, lsp, monitors, agents, marketplace, userconfig).
- Replaces `codex exec` with `claude` in the benchmark harness.
- Replaces the `~/.codex/` path conventions with `~/.claude/`.
- Replaces the Codex marketplace shape (`.agents/plugins/marketplace.json` with `policy{installation, authentication}`) with the Claude shape (`.claude-plugin/marketplace.json` with `{name, owner, plugins[]}`).
- Adds new CLI subcommands: `validate`, `inspect`, `evaluate-skill`, `improve`.

## License of derivative work

The cc-plugin-eval modifications are also released under MIT, copyright (c) 2026 AncpLua. See the LICENSE file at the repository root.
```

### 7.7 Per-file headers

For every file Writer A ports verbatim or rewrites from an OpenAI source, prepend a single comment line at the top (after any `#!/usr/bin/env node` shebang):

- For verbatim ports: `// Ported from openai/plugins plugin-eval (MIT). See ../THIRD_PARTY_NOTICES.md.`
- For rewrites: `// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../THIRD_PARTY_NOTICES.md.`
- For new files (Writer B's evaluators, Writer C's full-plugin fixture, etc.): no header required.

Use double-slash for `.js` files. For `.md` skills: do NOT add a comment — frontmatter parsing must remain clean. The skills have no OpenAI strings inside; the references explain the lineage.

### 7.8 Acceptance for Writer C

1. `node --test tests/**/*.test.js` exits 0 with all 60+ tests passing.
2. `tests/cc-plugin-eval.test.js` covers every error code listed in §6.2–6.9 at least once.
3. `cc-plugin-eval analyze` against the user's own `metacognitive-guard` plugin (run `node scripts/cc-plugin-eval.js analyze ../metacognitive-guard --format markdown`) produces a non-empty markdown report without crashing.
4. `grep -rE "Codex|codex|\\.codex-plugin|interface\\.[a-z]|defaultPrompt|composerIcon|brandColor" skills/ references/` returns 0 hits.
5. `THIRD_PARTY_NOTICES.md` exists at the plugin root.
6. The 5 SKILL.md files all parse with `parseFrontmatter` from `src/lib/frontmatter.js` without errors.
7. Each fixture in §7.2 contributes at least one test case in §7.3.

---

## 8. Cross-cutting conventions (ALL writers)

1. **ESM only.** Every `.js` file uses `import` / `export`. The `package.json` already declares `"type": "module"`.
2. **Node ≥20.** No syntax that requires newer (e.g., set-builders); the OpenAI source already targets 20.
3. **No external runtime deps.** The OpenAI `package.json` has zero `dependencies` and zero `devDependencies`. Maintain that. `node:test` is a built-in. Only `node:` imports plus relative imports.
4. **Findings schema (Writer B's evaluators):** `{severity: "info"|"warn"|"error", code: "CC###", message: string, location: {file: string, line?: number} | null, fix?: string}`. The `code` field is the SOLE machine-readable identifier. The `location.file` is plugin-root-relative POSIX path.
5. **Checks schema (Writer A's evaluators, ported from OpenAI):** `{id, category, severity, status, message, evidence[], remediation[], source, why?, targetPath?}`. The `id` field doubles as the error code — Writer A's evaluators emit `CC2xx` codes for skill rules, Writer B's via `findingToCheck` adapter emit `CC1xx/3xx/.../9xx`.
6. **Error code ranges (per §6 intro):** CC1xx manifest, CC2xx skill, CC3xx hooks, CC4xx mcp, CC5xx lsp, CC6xx monitors, CC7xx agents, CC8xx marketplace, CC9xx security/path-traversal. CC9xx is shared across all evaluators (any of them can emit `CC900` for path traversal, `CC910–CC917` for userConfig safety even though it's the userconfig evaluator that emits them). The 9xx range is "cross-cutting safety", not "userconfig"; the SPEC.md tables in §6.9 use CC910+ for userConfig because the user-instruction explicitly assigned CC900-999 to security. Treat CC910-919 as "userConfig safety", CC900-909 as "path traversal across all evaluators". Writers: pick the lowest available code in your range; if you need a new one mid-implementation, allocate from the unused tail of your range and update §6.
7. **All paths in output payloads are plugin-root-relative POSIX**, never absolute. Writer A's `relativePath(rootPath, filePath)` from `lib/files.js` does this. Writer B uses `path.relative(pluginRoot, filePath).split(path.sep).join("/")` (or just imports `relativePath` and calls it).
8. **Pluggable renderers stay format-agnostic.** Adding a new payload kind requires updating both `renderMarkdown(payload)` and `renderHtml(payload)` plus a small JSON-mode test (`renderPayload(payload, "json")` already round-trips anything serializable).
9. **No emoji in source, fixtures, tests, skills, or references.** The user's CLAUDE.md is explicit about this.
10. **Always-thinking is on for the writers' Claude sessions.** No need for "show your work" prompts in the spec; the writers will think through edge cases naturally.

---

## 9. Acceptance criteria (reviewer checklist)

The reviewer runs this list, in order, against the merged result.

### 9.1 Structural

- [ ] `plugins/cc-plugin-eval/.claude-plugin/plugin.json` exists, parses, and has `name: "cc-plugin-eval"`.
- [ ] `plugins/cc-plugin-eval/package.json` declares `"type": "module"`, `engines.node >= 20`, zero dependencies, the `cc-plugin-eval` bin, and all scripts from §3.
- [ ] Directory tree matches the original ASCII tree (`bin/`, `scripts/`, `src/{core,evaluators,lib,renderers}`, `skills/{cc-plugin-eval,evaluate-plugin,evaluate-skill,improve-skill,metric-pack-designer}`, `fixtures/`, `tests/`, `references/`).
- [ ] No file references `.codex-plugin`, `.plugin-eval` (without the `cc-` prefix), `interface.<key>`, `defaultPrompt`, `composerIcon`, `brandColor`, `developerName`, `category`, `capabilities`, `Codex`, or `codex` anywhere in `src/`, `skills/`, or `references/`. The strings may appear in `THIRD_PARTY_NOTICES.md` (intentional attribution).

### 9.2 Manifest validator coverage

- [ ] Every Claude-Code plugin manifest field listed in `claude-plugins-reference.md` §"Plugin manifest schema" has a corresponding validator finding code in §6.2 (`name`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, `$schema`, the path-fields). Missing required → CC101 (name only). Optional-but-missing → info-level. Path-shape violation → CC130. Path-not-found → CC131. Path-traversal → CC900.
- [ ] Hooks evaluator covers all 28 valid hook event names from §6.3 by recognizing them and rejecting variations. Test 6.3.CC302 hits an event name not in the set; test 6.3.CC303 hits a case-wrong variation.
- [ ] Agents evaluator rejects `hooks`, `mcpServers`, `permissionMode` (CC703).
- [ ] LSP evaluator requires `extensionToLanguage` (CC503) per ref.
- [ ] Monitors evaluator enforces unique `name` (CC603) per ref.

### 9.3 Test suite

- [ ] `node --test tests/**/*.test.js` exits 0.
- [ ] At least one test exists per error code defined in §6.
- [ ] `tests/cc-plugin-eval.test.js` includes the 21 categories from §7.3 with the case counts listed.

### 9.4 Smoke test against the user's own plugins

- [ ] `node scripts/cc-plugin-eval.js analyze ../metacognitive-guard --format markdown` produces a non-empty markdown report and exit code 0. Findings are expected (the user's plugin is real, not a fixture); the test is that the tool does not crash and returns structured output.
- [ ] `node scripts/cc-plugin-eval.js validate ../metacognitive-guard` produces a JSON payload with the `findings[]` array populated. Exit code 0 (`--strict` not passed).
- [ ] `node scripts/cc-plugin-eval.js inspect ../metacognitive-guard --component all --format markdown` lists findings grouped by component.

### 9.5 Renderers

- [ ] `renderPayload(payload, "json")`, `renderPayload(payload, "markdown")`, `renderPayload(payload, "html")` all succeed for every payload kind: `evaluation-result`, `inspect-result`, `workflow-guide`, `budget-explanation`, `measurement-plan`, `benchmark-template-init`, `benchmark-run`, `comparison`, `improvement-brief`. Test asserts each returns a non-empty string.

### 9.6 No regressions of OpenAI core behavior

- [ ] `analyzePath(fixtures/minimal-skill)` returns a `result.summary.score > 0` and `result.budgets.method === "estimated-static"`.
- [ ] `compareResults(before, after)` returns the same fields as the OpenAI version (per `references/evaluation-result-schema.md`).

### 9.7 License & attribution

- [ ] `THIRD_PARTY_NOTICES.md` exists with the wording from §7.6.
- [ ] Every ported file has the "Ported from" or "Derived from" header comment from §7.7.

---

## 10. License attribution requirements

### 10.1 Plugin-root file

- **Path:** `plugins/cc-plugin-eval/THIRD_PARTY_NOTICES.md`
- **Wording:** Exactly as specified in §7.6.
- **Owner:** Writer C.

### 10.2 Per-file headers

- **Verbatim ports** (`src/core/{compare,measurement-plan,observed-usage,scoring,benchmark-events}.js`, `src/lib/{files,frontmatter,tokens}.js`, `src/renderers/index.js`, `src/evaluators/{code,coverage,python,typescript}.js`, `src/index.js`):
  ```js
  // Ported from openai/plugins plugin-eval (MIT). See ../../THIRD_PARTY_NOTICES.md.
  ```
- **Derivatives** (every other ported file in `src/`, `scripts/cc-plugin-eval.js`, every `skills/*/SKILL.md` body **DOES NOT** include this — frontmatter would break):
  ```js
  // Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.
  ```
- **New files** (Writer B's evaluators, fixtures, tests new content, `references/component-validators.md`): no header required. Provenance is in the THIRD_PARTY_NOTICES.

### 10.3 Repository-level LICENSE

The user's repository already contains licensing per the user's other plugins. Writer C does NOT add a separate `LICENSE` file inside `plugins/cc-plugin-eval/` — the repo-level license covers the plugin. THIRD_PARTY_NOTICES.md handles the OpenAI attribution.

---

## 11. Glossary (for cross-writer alignment)

- **plugin root** — the directory containing `.claude-plugin/plugin.json`. e.g. `plugins/cc-plugin-eval/`.
- **target** — the path the user passed to the CLI; resolved by `src/core/target.js` to one of `skill | plugin | directory | file`.
- **fragment** — `{checks?, findings?, metrics, artifacts}` returned by an evaluator. Writer A's evaluators emit `checks`; Writer B's emit `findings`; `evaluatePlugin` (Writer A) merges them into a unified `result.checks`.
- **finding** — Writer-B-shaped result `{severity, code, message, location, fix?}`.
- **check** — Writer-A-shaped result `{id, category, severity, status, message, evidence[], remediation[], source}`.
- **payload** — the top-level object emitted by a CLI subcommand. Has a `kind` discriminator: `"evaluation-result"`, `"workflow-guide"`, `"budget-explanation"`, `"measurement-plan"`, `"comparison"`, `"benchmark-template-init"`, `"benchmark-run"`, `"inspect-result"` (new), `"improvement-brief"` (new top-level kind for the `improve` command).
- **CC code** — a `CC###` error code in the range CC100–CC999 namespaced per §8.6.
- **observed usage** — token telemetry from real Claude API responses ingested via `--observed-usage`. The parser is shape-agnostic (handles Responses-API and Anthropic-Messages-API shapes; both have `input_tokens`/`output_tokens`/`total_tokens`).

---

End of SPEC.md.
