---
name: mega-swarm
description: Maximum parallel audit - launches 12+ specialized agents simultaneously for comprehensive codebase analysis
arguments:
  - name: scope
    description: "Scope to audit: full|src|tests|config|security"
    default: "full"
  - name: focus
    description: "Optional focus area or concern"
    default: ""
---

# MEGA SWARM AUDIT

**Scope:** {{ scope }}
**Focus:** {{ focus }}

---

<CRITICAL_EXECUTION_REQUIREMENT>
**YOU MUST USE THE TASK TOOL TO LAUNCH 12 PARALLEL AGENTS.**

⚠️ FORBIDDEN BEHAVIOR:
- DO NOT read files yourself
- DO NOT write code yourself
- DO NOT fix issues yourself
- DO NOT use Glob, Grep, Read, Edit, or Write tools
- DO NOT do ANYTHING except launch Task tools

✅ REQUIRED BEHAVIOR:
- Use the Task tool with subagent_type parameter
- Launch ALL 12 agents in ONE message with 12 Task tool calls
- Each Task call must have: description, prompt, subagent_type
- WAIT for agents to complete, then synthesize

IF YOU DO ANYTHING OTHER THAN LAUNCH TASK TOOLS, YOU HAVE FAILED.

**YOUR NEXT MESSAGE MUST CONTAIN 12 Task TOOL CALLS. NOTHING ELSE.**
</CRITICAL_EXECUTION_REQUIREMENT>

---

## THE SWARM (12 Parallel Agents)

Launch ALL in ONE message:

### Agent 1: Architecture Auditor
```yaml
subagent_type: framework-migration:architect-review
model: opus
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
prompt: |
  SCOPE: {{ scope }}
  FOCUS: {{ focus }}

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
╔══════════════════════════════════════════════════════════════════╗
║                    MEGA SWARM REPORT                             ║
╠══════════════════════════════════════════════════════════════════╣
║ Agents Deployed: 12          Time: [X min]                       ║
╠══════════════════════════════════════════════════════════════════╣
║                     ISSUES BY SEVERITY                           ║
║  P0 (Critical):  [count]                                         ║
║  P1 (High):      [count]                                         ║
║  P2 (Medium):    [count]                                         ║
║  P3 (Low):       [count]                                         ║
╠══════════════════════════════════════════════════════════════════╣
║                     ISSUES BY CATEGORY                           ║
║  Security:       [count]  │  Performance:    [count]             ║
║  Architecture:   [count]  │  Tests:          [count]             ║
║  Code Quality:   [count]  │  Errors:         [count]             ║
║  API:            [count]  │  Dependencies:   [count]             ║
║  Config:         [count]  │  Docs:           [count]             ║
║  Consistency:    [count]  │  Bugs:           [count]             ║
╚══════════════════════════════════════════════════════════════════╝
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
