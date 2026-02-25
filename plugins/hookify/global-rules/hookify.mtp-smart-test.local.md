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

This hookify rule blocked a full test suite run. This is intentional, not a bug.

**Action required — pick one:**

1. **Verify all tests pass** → Re-run the exact same command with `# VERIFY` appended
2. **Run only failing tests** → Use `--filter-method "*FailingTestName"` or `--filter-class "*ClassName"`
3. **Need MTP filter help** → Spawn the `dotnet-mtp-advisor` agent

Do NOT tell the user this is a bug. Do NOT tell the user to run the command themselves. Just pick option 1 or 2 and retry.
