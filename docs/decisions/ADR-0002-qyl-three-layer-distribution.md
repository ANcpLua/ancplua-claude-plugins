---
status: accepted
contact: "Alexander Nachtmann"
date: "2026-04-03"
deciders: "Alexander Nachtmann"
consulted: "Sentry skills architecture, shadcn/ui distribution model"
informed: "Plugin consumers, qyl contributors"
---

# ADR-0002: Three-Layer Distribution for qyl

## Context and Problem Statement

qyl has 10 agents, 2 commands, hooks, and an MCP server with 100+ tools — but zero SKILL.md files. All architectural knowledge is locked inside Claude Code plugins and can't reach Cursor, Copilot, Codex, Gemini CLI, or any other AI agent.

qyl is not an observability dashboard — it is a compile-time OS for agent workflows. The Loom compiler, the seven-plane architecture, the MAF execution model, and the architectural invariants need to be accessible to any AI agent on any platform.

## Decision

Adopt a three-layer distribution model:

| Layer | What | Where |
|-------|------|-------|
| Skills | Governing authority: architecture, invariants, decision rules, evals | `plugins/qyl/skills/qyl-core/` (this repo) |
| Netagents | .NET agent packages, MAF integration | qyl repo (`src/`) |
| MCP Server | Live telemetry access, 100+ tools | `https://mcp.qyl.info/mcp` |

## The Skill's Role

The skill is the governing authority — the document that any AI agent on any platform reads to understand what qyl is, how it works, and what it must never violate. It encodes:

- The seven-plane architecture (data, serving, intelligence, agent/control, ledger/governance, UI/protocol, compiler)
- The Loom compiler pipeline (attributes → generator → descriptors → AIFunction)
- The MAF execution model (function/agent/workflow decision rule, AIFunctionFactoryOptions bridge)
- Architectural invariants (no reflection as control plane, no prompt-only orchestration, no fused execution/audit state)
- The design law (AI must not be in the telemetry hot path)

## Consequences

- qyl architectural knowledge becomes portable across AI agent platforms
- Any agent working on qyl inherits the invariants automatically
- Skills can be extracted to a standalone repo for `npx skills add qyl` distribution
- MCP server can declare `_meta["anthropic/maxResultSizeChars"]` for heavy payloads (v2.1.91+)
- Evals provide regression testing for skill accuracy
