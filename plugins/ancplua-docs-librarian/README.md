# ANcpLua Docs Librarian Plugin

Documentation librarian for the ANcpLua .NET development ecosystem.

## Overview

This plugin provides Claude with comprehensive knowledge of the ANcpLua "triple combo":

- **Auto-triggers** on questions about SDK, Analyzers, or Utilities
- **Cross-repository search** across all three documentation sources
- **Citation-based answers** with exact file paths
- **Fast lookups** using haiku model for quick responses

## Components

| Component | Type | Purpose |
|-----------|------|---------|
| `ancplua-docs` | Skill | Search strategy and documentation map |
| `ancplua-librarian` | Agent | Answers questions with citations |

## Repositories Covered

| Repository | NuGet Package | Documentation |
|------------|---------------|---------------|
| ANcpLua.NET.Sdk | `ANcpLua.NET.Sdk` | SDK features, banned APIs, polyfills |
| ANcpLua.Analyzers | `ANcpLua.Analyzers` | 17 analyzer rules (AL0001-AL0017) |
| ANcpLua.Roslyn.Utilities | `ANcpLua.Roslyn.Utilities` | DiagnosticFlow, SemanticGuard, patterns |

## Usage

The skill auto-triggers when you ask about:

- SDK variants, banned APIs, polyfills
- Analyzer rules (AL0001-AL0017)
- DiagnosticFlow, SemanticGuard, SymbolPattern
- Guard clauses (Throw.IfNull)
- Test fixtures, MSBuild properties

## Example Queries

```
What analyzer rules exist?
How do I use DiagnosticFlow?
What APIs are banned by the SDK?
What polyfills are available for netstandard2.0?
How do I configure test projects?
```

## Documentation Map

The skill includes a complete map of 75+ documentation files across:

- `/Users/ancplua/ANcpLua.NET.Sdk/`
- `/Users/ancplua/RiderProjects/ANcpLua.Analyzers/`
- `/Users/ancplua/RiderProjects/ANcpLua.Roslyn.Utilities/`

## License

MIT
