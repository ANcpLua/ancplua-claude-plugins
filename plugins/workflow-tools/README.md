# workflow-tools

Post-audit workflow commands for systematic fixing, deep reasoning, and parallel implementation.

## Commands

### `/fix-pipeline`

Takes audit findings and systematically fixes them: **Deep Analysis → Plan → Implement → Verify**

```bash
# Fix a specific issue
/fix-pipeline issue="Generator NRE in DiagnosticFlow" severity=P0

# Fix all blocking issues
/fix-pipeline issue="all-blocking" severity=P0
```

**Phases:**
1. Deep Analysis (2+ agents parallel)
2. Solution Design
3. Implementation with TDD
4. Verification

### `/deep-think`

Extended reasoning for complex problems using multiple perspectives before acting.

```bash
# Complex debugging
/deep-think problem="NullReferenceException in HasErrors" context="src/Generators"

# Architecture decision
/deep-think problem="Should we split analyzers into separate assembly?"

# Refactoring strategy
/deep-think problem="How to implement 16 missing diagnostics efficiently"
```

**Perspectives:**
- Deep Debugger (root cause analysis)
- Architect (system impact)
- Code Explorer (codebase investigation)
- Devil's Advocate (risk analysis)

### `/batch-implement`

Parallel implementation of multiple similar items with shared patterns.

```bash
# Implement multiple diagnostics
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012"

# Add batch of tests
/batch-implement type=tests items="EmptyErrors,ErrorOrExtensions"

# Fix multiple issues
/batch-implement type=fixes items="internal-visibility,missing-registration"
```

**Workflow:**
1. Pattern Analysis (learn from existing implementations)
2. Parallel Implementation (one agent per item)
3. Integration Review
4. Batch Verification

## Typical Workflow

```bash
# 1. Run audit (swarm-audit or similar)
/swarm-audit mode=full

# 2. Deep think on complex issues
/deep-think problem="Root cause of P0 blocker"

# 3. Fix blocking issues systematically
/fix-pipeline issue="P0-blocker" severity=P0

# 4. Batch implement missing features
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012,EOE013"

# 5. Run audit again to verify
/swarm-audit mode=tournament
```

## Installation

```bash
claude plugin install workflow-tools@ancplua-claude-plugins
```
