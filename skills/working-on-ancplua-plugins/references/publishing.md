# Publishing & Creating Plugins

## 1. Create Plugin Structure

```bash
# Create directories
mkdir -p plugins/<plugin-name>/.claude-plugin
mkdir -p plugins/<plugin-name>/{skills,commands,hooks,scripts}
```

## 2. Create Manifests

### `plugins/<plugin-name>/.claude-plugin/plugin.json`
**Rule:** relative paths must start with `./`

```json
{
  "name": "<plugin-name>",
  "description": "Description of what the plugin does.",
  "version": "0.1.0",
  "author": {
    "name": "AncpLua",
    "url": "https://github.com/ANcpLua"
  },
  "repository": "https://github.com/ANcpLua/ancplua-claude-plugins",
  "license": "MIT"
  // Add "mcpServers" or "hooks" here if needed
}
```

### `.claude-plugin/marketplace.json` (Repo Root)
This registers the plugin in the monorepo marketplace.

```json
{
  "name": "<plugin-name>",
  "source": "./plugins/<plugin-name>",
  "description": "Short description.",
  "version": "0.1.0"
}
```

## 3. Documentation & Release

1.  **README.md**: Add `plugins/<plugin-name>/README.md` explaining usage.
2.  **CHANGELOG.md**: Add entry under `[Unreleased]`.
3.  **Validate**: Run `./tooling/scripts/local-validate.sh`.

## Versioning & Release Checklist

1.  **Consistency**: Ensure `version` in `plugin.json` matches `marketplace.json`.
2.  **Changelog**: Document all changes.
3.  **Validation**: `local-validate.sh` must pass.
4.  **Restart**: **ALWAYS** restart Claude Code after installing/updating a plugin to load changes.

## Common Pitfalls

| Mistake | Solution |
| :--- | :--- |
| **Invalid JSON** | Run `jq . path/to/file.json` to verify syntax. |
| **Hardcoded Paths** | Use `${CLAUDE_PLUGIN_ROOT}` in hooks/MCP configs. |
| **Missing Permissions** | Run `chmod +x scripts/*.sh`. |
| **Changes Not Visible** | Restart Claude Code. |
