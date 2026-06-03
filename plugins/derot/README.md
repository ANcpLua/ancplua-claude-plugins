# derot

**Truth-drift auditor.** Finds & fixes every place a repo's *stated* intent — comments, docs, CI infra, versions, dependency choices — has drifted from what the code/build *actually* is. Root + transitive verification; correct beats delete.

## Use

```
/derot [scope]
```

Run a pass over the repo (optionally scoped to a path/glob). The `derot` skill also triggers semantically — "stale comments", "docs don't match the code", "clean up the docs", "why this dependency", "überarbeitung".

## Five rot dimensions

1. **Comment rot** — comments lying about the code beneath them.
2. **Doc rot** — `CLAUDE.md` / `README` / `CHANGELOG` / workflow tables vs. reality.
3. **Infra rot** — unpinned actions, hardcoded publish accounts, expired API keys → SHA-pins + dynamic OIDC trusted publishing.
4. **Version sync** — pins/claims out of sync across `Version.props` / `Directory.Packages.props` / `global.json` / docs.
5. **Dependency rationalization** — sub-package where a parent suffices; a package superseded by a shipped successor (e.g. `Microsoft.SemanticKernel` ⊂ `Microsoft.Agents.AI`); direct refs already present transitively.

## How it works

Parallel read-only **rot-scouts** (one per area) verify every candidate against ground truth before reporting it. A **dep-analyst** questions dependency choices against the NuGet graph + cited vendor docs. The orchestrator synthesizes one apply-list, applies the verified fixes itself, builds/tests, and reports — with a **flagged, not changed** list for human calls (secrets, dependency swaps).

## Discipline

- Never "fix" a comment to match a wrong assumption — fix whichever of {comment, code} is actually wrong.
- Correct beats delete: keep a genuinely useful *why*, fix only the wrong facts.
- Never assert package succession from memory — cite the source or report it unverified.
- Proposes dependency changes; never auto-applies them.
