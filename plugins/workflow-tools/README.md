# workflow-tools

Post-audit workflow commands for systematic fixing, deep reasoning, and parallel implementation.

**All commands run fully autonomous** - maximum parallelism, no stopping for user input.

## Commands

### `/tournament` 🏆 NEW

**Competitive coding tournament** - Multiple agents compete, best solution wins.

```bash
/tournament task="Fix all 47 build warnings" competitors=5
/tournament task="Optimize database queries" competitors=8 rounds=double
```

| Phase | What Happens |
|-------|--------------|
| Round 1 | N agents work on SAME task independently |
| Round 2 | Judge scores all solutions (correctness, elegance, performance) |
| Round 3 | Winner's solution gets implemented |
| Final | Build + Test verification |

### `/turbo-fix` ⚡

**16 agents across 4 phases** - Maximum parallelism fix pipeline.

```bash
/turbo-fix issue="Generator NRE in DiagnosticFlow" severity=P0
```

| Phase | Agents | Purpose |
|-------|--------|---------|
| 1. Analysis | 6 parallel | Root cause, impact, history, patterns, tests |
| 2. Solutions | 4 parallel | 3 solution architects + devil's advocate |
| 3. Implement | 3 parallel | Tests, code, docs |
| 4. Verify | 3 parallel | Build, test, lint |

### `/mega-swarm` ⚡ NEW

**12 specialized auditors simultaneously** - Comprehensive codebase analysis.

```bash
/mega-swarm scope=full
/mega-swarm scope=src focus="error handling"
```

| Auditor | Focus |
|---------|-------|
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

### `/fix-pipeline`

Takes audit findings through: **Analysis → Design → Implement → Verify**

```bash
/fix-pipeline issue="Generator NRE" severity=P0
/fix-pipeline issue="complex-bug" auto=false  # Interactive mode
```

### `/deep-think`

Extended reasoning with multiple perspectives.

```bash
/deep-think problem="Architecture decision" mode=architecture
/deep-think problem="Complex debugging" context="src/Generators"
```

### `/batch-implement`

Parallel implementation of similar items.

```bash
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012"
/batch-implement type=tests items="EmptyErrors,ErrorOrExtensions"
```

## Parallelism Comparison

| Command | Total Agents | Execution |
|---------|--------------|-----------|
| `/tournament` | N+2 | N competing + judge + implementer |
| `/mega-swarm` | 12 | All simultaneous audit |
| `/turbo-fix` | 16 | 6→4→3→3 (phased fix) |
| `/fix-pipeline` | 8 | 3→2→1→1 (phased fix) |
| `/deep-think` | 5 | 3→2 (phased reasoning) |
| `/batch-implement` | N+2 | 1→N→1 (parallel items) |

## Workflow

```bash
# 1. Massive parallel audit
/mega-swarm scope=full

# 2. Turbo fix critical issues
/turbo-fix issue="P0 from audit" severity=P0

# 3. Batch implement missing features
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012"

# 4. Verify everything
/mega-swarm scope=full  # Re-audit to confirm fixes
```

## Installation

```bash
claude plugin marketplace add ANcpLua/ancplua-claude-plugins
claude plugin install workflow-tools@ancplua-claude-plugins
```
