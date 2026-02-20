# Error Handling Conventions

## Standardized Error Responses

When reporting errors, use this format:

```markdown
## Error Report

**Type:** [Validation|Runtime|Configuration]
**Severity:** [Critical|High|Medium|Low]
**Location:** [File:Line or Command]

### Description

[What went wrong]

### Evidence

[Error output, logs, or screenshots]

### Attempted Fixes

1. [What you tried]
2. [What you tried]

### Recommendation

[Next steps or escalation path]
```

## Validation Failures

1. Parse error output completely
2. Identify root cause (not just symptoms)
3. Attempt automatic fix if deterministic
4. Re-run after fixing the identified issue; escalate if same error recurs on unchanged input
5. Escalate with full context if persistent

## Never Hide Failures

- Show error output in reports
- Explain why something failed
- Propose solutions, don't just report problems
