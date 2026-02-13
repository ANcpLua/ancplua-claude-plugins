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
  - field: command
    operator: not_contains
    pattern: "# VERIFY"
---

Full test suite detected. If previous tests failed, filter to just those tests.

**Bypass:** append `# VERIFY` to the command.
**Filter:** `dotnet test --filter-method "*FailingTestName"`
**Help:** use `dotnet-mtp-advisor` agent for MTP filter syntax.
