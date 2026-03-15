# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`ancplua` plugin (0.1.0)**: Agent operating system — leaderless multi-agent swarms. First skill: `carlini-jr` — spawns 2-8 workers that self-select DOD items, implement, and verify via Playwright MCP screenshots. No orchestrator. Code is opaque — only observable behavior matters. Inspired by Carlini's C compiler team + Zechner's agent loop spec
- **`.github/workflows/claude-code-review.yml`**: Automated PR code review workflow using Claude Code Action. Reviews all PRs on open/sync/ready for code quality, bugs, security, and CLAUDE.md compliance. Uses bundled code-review plugin with restricted tools for security
- ~~`metacognitive-guard` PostCompact hook (0.5.1 → 0.6.0)~~ — **Removed in 0.6.1**: Manual testing confirmed the SessionStart `"matcher": "compact"` hook never fired after `/compact`. Native recovery (compaction summaries + CLAUDE.md auto-reload) handles context recovery without it. Dead code deleted: `reinject-after-compact.sh` + hooks.json entry

### Fixed

- **`metacognitive-guard` subagent filtering (0.5.1 → 0.6.0)**: Added agent_type skip to 3 hooks that were wasting Haiku calls on subagent events:
  - TaskCompleted prompt: now skips subagents (in 8-agent teams, saves 7 Haiku calls per task completion)
  - Ralph haiku prompt: now skips subagents (PostToolUse Write/Edit was firing for every subagent edit)
  - struggle-inject.sh: now reads hook input and checks agent_type before blackboard read (defense-in-depth)
- **Plugin metadata**: Standardized author objects across 5 plugins — council, qyl-instrumentation, design-studio, elegance-pipeline, code-simplifier now use `{name, url}` format (was missing url or had empty email)
- **`metacognitive-guard` (0.5.0 → 0.5.1)**: Fixed epistemic-guard false positive — greedy `.*` in version-check regex matched NuGet prerelease suffixes (e.g., `1.0.0-preview.260304.1`) appearing on the same line. Replaced with `.{0,15}` proximity limit

### Changed

- **Settings cleanup**: Removed `DOTNET_ROOT` env var (unnecessary in plugin repo), removed 2 disabled external plugins from enabledPlugins (chrome-devtools-mcp, playwright)
- **`code-simplifier` (1.0.0 → 1.1.0)**: Enhanced agent with Seemann-derived principles — correctness over brevity (Position 1), end-state thinking for "less code", unfamiliarity != complexity nuance, explicit rule of three for deduplication, test signal-to-noise in simplification step, decomposition paradox in stop criteria, 2 new "never do" items (weaken assertions, guess versions)

### Fixed

- **`weave-validate.sh`**: Skip `claude plugin validate` inside Claude sessions (`CLAUDECODE=1`) — prevents silent hang that swallows all output. Added `timeout 15` safety net for CI
- **`qyl-continuation` (1.0.0 → 1.0.1)**: Fixed Python 3.14 regex crash — inline `(?i)` flags mid-pattern are now errors in Python 3.14. Moved all three regex patterns (`QUESTION_RX`, `COMPLETION_RX`, `NEXT_STEP_RX`) to use `re.IGNORECASE` flag parameter instead

### Added

- **`tooling/templates/persistent-agent-worktree-setup.md`**: Added a reusable prompt template for role-based Claude/Codex worktree setup with `AGENTS.md` as the single source of truth and thin `CLAUDE.md`/`.codex/agent.md` pointer files

- **`qyl-continuation` plugin (1.0.0)**: Smart auto-continuation for Claude Code. Two-phase stop hook: heuristic pre-filter eliminates ~80% of unnecessary Haiku calls (questions, completion signals, addressed tool results, substantial text), Haiku judge handles the ambiguous ~20%. Throttled to max 3 continuations per 5-minute window. Based on double-shot-latte (MIT)
- **`code-simplifier` plugin (1.0.0)**: Code simplification agent tuned to qyl engineering principles. Replaces Anthropic's JS/React-centric code-simplifier with a language-agnostic version that reads CLAUDE.md for project standards. Measures elegance as problem-complexity / solution-complexity ratio. Zero suppression tolerance, compile-time over runtime, less code is better code. 1 Opus agent
- **`elegance-pipeline` plugin (1.0.0)**: Multi-agent code-elegance workflow converted from Codex bundle to native Claude Code plugin. 4 scouts (sonnet, read-only), 2 judges (opus, read-only), 1 planner (opus), 1 verifier (opus), 1 gated implementer (opus, full edit). Persistent state manager with stage gates and implementation signal. 3 commands (`init`, `status`, `run`), 1 skill, 5 agents. All `.codex/` paths rewritten to `${CLAUDE_PLUGIN_ROOT}`, Codex-Spark->sonnet, GPT-5.4->opus, state moved to project-local `.claude/elegance_pipeline/state/`

### Fixed

- **marketplace.json version mismatches**: hookify 0.2.0->0.2.1, metacognitive-guard 0.4.5->0.5.0 (synced with plugin.json)

### Added

