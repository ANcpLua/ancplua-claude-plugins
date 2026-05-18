---
name: evaluate-plugin
description: This skill should be used when the user asks to "evaluate this plugin", "audit this plugin", "explain why this plugin scored that way", "fix what's most important first in this plugin", "validate the manifest", "lint this plugin", "inspect the hooks", "inspect the mcp servers", or "help me benchmark this plugin". Targets a plugin root directory containing .claude-plugin/plugin.json — for single SKILL.md targets, hand off to evaluate-skill instead.
version: 0.1.0
author: AncpLua
---

# Evaluate Plugin

Targets a plugin root with `.claude-plugin/plugin.json`. Single-`SKILL.md` targets hand off to `../evaluate-skill/SKILL.md`; paths with neither fall back to `cc-plugin-eval analyze <path>` for generic file-level signals.

## Workflow

1. Default entrypoint: "Evaluate this plugin." Natural-chat requests go through `cc-plugin-eval start <plugin-root> --request "<user request>"` so the routed path is visible.
2. Run `cc-plugin-eval analyze <plugin-root> --format markdown`. Read `Fix First` before drilling into manifest → hooks → MCP/LSP → monitor/agent → marketplace → nested-skill findings.
3. For CI pass/fail: `cc-plugin-eval validate <plugin-root> --strict` (exit code 2 = at least one warn or fail).
4. For component-only views: `cc-plugin-eval inspect <plugin-root> --component <name>`.
5. For measured usage: switch to "Help me benchmark this plugin." For trend data: `cc-plugin-eval compare before.json after.json`.

## Plugin-Specific Priorities

The full CCxxx catalog with severity, summary, and fix lives in `../../references/component-validators.md`. Component groups:

- `CC1xx` — `.claude-plugin/plugin.json` manifest (name shape, SemVer, env-var leaks, path shapes).
- `CC3xx` — Hooks (event names, script refs, `${CLAUDE_PLUGIN_ROOT}` discipline).
- `CC4xx` — MCP servers (command, refs, env secrets).
- `CC5xx` — LSP servers (command, extension config, restart policy).
- `CC6xx` — Monitors (`when` syntax, skill refs, `${user_config.X}` resolution).
- `CC7xx` — Agents (forbidden plugin-agent keys, effort/isolation/tool overlap).
- `CC8xx` — Marketplace alignment (presence, version drift, source mismatch).
- `CC900` — Cross-cutting path traversal. `CC910+` — userConfig safety.
- Skill aggregate quality: delegated to `../evaluate-skill/SKILL.md`.

Look up any code with `cc-plugin-eval inspect <plugin-root> --component <name>`.

## Subcommands

`start --request "<phrase>"` · `analyze` · `validate --strict` · `inspect --component <name>` · `compare before.json after.json` · `report --format html` · `init-benchmark` · `benchmark`. Every subcommand accepts `--format markdown|html|json` and `--output <path>`. Matching `npm run <name>` scripts live in `package.json`.

## References

- `../../references/chat-first-workflows.md`
- `../../references/component-validators.md`
