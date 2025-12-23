# OTelWiki Documentation Index

This is the master index for bundled OpenTelemetry documentation.

## Quick Reference

| Topic | File | Description |
|-------|------|-------------|
| Overview | [overview.md](overview.md) | OTel concepts and architecture |
| Traces | [semantic-conventions/trace.md](semantic-conventions/trace.md) | Span attributes and conventions |
| Metrics | [semantic-conventions/metrics.md](semantic-conventions/metrics.md) | Metric naming and attributes |
| Logs | [semantic-conventions/logs.md](semantic-conventions/logs.md) | Log attributes and conventions |
| Gen-AI | [semantic-conventions/gen-ai.md](semantic-conventions/gen-ai.md) | LLM/AI semantic conventions |
| HTTP | [semantic-conventions/http.md](semantic-conventions/http.md) | HTTP client/server attributes |
| Database | [semantic-conventions/database.md](semantic-conventions/database.md) | Database span attributes |
| Messaging | [semantic-conventions/messaging.md](semantic-conventions/messaging.md) | Message queue attributes |
| Resources | [semantic-conventions/resource.md](semantic-conventions/resource.md) | Resource attributes |
| Collector | [collector/README.md](collector/README.md) | Collector architecture |
| Collector Config | [collector/configuration.md](collector/configuration.md) | YAML configuration reference |
| Processors | [collector/processors.md](collector/processors.md) | Batch, filter, transform |
| Exporters | [collector/exporters.md](collector/exporters.md) | OTLP and debug exporters |
| OTLP | [protocol/otlp.md](protocol/otlp.md) | OTLP protocol specification |
| .NET SDK | [instrumentation/dotnet.md](instrumentation/dotnet.md) | .NET 10 instrumentation |

## Semantic Conventions

All semantic conventions follow the latest stable release. Deprecated attributes have been removed.

### Core Signals

- **Traces** - Span naming, status, attributes
- **Metrics** - Instrument types, units, aggregation
- **Logs** - Severity, body, attributes

### Domain Conventions

- **HTTP** - `http.request.*`, `http.response.*`, `url.*`
- **Database** - `db.*`, `db.system`, query attributes
- **Messaging** - `messaging.*`, queue/topic attributes
- **RPC** - `rpc.*`, gRPC attributes
- **Gen-AI** - `gen_ai.*`, LLM token attributes

## Collector

The collector documentation covers OTLP-based configurations only.

### Components

- **Receivers** - OTLP receiver configuration
- **Processors** - Batch, memory limiter, filter
- **Exporters** - OTLP exporter, debug exporter
- **Pipelines** - Traces, metrics, logs pipelines

## .NET Instrumentation

All examples use .NET 10 APIs:

- `ActivitySource` for tracing (not DiagnosticSource)
- `Meter` for metrics
- `ILogger` with OTel integration
- OTLP exporter configuration

## Metadata

- **Synced**: See [VERSION.md](VERSION.md)
- **Validation**: See [SYNC-REPORT.md](SYNC-REPORT.md)
