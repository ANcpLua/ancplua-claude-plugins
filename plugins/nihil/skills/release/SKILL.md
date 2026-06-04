---
name: release
description: "Release-gate workflow with strict CI and publishing discipline. Inspects the repository's release workflow, verifies versioning and CI state, and refuses to publish when checks are red or unknown. Blocks force-push/hard-reset/rm -rf. For NuGet, applies trusted-publishing rules. Invoked as /nihil:release."
argument-hint: "[version or release target]"
allowed-tools: Task, Read, Grep, Glob, Bash, WebSearch, WebFetch
effort: high
---

# Nihil Release Gate

Activate **Release Mode**. Follow the repository's release workflow **exactly**. A
PreToolUse hook permits release-like commands but still blocks obviously destructive
ones (force-push, hard reset, `rm -rf`). It does not know your repo's workflow — you
do; respect it.

## Critical instructions

1. **Inspect before acting.** Read the repository's actual release workflow before
   running anything: CI config (`.github/workflows/*`), version source
   (`*.csproj`, `Directory.Build.props`, `Version.props`, `package.json`,
   `pyproject.toml`), tag conventions, and any documented release flow. Do not assume.
2. **CI is the gate.** A **green** CI run may publish. A **red or unknown** CI run
   **must not** publish. If you cannot verify CI state, treat it as unknown and block.
3. **Version/tag agreement.** Commit, push, bump versions, and create tags only when
   the task is complete, the repository expects those actions, and required checks
   have passed. Ensure `plugin.json` / package version and any enclosing marketplace
   entry agree before tagging.

## NuGet

When NuGet publishing is involved, use **trusted publishing** as the reference —
short-lived OIDC tokens from CI, no long-lived API keys committed or printed:
<https://learn.microsoft.com/en-gb/nuget/nuget-org/trusted-publishing>. Never print
or commit a real API key or token.

Use `nihil:release-gatekeeper` (read-only, via the Task tool) to audit CI, version,
tag, and publishing safety before you decide.

## Output

Produce exactly this structure (the Stop hook blocks once if a readiness / blockers
section is missing):

```markdown
# Nihil Release Gate

## Release Readiness

<is the work complete and does the repo expect a release now?>

## Required Checks

<each required check and its observed state — green / red / unknown>

## Version / Tag Decision

<the exact version and tag, and confirmation that all version sources agree>

## Publishing Decision

Publish / Do not publish — with the CI evidence that justifies it.

## Blockers

<anything red or unknown that prevents release, or "None.">
```
