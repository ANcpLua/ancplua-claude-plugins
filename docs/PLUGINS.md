# Plugins

## Creating a new plugin

1. Create `plugins/<plugin-name>/`.
2. Add `.claude-plugin/plugin.json` with at least `name`, `version`, `description`, `author`.
3. Optionally declare capabilities in `plugin.json`:

   ```json
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "description": "...",
     "author": "...",
     "skills": ["skills/my-skill"],
     "commands": ["commands/my-command.md"],
     "agents": ["agents/my-agent.md"],
     "hooks": "hooks/hooks.json"
   }
   ```

   > **Note:** `hooks/hooks.json` is loaded by Claude Code when declared in `plugin.json`.
4. Optionally add:
   - `skills/<skill-name>/SKILL.md`
   - `commands/*.md`
   - `hooks/hooks.json`
   - `scripts/*.sh`
   - `agents/*.md`
5. Update `.claude-plugin/marketplace.json` (or run `tooling/scripts/sync-marketplace.sh` when present).
6. Update `CHANGELOG.md` for any user-visible change.
7. Run `./tooling/scripts/weave-validate.sh`.

Plugins orchestrate behavior via Skills. No C# or .NET code belongs in this repository.

See `docs/ARCHITECTURE.md` Section 3 for the full plugin structure reference.
