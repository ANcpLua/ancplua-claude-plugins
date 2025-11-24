Plugin Template

This is a starter template for a Claude Code plugin inside this monorepo.

Structure:

- .claude-plugin/plugin.json
- skills/
- commands/
- hooks/

How to use:

1. Copy this directory to plugins/your-plugin-name
2. Edit .claude-plugin/plugin.json (name, version, description, author,
   repository, license)
3. Add skills, commands, and hooks as needed
4. Add the plugin entry to the root .claude-plugin/marketplace.json
