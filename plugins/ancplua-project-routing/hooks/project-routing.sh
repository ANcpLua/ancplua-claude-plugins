#!/bin/bash
# Global project routing hook - checks PWD and injects appropriate context

# Check which project we're in and inject routing
if [[ "$PWD" == *"ErrorOrX"* ]]; then
  CONTEXT='<ERROROR_ROUTING>

You are working in ErrorOrX source generator project.

## MANDATORY Routing

| Task | Use |
|------|-----|
| Code changes | Task tool → erroror-generator-specialist |
| Debugging | Task tool → deep-debugger |
| Cross-repo | Skill → /ancplua-ecosystem |
| Before done | dotnet build + dotnet test (show output) |

## Available Skills
- /diagnostic-audit - Audit analyzer diagnostics
- /generator-validate - Validate source generator output
- /swarm-audit - Full codebase audit

## Key Principle
Minimal Interface: Use only IsError/Errors/Value from ErrorOr

</ERROROR_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

elif [[ "$PWD" == *"ANcpLua.Analyzers"* ]]; then
  CONTEXT='<ANALYZERS_ROUTING>

You are working in ANcpLua.Analyzers (44 Roslyn diagnostics).

## MANDATORY Routing

| Task | Use |
|------|-----|
| New diagnostics | Task tool → ancplua-analyzers-specialist |
| Code fixes | Task tool → ancplua-analyzers-specialist |
| Debugging | Task tool → deep-debugger |
| Cross-repo | Skill → /ancplua-ecosystem |
| Before done | dotnet build + dotnet test (show output) |

## Key Patterns
- ALAnalyzer base class
- OperationHelper for syntax analysis
- WellKnownTypes for type checking

</ANALYZERS_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

elif [[ "$PWD" == *"ANcpLua.NET.Sdk"* ]]; then
  CONTEXT='<SDK_ROUTING>

You are working in ANcpLua.NET.Sdk (opinionated MSBuild SDK).

## MANDATORY Routing

| Task | Use |
|------|-----|
| MSBuild changes | Task tool → ancplua-sdk-specialist |
| Props/Targets | Task tool → msbuild-expert |
| Cross-repo | Skill → /ancplua-ecosystem |
| Before done | dotnet build + dotnet test (show output) |

## Key Features
- CPM enforcement
- Analyzer auto-injection
- Test framework setup
- Polyfill packages

</SDK_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

elif [[ "$PWD" == *"ANcpLua.Roslyn.Utilities"* ]]; then
  CONTEXT='<ROSLYN_UTILITIES_ROUTING>

You are working in ANcpLua.Roslyn.Utilities (SOURCE OF TRUTH for Roslyn helpers).

## MANDATORY Routing

| Task | Use |
|------|-----|
| Utility changes | Be careful - consumers depend on this! |
| Cross-repo | Skill → /ancplua-ecosystem |
| Before done | dotnet build + dotnet test (show output) |

## Key Exports
- EquatableArray<T> - Value-equality arrays
- DiagnosticFlow<T> - Railway-oriented errors
- SymbolMatch.* - Fluent pattern matching
- Guard.NotNull() - Argument validation

## Consumers
ErrorOrX, ANcpLua.Analyzers, qyl generators

</ROSLYN_UTILITIES_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

elif [[ "$PWD" == *"qyl"* ]]; then
  CONTEXT='<QYL_ROUTING>

You are working in qyl AI observability platform.

## MANDATORY Routing

| Task | Use |
|------|-----|
| Implementation | Task tool → qyl-observability-specialist |
| OTel work | Task tool → otel-genai-architect |
| TypeSpec | Check qyl/core/specs/ first |
| Before done | dotnet build + dotnet test (show output) |

## Key Patterns
- TypeSpec-first design
- DuckDB storage
- MCP server
- SSE streaming
- BCL-only types in qyl.protocol

</QYL_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

elif [[ "$PWD" == *"ServiceDefaults"* ]]; then
  CONTEXT='<SERVICEDEFAULTS_ROUTING>

You are working in ServiceDefaults1 (zero-config OTel instrumentation).

## MANDATORY Routing

| Task | Use |
|------|-----|
| Implementation | Task tool → servicedefaults-specialist |
| OTel work | Task tool → otel-genai-architect |
| Semantic conventions | Skill → /otel-expert |
| Before done | dotnet build + dotnet test (show output) |

## Key Patterns
- Interceptors
- Runtime decorators
- OTel SemConv v1.39
- Entry: builder.UseQyl() → app.MapQylEndpoints()

</SERVICEDEFAULTS_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

elif [[ "$PWD" == *"Template"* ]]; then
  CONTEXT='<TEMPLATE_ROUTING>

You are working in Template (Clean Architecture ASP.NET Core).

## MANDATORY Routing

| Task | Use |
|------|-----|
| Implementation | Task tool → template-clean-arch-specialist |
| Endpoints | Use EndpointGroupBase pattern |
| CQRS | MediatR handlers |
| Before done | dotnet build + dotnet test (show output) |

## Key Patterns
- EndpointGroupBase
- MediatR CQRS
- Layered architecture
- Based on Jason Taylor template

</TEMPLATE_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

elif [[ "$PWD" == *"ancplua-claude-plugins"* ]]; then
  CONTEXT='<PLUGINS_ROUTING>

You are working in ancplua-claude-plugins (Type A - Brain/Orchestration).

## MANDATORY Routing

| Task | Use |
|------|-----|
| Plugin work | Read CLAUDE.md first |
| Validation | claude plugin validate . |
| Before done | Validation must pass |

## Type A Rules
- NO C# code
- NO .NET projects
- Skills, hooks, agents only
- Consumes MCP from ancplua-mcp

## Key Files
- .claude-plugin/marketplace.json
- CHANGELOG.md (always update!)

</PLUGINS_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

elif [[ "$PWD" == *"ancplua-mcp"* ]]; then
  CONTEXT='<MCP_ROUTING>

You are working in ancplua-mcp (Type T - Tools/Infrastructure).

## MANDATORY Routing

| Task | Use |
|------|-----|
| MCP servers | .NET implementation |
| Before done | dotnet build + dotnet test (show output) |

## Type T Rules
- MCP server implementations
- .NET code lives here
- Consumed by ancplua-claude-plugins

</MCP_ROUTING>'

  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$CONTEXT\"}}"

else
  # Not in a known project - no special routing
  echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":""}}'
fi
