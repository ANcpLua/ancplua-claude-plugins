#!/usr/bin/env bash
# Inject .NET architecture constraints as passive context on SessionStart.
# Claude gets the rules BEFORE writing code, precheck-dotnet.py enforces AFTER.

# shellcheck disable=SC2016 # Intentional: MSBuild $(Variable) syntax must be literal
CONTEXT='<DOTNET_ARCHITECTURE_RULES>

.NET Build Architecture Constraints (enforced by PreToolUse hook)

## 4 Rules — ALL are ERROR severity

| Rule | What it catches | Where |
|------|----------------|-------|
| A | Hardcoded Version="1.2.3" | Directory.Packages.props |
| B | Version.props imported from wrong file | Any *.props |
| C | Version.props is not a symlink | Consumer repos |
| G | PackageReference with inline Version | Any *.csproj |

## Allowed Version.props Import Owners (Rule B)

ONLY these files may import Version.props:
- Directory.Packages.props (CPM-enabled)
- eng/Directory.Build.props (CPM-disabled)
- src/Sdk/*/Sdk.props (SDK entry points)
- src/common/*.props (shared SDK infrastructure)

## Variable Naming Convention (Rule A fix)

Use MSBuild variables, never literals:
- Some.Package.Name -> $(SomePackageNameVersion)
- Remove dots/dashes, append "Version"

## CPM Awareness (Rule G)

Projects with ManagePackageVersionsCentrally=false are exempt from Rule G.
All other .csproj files MUST NOT have Version= on PackageReference.

## Quick Check

Use skill: /dotnet-architecture-lint (runs lint-dotnet.sh on current directory)

</DOTNET_ARCHITECTURE_RULES>'

echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"
