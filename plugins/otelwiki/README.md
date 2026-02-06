# OTelWiki Plugin

Unified OpenTelemetry documentation with auto-sync for Claude Code.

## Overview

This plugin provides Claude with comprehensive OpenTelemetry knowledge:

- **Auto-triggers** on telemetry, observability, tracing, metrics, and logging work
- **Bundled documentation** from official OTel repositories
- **.NET 10 focused** - modern patterns, no legacy APIs
- **OTLP-only** - no vendor-specific configurations

## Components

| Component | Type | Purpose |
|-----------|------|---------|
| `otel-expert` | Skill | Auto-invoked to answer OTel questions (read-only) |
| `otel-librarian` | Agent | Syncs docs from upstream repos (stateful) |
| `/otelwiki:sync` | Command | User entry point to trigger sync |
| SessionStart hook | Hook | Warns if docs are stale (>7 days) |

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│ User working on telemetry code                          │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ otel-expert skill (auto-triggered)                      │
│ • Reads bundled docs                                    │
│ • Answers questions                                     │
│ • Cites sources                                         │
└─────────────────────────────────────────────────────────┘
              │
              │ (if docs stale)
              ▼
┌─────────────────────────────────────────────────────────┐
│ /otelwiki:sync command                                  │
│ • User explicitly invokes                               │
│ • Spawns otel-librarian agent                           │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ otel-librarian agent                                    │
│ • Pulls from upstream repos                             │
│ • Validates and filters content                         │
│ • Updates docs bundle                                   │
│ • Writes SYNC-REPORT.md                                 │
└─────────────────────────────────────────────────────────┘
```

## Documentation Sources

| Source | Content |
|--------|---------|
| `semantic-conventions` | Attribute definitions, naming conventions |
| `opentelemetry-collector` | Collector architecture, configuration |
| `opentelemetry.io` | .NET instrumentation guides |

## Usage

The skill auto-triggers when you:

- Work with `ActivitySource`, `Meter`, or OTel APIs
- Ask about semantic conventions or attributes
- Configure the OTel Collector
- Implement tracing, metrics, or logging

To manually sync documentation:

```text
/otelwiki:sync
```

## Constraints

- Latest stable semantic conventions only
- .NET 10 patterns (no legacy APIs)
- OTLP export only (no vendor-specific)
- No deprecated attributes

## License

MIT
