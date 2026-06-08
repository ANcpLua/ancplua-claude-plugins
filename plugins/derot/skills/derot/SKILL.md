---
name: derot
description: "Truth-drift auditor — find & fix comment/doc/CI/version/dependency rot that contradicts the current code, with root + transitive verification (correct beats delete). Use when the user wants to remove stale comments, fix doc drift (CLAUDE.md/README/CHANGELOG), modernize CI publish auth, sync package versions, or question why a sub-library is used instead of a parent/successor package. Triggers on \"stale comments\", \"derot\", \"doc rot\", \"comments are out of date\", \"docs don't match the code\", \"clean up the docs\", \"why this dependency\", \"überarbeitung\"."
allowed-tools: Read Grep Glob Bash Edit Write Agent WebFetch WebSearch Skill
effort: high
---

# derot — truth-drift auditor

**Rot** = any place a repo's *stated* intent has drifted from what the code/build *actually* is. derot finds it, verifies it against ground truth, and fixes it — correcting where the knowledge is still useful, deleting only what is purely obsolete.

## The five rot dimensions

1. **Comment rot** — comments that lie about the code beneath them: stale version numbers, references to renamed/removed symbols/methods/files/diagnostic-IDs, resolved `TODO`/`FIXME`/`HACK`/"temporary"/"workaround for X", descriptions of old behavior, copy-paste comments describing a different member, dead-code comments.
2. **Doc rot** — `CLAUDE.md` / `README` / `CHANGELOG` / workflow tables whose dependency versions, file lists, command names, or workflow names don't match reality. (Shipped past `CHANGELOG` entries are history, not rot — never flag them.)
3. **Infra rot** — workflow comments that lie; unpinned actions (`@v1` → SHA-pin with a `# vN` comment); hardcoded publish accounts → dynamic secrets; expired/long-lived API keys → OIDC trusted publishing.
4. **Version sync** — pins/claims out of sync across `Version.props` / `Directory.Packages.props` / `global.json` / docs; published-vs-pinned drift; a property referenced but defined only by an injected SDK (annotate, don't "fix").
5. **Dependency rationalization** — a narrow sub-package used where a parent/meta suffices; a **superseded** package still used after its successor shipped; redundant direct references already present transitively. This dimension needs external knowledge, not just the repo — see `references/dependency-rationalization.md`.

## Discipline — non-negotiable

1. **Correct beats delete.** If a comment explains a genuinely non-obvious *why* (a workaround's reason, an invariant), fix the wrong details and KEEP the explanation. Delete only when purely obsolete.
2. **Verify root + every transitive use.** Before changing anything a comment/doc describes, read the code it refers to and everything that depends on it. Never "fix" a comment to match a wrong assumption — fix whichever of {comment, code} is actually wrong, and chase the change through every caller.
3. **Never invent.** Can't confirm it's stale? Leave it; report it as `unverified`. Do not guess.
4. **Terse + behavioral corrections.** Say what/why; don't restate the code.
5. **No drive-by behavior changes.** Comments/docs + the named CI modernizations only — unless fixing rot exposes a real bug, in which case say so and fix the root cause.

## Verification recipes (how a candidate becomes a confirmed finding)

- **Version claim** → read `Version.props` / `Directory.Packages.props` / `global.json`, and the injected SDK props if a property is undefined locally; confirm the actual resolved value before calling a number stale.
- **Names a symbol / file / diagnostic ID / method / workflow** → `grep` / `ls` to confirm it still exists and is spelled right.
- **Describes behavior** → read the code directly under/around the comment and confirm they agree.
- **Dependency choice** → see the references file: the NuGet graph for transitive-already-present + true subset; cited vendor docs / `nuget-opensrc` / `microsoft-docs` for succession.

Classify each candidate: `confirmed-rot` (wrong → fix/delete) · `correct-keep-explanation` (details wrong, *why* valid → corrected text that keeps the explanation) · `obsolete-delete` (purely obsolete → delete) · `unverified` (cannot confirm → leave + report).

## Running a pass

**Small scope:** inline — scan → verify → fix → build → report.

**Large repo:** fan out **`rot-scout`** agents (read-only, one per area — they parallelise cleanly) and a **`dep-analyst`** for dimension 5; synthesize their verified findings into one apply-list; then YOU apply the edits, build/test, and commit. A Workflow is ideal for many areas. The orchestrator — not the scouts — performs the mutations, so comment removal stays under one reviewer's control.

Always finish with: build/test evidence (exact commands + results), a per-change root-cause summary, and a **flagged, not changed** list (secrets to delete, unverified candidates, dependency calls needing a human decision). derot proposes; the human disposes — especially for dependency swaps, which change the build.