- **Codex PR review automation**: Added `.github/workflows/codex-code-review.yml`, `.github/codex/prompts/review.md`, and `.github/codex/schemas/review-output.schema.json`. Codex now reviews pull requests in a read-only sandbox, returns structured verdicts, publishes formal GitHub reviews, and skips PRs that only modify Codex review automation
- **metacognitive-guard `InstructionsLoaded` hook**: Truth beacon now fires on both SessionStart AND InstructionsLoaded — ground truth re-injected when CLAUDE.md/rules are loaded, ensuring authoritative facts arrive after instructions context
- **metacognitive-guard `agent_type` filtering**: Struggle detector and Ralph Loop now skip subagents via `agent_type` field in hook events — prevents wasted haiku calls and false positives from subagent responses
- **`design-studio` plugin (1.0.0)**: Design intelligence studio merging creative direction with data-driven recommendations. Combines `frontend-design` (Anthropic plugin — bold aesthetic philosophy, anti-generic guidelines) with `ui-ux-pro-max` (local skill — BM25 search engine, 750+ CSV rows, design system generator). Single unified workflow: creative direction → `--design-system` CLI → domain/stack searches → implementation with aesthetic precision. 50 styles, 97 palettes, 57 font pairings, 99 UX guidelines, 25 chart types, 13 stacks. Pre-delivery checklist includes creative distinctiveness check. Python stdlib-only, no pip dependencies

### Added

