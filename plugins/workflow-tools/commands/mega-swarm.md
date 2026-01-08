---
description: "Maximum parallel audit - launches 12 specialized agents simultaneously for comprehensive codebase analysis. Usage: /mega-swarm [scope:full] [focus]"
allowed-tools: Task, TodoWrite
---

# MEGA SWARM AUDIT

**Scope:** $1 (default: full - options: full|src|tests|config|security)
**Focus:** $2 (optional focus area or concern)

---

## EXECUTION INSTRUCTIONS

**YOU MUST USE THE TASK TOOL TO LAUNCH 12 PARALLEL AGENTS.**

REQUIRED BEHAVIOR:
- Use the Task tool with subagent_type parameter
- Launch ALL 12 agents in ONE message with 12 Task tool calls
- Each Task call must have: description, prompt, subagent_type
- WAIT for agents to complete, then synthesize results

**YOUR NEXT MESSAGE MUST CONTAIN 12 Task TOOL CALLS.**

---

## THE SWARM (12 Parallel Agents)

Launch ALL in ONE message. For each agent, use the Task tool with the specified subagent_type and adapt the prompt to include the user's scope ($1) and focus ($2).

### Agent 1: Architecture Auditor
```yaml
subagent_type: framework-migration:architect-review
model: opus
description: "Audit architecture"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Architecture & Design

  1. Is the architecture sound?
  2. Coupling/cohesion issues?
  3. SOLID violations?
  4. Scalability concerns?

  Output: Architecture issues with severity (P0-P3)
```

### Agent 2: Security Auditor
```yaml
subagent_type: feature-dev:code-reviewer
description: "Audit security"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Security

  1. Injection vulnerabilities?
  2. Auth/authz issues?
  3. Secrets exposed?
  4. Input validation?
  5. OWASP Top 10?

  Output: Security issues with severity
```

### Agent 3: Performance Auditor
```yaml
subagent_type: feature-dev:code-explorer
description: "Audit performance"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Performance

  1. N+1 queries?
  2. Memory leaks?
  3. Unnecessary allocations?
  4. Blocking calls?
  5. Cache misses?

  Output: Performance issues with severity
```

### Agent 4: Test Coverage Auditor
```yaml
subagent_type: feature-dev:code-reviewer
description: "Audit test coverage"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Test Quality

  1. Coverage gaps?
  2. Flaky tests?
  3. Missing edge cases?
  4. Test quality issues?
  5. Integration test gaps?

  Output: Test issues with severity
```

### Agent 5: Code Quality Auditor
```yaml
subagent_type: feature-dev:code-reviewer
description: "Audit code quality"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Code Quality

  1. Dead code?
  2. Duplications?
  3. Complex functions (cyclomatic)?
  4. Magic numbers/strings?
  5. Naming issues?

  Output: Quality issues with severity
```

### Agent 6: Error Handling Auditor
```yaml
subagent_type: deep-debugger
description: "Audit error handling"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Error Handling

  1. Swallowed exceptions?
  2. Missing error handling?
  3. Poor error messages?
  4. Unhandled edge cases?
  5. Recovery mechanisms?

  Output: Error handling issues with severity
```

### Agent 7: API Contract Auditor
```yaml
subagent_type: feature-dev:code-explorer
description: "Audit API contracts"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: API Contracts

  1. Breaking changes?
  2. Version compatibility?
  3. Documentation accuracy?
  4. Response consistency?
  5. Error response format?

  Output: API issues with severity
```

### Agent 8: Dependency Auditor
```yaml
subagent_type: Explore
description: "Audit dependencies"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Dependencies

  1. Outdated packages?
  2. Security vulnerabilities?
  3. License issues?
  4. Unnecessary dependencies?
  5. Version conflicts?

  Output: Dependency issues with severity
```

### Agent 9: Configuration Auditor
```yaml
subagent_type: Explore
description: "Audit configuration"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Configuration

  1. Hardcoded values?
  2. Missing env vars?
  3. Config validation?
  4. Secrets management?
  5. Environment parity?

  Output: Config issues with severity
```

### Agent 10: Documentation Auditor
```yaml
subagent_type: Explore
description: "Audit documentation"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Documentation

  1. Outdated docs?
  2. Missing docs?
  3. Code comments?
  4. README accuracy?
  5. API documentation?

  Output: Doc issues with severity
```

### Agent 11: Consistency Auditor
```yaml
subagent_type: feature-dev:code-reviewer
description: "Audit consistency"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  AUDIT: Consistency

  1. Naming conventions?
  2. Code style violations?
  3. Pattern inconsistencies?
  4. File organization?
  5. Import ordering?

  Output: Consistency issues with severity
```

### Agent 12: Bug Hunter
```yaml
subagent_type: deep-debugger
model: opus
description: "Hunt for bugs"
prompt: |
  SCOPE: [insert $1 here, default: full]
  FOCUS: [insert $2 here if provided]

  HUNT: Active Bugs

  1. Null reference risks?
  2. Race conditions?
  3. Off-by-one errors?
  4. Resource leaks?
  5. Logic errors?

  Output: Potential bugs with severity
```

---

## SWARM SYNTHESIS

After ALL 12 agents complete, synthesize results:

```
+------------------------------------------------------------------+
|                    MEGA SWARM REPORT                             |
+------------------------------------------------------------------+
| Agents Deployed: 12          Time: [X min]                       |
+------------------------------------------------------------------+
|                     ISSUES BY SEVERITY                           |
|  P0 (Critical):  [count]                                         |
|  P1 (High):      [count]                                         |
|  P2 (Medium):    [count]                                         |
|  P3 (Low):       [count]                                         |
+------------------------------------------------------------------+
|                     ISSUES BY CATEGORY                           |
|  Security:       [count]  |  Performance:    [count]             |
|  Architecture:   [count]  |  Tests:          [count]             |
|  Code Quality:   [count]  |  Errors:         [count]             |
|  API:            [count]  |  Dependencies:   [count]             |
|  Config:         [count]  |  Docs:           [count]             |
|  Consistency:    [count]  |  Bugs:           [count]             |
+------------------------------------------------------------------+
```

### P0 Issues (Fix Immediately)
| # | Category | Issue | Location |
|---|----------|-------|----------|
| 1 | [cat] | [description] | [file:line] |

### P1 Issues (Fix Soon)
| # | Category | Issue | Location |
|---|----------|-------|----------|
| 1 | [cat] | [description] | [file:line] |

### Recommended Fix Order
1. [Most critical issue]
2. [Second most critical]
3. [Third most critical]

**Next Command:**
```
/turbo-fix issue="[P0 issue description]" severity=P0
```
