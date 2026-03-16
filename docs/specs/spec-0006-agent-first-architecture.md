# spec-0006: Agent-First Architecture

Status: brainstorming (2026-03-15)

## Context

Claude Code is evolving from CLI chatbot to always-on autonomous development platform.
Evidence: v2.1.50 → v2.1.72 diff shows 643 prompt fragments including Teams API,
Cron scheduling, team memory scopes, HTML visual reporting, output styles, and auto mode.

This spec captures the design questions for restructuring the ancplua-claude-plugins
library around the thesis: **software for agents, not developers.**

## Discovery: Claude Code Product Architecture

```
Layer 1: claude-opus-4.6.md          <- Anthropic injects, immutable
Layer 2: Claude Code system prompt   <- product prompt, immutable
Layer 3: CLAUDE.md + plugins/hooks   <- user controls this
Layer 4: User message                <- user types this
```

IF API call includes tools -> Anthropic uses claude-opus-4.6.md (with tool instructions)
IF API call has NO tools   -> Anthropic uses claude-opus-4.6-no-tools.md

All Claude products (claude.ai, Claude Code, Desktop, Agent SDK apps) call the
same Messages API with the same models. The difference is system prompts and tool
definitions. There is no separate "Claude Code model."

## Discovery: Effort Level

- API supports: `low`, `medium`, `high` via `thinking.budget_tokens`
- Claude Code supports: `low`, `medium`, `high`, `max`
- `max` = no budget constraint, Opus 4.6 only, session-only (does NOT persist)
- Settings file (`effortLevel`): accepts `low`, `medium`, `high` only
- Env var (`CLAUDE_CODE_EFFORT_LEVEL`): accepts `low`, `medium`, `high`, `max`, `auto`
- Env var takes precedence over settings over model default
- Bug found: `/model` effort slider writes to disk but doesn't update runtime session state

## Discovery: v2.1.50 → v2.1.72 New Capabilities

| Capability | What It Signals |
|---|---|
| Cron scheduling (CronCreate/Delete/List) | Claude Code becoming a daemon, not a chatbot |
| Teams API (TeamCreate/Delete, SendMessage) | Multi-agent is going first-class |
| Memory v2 (private vs team scopes) | Team-aware collaboration platform |
| HTML visual reporting (dashboards, progress bars) | Analytics/coaching, not just execution |
| Output Styles | Different audiences (senior eng vs student) |
| Auto Mode | Moving from assistant to autonomous agent |
| Interruptible Sleep with tick check-ins | Always-on, proactively finding work |

## Core Design Question

IF target_user == human_developer:
    Quality bar = correctness + ergonomics + docs + backward compat
    Cost of bug = developer time to understand + fix + redeploy
    Abstraction goal = hide complexity

IF target_user == AI_agent:
    Quality bar = greppable + readable + modifiable + observable
    Cost of bug = agent tokens to detect + fix (cheap, fast, automatic)
    Abstraction goal = expose complexity (agents need to SEE the seams)

The bar shifts from "correct code" to "correctable code."

