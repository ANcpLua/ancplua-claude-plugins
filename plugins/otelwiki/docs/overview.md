# OpenTelemetry Overview

OpenTelemetry is a collection of APIs, SDKs, and tools for instrumenting, generating, collecting, and exporting telemetry data (metrics, logs, and traces).

## Core Concepts

### Signals

| Signal | Purpose | .NET API |
|--------|---------|----------|
| Traces | Distributed request flow | `ActivitySource`, `Activity` |
| Metrics | Measurements over time | `Meter`, `Counter`, `Histogram` |
| Logs | Discrete events | `ILogger` with OTel provider |

### Components

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Application │ --> │  Collector  │ --> │   Backend   │
│   (SDK)     │     │  (Optional) │     │  (Jaeger,   │
│             │     │             │     │   etc.)     │
└─────────────┘     └─────────────┘     └─────────────┘
```

## .NET 10 Quick Start

### Tracing

```csharp
using System.Diagnostics;

// Create source once (static)
private static readonly ActivitySource Source = new("MyApp");

// Create spans
using var activity = Source.StartActivity("OperationName");
activity?.SetTag("key", "value");
```

### Metrics

```csharp
using System.Diagnostics.Metrics;

// Create meter once (static)
private static readonly Meter Meter = new("MyApp");
private static readonly Counter<long> RequestCounter = Meter.CreateCounter<long>("requests");

// Record measurements
RequestCounter.Add(1, new KeyValuePair<string, object?>("status", "success"));
```

### Configuration

```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .AddSource("MyApp")
        .AddOtlpExporter())
    .WithMetrics(metrics => metrics
        .AddMeter("MyApp")
        .AddOtlpExporter());
```

## OTLP

OpenTelemetry Protocol (OTLP) is the standard for exporting telemetry:

- **gRPC** - Default, port 4317
- **HTTP/protobuf** - Port 4318

```csharp
.AddOtlpExporter(options =>
{
    options.Endpoint = new Uri("http://localhost:4317");
    options.Protocol = OtlpExportProtocol.Grpc;
})
```

## Semantic Conventions

Standardized attribute names for common scenarios:

- `http.request.method` - HTTP method (GET, POST, etc.)
- `http.response.status_code` - HTTP status code
- `db.system` - Database type (postgresql, redis, etc.)
- `messaging.system` - Message broker (kafka, rabbitmq, etc.)

See [semantic-conventions/](semantic-conventions/) for complete reference.
