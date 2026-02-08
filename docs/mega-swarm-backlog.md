# Mega-Swarm Backlog — P2/P3 Issues

> Generated 2026-02-08 by mega-swarm 4.6 accuracy audit (8 agents).
> P0/P1 issues were fixed in this session. These remain for follow-up.

---

## P2 Medium (18 issues)

### Hooks

| # | Issue | File |
|---|-------|------|
| 1 | `memory: user` on arch-reviewer but prompt has no memory instructions | `plugins/metacognitive-guard/agents/arch-reviewer.md` |
| 2 | `memory: user` on impl-reviewer but prompt has no memory instructions | `plugins/metacognitive-guard/agents/impl-reviewer.md` |

### Agents

| # | Issue | File |
|---|-------|------|
| 3 | Orphaned system prompt — no frontmatter, not discoverable by Claude Code | `agents/cleanup-specialist/prompts/system.md` |
| 4 | README describes phantom CLI interface and non-existent TypeScript source | `agents/repo-reviewer-agent/README.md` |

### Documentation

| # | Issue | File |
|---|-------|------|
| 5 | `docs/examples/` directory referenced in CLAUDE.md, ARCHITECTURE.md, PLUGINS.md — does not exist | CLAUDE.md lines 691-692, ARCHITECTURE.md lines 136-148 |
| 6 | Target architecture tree places `dependabot.yml` under `workflows/` — should be `.github/dependabot.yml` | CLAUDE.md line 125 |
| 7 | docs/AGENTS.md shows `tests/` in standalone agent structure but no agent has tests | docs/AGENTS.md line 39 |
| 8 | SKILL.md format claims `name` and `description` are "Required" citing official docs — they are actually optional per 4.6 spec | CLAUDE.md lines 566-577 |
| 9 | CLAUDE.md/ARCHITECTURE.md overstate plugin.json required fields (only `name` required by platform, rest are project conventions) | CLAUDE.md lines 548-553, ARCHITECTURE.md lines 117-126 |
| 10 | docs/ARCHITECTURE.md shows `skills/` as root-level directory — does not exist | ARCHITECTURE.md line 60 |

### Plugin Structure

| # | Issue | File |
|---|-------|------|
| 11 | Description drift between marketplace.json and plugin.json (5 of 11 plugins have different descriptions) | marketplace.json vs respective plugin.json |
| 12 | Inconsistent manifest completeness — 7 plugins declare components, 4 don't | All plugin.json files |
| 13 | hookify has committed `__pycache__` bytecode (tracked before .gitignore) | `plugins/hookify/hookify/core/__pycache__/rule_engine.cpython-314.pyc` |
| 14 | feature-dev author attribution — only Anthropic-authored plugin, no forking documentation | `plugins/feature-dev/.claude-plugin/plugin.json` |
| 15 | workflow-tools deprecated commands (turbo-fix, fix-pipeline) lack deprecation metadata in frontmatter | `plugins/workflow-tools/commands/turbo-fix.md`, `fix-pipeline.md` |

### Scripts

| # | Issue | File |
|---|-------|------|
| 16 | 4 scripts use `#!/bin/bash` instead of `#!/usr/bin/env bash` (codebase convention) | verify-local.sh, wait-for-ci.sh, lint-dotnet.sh, project-routing.sh |
| 17 | 3 scripts use `set -e` instead of `set -euo pipefail` | verify-local.sh, wait-for-ci.sh, lint-dotnet.sh |
| 18 | `verify-local.sh` line 70: `command -v python -m pytest` incorrect — only checks if `python` exists | verify-local.sh |

### Rules/Memory

| # | Issue | File |
|---|-------|------|
| — | MEMORY.md `TeamCreate` tool name — works but not in public docs, fragile if renamed | MEMORY.md |

---

## P3 Low (14 issues)

### Hooks

| # | Issue | File |
|---|-------|------|
| 1 | Plugin template `$schema` references unverifiable URL | `tooling/templates/plugin-template/hooks/hooks.json` |
| 2 | Plugin template `hooks` is array `[]` instead of object `{}` | Same file |

### Skills

| # | Issue | File |
|---|-------|------|
| 3 | otel-expert uses Grep pseudo-syntax in bash code blocks (misleading lang tag) | `plugins/otelwiki/skills/otel-expert/SKILL.md` |
| 4 | metacognitive-guard skill uses pseudo-YAML `Task tool:` block | `plugins/metacognitive-guard/skills/metacognitive-guard/SKILL.md` |
| 5 | 3 skills reference `references/` directory — verify these exist | autonomous-ci, code-review, writing-rules SKILL.md |
| 6 | All 9 exodia skills use `<CRITICAL_EXECUTION_REQUIREMENT>` XML tags (harmless but non-standard) | All exodia skills |
| 7 | dotnet-architecture-lint `name: lint-dotnet` differs from directory name — intentional short alias but discoverability gap | `plugins/dotnet-architecture-lint/skills/dotnet-architecture-lint/SKILL.md` |

### Agents

| # | Issue | File |
|---|-------|------|
| 8 | deep-think-partner description is 28 lines with XML examples — wastes session context | `plugins/metacognitive-guard/agents/deep-think-partner.md` |
| 9 | otel-guide verbose description field | `plugins/otelwiki/agents/otel-guide.md` |
| 10 | conversation-analyzer uses JSON array tools syntax `["Read", "Grep"]` vs codebase convention | `plugins/hookify/agents/conversation-analyzer.md` |
| 11 | Top-level `agents/` directory is not a recognized Claude Code agent location | `agents/` |
| 12 | cleanup-specialist deprecated but directory still exists (dead code) | `agents/cleanup-specialist/` |

### Scripts

| # | Issue | File |
|---|-------|------|
| 13 | `smart-id.sh` random part may occasionally be <20 chars (read more urandom bytes) | `plugins/exodia/scripts/smart/smart-id.sh` |
| 14 | `epistemic-guard.sh` regex JSON fallback fragile without jq (handles escaped quotes poorly) | `plugins/metacognitive-guard/hooks/scripts/epistemic-guard.sh` |

### Rules

| # | Issue | File |
|---|-------|------|
| — | thought-transparency.md "Steps execute sequentially" contradicts LAW 3 parallel lanes (needs qualifier) | `.claude/rules/thought-transparency.md` |

---

## Architectural Observations (Not Issues, For Consideration)

1. **exodia + workflow-tools SSOT violation**: Both implement the same 8 orchestration workflows. Exodia as skills (unlimited agents), workflow-tools as commands (4/8 agent limits). workflow-tools CLAUDE.md already acknowledges exodia is superior. Consider deprecating workflow-tools.

2. **otelwiki session-prompt.sh** uses quoted heredoc `'EOF'` preventing `${CLAUDE_PLUGIN_ROOT}` expansion — Claude may take the path literally.

3. **check-freshness.sh** outputs plain text instead of structured JSON (inconsistent with other SessionStart hooks).

---

*Run `/fix-pipeline` on individual items or `/batch-implement` for groups.*
