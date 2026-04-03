# qyl-lsp

LSP code intelligence surface for qyl. Encodes where to put it, what to build, and how to wire it.

## What this plugin does

1. **SessionStart hook** detects if `src/qyl.mcp/Tools/Lsp/` is missing in the qyl repo
2. If missing, injects passive context so Claude knows LSP integration is available
3. **Skill** (`qyl-lsp`) contains the full implementation guide with references

## Architecture rule

LSP tools go in `qyl.mcp` (serving plane), NOT `qyl.collector` (data plane).
They are deterministic function tools, not agents. Loom workflows call them.

## Skill references

| Reference | What it encodes |
|-----------|----------------|
| `placement.md` | Where in qyl's planes, which project, why not collector |
| `tools.md` | 6 tool definitions with signatures and behavior |
| `runtime-stack.md` | 12 runtime files: process, transport, client, cleanup |
| `registration.md` | DI wiring, skill bucket, Program.cs and SkillRegistrationExtensions |
| `servers.md` | Server definitions, language mappings, csharp-ls and typescript-language-server |
| `loom-bridge.md` | Phase 2: Loom tool attributes, factory bridge, pattern parallels |
