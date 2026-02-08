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

Plugins orchestrate behavior via Skills. No C# or .NET code belongs in this repository.
