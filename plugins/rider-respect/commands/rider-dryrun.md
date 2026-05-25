---
description: Apply every IDE hint Rider's daemon reports onto a dry-run branch or .patch file (no commit, no merge)
effort: medium
---

# /rider-dryrun

Explicit slash-command entry point for the **rider-respect** skill. The skill carries the full workflow, the diagnostic-class → MCP-tool map, and the safety invariants — keep this file thin so both invocation paths (slash command and natural-language auto-trigger) stay in sync.

## Why this file is named `rider-dryrun` and not `rider-respect`

The command basename and the skill basename must differ within the same plugin. When they collide, `Skill(rider-respect:rider-respect)` resolves to whichever file the plugin router picks first — historically this command file — and `SKILL.md` becomes unreachable. Keeping the command at `rider-dryrun` and the skill at `rider-respect` guarantees both paths are addressable.

## Usage

```text
/rider-dryrun                       # working-tree changes (or all *.cs if no git)
/rider-dryrun path/to/File.cs       # one file
/rider-dryrun "src/**/*.cs"         # glob
/rider-dryrun --severity=warning    # skip suggestions/hints
/rider-dryrun --severity=error      # only errors
```

## What this command does

Invoke the `rider-respect` skill (`Skill` tool) with the user's arguments. The skill handles everything: picking git mode (branch) or patch mode (`.patch` file), pulling diagnostics from Rider's MCP server, picking the right tool per diagnostic class, building, and reporting.

If the skill is unavailable (e.g. plugin not installed), fail loudly — do not improvise a partial implementation here.

## Why both a command and a skill

- **The skill** auto-triggers when the user phrases the request in natural language ("fix all warnings on a test branch", "show me what Rider would do") — its `description` is the matcher.
- **This command** is the explicit `/rider-dryrun …` typed-invocation path with stable args.

Both paths run identical logic because they both flow through the skill. Keep all behavioral knowledge in `skills/rider-respect/SKILL.md`; this file should never grow beyond an args contract and a delegation note.
