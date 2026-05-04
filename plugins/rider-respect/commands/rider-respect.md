---
description: Apply every IDE hint Rider's daemon reports onto a dry-run branch (no commit, no merge)
effort: medium
---

# /rider-respect

Explicit slash-command entry point for the **rider-respect** skill. The skill carries the full workflow, the diagnostic-class → MCP-tool map, and the safety invariants — keep this file thin so both invocation paths (slash command and natural-language auto-trigger) stay in sync.

## Usage

```text
/rider-respect                       # working-tree changes
/rider-respect path/to/File.cs       # one file
/rider-respect "src/**/*.cs"         # glob
/rider-respect --severity=warning    # skip suggestions/hints
/rider-respect --severity=error      # only errors
```

## What this command does

Invoke the `rider-respect` skill (`Skill` tool) with the user's arguments. The skill handles everything: branching, pulling diagnostics from Rider's MCP server, picking the right tool per diagnostic class, building, and reporting.

If the skill is unavailable (e.g. plugin not installed), fail loudly — do not improvise a partial implementation here.

## Why both a command and a skill

- **The skill** auto-triggers when the user phrases the request in natural language ("fix all warnings on a test branch", "show me what Rider would do") — its `description` is the matcher.
- **This command** is the explicit `/rider-respect …` typed-invocation path with stable args.

Both paths run identical logic because they both flow through the skill. Keep all behavioral knowledge in `skills/rider-respect/SKILL.md`; this file should never grow beyond an args contract and a delegation note.
