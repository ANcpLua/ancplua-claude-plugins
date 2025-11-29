# Testcontainers for .NET Skill

A comprehensive skill for writing .NET integration tests with Testcontainers, xUnit v3, Moq, and AwesomeAssertions.

## Overview

This skill helps Claude Code agents write reliable .NET tests by providing:

- **Package version matrices** - Tested combinations for .NET 8/9/10
- **Container fixture patterns** - IAsyncLifetime, ClassFixture, AssemblyFixture
- **Moq best practices** - MockRepository, setup patterns, FakeLogger
- **Sealed client wrappers** - Patterns for Elasticsearch, MinIO, HttpClient
- **Handler extraction** - Making BackgroundServices testable
- **xUnit v3 + MTP commands** - Filter syntax, coverage collection

## Quick Start

### Installation

```bash
# Claude Code - from plugin marketplace
/plugin install testcontainers-dotnet@testcontainers-claude-skills

# Or manually register the marketplace
/plugin marketplace add testcontainers/claude-skills
```

### Usage

Ask Claude Code about .NET testing:

- "Help me write integration tests for my PostgreSQL repository"
- "How do I mock a sealed Elasticsearch client?"
- "Extract the handler from this BackgroundService for testing"
- "What's the correct xUnit v3 command for code coverage?"

## Key Features

### Package Compatibility Matrix

The skill includes tested package combinations to avoid version mismatches:

```xml
<!-- .NET 10 -->
<PackageReference Include="Testably.Abstractions" Version="10.0.0" />
<PackageReference Include="Testably.Abstractions.Testing" Version="5.0.0" /> <!-- NOT 10.0.0! -->
```

### Container Fixture Patterns

Three patterns for different test isolation needs:

1. **IAsyncLifetime** - Per-test container isolation
2. **IClassFixture** - Shared within a test class
3. **AssemblyFixture** - Shared across all test classes (xUnit v3)

### Moq Best Practices

```csharp
private readonly MockRepository _mocks = new(MockBehavior.Strict)
{
    DefaultValue = DefaultValue.Empty
};

public void Dispose()
{
    _mocks.VerifyAll();
    _mocks.VerifyNoOtherCalls();
}
```

### Handler Extraction

Transform untestable BackgroundServices:

```csharp
// Before: IServiceScopeFactory - hard to mock
// After: Extracted handler with explicit dependencies
internal sealed class OcrEventHandler
{
    public async Task<HandlerResult> HandleAsync(OcrEvent evt, CancellationToken ct)
    {
        // Business logic here - directly testable
    }
}
```

## Topics Covered

| Topic | Description |
|-------|-------------|
| Package Matrix | .NET 8/9/10 compatible versions |
| xUnit v3 + MTP | Command syntax, coverage collection |
| Container Fixtures | IAsyncLifetime, ClassFixture, AssemblyFixture |
| Moq Patterns | MockRepository, setup patterns, verification |
| Sealed Client Wrappers | IElasticClientWrapper, IMinioClientWrapper |
| Handler Extraction | BackgroundService testability refactoring |
| FakeLogger | Microsoft.Extensions.Diagnostics.Testing usage |
| Common Gotchas | Anonymous types, static init, 0ms failures |

## Version Information

- **Last Updated:** November 2025
- **xUnit v3:** 3.2.1
- **Testcontainers:** 4.9.0
- **AwesomeAssertions:** 9.3.0 (Apache 2.0 fork of FluentAssertions)

## License

MIT License - see [LICENSE](../LICENSE)

## Related Skills

- [testcontainers-go](../testcontainers-go/) - Go integration testing with Testcontainers
