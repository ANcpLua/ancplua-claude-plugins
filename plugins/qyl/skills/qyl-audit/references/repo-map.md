# qyl Repo Map

Where qyl puts things. Use this to map projects to planes and locate audit targets.

## Projects

| Project | Type | Plane | Purpose |
|---------|------|-------|---------|
| `src/qyl.collector` | ASP.NET Core Web | Data + Serving | OTLP ingest, DuckDB, REST/gRPC, SSE, hosted agents |
| `src/qyl.contracts` | Class Library | Cross-cutting | Shared types, BCL-only, zero NuGet deps |
| `src/qyl.instrumentation` | Class Library | Compiler (runtime) | Runtime SDK, Loom bridge, telemetry wiring |
| `src/qyl.instrumentation.generators` | Analyzer (Roslyn) | Compiler | Loom source generator, descriptor emission |
| `src/qyl.collector.storage.generators` | Analyzer (Roslyn) | Data | DuckDB mapper codegen |
| `src/qyl.loom` | Console App (Exe) | Agent/Control | Standalone: autofix, triage, MCP client |
| `src/qyl.mcp` | Class Library | Serving | MCP server surface |
| `src/qyl.dashboard` | esproj (React/Vite) | UI/Protocol | Frontend SPA |

## Project-to-Plane Mapping

Use this when checking plane boundary violations:

| Plane | Primary Projects |
|-------|-----------------|
| Data | `qyl.collector` (ingest + storage), `qyl.collector.storage.generators` |
| Serving | `qyl.collector` (endpoint registration), `qyl.mcp` |
| Intelligence | `qyl.collector/Intelligence` |
| Agent/Control | `qyl.loom` |
| Ledger/Governance | Loom run records and policy gates (spread across loom + collector) |
| UI/Protocol | `qyl.dashboard` |
| Compiler | `qyl.instrumentation.generators`, `qyl.instrumentation` (bridge layer) |

## Ghost Projects

These never existed or were removed. Do not reference them:

`qyl.protocol`, `qyl.servicedefaults`, `qyl.servicedefaults.generator`, `qyl.browser`,
`qyl.copilot`, `qyl.hosting`, `qyl.watch`, `qyl.watchdog`, `qyl.cli`, `qyl.agents`,
`qyl.workflows`

## Key Files

| File | Purpose |
|------|---------|
| `Version.props` | All package versions as MSBuild variables |
| `Directory.Packages.props` | CPM declarations |
| `AGENTS.md` | Declared architecture and plane rules |
| `CLAUDE.md` | Ground truth for AI agents |
| `.claude/planes/*.md` | Per-plane boundary docs (if they exist) |
| `CHANGELOG.md` | Migration history and current state |

## Dependency Direction

```text
Data <- Serving <- Intelligence
                <- Agent/Control <- Ledger/Governance
                                  <- UI/Protocol
Compiler -> all (emits metadata consumed by every plane)
```

`qyl.contracts` is depended on by everything. It depends on nothing.
