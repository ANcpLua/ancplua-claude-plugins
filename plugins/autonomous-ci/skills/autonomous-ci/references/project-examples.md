# Project-Specific CI Examples

## Local Verification by Project Type

| Type | Build | Test |
|------|-------|------|
| .NET | `dotnet build --configuration Release` | `dotnet test --no-build --configuration Release` |
| Node.js | `npm run build` | `npm test` |
| Python | — | `pytest` |
| Go | `go build ./...` | `go test ./...` |

## Multi-Workflow Projects

For projects with multiple CI workflows:

```bash
gh run list --commit <sha> --json databaseId,name,conclusion
# ALL must pass
```

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Tests passed locally" | CI environment may differ |
| "It's a small change" | Small changes break CI too |
| "I'm confident" | Confidence ≠ verification |
| "CI takes too long" | Waiting is mandatory |
| "Just this once" | No exceptions |

## Success Report Template

```text
✅ Verification Complete

Local Tests: X/X passed
CI Status: All checks passed

Workflows:
  - tests.yml: ✅ success (URL)
  - lint.yml: ✅ success (URL)

Commit: <sha>
```
