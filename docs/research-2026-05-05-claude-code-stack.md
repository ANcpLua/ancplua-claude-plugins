# May 2026 Findings — Claude Code Plugin / MCP Research

**Date:** 2026-05-05
**Scope:** Verified survey of Claude Code plugins, MCP servers, and marketplaces in three domains, evaluated against an existing 17-plugin stack.
**Method:** Three parallel research agents (web search + repo verification). Every entry tagged with status, last commit, license, and stacking note vs. the existing stack. Dates verified against GitHub `pushed_at`.

---

## Existing stack (baseline — do not duplicate)

Marketplace: [`ancplua-claude-plugins`](https://github.com/ANcpLua/ancplua-claude-plugins). 17 plugins:

| Domain | Plugins |
|---|---|
| Multi-agent orchestration | `council`, `exodia`, `ancplua` |
| Cognitive | `metacognitive-guard`, `feature-dev` |
| Code quality | `code-simplifier`, `elegance-pipeline` |
| .NET | `dotnet-architecture-lint`, `release-pilot`, `rider-respect` (JetBrains MCP) |
| Testing | `mutation-minded-testing` |
| Hooks/config | `hookify` |
| OTel | `otelhook` (semconv v1.40.0 SessionStart injection) |
| Plugin tooling | `skill-creator`, `cc-plugin-eval`, `marketplace-tour` |
| Design | `design-studio` |

Primary work context: long-term contribution to upstream OpenTelemetry Semantic Conventions — clean Weaver-based generator for C#/.NET reproducing upstream OTel semconv from official model YAML (current focus: v1.40.0 → v1.41.0 migration).

Snapshot taken before the 2026-05-09 additions of `claudemd-curator` and `session-debrief` (both Phase 1 forks of `anthropics/claude-plugins-official`).

---

## Tier 1 — Install now (verified, no overlap, high stack-fit)

### 1. `open-telemetry/weaver` — `weaver registry mcp`

- **Repo:** <https://github.com/open-telemetry/weaver>
- **Status:** `[OFFICIAL]` Apache-2.0, v0.23.0 (2026-04-22), 395★, official OTel project
- **What:** Experimental MCP subcommand exposing `search` / `get` / `live_check` over the resolved YAML registry
- **Stacking:** Highest fit. `otelhook` injects v1.40 semconv as static SessionStart text; this serves the **resolved registry** with version pinning + live-check. Canonical complement for the v1.40 → v1.41 generator. By-the-book per official OTel guidance.
- **Caveat:** Pin Weaver release to your pinned semconv tag (currently v1.41.0) for reproducibility.

### 2. `NuGet.Mcp.Server` (official)

- **Source:** [Microsoft Learn docs](https://learn.microsoft.com/en-us/nuget/concepts/nuget-mcp-server). Run via `dnx`.
- **Status:** `[OFFICIAL]` Microsoft / NuGet team, docs updated 2026-02-02
- **What:** Vulnerability fix, package update, version pinning tools
- **Stacking:** No overlap. `dotnet-architecture-lint` enforces CPM **structure**; this resolves **CVE state** inside it.
- **Caveat:** Requires .NET 10 SDK.

### 3. `MarcelRoozekrans/roslyn-codelens-mcp`

- **Repo:** <https://github.com/MarcelRoozekrans/roslyn-codelens-mcp>
- **Status:** `[3RD-PARTY-ACTIVE]` MIT, v1.16.0 (2026-05-04), 8★. Real Claude Code plugin + MCP.
- **What:** 50+ tools over MSBuildWorkspace: `get_di_registrations`, `analyze_change_impact`, `find_event_subscribers`, `find_attribute_usages`, `peek_il`, breaking-change detection. Headless = CI-friendly.
- **Stacking:** Different layer than `rider-respect`. Rider drives the **action** channel (rename, reformat); this exposes the Roslyn **semantic graph** (query layer). Directly useful for the upcoming OTel migration analyzer — find every `[Obsolete]` attribute, every conv constant usage.
- **VS-only complement:** `sailro/RoslynMcpExtension` (<https://github.com/sailro/RoslynMcpExtension>) — `[3RD-PARTY-ACTIVE]` MIT, 20★, 2026-04-11. VS extension exposing the **live workspace including unsaved buffers and live diagnostics**, plus `roslyn_find_dead_code` with conservative XAML/test-attribute filtering. Author = Reflexil maintainer (high-signal). Skip if Rider remains daily driver; pick up only on VS sessions.

### 4. `oraios/serena`

- **Repo:** <https://github.com/oraios/serena>
- **Status:** `[3RD-PARTY-ACTIVE]` MIT, **23.8k★**, pushed 2026-05-04, 2,125 commits. Microsoft sponsorship.
- **What:** LSP-backed semantic symbol toolkit — `find_symbol`, `find_referencing_symbols`, IDE-grade navigation across 30+ languages.
- **Install caveat:** README explicitly says **do NOT install via marketplace — install via `uvx` directly.** When run inside Claude Code, auto-disables its redundant text-edit tools to avoid harness conflict.
- **Stacking:** Cross-language semantic layer that no existing plugin covers. Complements `roslyn-codelens-mcp` (C# specific) by handling everything else (Python tooling, TS docs sites, YAML schemas — including Weaver registry YAML).

---

## Tier 2 — Cherry-pick (don't whole-install)

### 4. `Aaronontheweb/dotnet-skills`

- **Repo:** <https://github.com/Aaronontheweb/dotnet-skills>
- **Status:** `[3RD-PARTY-ACTIVE]` MIT, v1.3.2 (2026-04-16), 901★. Aaron Stannard / Petabridge — closest cultural fit to upstream-OTel maintainer work in the entire survey.
- **Pick only:** OpenTelemetry-NET-Instrumentation, `coding-standards`, `type-design-performance` skills. Skip Akka/Aspire/EF unless directly needed.

### 5. Semgrep MCP (CLI-bundled)

- **Source:** Semgrep CLI now bundles MCP as `semgrep mcp` subcommand (since 2025-10).
- **Status:** `[OFFICIAL]` 5,000+ rules, deterministic SAST + secrets + SCA
- **Install:** `claude mcp add semgrep -- semgrep mcp`
- **Note:** standalone repo `semgrep/mcp` is stale; the CLI bundle is the live channel.

### 6. Socket MCP

- **Repo:** <https://github.com/SocketDev/socket-mcp> (2026-04-28)
- **Status:** `[OFFICIAL]` supply-chain `depscore` tool, free tier suffices for solo work
- **Install:** `claude mcp add socket -- npx -y @socketsecurity/socket-mcp`
- **Use:** Run before adding any new NuGet/npm/PyPI package.

### 7. `anthropics/claude-plugins-official` — `code-modernization` + `code-review`

- **Repo:** <https://github.com/anthropics/claude-plugins-official>
- **Status:** `[OFFICIAL]` Anthropic-maintained
- **Install:** marketplace already auto-loaded; `/plugin install code-modernization@claude-plugins-official` and `/plugin install code-review@claude-plugins-official`
- **Stacking:** `code-modernization` orthogonal to `dotnet-architecture-lint` (legacy/COBOL/C++ scope). `code-review` complements `feature-dev` without duplicating `mutation-minded-testing`.

### 8. ast-grep MCP (conditional)

- **Repo:** <https://github.com/ast-grep/ast-grep-mcp>
- **Status:** `[3RD-PARTY-ACTIVE]` (2026-04-21), marked experimental upstream
- **Install:** `claude mcp add ast-grep -- npx -y @ast-grep/mcp`
- **Use:** Structural AST patterns for C# refactors that go beyond text grep — useful when generating semconv constants.

### 9. `github/github-mcp-server` (official)

- **Repo:** <https://github.com/github/github-mcp-server>
- **Status:** `[OFFICIAL]` MIT, **29.5k★**, pushed 2026-05-01, v0.30.3 (Feb 2026)
- **Install:** Run with `--read-only` and toolset allow-listing (`--toolsets repos,issues,pull_requests`)
- **Stacking:** Coexists cleanly with Anthropic's PR-review plugins (those are workflow skills; this gives raw API access). Useful when the agent needs to search across issues/PRs without leaving the session.

### 10. `DimonSmart/NugetMcpServer`

- **Repo:** <https://github.com/DimonSmart/NugetMcpServer>
- **Status:** `[3RD-PARTY-ACTIVE]` 18★, pushed 2026-01-11. **100% read-only.**
- **What:** Downloads NuGet packages and returns actual interface/class/enum definitions from compiled assemblies — dramatically reduces hallucinated API calls. Supports Azure Artifacts, Artifactory, ProGet, Nexus, local folders.
- **Stacking:** Pairs cleanly with Tier 1 #2 (`NuGet.Mcp.Server`): that one resolves CVE state and updates `.csproj`; this one inspects **shape** of installed APIs without writing anything. No overlap.

### 11. `grafana/mcp-grafana` (conditional)

- **Repo:** <https://github.com/grafana/mcp-grafana>
- **Status:** `[OFFICIAL]` Apache-2.0, **2.9k★**, pushed 2026-05-04
- **What:** Official Grafana MCP — Prometheus, Loki, Tempo, dashboards, alerts, incidents. Explicit `--disable-write` flag + granular RBAC via service-account tokens. Exemplary safety profile.
- **Stacking:** Only relevant if running a Grafana / Tempo stack. Complements OTel work on the *consumer* side once instrumentation is shipping traces.

### 12. Cognition DeepWiki (remote, no install)

- **Endpoint:** `https://mcp.deepwiki.com/mcp`
- **Status:** `[OFFICIAL]` Cognition AI, hosted; no-auth for public repos
- **Tools:** `ask_question`, `read_wiki_structure`, `read_wiki_contents` — read-only over AI-generated wikis for any indexed public GitHub repo.
- **Stacking:** Complementary to Context7 (DeepWiki indexes repos; Context7 indexes library docs). Avoid `regenrek/deepwiki-mcp` — author confirms it's broken since DeepWiki cut off scraping.

---

## Tier 3 — DIY opportunity: the FP / purity gap

**The functional / purity / immutability space is mostly raw Roslyn analyzers without MCP wrappers.** This is a real, fillable gap given existing infra (`hookify` can wire arbitrary commands, `code-simplifier` and `elegance-pipeline` need concrete signal).

### Wrap candidates (analyzer → custom plugin via hookify)

| Analyzer | Repo | Status | Use |
|---|---|---|---|
| **PurelySharp** | <https://github.com/alexyorke/PurelySharp> | `[ANALYZER-ONLY]` MIT, alpha, 2★, not on NuGet | Eight diagnostics (PS0002–PS0008) around `[EnforcePure]` / `[Pure]`. Pin commit, don't track main. |
| **Apex.Analyzers.Immutable** | <https://github.com/dbolin/Apex.Analyzers> | `[3RD-PARTY-ACTIVE]` MIT, 15★, NuGet 1.2.7 | Eight rules (IMM001–IMM008): readonly fields, immutable property types, `this`-leak warnings. Production-quality. |
| **ErrorProne.NET** | <https://github.com/SergeyTeplyakov/ErrorProne.NET> | `[3RD-PARTY-ACTIVE]` MIT, 1.1k★, last release 2025-07-08 | Struct/readonly correctness, async hazards. Highest-quality immutability-adjacent analyzer in active maintenance. |

### Direct NuGet refs (no MCP needed, just project deps)

| Tool | Repo | Status | Use |
|---|---|---|---|
| **Dunet** | <https://github.com/domn1995/dunet> | `[3RD-PARTY-ACTIVE]` MIT, 876★, v1.16.2 (2026-04-25) | Discriminated unions with native switch-expression exhaustiveness. Mainstream pick. |
| **CSharpFunctionalExtensions.Analyzers** | <https://github.com/AlmarAubel/CSharpFunctionalExtensions.Analyzers> | `[3RD-PARTY-ACTIVE]` MIT, 7★, 15 releases | Catches `.Value` access without `IsSuccess` check — canonical Result&lt;T&gt; misuse. |
| **Sundew.DiscriminatedUnions** | <https://github.com/sundews/Sundew.DiscriminatedUnions> | `[3RD-PARTY-ACTIVE]` MIT, 18★, 52 releases | Real exhaustiveness analyzer (not just generator). |

### Structural template

- **`andrueandersoncs/claude-skill-effect-ts`** (<https://github.com/andrueandersoncs/claude-skill-effect-ts>) — MIT, 8★. Cleanest reference for "how an FP-paradigm plugin should be structured." 22-domain factoring (typed errors, Layers, Ref, Match, Scope) translates directly to LanguageExt / CSharpFunctionalExtensions idioms. Use as template for a future `csharp-functional` skill.

### F# space

- **`jovaneyck/fsi-mcp-server`** (<https://github.com/jovaneyck/fsi-mcp-server>) — `[EARLY]` MIT, 35★. Wraps F# Interactive as MCP REPL. Most useful F# touchpoint that exists.
- No real F# plugin in the official Claude marketplace.

---

## Explicit nulls (don't waste time looking)

- **No Claude Code plugin or MCP for Roslyn analyzer authoring.** When writing the v1.40 → v1.41 migration analyzer, that's greenfield.
- **No FP-purity MCP for .NET.** PurelySharp is the only mover and it's alpha.
- **No real F# Claude Code plugin** in the official marketplace.
- **No FsCheck / CsCheck / Hedgehog MCP wrapper.** Property-based testing is unwrapped territory.
- **No CodeQL or Sonar first-party MCP.** Only community wrappers, none verified-maintained.
- **No SBOM/license MCP for NuGet** that's both maintained and Claude-Code-shaped.

---

## Skip / avoid (with reasons)

| Item | Reason |
|---|---|
| `anthropics/claude-plugins-official` **csharp-lsp** | Duplicates Rider daemon channel; `rider-respect` wins while Rider is daily driver |
| `zircote/csharp-lsp` | Same overlap, smaller, OmniSharp-based |
| `SharpLensMcp` | Heavy refactoring suite overlaps `rider-respect` |
| `RoslynMcpServer` (JoshuaRamirez) | Same overlap |
| `liatrio-labs/otel-instrumentation-mcp` | 8+ months stale, no YAML resolution; overlaps `otelhook` without adding signal |
| `NotMyself/claude-dotnet-marketplace` | Archived 2026-02 |
| `wshobson/commands` | Superseded by `wshobson/agents` — don't stack both |
| `hekmon8/awesome-claude-code-plugins` | 3★, stale Oct 2025; use `hesreallyhim/awesome-claude-code` instead |
| **Snyk MCP / Snyk Studio** | Vendor-locked telemetry; conflicts with auditability stance |
| `Sengtocxoen/sast-mcp` | Single contributor, 6★, missing governance signal |
| ~~**Context7**~~ → moved to **Reconciliations** | (re-verified 2026-05-05: 54.4k★, MIT, pushed 2026-05-04 — heavily maintained. Past tier cut and ContextCrush vuln were patched. Not skip-worthy; use with awareness.) |
| `mcp-ripgrep` | Duplicative with built-in ripgrep |
| `codewithmukesh/dotnet-claude-kit` (whole-install) | Heavy architectural opinions (VSA / CA / DDD) inject prescriptions into every session; cherry-pick individual skills only |
| `egorpavlikhin/roslyn-mcp` | 3 commits, no license, dormant |
| `EHotwagner/FSharp.MCP.DevKit` | Maintainer states "on hold" |
| `ExhaustiveMatching.Analyzer` | Last release 2019 — abandoned |
| `better-clawd` (`x1xhlol/better-clawd`) | Routes through OpenRouter, conflicts with official-Anthropic stance |

---

## Verified marketplaces (mid-2026)

| Marketplace | Owner | Last push | Stars | License | Status |
|---|---|---|---|---|---|
| `modelcontextprotocol/servers` | MCP project | 2026-04-17 | 85k | NOASSERTION | `[OFFICIAL]` reference servers (Filesystem, Git, Memory, Sequential Thinking, Fetch). Avoid `servers-archived` subdir. |
| `anthropics/claude-plugins-official` | Anthropic | 2026-05-04 | 18.5k | n/a | `[OFFICIAL]` |
| `punkpeye/awesome-mcp-servers` | punkpeye | 2026-05-02 | 86k | MIT | `[3RD-PARTY-ACTIVE]` largest community catalog of MCP servers |
| `wshobson/agents` | Wahid Shobson | 2026-05-02 | 34.7k | MIT | `[3RD-PARTY-ACTIVE]` |
| `davila7/claude-code-templates` | Daniel Avila | 2026-05-05 | 26.7k | MIT | `[3RD-PARTY-ACTIVE]` (bundles `wshobson/agents` + `obra/superpowers` — install à la carte) |
| `hesreallyhim/awesome-claude-code` | hesreallyhim | 2026-04-27 | 42.5k | NOASSERTION | `[3RD-PARTY-ACTIVE]` (list, not marketplace) |
| `ComposioHQ/awesome-claude-plugins` | Composio | 2026-05-01 | 1.6k | none | `[3RD-PARTY-ACTIVE]` (list; skip the `connect-apps` plugin — auto-acts across 500+ apps) |
| `Aaronontheweb/dotnet-skills` | Aaron Stannard | 2026-04-16 | 901 | MIT | `[3RD-PARTY-ACTIVE]` |
| `codewithmukesh/dotnet-claude-kit` | Mukesh Murugan | 2026-03-24 | 328 | MIT | `[3RD-PARTY-ACTIVE]` (heavy opinions — cherry-pick) |
| `wshobson/commands` | Wahid Shobson | 2025-10-12 | 2.4k | MIT | `[3RD-PARTY-STALE]` (superseded) |
| `NotMyself/claude-dotnet-marketplace` | Bobby Johnson | 2026-01-19 | 1 | MIT | `[3RD-PARTY-STALE]` |
| `hekmon8/awesome-claude-code-plugins` | hekmon8 | 2025-10-10 | 3 | CC0 | `[3RD-PARTY-STALE]` |
| `xiaolai/claude-plugin-marketplace` | xiaolai | varies | varies | varies | `[CAUTION]` ships hooks (TDD-Guardian, UI-Tokenize, Docs-Guardian) that intercept Write/Edit. Cherry-pick individual plugins only. |
| `VoltAgent/awesome-claude-code-subagents` | VoltAgent | varies | varies | varies | `[CAUTION]` same auto-execute hook risk. Cherry-pick only. |

---

## Plugin-author harnesses

| Tool | Repo | Status | Note |
|---|---|---|---|
| Claude Code Development Kit | <https://github.com/peterkrueck/Claude-Code-Development-Kit> | `[3RD-PARTY-ACTIVE]` 1.3k★ (2026-04-07) | Heavier scaffold + secret-scanner hook + deny-list. Skip if `hookify` already encodes those rules. |
| `davila7/claude-code-templates` CLI | as above | `[3RD-PARTY-ACTIVE]` | Scaffolder + dashboard for installed plugins; richer alt to built-in `/plugin` UI |
| `claude mcp serve` | first-party CLI | `[OFFICIAL]` | Turns Claude Code itself into an MCP server (cross-IDE reuse) |

`cc-plugin-eval` (existing) is at the front of this category — nothing better exists publicly today.

---

## Reconciliations (v2 corrections — 2026-05-05)

Three items where a second cross-reference contradicted the original survey. Re-verified against GitHub API:

- **`upstash/context7`** — original report said "skip / avoid" citing Jan-2026 free-tier cut + Feb-2026 ContextCrush vuln. Re-verification: 54.4k★, MIT, pushed 2026-05-04, latest release `@upstash/context7-mcp@2.2.3` on 2026-04-29 — heavily maintained, vuln patched. **Corrected to: use with awareness.** Light overlap with Microsoft Learn for MS-stack docs; Context7's coverage of general OSS libraries is much broader. Free hosted endpoint at `https://mcp.context7.com/mcp`.
- **`liatrio-labs/otel-instrumentation-mcp`** — original said stale. Cross-reference disputed this. Re-verified: last meaningful **code** commit was 2025-08-21 (v0.5.0); commits since are docs-only (Dec 2025, Mar 2026). **Original "skip" stands** — but note their explicit Weaver custom-registry support claim, which is the closest existing thing to a Weaver MCP if `open-telemetry/weaver`'s own MCP subcommand turns out unsuitable. Watch for Liatrio resuming code commits.
- **`JoshuaRamirez/RoslynMcpServer`** — original said skip due to refactoring overlap with `rider-respect`. Cross-reference disagreed. Verified: 9★, pushed 2026-03-10. **Tradeoff**: refactorings overlap, but it's headless `dotnet tool install -g RoslynMcp.Server`, every refactoring supports `preview` parameter with atomic file writes + rollback, and 41 tools cover dead-code + complexity metrics that Rider's daemon doesn't expose as MCP tools. **Pick one alternative path:** keep `rider-respect` for daily IDE flow, OR install RoslynMcpServer for headless/CI scenarios where Rider isn't available. Don't run both for the same workspace.

## Concrete next moves

1. `claude mcp add weaver-registry -- weaver registry mcp --registry <pinned-1.41-path>` — highest-leverage single addition for OTel work.
2. Install **Serena** via `uvx` (NOT marketplace, per Serena README): `uvx --from git+https://github.com/oraios/serena serena-mcp-server` — biggest cross-language QoL upgrade.
3. Add `Aaronontheweb/dotnet-skills` marketplace; install OTel + coding-standards skills only.
4. `claude mcp add github -- github-mcp-server stdio --read-only --toolsets repos,issues,pull_requests` — official GitHub access, read-only.
5. Decide whether the `csharp-purity` plugin (PurelySharp + Apex.Analyzers.Immutable via `hookify` Stop-hook) is worth a weekend — clear marketplace gap, fits stated principles, wiring already exists.
6. Run `/fewer-permission-prompts` after Tier 1 installs to harvest new bash/MCP allowlist entries.

---

## Sources

### Tier 1 / 2

- <https://github.com/open-telemetry/weaver>
- <https://learn.microsoft.com/en-us/nuget/concepts/nuget-mcp-server>
- <https://github.com/MarcelRoozekrans/roslyn-codelens-mcp>
- <https://github.com/sailro/RoslynMcpExtension>
- <https://github.com/oraios/serena>
- <https://github.com/Aaronontheweb/dotnet-skills>
- <https://semgrep.dev/docs/mcp>
- <https://socket.dev/blog/socket-mcp>
- <https://github.com/anthropics/claude-plugins-official>
- <https://github.com/ast-grep/ast-grep-mcp>
- <https://github.com/github/github-mcp-server>
- <https://github.com/DimonSmart/NugetMcpServer>
- <https://github.com/grafana/mcp-grafana>
- <https://mcp.deepwiki.com/mcp> (hosted endpoint)

### FP / purity

- <https://github.com/alexyorke/PurelySharp>
- <https://github.com/dbolin/Apex.Analyzers>
- <https://github.com/SergeyTeplyakov/ErrorProne.NET>
- <https://github.com/domn1995/dunet>
- <https://github.com/AlmarAubel/CSharpFunctionalExtensions.Analyzers>
- <https://github.com/sundews/Sundew.DiscriminatedUnions>
- <https://github.com/mcintyre321/OneOf>
- <https://github.com/jovaneyck/fsi-mcp-server>
- <https://github.com/EHotwagner/FSharp.MCP.DevKit>
- <https://github.com/andrueandersoncs/claude-skill-effect-ts>

### Marketplaces / tooling

- <https://github.com/modelcontextprotocol/servers>
- <https://github.com/punkpeye/awesome-mcp-servers>
- <https://github.com/wshobson/agents>
- <https://github.com/davila7/claude-code-templates>
- <https://github.com/hesreallyhim/awesome-claude-code>
- <https://github.com/ComposioHQ/awesome-claude-plugins>
- <https://github.com/codewithmukesh/dotnet-claude-kit>
- <https://github.com/SocketDev/socket-mcp>
- <https://github.com/sourcegraph-community/sourcegraph-claudecode-plugin>
- <https://github.com/upstash/context7>
- <https://github.com/peterkrueck/Claude-Code-Development-Kit>

### Stale / avoided (linked for traceability)

- <https://github.com/NotMyself/claude-dotnet-marketplace>
- <https://github.com/wshobson/commands>
- <https://github.com/WalkerCodeRanger/ExhaustiveMatching>
- <https://github.com/zircote/csharp-lsp>
- <https://github.com/egorpavlikhin/roslyn-mcp>
