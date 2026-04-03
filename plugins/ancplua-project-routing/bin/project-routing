#!/usr/bin/env bash
# Project routing hook — maps $PWD to specialist context

set -euo pipefail
# Injects: specialist agents, available commands/skills, cross-repo dependencies
#
# Plugins available (7):
#   exodia         — multi-agent orchestration (9 commands + hades skill)
#   metacognitive-guard — cognitive amplification, commit integrity, CI verification
#   feature-dev    — guided feature development, code review, 3 agents
#   dotnet-architecture-lint — .NET MSBuild/CPM enforcement
#   hookify        — user-configurable hooks
#   otelwiki       — OpenTelemetry docs + semantic conventions
#   ancplua-project-routing — this plugin (SessionStart routing)

emit_routing() {
  local context="$1"
  if command -v jq &>/dev/null; then
    jq -n --arg ctx "$context" '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx}}'
  else
    local escaped
    escaped=$(printf '%s' "$context" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | sed ':a;N;$!ba;s/\n/\\n/g')
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$escaped\"}}"
  fi
}

# --- Cross-repo dependency graph (shared across all .NET projects) ---
CROSS_REPO='## Cross-Repo Dependencies

```text
ANcpLua.Roslyn.Utilities  (SOURCE OF TRUTH - shared Roslyn helpers)
  ├── ANcpLua.Analyzers    (consumes EquatableArray, DiagnosticFlow, SymbolMatch)
  ├── ErrorOrX             (consumes EquatableArray, Guard)
  └── qyl generators       (consumes DiagnosticFlow)

ANcpLua.NET.Sdk           (MSBuild SDK - auto-injects analyzers + polyfills)
  └── consumed by all .NET repos via <Sdk Name="ANcpLua.NET.Sdk">

ANcpLua.Analyzers         (44 Roslyn diagnostics)
  └── auto-injected by ANcpLua.NET.Sdk into all consumer projects
```

**Breaking change protocol:** If changing a public API in Utilities/Analyzers/SDK,
check downstream consumers BEFORE committing. Use `feature-dev:code-explorer` agent
to trace usages across repos.'

# --- .NET shared context (injected into all .NET projects) ---
DOTNET_SHARED='## .NET Shared Context

- Runtime: .NET 10.0 LTS, C# 14, net10.0 TFM
- Banned APIs: use TimeProvider instead of current-time methods, use Lock instead of object lock, use STJ instead of Newtonsoft
- Before done: `dotnet build --no-incremental && dotnet test` (show output)
- Architecture: `/dotnet-architecture-lint:lint-dotnet` to validate MSBuild/CPM patterns
- Review: `/feature-dev:review` for code review, `/metacognitive-guard:competitive-review` for thorough analysis
- Bugs: `/exodia:fix [issue]` for systematic fix pipeline
- Audit: `/exodia:mega-swarm` for full codebase scan'

# ============================================================

if [[ "$PWD" == *"ErrorOrX"* ]]; then
  CONTEXT="<ERROROR_ROUTING>

You are working in **ErrorOrX** — Roslyn source generator converting ErrorOr<T> methods into AOT-safe Minimal API endpoints.

## Specialist Agents (use via Task tool)

| Agent | subagent_type | Use for |
|-------|---------------|---------|
| Generator specialist | erroror-generator-specialist | Endpoint generation, parameter binding, Results<> types |
| Deep debugger | deep-debugger | Source generator debugging, incremental pipeline |
| Code architect | feature-dev:code-architect | New features, architectural decisions |
| Code explorer | feature-dev:code-explorer | Trace usages, understand patterns |

## Key Commands

