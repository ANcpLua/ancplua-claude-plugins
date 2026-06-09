# derot

**Dependency lifecycle for a repo you own** — audit what's drifted, then migrate what's outdated.

- **`/derot [scope]`** — *audit & propose.* Find & fix every place a repo's *stated* intent (comments, docs, CI infra, versions, dependency choices) has drifted from what the code/build *actually* is. Root + transitive verification; correct beats delete; proposes dependency changes, never auto-applies.
- **`/depmigrate <package...>`** — *migrate & apply.* Take named packages, learn their *new* API from the real upstream source (releases/tags/changelog), rewrite this repo's call sites, delete obsolete glue, and validate — with every non-trivial finding gated through adversarial refutation before it lands.

## `/derot` — truth-drift audit

```
/derot [scope]
```

Run a pass over the repo (optionally scoped to a path/glob). The `derot` skill also triggers semantically — "stale comments", "docs don't match the code", "clean up the docs", "why this dependency", "überarbeitung".

### Five rot dimensions

1. **Comment rot** — comments lying about the code beneath them.
2. **Doc rot** — `CLAUDE.md` / `README` / `CHANGELOG` / workflow tables vs. reality.
3. **Infra rot** — unpinned actions, hardcoded publish accounts, expired API keys → SHA-pins + dynamic OIDC trusted publishing.
4. **Version sync** — pins/claims out of sync across `Version.props` / `Directory.Packages.props` / `global.json` / docs.
5. **Dependency rationalization** — sub-package where a parent suffices; a package superseded by a shipped successor (verified per run via cited vendor docs, never a baked-in list); direct refs already present transitively.

Parallel read-only **rot-scouts** (one per area) verify every candidate against ground truth before reporting it. A **dep-analyst** questions dependency choices against the NuGet graph + cited vendor docs. The orchestrator synthesizes one apply-list, applies the verified fixes itself, builds/tests, and reports — with a **flagged, not changed** list for human calls (secrets, dependency swaps).

## `/depmigrate` — package → new-API migration

```
/depmigrate <package...>
```

Reads the canonical upstream source for each named package, detects removed/renamed/moved/replaced APIs against your current pin, rewrites usages, deletes obsolete wrappers, and runs the repo's build/test/lint. It **reuses the cluster** rather than reimplementing it:

| Loop step | Reused piece |
|-----------|--------------|
| Canonical source / releases / tags | `nuget-opensrc:opensrc-research`, `microsoft-learn-grounding` (Microsoft) |
| Deprecation / supersession | `dep-analyst` |
| Usage-site discovery | `rot-scout` |
| Refutation gate | `refuter` |
| API rewrite | `code-modernization` (or inline) |
| Obsolete-code deletion | `nihil-shiva` (or inline) |
| Mechanical version bump | Renovate / Dependabot — the number only |

### The refutation gate

Every non-trivial finding — *this is the canonical source*, *this API was removed*, *this wrapper is deletable*, *this migration is safe*, *this public break is acceptable* — goes to the **`refuter`** agent, which tries to **disprove** it with concrete counterevidence before it's applied:

- "Could be wrong" is not a refutation — only cited counterevidence, or "refutation failed".
- **Consensus is not correctness** — empirical build/test/lint beats agent agreement.
- Incomplete evidence → `needs-human`, never a guess.
- A killed-but-plausible finding gets a **resurrection** note, so true positives aren't lost.

A destructive finding is never `accepted` until the rewrite compiles and the suite passes.

## Discipline

- Never assert a package succession or API change from memory — read the release/tag/API and cite it, or mark it `unverified`.
- `/derot` proposes; `/depmigrate` applies — and only after refutation + validation.
- Don't drift into packages you weren't given. Don't preserve old code without a reason. Never say done without running validation.
