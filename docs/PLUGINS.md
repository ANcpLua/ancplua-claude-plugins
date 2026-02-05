# Plugins

## Creating a new plugin

1. Create `plugins/<plugin-name>/`.
2. Add `.claude-plugin/plugin.json` with at least `name`, `version`, `description`, `author`, `repository`, and
   `license`.
3. Optionally add:
   - `skills/<skill-name>/SKILL.md`
   - `commands/*.md`
   - `hooks/hooks.json`
   - `scripts/*.sh`
   - `lib/` sources
   - `.mcp.json` plus MCP server code (for example, under `mcp/` or `lib/`) when the plugin uses MCP.
4. Update `.claude-plugin/marketplace.json` (or run `tooling/scripts/sync-marketplace.sh` when present).
5. Update `CHANGELOG.md` for any user-visible change.
6. Run `./tooling/scripts/weave-validate.sh`.

### Example: plugin with MCP server

```text
plugins/example-mcp-plugin/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── mcp/
│   └── server.ts
├── skills/
│   └── example-mcp/
│       └── SKILL.md
└── README.md
```

`.mcp.json` declares the MCP server and tools. `mcp/server.ts` implements the server following the Model Context
Protocol. The Skill under `skills/example-mcp/SKILL.md` can call MCP tools as part of its workflow.
