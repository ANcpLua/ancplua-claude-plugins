---
description: "IF .NET warnings need extermination THEN use this. One-shot Noble Phantasm: snapshots reality (Rider MCP + NuGet MCP), 8 aspects burst at T0, headless/reckless, cross-repo. Full MCP access."
allowed-tools: Task, Bash, TodoWrite, WebFetch, WebSearch
---

# BARYON MODE — One-Shot Warning Exterminator

> Noble Phantasm. Triggers at battle start. 8 aspects manifest. Phantasm concludes.

**Solution:** $0 (path to .sln or directory)
**Scope:** $1 (default: all | nullability|deprecation|unused|async|style|suppressions|packages|config)

---

## ARCHITECTURE

```text
INVOKER (You — Phase 0: snapshot + categorize)
│
├─ T₀ BURST: up to 9 agents — ALL IN ONE MESSAGE
│  │
│  ├── recon-invoker          ← True Name disclosure (Rider MCP + NuGet MCP)
│  │
│  ├── aspect-nullability     ← CS8600-CS8799
│  ├── aspect-deprecation     ← CS0612, CS0618, SYSLIB*, CA1422
│  ├── aspect-unused          ← CS0168, CS0219, IDE0051-IDE0060
│  ├── aspect-async           ← CS4014, CS1998, CA2007, CA2008, CA2016
│  ├── aspect-style           ← IDE0001-IDE0100, SA1*, RCS*
│  ├── aspect-suppressions    ← #pragma, SuppressMessage, NoWarn
│  ├── aspect-packages        ← NU*, CPM, version conflicts
│  └── aspect-config          ← .editorconfig, Directory.Build.props, analyzers
│
└─ PHANTASM CONCLUDES: dotnet build → delta → exit
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**STEP -1 — Inherit Prior Findings:**
If `<EXODIA_FINDINGS_CONTEXT>` tag exists in session context, read `.eight-gates/artifacts/findings.json`.
Filter findings with `category == "SUPP"` (suppression findings). Inject as known-issues for the Invoker's
categorization step — skip re-discovering suppressions already catalogued.

**THIS IS A NOBLE PHANTASM. ONE BURST. NO GATES. NO PERMISSION.**

1. Phase 0: Run `dotnet build`, capture ALL warnings, categorize into 8 buckets
2. IF `$1` != `all`: filter buckets to only the requested scope
3. T₀: Launch recon-invoker + ALL aspects that have warnings in scope — ONE message
3. Phantasm Concludes: `dotnet build` again, report delta, exit

**NO asking "should I continue?" EVER.**
**NO gates between burst and verification.**
**RECKLESS MODE: Fix everything. Verify once. Exit.**
**Only launch aspects that have warnings in their category. Skip empty buckets.**
**IF $1 specifies a scope: only launch that aspect. Ignore all other buckets.**

**YOUR NEXT MESSAGE: Run `dotnet build` to capture warnings. THEN launch Task calls. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 0: INVOCATION (Direct — You)

```bash
BARYON_BEFORE=$(mktemp)
dotnet build "$0" 2>&1 | tee "$BARYON_BEFORE"
```

Parse output. Categorize each warning by code prefix into the 8 aspect buckets.
Count per bucket. If 0 total warnings: "Solution clean. Baryon Mode not needed." EXIT.

IF `$1` is set and not `all`: keep only the matching bucket, discard the rest.

For each non-empty bucket, prepare the warning list (file:line + code + message).

---

## T₀ BURST: ALL PARALLEL — ONE MESSAGE

Launch recon-invoker ALWAYS. Launch each aspect ONLY if its bucket has warnings AND is in scope.
All in ONE message. No sequencing. No dependencies.

### recon-invoker

> subagent: general-purpose
>
> You are the INVOKER. Snapshot tooling reality. Intelligence only — DO NOT modify files.
> Solution: $0
>
> 1. For each PackageReference, WebFetch NuGet flat container API — compare installed vs latest stable
> 2. Check JetBrains Rider MCP for solution-level diagnostics and inspections (if mcp tools available)
> 3. Check GitHub MCP for open issues mentioning warnings or analyzer upgrades (if mcp tools available)
> 4. Build VERSION BRIEFING: packages with updates available, breaking changes, newly deprecated APIs
>
> Output: VERSION BRIEFING — current state, available updates, upgrade recommendations.

### aspect-nullability

> subagent: general-purpose
>
> You are ASPECT: NULLABILITY. Fix ALL nullable reference type warnings.
> Solution: $0
> Your warnings: [PASTE CS8600-CS8799 warnings from build output]
>
> - Add null checks, null-conditional operators, pattern matching where needed
> - Use null-forgiving `!` ONLY when provably safe (field set in constructor, etc.)
> - Add `[NotNullWhen]`, `[MaybeNullWhen]`, `[NotNull]` attributes where appropriate
> - Enable `<Nullable>enable</Nullable>` in projects where missing
> - Remove any `#pragma warning disable` for your warning codes — fix the underlying issue
> - Cross-repo: modify ANY .cs file, ANY .csproj in the solution
>
> Output: files changed + warning codes resolved + count

### aspect-deprecation

> subagent: general-purpose
>
> You are ASPECT: DEPRECATION. Replace ALL obsolete API usage.
> Solution: $0
> Your warnings: [PASTE CS0612, CS0618, SYSLIB*, CA1422 warnings]
>
> - Replace deprecated APIs with recommended alternatives
> - WebSearch for migration guides when replacement is unclear
> - Update package versions if deprecation comes from outdated packages
> - For NuGet updates: WebFetch `https://api.nuget.org/v3-flatcontainer/{id}/index.json` for latest stable
> - Update Directory.Packages.props (CPM) — never hardcode Version= in .csproj
> - Cross-repo: modify ANY file, update ANY package reference
>
> Output: files changed + APIs migrated + packages updated

