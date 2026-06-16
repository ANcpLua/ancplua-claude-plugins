# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Older pre-launch entries are summarized in the [History](#history) section.

## [Unreleased]

### Added

- **`charon` plugin (0.1.0 → 0.3.0)**: PR-to-merge ferry that never waits forever. Started as a full-vision v0.1.0 (#293) — a clock-independent `Stop` hook that ferries a GitHub PR to merge, proposes-and-pauses on force operations, and keeps a GitHub-only seam with a dispatch-table extension model — then collapsed to one arg-dispatched command (#294). v0.2.0 made it self-bootstrapping (#298): "merge my PR" works with no slash command. v0.2.1 (#309) honors an explicitly named PR over stale local state and skips solo-bootstrap for fleet lookouts. v0.3.0 removes the `reviewer-triage` skill — reviewer feedback is handled inline by the `review-changes` handler in one pass, no sub-agents, no cross-plugin skill invocations (the skill text was gifted to `ANcpLua/ancplua-codex-skills`).
- **`derot` plugin (0.2.0)**: Truth-drift / doc-rot auditor. `/depmigrate` (#297) is a refutation-gated package→new-API migration: it reads the canonical upstream source, detects what changed, rewrites this repo's usages, deletes obsolete glue, and validates — every non-trivial finding survives an adversarial refutation before it is applied. `/derot` proposes the dependency changes; `/depmigrate` applies them.
- **`nihil` plugin (0.3.0)**: First-principles repository transformation ("Touch of God"). #286 merged the pantheon (Odin, Ma'at, Shiva, Athena) into the shipped plugin as summonable namespaced `nihil-*` workflows. v0.3.0 (#291) added `/nihil:raze` — a root-authority, write-capable mode — plus a universal secret brake. Always read-only by default; it plans and delegates write execution to the specialist gods.
- **`tomevault-publish` plugin (0.1.0)**: Publishes a skill, config, or plugin to TomeVault as a high-grade Tome, and explains the Skill / Tome / AGENTS.md model and grading rubric behind it. Corrected against the live TomeVault rubric (#282, #288); `chore` #290 added `tome.json`, the JSON Tome manifest for the marketplace.
- **`cc-plugin-eval` plugin (0.1.0 → 0.2.1)**: New **CC710** check (#304) flags subagent references that resolve to nothing — an agent/skill that names a teammate which no manifest provides. #308 made the CC710 directory walk a portable recursive `readdir` and synced `package.json` to 0.2.0. v0.2.1 fixes the frontmatter parser: multi-line quoted scalars (backslash-escaped breaks, `\uXXXX`/escaped-space sequences — the exact shape the Codex marketplace migration generates) parsed as "Unexpected indentation" and produced false CC201/CC205/CC213 failures; quoted scalars are now folded and unescaped per YAML 1.2.

### Changed

- **`exodia` plugin (→ 3.0.1)**: v3.0.0 (#305) is a breaking collapse — `turbo-fix` and `fix-pipeline` fold into one arg-dispatched `/exodia:fix` (`severity P0|P1|P2|P3`, `parallelism standard|maximum`). The `deep-debugger` phantom was repointed: #300 pointed it at a real agent and deleted dead shell helpers, #302 settled it on `general-purpose` (the `deep-think-partner` slot was unfit for the debugger role). v3.0.1 (#310) corrected the `/exodia:fix` P0 invocation, agent counts, and ARCHITECTURE after the v3 collapse.

### Removed

- **AGENTS.md + GEMINI.md single-source / render model (#289, #299)**: The admin-authorized root cleanup (#289) deleted `AGENTS.md` and `GEMINI.md` (the agent-config single source plus its one generated copy) along with the entire `tooling/` tree (`weave-validate.sh`, `sync-marketplace.sh`, the plugin template) and several stale `docs/` guides — all unused for ~2 weeks. #299 then retired the now-dead "Edit AGENTS.md only; regenerate via TomeVault" contract that ~6 carriers still pointed at: **CLAUDE.md is now canonical** (the only config carrier present at HEAD, auto-loaded by Claude Code), with `.cursor/` and `.windsurf/` copies hand-maintained. `.github/copilot-instructions.md` remains a separate hand-maintained document.

### Fixed

- **`safety-nets` plugin (0.1.1 → 0.1.2)**: `slnx-sync` no longer false-positives on `.csproj` that are deliberately not part of the solution. The on-disk walk now prunes two cases before flagging unregistered projects: (1) **git-ignored directories**, resolved once up front via `git ls-files -oi --exclude-standard --directory`, so vendored sample/reference repos dropped into a working tree (e.g. an `eShop/`, `Paperless/`, `TourPlanner/`, `InventoryTracker/` checkout sitting next to the real solution) are skipped; and (2) **nested independent solution roots** — any sub-directory below the `.slnx` that carries its own `.sln`/`.slnx`, i.e. an isolated test fixture (the `Arqio.DependencyInspector` `TestAssets` mini-solutions, including a deliberately-circular `ProjectA`↔`ProjectB` fixture that would break the build if registered). Previously these surfaced as dozens of bogus "not registered in .slnx" entries demanding `<Project>` additions that would have pulled unrelated apps — and a circular reference — into the main build. The git lookup is best-effort and narrowly guarded: it tolerates only git-absent (`OSError`) or the 10s timeout (`subprocess.SubprocessError`) and otherwise propagates loudly; the nested-solution guard works even without git. Genuine unregistered projects are still flagged.

- **`nuget-opensrc` plugin (0.1.0 → 0.1.1)**: `bin/nuget-opensrc` now resolves SemVer2-only versions of packages that also have stable releases. Previously, a request like `Microsoft.Extensions.AI@9.0.0-preview.9.24556.5` would hit `registration5-semver1`, get a `200` with the stable-only list (semver1 filters out dotted-prerelease + `+`-build-metadata versions), fail to find the requested version inside that body, and report `version not found` — even though the version is real and lives on `registration5-gz-semver2`. The fix re-checks `gz-semver2` whenever a specific `@version` isn't found in the semver1 body (symmetric with the existing 404 fallback). Same change collapses the three duplicated `AbortController`/`setTimeout` blocks into one `fetchWithTimeout` helper (the bug fix added a fourth fetch site; four near-duplicates would have been worse than one helper). `info` output gained a `published` line (ISO 8601 from `catalogEntry.published`, marked `(unlisted)` when NuGet has the `1900-01-01` sentinel) so you can see how old the resolved build commit is; `path` now writes the resolved `Pkg@version -> owner/repo#commit` to stderr before invoking `opensrc` so the resolution outcome is visible without re-running `info`. `plugin.json` description synced up to match `marketplace.json` (was the shorter of the two).

### Added

- **`nuget-opensrc` plugin (0.1.0)**: Commit-pinned NuGet→GitHub source fetcher for coding agents. Wraps `opensrc` with NuGet V3 catalog metadata (`registration5-semver1` → fallback to `registration5-gz-semver2` for SemVer2/prerelease) so `Microsoft.OpenTelemetry@1.0.2` resolves to `microsoft/opentelemetry-distro-dotnet#63c50282ab99f176128e926e013330a19cde8454` — the exact commit the package shipped from, not the default branch. Three surfaces: `/nuget-opensrc <Pkg>[@<ver>]` slash command, `bin/nuget-opensrc` Node CLI with `path` / `info` / `--help` subcommands, and `skills/opensrc-research/SKILL.md` autonomous skill that fires on library-behavior questions to ground answers in source instead of guessing. Refuses to fall back to `projectUrl` when `repository.url` is missing (Microsoft packages have `projectUrl=https://dot.net/` which lies); refuses to silently default to `main` when `repository.commit` is missing (warns on stderr and you opt in). Includes CodeRabbit-applied portability fixes (15s fetch timeouts, `$HOME`-based cache-path documentation).

### Changed

- **`html-effectiveness` plugin (1.1.0 → 1.2.0)**: Catalog grew from 20 → 21 patterns. New pattern `21-agent-spawn-deck` (category `meta-orchestration`) operationalizes the multi-agent fan-out idiom — HTML carries N teammate cards, each with a `<pre>` block of a ready-to-paste prompt, plus a per-card `Copy prompt` / `Copy claude -p invocation` button and a toolbar-level `Copy ALL as fan-out bash` master button that emits a parallel bash script with `claude -p ... &` invocations and a final `wait` barrier. Pattern is inspired by the shadow-ai-inventory pattern (the "Agent Team Prompt — Ready to Run" idiom another agent used). New top-level `palettes` block in `patterns.json` with two named palettes — `coral` (default, the Anthropic Coral DNA for reports/plans/editors) and `github_dark` (for codebase audits / CI dashboards / fan-out decks / terminal-adjacent tooling); pattern 21 defaults to `github_dark`. New `triggering_principles.composition` rule: tasks that split across deliverables should emit multiple linked .htmls, and tasks that parallelize over many items should default to `21-agent-spawn-deck` instead of one giant report. New `triggering_principles.live_data_opt_in` rule for HTMLs that fetch from a local http.server. Bundled `assets/agent-spawn-deck-demo.html` (~21 KB) is a concrete proof: four teammate cards (empty-scanner / fork-ahead-scanner / stub-detector / review-resolver) scoped to a slice of Alexander's 349-repo cleanup (5 + 14 + 15 + 59 = 93 repos across the four scans), each card has the full GH API invocation steps + verdict schema + write-to-JSON-shape, and the master button assembles a parallel `claude -p` fan-out script. Plugin version bump to 1.2.0; marketplace.json synced.

- **`html-effectiveness` plugin (1.0.0 → 1.1.0)**: `references/patterns.json` decision tree expanded from 20 English-only single-phrase triggers to bilingual (English + German) intent-rich triggers per pattern (5–12 phrases each, ~250 total), with semantically adjacent paraphrases ("recap", "wochenrückblick", "what did we ship") rather than literal-only matches. New top-level `triggering_principles` block instructs Claude explicitly on fuzzy matching (case-insensitive, typo-tolerant, intent-not-phrase, multilingual, prefer-interactive-pattern-on-ambiguity, be-pushy). `SKILL.md` description field rebuilt to be eager-firing on 50+ trigger phrases mixed German/English with examples table for intent→pattern resolution. Pinned canonical local clone path to `/Users/ancplua/RiderProjects/thariq-html-effectiveness` (branch `main`) with clone-if-missing instruction, plus an explicit "do not modify the upstream clone in place" rule. Plugin version bump to 1.1.0; marketplace.json version field synced.

### Added

- **`html-effectiveness` plugin (1.0.0)**: Operationalizes Thariq Shihipar's [html-effectiveness](https://github.com/ThariqS/html-effectiveness) catalog as a routing skill. `references/patterns.json` lists 20 canonical patterns (triage board, status report, code review, design system, prompt tuner, implementation plan, feature-flags editor, etc.) with `if_user_says` triggers and `use_pattern` IDs; `SKILL.md` instructs Claude to match the user's intent against `decision_tree`, then study the canonical pattern at `~/RiderProjects/thariq-html-effectiveness/<pattern.file>` and replicate with the user's real data. Anthropic Coral DNA tokens (`#FAF9F5`, `#D97757`, Lora serif) baked into `references/patterns.json:design_tokens`. Bundled `assets/otel-semconv-demo.html` is a concrete proof on the side-by-side pattern: YAML | generated C# | diff against last generation, filterable to breaking-only/added/deprecated, with a "Copy upgrade-notes" button that exports the visible groups as CHANGELOG-ready markdown — drop-in for the ANcpLua OTel semconv generator. Triggers eagerly on "report", "dashboard", "triage", "status", "postmortem", "implementation plan", "feature flag editor", "prompt tuner", "annotated diff", "side by side", "explainer with interaction" — anywhere a markdown wall would be skimmed instead of used.
- **`claudemd-curator` plugin (0.1.0)**: Project-memory audit and curation workflow for `CLAUDE.md`, `AGENTS.md`, `.claude.local.md`, and `.claude/rules/*.md`. Ships an approval-gated `claudemd-curator` skill, `/revise-claudemd` command, quality rubrics, update templates, and example artifacts adapted from `anthropics/claude-plugins-official`.
- **`session-debrief` plugin (0.1.0)**: Claude Code session reporting workflow that turns local transcript JSONL data into a self-contained HTML debrief with token, cache, subagent, skill, expensive-prompt, anomaly, and optimization views. Ships the `session-debrief` skill, bundled Node.js analyzer, and interactive HTML template adapted from `anthropics/claude-plugins-official`.
- **`automation/` directory (cron runner infra)**: Cron-triggered runner that maintains hygiene across the 5 working repos (`qyl`, `ANcpLua.NET.Sdk`, `ANcpLua.Roslyn.Utilities`, `ANcpLua.Analyzers`, `ANcpLua.Agents`). Single policy at `automation/policy.md` (grounding, quick-gate fast-exit, live-evidence pre-action, action policy, check-wait, output schema). Eight cron-slot templates in `automation/templates/` covering bug scan, weekly release notes, CI failure summary, dependency drift, untested-paths via `$yeet`, pre-tag verification, outdated-deps upgrades, and weekly project-`CHANGELOG.md` update. Helper scripts: `quick-gate.sh` (`NO_WORK=1` fast-exit, exit 10 when work exists), `log-entry.sh` (FIFO-cap-10 prepend to `automation/RUN-LOG.md`, separate file from this project `CHANGELOG.md`), `bench.sh` (per-host process-level CPU/RSS sampling for parallel-agent benchmarks), `ghostty-launch.sh` (tmux session with one pane per template; user attaches inside Ghostty). Project `CHANGELOG.md` and `automation/RUN-LOG.md` are deliberately separate — humans curate the former, the runner FIFOs the latter.
- **`release-pilot` plugin (0.1.0)**: Autonomous .NET release driver for the four ANcpLua framework repos (`ANcpLua.NET.Sdk`, `ANcpLua.Analyzers`, `ANcpLua.Roslyn.Utilities`, `ANcpLua.Agents`). Detects release pattern from `.github/workflows/nuget-publish.yml` — Pattern A (push-to-main publishes, NET.Sdk only) vs Pattern B (tag-triggered, the other three) — and dispatches the correct action. Never edits `<Version>` lines (CI computes from `git describe` or `${GITHUB_REF_NAME#v}`); never retags (ghost-tag rule: a tag on a build-broken commit stays on the remote, so `bin/next-version.sh` bumps past `max(remote-tag, max-stable-nuget)`). Out-of-band publish (NuGet ahead of git tag) hard-stops with exit code 2 — no auto-bump past it. Narrow auto-fix allowlist: `dotnet format whitespace` only — anything else hard-stops with a verdict (`trivial-format` / `flake` / `hard`). Cap: 1 auto-fix iteration + 1 `gh run rerun --failed` for cross-OS matrix flakes. Surfaces the `environment: nuget` manual-approval gate on `Roslyn.Utilities` and `Agents` runs as expected behavior, not a CI hang. Entry point: `/release-pilot` from inside one of the four repos.
- **`mutation-minded-testing` plugin (0.1.0)**: Behavior-first test-quality stack. Ships 4 agents (`architecture-reviewer` for testability smells, `senior-tester-judge` grading STRONG/ACCEPTABLE/WEAK/KILL by kill power, `expressive-verifier-improver` rewriting weak tests via a pattern catalogue, `branch-coverage-implementer` driving 100% branch coverage with high-signal tests only) and 4 skills (`reviewing-testability`, `judging-test-quality`, `improving-weak-tests`, `mutation-resistant-coverage`). Rejects coverage-padding and TDD ritual in favour of mutation resistance. Entry point: `/mmt [scope]` orchestrates the four phases. Core rule: coverage is a floor, kill power is the signal — no `toBeTruthy`/`toBeDefined` as primary assertions, no `toHaveBeenCalled` alone, no `.length === N` without content, no behavior left with only a happy-path test.

### Removed

- **`qyl-lsp` plugin**: Deleted from marketplace. Content was qyl-specific LSP implementation guidance that belongs in the qyl repo itself — authoritative SKILL.md now lives at `~/qyl/.claude/skills/qyl-lsp/SKILL.md` (verified against real wiring: `[QylSkill(QylSkillKind.Debug)]` attribute + `Qyl.Generated.QylToolManifest` generator path + `Hosting/QylMcpServiceCollectionExtensions.cs` DI). This repo-held version was 2 months stale and documented three fabricated seams (`SkillRegistrationExtensions.cs`, `Program.cs ConfigureCommonServices()`, manual `WithTools<LspTools>()`) that do not exist in current qyl. Single source of truth now in qyl. Also removed `qyl-lsp` commit-scope from `.coderabbit.yaml`.

### Changed

- **Opus 4.7 / 1M context readiness audit**: Cross-plugin pass upgrading agents and commands to match the Claude Max x20 + Opus 4.7 + 1M context tier. Bumps `model: sonnet` → `model: opus` where the role is full analysis/coding/architecture (not research-only). Raises `effort:` where the cognitive load justifies it (`low` → `medium` for verification; `medium` → `high` for analysis; `medium` → `xhigh` for multi-phase orchestration). Keeps Sonnet/Haiku explicit pins where they are cost-bounded by design (council brain-trust agents, haiku janitor) or explicitly research-only (elegance scout, council researcher/synthesizer/clarity). Details per plugin in entries below. Full findings in `docs/audit-2026-04-17-opus-4-7-readiness.md`. (qyl plugin entry from the original audit no longer applies — qyl was removed from this marketplace in PR #210; authoritative SKILL.md lives in the qyl repo.)
- **`feature-dev` plugin (1.3.0)**: All three agents (`code-reviewer`, `code-explorer`, `code-architect`) bumped from `model: sonnet` to `model: opus`. `effort: high` on reviewer, explorer, and the `/review` command (architect already high). CLAUDE.md note corrected.
- **`elegance-pipeline` plugin (1.1.0)**: `elegance-scout` agent (4 parallel instances) pinned from generic `model: sonnet` to explicit `model: claude-sonnet-4-6` (latest sonnet, research-only role justified per user policy). `effort: low` → `medium` — scouts perform file-by-file elegance scoring, not a lookup. Plugin description updated to reflect the explicit model pin.
- **`ancplua` plugin (0.2.0)**: `worker` agent bumped from `model: sonnet` / `effort: low` to `model: opus` / `effort: xhigh`. Self-directing agentic implementer that runs full DOD items in an isolated worktree with Playwright-oracle verification — this is the canonical "coding/agentic" role that the user policy explicitly targets for Opus 4.7 + xhigh.
- **`council` plugin (1.3.0)**: `opus-captain` bumped `claude-opus-4-6` → `claude-opus-4-7`. The three Sonnet agents (researcher, synthesizer, clarity) stay on `claude-sonnet-4-6` — the council design is a deliberately cost-bounded parallel brain-trust with research/synthesis/clarity partitioned across Sonnet. Haiku janitor stays on `claude-haiku-4-5-20251001` — explicit cost-bounded bloat-flagger by design.
- **`exodia` plugin (2.2.0)**: `/exodia:deep-think` effort `medium` → `xhigh` (5-agent 3-phase multi-perspective reasoning). `hades` skill effort `high` → `xhigh` (12-agent orchestrator with gates, ledger, permits, and Noble-Phantasm-scale cleanup runs). Haiku-pinned prompt hooks inside the hades skill stay on haiku — they are explicitly cost-bounded enforcement prompts (correct by design, user policy preserves cost-bounded Haiku roles).
- **`design-studio` plugin (1.1.0)**: `/design-studio` command and `design-studio` skill effort `medium` → `high`. Creative direction plus BM25-search-driven design system generation is full analysis + synthesis, not a lookup.
- **`metacognitive-guard` plugin (0.7.0)**: Four command effort bumps. `/deep-analysis` `medium` → `xhigh` (4-phase structured reasoning is the canonical max-reasoning command). `/metacognitive-guard` `low` → `high` (struggle-signal analysis). `/epistemic-checkpoint` `low` → `medium` (verification with WebSearch). `/verification-before-completion` `low` → `medium` (pre-completion evidence check). `/competitive-review` already `high`, kept.
- **`hookify` plugin (0.5.0)**: `conversation-analyzer` agent effort `medium` → `high` (transcript analysis for behavior signals is analysis-heavy, not lookup). `/hookify` command effort `low` → `high` (rule creation from conversation signals is design work). `/hookify:configure` effort `low` → `medium` (interactive edits with AskUserQuestion). `writing-rules` skill effort `low` → `medium` (authoring reference, not passive read). `/hookify:help` and `/hookify:list` stay `low` — pure lookups, justified.
- **METADATA_DRIFT cleanup (6 plugins)**: Synced `plugin.json` ↔ `marketplace.json` descriptions for `design-studio` (1.0.4), `elegance-pipeline` (1.0.4), `exodia` (2.1.5), `hookify` (0.4.2), `otelhook` (0.1.1), and `qyl-lsp` (description-only sync). Capability-snapshot scan went from 6 `METADATA_DRIFT` to 0; `FRESH` count rose from 2/14 to 4/14 (`code-simplifier`, `feature-dev`, `design-studio`, `otelhook`). The other four moved from `METADATA_DRIFT` to `CONTENT_DRIFT` — their descriptions no longer mismatch each other, but still share <30% jaccard overlap with their own `CLAUDE.md` first paragraph. CONTENT_DRIFT cleanup is a separate per-plugin writing pass.

### Added

- **`skill-creator` plugin (1.0.0)**: Consolidated skill creation toolkit. Full lifecycle: scaffold (`init_skill.py`), validate (`quick_validate.py`), evaluate (trigger testing, assertion grading, blind A/B comparison), benchmark (aggregation with variance analysis), optimize descriptions (train/test split, iterative improvement), and package (`.skill` ZIP). Merges three fragmented sources into one plugin with progressive disclosure.
- **`.claude/rules/engineering-principles.md`**: Agent-relevant subset (10 of 26) of Alexander's engineering principles, formatted as `IF <situation> → <principle>` triggers for fast in-session lookup. Auto-loaded by Claude Code from `.claude/rules/`. Pointer to full narrative at `docs/ENGINEERING-PRINCIPLES.md`.
- **`marketplace-tour` capability-snapshot skill (1.1.0)**: Deterministic plugin capability extraction. `bin/plugin-snapshot <name|all>` walks truth files (`CLAUDE.md` → `README.md` → `plugin.json`) + git log + hooks.json and emits structured JSON; `bin/validate-snapshot` enforces the schema with jq and fails loud on drift. Refuses to read `marketplace.json` descriptions as truth — those are stale install metadata. Three-layer drift detection: `METADATA_DRIFT` (plugin.json ≠ marketplace.json), `CONTENT_DRIFT` (jaccard overlap with CLAUDE.md first paragraph <30%), `STALE_<N>d` (mtime soft signal). First run against 14 plugins found only 2 clean (code-simplifier, feature-dev); 6 `METADATA_DRIFT`, 6 `CONTENT_DRIFT`. Fixes: SIGPIPE on `git log | head -10` under `pipefail` (replaced with `git log -n 10`), first-paragraph identity extraction instead of bare heading.
- **`otelhook` plugin (0.1.0)**: Hook-only plugin that injects OTel GenAI + MCP semantic conventions (v1.40.0) as passive context on SessionStart. Sourced from YAML registry (`model/gen-ai/*.yaml`, `model/mcp/*.yaml`), not generated markdown. Covers: GenAI spans (inference, embeddings, retrieval/RAG, create_agent, invoke_agent, execute_tool), MCP spans (client/server with 26 method names), full attribute tables, operation/provider/tool-type enums, events, metrics (GenAI token.usage + duration, MCP operation + session duration), Anthropic token counting rules (cache_read + cache_creation), message JSON schemas, retrieval documents schema, and MCP/GenAI span compatibility rules.

### Removed

- **`plugins/qyl/`** and **`plugins/qyl-lsp/`**: Removed both qyl-focused plugins and their marketplace entries. They belonged to an earlier distribution model where qyl runtime context shipped as a plugin; that responsibility now lives inside the qyl repo itself (`AGENTS.md`, `docs/maf/`, SessionStart hooks).
- **`research/carlini/`**: Removed stale research artifact (`carlini_agent_team_workflow.html`) that had been superseded by the `ancplua` plugin and its `carlini-jr` skill.
- **`.claude/agent-framework.pdf`**: Reference binary that was tracked but no longer needed; the canonical MAF source-of-truth lives in `~/.claude/skills/microsoft-agent-framework/SKILL.md` and the upstream repo.
- **`otelwiki` plugin**: Replaced entirely by `otelhook` (passive GenAI+MCP semconv) for the volatile parts. Stable reference URLs now live in qyl's `genai-architect` agent. All otelwiki references in qyl agents/commands rewired to otelhook.
- **`.github/workflows/trigger-docs.yml`**: Dead workflow that sent `repository_dispatch` (`docs-update`) to `ancplua-docs` on every push to main. Receiver (`ancplua-docs/validate.yml`) only runs self-validation on its own files (format check, docs.json, nav sync, broken links, a11y, OpenAPI) — it never pulls content from `ancplua-claude-plugins`, so the external trigger added zero unique work. Also removes the `DOCS_TRIGGER_PAT` secret dependency that had been failing with 401 since 2026-04-12.

### Fixed

- **`cc-plugin-eval` userConfig evaluator**: Scans manifest-defined MCP/LSP/hook/monitor config file paths, supports array-based `mcpServers` when validating channel server names, and keeps plugin-root path validation for external config reads.
- **`metacognitive-guard` test-deletion rule (0.7.1)**: `TEST_FILE_DELETED` no longer cries wolf on coherent refactors. The old rule flagged any test deletion in the staged diff, which produced a false positive whenever a class was removed alongside its test (delete-class + delete-old-test is a normal refactor pattern, not a shortcut). Rule now stays silent if the same diff also deletes at least one production-source file (`.cs`, `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, `.java`, `.kt`, `.rb`, `.php`, `.fs`, `.fsx`, `.swift`, `.m`, `.mm`, `.cpp`, `.cc`, `.c`, `.h`, `.hpp`). Real shortcut — deleting tests with no corresponding production change — still flags. Strict 1:1 stem matching (`Foo.cs` ↔ `FooTests.cs`) was rejected as too brittle: real-world test names don't always match the class under test (e.g. `ChatClientToolInstrumentationTests` covers `ToolInstrumentingChatClient`).
- **`metacognitive-guard` commit-integrity gating (0.6.9)**: Restored script-level `git commit*` filter in `bin/commit-integrity-hook`. Claude Code 2.1.114 was firing the `PreToolUse(Bash)` hook on every Bash invocation regardless of the `if: "Bash(git commit*)"` declared in `hooks.json`, causing the integrity scan to read `git diff --cached` and block unrelated commands (e.g. `echo hi`) whenever a deleted test file or other "shortcut pattern" was staged. Wrapper now parses `tool_input.command` from stdin (jq with grep fallback), strips leading `cd ... &&` / `;` prefixes, and exits silently for non-commit Bash. Defense-in-depth — the `if:` filter is still declared in case the harness honors it.
- **`docs/ARCHITECTURE.md` `.claude/` tree**: Listed `rules/`, `settings.json`, and `settings.local.json` together (previously documented only one or the other depending on which session touched the file).
- **Claude Code Review workflow**: Allow `dependabot[bot]` and `renovate[bot]` PRs to be reviewed by adding `allowed_bots` to `claude-code-action`. Previously, bot-authored PRs were rejected with "non-human actor" error.
- **`qyl-lsp` hooks schema (0.1.1)**: Fixed two issues preventing plugin installation. Removed invalid `"hooks"` field from plugin.json (hooks are auto-discovered from `hooks/hooks.json`). Rewrote hooks.json from flat array format to correct nested object schema matching all working plugins.

### Added (older — pre-merge from main)

- **`qyl-lsp` plugin (0.1.0)**: LSP code intelligence blueprint for qyl. SessionStart hook
  detects missing `src/qyl.mcp/Tools/Lsp/` surface and injects implementation guidance. Skill
  encodes the full construction plan: 6 deterministic function tools (goto-definition,
  find-references, symbols, diagnostics, prepare-rename, rename), 12-file runtime stack,
  DI/skill-bucket registration following DebugTools/RiderMcpProxy pattern, server targets
  (csharp-ls + typescript-language-server), and phase-2 Loom bridge with stacked attribute
  pattern. Placement rule: qyl.mcp serving plane, NOT qyl.collector.
- **`qyl:audit` skill (1.2.0)**: Version-aware architectural truth engine. `/qyl:audit` with
  6 audit domains: compatibility drift, plane boundary violations, generator/runtime parity,
  workflow shape, policy gates, migration blockers. Reads exact sources of truth and compares
  to observed repo state. 7 reference files encode evaluator knowledge. Plain markdown output
  with file:line citations.
- **`qyl` governing skill (1.1.0)**: Three-layer distribution model (ADR-0002). Encodes qyl
  as a compile-time OS for agent workflows — Loom compiler pipeline (attributes → generator →
  descriptors → AIFunction), 7 bounded planes, MAF execution model, and 5 architectural
  invariants. 4 Loom-grounded evals, OpenAI agent adapter, distributable via `npx skills add`.
- **Plugin executables `bin/` (v2.1.91)**: Migrated all 16 hook scripts across 6 plugins from
  scattered directories to `bin/` with shebangs. Commands no longer need `bash`/`python3`
  prefix. Updated plugin template with `bin/` convention. Version bumps:
  - dotnet-architecture-lint 1.1.4
  - hookify 0.4.1
  - metacognitive-guard 0.6.7
  - exodia 2.1.4
  - ancplua-project-routing 2.0.2
- **`hookify` action: execute (0.4.0)**: New third action type alongside `warn` and `block`.
  Runs a shell command after Write/Edit/MultiEdit via PostToolUse. Variables shell-quoted to
  prevent injection. Command failure returns `additionalContext` warning, never crashes.
  Requires Claude Code >= 2.1.90. Three example templates: `format-cs`, `format-prettier`,
  `format-python`.
- **`marketplace-tour` plugin (1.0.0)**: Interactive live demos of all marketplace plugins.
  Version-gates features requiring Claude Code >= 2.1.90. Reads marketplace.json for plugin
  discovery, runs guided walkthroughs per plugin with cleanup. Invoked via
  `/marketplace-tour:tour`.
- **Frontmatter modernization (13 plugins)**: Cross-referenced Claude Code 2.1.x release notes
  against all 15 plugins and applied 12 modernization items:
  - `effort:` on 11 agents that lacked it (council sonnet-*, feature-dev *,
    qyl-instrumentation specialists)
  - `disallowedTools: [Edit, Write]` on 3 read-only agents (elegance-scout, elegance-judge,
    code-explorer)
  - `background: true` on deep-think-partner (2.1.60+)
  - `isolation: worktree` on 9 swarm agents (ancplua worker + 8 calini agents) (2.1.49+)
  - `memory: project` on 10 agents (8 calini + 2 opus-captains) (2.1.33+)
  - `if:` conditional hook filtering on 3 PreToolUse hooks (dotnet-architecture-lint,
    metacognitive-guard, hookify) (2.1.85+)
  - `once: true` on 3 SessionStart hooks (ancplua-project-routing, dotnet-architecture-lint,
    exodia)
  - PostCompact prompt hook on exodia for workflow state recovery after compaction (2.1.76+)
  - Skill descriptions trimmed to ≤250 chars on 4 skills (2.1.86 cap)
- **Unified `qyl` plugin (1.0.0)**: Merged qyl-instrumentation + qyl-continuation + calini
  into one plugin. 10 agents, 2 commands (`/observe`, `/calini`), 3 hooks (SessionStart ground
  truth, PreToolUse dead API blocker, Stop auto-continuation). All ghost projects eliminated.
  MAF RC API embedded: both hosted (AddAIAgent/IHostedAgentBuilder) and standalone
  (AsAIAgent) patterns documented. Dead custom APIs blocked (QylAgentBuilder, MapQylAguiChat).
  Correct tech stack: Base UI 1.3.0 (not shadcn), lucide-react (not Phosphor), OTel SDK 1.15.0
  + Semconv 1.40. Replaces: qyl-instrumentation (2.1.3), qyl-continuation (1.0.2), calini
  (0.1.5).
- **Legacy workaround cleanup (7 plugins)**: Replaced script-level workarounds with native
  Claude Code features:
  - `hookify`, `design-studio`: Replaced prose "Load the skill" with `skills:` frontmatter
    (2.0.43)
  - qyl-continuation: `${CLAUDE_PLUGIN_DATA}` for state path (2.1.78), `${CLAUDE_SESSION_ID}`
    for session ID (2.1.9)
  - `metacognitive-guard`: Removed redundant script-level git commit guard — handled by `if:`
    in hooks.json (2.1.85)
  - `dotnet-architecture-lint`: Removed redundant tool name guard — handled by `if:`;
    simplified hades permit to direct file check
  - `elegance-pipeline`: Removed redundant "read-only" prose — enforced by
    `disallowedTools: [Edit, Write]`
  - `calini`: Replaced git-based `.lock` task coordination with SendMessage protocol;
    `${CLAUDE_SESSION_ID}` for test seeding
- **`metacognitive-guard` objective drift watchdog**: Added advisory `objective-watch.py` hook
  on `UserPromptSubmit` and `PostToolUse` to track one lead-agent anchor and inject short
  reminders before silent pivots to other specs, orchestration flows, or shipping steps.
- **`elegance-pipeline` isolated state roots**: Added `--state-dir` support to `pipeline.py`
  so multiple spec-specific pipelines can run in parallel without clobbering
  `.claude/elegance_pipeline/state/`. Prompt rendering now carries the selected state dir
  forward to subagent submit commands.
- **`exodia/eight-gates` primary-anchor guidance**: Documented `.eight-gates/` and `.smart/`
  as singleton defaults, added `GATES_DIR` and `SMART_DIR` examples for per-spec isolation,
  and made Gate 1 record one primary anchor with explicit re-anchor requirement.
- **`otelwiki` (1.0.6 → 1.1.0)**: Synced docs now write to `${CLAUDE_PLUGIN_DATA}/docs/` so
  they survive plugin updates. otel-expert skill and otel-guide agent check PLUGIN_DATA first,
  fall back to PLUGIN_ROOT bundled defaults.
- **`hookify` (0.2.1 → 0.3.0)**: StopFailure hook event support (Claude Code 2.1.78+). New
  `stopfailure.py` handler, `stopfailure` event type for rules, `error_type`/`error_message`
  fields for matching API errors. Example rule: `api-failure-alert.local.md`.
- **Agent frontmatter**: Added `effort` and `maxTurns` to 34 agents across 10 plugins (Claude
  Code 2.1.78+). `effort: high` on deep-thinking agents (opus captains, reviewers,
  deep-think-partner), `effort: low` on haiku-janitor. `maxTurns` caps prevent runaway agents
  (5 for janitor, 10-15 for scouts/verifiers, 20-25 for reviewers/specialists, 30-40 for
  captains/librarians).
- **Skill/command effort levels** (Claude Code 2.1.80+): Added `effort` frontmatter to 7
  skills and 26 commands across 12 plugins. Orchestration → `high`, analysis → `medium`,
  lookups/toggles → `low`.
- **`weave-validate.sh`**: Added version sync check (5→6 total). Hard-fails on
  marketplace.json↔plugin.json version mismatches, soft-warns for plugin dirs not in
  marketplace.
- **`ancplua` plugin (0.1.0)**: Agent operating system — leaderless multi-agent swarms. First
  skill: `carlini-jr` — spawns 2-8 workers that self-select DOD items, implement, and verify
  via Playwright MCP screenshots. No orchestrator. Code is opaque — only observable behavior
  matters. Inspired by Carlini's C compiler team + Zechner's agent loop spec.
- **`qyl-continuation` plugin (1.0.0)**: Smart auto-continuation for Claude Code. Two-phase
  stop hook: heuristic pre-filter eliminates ~80% of unnecessary Haiku calls, Haiku judge
  handles the ambiguous ~20%. Throttled to max 3 continuations per 5-minute window. Based on
  double-shot-latte (MIT).
- **`code-simplifier` plugin (1.0.0)**: Code simplification agent tuned to qyl engineering
  principles. Language-agnostic version that reads CLAUDE.md for project standards. Measures
  elegance as problem-complexity / solution-complexity ratio. Zero suppression tolerance,
  compile-time over runtime, less code is better code. 1 Opus agent.
- **`elegance-pipeline` plugin (1.0.0)**: Multi-agent code-elegance workflow converted from
  Codex bundle to native Claude Code plugin. 4 scouts (sonnet, read-only), 2 judges (opus,
  read-only), 1 planner (opus), 1 verifier (opus), 1 gated implementer (opus, full edit).
  Persistent state manager with stage gates and implementation signal. 3 commands
  (`init`, `status`, `run`), 1 skill, 5 agents.
- **`design-studio` plugin (1.0.0)**: Design intelligence studio merging creative direction
  with data-driven recommendations. 50 styles, 97 palettes, 57 font pairings, 99 UX
  guidelines, 25 chart types, 13 stacks. Pre-delivery checklist includes creative
  distinctiveness check. Python stdlib-only, no pip dependencies.
- **Codex PR review automation**: Added `.github/workflows/codex-code-review.yml` and Codex
  prompts/schemas. Codex now reviews pull requests in a read-only sandbox, returns structured
  verdicts, publishes formal GitHub reviews.

### Fixed

- **Claude Code Review workflow**: Allow `dependabot[bot]` and `renovate[bot]` PRs to be
  reviewed by adding `allowed_bots` to `claude-code-action`. Previously, bot-authored PRs were
  rejected with "non-human actor" error.
- **`qyl-lsp` hooks schema (0.1.1)**: Fixed two issues preventing plugin installation. Removed
  invalid `"hooks"` field from plugin.json (hooks are auto-discovered from
  `hooks/hooks.json`). Rewrote hooks.json from flat array format to correct nested object
  schema matching all working plugins.
- **`metacognitive-guard` objective-watch `.blackboard/` path pollution (0.6.8)**:
  `CLAUDE_PLUGIN_ROOT` is now required; script exits silently when the variable is unset
  instead of falling back to `"."` (cwd). Eliminates residual `.blackboard/` creation in
  project roots.
- **`metacognitive-guard` objective-watch false anchoring**: Ground-up rewrite. Root cause:
  `ANCHOR_PATH_RE` had no word boundary, so repo names matched as nested paths. Fix:
  - Negative lookbehind prevents matching within repo names
  - Narrowed regex to spec-like paths only
  - Filename allowlist instead of blocklist
  - Per-anchor cooldown (60s)
  - Anchor path disk validation
  - Removed `git commit`/`git push` from ship detection
- **README.md**: Removed an accidentally pasted Codex conversion transcript from the GitHub
  review automation section.
- **`metacognitive-guard` subagent filtering (0.5.1 → 0.6.0)**: Added agent_type skip to 3
  hooks that were wasting Haiku calls on subagent events. TaskCompleted prompt now skips
  subagents (in 8-agent teams, saves 7 Haiku calls per task completion). Ralph haiku prompt
  now skips subagents. struggle-inject.sh reads hook input and checks agent_type before
  blackboard read.
- **`weave-validate.sh`**: Skip `claude plugin validate` inside Claude sessions
  (`CLAUDECODE=1`) — prevents silent hang that swallows all output. Added `timeout 15` safety
  net for CI.
- **`qyl-continuation` (1.0.0 → 1.0.1)**: Fixed Python 3.14 regex crash — inline `(?i)` flags
  mid-pattern are now errors. Moved regex patterns to use `re.IGNORECASE` flag parameter.
- **Markdown lint**: Consolidated dual config into single `.jsonc`. 155 → 0 warnings across
  139 linted files.

### Changed

- **`metacognitive-guard` hook `if` filtering (2.1.85)**: Commit integrity hook now uses
  `if: "Bash(git commit*)"` so the harness skips the process spawn entirely for non-commit
  Bash calls. Script-level early-exit removed — harness guarantees filtering.
- **`exodia` runtime compaction**: `fix` and `deep-think` now cache compaction artifacts in
  `.eight-gates/artifacts/` via `session-state.sh`, preserving `findings.json`.
- **`code-simplifier` (1.0.0 → 1.1.0)**: Enhanced agent with Seemann-derived principles —
  correctness over brevity (Position 1), end-state thinking for "less code", explicit rule of
  three for deduplication, test signal-to-noise, decomposition paradox in stop criteria.
- **`includeGitInstructions: false`**: Disabled built-in git instructions in
  `.claude/settings.json` — we have our own commit/PR workflows in CLAUDE.md, saves ~2K
  tokens/turn.
- **`claude-self-obs` (2.0.0 → 3.0.0)**: Deleted standalone TypeScript MCP server — qyl.mcp
  already provides the query tools. Plugin is now 38 lines of declarative JSON: HTTP hooks
  POST raw event JSON to `qyl.collector:5100/api/v1/claude-code/hooks`. Zero TypeScript, zero
  npm, zero processes to manage.

### Removed

- **Orphan cleanup**: Deleted `plugins/qyl-continuation/`, `plugins/qyl-instrumentation/`,
  `plugins/calini/` — merged into `plugins/qyl/` in v1.0.0 but directories were never
  removed.
- **Manual session-test residue**: Deleted `tooling/tests/` prompt harness files and the
  unused `tooling/templates/persistent-agent-worktree-setup.md` template.
- **`claude-self-obs` plugin removed from marketplace**: Hook lifecycle now managed by
  qyl.collector via attach/detach endpoints. Query capabilities provided by qyl.mcp
  (registered globally). Deleted `server/` directory, `.mcp.json`, and bash emit scripts —
  ~300 lines TS + 58K npm dependencies + 210 lines shell eliminated.
- **`metacognitive-guard` PostCompact hook**: SessionStart `"matcher": "compact"` never fired
  after `/compact`. Dead code deleted: `reinject-after-compact.sh` + hooks.json entry.

## History

Pre-launch Unreleased entries and `[1.0.0] - 2026-02-07` were removed from this trimmed
changelog; use git history if that older long-form text is needed.
