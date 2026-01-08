# workflow-tools

Post-audit workflow commands for systematic fixing, deep reasoning, and parallel implementation.

**All commands run fully autonomous** - maximum parallelism, no stopping for user input.

## Commands

### `/mega-swarm` - Comprehensive Codebase Audit

**12 specialized auditors simultaneously** analyzing your entire codebase.

```bash
/mega-swarm scope=full
/mega-swarm scope=src focus="error handling"
```

**When to use:** Starting a new project audit, before major refactors, periodic health checks.

| Auditor | Focus Area |
|---------|------------|
| Architecture | Design, SOLID, coupling |
| Security | OWASP, injection, auth |
| Performance | N+1, memory, blocking |
| Tests | Coverage, quality, flaky |
| Code Quality | Dead code, duplication |
| Error Handling | Exceptions, recovery |
| API | Contracts, versioning |
| Dependencies | Outdated, vulnerabilities |
| Configuration | Hardcoded, secrets |
| Documentation | Accuracy, completeness |
| Consistency | Style, patterns |
| Bug Hunter | Null refs, race conditions |

**Output:** Consolidated report with issues ranked P0-P3, recommended fix order.

---

### `/turbo-fix` - Maximum Parallelism Fix Pipeline

**16 agents across 4 phases** for fastest issue resolution.

```bash
/turbo-fix issue="Generator NRE in DiagnosticFlow" severity=P0
/turbo-fix issue="Memory leak in cache" severity=P1 context=src/Cache
```

**When to use:** Critical bugs (P0/P1), complex issues requiring deep analysis.

| Phase | Agents | Purpose |
|-------|--------|---------|
| 1. Analysis | 6 | Root cause, impact, history, patterns, tests |
| 2. Solutions | 4 | 3 architects + devil's advocate |
| 3. Implement | 3 | Tests, code, docs |
| 4. Verify | 3 | Build, test, lint |

**Key features:** Uses Opus model for root cause analysis and solution architecture.

---

### `/tournament` - Competitive Coding Tournament

**N agents compete independently**, judge picks the best solution.

```bash
/tournament task="Fix all 47 build warnings" competitors=5
/tournament task="Optimize database queries" competitors=8
```

**When to use:** Problems with multiple valid approaches, optimization challenges, quality competitions.

| Phase | What Happens |
|-------|--------------|
| Round 1 | N agents work on SAME task independently |
| Round 2 | Judge scores: correctness (40%), elegance (25%), performance (20%), completeness (15%) |
| Round 3 | Winner's solution gets implemented |
| Final | Build + Test verification |

**Agents:** N competitors + 1 judge + 1 implementer.

---

### `/fix-pipeline` - Systematic Fix Pipeline

**8 agents across 4 phases** for methodical issue resolution.

```bash
/fix-pipeline issue="Generator NRE" severity=P0
/fix-pipeline issue="complex-bug" severity=P2 context=src/Core
```

**When to use:** Standard bug fixes, issues requiring careful analysis before implementation.

| Phase | Agents | Purpose |
|-------|--------|---------|
| 1. Analysis | 3 | Root cause, impact, codebase context |
| 2. Design | 2 | Solution architect + devil's advocate |
| 3. Implement | 1 | TDD implementation |
| 4. Verify | 1 | Build, test, lint |

**Key features:** TDD enforced, single implementer for focused changes.

---

### `/deep-think` - Extended Multi-Perspective Reasoning

**5 agents across 2 phases** for complex problem analysis.

```bash
/deep-think problem="Architecture decision for caching" mode=architecture
/deep-think problem="Complex debugging scenario" context=src/Generators mode=debug
```

**When to use:** Before major decisions, complex debugging, architecture planning, refactoring strategy.

| Phase | Agents | Perspectives |
|-------|--------|--------------|
| 1. Understanding | 3 | Debugger, Architect, Explorer |
| 2. Synthesis | 2 | Solution Designer + Devil's Advocate |

**Modes:** `debug` (default), `architecture`, `refactor`, `decision`.

**Output:** Ranked solutions with confidence, risk, and complexity scores.

---

### `/batch-implement` - Parallel Implementation

**N+2 agents** for implementing multiple similar items efficiently.

```bash
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012"
/batch-implement type=tests items="EmptyErrors,ErrorOrExtensions"
/batch-implement type=endpoints items="GetUser,UpdateUser,DeleteUser"
```

**When to use:** Implementing multiple similar features, adding test coverage, creating endpoints.

| Phase | Agents | Purpose |
|-------|--------|---------|
| 1. Pattern | 1 | Extract implementation template |
| 2. Implement | N | One agent per item (parallel) |
| 3. Review | 1 | Consistency check |
| 4. Verify | - | Build, test, lint |

**Supported types:** `diagnostics`, `tests`, `endpoints`, `features`, `fixes`, `migrations`.

---

## Agent Comparison

| Command | Total Agents | Execution Pattern | Best For |
|---------|--------------|-------------------|----------|
| `/mega-swarm` | 12 | All simultaneous | Full codebase audit |
| `/turbo-fix` | 16 | 6-4-3-3 (phased) | Critical fixes |
| `/tournament` | N+2 | N competing + judge | Quality optimization |
| `/fix-pipeline` | 8 | 3-2-1-1 (phased) | Standard bug fixes |
| `/deep-think` | 5 | 3-2 (phased) | Analysis before action |
| `/batch-implement` | N+2 | 1-N-1 (parallel) | Similar items |

## Typical Workflow

```bash
# 1. Audit the codebase
/mega-swarm scope=full

# 2. Fix critical issues with maximum parallelism
/turbo-fix issue="P0 from audit" severity=P0

# 3. Think through architectural decisions
/deep-think problem="How to refactor the cache layer" mode=architecture

# 4. Batch implement missing features
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012"

# 5. Re-audit to confirm fixes
/mega-swarm scope=full
```

## Dependencies

This plugin integrates with agents from:

- `feature-dev` - code-architect, code-explorer, code-reviewer
- `metacognitive-guard` - arch-reviewer

## Installation

```bash
claude plugin marketplace add ANcpLua/ancplua-claude-plugins
claude plugin install workflow-tools@ancplua-claude-plugins
```

## License

MIT