### aspect-unused

> subagent: general-purpose
>
> You are ASPECT: UNUSED CODE. Remove ALL dead code.
> Solution: $0
> Your warnings: [PASTE CS0168, CS0219, IDE0051-IDE0060, IDE0052 warnings]
>
> - Remove unused variables, parameters, using directives
> - Remove unused private members (methods, fields, properties, types)
> - Remove empty catch blocks or add proper handling
> - If removal changes public API surface: leave it, note in output
> - Cross-repo: modify ANY .cs file
>
> Output: files changed + lines removed + items deleted

### aspect-async

> subagent: general-purpose
>
> You are ASPECT: ASYNC. Fix ALL async/await warnings.
> Solution: $0
> Your warnings: [PASTE CS4014, CS1998, CA2007, CA2008, CA2016 warnings]
>
> - Add missing `await` for fire-and-forget calls (CS4014)
> - Remove unnecessary `async` modifier (CS1998) or add actual async work
> - Add `.ConfigureAwait(false)` in library code (CA2007)
> - Propagate CancellationToken where missing (CA2016)
> - Cross-repo: modify ANY .cs file
>
> Output: files changed + async fixes applied

### aspect-style

> subagent: general-purpose
>
> You are ASPECT: STYLE. Fix ALL code style warnings.
> Solution: $0
> Your warnings: [PASTE IDE0001-IDE0100, SA1*, RCS* warnings]
>
> - Apply IDE suggestions (simplify names, use pattern matching, expression bodies, etc.)
> - Fix SA1* StyleCop warnings (documentation, ordering, spacing, naming)
> - Fix RCS* Roslynator suggestions
> - Follow existing project code style conventions
> - Cross-repo: modify ANY .cs file
>
> Output: files changed + style fixes applied by category

### aspect-suppressions

> subagent: general-purpose
>
> You are ASPECT: SUPPRESSIONS. REMOVE ALL warning suppressions.
> Solution: $0
>
> Find and eliminate across the entire solution:
> - ALL `#pragma warning disable` / `#pragma warning restore` pairs
> - ALL `[SuppressMessage(...)]` attributes
> - ALL `<NoWarn>` entries in .csproj files
> - ALL `// ReSharper disable` / `// ReSharper restore` comments
>
> For each suppression removed: note the warning code that was being suppressed.
> DO NOT fix the underlying warnings — the other aspects handle that.
> Your job is to EXPOSE what was hidden.
>
> Cross-repo: modify ANY file (.cs, .csproj, .editorconfig, Directory.Build.props)
>
> Output: suppressions removed (count by type) + warning codes now exposed

### aspect-packages

> subagent: general-purpose
>
> You are ASPECT: PACKAGES. Fix ALL NuGet and package warnings.
> Solution: $0
> Your warnings: [PASTE NU* warnings from build output]
>
> - Fix NU1603, NU1605 dependency conflicts — update to compatible versions
> - Fix NU1701 target framework compatibility
> - For each package update: WebFetch `https://api.nuget.org/v3-flatcontainer/{id}/index.json` for latest stable
> - Update Directory.Packages.props for CPM projects (version there, not in .csproj)
> - Update Version.props variables where used — follow $(PackageNameVersion) convention
> - NEVER hardcode Version="x.y.z" in .csproj — use CPM
> - Cross-repo: modify Directory.Packages.props, Version.props, *.csproj
>
> Output: packages updated + version changes + warnings resolved

### aspect-config

> subagent: general-purpose
>
> You are ASPECT: CONFIG. Clean up analyzer and build configuration.
> Solution: $0
>
> - Remove stale/redundant .editorconfig rules
> - Ensure severity levels are consistent across projects
> - Remove `<NoWarn>` from .csproj files (warnings should be fixed, not silenced)
> - Enable `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` where appropriate
> - Remove duplicate or conflicting analyzer configurations
> - Ensure analyzer packages are consistent across projects
> - Cross-repo: modify .editorconfig, Directory.Build.props, Directory.Packages.props, *.csproj
>
> Output: config changes + rationale for each

---

## PHANTASM CONCLUDES (Direct — You)

```bash
BARYON_AFTER=$(mktemp)
dotnet build "$0" 2>&1 | tee "$BARYON_AFTER"
```

Compare before/after warning counts. Report.

```text
+================================================================+
|              BARYON MODE — PHANTASM COMPLETE                    |
+================================================================+
| Solution: $0                                                   |
+----------------------------------------------------------------+
| BEFORE: [N] warnings                                           |
| AFTER:  [N] warnings                                           |
| DELTA:  -[N] eliminated                                        |
+================================================================+
| Aspect              | Resolved | Files Changed                 |
|---------------------|----------|-------------------------------|
| nullability         | [N]      | [N]                           |
| deprecation         | [N]      | [N]                           |
| unused              | [N]      | [N]                           |
| async               | [N]      | [N]                           |
| style               | [N]      | [N]                           |
| suppressions        | [N]      | [N]                           |
| packages            | [N]      | [N]                           |
| config              | [N]      | [N]                           |
+----------------------------------------------------------------+
| VERSION BRIEFING (from Invoker):                               |
| [Package updates + recommendations summary]                    |
+================================================================+
```

If warnings remain: list them. They survived the Noble Phantasm.

**Next:** If survivors exist, run `/exodia:baryon-mode "$0"` again or fix manually.
