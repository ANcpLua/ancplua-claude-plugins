# cc-plugin-eval

Local-first Claude Code plugin evaluator.

`cc-plugin-eval` is both:

- a local Node.js CLI (`cc-plugin-eval`)
- a Claude Code plugin bundle

It helps engineers evaluate a local Claude Code plugin or skill, understand why it scored that way, see what to fix first, validate every component file, explain token budgets, measure real usage, and decide what to do next without having to memorize a command sequence first.

## What This Plugin Contains

- `scripts/cc-plugin-eval.js`: the CLI entrypoint exposed as `cc-plugin-eval`
- `.claude-plugin/plugin.json`: the Claude Code plugin manifest
- `skills/`: the chat-facing skills (`cc-plugin-eval`, `evaluate-plugin`, `evaluate-skill`, `improve-skill`, `metric-pack-designer`)
- `src/`: the deterministic engine, evaluators, renderers, and lib helpers
- `fixtures/`: the test corpus (`minimal-plugin`, `multi-skill-plugin`, `full-plugin`, `broken-plugin`, `minimal-skill`, `coverage-samples`, `metric-pack`, `observed-usage`, `ts-python-sample`)
- `references/`: design docs, schemas, and the per-evaluator code table

The plugin is designed to feel chat-first in Claude Code, while still routing to explicit local commands you can run yourself.

## Differences vs OpenAI plugin-eval

