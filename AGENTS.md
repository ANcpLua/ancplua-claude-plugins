# Agent Operating Guide - ancplua-claude-plugins

This repo is a local plugin marketplace. Keep Claude Code source artifacts and
Codex artifacts side by side unless the task explicitly asks to remove one.

## Canonical Surfaces

- `CLAUDE.md` remains the Claude Code operating guide.
- `AGENTS.md` is the Codex operating guide.
- `.claude-plugin/marketplace.json` is the Claude marketplace catalog.
- `.agents/plugins/marketplace.json` is the Codex marketplace catalog.
- `plugins/*/.claude-plugin/plugin.json` is the Claude plugin manifest.
- `plugins/*/.codex-plugin/plugin.json` is the Codex plugin manifest.
- `plugins/*/skills/*/SKILL.md` are bundled skill entrypoints.
- `.codex/agents/*.toml` contains repo-local Codex custom agents converted
  from plugin-local Claude agents.

Do not hand-edit generated reports. Re-run the owning migration or validation
command and edit the source that generated the report.

## Repository Hygiene

- Inspect `git status --short` before edits.
- Stay on `main` unless the task explicitly needs a branch.
- Do not use `git reset`.
- Do not hand-edit `automation/RUN-LOG.md`; it is auto-managed.
- Ignore `automation/` for ordinary plugin development unless the task names it.

## Codex Plugin Layout

Codex plugins in this repo use:

```text
plugins/<plugin>/
  .codex-plugin/plugin.json
  skills/
```

The repo marketplace file is:

```text
.agents/plugins/marketplace.json
```

Marketplace entries must keep `source.path` as `./plugins/<plugin>`, include
`policy.installation`, include `policy.authentication`, and include `category`.

## Migration Boundaries

- Codex plugin manifests can package skills and supported companion manifests.
- Current Codex plugin validation rejects Claude-only manifest fields and this
  repo does not package Claude hooks or Claude agents into Codex plugin
  manifests.
- Claude slash commands migrated for Codex are represented as bundled skills
  named `source-command-<command>`.
- Claude subagents migrated for Codex are represented as repo-local custom
  agents under `.codex/agents/` with plugin-prefixed names.
- Claude Teams API, `Task` tool, `SendMessage`, `TeamCreate`, `TeamDelete`,
  slash-command placeholders, and hook semantics are not Codex equivalents.
  Preserve those references as migration guidance unless the task explicitly
  asks for a semantic rewrite.

## Validation

Use the narrowest validation that covers the change:

```bash
python3 /Users/ancplua/.codex/skills/migrate-to-codex/scripts/migrate-to-codex.py --validate-target .
python3 /Users/ancplua/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/<plugin>
```

For repo-wide plugin manifest changes, validate every plugin:

```bash
for plugin in plugins/*; do
  [ -d "$plugin" ] || continue
  python3 /Users/ancplua/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py "$plugin"
done
```

For JavaScript tooling in `cc-plugin-eval`, run the plugin's own package
scripts from `plugins/cc-plugin-eval` when those files change.

## Code Quality

- Prefer the existing plugin structure over adding another packaging layer.
- Keep Codex migration artifacts explicit instead of hiding behavior behind
  compatibility wrappers.
- Tests must catch plausible future regressions. Do not add tests just to prove
  a known migration output.
- Fail loudly when validation cannot prove the migrated artifact works.
