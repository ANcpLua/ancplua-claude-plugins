---
name: batch-implement
description: Parallel implementation of multiple similar items using shared patterns
arguments:
  - name: type
    description: "Type of items: diagnostics|tests|endpoints|features|fixes|migrations"
    required: true
  - name: items
    description: "Comma-separated list of items to implement"
    required: true
  - name: template
    description: "Path to existing implementation to use as template"
    default: "auto-detect"
---

# Batch Implementation

Parallel implementation of similar items with shared patterns.

**Type:** {{ type }}
**Items:** {{ items }}
**Template:** {{ template }}

---

## Phase 1: Pattern Analysis

### Template Extractor
```yaml
subagent_type: feature-dev:code-explorer
prompt: |
  TYPE: {{ type }}
  ITEMS: {{ items }}
  TEMPLATE: {{ template }}

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

---

## Phase 2: Parallel Implementation

For each item in `{{ items }}`, launch an agent:

### Implementation Agent (per item)
```yaml
subagent_type: feature-dev:code-architect
prompt: |
  IMPLEMENT: [ITEM_NAME]
  TYPE: {{ type }}

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

---

## Phase 3: Integration Review

### Consistency Reviewer
```yaml
subagent_type: feature-dev:code-reviewer
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

---

## Phase 4: Batch Verification

```bash
# Build all
dotnet build --no-incremental 2>&1 || npm run build 2>&1

# Run tests for new items
dotnet test --filter "{{ type }}" 2>&1 || npm test -- --grep "{{ type }}" 2>&1

# Lint
dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1
```

---

## Type-Specific Guidance

{{#if (eq type "diagnostics")}}
### Diagnostic Implementation

For each diagnostic:
1. Add descriptor to `Descriptors.cs`
2. Add analysis logic to analyzer
3. Add to `SupportedDiagnostics`
4. Write unit test triggering the diagnostic
5. Write test for code fix if applicable

**Pattern file:** Find existing `EOE00X` implementation
{{/if}}

{{#if (eq type "tests")}}
### Test Implementation

For each test area:
1. Identify untested code paths
2. Write unit tests for happy path
3. Write tests for edge cases
4. Write tests for error conditions
5. Verify coverage increase

**Pattern file:** Find existing test class
{{/if}}

{{#if (eq type "endpoints")}}
### Endpoint Implementation

For each endpoint:
1. Define route and HTTP method
2. Add request/response DTOs
3. Implement handler logic
4. Add validation
5. Add OpenAPI documentation
6. Write integration test

**Pattern file:** Find existing endpoint
{{/if}}

{{#if (eq type "fixes")}}
### Fix Implementation

For each fix:
1. Locate the issue
2. Write regression test (failing)
3. Implement minimal fix
4. Verify test passes
5. Check for similar issues

**Pattern:** TDD - test first, then fix
{{/if}}

{{#if (eq type "migrations")}}
### Migration Implementation

For each migration:
1. Identify source pattern
2. Identify target pattern
3. Write transformation
4. Verify compilation
5. Run tests
6. Update documentation

**Pattern:** Incremental, one file at a time
{{/if}}

---

## Output Summary

After completion:

| Item | Status | Files | Tests |
|------|--------|-------|-------|
| [item1] | Done/Failed | [paths] | Pass/Fail |
| [item2] | Done/Failed | [paths] | Pass/Fail |
| ... | ... | ... | ... |

**Total:** X/Y items implemented successfully