- **`docs/specs/spec-0004-mcp-connector-kit.md`**: Comprehensive spec for building an open-source MCP connector framework with identity federation. Includes: reverse-engineered Gmail MCP OAuth architecture (Anthropic's Express/GCP broker pattern), full MCP auth spec summary (OAuth 2.1 + PKCE + Dynamic Client Registration + Streamable HTTP + Resource Indicators), three-layer strategy (npm package → qyl-connector proof-of-concept → Anthropic Connectors Directory submission), `createMcpConnector()` API design with provider presets (Keycloak, Entra ID, Auth0, Google, generic OIDC), 6 qyl MCP tools for historical telemetry queries, competitive analysis vs Cloudflare `workers-oauth-provider`, security considerations, and Sentry-quality reference patterns
- **`docs/plans/2026-03-03-claude-self-obs-v3-design.md`**: Design doc for v3.0.0 — three-gap analysis (hook ingest endpoint, qyl.mcp registration, standalone server removal), v1→v2→v3 progression table, architecture diagram, acceptance criteria

### Changed

- **`includeGitInstructions: false`**: Disabled built-in git instructions in `.claude/settings.json` — we have our own commit/PR workflows in CLAUDE.md, saves ~2K tokens/turn
- **CLAUDE.md version bump docs**: Softened "DO NOT SKIP" to acknowledge `/reload-plugins` for dev workflows while keeping version bumps mandatory for releases
- **metacognitive-guard (0.4.5 → 0.5.0)**: InstructionsLoaded hook + agent_type filtering
- **`claude-self-obs` (2.0.0 → 3.0.0)**: Deleted standalone TypeScript MCP server — qyl.mcp already provides `qyl.claude_code_sessions`, `qyl.claude_code_timeline`, `qyl.claude_code_tools`. Plugin is now 38 lines of declarative JSON: HTTP hooks POST raw event JSON to `qyl.collector:5100/api/v1/claude-code/hooks`. Zero TypeScript, zero npm, zero processes to manage
- **`claude-self-obs` (1.0.0 → 2.0.0)**: Complete rewrite from bash/jq/curl hooks to HTTP hooks + MCP server. Deleted 210 lines of shell scripts (emit-span.sh, emit-agent-start.sh, emit-agent-stop.sh). Replaced with `type: "http"` hooks that POST directly to a dual-mode MCP server (stdio for Claude tools + HTTP for hook events). Claude can now query its own telemetry via 4 MCP tools: `get_status`, `get_session_timeline`, `get_tool_stats`, `search_events`. In-memory ring buffer stores last 10k events per session
- **`marketplace.json`**: Added claude-self-obs to registry, updated plugin count (9 → 10) and command count (24 → 25)

### Removed

- **`claude-self-obs` plugin removed from marketplace**: Hook lifecycle now managed by qyl.collector via attach/detach endpoints. qyl owns the hooks — users control observability via MCP tools (`qyl.observe_claude` / `qyl.stop_observing_claude`) or the dashboard Settings > Integrations toggle. No more error spam when collector is down
- **`claude-self-obs` standalone server**: Deleted `server/` directory (TypeScript MCP server, node_modules, dist, package.json, tsconfig.json) and `.mcp.json` registration. ~300 lines TS + 58K npm dependencies eliminated. Query capabilities now provided by qyl.mcp (registered globally)
- **`claude-self-obs` bash scripts**: Deleted `emit-span.sh` (83 lines), `emit-agent-start.sh` (60 lines), `emit-agent-stop.sh` (67 lines). Dependencies on `jq`, `python3`, `curl` eliminated

### Added

- **`docs/specs/spec-0002-qyl-claude-code-observability.md`**: Comprehensive spec for building Claude Code session observability into qyl's AI telemetry dashboard. Covers OTLP data flow (native `claude_code.*` metrics + events), DuckDB schema, 5 API endpoints, React hooks, 4 dashboard components, SSE live streaming, and 4-phase implementation plan. Zero-instrumentation approach — uses Claude Code's built-in OTLP telemetry export via 4 env vars

### Changed

- **`qyl-instrumentation` (2.0.0 → 2.1.0)**: Competition-ready polish for all 6 agent/command files. Added hero scenario (proactive secretary notification handler), 8-layer trace example, attribute decision tree, performance profile, multi-turn agent trace, GenAI failure modes with 15-second async window, TypeSpec-to-dashboard end-to-end flow, MCP tool pattern, SSE consumption pattern, SEMCONV_CONTEXT shape, spawn/synthesis verification checklists, and example run walkthrough. All files stay under 250 lines

### Added

- **`docs/specs/spec-0002-qyl-claude-code-observability.md`**: Comprehensive spec for building Claude Code session observability into qyl's AI telemetry dashboard. Covers OTLP data flow (native `claude_code.*` metrics + events), DuckDB schema, 5 API endpoints, React hooks, 4 dashboard components, SSE live streaming, and 4-phase implementation plan. Zero-instrumentation approach — uses Claude Code's built-in OTLP telemetry export via 4 env vars
- **`qyl-instrumentation/commands/observe.md`**: Teams API orchestration command — Opus captain pre-reads otelwiki bundled semconv docs, assembles SEMCONV_CONTEXT + SHARED_AWARENESS, spawns 4 Sonnet specialists in parallel, coordinates cross-pollination via SendMessage, synthesizes. Zero runtime web search
- **`qyl-instrumentation/agents/opus-captain.md`**: Opus captain agent — orchestrates context assembly and team coordination, reads otelwiki docs before any specialist spawns
- **`qyl-instrumentation/agents/qyl-platform-specialist.md`**: 4th Sonnet specialist covering MCP server, React dashboard, browser OTLP SDK, SSE streaming, and Copilot extensibility

### Changed

- **`qyl-instrumentation`**: Rebuilt from 3 standalone agents (v1.0.0) to Teams API orchestration (v2.0.0). 1 Opus captain + 4 Sonnet specialists. Captain pre-reads otelwiki bundled docs — specialists receive pre-assembled semconv context in spawn prompts instead of web searching at runtime
- **`qyl-instrumentation` agents**: Removed `WebSearch` and `WebFetch` from all 3 existing specialist tool lists. Added Team Protocol sections documenting SendMessage coordination patterns and SEMCONV_CONTEXT injection
- **`qyl-instrumentation/agents/otel-genai-architect.md`**: Convention verification now references captain's SEMCONV_CONTEXT instead of WebSearch
- **`marketplace.json`**: Updated qyl-instrumentation description and version (1.0.0 → 2.0.0), agent count 17 → 19, command count 23 → 24

### Changed

- **`qyl-instrumentation` (2.0.0 → 2.1.0)**: Competition-ready polish for all 6 agent/command files. Added hero scenario (proactive secretary notification handler), 8-layer trace example, attribute decision tree, performance profile, multi-turn agent trace, GenAI failure modes with 15-second async window, TypeSpec-to-dashboard end-to-end flow, MCP tool pattern, SSE consumption pattern, SEMCONV_CONTEXT shape, spawn/synthesis verification checklists, and example run walkthrough. All files stay under 250 lines

### Added

- **`docs/specs/spec-0002-qyl-claude-code-observability.md`**: Comprehensive spec for building Claude Code session observability into qyl's AI telemetry dashboard. Covers OTLP data flow (native `claude_code.*` metrics + events), DuckDB schema, 5 API endpoints, React hooks, 4 dashboard components, SSE live streaming, and 4-phase implementation plan. Zero-instrumentation approach — uses Claude Code's built-in OTLP telemetry export via 4 env vars
- **`qyl-instrumentation/commands/observe.md`**: Teams API orchestration command — Opus captain pre-reads otelwiki bundled semconv docs, assembles SEMCONV_CONTEXT + SHARED_AWARENESS, spawns 4 Sonnet specialists in parallel, coordinates cross-pollination via SendMessage, synthesizes. Zero runtime web search
- **`qyl-instrumentation/agents/opus-captain.md`**: Opus captain agent — orchestrates context assembly and team coordination, reads otelwiki docs before any specialist spawns
- **`qyl-instrumentation/agents/qyl-platform-specialist.md`**: 4th Sonnet specialist covering MCP server, React dashboard, browser OTLP SDK, SSE streaming, and Copilot extensibility

### Changed

- **`qyl-instrumentation`**: Rebuilt from 3 standalone agents (v1.0.0) to Teams API orchestration (v2.0.0). 1 Opus captain + 4 Sonnet specialists. Captain pre-reads otelwiki bundled docs — specialists receive pre-assembled semconv context in spawn prompts instead of web searching at runtime
- **`qyl-instrumentation` agents**: Removed `WebSearch` and `WebFetch` from all 3 existing specialist tool lists. Added Team Protocol sections documenting SendMessage coordination patterns and SEMCONV_CONTEXT injection
- **`qyl-instrumentation/agents/otel-genai-architect.md`**: Convention verification now references captain's SEMCONV_CONTEXT instead of WebSearch
- **`marketplace.json`**: Updated qyl-instrumentation description and version (1.0.0 → 2.0.0), agent count 17 → 19, command count 23 → 24

### Changed

- **`exodia/skills/hades`**: Migrated from vague Teams references to explicit Teams API. SKILL.md now uses `TeamCreate`, `TeamDelete`, `SendMessage` (shutdown_request/shutdown_response), `TaskCreate`/`TaskList`/`TaskUpdate` with explicit parameters. Removed fallback subagent path and duplicate STEP -1 block. All 4 teammate templates (auditors, eliminators, verifiers, goggles) updated: vague `MESSAGE` → `SendMessage (recipient: "...")`, vague task list → `TaskCreate`/`TaskUpdate`, team context preamble and shutdown protocol added
- **`exodia/eight-gates` Gate 7 EXECUTE**: Removed dual Mode A (Task subagents) / Mode B (Agent Teams) pattern. Teams API is now the single execution mode. Lane workers coordinate via `SendMessage` and claim work via `TaskCreate`/`TaskUpdate`. Collision avoidance uses teammate messaging
- **`exodia/skills/hades` allowed-tools**: Added `TeamCreate`, `TeamDelete`, `TaskCreate`, `TaskList`, `TaskUpdate`, `SendMessage` to frontmatter
- **`exodia`**: Bumped 2.0.0 → 2.1.0
- **`exodia/red-blue-review`**: Migrated from fire-and-forget subagents to Teams API. Red attackers coordinate attacks via `SendMessage`, Blue defenders claim findings from shared `TaskCreate`/`TaskUpdate`, re-attackers mark verdicts. Full TeamCreate→shutdown→TeamDelete lifecycle across 3 adversarial phases
- **`council`**: Bumped 1.1.0 → 1.2.0. Migrated from subagents to Teams API. Researcher + synthesizer cross-pollinate via `SendMessage`. Clarity asks live follow-ups instead of one-shot read. 10-step orchestration flow. Cost profile ~2.5x → ~3x

### Removed

- **`council/skills/invoke`**: Deleted redundant skill — `SlashCommand` tool (Claude Code 1.0.124+) already makes `/council` command both user-invokable and model-invokable programmatically. Merged cost profile, when-to-use criteria, and flow diagram into the command

### Changed

- **`council`**: Bumped 1.0.0 → 1.1.0. `/council` command now contains the full content from the deleted invoke skill (flow diagram, cost profile, when-to-use section). Single entry point instead of two
- **marketplace.json**: Updated skill count 5 → 4

### Fixed

- **markdownlint**: Ground-up cleanup — 181 violations → 0 across 69 files. MD032 (blanks-around-lists), MD013 (line-length), MD031 (blanks-around-fences), MD040 (code-fence-language), MD022 (blanks-after-headings), MD028 (blockquote-blanks), MD029 (ordered-list-prefix). Formatting only, no content changes

### Added

- **`.markdownlint.jsonc`**: Project-wide markdownlint configuration — line length 120, dashes for lists, asterisks for bold, MD060/MD041 disabled
- **`.markdownlintignore`**: Added blog post exclusion pattern

### Removed

- **`feature-dev/skills/code-review`**: Deleted redundant skill — 95% identical to `/review` command. Merged severity table, checklist, and common vulnerability patterns into `/review` command. One entry point instead of two

### Changed

- **`feature-dev`**: Bumped 1.1.0 → 1.2.0. `/review` command now contains the full 6-step workflow, severity levels table, checklist, and common vulnerability patterns previously split across the skill and command
- **`engineering-principles.md`**: Slimmed from 26 principles (~1050 tokens) to 10 agent-relevant (~450 tokens). Dropped human-only principles. Full list stays in `docs/ENGINEERING-PRINCIPLES.md`
- **`docs/ARCHITECTURE.md`**: Section 6 Tri-AI replaced with pointer to CLAUDE.md 5.5.1 — zero duplication
- **`findings.json`**: F28 and F32 marked FIXED — 35/35 mega-swarm findings now resolved

### Fixed

- **`hookify/rule_engine.py`**: Fixed PreToolUse deny putting message in `systemMessage` (user-only display) instead of `permissionDecisionReason` (the field Claude actually receives). Root cause of Claude never seeing hook guidance when tools are blocked. Also split PreToolUse/PostToolUse into separate branches with correct response formats per Claude Code hooks spec
- **`hookify/hook_runner.py`**: Fixed error reporting — hookify crashes now use exit code 2 + stderr (Claude-visible) instead of `systemMessage` (user-only)
- **`hookify/global-rules/mtp-smart-test-filtering`**: Rewrote rule message to be directive — shorter (8 lines vs 80) with explicit "pick one and retry" action items
- **`metacognitive-guard/epistemic-guard.sh`**: Migrated all 5 blocks from deprecated `decision`/`reason` format to modern `hookSpecificOutput.permissionDecision`/`permissionDecisionReason`. Removed dead `message` field that was ignored by Claude Code
- **`metacognitive-guard/integrity-check.sh`**: Fixed exit code 1 (non-blocking, commit proceeds) → exit code 2 (blocking, stderr fed to Claude). Violations now actually block commits instead of being silently ignored
- **`metacognitive-guard/struggle-detector`**: Split into two hooks — async Stop (analysis + blackboard write) and new `struggle-inject.sh` on UserPromptSubmit (reads blackboard, injects `additionalContext` that Claude actually sees). Removed dead `systemMessage` output from Stop hook

### Added

- **`plugins/council`**: New plugin — five-agent council (opus-captain, sonnet-researcher, sonnet-synthesizer, sonnet-clarity, haiku-janitor). Each agent identity inlined directly in its `agents/*.md` file as passive context. Researcher + synthesizer run in parallel; clarity reads their raw output; haiku-janitor flags bloat; captain removes cuts. Inspired by Grok 4.20's multi-agent architecture. Invoke via `/council [task]`.

### Changed

- **`hookify/agents/conversation-analyzer.md`**: Upgraded model from `inherit` to `opus`; rewrote opening prompt to lead with stakes ("memory of the codebase, one missed pattern = one recurring problem")

### Removed

- **`engineering-philosophy.md`**: Deleted — complete duplicate of `engineering-principles.md` (~900 tokens wasted per session; both auto-loaded)

### Changed

- **`thought-transparency.md`**: Removed "Granular Task Decomposition" section (contradicted LAW 3 parallel execution) and duplicate "Silent Processing" section
- **`devops-calms.md`**: Fixed AGENTS.md incorrectly listed as Claude coordination channel; separated Claude channels (`CLAUDE.md`, `.claude/rules/`, `SKILL.md`, SessionStart hooks) from external-AI channels (`AGENTS.md`, `copilot-instructions.md`); standardized "Recovery Time" → "MTTR"
- **`solid-principles.md`**: Compressed from 49 to ~25 lines; replaced bullet list with responsibility table; fixed metacognitive-guard SRP description
- **`engineering-principles.md`**: Fixed duplicate `#25` tag (second instance is now `#25b`)
- **`error-handling.md`**: Fixed "Retry with backoff if transient" — inapplicable to local tool failures
- **`ARCHITECTURE.md`**: Fixed directory tree (dependabot.yml moved to correct location, added trigger-docs.yml, CODEOWNERS, designs/, ENGINEERING-PRINCIPLES.md); replaced Section 5 SOLID with pointer to rules file; fixed AGENTS.md coordination statement; replaced DORA table with pointer; added SessionStart hooks passive context layer documentation; updated Last Verified date
- **`WORKFLOWS.md`**: Added trigger-docs.yml cross-repo workflow documentation; added commit-integrity-hook note to pre-commit checklist
- **`QUICK-REFERENCE.md`**: Added `/hookify:help` command; clarified eight-gates/hades are skills not slash commands; fixed hades agent count to "12 (base) or 15 (--goggles)"
- **`PLUGINS.md`**: Removed fake required fields (`repository`, `license`); added capability declaration fields example
- **`CLAUDE.md`**: Replaced Section 3 directory tree with pointer to ARCHITECTURE.md; added turbo-fix and fix-pipeline to Section 4 routing tree; removed plugin structure tree from Section 6; reduced Section 8 CI details to pointer; added all doc paths to Section 12; updated Section 15 rules list

### Changed

- **hookify: extract shared hook_runner.py**: 4 near-identical handlers (pretooluse/posttooluse/stop/userpromptsubmit) reduced from 60-78 lines each to 18-line thin wrappers. Shared logic in `hookify/core/hook_runner.py` (~197 lines eliminated)
- **exodia smart scripts: extract lib.sh shared functions**: `has_jq()`, `has_flock()`, `atomic_write()` extracted from inline duplications across permit.sh, ledger.sh, checkpoint.sh, session-state.sh
- **exodia permit.sh: add `active` subcommand**: Canonical permit-active check for shell callers (epistemic-guard.sh, precheck-dotnet.py). Python callers (rule_engine.py) retain native implementation for import compatibility
- **AGENTS.md: sync decision tree with CLAUDE.md**: Fixed 5 missing routing entries, corrected command count (20 to 22), added baryon-mode/eight-gates/hades routing
- **plugin.json: standardize fields**: Added keywords to exodia and otelwiki; added repository, license, and keywords to feature-dev
- **plugin template: modernize**: Updated hooks.json format, added CLAUDE.md, removed empty agents/.gitkeep, simplified README
- **README.md rewrite for newcomers**: Plain-language plugin descriptions, gate system explanation, marketplace install instructions. Replaces technical jargon with accessible framing

### Fixed

- **hookify rule_engine.py: narrow exception at line 50**: Replaced bare `except Exception` with `except (FileNotFoundError, JSONDecodeError, KeyError, TypeError)` for Hades permit check
- **hookify type annotations**: Fixed `Optional[str]` and `Optional[Dict[str, Any]]` in hook_runner.py and rule_engine.py (Pyright compliance)
- **precheck-dotnet.py: narrow exception + remove unused variable**: Replaced bare `except Exception` with specific types, removed captured-but-unused `e` variable
- **ralph-loop.sh: warn on missing jq**: Changed silent `exit 0` to stderr warning when jq unavailable
- **docs stale references**: Fixed `skills/` to `plugins/*/skills/` in spec-0001 and ADR-0001, removed `.gemini/` from ARCHITECTURE.md directory tree
- **dotnet-architecture-lint CLAUDE.md**: Removed phantom reference to non-existent skill

### Removed

- **.gemini/ directory**: config.yaml + styleguide.md removed (Gemini discontinued as co-agent, no workflow references)
- **docs/AGENTS.md**: 28-line subset of root AGENTS.md — single source of truth is root file
- **hookify empty packages**: Deleted matchers/, utils/ (empty __init__.py only), hooks/__init__.py (no exports, nothing imported it)
- **template agents/.gitkeep**: Removed from plugin template

### Added

- **docs/designs/ directory**: Referenced in CLAUDE.md but didn't exist, now created with .gitkeep
- **ecosystem architecture section**: New Section 8 in `docs/ARCHITECTURE.md` documenting the full developer setup beyond this marketplace (LSP plugins, IDE MCP, Service MCP, Browser MCP), how layers compose, and why separation matters
- **engineering-philosophy rule**: Alexander's 26 software engineering principles distilled into agent-actionable directives in `.claude/rules/engineering-philosophy.md`. Organized by situation (before code, during implementation, when things break, code review, production). Complements existing SOLID, CALMS, error-handling, and thought-transparency rules without duplication
- **engineering-principles rule**: IF/THEN conditional routing format of the same 26 principles in `.claude/rules/engineering-principles.md`. Complementary retrieval pathway to philosophy tables — research shows hybrid structured formats (conditional logic + tables) improve agent decision-making by 18% vs single format. Full reference with examples in `docs/ENGINEERING-PRINCIPLES.md`
- **Ralph Loop hook** (metacognitive-guard): PostToolUse two-layer drift detector on Write/Edit. Layer 1: haiku prompt analyzes context for deep drift (over-engineering, complexity creep, premature optimization, unclear naming). Layer 2: `ralph-loop.sh` grep catches surface antipatterns instantly (TODO/HACK, suppressions, catch-all, empty catch, 150+ line dumps). Both run in parallel, both inject matching engineering principle via `additionalContext`. Silent when code is clean. Skips docs/config. Named after Lord of the Flies' Ralph

### Fixed

- **hookify block responses missing systemMessage**: Aligned with upstream — blocking responses now include `systemMessage` at root so Claude sees WHY an action was blocked (prevents blind retry loops)
- **hookify hooks firing on every tool**: Added `matcher: "Bash|Edit|Write|MultiEdit"` to PreToolUse/PostToolUse in hooks.json — stops Python from spawning on Grep/Read/Glob/Task calls
- **hookify blocking rules shown 3x**: Removed duplicate `systemMessage` from blocking responses — `permissionDecisionReason` already carries the message
- **mtp-smart-test rule verbosity**: Trimmed 73-line reference doc to 5-line nudge — detailed MTP syntax belongs in `dotnet-mtp-advisor` agent, not a hook message
- **mtp-smart-test `# VERIFY` bypass**: Added missing `not_contains` condition so the documented bypass actually works

### Added

- **exodia findings auto-inherit**: SessionStart hook (`findings-inject.sh`) reads `.eight-gates/artifacts/findings.json` and injects as `<EXODIA_FINDINGS_CONTEXT>` passive context (LAW 1). STEP -1 added to all 9 commands + 2 skills — filters findings by scope, skips re-scanning. Producers: mega-swarm, eight-gates (Gate 3), hades (Phase 0). Consumers: everything else
- **exodia `baryon-mode` command**: One-shot .NET warning extermination. Phase 0 snapshots via `dotnet build`, then T0 burst launches up to 9 parallel agents (1 recon-invoker + 8 domain aspects). Cross-repo with full MCP access
- **exodia `eight-gates` skill**: Progressive discipline orchestration — 8 named gates (Kaimon→Shimon). Idempotent resume, TTL sessions, artifact caching, decision logging. Composes mega-swarm (MAP), fix pipelines (EXECUTE), and hades (HAKAI)
- **Hades Goggles (Pink Glasses)**: Frontend design judgment for Hades cleanup. Auto-equipped for `.tsx`/`.jsx`/`.css`/`.html`/`.svelte`/`.vue` files. Adds 3 teammates (taste/spec/compliance) to Phase 0 audit
- **metacognitive-guard TaskCompleted hook**: Prompt-based (haiku, 15s) quality gate for team workflow task completions
- **exodia `check-hades-idle.sh`**: Extracted from inline `bash -c` command. Uses `${CLAUDE_PLUGIN_ROOT}` paths
- **Mega-swarm backlog**: `docs/mega-swarm-backlog.md` — P2/P3 issues for follow-up
- **Claude multi-entity documentation**: CLAUDE.md section 2 explains Claude as a multi-agent system
- **CCC tagline**: README opens with "Claude, Copilot, CodeRabbit — the holy trinity"
- **Hades teammate prompt templates**: Extracted into `plugins/exodia/skills/hades/templates/`
- **Hades skill hooks**: `TeammateIdle` (command) and `TaskCompleted` (prompt/haiku)
- **Modular rule files**: `.claude/rules/` auto-loaded files
- **`checkpoint.sh` smart script**: Gate checkpoint management — init, save, load, verify (idempotent), list. Append-only JSONL storage
- **`session-state.sh` smart script**: TTL session state + artifact cache + decision log
- **`.eight-gates/` gitignore entry**: Session-local runtime directory

### Changed

- **eight-gates conductor identity**: Lead agent is the conductor (baton, not instrument). Delegation is intrinsic to self-concept. "A conductor who picks up a violin has stopped conducting."
- **eight-gates budget tracking removed**: Replaced all budget references with agent ceilings. Token costs tracked via OTel, not skills
- **exodia `eight-gates` promoted from command to skill**: Moved from `commands/eight-gates.md` (412 lines) to `skills/eight-gates/` (SKILL.md + 8 per-gate templates). Reviewer fixes: expanded `allowed-tools`, SSOT references, `.smart/` gitignore safety, fixed undefined functions/references in gate-02/04/06, added context injection in gate-05/07
- **metacognitive-guard `deep-analysis` command**: 4-phase structured thinking — decompose, adversarial review, implementation, verification
- **Docs sync**: Updated README.md, CLAUDE.md, ARCHITECTURE.md, AGENTS.md, marketplace.json with accurate counts (22 commands, 5 skills, 9 agents)
- **ARCHITECTURE.md rewrite**: Replaced stale target-state tree with actual filesystem layout. Removed phantom `skills/` root dir and `docs/examples/`
- **qyl routing rewrite**: Full project map (14 src projects), TypeSpec flow, specialist agents. Removed bloated Context Processing Requirement ceremony
- **turbo-fix: atomic TDD** (16→13 agents): Merged `test-writer` + `implementation-coder` into single `tdd-implementer`. Eliminates file conflict
- **batch-implement: explicit file ownership**: Implementers declare `OWNED FILES:`, wiring centralized in `consistency-reviewer` Phase 3
- **red-blue-review: module-scoped defenders**: Changed from "1 defender per finding" to "1 defender per module" with grouped findings
- **Plugin consolidation: 10 → 7 plugins**: `completion-integrity` → metacognitive-guard, `autonomous-ci` → metacognitive-guard, `code-review` → feature-dev
- **metacognitive-guard v0.4.0**: 4 hooks (was 3), 7 scripts (was 3), absorbs commit integrity + CI verification
- **feature-dev v1.1.0**: `/review` command, `code-review` skill, full 7-phase workflow
- **Exodia hades skill**: Merged content from standalone hades, refactored to ~280 lines
- **CLAUDE.md**: Replaced sections 15-18 with `.claude/rules/` references
- **All hooks.json files**: Added `statusMessage` for spinner UX
- **hooks.json regex**: Combined `Write` + `Edit` into `Write|Edit` regex across metacognitive-guard, dotnet-architecture-lint
- **hookify hooks.json**: Added `async: true` to PostToolUse hook
- **arch-reviewer & impl-reviewer agents**: Added `memory: user`
- **weave-validate.sh**: Rewritten with hard failures vs soft warnings, proper exit codes
- **ci.yml**: Rewritten with 4 parallel jobs and real validation checks

### Fixed

- **json_escape SSOT extraction**: Extracted canonical `json_escape()` into shared `scripts/smart/lib.sh` — eliminates 4 duplicate implementations. Fixes P0 multi-line JSONL corruption in ledger.sh
- **session-state.sh command injection**: Replaced raw variable interpolation with `--argjson` safe argument passing
- **checkpoint.sh verify accuracy**: Replaced brittle `grep` with `jq --argjson` exact match + session scoping
- **session-state.sh path traversal**: Added `validate_artifact_key()` guard rejecting keys with `/` or `..`
- **session-state.sh ls parsing**: Replaced `ls -1 | while read` with `find -print0 | while read -d ''`
- **checkpoint.sh session ID check**: Added existence guard before reading `.session-id`
- **json_escape newline handling**: Both scripts now use `jq -Rs` with `tr '\n' ' '` fallback
- **decision_log JSON safety**: Uses `jq -n -c --arg` instead of manual `json_escape` + `printf`
- **eight-gates.md quoting**: Quoted `$1` in `find` command, replaced `ls` with `find` for artifact counting
- **decision subcommand routing**: Added explicit `log` subcommand with graceful fallback
- **Command namespacing**: Bare `/fix`, `/mega-swarm` etc. corrected to `/exodia:fix`, `/exodia:mega-swarm` across docs
- **AGENTS.md stale counts**: "19 commands, 11 agents" → "20 commands, 9 agents"
- **README.md exodia comment**: "9 commands incl. hades" → "8 commands + hades cleanup skill"
- **check-hades-idle.sh jq guard**: Added `command -v jq` with sed fallback
- **project-routing.sh strict mode**: Added `set -euo pipefail` + fixed shebang
- **Template README autocomplete guidance**: Removed false claim that `commands/` is required
- **struggle-detector was dead code**: Now reads `transcript_path` from hook input and analyzes actual response text
- **struggle-detector output key**: Changed `additionalContext` to `systemMessage`
- **metacognitive-guard Stop hook not async**: Now runs with `async: true`
- **otelwiki check-freshness.sh missing timeout**: Added `timeout: 5`
- **hades TeammateIdle inline command**: Extracted to script using `${CLAUDE_PLUGIN_ROOT}` for reliable paths
- **ancplua-project-routing redundant matcher**: Removed matcher equivalent to no matcher
- **hades SKILL.md line length (MD013)**: Split 178-char line to fit 120-char limit
- **Hook timeout units**: Changed `timeout: 5000` (83 minutes) to `timeout: 5` (5 seconds) across 6 occurrences
- **Invalid `"stdin": "response"` field**: Removed from metacognitive-guard Stop hook
- **Skill $N indexing**: Fixed 1-based to 0-based across all 9 exodia skills (133 references)
- **SessionStart hooks invalid JSON**: Fixed 3 scripts embedding raw newlines in JSON
- **dotnet CLI syntax**: Removed erroneous `--` separator, added `.slnx` preference in `verify-local.sh`
- **macOS flock compatibility**: Added `command -v flock` guard in `ledger.sh`
- **README.md hades ghost**: Removed deleted hades plugin from table and install commands
- **AGENTS.md false counts**: Fixed "12 plugins, 22 skills" → "11 plugins, 19 skills"
- **AGENTS.md stale hades routing**: Removed references to non-existent `hades/skills:{judge,enforce,verify}`
- **copilot-instructions.md Quad-AI**: Fixed to "Tri-AI" and "three AI agents"
- **CLAUDE.md Quad-AI heading**: Fixed section 5.5.1 to "Tri-AI"
- **README.md stale docs URL**: Updated to `code.claude.com/docs/en/plugins`

### Removed

- **hades TaskCompleted prompt hook**: Duplicate of metacognitive-guard's generic gate
- **Standalone `completion-integrity` plugin**: Merged into metacognitive-guard
- **Standalone `autonomous-ci` plugin**: Merged into metacognitive-guard
- **Standalone `code-review` plugin**: Merged into feature-dev
- **Standalone hades plugin** (`plugins/hades/`): Redundant with `plugins/exodia/skills/hades/`
- **GEMINI.md**: Gemini removed as co-agent
- **Quad-AI references**: Downgraded to tri-AI across all files
- **Type A/Type T architecture**: Removed all references across 15 files. ancplua-mcp discontinued
- **CLAUDE.md Section 10**: Removed MCP Integration / Dual-Repo Workflow section
- **copilot-instructions.md Section 3**: Removed "Type A vs Type T separation" section
- **docs/ARCHITECTURE.md**: Removed Sections 1, 5, 7 (Type A/T, MCP, ancplua-mcp relationship)
- **docs/PLUGINS.md**: Removed Type A/MCP paragraph
- **docs/AGENTS.md**: Removed ancplua-mcp MCP servers reference
- **spec-0003-cross-repo-contracts.md**: Deprecated — ancplua-mcp discontinued
- **claude-code-review.yml**: Removed Type A/T references
- **claude.yml**: Removed Type A comment
- **.gemini/**: Removed Type A/T identity and sister repo references
- **ancplua-project-routing**: Removed Type A/T labels and ancplua-mcp routing
- **weave-validate.sh**: Removed dual-repo mode (`--dual` flag, `SIBLING_REPO`)
- **plugin-template/README.md**: Removed MCP tools section

## [1.0.0] - 2026-02-07

Launch release for Claude Opus 4.6. Full repository audit and cleanup.

### Added

- **CLAUDE.md for all 12 plugins**: Each plugin now has a focused CLAUDE.md with plugin-specific
  context (files, behavior, notes) that does not duplicate root CLAUDE.md content
  - autonomous-ci, code-review, completion-integrity, dotnet-architecture-lint, exodia,
    feature-dev, hades, hookify, metacognitive-guard, otelwiki, ancplua-project-routing,
    workflow-tools
- **CLAUDE.md for both agents**: cleanup-specialist (deprecated notice), repo-reviewer-agent (planned notice)
- **feature-dev README.md**: Plugin was missing its README entirely. Added 7-phase workflow overview

### Fixed

- **Exodia README version mismatch**: README said v1.0.0, plugin.json said v1.1.0. Updated README to v1.1.0
- **AGENTS.md plugin count**: Root and docs/AGENTS.md both said "11 plugins". Updated to 12, added
  exodia/hades skills to compressed docs index and decision tree
- **docs/PLUGINS.md**: Removed MCP server example that contradicted Type A architecture. Fixed
  script reference to `sync-marketplace.sh`. Added `agents/*.md` to optional components
- **docs/ARCHITECTURE.md**: Fixed plugin count (10 -> 12). Fixed stale compliance section that
  referenced non-existent "Section 8 of CLAUDE.md". Updated last verified date to 2026-02-07
- **docs/AGENTS.md**: repo-reviewer-agent status corrected from "Active" to "Planned (config only)"
- **Sync script misnamed**: `tooling/scripts/sync-otel-v1.51.0.sh` renamed to `sync-marketplace.sh`
  to match its actual purpose (marketplace validation, not OTel sync)

### Removed

- **7 dead .gitkeep files**: autonomous-ci (commands/, hooks/), code-review (root, commands/, hooks/,
  scripts/, skills/) - directories are empty or have real content
- **__pycache__ from dotnet-architecture-lint**: Bytecode cache was on disk (already gitignored)
- **Runtime state files from git**: metacognitive-guard `.blackboard/.struggle-count` and
  `.struggle-signals` removed from tracking. Added `.blackboard/` to .gitignore

### Changed

- **.gitignore**: Added `.blackboard/` pattern for metacognitive-guard runtime state
