# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Older entries live in [docs/archive/CHANGELOG-history.md](docs/archive/CHANGELOG-history.md).

## [Unreleased]

### Changed

- **METADATA_DRIFT cleanup (6 plugins)**: Synced `plugin.json` ↔ `marketplace.json` descriptions for `design-studio` (1.0.4), `elegance-pipeline` (1.0.4), `exodia` (2.1.5), `hookify` (0.4.2), `otelhook` (0.1.1), and `qyl-lsp` (description-only sync). Capability-snapshot scan went from 6 `METADATA_DRIFT` to 0; `FRESH` count rose from 2/14 to 4/14 (`code-simplifier`, `feature-dev`, `design-studio`, `otelhook`). The other four moved from `METADATA_DRIFT` to `CONTENT_DRIFT` — their descriptions no longer mismatch each other, but still share <30% jaccard overlap with their own `CLAUDE.md` first paragraph. CONTENT_DRIFT cleanup is a separate per-plugin writing pass.

### Added

- **`.claude/rules/engineering-principles.md`**: Agent-relevant subset (10 of 26) of Alexander's engineering principles, formatted as `IF <situation> → <principle>` triggers for fast in-session lookup. Auto-loaded by Claude Code from `.claude/rules/`. Pointer to full narrative at `docs/ENGINEERING-PRINCIPLES.md`.
- **`marketplace-tour` capability-snapshot skill (1.1.0)**: Deterministic plugin capability extraction. `bin/plugin-snapshot <name|all>` walks truth files (`CLAUDE.md` → `README.md` → `plugin.json`) + git log + hooks.json and emits structured JSON; `bin/validate-snapshot` enforces the schema with jq and fails loud on drift. Refuses to read `marketplace.json` descriptions as truth — those are stale install metadata. Three-layer drift detection: `METADATA_DRIFT` (plugin.json ≠ marketplace.json), `CONTENT_DRIFT` (jaccard overlap with CLAUDE.md first paragraph <30%), `STALE_<N>d` (mtime soft signal). First run against 14 plugins found only 2 clean (code-simplifier, feature-dev); 6 `METADATA_DRIFT`, 6 `CONTENT_DRIFT`. Fixes: SIGPIPE on `git log | head -10` under `pipefail` (replaced with `git log -n 10`), first-paragraph identity extraction instead of bare heading.
- **`otelhook` plugin (0.1.0)**: Hook-only plugin that injects OTel GenAI + MCP semantic conventions (v1.40.0) as passive context on SessionStart. Sourced from YAML registry (`model/gen-ai/*.yaml`, `model/mcp/*.yaml`), not generated markdown. Covers: GenAI spans (inference, embeddings, retrieval/RAG, create_agent, invoke_agent, execute_tool), MCP spans (client/server with 26 method names), full attribute tables, operation/provider/tool-type enums, events, metrics (GenAI token.usage + duration, MCP operation + session duration), Anthropic token counting rules (cache_read + cache_creation), message JSON schemas, retrieval documents schema, and MCP/GenAI span compatibility rules.

### Removed

- **`.claude/agent-framework.pdf`**: Reference binary that was tracked but no longer needed; the canonical MAF source-of-truth lives in `~/.claude/skills/microsoft-agent-framework/SKILL.md` and the upstream repo.
- **`otelwiki` plugin**: Replaced entirely by `otelhook` (passive GenAI+MCP semconv) for the volatile parts. Stable reference URLs now live in qyl's `genai-architect` agent. All otelwiki references in qyl agents/commands rewired to otelhook.
- **`.github/workflows/trigger-docs.yml`**: Dead workflow that sent `repository_dispatch` (`docs-update`) to `ancplua-docs` on every push to main. Receiver (`ancplua-docs/validate.yml`) only runs self-validation on its own files (format check, docs.json, nav sync, broken links, a11y, OpenAPI) — it never pulls content from `ancplua-claude-plugins`, so the external trigger added zero unique work. Also removes the `DOCS_TRIGGER_PAT` secret dependency that had been failing with 401 since 2026-04-12.

### Fixed

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

Pre-launch Unreleased entries and `[1.0.0] - 2026-02-07` are archived in
[docs/archive/CHANGELOG-history.md](docs/archive/CHANGELOG-history.md).