cc-plugin-eval is forked from [`openai/plugins` `plugin-eval`](https://github.com/openai/plugins/tree/main/plugins/plugin-eval) (MIT). It targets Claude Code instead of OpenAI Codex. Specifically:

- Detects `.claude-plugin/plugin.json` instead of `.codex-plugin/plugin.json`.
- Drops Codex-specific manifest fields (`interface{}`, `defaultPrompt`, `composerIcon`, `brandColor`, `developerName`, `category`, `capabilities`).
- Adds eight Claude-native evaluators: `manifest`, `hooks`, `mcp`, `lsp`, `monitors`, `agents`, `marketplace`, `userconfig`.
- Adds new CLI subcommands: `validate`, `inspect`, `evaluate-skill`, `improve`.
- Uses `~/.claude/plugins/cache/` for the baseline corpus instead of `~/.codex/`.
- Uses `claude` (instead of `codex exec`) for benchmark runs.
- Hands off skill rewrites to the `skill-creator` skill (Anthropic's `skill-creator@claude-plugins-official`) instead of duplicating that workflow.

See `THIRD_PARTY_NOTICES.md` for full attribution and the per-file porting status.

## Source

Forked from `openai/plugins` (`plugins/plugin-eval`, MIT). See `THIRD_PARTY_NOTICES.md`.

## Quick Start

### Run Without Installing Globally

From the plugin root (`plugins/cc-plugin-eval` in this monorepo):

```bash
node ./scripts/cc-plugin-eval.js --help
```

You can use that form for every command in this README. Examples:

```bash
node ./scripts/cc-plugin-eval.js analyze ./skills/cc-plugin-eval --format markdown
node ./scripts/cc-plugin-eval.js analyze . --format markdown
node ./scripts/cc-plugin-eval.js validate ./fixtures/full-plugin --strict
```

### Install A Global `cc-plugin-eval` Command

From the plugin root (`plugins/cc-plugin-eval` in this monorepo):

```bash
npm link
```

After that, `cc-plugin-eval` should be available on your `PATH`:

```bash
cc-plugin-eval --help
cc-plugin-eval analyze ./skills/cc-plugin-eval --format markdown
```

If you prefer not to create a global link, keep using `node ./scripts/cc-plugin-eval.js ...` directly.

## CLI Reference

### Start From Chat

`start` is the chat-first router:

```bash
cc-plugin-eval start <path> --request "<chat request>" --format markdown
```

Examples:

```bash
cc-plugin-eval start ~/.claude/plugins/cache/example-plugin --request "Evaluate this plugin." --format markdown
cc-plugin-eval start ~/.claude/plugins/cache/example-plugin --request "Why did this score that way?" --format markdown
cc-plugin-eval start ~/.claude/plugins/cache/example-plugin --request "What should I fix first?" --format markdown
cc-plugin-eval start . --request "Validate the manifest." --format markdown
cc-plugin-eval start . --request "Inspect the hooks." --format markdown
cc-plugin-eval start . --request "Help me benchmark this plugin." --format markdown
```

`cc-plugin-eval start` keeps the workflow chat-first:

- it recognizes the beginner request
- it explains why that workflow fits
- it shows the first local command that will run
- it lists the full local sequence when there are multiple steps
- it highlights one recommended next step for skimming engineers

### Core Commands

```bash
cc-plugin-eval analyze <path> --format markdown
cc-plugin-eval explain-budget <path> --format markdown
cc-plugin-eval measurement-plan <path> --format markdown
cc-plugin-eval init-benchmark <path>
cc-plugin-eval benchmark <path> --format markdown
cc-plugin-eval report <result.json> --format markdown
cc-plugin-eval compare <before.json> <after.json> --format markdown
cc-plugin-eval improve <path> --brief-out ./skill-brief.json
```

### New Claude-Native Commands

```bash
cc-plugin-eval validate <path> --format markdown
cc-plugin-eval validate <path> --strict
cc-plugin-eval inspect <path> --component all --format markdown
cc-plugin-eval inspect <path> --component hooks --format markdown
cc-plugin-eval inspect <path> --component mcp --format markdown
cc-plugin-eval evaluate-skill <skill-path> --format markdown
```

### Reports

```bash
cc-plugin-eval report ./run.json --format markdown
cc-plugin-eval report ./run.json --format html --output ./run.html
cc-plugin-eval compare ./before.json ./after.json --format markdown
```

### Compatibility Aliases

- `cc-plugin-eval guide` -> `cc-plugin-eval start`
- `cc-plugin-eval recommend-measures` -> `cc-plugin-eval measurement-plan`

## Skills List

| Skill                      | Path                                              | When to use                                                                                       |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `cc-plugin-eval`           | `skills/cc-plugin-eval/SKILL.md`                  | Umbrella router for natural-language requests.                                                    |
| `evaluate-plugin`          | `skills/evaluate-plugin/SKILL.md`                 | Plugin-level audits and component lints.                                                          |
| `evaluate-skill`           | `skills/evaluate-skill/SKILL.md`                  | Skill-level static analysis. For LLM grading hand off to `skill-creator`.                         |
| `improve-skill`            | `skills/improve-skill/SKILL.md`                   | Produce a rewrite brief, then hand off to `skill-creator`.                                        |
| `metric-pack-designer`     | `skills/metric-pack-designer/SKILL.md`            | Author a custom rubric that emits schema-compatible findings.                                     |

## Fixtures

| Fixture                  | Purpose                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `minimal-plugin/`        | Smallest valid Claude plugin (manifest + one skill).                                          |
| `multi-skill-plugin/`    | Plugin with two skills, used by aggregate scoring tests.                                      |
| `full-plugin/`           | Exercises every Claude component (skills, agents, hooks, MCP, LSP, monitors, themes, etc.). Acceptance fixture for `validate --strict`. |
| `broken-plugin/`         | Deliberately broken plugin that triggers at least one finding from each Writer-B evaluator.   |
| `minimal-skill/`         | Smallest valid Claude skill.                                                                  |
| `coverage-samples/`      | `lcov.info`, `coverage.xml`, and `coverage-final.json` for the coverage evaluator.            |
| `metric-pack/`           | Local rubric harness. `node fixtures/metric-pack/emit-pack.js <path> <kind>` is the contract. |
| `observed-usage/`        | JSONL token telemetry for `--observed-usage`.                                                 |
| `ts-python-sample/`      | TypeScript and Python source for the language metric evaluators.                              |

## Token Budgeting

cc-plugin-eval scores three token buckets per target:

- `trigger_cost_tokens`: text loaded before invocation (names, descriptions, keywords).
- `invoke_cost_tokens`: instruction payloads loaded on invocation (SKILL.md body, plugin manifest fields).
- `deferred_cost_tokens`: supporting references, scripts, and assets pulled in later.

Static estimation labels the budget `estimated-static`. Run `cc-plugin-eval explain-budget <path>` to see which files contribute to each bucket. Add `--observed-usage <usage.jsonl>` to layer measured token counts on top.

See `references/observed-usage.md` for the supported telemetry shapes and `references/technical-design.md` for the budget model.

## Benchmarking

cc-plugin-eval benchmarks run real `claude` invocations in an isolated workspace. There is no `--dry-run`. Tests use a fake `claude` executable to keep the runner offline.

```bash
cc-plugin-eval init-benchmark <path>
cc-plugin-eval benchmark <path>
cc-plugin-eval analyze <path> --observed-usage <path>/.cc-plugin-eval/benchmark-usage.jsonl --format markdown
```

See `references/benchmark-harness.md` for the harness design.

## Recommended Workflow

1. Start with `cc-plugin-eval start <path> --request "<natural request>" --format markdown`.
2. Run `analyze` when you want the static local report.
3. Run `validate --strict` for a CI-friendly pass/fail.
4. Run `inspect --component <name>` when you need only one component's findings.
5. Run `init-benchmark`, review and edit the config, then run `benchmark` when you want a live `claude` benchmark.
6. Feed observed usage back into `analyze` or `measurement-plan`.

## Local-First Behavior

- `analyze`, `validate`, `inspect`, `explain-budget`, and `measurement-plan` are deterministic local workflows.
- `benchmark` runs real `claude` sessions in isolated temp workspaces; no network requests are made by the engine itself.
- Benchmark runs preserve rich artifacts under `.cc-plugin-eval/runs/` and write observed usage when telemetry is available.

## Safety And Execution Notes

- `analyze`, `validate`, `inspect`, `explain-budget`, and `measurement-plan` inspect local files and write local reports only.
- `init-benchmark` creates starter benchmark configuration under `.cc-plugin-eval/` for the target you choose.
- `benchmark` runs a live local `claude` workflow in an isolated temp workspace and writes artifacts under `.cc-plugin-eval/`.
- Review the generated benchmark configuration before running it, especially when the target plugin or prompts did not come from you.
- Keep generated `.cc-plugin-eval/` artifacts and local `node_modules/` directories out of commits unless you explicitly want to version them.

## How It Works As A Claude Code Plugin

This directory is also a Claude Code plugin bundle. The plugin manifest lives at [`.claude-plugin/plugin.json`](./.claude-plugin/plugin.json), and it exposes the skills under [`skills/`](./skills).

That means you can use it from Claude Code chat with natural prompts once the plugin is installed, for example:

- `Evaluate this plugin.`
- `Give me an analysis of this plugin.`
- `Why did this score that way?`
- `Validate the manifest.`
- `Inspect the hooks.`
- `Help me benchmark this plugin.`

The plugin side is responsible for the chat UX and routing. The CLI side is responsible for the local commands and reports.

## Manual Plugin Installation

This repository ships a marketplace entry for `cc-plugin-eval` in [`../../.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json). Install via the marketplace once it is registered with Claude Code:

```jsonc
{
  "name": "ancplua-claude-plugins",
  "owner": {"name": "AncpLua"},
  "metadata": {"description": "Local Claude Code plugins."},
  "plugins": [
    {
      "name": "cc-plugin-eval",
      "description": "Local-first Claude Code plugin evaluator.",
      "version": "0.2.0",
      "source": "./plugins/cc-plugin-eval"
    }
  ]
}
```

## Use Cases

Use `cc-plugin-eval` when you want to:

- evaluate a local skill directory or `SKILL.md`
- evaluate a local plugin root that contains `.claude-plugin/plugin.json`
- validate every component before commit (`cc-plugin-eval validate <path> --strict`)
- benchmark starter scenarios with real `claude` runs
- compare before/after results to measure improvement

## Contributing

- Run `npm test` (alias for `node --test tests/**/*.test.js`).
- Add new fixtures under `fixtures/` and reference them in `tests/cc-plugin-eval.test.js`.
- New evaluators must emit `findings` (not `checks`) and use a fresh code in their assigned `CC###` range; update `references/component-validators.md` whenever a new code is added.
- Do not add runtime dependencies. The plugin is zero-dep by design.

## License & Attribution

MIT, copyright (c) 2026 AncpLua. The repo-level `LICENSE` covers this plugin. See `THIRD_PARTY_NOTICES.md` for the upstream OpenAI MIT attribution and the per-file porting status.

## References

- [Chat-first workflows](./references/chat-first-workflows.md)
- [Technical design](./references/technical-design.md)
- [Evaluation result schema](./references/evaluation-result-schema.md)
- [Component validators (CC code table)](./references/component-validators.md)
- [Observed usage inputs](./references/observed-usage.md)
- [Metric pack manifest](./references/metric-pack-manifest.md)
- [Benchmark harness](./references/benchmark-harness.md)
