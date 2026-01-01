# dotnet-architecture-lint

Enforces .NET build patterns for centralized version management.

## Problem

AI agents lose context and break centralized version management:
- Hardcode versions instead of using `$(VariableName)`
- Import Version.props from wrong locations
- Replace symlinks with regular files
- Bypass CPM with inline PackageReference versions

## Solution

Hybrid approach:
- **Deterministic script** detects violations (no false positives)
- **PostToolUse hook** triggers after MSBuild file edits
- **Prompt instructions** guide fixes

## Rules

| Rule | Catches | Severity |
|------|---------|----------|
| **A** | Hardcoded `Version="1.2.3"` in Directory.Packages.props | ERROR |
| **B** | Version.props imported outside allowed files | ERROR |
| **C** | Version.props not a symlink (in consumer repos) | ERROR |
| **G** | `<PackageReference Version="...">` in .csproj | ERROR |

## Usage

### On-Demand

```
/lint-dotnet
```

### Automatic

The PostToolUse hook triggers automatically when you edit:
- `*.props`
- `*.targets`
- `*.csproj`
- `global.json`
- `nuget.config`

## Multi-Repo Pattern

```
ANcpLua.NET.Sdk/src/common/Version.props  <- Source of truth
    ^ symlink
ANcpLua.Analyzers/Version.props
    ^ symlink
ANcpLua.Roslyn.Utilities/Version.props
```

The linter distinguishes source repos (has `src/common/Version.props`) from consumer repos (should have symlink).

## Allowed Version.props Import Owners

| File | Purpose |
|------|---------|
| `Directory.Packages.props` | CPM-enabled projects |
| `eng/Directory.Build.props` | CPM-disabled projects |
| `src/Sdk/*/Sdk.props` | SDK entry points (MSBuild auto-imports these) |
| `src/common/*.props` | Shared SDK infrastructure |
