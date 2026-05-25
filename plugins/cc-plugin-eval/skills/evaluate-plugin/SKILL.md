---
name: evaluate-plugin
description: 'Evaluate a local Claude Code plugin (a directory containing .claude-plugin/plugin.json). Use when the user says: "evaluate this plugin", "audit this plugin", "why did this plugin score that way", "what should I fix first in this plugin", "validate the manifest", "lint this plugin", "inspect the hooks", "inspect the mcp servers", or "help me benchmark this plugin".'
---
# Evaluate Plugin

Use this skill when the target is a plugin root with `.claude-plugin/plugin.json`. If the target is a single `SKILL.md` directory, hand off to `../evaluate-skill/SKILL.md` instead.

## When To Use

- The path passed by the user contains `.claude-plugin/plugin.json`.
- The user's question is about the bundle as a whole, not a single skill.
- The user says "audit", "validate", "lint", "inspect", or "benchmark this plugin".

If the path is a `SKILL.md` or a directory holding one, route to `../evaluate-skill/SKILL.md`. If the path contains neither, treat it as a generic directory and run `cc-plugin-eval analyze <path>` to surface the file-level signals.

## Workflow

1. Treat "Evaluate this plugin." as the default entrypoint.
2. If the request comes in as natural chat language, run `cc-plugin-eval start <plugin-root> --request "<user request>" --format markdown` first so the user sees the routed local path.
3. Run `cc-plugin-eval analyze <plugin-root> --format markdown`.
4. Read `Fix First` before drilling into manifest findings, hook findings, MCP/LSP findings, monitor/agent findings, marketplace findings, then nested skill findings.
5. If the plugin contains multiple skills, summarize the strongest and weakest ones explicitly.
6. If the user wants a CI-friendly pass/fail check, run `cc-plugin-eval validate <plugin-root> --strict`. Exit code 2 means at least one warn or fail finding fired.
7. If the user wants component-only output (only hooks, only mcp, etc.), run `cc-plugin-eval inspect <plugin-root> --component <name>`.
8. If the user wants measured usage, switch to "Help me benchmark this plugin." and use the starter benchmark flow.
9. If the user wants trend data, compare two JSON outputs with `cc-plugin-eval compare before.json after.json`.

## Plugin-Specific Priorities

- `.claude-plugin/plugin.json` validity: missing `name` (CC101), invalid `name` (CC102), invalid SemVer (CC103), env-var leak in metadata (CC110), files in `.claude-plugin/` other than `plugin.json` (CC120), path-shape violations (CC130), missing path on disk (CC131).
- Hooks: invalid event name (CC302), case-wrong event (CC303), invalid hook type (CC304), missing referenced script (CC305), `${CLAUDE_PLUGIN_ROOT}` not used and not a system bin (CC306), `mcp_tool` referencing an undeclared server (CC310).
- MCP servers: missing `command` (CC402), missing referenced script (CC403), relative `command` without `${CLAUDE_PLUGIN_ROOT}` (CC404), suspicious secret in `env` (CC409).
- LSP servers: missing `command` (CC502), missing `extensionToLanguage` (CC503), extension without leading dot (CC504), `restartOnCrash` without `maxRestarts` (CC508).
- Monitors: duplicate `name` (CC603), invalid `when` syntax (CC604), `on-skill-invoke:<name>` referencing missing skill (CC605), `${user_config.X}` for missing X (CC608).
- Agents: forbidden `hooks`/`mcpServers`/`permissionMode` in plugin-shipped agents (CC703), invalid `effort` (CC705), invalid `isolation` (CC707), tool/disallowedTools overlap (CC709).
- Marketplace alignment: plugin missing from `plugins[]` (CC803), version drift (CC804), source mismatch (CC805).
- userConfig: invalid identifier (CC910), missing required fields (CC911), suspicious secret name without `sensitive: true` (CC915), channel `server` not in `mcpServers` (CC916).
- Path traversal across all components (CC900).
- Skill aggregate quality: delegated to `../evaluate-skill/SKILL.md`.

## Chat Requests To Recognize

- `Evaluate this plugin.`
- `Audit this plugin.`
- `Why did this score that way?`
- `What should I fix first?`
- `Validate the manifest.`
- `Lint this plugin.`
- `Inspect the hooks.`
- `Inspect the mcp servers.`
- `Audit the components.`
- `Help me benchmark this plugin.`
- `What should I run next?`

## Commands

```bash
cc-plugin-eval start <plugin-root> --request "Evaluate this plugin." --format markdown
cc-plugin-eval analyze <plugin-root> --format markdown
cc-plugin-eval validate <plugin-root> --strict
cc-plugin-eval inspect <plugin-root> --component all --format markdown
cc-plugin-eval inspect <plugin-root> --component hooks --format markdown
cc-plugin-eval inspect <plugin-root> --component mcp --format markdown
cc-plugin-eval inspect <plugin-root> --component agents --format markdown
cc-plugin-eval start <plugin-root> --request "What should I run next?" --format markdown
cc-plugin-eval compare before.json after.json
cc-plugin-eval report result.json --format html --output ./cc-plugin-eval-report.html
cc-plugin-eval init-benchmark <plugin-root>
cc-plugin-eval benchmark <plugin-root>
```

## Reference

- `../../references/chat-first-workflows.md`
- `../../references/component-validators.md`
