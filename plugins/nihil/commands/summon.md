---
description: Install Nihil's dynamic workflows into this project's .claude/workflows so they run as /nihil, /nihil-maat, /nihil-odin, /nihil-shiva, /nihil-athena
disable-model-invocation: true
allowed-tools: Bash, Read
---

Install the Nihil pantheon's dynamic-workflow scripts so they register as `/<name>` commands.

Plugins cannot register dynamic workflows directly — there is no `workflows/` plugin component — so this command copies the bundled scripts into the one location Claude Code actually loads workflows from: `.claude/workflows/`.

## Procedure

Copy the five workflow scripts into the project, creating the directory if needed:

```bash
mkdir -p "$CLAUDE_PROJECT_DIR/.claude/workflows"
cp -v "${CLAUDE_PLUGIN_ROOT}/workflows/"*.js "${CLAUDE_PLUGIN_ROOT}/workflows/jsconfig.json" "$CLAUDE_PROJECT_DIR/.claude/workflows/"
```

Then tell the user the pantheon is installed and available as `/nihil`, `/nihil-maat`, `/nihil-odin`, `/nihil-shiva`, and `/nihil-athena`. New workflow commands may require restarting the session to appear in `/` autocomplete.

## Notes

- This installs into the **project**. To make the workflows available in every project instead, copy into `~/.claude/workflows/`.
- The scripts are read-only by default. Only `/nihil-shiva` writes, and only when invoked with `args.execute=true` (private removals only); `/nihil`, `/nihil-maat`, `/nihil-odin`, and `/nihil-athena` never write. Public breaks and rewrites always require explicit human sign-off.
- Re-running overwrites the installed copies with the plugin's current version.
- `jsconfig.json` is copied alongside the scripts on purpose: it tells editors not to type-check the workflow dialect (top-level `return`/`await`, injected globals).
