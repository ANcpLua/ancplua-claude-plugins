# dotnet-architecture-lint

Enforces .NET MSBuild patterns via 3 layers: passive context injection, pre-write validation, and post-hoc linting.

## Files

| File | Purpose |
|------|---------|
| `hooks/hooks.json` | Declares SessionStart + PreToolUse hooks |
| `hooks/scripts/inject-dotnet-rules.sh` | SessionStart: injects 4 rules as passive context |
| `scripts/precheck-dotnet.py` | PreToolUse: validates Write/Edit on .props/.csproj files (rules A/B/G) |
| `scripts/lint-dotnet.sh` | Post-hoc linter checking all 4 rules (A/B/C/G) |

## Rules

| Rule | Catches | Fix |
|------|---------|-----|
| A | Hardcoded `Version="1.2.3"` in Directory.Packages.props | Use `$(PackageNameVersion)` variable |
| B | Version.props imported from wrong file | Only allowed owners: DPP, eng/DBP, Sdk.props, common/*.props |
| C | Version.props is not a symlink (consumer repos) | Replace with symlink to source |
| G | `<PackageReference Version="...">` in .csproj | Remove Version attr, use CPM |

## 3-Layer Architecture

1. **SessionStart** (inject-dotnet-rules.sh): Claude knows rules BEFORE writing code
2. **PreToolUse** (precheck-dotnet.py): Blocks violations on Write/Edit (exit code 2 = block)
3. **Post-hoc** (lint-dotnet.sh): Deterministic scan of all files (rules A/B/C/G)

## Notes

- Rule C (symlink check) only works in post-hoc linter (can't check before file creation).
- Hades god mode: active `.smart/delete-permit.json` bypasses all checks.
