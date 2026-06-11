---
name: source-command-derot-derot
description: "Truth-drift pass over a repo \u2014 find & fix comment/doc/CI/version/dependency\
  \ rot that contradicts the actual code, with root + transitive verification. Optional\
  \ scope arg (path or glob). Fans out parallel rot-scouts on large repos."
---

# source-command-derot-derot

Use this skill when the user asks to run the migrated Claude slash command `/derot:derot`.

## Command Template

Run a **derot** pass: find and fix **rot** — every place this repo's *stated* intent (comments, docs, CI infra, versions, dependency choices) has drifted from what the code/build *actually* is — without deleting knowledge that still holds.

Scope: $ARGUMENTS (empty → the whole repo; prioritise `src/`, `.github/`, `*.md`, build/config files).

Use the **derot** skill for the full methodology and the five rot dimensions. The pass:

1. **Plan.** Decide the scope; split it into areas (by directory / file-type).
2. **Scout — parallel, read-only.** For a non-trivial repo, fan out one `rot-scout` per area (Agent tool, or a Workflow when there are many areas — scouts are independent and read-only, so they parallelise cleanly). Each scout VERIFIES every candidate against ground truth before reporting it (open the referenced code; check `Version.props` / `Directory.Packages.props` / `global.json` for version claims; grep for symbol/ID/file existence; read the code under the comment). For dimension 5, dispatch the `dep-analyst`.
3. **Synthesize.** Collect findings into one ordered apply-list. Drop `unverified`; keep `confirmed-rot`, `correct-keep-explanation`, `obsolete-delete`. Sanity-check each against its stated evidence.
4. **Apply.** YOU — not the scouts — apply the verified edits. Correct beats delete: keep a useful *why*, fix only the wrong facts.
5. **Verify.** Build + test; for YAML/props-only changes, validate the file. Never claim done without running it.
6. **Report + commit.** Summarize each change with its one-line root-cause justification, plus a separate **flagged, not changed** list (secrets to delete, unverified candidates, dependency calls needing a human). Commit + push per the repo's hygiene conventions.

The discipline is non-negotiable (see the skill): never "fix" a comment to match a wrong assumption — fix whichever of {comment, code} is actually wrong, and chase it through every caller. Never assert a dependency succession from memory — cite the source or report it as unverified.

## MANUAL MIGRATION REQUIRED

Migrated from Claude slash command `/derot:derot` into a Codex skill. Invoke it as `$source-command-derot-derot` and rewrite provider-specific runtime behavior before relying on it for unattended execution.

Claude argument placeholders like `$ARGUMENTS`, `$0`, or `$1` were preserved as text; replace them with explicit Codex instructions for the current task.
