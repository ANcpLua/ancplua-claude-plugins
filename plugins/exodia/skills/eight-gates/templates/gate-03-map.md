# Gate 3: 生門 SEIMON — MAP

> Parallel discovery. Identify work items, risks, dependencies, unknowns.
> The output is a work queue, not a solution.
> This is Yang: motion, execution energy — but still pre-commit.

## Entry Condition

- Gate 2 checkpoint exists (`checkpoint.sh verify 2`)
- Objective type known from Gate 1

## Rules

1. ALL agents launch in ONE message (parallel, LAW 3)
2. No agent implements changes — MAP means observe and report
3. Each agent returns the standard payload (see bottom of this file)
4. Agent count respects ceiling from Gate 1

**Variable substitution:** Agent prompts below use `$SESSION_ID`, `$OBJECTIVE`, `$SCOPE`.
Lead MUST replace these with actual values before spawning. Mapping from skill args:
`$OBJECTIVE` = `$0` (first skill argument), `$SCOPE` = `$1` (second skill argument).
`$SESSION_ID` comes from INIT. Subagents have NO conversation history — inject everything.

---

## type=BUG (3-6 agents)

Standard: 3 agents. Full: all 6.

> subagent: deep-debugger
>
> You are **root-cause-hunter**.
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Find the ROOT CAUSE. Not symptoms. Not guesses.
>
> 1. Exact failure mode (what breaks, when, how)
> 2. ALL possible causes (minimum 5)
> 3. Evidence for/against each (file paths, line numbers, outputs)
> 4. Confidence ranking (percentage per cause)
>
> Do NOT implement fixes. Observe and report.

<!-- -->

> subagent: metacognitive-guard:arch-reviewer
>
> You are **impact-assessor**.
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Map the IMPACT of this bug and its potential fixes.
>
> 1. What depends on the broken code?
> 2. Ripple effects of changes?
> 3. Local failure or systemic?
> 4. Invariants at risk?
>
> Do NOT implement fixes. Map the blast radius.

<!-- -->

> subagent: feature-dev:code-explorer
>
> You are **code-explorer**.
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Find ALL relevant code paths.
>
> 1. All code paths involved in the bug
> 2. Similar patterns elsewhere in the codebase
> 3. Test coverage for this area
> 4. Recent changes (git log --oneline -20 for relevant files)
>
> Do NOT implement fixes. Map the terrain.

<!-- -->

> subagent: Explore
>
> You are **history-detective**. (full mode only)
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Find the HISTORY.
>
> 1. When did this break? (git blame, git log)
> 2. What commit introduced it?
> 3. Was this working before? What changed?
> 4. Related issues or PRs?

<!-- -->

> subagent: feature-dev:code-explorer
>
> You are **pattern-matcher**. (full mode only)
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Find SIMILAR bugs.
>
> 1. Same pattern elsewhere in codebase?
> 2. Similar bugs fixed before? How?
> 3. Common anti-patterns in this area?

<!-- -->

> subagent: feature-dev:code-reviewer
>
> You are **test-analyzer**. (full mode only)
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Analyze TEST coverage gaps.
>
> 1. What tests exist for this area?
> 2. Why didn't tests catch this?
> 3. What tests are missing?

---

## type=AUDIT (6 quick / 8 focused / 12 full)

Quick: first 6. Focused: 8 relevant to focus area. Full: all 12.

> subagent: metacognitive-guard:arch-reviewer
>
> You are **arch-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT architecture. SOLID violations? Coupling? Scalability? Layer boundaries?
> Output: Findings with severity P0-P3 and file:line evidence.

<!-- -->

> subagent: feature-dev:code-reviewer
>
> You are **security-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT security. Injection? Auth issues? Secrets? OWASP Top 10?
> Output: Findings with severity P0-P3 and file:line evidence.

<!-- -->

> subagent: feature-dev:code-explorer
>
> You are **perf-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT performance. N+1 queries? Memory leaks? Blocking calls? Unnecessary allocations?
> Output: Findings with severity P0-P3 and file:line evidence.

<!-- -->

> subagent: feature-dev:code-reviewer
>
> You are **test-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT test quality. Coverage gaps? Flaky tests? Missing edge cases? Dead tests?
> Output: Findings with severity P0-P3 and file:line evidence.

<!-- -->

> subagent: feature-dev:code-reviewer
>
> You are **quality-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT code quality. Dead code? Duplication? Complexity? Naming inconsistency?
> Output: Findings with severity P0-P3 and file:line evidence.

<!-- -->

> subagent: deep-debugger
>
> You are **bug-hunter**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> HUNT active bugs. Null refs? Race conditions? Logic errors? Unhandled edge cases?
> Output: Findings with severity P0-P3 and file:line evidence.

Full mode adds (launch alongside the 6 above):

<!-- -->

