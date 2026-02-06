---
description: "Parallel implementation of multiple similar items using shared patterns. Usage: /batch-implement [type] [items]"
allowed-tools: Task, Bash, TodoWrite
---

# Batch Implementation

Parallel implementation of similar items with shared patterns.

**Type:** $1 (options: diagnostics|tests|endpoints|features|fixes|migrations)
**Items:** $2 (comma-separated list of items to implement)

---

## EXECUTION INSTRUCTIONS

**RUN ALL PHASES WITHOUT STOPPING.**

CRITICAL INSTRUCTIONS:

1. Execute ALL phases (1->2->3->4) in sequence WITHOUT pausing
2. For Phase 2, launch ONE agent PER ITEM in PARALLEL (max 6 items for total 8 agents)
3. Maximum 8 total agents (1 extractor + 6 implementers + 1 reviewer = 8)
4. If more than 6 items requested, batch them into groups of 6
5. Use TodoWrite: one todo per item, mark complete as each finishes
6. Only stop if: build fails, tests fail, or unrecoverable error
7. At the end, provide the summary table

**YOUR NEXT MESSAGE: Launch 1 Task tool call for Phase 1 pattern extraction.**

---

## Phase 1: Pattern Analysis

### Template Extractor

```yaml
subagent_type: feature-dev:code-explorer
description: "Extract implementation pattern"
prompt: |
  TYPE: [insert $1 here]
  ITEMS: [insert $2 here]

  MISSION: Extract implementation pattern.

  FIND:
  1. Existing implementations of this type
  2. Common code structure
  3. Required boilerplate
  4. Test patterns
  5. Registration/wiring needed

  CREATE TEMPLATE:
  - File structure
  - Code skeleton
  - Naming conventions
  - Integration points

  Output: Implementation template with placeholders
```

**-> IMMEDIATELY proceed to Phase 2 after template extraction.**

---

## Phase 2: Parallel Implementation

**IMPORTANT:** Launch ONE agent PER ITEM in a SINGLE message with MULTIPLE Task tool calls.

Parse the items from $2 (comma-separated) and create one agent per item:

### Implementation Agent (create one per item)

```yaml
subagent_type: feature-dev:code-architect
description: "Implement [ITEM_NAME]"
prompt: |
  IMPLEMENT: [ITEM_NAME from $2]
  TYPE: [insert $1 here]

  USING TEMPLATE from Phase 1:

  FOLLOW TDD:
  1. Write failing test
  2. Implement feature
  3. Verify test passes
  4. Add integration test if needed

  CHECKLIST:
  - [ ] Follows template pattern
  - [ ] Unit test written
  - [ ] Implementation complete
  - [ ] Registered/wired correctly
  - [ ] No copy-paste errors

  Output: Files created with paths
```

**-> Wait for ALL parallel agents to complete, then IMMEDIATELY proceed to Phase 3.**

---

## Phase 3: Integration Review

### Consistency Reviewer

```yaml
subagent_type: feature-dev:code-reviewer
description: "Review consistency"
prompt: |
  REVIEW all new implementations:

  CHECK:
  1. Consistent naming across all items
  2. No conflicts between items
  3. All registrations complete
  4. Tests follow same pattern
  5. No duplicate code that should be shared

  Output: Issues found + recommendations
```

**-> Fix any issues found, then IMMEDIATELY proceed to Phase 4.**

---

## Phase 4: Batch Verification

Run these commands and report results:

```bash
# Build all
dotnet build --no-incremental 2>&1 || npm run build 2>&1 || make build 2>&1

# Run tests for new items
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1

# Lint
dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1 || make lint 2>&1
```

---

## Type-Specific Guidance

Based on the type ($1), follow these patterns:

### diagnostics

For each diagnostic:

1. Add descriptor to `Descriptors.cs`
2. Add analysis logic to analyzer
3. Add to `SupportedDiagnostics`
4. Write unit test triggering the diagnostic
5. Write test for code fix if applicable

### tests

For each test area:

1. Identify untested code paths
2. Write unit tests for happy path
3. Write tests for edge cases
4. Write tests for error conditions
5. Verify coverage increase

### endpoints

For each endpoint:

1. Define route and HTTP method
2. Add request/response DTOs
3. Implement handler logic
4. Add validation
5. Add OpenAPI documentation
6. Write integration test

### fixes

For each fix:

1. Locate the issue
2. Write regression test (failing)
3. Implement minimal fix
4. Verify test passes
5. Check for similar issues

### migrations

For each migration:

1. Identify source pattern
2. Identify target pattern
3. Write transformation
4. Verify compilation
5. Run tests
6. Update documentation

---

## Output Summary

After Phase 4, provide this summary table:

| Item | Status | Files | Tests |
|------|--------|-------|-------|
| [item1] | Done/Failed | [paths] | Pass/Fail |
| [item2] | Done/Failed | [paths] | Pass/Fail |
| ... | ... | ... | ... |

**Total:** X/Y items implemented successfully