| Command | When |
|---------|------|
| \`/exodia:fix [issue]\` | Bug in generator output |
| \`/exodia:tournament [task]\` | Multiple valid generation strategies |
| \`/feature-dev:review\` | Before committing changes |
| \`/dotnet-architecture-lint:lint-dotnet\` | Validate MSBuild patterns |
| \`/metacognitive-guard:verification-before-completion\` | Before claiming done |

## Key Patterns

- Smart parameter binding: route/query/body/service inference from method signature
- Results<> union types for AOT-safe error responses
- Zero reflection — everything via Roslyn source generation
- Consumes: ANcpLua.Roslyn.Utilities (EquatableArray, Guard)

${CROSS_REPO}

${DOTNET_SHARED}

</ERROROR_ROUTING>"

  emit_routing "$CONTEXT"

elif [[ "$PWD" == *"ANcpLua.Analyzers"* ]]; then
  CONTEXT="<ANALYZERS_ROUTING>

You are working in **ANcpLua.Analyzers** — 44 Roslyn diagnostics (AL00XX) with code fix providers.

## Specialist Agents

| Agent | subagent_type | Use for |
|-------|---------------|---------|
| Analyzers specialist | ancplua-analyzers-specialist | New diagnostics, code fixes, perf tuning |
| Deep debugger | deep-debugger | Analyzer pipeline issues |
| Arch reviewer | metacognitive-guard:arch-reviewer | Architecture review |
| Code explorer | feature-dev:code-explorer | Trace diagnostic registrations |

## Key Commands

| Command | When |
|---------|------|
| \`/exodia:batch-implement type=diagnostics\` | Multiple new diagnostics at once |
| \`/exodia:fix [issue]\` | False positive/negative in analyzer |
| \`/feature-dev:review\` | Before committing |
| \`/dotnet-architecture-lint:lint-dotnet\` | Validate MSBuild |

## Key Patterns

- ALAnalyzer base class for all diagnostics
- OperationHelper for syntax analysis
- WellKnownTypes for type checking
- Every diagnostic needs: analyzer + code fix + tests
- Consumes: ANcpLua.Roslyn.Utilities (EquatableArray, DiagnosticFlow, SymbolMatch)

**CAUTION:** This package is auto-injected by ANcpLua.NET.Sdk into ALL consumer projects.
Changing diagnostic severity or removing a diagnostic is a breaking change for all consumers.

${CROSS_REPO}

${DOTNET_SHARED}

</ANALYZERS_ROUTING>"

  emit_routing "$CONTEXT"

elif [[ "$PWD" == *"ANcpLua.NET.Sdk"* ]]; then
  CONTEXT="<SDK_ROUTING>

You are working in **ANcpLua.NET.Sdk** — opinionated MSBuild SDK with CPM, analyzer injection, polyfills.

## Specialist Agents

| Agent | subagent_type | Use for |
|-------|---------------|---------|
| SDK specialist | ancplua-sdk-specialist | Props/targets, auto-injection, polyfills |
| MSBuild expert | msbuild-expert | Complex MSBuild customization |
| Deep debugger | deep-debugger | Build pipeline issues |

## Key Commands

| Command | When |
|---------|------|
| \`/exodia:fix [issue]\` | Build breaks in consumer projects |
| \`/exodia:deep-think [problem]\` | MSBuild evaluation order issues |
| \`/dotnet-architecture-lint:lint-dotnet\` | Validate own patterns |

## Key Patterns

- Sdk.props / Sdk.targets entry points
- CPM enforcement via Directory.Packages.props injection
- Analyzer auto-injection (ANcpLua.Analyzers)
- Test framework setup (xUnit v3 + MTP)
- Polyfill packages for downlevel TFMs

**CAUTION:** This SDK is consumed by ALL ancplua .NET repos.
Any props/targets change affects every consumer build. Test with \`dotnet build\` in
at least ErrorOrX and qyl after changes.

${CROSS_REPO}

${DOTNET_SHARED}

</SDK_ROUTING>"

  emit_routing "$CONTEXT"

elif [[ "$PWD" == *"ANcpLua.Roslyn.Utilities"* || "$PWD" == *"Roslyn.Utilities"* ]]; then
  CONTEXT="<ROSLYN_UTILITIES_ROUTING>

You are working in **ANcpLua.Roslyn.Utilities** — SOURCE OF TRUTH for shared Roslyn helpers.

## Specialist Agents

| Agent | subagent_type | Use for |
|-------|---------------|---------|
| Code architect | feature-dev:code-architect | New utility APIs |
| Code explorer | feature-dev:code-explorer | Trace downstream usages |
| Arch reviewer | metacognitive-guard:arch-reviewer | API surface review |
| Impl reviewer | metacognitive-guard:impl-reviewer | Implementation quality |

## Key Commands

| Command | When |
|---------|------|
| \`/metacognitive-guard:competitive-review\` | Before ANY public API change |
| \`/exodia:red-blue-review\` | Adversarial review of API changes |
| \`/feature-dev:review\` | Standard review |

## Key Exports (public API — changes break consumers)

- \`EquatableArray<T>\` — Value-equality arrays for incremental generators
- \`DiagnosticFlow<T>\` — Railway-oriented error accumulation
- \`SymbolMatch.*\` — Fluent pattern matching for Roslyn symbols
- \`Guard.NotNull()\` — Argument validation with CallerArgumentExpression

## Consumers

ErrorOrX, ANcpLua.Analyzers, qyl generators — ALL break if public API changes.

**MANDATORY before changing public API:**
1. \`/feature-dev:code-explorer\` — trace all usages across repos
2. \`/metacognitive-guard:competitive-review\` — adversarial review
3. Test \`dotnet build\` in ErrorOrX AND ANcpLua.Analyzers after changes

${CROSS_REPO}

${DOTNET_SHARED}

</ROSLYN_UTILITIES_ROUTING>"

  emit_routing "$CONTEXT"

elif [[ "$PWD" == *"qyl"* ]]; then
  CONTEXT='<QYL_ROUTING>

## qyl Observability Platform

OTLP-native observability: ingest traces/logs/metrics, store in DuckDB, query via API/MCP/Copilot.

### Project Map

```text
src/
├── qyl.collector        # OTLP ingestion (gRPC+HTTP), DuckDB storage, SSE streaming, dashboards, alerts
├── qyl.protocol         # TypeSpec-generated models, enums, semconv attributes (source of truth)
├── qyl.servicedefaults  # OTel instrumentation SDK (source-gen interceptors: [Traced], [GenAi], [Db])
├── qyl.servicedefaults.generator  # Roslyn source generator for servicedefaults attributes
├── qyl.instrumentation.generators # DuckDB schema + GenAI interceptor generators
├── qyl.copilot          # Copilot extensibility agent (workflows, MCP adapter)
├── qyl.mcp              # MCP server (telemetry tools, replay, structured logs)
├── qyl.dashboard        # React + Vite + shadcn/ui frontend
├── qyl.browser          # Browser SDK (Web Vitals, interactions, navigation)
├── qyl.hosting          # .NET Aspire-style hosting (QylApp, resource model)
├── qyl.cli              # CLI init tool (dotnet/docker stack detection)
├── qyl.watch            # Terminal SSE span viewer
└── qyl.watchdog         # Process anomaly detection daemon
core/
├── specs/               # TypeSpec definitions (main.tsp → models, otel, api)
└── schemas/             # Generated JSON schemas
eng/
├── build/               # Nuke build (Build.cs, coverage, infra, pipeline)
├── MSBuild/             # Shared props/targets
└── semconv/             # Semconv TypeSpec generator (TS)
tests/
└── qyl.collector.tests  # Integration + unit tests
```

### Specialist Agents

| Agent | subagent_type | Use for |
|-------|---------------|---------|
| qyl specialist | qyl-observability-specialist | OTLP ingestion, DuckDB schema, collector architecture |
| OTel GenAI | otel-genai-architect | GenAI instrumentation, semconv attributes |
| ServiceDefaults | servicedefaults-specialist | Source-gen interceptors, OTel attributes |
| OTel guide | otelwiki:otel-guide | Semantic conventions, collector config |

### Key Commands

| Command | When |
|---------|------|
| `/otelwiki:otel-expert` | Semconv questions, attribute lookup |
| `/exodia:fix [issue]` | Bug fixes |
| `/exodia:mega-swarm` | Full codebase audit |
| `/feature-dev:review` | Code review |
| `/dotnet-architecture-lint:lint-dotnet` | MSBuild/CPM validation |

### TypeSpec → Code Flow

```text
core/specs/*.tsp → tsp compile → qyl.protocol (C# models/enums)
eng/semconv/generate-semconv.ts → qyl.protocol/Attributes/Generated/
core/specs/generated/semconv.g.tsp → generated from upstream semconv YAML
```

### MTP Exit Codes (xUnit v3)

| Exit | Meaning |
|------|---------|
| 0 | All passed |
| 2 | Test(s) failed |
| 8 | Zero tests ran (filter matched nothing) |

```bash
dotnet test --filter-class "*DiagnosticTests"
dotnet test --filter-method "*EOE056*"
```

</QYL_ROUTING>'

  emit_routing "$CONTEXT"

elif [[ "$PWD" == *"ancplua-claude-plugins"* ]]; then
  CONTEXT='<PLUGINS_ROUTING>

You are working in **ancplua-claude-plugins** — Claude Code plugin marketplace (7 plugins).

## Rules

- NO C# code, NO .NET projects
- Skills, hooks, agents, commands only
- Always update CHANGELOG.md

## Key Commands

| Command | When |
|---------|------|
| `/exodia:mega-swarm scope=full` | Full marketplace audit |
| `/exodia:hades` | Cleanup dead code/stale refs |
| `/feature-dev:review` | Review plugin changes |
| `/hookify:hookify` | Create new hook rules |

## Validation

```bash
./tooling/scripts/weave-validate.sh
claude plugin validate .
```

## Key Files

- `.claude-plugin/marketplace.json` — plugin registry
- `CHANGELOG.md` — always update under [Unreleased]
- `CLAUDE.md` — operational brain

</PLUGINS_ROUTING>'

  emit_routing "$CONTEXT"

elif [[ "$PWD" == *"ancplua.io"* || "$PWD" == *"ancplua-docs"* ]]; then
  CONTEXT='<DOCS_ROUTING>

You are working in **ancplua.io** — unified documentation site (Mintlify).

## Specialist Agents

| Agent | subagent_type | Use for |
|-------|---------------|---------|
| Docs generator | ancplua-docs-generator | SDK/Utilities/Analyzers doc pages |
| Code explorer | feature-dev:code-explorer | Trace API surface for doc accuracy |

## Key Commands

| Command | When |
|---------|------|
| `/feature-dev:feature-dev` | New documentation section |
| `/metacognitive-guard:epistemic-checkpoint` | Verify version numbers/API accuracy |

## Mintlify Structure

- `mint.json` — navigation and config
- `sdk/`, `analyzers/`, `utilities/` — per-package docs
- Always cross-reference actual source code for API accuracy

</DOCS_ROUTING>'

  emit_routing "$CONTEXT"

elif [[ "$PWD" == *"Template"* ]]; then
  CONTEXT="<TEMPLATE_ROUTING>

You are working in **Template** — Clean Architecture ASP.NET Core template.

## Specialist Agents

| Agent | subagent_type | Use for |
|-------|---------------|---------|
| Template specialist | template-clean-arch-specialist | MediatR CQRS, domain entities, EF Core |
| Code architect | feature-dev:code-architect | New endpoints, handlers |

## Key Commands

| Command | When |
|---------|------|
| \`/exodia:batch-implement type=endpoints\` | Multiple new endpoints |
| \`/exodia:fix [issue]\` | Bug fixes |
| \`/feature-dev:review\` | Before committing |
| \`/dotnet-architecture-lint:lint-dotnet\` | Validate MSBuild |

## Key Patterns

- EndpointGroupBase for Minimal API endpoints
- MediatR CQRS (Command/Query separation)
- Layered: Domain -> Application -> Infrastructure -> Web

${DOTNET_SHARED}

</TEMPLATE_ROUTING>"

  emit_routing "$CONTEXT"

else
  # Unknown project — inject minimal helpful context
  CONTEXT='<DEFAULT_ROUTING>

## Available Commands (ancplua-claude-plugins)

| Command | When |
|---------|------|
| `/exodia:fix [issue]` | Fix bugs (8-16 agents) |
| `/exodia:mega-swarm` | Audit codebase (6-12 agents) |
| `/exodia:deep-think [problem]` | Multi-perspective analysis |
| `/feature-dev:feature-dev` | Guided feature development |
| `/feature-dev:review` | Code review |
| `/metacognitive-guard:competitive-review` | Thorough adversarial review |
| `/metacognitive-guard:epistemic-checkpoint` | Verify facts before claiming |

</DEFAULT_ROUTING>'

  emit_routing "$CONTEXT"
fi
