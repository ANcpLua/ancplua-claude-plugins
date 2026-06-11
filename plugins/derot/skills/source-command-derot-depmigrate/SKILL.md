---
name: source-command-derot-depmigrate
description: "Migrate specific packages to their new APIs \u2014 read the canonical upstream source\
  \ (releases/tags/changelog/API), detect what changed, rewrite this repo's usages,\
  \ delete obsolete glue, and validate. Every non-trivial finding survives adversarial\
  \ refutation before it is applied. /derot proposes dependency changes; /depmigrate\
  \ applies them."
---

# source-command-derot-depmigrate

Use this skill when the user asks to run the migrated Claude slash command `/derot:depmigrate`.

## Command Template

Run a **depmigrate** pass: take the named packages, learn their *new* API from the real upstream source, and bring this repo's code onto it — rewriting call sites, deleting obsolete glue, and validating the result. This is derot's **write-capable** dependency mode: `/derot` audits and proposes; `/depmigrate` migrates and applies — and earns that right by refuting every non-trivial finding before acting.

**Packages:** $ARGUMENTS — exactly these (and their tightly-coupled companions). Never drift into unrelated packages.

## The loop

1. **Resolve inputs.** Parse $ARGUMENTS into package ids. Empty → stop and ask which packages; never guess a target set.
2. **Read the manifests.** `Directory.Packages.props`, `Version.props`, `*.csproj` / package manifests, and lockfiles if present. Record each package's **current** version and every place it's pinned. (Non-.NET: the equivalent manifest + lock.)
3. **Find the canonical source — not memory.** Per package, the *real* upstream:
   - `nuget-opensrc:opensrc-research` for the commit-pinned source + origin repo of a NuGet package.
   - **Microsoft** packages where Learn is canonical → `microsoft-learn-grounding` / `microsoft-docs`. If the Learn MCP is down, fix it or fall back to the package's own GitHub releases/tags — and say which you used.
   - Everything else → the package's official repo releases/tags/changelog. **Never skip reading releases/tags.**
4. **Pick the target version.** The latest *suitable* stable release compatible with this repo's target framework — not merely the newest tag. Pre-release only if the repo already opts into it.
5. **Read the delta.** Releases, tags, changelog, migration guide, and the API diff between current and target. Capture: removed / renamed / moved / replaced APIs, new required parameters, behavioral changes.
6. **Deprecation / supersession.** Is the package itself deprecated, superseded, or replaced by a shipped successor? Dispatch **`dep-analyst`** (cited vendor docs, never a baked-in list). A successor that shipped is a migration target, not a version bump.
7. **Scan usage sites.** `grep` every call site of the changed APIs across the repo; on a large repo dispatch **`rot-scout`** to find them (and any comments/docs naming the old API). Miss no caller.
8. **Produce findings.** One per claim, each of a known kind: `canonical-source` · `target-version` · `deprecated/superseded` · `api-removed/renamed/moved` · `usage-obsolete` · `wrapper-deletable` · `migration-safe` · `public-break-acceptable`. Attach evidence: URLs, `file:line`, graph paths.
9. **Refute — the gate.** Send **every non-trivial finding** to the **`refuter`** agent (one per finding; parallelise — they're independent and read-only). Apply only `accepted`. `weakened` → gather the named evidence and re-refute. `needs-human` / `rejected` → do **not** apply; carry to the report. Agent agreement is not acceptance — the refuter's cited evidence is.
10. **Rewrite to the new API.** For accepted `api-*` / `usage-obsolete` findings, update the call sites. Delegate to `code-modernization` (modernize-transform) when installed; otherwise rewrite directly against the new API. Bump the pinned version in the manifest in the *same* change — Renovate/Dependabot do the *number*; you do the *code*.
11. **Delete obsolete glue.** Old wrappers, compatibility shims, dead branches, "workaround for X" code where X is now fixed upstream — delete it (accepted `wrapper-deletable` only). Delegate to `nihil-shiva` when installed; otherwise delete directly. Don't preserve old code without a cited reason. A public-API break is acceptable when the finding says so **and** it survived refutation.
12. **Validate.** Run the repo's standard build + test + lint (discover them: `dotnet build` / `test`, the CI workflow's commands, `package.json` scripts). A destructive finding is not truly `accepted` until the rewrite compiles and the suite passes — feed any failure back to the refuter as a `validation-failed` finding. Never claim done without running this.
13. **Report + commit.** Emit the report below, then commit + push per repo hygiene. Surface unresolved risks; never hide uncertainty.

## Delegation map — reuse, don't reimplement

| Loop step | Delegate |
|-----------|----------|
| Canonical source / releases / tags | `nuget-opensrc:opensrc-research`; `microsoft-learn-grounding` (Microsoft only) |
| Deprecation / supersession | `derot:dep-analyst` |
| Usage-site discovery | `derot:rot-scout` |
| Refutation gate | `derot:refuter` |
| API rewrite | `code-modernization` if present, else inline |
| Obsolete-code deletion | `nihil-shiva` if present, else inline |
| Mechanical version bump | Renovate/Dependabot — the number only, not the migration |

## Guardrails

- **Don't drift** into packages you weren't given.
- **Don't invent upstream claims** — read the release/tag/API and cite the URL, or mark it `unverified`.
- **Don't skip** release/tag/API source reading, even for a "small" bump.
- **Don't preserve** old code without a reason; don't delete code you can't prove is obsolete.
- **Don't hide uncertainty** — `needs-human` is a valid, honest outcome.
- **Don't say done** unless code was actually rewritten and validation was attempted.
- **MCP down?** Non-Microsoft packages never block on it — use the upstream repo's releases/tags directly. Microsoft packages: fix the MCP or use the canonical Microsoft docs/source explicitly.

## Required report

1. **Verdict** — complete existing workflow / needs small orchestration / needs new workflow / one-off only.
2. **What I already own** — each plugin/agent mapped to the loop step it covered.
3. **Gap** — the exact missing link, if any remained (a clean run covered end-to-end → say so).
4. **Migration findings** — per package: current version · target version · canonical source · release/tag/API changes · superseded/replaced status · usage sites · rewrite required · deletion opportunities · validation command.
5. **Adversarial refutation log** — per finding: Finding · Evidence · Warrant · Refutation attempt · Refutation result · Final status (+ resurrection note where killed-but-plausible).
6. **Implementation** — files changed · old code deleted · new code added · commands run · blockers.
7. **Reusable workflow proposal** — only if this run revealed a still-missing link: command name, inputs, reused pieces, minimal new code, why it closes the gap.

## MANUAL MIGRATION REQUIRED

Migrated from Claude slash command `/derot:depmigrate` into a Codex skill. Invoke it as `$source-command-derot-depmigrate` and rewrite provider-specific runtime behavior before relying on it for unattended execution.

Claude argument placeholders like `$ARGUMENTS`, `$0`, or `$1` were preserved as text; replace them with explicit Codex instructions for the current task.

Review unsupported Claude slash-command metadata manually: `argument-hint`.
