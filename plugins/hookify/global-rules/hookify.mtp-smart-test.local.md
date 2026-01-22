---
name: mtp-smart-test-filtering
enabled: true
event: bash
action: block
conditions:
  - field: command
    operator: regex_match
    pattern: dotnet\s+test
  - field: command
    operator: not_contains
    pattern: --filter-
---

⚠️ **Full test suite detected - consider filtering**

You're running the full test suite. If previous tests failed, run only failing tests.

## xUnit v3 + MTP v2 Filter Syntax

**Simple filters (recommended):**
```bash
# Run specific test method (wildcards supported)
dotnet test --filter-method "Namespace.Class.MethodName"
dotnet test --filter-method "*MethodName"
dotnet test --filter-method "*.FailingTest"

# Run all tests in a class
dotnet test --filter-class "Namespace.ClassName"
dotnet test --filter-class "*ClassName"

# Run all tests in a namespace
dotnet test --filter-namespace "MyNamespace"

# Combine multiple (OR logic)
dotnet test --filter-method "*Test1" --filter-method "*Test2"
```

**Query-based filters (advanced):**
```bash
# Exact match
dotnet test --filter-query "name = FailingTest"

# Contains (use ~)
dotnet test --filter-query "name ~ Failing"

# NOT contains
dotnet test --filter-query "name !~ Integration"

# AND/OR logic
dotnet test --filter-query "(name ~ Unit) and (namespace ~ Core)"
```

## MTP Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 2 | Test failure(s) |
| 5 | Invalid CLI arguments (wrong filter syntax!) |
| 8 | Zero tests discovered (filter too restrictive) |

## Before Re-running Full Suite

1. Did I identify which specific tests failed?
2. Can I run just those tests with `--filter-method`?
3. Am I stuck in a loop running the same failing tests?

**If stuck:** Use the `dotnet-mtp-advisor` agent for MTP CLI troubleshooting.

**Note:** The old VSTest `--filter "FullyQualifiedName~X"` syntax does NOT work with MTP v2!
