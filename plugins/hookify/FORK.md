# Hookify Fork Audit

`plugins/hookify/` is a fork of Anthropic's official hookify plugin.
This document is the line between *upstream* and *fork*. For a live
byte-level diff, run `scripts/fork-diff` from the repo root.

## Upstream baseline

| Field | Value |
|---|---|
| Source | <https://github.com/anthropics/claude-plugins-official> |
| Path | `plugins/hookify/` |
| Branch | `upstream/main` |
| Audit cut | `1b527e2` (tip of `upstream/main` when this file was last updated) |

Set up the remote once:

```bash
git remote add upstream https://github.com/anthropics/claude-plugins-official.git
git fetch upstream main
```

## Flagship additions

These are the user-visible capabilities this fork ships beyond upstream:

1. **`execute` action** — alongside `warn` and `block`, a matched rule can
   now fire a shell command (e.g. auto-format on save). Implemented in
   `hookify/core/rule_engine.py` (the `elif rule.action == 'execute':`
   branch).

2. **`StopFailure` event** — fires when a turn ends due to an API error
   (rate limit, auth failure, etc.). Requires Claude Code 2.1.78+.
   Wired through `hooks/hooks.json` and `bin/hookify-stopfailure`, with
   `examples/api-failure-alert.local.md` as a starter.

3. **Global rules** — `~/.claude/global-rules/hookify.*.local.md` applies
   to every repo. Project rules in `.claude/` override globals by name.
   Loader lives in `hookify/core/config_loader.py`; override the path
   with `CLAUDE_HOOKIFY_GLOBAL_RULES_DIR`.

## Full ledger vs upstream

### Added (11)

| Path | Purpose |
|---|---|
| `bin/hookify-pretooluse`        | Wrapper executable for PreToolUse |
| `bin/hookify-posttooluse`       | Wrapper executable for PostToolUse |
| `bin/hookify-stop`              | Wrapper executable for Stop |
| `bin/hookify-userpromptsubmit`  | Wrapper executable for UserPromptSubmit |
| `bin/hookify-stopfailure`       | Wrapper executable for StopFailure (new event) |
| `hookify/core/hook_runner.py`   | Shared dispatcher used by every `bin/` wrapper |
| `global-rules/hookify.mtp-smart-test.local.md` | Sample global rule (MTP smart-test filtering) |
| `examples/api-failure-alert.local.md`  | Example StopFailure rule |
| `examples/format-cs.local.md`          | Example `execute` rule — `dotnet format` |
| `examples/format-prettier.local.md`    | Example `execute` rule — Prettier |
| `examples/format-python.local.md`      | Example `execute` rule — Ruff format |
| `skills/writing-rules/references/patterns-and-examples.md` | Reference doc extracted from a slimmer SKILL.md |

### Removed (7)

| Path | Reason |
|---|---|
| `LICENSE` | Covered by repo-root `LICENSE`; removing the plugin-local copy avoids two LICENSE files drifting apart. `plugin.json` declares `MIT` to match the repo root. |
| `hooks/pretooluse.py`        | Replaced by `bin/hookify-pretooluse`        + `hookify/core/hook_runner.py` |
| `hooks/posttooluse.py`       | Replaced by `bin/hookify-posttooluse`       + `hookify/core/hook_runner.py` |
| `hooks/stop.py`              | Replaced by `bin/hookify-stop`              + `hookify/core/hook_runner.py` |
| `hooks/userpromptsubmit.py`  | Replaced by `bin/hookify-userpromptsubmit`  + `hookify/core/hook_runner.py` |
| `matchers/__init__.py` | Empty package; no implementation upstream |
| `utils/__init__.py`    | Empty package; no implementation upstream |

### Renamed (4) — package restructure: `core/` → `hookify/core/`

| Old | New | Similarity |
|---|---|---|
| `core/__init__.py`         | `hookify/__init__.py`            | 100% |
| `hooks/__init__.py`        | `hookify/core/__init__.py`       | 100% |
| `core/config_loader.py`    | `hookify/core/config_loader.py`  | 82%  |
| `core/rule_engine.py`      | `hookify/core/rule_engine.py`    | 62%  |

The non-100% similarity scores are where the flagship features live:
`config_loader.py` gained global-rules loading; `rule_engine.py` gained
the `execute` action.

### Modified (11)

| Path | What changed |
|---|---|
| `.claude-plugin/plugin.json`    | Added version, repository, license, keywords; description mentions execute + global-rules |
| `README.md`                     | Fork note + Global Rules section |
| `hooks/hooks.json`              | Routes via `bin/` wrappers; adds `matcher`, `statusMessage`, `async`; adds `StopFailure` event |
| `agents/conversation-analyzer.md` | Minor edits |
| `commands/{configure,help,hookify,list}.md` | Minor edits |
| `examples/{console-log-warning,dangerous-rm,require-tests-stop,sensitive-files-warning}.local.md` | Minor edits |
| `skills/writing-rules/SKILL.md` | Trimmed; bulk content moved to `references/patterns-and-examples.md` |

## How to verify

```bash
scripts/fork-diff                # full diff against upstream/main
scripts/fork-diff --stat         # one-line-per-file summary
scripts/fork-diff --name-status  # the ledger above, regenerated
scripts/fork-diff -- examples/   # restrict to a subpath
```

## Updating the baseline

Upstream changes over time. When it does:

```bash
git fetch upstream main
scripts/fork-diff --name-status
```

Reconcile this file by moving entries between **Added / Removed /
Modified / Renamed** as the upstream baseline shifts. The audit-cut
commit at the top of this file should be bumped to the new
`git rev-parse upstream/main`.
