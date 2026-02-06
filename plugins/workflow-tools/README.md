# workflow-tools v2.0.0

Multi-agent workflow orchestration with configurable parallelism, adversarial review patterns, and stage-gated pipelines.

**All commands run fully autonomous** - maximum parallelism, no stopping for user input.

## What's New in v2.0.0

- **Unified `/fix` command** - Merged turbo-fix + fix-pipeline with configurable parallelism
- **`/red-blue-review`** - NEW adversarial Red Team / Blue Team security pattern
- **Mode variants** - All commands support mode= and quick= parameters
- **Gate checkpoints** - Explicit pass/fail validation between phases
- **Penalty scoring** - Tournament now penalizes nitpicks and over-engineering

## Commands

### `/fix` - Unified Fix Pipeline (NEW)

**Configurable parallelism** for issue resolution. Replaces both `/turbo-fix` and `/fix-pipeline`.

```bash
# Standard parallelism (8 agents, 4 phases)
/fix issue="NullRef in Generator" severity=P1

# Maximum parallelism (16 agents, 4 phases)
/fix issue="Critical memory leak" severity=P0 parallelism=maximum

# Quick mode (skip devil's advocate)
/fix issue="Minor bug" severity=P2 quick=true

# Conservative mode (minimal changes, high confidence required)
/fix issue="API change" severity=P1 mode=conservative
```

| Parallelism | Agents | Phases | Best For |
|-------------|--------|--------|----------|
| **maximum** | 16 | 6→4→3→3 | P0 critical bugs |
| **standard** | 8 | 3→2→1→1 | P1/P2 standard bugs |

**Key features:** Gate checkpoints between phases, mode variants (aggressive/balanced/conservative).

---

### `/red-blue-review` - Adversarial Review (NEW)

**Red Team attacks, Blue Team defends, verify fixes.**

```bash
/red-blue-review target="staged changes"
/red-blue-review target="src/Generators" scope=security
```

| Phase | Agents | Purpose |
|-------|--------|---------|
| 1. Red Attack | 3 | Crash Hunter, Security Attacker, API Breaker |
| 2. Blue Defense | 1 per finding | Propose and test fixes |
| 3. Verification | 1 per fix | Red re-attacks to validate |

**Scoring system:** Valid findings = points, false alarms = penalties.
**Output:** Release recommendation (SAFE / BLOCK).

---

### `/mega-swarm` - Comprehensive Audit

**Configurable agent count** for codebase analysis.

```bash
# Full audit (12 agents)
/mega-swarm scope=full

# Quick audit (6 essential agents)
/mega-swarm scope=full mode=quick

# Focused audit (8 agents on specific area)
/mega-swarm scope=src focus="error handling" mode=focused
```

| Mode | Agents | Best For |
|------|--------|----------|
| **full** | 12 | Release readiness, complete audit |
| **quick** | 6 | Fast health check, CI integration |
| **focused** | 8 | Deep dive on specific concern |

**Auditors:** Architecture, Security, Performance, Tests, Code Quality,
Error Handling, API, Dependencies, Configuration, Documentation,
Consistency, Bug Hunter.

---

### `/tournament` - Competitive Coding

**N agents compete with penalty-based scoring.**

```bash
/tournament task="Fix all 47 build warnings" competitors=5
/tournament task="Optimize database queries" competitors=8
```

**Scoring (visible to competitors upfront):**

| Criterion | Points |
|-----------|--------|
| Correctness | 40 pts |
| Elegance | 25 pts |
| Performance | 20 pts |
| Completeness | 15 pts |
| Style nitpicks | -2 pts |
| Over-engineering | -3 pts |
| Doesn't compile | -10 pts |

**Tiebreaker:** Correctness → Performance → First submitted.

---

### `/deep-think` - Extended Reasoning

**5 agents across 2 phases** for complex problem analysis.

```bash
/deep-think problem="Architecture decision for caching" mode=architecture
/deep-think problem="Complex debugging scenario" context=src/Generators mode=debug
```

| Phase | Agents | Perspectives |
|-------|--------|--------------|
| 1. Understanding | 3 | Debugger, Architect, Explorer |
| 2. Synthesis | 2 | Solution Designer + Devil's Advocate |

**Modes:** `debug`, `architecture`, `refactor`, `decision`.

---

### `/batch-implement` - Parallel Implementation

**N+2 agents** for implementing multiple similar items.

```bash
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012"
/batch-implement type=tests items="EmptyErrors,ErrorOrExtensions"
/batch-implement type=endpoints items="GetUser,UpdateUser,DeleteUser"
```

| Phase | Agents | Purpose |
|-------|--------|---------|
| 1. Pattern | 1 | Extract implementation template |
| 2. Implement | N | One agent per item (parallel) |
| 3. Review | 1 | Consistency check |
| 4. Verify | - | Build, test, lint |

**Supported types:** `diagnostics`, `tests`, `endpoints`, `features`, `fixes`, `migrations`.

---

## Deprecated Commands

The following commands are deprecated and will be removed in v3.0.0:

- `/turbo-fix` → Use `/fix parallelism=maximum` instead
- `/fix-pipeline` → Use `/fix` instead (standard parallelism is default)

---

## Command Comparison

| Command | Agents | Pattern | Best For |
|---------|--------|---------|----------|
| `/fix` | 8-16 | Phased pipeline | Bug fixes |
| `/red-blue-review` | 3+N | Adversarial | Security review |
| `/mega-swarm` | 6-12 | All parallel | Codebase audit |
| `/tournament` | N+2 | Competition | Quality optimization |
| `/deep-think` | 5 | Multi-perspective | Analysis before action |
| `/batch-implement` | N+2 | Template + parallel | Similar items |

## Typical Workflow

```bash
# 1. Audit the codebase
/mega-swarm scope=full mode=quick

# 2. Fix critical issues
/fix issue="P0 from audit" severity=P0 parallelism=maximum

# 3. Security review before release
/red-blue-review target="staged changes"

# 4. Think through architectural decisions
/deep-think problem="How to refactor the cache layer" mode=architecture

# 5. Batch implement missing features
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012"

# 6. Re-audit to confirm fixes
/mega-swarm scope=full
```

## Dependencies

This plugin integrates with agents from:

- `feature-dev` - code-architect, code-explorer, code-reviewer
- `metacognitive-guard` - arch-reviewer
- `deep-debugger` - systematic debugging

## Installation

```bash
claude plugin marketplace add ANcpLua/ancplua-claude-plugins
claude plugin install workflow-tools@ancplua-claude-plugins
```

## License

MIT
