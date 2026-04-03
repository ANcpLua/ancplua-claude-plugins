
## Context

You are working in `ancplua-claude-plugins` — a Claude Code plugin marketplace with 14 plugins.
The `qyl` plugin provides AI observability (traces, metrics, GenAI cost tracking) for .NET agent workflows.

## Problem

qyl has 10 agents, 2 commands, hooks — but **zero SKILL.md files**. Every other plugin in the marketplace has skills. This means qyl's knowledge is locked inside Claude Code plugins and can't reach Cursor, Copilot, Codex, Gemini CLI, or any other AI agent.

Sentry solved this with three layers:
1. **Skills** (`npx skills add sentry-for-ai`) — baked knowledge: patterns, setup guides, triage workflows
2. **dotagents** (`npx @sentry/dotagents`) — package manager for `.agents/` directories with lockfiles
3. **MCP Server** — live authenticated access to Sentry issues, releases, Seer analysis

qyl already has layers 2 and 3:
- **Layer 2**: netagents exists in the Microsoft Agent Framework (MAF) codebase
- **Layer 3**: qyl MCP server exists with 100+ tools (traces, errors, sessions, metrics, triage, fixes)

**Layer 1 (Skills) is missing.** Build it.

## Target Format

The `skills` CLI (`npx skills add`) expects this structure (reverse-engineered from shadcn/ui):

```
~/.agents/skills/<name>/
├── SKILL.md              # Main skill — YAML frontmatter + markdown body
├── agents/               # Agent-specific adapters
│   └── openai.yml        # Non-Claude agent metadata
├── assets/               # Icons
├── evals/                # Evaluation tests (JSON)
│   └── evals.json
├── *.md                  # Supporting docs (linked from SKILL.md)
└── rules/                # Detailed rule files (linked from SKILL.md)
```

SKILL.md frontmatter:
```yaml
---
name: qyl
description: <max 1024 chars>
user-invocable: false
allowed-tools: Bash(dotnet *), Bash(npm *), Bash(npx *)
---
```

## What to Build

### Deliverable 1: `plugins/qyl/skills/qyl-core/SKILL.md`

The main distributable skill. Two audiences in one package (like Sentry's approach):

**For consumers** (devs instrumenting their apps with qyl):
- What qyl is and what it replaces (Aspire Dashboard + Sentry, but for agent architecture)
- How to instrument a .NET app: NuGet packages, source generator setup, collector connection
- OTel GenAI semantic conventions (semconv 1.40): `gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.*`, `gen_ai.agent.*`, `gen_ai.tool.*`
- Dashboard setup: React 19, Vite 7, Tailwind CSS 4, Base UI 1.3.0
- REST API endpoints for querying traces, logs, metrics

**For contributors** (devs building qyl itself):
- Architecture boundaries: collector owns DuckDB, loom/MCP read via HTTP only, contracts are BCL-only
- 8 real projects in `src/` (collector, contracts, instrumentation, generators x2, loom, mcp, dashboard)
- MAF patterns: `AddAIAgent()` for hosted, `AsAIAgent()` for standalone, `MapAGUI()` for web, `WithOpenTelemetry()` for spans
- Banned patterns: no suppressions, no Radix/shadcn (Base UI only), no runtime reflection, no blocking async

### Deliverable 2: Supporting Rule Files

Create `plugins/qyl/skills/qyl-core/rules/`:
- `banned-patterns.md` — things agents must never do (extracted from qyl CLAUDE.md banned patterns section)
- `architecture.md` — project boundaries, data flow, ownership rules
- `maf.md` — Microsoft Agent Framework RC patterns (the two API patterns, dead API list, key types)
- `frontend.md` — React 19 + Base UI + Tailwind CSS 4 + ECharts 6 rules

Create `plugins/qyl/skills/qyl-core/`:
- `semconv.md` — OTel GenAI semantic conventions reference
- `mcp.md` — qyl MCP server setup and 100+ tool reference
- `setup.md` — instrumentation quick-start

### Deliverable 3: Evals

Create `plugins/qyl/skills/qyl-core/evals/evals.json` with test prompts:
1. "Add qyl observability to my .NET console app" — expects correct NuGet packages, source generator, collector URL
2. "Create a dashboard chart showing token usage over time" — expects ECharts 6, Base UI (not shadcn), TanStack Query
3. "Fix this agent that's not emitting traces" — expects `WithOpenTelemetry(sourceName: "qyl")`, correct ActivitySource
4. "Add a new DuckDB table for storing agent sessions" — expects generator pattern, not hand-written SQL

### Deliverable 4: Agent Adapter

Create `plugins/qyl/skills/qyl-core/agents/openai.yml`:
```yaml
interface:
  display_name: "qyl"
  short_description: "AI observability — traces, metrics, GenAI cost tracking for agent workflows."
```

### Deliverable 5: Update plugin.json

Add `"skills"` field to `plugins/qyl/.claude-plugin/plugin.json` pointing to the new skills.

### Deliverable 6: ADR-0002

Write `docs/decisions/ADR-0002-qyl-three-layer-distribution.md` documenting:
- Context: qyl knowledge locked in Claude Code plugins
- Decision: adopt Sentry's three-layer model (skills + netagents + MCP)
- Layers: what each provides, where each lives
- Content split: consumer knowledge vs contributor knowledge in one package
- Future: extract to standalone repo for `npx skills add qyl`

### Deliverable 7: CHANGELOG.md

Add under `## [Unreleased]` → `### Added`:
```
- **`qyl` skills package (1.1.0)**: Three-layer distribution model (Sentry-inspired). Core skill with consumer setup guides + contributor architecture rules. Distributable via `npx skills add` format. Supporting rules (banned-patterns, architecture, maf, frontend), semconv reference, MCP docs, instrumentation quick-start. Evals for 4 key scenarios. ADR-0002 documents the three-layer decision.
```

### Deliverable 8: Version Bump

Bump `plugins/qyl/.claude-plugin/plugin.json` version from `1.0.0` to `1.1.0`.
Sync the version in `.claude-plugin/marketplace.json`.

## Content Sources

All content already exists — extract and restructure, don't invent:

| Content | Source |
|---------|--------|
| Architecture, banned patterns, project map | `plugins/qyl/CLAUDE.md` |
| MAF patterns (AddAIAgent, AsAIAgent, MapAGUI) | `plugins/qyl/CLAUDE.md` → "MAF Usage Guide" section |
| OTel semconv | `plugins/otelwiki/skills/otel-expert/SKILL.md` + qyl genai-architect agent |
| MCP tools | The 100+ `mcp__plugin_qyl_qyl__*` tools (list them from deferred tools) |
| Dashboard patterns | qyl dashboard agent (`plugins/qyl/agents/dashboard.md`) |
| Instrumentation setup | qyl collector agent (`plugins/qyl/agents/collector.md`) |

## Constraints

- This repo is plugins-only: NO C# code, NO .NET projects
- Always update CHANGELOG.md under `[Unreleased]`
- Version bump plugin.json AND sync marketplace.json (weave-validate.sh checks)
- SKILL.md requires YAML frontmatter with `name` (kebab-case, max 64) and `description` (max 1024)
- Branch + PR, never push to main directly
- Run `./tooling/scripts/weave-validate.sh` before claiming done

## Validation

After building:
1. `./tooling/scripts/weave-validate.sh` — must pass
2. `claude plugin validate .` — must pass
3. Verify plugin.json version matches marketplace.json version
4. Verify SKILL.md frontmatter is valid YAML
5. Verify all `rules/*.md` files referenced from SKILL.md actually exist
