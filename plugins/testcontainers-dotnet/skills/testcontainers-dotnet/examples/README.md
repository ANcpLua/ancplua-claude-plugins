# .NET Testcontainers Skill Examples

This directory contains working examples that validate the patterns documented in the [SKILL.md](../SKILL.md).

## Prerequisites

- Docker or Podman running
- .NET 10.0 SDK (or adjust TargetFramework in .csproj for .NET 8/9)

## Running Tests

```bash
# Build
dotnet build

# Run all tests
dotnet test

# Run with verbose output
dotnet test --logger "console;verbosity=detailed"

# Run with coverage (MTP syntax)
dotnet test -- --coverage --coverage-output-format cobertura
```

## Examples Included

### PostgresBasicTests.cs

Demonstrates the **IAsyncLifetime** pattern for container lifecycle:

- Container starts before each test class
- Container stops after all tests in class complete
- Each test gets a fresh database state

### MockRepositoryPatternTests.cs

Demonstrates the **MockRepository** pattern from the skill:

- `MockBehavior.Strict` for explicit verification
- `DefaultValue.Empty` for safe defaults
- `IDisposable` with `VerifyAll()` in Dispose
- Private `CreateSut()` factory method
- Constants section for test data

### ClassFixtureExample.cs

Demonstrates the **IClassFixture** pattern for shared containers:

- Container shared across all tests in a single class
- Schema setup in fixture initialization
- Connection factory for test isolation

### TheoryPatternTests.cs

Demonstrates **Theory** patterns for parameterized tests:

- `InlineData` for simple inline values
- `MemberData` with `TheoryDataRow<T>` for complex data
- `ClassData` for reusable test data classes
- Boundary testing patterns
- Enum exhaustive testing

### HandlerExtractionTests.cs

Demonstrates the **Handler Extraction** pattern from the skill:

- Extracting business logic from BackgroundServices
- Handler returns result enum (`Success`, `NotFound`, `Failed`)
- FakeLogCollector for log assertion
- Testing success, not-found, and exception paths

### SealedClientWrapperTests.cs

Demonstrates the **Sealed Client Wrapper** pattern:

- Interface wrapper for sealed clients (e.g., `ElasticsearchClient`)
- Enables mocking of sealed external dependencies
- Tests for index operations, document CRUD, and search

### FakeLogCollectorTests.cs

Demonstrates **FakeLogger** and **FakeLogCollector** usage:

- Asserting on log levels (Information, Warning, Error)
- Verifying log message content
- Checking structured logging parameters
- Filtering logs by level
- Exception logging verification

## Package Versions

See [Examples.csproj](./Examples.csproj) for the exact package versions used.

Key packages:
- xUnit v3 3.2.1
- Testcontainers.PostgreSql 4.9.0
- AwesomeAssertions 9.3.0
- Moq 4.20.72
- Microsoft.Extensions.Diagnostics.Testing 10.0.0
- Microsoft.Testing.Extensions.CodeCoverage 18.1.0
- Npgsql 10.0.0
