# Benchmark Harness

The benchmark harness gives `cc-plugin-eval` a beginner-friendly path to measured usage.

## Goals

- help first-time plugin authors collect real `claude` usage without building their own harness
- keep the workflow local-first and transparent
- produce usage logs that can be fed back into `cc-plugin-eval analyze --observed-usage`

## Workflow

1. Run `cc-plugin-eval init-benchmark <path>`.
2. Edit the generated `.cc-plugin-eval/benchmark.json` so `workspace.sourcePath`, the scenarios, and any verifier commands match real tasks.
3. Run the benchmark with `cc-plugin-eval benchmark <path> --config <file>`.
4. Feed the usage log into `cc-plugin-eval analyze --observed-usage` when usage telemetry is available.

## Design Choices

- The generated benchmark file is meant to be edited by humans.
- Scenarios use plain-language fields such as `title`, `purpose`, `userInput`, and `successChecklist`.
- Benchmarking means real `claude` runs in an isolated workspace, not simulated single-turn API requests.
- Each benchmark run captures raw `claude` logs plus a normalized report under `.cc-plugin-eval/runs/<timestamp>/`.
- When token usage is emitted by `claude`, the benchmark also writes JSONL usage logs in a shape that `--observed-usage` already understands.
- There is no `--dry-run` mode. The harness always invokes `claude`. Tests use a fake-`claude` executable to keep the runner deterministic and offline.

## Commands

```bash
cc-plugin-eval init-benchmark ./skills/my-skill
cc-plugin-eval benchmark ./skills/my-skill
cc-plugin-eval analyze ./skills/my-skill --observed-usage ./skills/my-skill/.cc-plugin-eval/benchmark-usage.jsonl --format markdown
```

## Environment Variables

- `CC_PLUGIN_EVAL_CLAUDE_EXECUTABLE` overrides the `claude` binary path. Tests set this to a fake executable that returns canned usage events.
- `CC_PLUGIN_EVAL_CLAUDE_HOME_SOURCE` overrides the source directory used to seed the isolated `~/.claude` for the benchmark run.