> subagent: deep-debugger
>
> You are **error-auditor**. (full/focused only)
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT error handling. Swallowed exceptions? Missing handlers? Silent failures?

<!-- -->

> subagent: feature-dev:code-explorer
>
> You are **api-auditor**. (full/focused only)
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT API contracts. Breaking changes? Documentation accuracy? Versioning?

<!-- -->

> subagent: Explore
>
> You are **dependency-auditor**. (full/focused only)
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT dependencies. Outdated? Known vulnerabilities? License issues?

<!-- -->

> subagent: Explore
>
> You are **config-auditor**. (full/focused only)
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT configuration. Hardcoded values? Missing env vars? Secret leaks?

<!-- -->

> subagent: Explore
>
> You are **docs-auditor**. (full/focused only)
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT documentation. Outdated? Missing? README accuracy? Stale examples?

<!-- -->

> subagent: feature-dev:code-reviewer
>
> You are **consistency-auditor**. (full/focused only)
> SESSION: $SESSION_ID | SCOPE: $SCOPE
> AUDIT consistency. Naming conventions? Style patterns? Inconsistent approaches?

---

## type=FEATURE (3-6 agents)

> subagent: feature-dev:code-architect
>
> You are **feature-architect**.
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Design the feature.
>
> 1. Where does this fit in the existing architecture?
> 2. What files need to be created/modified?
> 3. What interfaces/contracts are affected?
> 4. What's the simplest implementation path?
>
> Output: Architecture plan with file list and dependency order.

<!-- -->

> subagent: feature-dev:code-explorer
>
> You are **pattern-scout**.
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Find EXISTING PATTERNS.
>
> 1. How are similar features implemented in this codebase?
> 2. What conventions exist?
> 3. What abstractions can be reused?
>
> Output: Pattern catalog with examples and file:line references.

<!-- -->

> subagent: feature-dev:code-reviewer
>
> You are **risk-assessor**.
> SESSION: $SESSION_ID | OBJECTIVE: $OBJECTIVE | SCOPE: $SCOPE
>
> Identify RISKS.
>
> 1. What could go wrong?
> 2. What edge cases exist?
> 3. What testing strategy is needed?
> 4. What's the rollback path?
>
> Output: Risk assessment with mitigations.

Full mode adds: test-planner, ux-reviewer, performance-profiler.

---

## type=CLEANUP (4 agents)

> subagent: general-purpose
>
> You are **suppression-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
>
> Find ALL suppressions in scope.
> `pragma warning disable`, `@ts-ignore`, `eslint-disable`, `noqa`, `[SuppressMessage]`,
> `// ReSharper disable`, `#pragma warning`, `@SuppressWarnings`
>
> For each: file:line, suppression type, reason (if documented), and whether fixable.

<!-- -->

> subagent: general-purpose
>
> You are **deadcode-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
>
> Find ALL dead code in scope.
> Unreachable code, unused exports, unused variables, unused functions, unused imports,
> commented-out code blocks, unused CSS classes.
>
> For each: file:line, the code, and evidence it's dead (no callers, no references).

<!-- -->

> subagent: general-purpose
>
> You are **duplication-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
>
> Find ALL duplication in scope.
> Copy-pasted blocks, near-duplicates, repeated patterns, similar functions.
>
> For each: file:line pairs, similarity percentage, and consolidation suggestion.

<!-- -->

> subagent: general-purpose
>
> You are **import-auditor**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
>
> Find ALL import issues in scope.
> Unused imports, circular dependencies, wrong paths, inconsistent import styles.
>
> For each: file:line, issue type, and fix.

---

## type=CUSTOM

Lead selects up to 12 agents based on objective. Each agent must follow
the standard output schema below.

---

## Standard Agent Output Schema

Every MAP agent must return this structure:

```text
## Findings

1. [P0|P1|P2|P3] Description — file:line — evidence
2. [P0|P1|P2|P3] Description — file:line — evidence
...

## Assumptions

- [assumption]: [confidence %]
- [assumption]: [confidence %]

## Unknowns

- [what couldn't be determined and why]

## Suggested Next Actions

- [specific action 1]
- [specific action 2]
```

Severity definitions:

| Level | Meaning | Action |
|-------|---------|--------|
| P0 | Critical — blocks deployment/correctness | Fix immediately |
| P1 | High — significant quality/security issue | Fix before ship |
| P2 | Medium — should fix, non-blocking | Fix if time allows |
| P3 | Low — nice to have, cosmetic | Kill list candidate |

## Exit Condition

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 3 "map-complete" \
  "agents_launched=[n]" \
  "agents_completed=[n]" \
  "findings=[total]" \
  "p0=[n]" "p1=[n]" "p2=[n]" "p3=[n]"
```

**PROCEED** if >=80% agents complete.
**PARTIAL** if <80% → report available findings, offer retry for missing agents.