| Human-first design | Agent-first design |
|---|---|
| Beautiful READMEs | CLAUDE.md with structured tags |
| Clever abstractions | Flat, greppable files |
| DRY (Don't Repeat Yourself) | Repeat yourself — self-contained files easier to modify in isolation |
| Backward compatibility | Break freely — agents rewrite callers |
| Defensive error handling | Crash loudly — agents read stack traces |
| Plugin versioning | Delete and recreate |
| Subagents (current) | Teams (future) |

---

## Decision Log

### Q1: Subagents vs Teams migration?

**Decision: B — bet on Teams now.**

Revised from original "stay on subagents" after reflection. Reasoning:
- Token cost is not a constraint (Max plan, Opus 4.6)
- Teams already enabled via CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
- calini plugin already uses TeamCreate/SendMessage
- v2.1.72 prompts show Teams deeply integrated (643 fragments, not bolted on)
- Teams give real coordination (SendMessage, broadcast, graceful shutdown)
  that subagents cannot do (spawn and forget)
- Orchestration-heavy plugins (exodia, calini, carlini-jr, council) are
  fighting subagent limitations already

Migration order: exodia first (most complex orchestration), then calini,
then council. Leave simple plugins (feature-dev, otelwiki, metacognitive-guard)
as subagents — they don't need coordination.

---

### Q2: Hooks vs Rules as primary enforcement?

#### Claim (from research across 10+ high-star projects)

**Hybrid 3-layer model. Rules for guidance, hooks for safety, lint loop as final net.**

Evidence for hooks:
- claude-code issue #29236: CLAUDE.md rules loaded, acknowledged, then immediately violated
- claude-code issue #33603: rules violated across 4 consecutive sessions, getting worse
- claude-code issue #19471: rules completely ignored after context compaction
- Aider (42k stars): auto-lint + auto-test is the gold standard — model can violate rules but linter catches and forces retry
- CrewAI (46k stars): programmatic guardrails as typed `Callable[[Output], tuple[bool, Any]]`
- LangGraph (26k stars): `interrupt()` pauses execution at tool boundaries for human approval

Evidence for the 3 layers:
```
Layer 1 (Soft):  Rules in CLAUDE.md — tell model what to do (~70-90% compliance)
Layer 2 (Hard):  Hooks at tool boundaries — can deny actions (must fail closed)
Layer 3 (Hard):  Closed-loop verification — lint/test after changes, retry on failure
```

Critical requirements from claude-code issues:
- Fail closed (issue #32990): missing hook script must block, not allow
- Tamper-proof (issue #32990): agent deleted its own hook to bypass constraint
- Complete coverage (issue #33106): MCP tools not covered by hooks
- Survive compaction (issue #19471): hooks don't depend on context window
- Propagate to sub-agents (issue #33384): child agents must inherit parent hooks

#### Doubt (counter-evidence)

**Rules files make agents worse. Over-constrained hooks stifle reasoning. Devs bypass slow hooks.**

- ETH Zurich (Feb 2026, 138 repos, 5694 PRs): LLM-generated context files reduced success
  by 3% and increased costs by 20%+. Even human-written files only +4% success at +19% cost.
  Agents following AGENTS.md "ran more tests, read more files, executed more grep searches...
  though this behavior was often unnecessary."
- ESLint/Prettier fatigue: configuration complexity drove mass migration to Biome (single tool).
  Two config files, conflicting rules, 45s lint runs → devs disabled the tools entirely.
- claude-code issue #6573: hooks "frustratingly opaque." Standard response to slow pre-commit
  hooks is `git commit --no-verify`.
- Over-constrained guardrails (Authority Partners, CSO Online): "overly tight rules stifle
  autonomy and slow reasoning." Guardrails constrain defenders more than attackers.

#### Verdict: RULES-LIGHT + HOOKS-SURGICAL + LINT-ALWAYS

Neither side is fully right. The synthesis:

1. **Rules: minimal and non-inferable only.** ETH Zurich is right — bloated rules files
   hurt more than they help. Only write rules for things an agent cannot infer from code
   (custom build commands, banned APIs, team conventions). Delete everything else.

2. **Hooks: few, fast, fail-closed, for safety only.** Not for style, not for preferences.
   Only for things where violation = real damage (secrets exposure, destructive git ops,
   wrong directory writes). Keep hooks under 100ms. The 35s stop-judge is an anti-pattern.

3. **Lint/test loop: always on, this is the real enforcement.** Aider proved it. The model
   can ignore every rule and bypass every hook — but if `nuke test` fails, the code is
   rejected. This is the only enforcement that cannot be circumvented.

---

### Q3: Plugin file structure for agent consumption?

#### Claim (from 12 repos, 2k-81k stars)

**Keep the Anthropic convention. It already won.**

Every high-star plugin follows the same structure:
```
{plugin}/
  .claude-plugin/plugin.json    # manifest
  commands/{name}.md            # one file per slash command
  skills/{name}/SKILL.md        # one dir per skill (allows reference docs)
  agents/{name}.md              # one file per agent
  hooks/hooks.json              # hook manifest
```

Required frontmatter (minimum viable):
- `name` — machine-readable identifier
- `description` — THE routing key (agents use this to decide what to invoke)
- `allowed-tools` — security boundary
- `version` — for marketplace tracking

Evidence: anthropics/claude-plugins-official (11.7k), PatrickJS/awesome-cursorrules (38k),
thedotmack/claude-mem (35k), vercel-labs/skills (10k), trailofbits/skills (3.5k) all follow
this pattern or a close variant.

#### Doubt (counter-evidence)

**Agents grep, they don't browse. Structure is for humans, not machines.**

- htmx (40k+ stars): single 3,500-line file IS the library. "Requires staying in a single
  file because it enforces a degree of intention."
- ETH Zurich: file structure docs "did not reduce the time the model spent locating relevant
  files." Agents search, they don't navigate.
- Plugin architecture complexity kills adoption (HN, LeadDev): "marketing keywords, adding
  significant complexity for little end value."

#### Verdict: KEEP STRUCTURE, TRIM RULES FILES

Both sides are right about different things:
- The Anthropic convention is correct for DISCOVERY (agents need to know what's available)
- But don't over-document the structure (agents don't read file tree docs, they grep)
- Your current structure already matches. No change needed.
- Action: delete any meta-documentation about the structure itself — the convention IS the doc.

---

### Q4: Marketplace registry in an agent-first world?

#### Claim (from MCP, Vercel, Claude Code, Homebrew, lazy.nvim ecosystems)

**Convention-first, registry-optional. Three layers.**

```
Layer 1 — Convention (mandatory, zero-infrastructure)
  Self-describing manifest at well-known path. Works offline.
  Examples: plugin.json, SKILL.md, server.json, .well-known/mcp.json

Layer 2 — Registry (optional, for discoverability)
  Searchable index of things following the convention.
  Examples: skills.sh, registry.modelcontextprotocol.io, marketplace.json

Layer 3 — Federation (for scale)
  One authoritative source, many subregistries.
  Examples: Claude Code extraKnownMarketplaces, MCP metaregistry
```

Evidence: Vercel skills (10k stars in weeks), MCP registry (6.5k), Claude Code marketplace,
Homebrew taps (47k), lazy.nvim (20k). All converged on convention + optional registry.

#### Doubt (counter-evidence)

**Registries are attack surfaces and graveyards. But no-registry also fails.**

Against registries:
- npm: 99% of all OSS malware in 2025. 2.6B weekly downloads compromised via phishing.
  61% of packages abandoned (no update in 12 months).
- WordPress: 150+ plugin removals/month, 333 vulnerabilities/week.
- VS Code Marketplace: 128M installs exposed, name-squatting attacks.

Against no-registry:
- Deno abandoned registry-free URL imports: "decentralized module system caused reliability
  problems." Created JSR (centralized registry) as replacement.
- A2A .well-known: "discovery, naming, and resolution are the missing pieces."

In favor of convention-based discovery:
- Claude's Tool Search: 85% token reduction, discovers by scanning, no registry needed.
- Homebrew taps: naming convention IS the discovery mechanism.

#### Verdict: CONVENTION-FIRST, REGISTRY AS THIN INDEX ONLY

Your marketplace.json is correct but should be a thin index, not a source of truth.
The plugin.json inside each plugin is the source of truth. marketplace.json just
points to them. This matches what works (Homebrew, lazy.nvim, Claude Code) and avoids
what fails (npm-style trust-the-registry).

Action: no structural change needed. Your current approach is already correct.

---

### Q5: Memory architecture with team scopes?

#### Claim (from Mem0, CrewAI, AG2, LangGraph, Zep/Graphiti)

**Three-scope model with propose-then-commit writes.**

```
private   (plugin-local)   -> read-write by owning plugin only
team      (project-scoped) -> read by all, write via proposal + audit
global    (org-scoped)     -> read-only for plugins
```

Evidence:
- Every mature project converged on 3 scopes (Mem0: user/agent/run, CrewAI: agent/crew,
  LangGraph: thread/namespace/cross-namespace)
- CrewAI/AG2 failed with unrestricted shared writes — memory pollution in production
- LangGraph namespace tuples are the most flexible pattern: ("org", "team", "plugin")
- Graphiti bi-temporal model: every write records who/when/what/why (audit trail)
- Claude Code already does this: MEMORY.md (private) + CLAUDE.md (team via git)

Critical requirements:
- Plugins interact via MCP tools, not direct file access (Graphiti, OpenMemory pattern)
- Implicit read, explicit write (CrewAI lesson — reduces noise)
- File-as-API for team memory (git = built-in audit trail + code review)

#### Doubt (counter-evidence)

**Shared memory poisons agents, causes race conditions, and leaks data.**

- arxiv 2503.13657 (1,600 traces, 7 frameworks): 41-87% failure rates in multi-agent systems.
  Information integrity drops from 90% single-turn to under 60% multi-turn.
- Context poisoning: one compromised agent poisoned 87% of downstream decisions in 4 hours.
  OWASP added ASI06 (Memory & Context Poisoning) to 2026 Top 10 for Agentic Apps.
- AgentLeak / Echoleak: hidden prompts caused agents to leak private data from prior sessions.
- Race conditions: Agent A writes X, Agent B writes Y simultaneously. In payment processing:
  timeout + retry = double charges.
- Shared state kills cognitive diversity: "same input + same process = same output."
  Sharing context creates anchoring effects where first hypothesis anchors all others.

#### Verdict: PRIVATE-DEFAULT, TEAM-VIA-GIT, NO RUNTIME SHARED STATE

The doubt agent wins on this one more than any other question.

1. **Default to private.** Plugins get their own isolated memory. No shared runtime state.
   This avoids the 87% context poisoning and race condition failure modes.

2. **Team memory = CLAUDE.md committed to git.** This is already the pattern and it's
   correct. Git provides: audit trail, code review as approval gate, rollback, blame.
   No runtime shared memory API needed.

3. **No MCP memory tools for now.** The Mem0/Graphiti pattern (MCP read-write to shared
   store) is premature for a plugin library. The failure modes (poisoning, races, leaks)
   outweigh the benefits. Wait for Claude Code's native team memory to ship and stabilize.

4. **IF you need cross-plugin data sharing:** use files with explicit ownership.
   Plugin A writes `.blackboard/plugin-a-findings.json`. Plugin B reads it.
   No concurrent writes to shared state. This is the blackboard pattern you already
   have in metacognitive-guard — it just needs to actually work.

---

## Summary: All Decisions

| Q | Question | Decision |
|---|---|---|
| Q1 | Subagents vs Teams | **Stay on subagents.** Migrate when it breaks. |
| Q2 | Hooks vs Rules | **Rules-light + hooks-surgical + lint-always.** Minimal rules, few fast hooks for safety, lint/test as real enforcement. |
| Q3 | File structure | **Keep current Anthropic convention.** No change needed. Delete meta-docs about the structure. |
| Q4 | Marketplace registry | **Convention-first, registry as thin index.** Current marketplace.json is correct. |
| Q5 | Team memory | **Private-default, team-via-git.** No runtime shared state. Blackboard files for cross-plugin data. |

## References

### Primary Sources
- Claude Code v2.1.50 system prompt: ~/Downloads/claude-code.md
- Claude Code v2.1.72 fragments: ~/Downloads/claude-code2.md (643 fragments from npm bundle)
- Leaked system prompts: github.com/asgeirtj/system_prompts_leaks/tree/main/Anthropic
- Effort level docs: https://code.claude.com/docs/en/model-config#adjust-effort-level
- Settings docs: https://code.claude.com/docs/en/settings

### Research Evidence (Q2)
- anthropics/claude-code (78k stars): hook system + issues #32990, #33106, #19471, #29236, #33603, #33384
- paul-gauthier/aider (42k stars): auto-lint + auto-test closed-loop enforcement
- crewAIInc/crewAI (46k stars): programmatic guardrails
- langchain-ai/langgraph (26k stars): interrupt-based gating
- microsoft/autogen (56k stars): structural enforcement via Handoff
- Continue.dev (32k stars): Claude Code-compatible hooks in CI
- ETH Zurich study (Feb 2026): AGENTS.md reduces success by 3%, increases cost 20%
- intellectronica/ruler (2.5k stars): cross-agent rule distribution

### Research Evidence (Q3)
- anthropics/claude-plugins-official (11.7k stars): canonical plugin structure
- PatrickJS/awesome-cursorrules (38k stars): .cursorrules convention
- thedotmack/claude-mem (35k stars): hooks-heavy plugin
- vercel-labs/skills (10k stars): SKILL.md convention
- modelcontextprotocol/servers (81k stars): one-dir-per-server

### Research Evidence (Q4)
- modelcontextprotocol/registry (6.5k stars): federated metaregistry
- vercel-labs/skills + skills.sh: convention + optional registry
- Homebrew/brew (47k stars): naming convention as discovery
- folke/lazy.nvim (20k stars): convention-only, no registry
- Deno blog "What We Got Wrong": abandoned no-registry, created JSR
- npm ecosystem: 99% of OSS malware, 2.6B downloads compromised

### Research Evidence (Q5)
- mem0ai/mem0 (50k stars): user/agent/run scopes, breaking API changes
- crewAIInc/crewAI: concurrent write contention on ChromaDB
- langchain-ai/langgraph: namespace hierarchy, reducer-driven state
- getzep/graphiti (24k stars): bi-temporal knowledge graph, MCP server
- arxiv 2503.13657: 41-87% multi-agent failure rates
- OWASP ASI06: Memory & Context Poisoning (2026 Top 10)
- Context poisoning study: 87% downstream corruption from one agent in 4 hours
