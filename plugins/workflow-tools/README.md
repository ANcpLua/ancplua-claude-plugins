# workflow-tools

Post-audit workflow commands for systematic fixing, deep reasoning, and parallel implementation.

**All commands run fully autonomous by default** - no stopping for user input between phases.

## Commands

### `/fix-pipeline`

Takes audit findings and systematically fixes them: **Deep Analysis → Plan → Implement → Verify**

```bash
# Fix a specific issue (runs fully autonomous)
/fix-pipeline issue="Generator NRE in DiagnosticFlow" severity=P0

# Interactive mode (pauses between phases)
/fix-pipeline issue="complex-bug" auto=false
```

**Phases:**
1. Deep Analysis (3 agents in parallel)
2. Solution Design (architect + devil's advocate)
3. Implementation with TDD
4. Verification (build + test + lint)

### `/deep-think`

Extended reasoning for complex problems using multiple perspectives before acting.

```bash
# Complex debugging (autonomous)
/deep-think problem="NullReferenceException in HasErrors" context="src/Generators"

# Architecture decision
/deep-think problem="Should we split analyzers into separate assembly?" mode=architecture

# Interactive mode
/deep-think problem="Refactoring strategy" auto=false
```

**Perspectives (parallel agents):**
- Deep Debugger (root cause analysis)
- Architect (system impact)
- Code Explorer (codebase investigation)
- Devil's Advocate (risk analysis)

### `/batch-implement`

Parallel implementation of multiple similar items with shared patterns.

```bash
# Implement multiple diagnostics (one agent per item, in parallel)
/batch-implement type=diagnostics items="EOE010,EOE011,EOE012"

# Add batch of tests
/batch-implement type=tests items="EmptyErrors,ErrorOrExtensions"

# Fix multiple issues
/batch-implement type=fixes items="internal-visibility,missing-registration"
```

**Workflow:**
1. Pattern Analysis (extract template from existing code)
2. Parallel Implementation (one agent per item simultaneously)
3. Integration Review (consistency check)
4. Batch Verification (build + test + lint)

## Autonomous Mode

All commands default to `auto=true`:
- Runs all phases without stopping
- No "should I continue?" prompts
- Only stops on errors (build/test failures)
- Provides single consolidated summary at end

Use `auto=false` for interactive mode with pauses between phases.

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
claude plugin marketplace add ANcpLua/ancplua-claude-plugins
claude plugin install workflow-tools@ancplua-claude-plugins
```
