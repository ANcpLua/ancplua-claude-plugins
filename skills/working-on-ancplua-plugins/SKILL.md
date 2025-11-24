# Skill: working-on-ancplua-plugins

Purpose: Provide conventions and quick references when working inside the ancplua-claude-plugins monorepo.

What this Skill provides:

- Repository layout overview
- Links to conventions, testing, and publishing guides
- Quick commands to validate plugins locally

## Repository layout

See docs/ARCHITECTURE.md for the canonical overview. At a glance:

- .claude-plugin/marketplace.json – declares all plugins in this repo
- plugins/ – individual Claude Code plugins (each has .claude-plugin/plugin.json)
- skills/ – repo-level skills (this Skill lives here)
- tooling/ – scripts and templates
- docs/ – architecture, ADRs, and specs
- .github/workflows – CI and bots

## Conventions and guides

- Conventions: skills/working-on-ancplua-plugins/references/conventions.md
- Testing: skills/working-on-ancplua-plugins/references/testing.md
- Publishing: skills/working-on-ancplua-plugins/references/publishing.md

## Useful commands

Local plugin validation (from repo root):

```bash
claude plugin validate .
```

Local checks (Markdown, Shell, Workflows):

```bash
./tooling/scripts/local-validate.sh
```
