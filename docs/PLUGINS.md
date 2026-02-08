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
   - `agents/*.md`
4. Update `.claude-plugin/marketplace.json` (or run `tooling/scripts/sync-marketplace.sh` when present).
5. Update `CHANGELOG.md` for any user-visible change.
6. Run `./tooling/scripts/weave-validate.sh`.

This is a **Type A** repository. Plugins orchestrate via Skills and consume MCP tools
from `ancplua-mcp` (Type T). Do NOT implement MCP servers here. Reference example
configs at `docs/examples/*.mcp.json` instead.
