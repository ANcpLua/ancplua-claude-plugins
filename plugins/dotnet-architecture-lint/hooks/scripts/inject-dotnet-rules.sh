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

## Version Lookup (NEVER guess versions)

When adding or updating a NuGet package:
1. WebFetch https://api.nuget.org/v3-flatcontainer/{package-id-lowercase}/index.json -> pick latest stable
2. Or: mcp__github__get_latest_release for packages hosted on GitHub
3. Put version in Version.props as $(PackageNameVersion), reference via CPM

Example flow for Serilog:
- WebFetch https://api.nuget.org/v3-flatcontainer/serilog/index.json -> get latest
- Version.props: <SerilogVersion>X.Y.Z</SerilogVersion>
- Directory.Packages.props: <PackageVersion Include="Serilog" Version="$(SerilogVersion)" />
- .csproj: <PackageReference Include="Serilog" /> (no version!)

## Quick Check

Use skill: /dotnet-architecture-lint (runs lint-dotnet.sh on current directory)

</DOTNET_ARCHITECTURE_RULES>'

echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"
