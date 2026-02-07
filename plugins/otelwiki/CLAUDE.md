# otelwiki

Bundled OpenTelemetry documentation with auto-sync from upstream repos.

## Files

| Component | Purpose |
|-----------|---------|
| `skills/otel-expert/SKILL.md` | Read-only skill: INDEX.md -> Grep -> Read -> Cite |
| `agents/otel-guide.md` | Answers OTel questions from bundled docs, validates semconv |
| `agents/otel-librarian.md` | Syncs from upstream repos, filters for .NET, strips Hugo frontmatter |
| `commands/sync.md` | `/otelwiki:sync` entry point to spawn librarian |
| `hooks/hooks.json` | SessionStart hooks for freshness warnings |
| `scripts/check-freshness.sh` | Warns if docs >7 days stale |
| `scripts/session-prompt.sh` | Outputs freshness prompt at session start |

## Bundled Docs Structure

```text
docs/
├── INDEX.md              # Master index of all bundled docs
├── VERSION.md            # Synced semconv/SDK versions
├── SYNC-REPORT.md        # Last sync results
├── overview.md           # OTel overview
├── collector/            # Collector config, architecture, security
├── instrumentation/      # .NET instrumentation guides, metrics, traces
├── protocol/             # OTLP protocol spec
└── semantic-conventions/ # database, http, gen-ai, messaging, resource, rpc, dotnet
```

## Notes

- otel-expert skill is READ-ONLY (searches bundled docs, never modifies them).
- otel-guide agent uses WebSearch for deprecation status and gen-ai attributes (rapidly evolving).
- Sync targets: opentelemetry-specification, opentelemetry-collector, opentelemetry.io.
