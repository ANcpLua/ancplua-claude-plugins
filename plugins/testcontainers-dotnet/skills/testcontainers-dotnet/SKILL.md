---
name: testcontainers-dotnet
description: |
  .NET integration testing with Testcontainers, xUnit v3, and Moq.
  Use when writing unit or integration tests for .NET applications that need:
  - Docker container fixtures (PostgreSQL, RabbitMQ, Elasticsearch, MinIO)
  - xUnit v3 with Microsoft Testing Platform (MTP)
  - Moq patterns (MockRepository, FakeLogger, sealed client wrappers)
  - Handler extraction for testability
  - Coverage collection with MTP
  - AwesomeAssertions (FluentAssertions Apache 2.0 fork)

  Package versions updated: November 2025
license: MIT
---

# .NET Testcontainers + xUnit v3 Testing Skill

> **Last Updated:** November 2025 — xUnit v3 3.2.1, Testcontainers 4.9.0, AwesomeAssertions 9.3.0

Expert guidance for .NET integration testing with Testcontainers, xUnit v3, Moq, and related tooling.

---

## Description

This skill provides comprehensive guidance for writing reliable .NET tests using Testcontainers. It addresses common pain points including:

- **xUnit v3 + Microsoft Testing Platform (MTP)** - Filter syntax and coverage flags differ from VSTest
- **Package version compatibility** - Which versions work together (critical: Testably.Abstractions mismatches)
- **Sealed client wrappers** - Patterns for ElasticsearchClient, MinioClient, HttpClient
- **Container fixture coordination** - IAsyncLifetime, ClassFixture, AssemblyFixture patterns
- **Handler extraction** - Making BackgroundServices testable by extracting business logic

---

## When to Use This Skill

Use this skill when you need to:

- Write integration tests requiring Docker containers (databases, queues, search)
- Configure xUnit v3 with Microsoft Testing Platform
- Mock sealed external clients (Elasticsearch, MinIO, etc.)
- Extract handlers from BackgroundServices for testability
- Collect code coverage with MTP
- Understand package version compatibility for .NET 8/9/10

---

## Prerequisites

- **Docker or Podman** installed and running
- **.NET 8, 9, or 10** SDK
- **Docker socket** accessible

---

## 📦 Package Compatibility Matrix

**CRITICAL**: These version combinations work together. Mixing versions causes build failures.

### .NET 10 (Preview) - Updated November 2025

```xml
<!-- Test Project .csproj -->
<PropertyGroup>
  <TargetFramework>net10.0</TargetFramework>
  <ImplicitUsings>enable</ImplicitUsings>
  <Nullable>enable</Nullable>
  <IsPackable>false</IsPackable>
  <IsTestProject>true</IsTestProject>
</PropertyGroup>

<ItemGroup>
  <!-- xUnit v3 Core -->
  <PackageReference Include="xunit.v3" Version="3.2.1" />
  <PackageReference Include="xunit.runner.visualstudio" Version="3.1.5">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
  </PackageReference>

  <!-- Microsoft Testing Platform (MTP) Code Coverage -->
  <PackageReference Include="Microsoft.Testing.Extensions.CodeCoverage" Version="18.1.0" />

  <!-- Testcontainers -->
  <PackageReference Include="Testcontainers.PostgreSql" Version="4.9.0" />
  <PackageReference Include="Testcontainers.RabbitMq" Version="4.9.0" />
  <PackageReference Include="Testcontainers.Elasticsearch" Version="4.9.0" />
  <PackageReference Include="Testcontainers.Minio" Version="4.9.0" />

  <!-- Moq -->
  <PackageReference Include="Moq" Version="4.20.72" />

  <!-- Logging -->
  <PackageReference Include="Microsoft.Extensions.Diagnostics.Testing" Version="10.0.0" />
  <PackageReference Include="MartinCostello.Logging.XUnit.v3" Version="0.7.0" />

  <!-- File System Mocking - IMPORTANT: Testing package version differs! -->
  <PackageReference Include="Testably.Abstractions" Version="10.0.0" />
  <PackageReference Include="Testably.Abstractions.FileSystem.Interface" Version="10.0.0" />
  <PackageReference Include="Testably.Abstractions.Testing" Version="5.0.0" />

  <!-- Assertions - AwesomeAssertions (Apache 2.0 fork of FluentAssertions) -->
  <!-- FluentAssertions 8.x requires COMMERCIAL LICENSE for production use -->
  <PackageReference Include="AwesomeAssertions" Version="9.3.0" />
  <PackageReference Include="AwesomeAssertions.Analyzers" Version="9.0.8">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
  </PackageReference>

  <!-- WebApplicationFactory for integration tests -->
  <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="10.0.0" />
</ItemGroup>
```

> **IMPORTANT: FluentAssertions Licensing Change**
>
> As of FluentAssertions 8.x, commercial use requires a **paid license**.
> Use **AwesomeAssertions** instead - it's a community fork under Apache 2.0.
> The API is 100% compatible: just replace `FluentAssertions` with `AwesomeAssertions`.

### .NET 8/9 (Stable) - Updated November 2025

```xml
<ItemGroup>
  <!-- xUnit v3 -->
  <PackageReference Include="xunit.v3" Version="3.2.1" />
  <PackageReference Include="xunit.runner.visualstudio" Version="3.1.5">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
  </PackageReference>

  <!-- Microsoft Testing Platform (MTP) -->
  <PackageReference Include="Microsoft.Testing.Extensions.CodeCoverage" Version="18.1.0" />

  <!-- Testcontainers -->
  <PackageReference Include="Testcontainers.PostgreSql" Version="4.9.0" />
  <PackageReference Include="Testcontainers.RabbitMq" Version="4.9.0" />
  <PackageReference Include="Testcontainers.Elasticsearch" Version="4.9.0" />
  <PackageReference Include="Testcontainers.Minio" Version="4.9.0" />

  <!-- Moq -->
  <PackageReference Include="Moq" Version="4.20.72" />

  <!-- Logging Fakes - Match TFM! -->
  <PackageReference Include="Microsoft.Extensions.Diagnostics.Testing" Version="8.0.0" />
  <PackageReference Include="MartinCostello.Logging.XUnit.v3" Version="0.7.0" />

  <!-- File System Mocking -->
  <PackageReference Include="Testably.Abstractions" Version="9.0.0" />
  <PackageReference Include="Testably.Abstractions.Testing" Version="4.3.2" />

  <!-- Assertions - AwesomeAssertions (Apache 2.0) -->
  <PackageReference Include="AwesomeAssertions" Version="9.3.0" />
</ItemGroup>
```

### Version Gotchas

| Package | Gotcha | Fix |
|---------|--------|-----|
| `Testably.Abstractions` | Main package != Testing package version | .NET 10: `10.0.0` + `Testing: 5.0.0`. .NET 8/9: `9.0.0` + `Testing: 4.3.2` |
| `Microsoft.Extensions.Diagnostics.Testing` | Must match target framework | `10.0.0` for .NET 10, `9.0.0` for .NET 9, `8.0.0` for .NET 8 |
| `xunit.runner.visualstudio` | v3 uses MTP, not VSTest | Use MTP flags: `-- --coverage`, not `--collect "XPlat Code Coverage"` |
| `FluentAssertions` | **v8.x requires COMMERCIAL LICENSE** | Use `AwesomeAssertions` instead (Apache 2.0 fork, API-compatible) |
| `Testcontainers.XunitV3` | Not always needed | Only add if using built-in xUnit v3 container traits |

---

## 🔧 xUnit v3 + Microsoft Testing Platform (MTP)

### Command Reference

```bash
# WRONG - VSTest syntax (won't work with xUnit v3)
dotnet test --collect "XPlat Code Coverage"
dotnet test --filter "Category=Unit"

# CORRECT - MTP syntax
dotnet test -- --coverage --coverage-output-format cobertura
dotnet test --filter "FullyQualifiedName~Unit"

# Filter by namespace
dotnet test --filter "FullyQualifiedName~MyProject.Tests.Unit"

# Filter by test name pattern
dotnet test --filter "FullyQualifiedName~DocumentService"

# Run with coverage output to specific file
dotnet test -- --coverage --coverage-output-format cobertura --coverage-output ./TestResults/coverage.xml
```

### Project Configuration

```xml
<!-- Enable MTP support in test .csproj -->
<PropertyGroup>
  <TestingPlatformDotnetTestSupport>true</TestingPlatformDotnetTestSupport>
  <GenerateTestingPlatformEntryPoint>true</GenerateTestingPlatformEntryPoint>
</PropertyGroup>
```

### Assembly Attributes

```csharp
// GlobalUsings.cs or AssemblyInfo.cs
[assembly: AssemblyFixture(typeof(SharedContainerFixture))]
[assembly: CaptureConsole]
[assembly: CaptureTrace]
```

---

## 🐳 Container Fixture Patterns

### Pattern 1: Per-Test Isolation (IAsyncLifetime)

Use when tests need isolated containers:

```csharp
public sealed class CustomerRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public ValueTask InitializeAsync() => new(_postgres.StartAsync());

    public ValueTask DisposeAsync() => _postgres.DisposeAsync();

    [Fact]
    public async Task GetById_ExistingCustomer_ReturnsCustomer()
    {
        // Arrange
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        // Test uses fresh container
    }
}
```

### Pattern 2: Class Fixture (IClassFixture)

Use when tests in a single class share a container:

```csharp
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async ValueTask InitializeAsync() => await _container.StartAsync();

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();
}

public sealed class OrderRepositoryTests : IClassFixture<PostgresFixture>
{
    private readonly PostgresFixture _fixture;

    public OrderRepositoryTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task CreateOrder_ValidOrder_Persists()
    {
        await using var connection = new NpgsqlConnection(_fixture.ConnectionString);
        // All tests share the same container
    }
}
```

### Pattern 3: Assembly Fixture (xUnit v3 Only)

Use when ALL test classes share containers - **best for integration test suites**:

```csharp
// SharedContainerFixture.cs
public sealed class SharedContainerFixture : IAsyncLifetime
{
    // ═══════════════════════════════════════════════════════════════
    // CONTAINERS
    // ═══════════════════════════════════════════════════════════════

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("testdb")
        .WithUsername("testuser")
        .WithPassword("testpass")
        .Build();

    private readonly RabbitMqContainer _rabbitmq = new RabbitMqBuilder()
        .WithImage("rabbitmq:4-management-alpine")
        .Build();

    private readonly ElasticsearchContainer _elasticsearch = new ElasticsearchBuilder()
        .WithImage("elasticsearch:8.17.0")
        .Build();

    private readonly MinioContainer _minio = new MinioBuilder()
        .WithImage("minio/minio:latest")
        .Build();

    // ═══════════════════════════════════════════════════════════════
    // CONNECTION STRINGS (exposed to tests)
    // ═══════════════════════════════════════════════════════════════

    public string PostgresConnectionString => _postgres.GetConnectionString();
    public string RabbitMqConnectionString => _rabbitmq.GetConnectionString();
    public Uri ElasticsearchUri => new(_elasticsearch.GetConnectionString());
    public string MinioEndpoint => _minio.GetConnectionString();
    public string MinioAccessKey => "minioadmin";
    public string MinioSecretKey => "minioadmin";

    // ═══════════════════════════════════════════════════════════════
    // EF CORE FACTORY (optional)
    // ═══════════════════════════════════════════════════════════════

    public IDbContextFactory<AppDbContext>? DbFactory { get; private set; }

    // ═══════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════

    public async ValueTask InitializeAsync()
    {
        // Start all containers in parallel
        await Task.WhenAll(
            _postgres.StartAsync(),
            _rabbitmq.StartAsync(),
            _elasticsearch.StartAsync(),
            _minio.StartAsync()
        );

        // Setup EF Core factory
        var dataSource = new NpgsqlDataSourceBuilder(PostgresConnectionString).Build();
        var services = new ServiceCollection();
        services.AddPooledDbContextFactory<AppDbContext>(opts =>
        {
            opts.UseNpgsql(dataSource)
                .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        });

        var provider = services.BuildServiceProvider();
        DbFactory = provider.GetRequiredService<IDbContextFactory<AppDbContext>>();

        // Run migrations
        await using var db = await DbFactory.CreateDbContextAsync();
        await db.Database.MigrateAsync();
    }

    public async ValueTask DisposeAsync()
    {
        await Task.WhenAll(
            _postgres.DisposeAsync().AsTask(),
            _rabbitmq.DisposeAsync().AsTask(),
            _elasticsearch.DisposeAsync().AsTask(),
            _minio.DisposeAsync().AsTask()
        );
    }
}

// Register assembly-wide
// GlobalUsings.cs
[assembly: AssemblyFixture(typeof(SharedContainerFixture))]
```

Usage in test classes:

```csharp
public sealed class DocumentRepositoryIntegrationTests
{
    private readonly SharedContainerFixture _fixture;

    public DocumentRepositoryIntegrationTests(SharedContainerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task AddAsync_ValidDocument_Persists()
    {
        // Use fixture.DbFactory
        await using var db = await _fixture.DbFactory!.CreateDbContextAsync();
        // ...
    }
}
```

---

## 🧪 Moq Best Practices

### MockRepository Pattern

Use `MockRepository` for unified verification:

```csharp
public sealed class DocumentServiceTests : IDisposable
{
    // ═══════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════

    private const string ValidFileName = "invoice.pdf";
    private const string ValidStoragePath = "documents/2025-01/abc123.pdf";
    private const string ExtractedOcrContent = "Invoice #12345";

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTION
    // ═══════════════════════════════════════════════════════════════

    private readonly MockRepository _mocks = new(MockBehavior.Strict)
    {
        DefaultValue = DefaultValue.Empty
    };

    private readonly Mock<IDocumentRepository> _documentRepository;
    private readonly Mock<IDocumentStorageService> _storageService;
    private readonly Mock<IRabbitMqPublisher> _publisher;
    private readonly FakeLogger<DocumentService> _logger;

    public DocumentServiceTests()
    {
        _documentRepository = _mocks.Create<IDocumentRepository>();
        _storageService = _mocks.Create<IDocumentStorageService>();
        _publisher = _mocks.Create<IRabbitMqPublisher>();
        _logger = new FakeLogger<DocumentService>();
    }

    // ═══════════════════════════════════════════════════════════════
    // SUT FACTORY
    // ═══════════════════════════════════════════════════════════════

    private DocumentService CreateSut() => new(
        _documentRepository.Object,
        _storageService.Object,
        _publisher.Object,
        _logger
    );

    // ═══════════════════════════════════════════════════════════════
    // TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task UploadAsync_ValidPdf_PublishesOcrCommand()
    {
        // Arrange
        _storageService
            .Setup(s => s.UploadAsync(
                It.IsAny<Stream>(),
                It.Is<string>(p => p.EndsWith(".pdf")),
                It.IsAny<long>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _documentRepository
            .Setup(r => r.AddAsync(It.IsAny<Document>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Document d, CancellationToken _) => d);

        _publisher
            .Setup(p => p.PublishAsync(It.IsAny<string>(), It.IsAny<OcrCommand>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut();

        // Act
        var result = await sut.UploadAsync(ValidFileName, Stream.Null, 1024, default);

        // Assert
        result.FileName.Should().Be(ValidFileName);
    }

    // ═══════════════════════════════════════════════════════════════
    // TEARDOWN
    // ═══════════════════════════════════════════════════════════════

    public void Dispose()
    {
        _mocks.VerifyAll();
        _mocks.VerifyNoOtherCalls();
    }
}
```

### FakeLogger + FakeLogCollector

For asserting on log output:

```csharp
public sealed class OcrProcessorTests : IDisposable
{
    private readonly MockRepository _mocks = new(MockBehavior.Strict);
    private readonly FakeLogCollector _logCollector;
    private readonly FakeLogger<OcrProcessor> _logger;

    public OcrProcessorTests()
    {
        _logCollector = new FakeLogCollector();
        _logger = new FakeLogger<OcrProcessor>(_logCollector);
    }

    [Fact]
    public async Task ProcessAsync_DocumentNotFound_LogsWarning()
    {
        // Arrange
        // ... setup mocks to return not found

        var sut = CreateSut();

        // Act
        await sut.ProcessAsync(Guid.NewGuid(), default);

        // Assert
        _logCollector.GetSnapshot()
            .Should().Contain(log =>
                log.Level == LogLevel.Warning &&
                log.Message.Contains("not found"));
    }

    public void Dispose() => _mocks.VerifyAll();
}
```

### MockBehavior Explained

| Behavior | Use Case |
|----------|----------|
| `MockBehavior.Strict` | All calls must be explicitly set up. Throws on unexpected calls. Best for unit tests. |
| `MockBehavior.Loose` | Returns default values for un-setup calls. Can hide bugs. |
| `DefaultValue.Empty` | Returns empty collections, `Guid.Empty`, empty strings - safer than `null` |
| `DefaultValue.Mock` | Auto-creates nested mocks - use carefully |

### Setup Patterns Reference

```csharp
// Basic return value
mock.Setup(m => m.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
    .ReturnsAsync(document);

// Match specific argument
mock.Setup(m => m.GetByIdAsync(expectedId, It.IsAny<CancellationToken>()))
    .ReturnsAsync(document);

// Conditional match
mock.Setup(m => m.GetByIdAsync(
        It.Is<Guid>(id => id != Guid.Empty),
        It.IsAny<CancellationToken>()))
    .ReturnsAsync(document);

// Return input (passthrough)
mock.Setup(m => m.AddAsync(It.IsAny<Document>(), It.IsAny<CancellationToken>()))
    .ReturnsAsync((Document d, CancellationToken _) => d);

// Throw exception
mock.Setup(m => m.GetByIdAsync(badId, It.IsAny<CancellationToken>()))
    .ThrowsAsync(new InvalidOperationException("Not found"));

// Sequential returns
mock.SetupSequence(m => m.GetNextAsync())
    .ReturnsAsync("first")
    .ReturnsAsync("second")
    .ThrowsAsync(new InvalidOperationException("No more"));

// Capture argument
Document? captured = null;
mock.Setup(m => m.AddAsync(It.IsAny<Document>(), It.IsAny<CancellationToken>()))
    .Callback<Document, CancellationToken>((doc, _) => captured = doc)
    .ReturnsAsync((Document d, CancellationToken _) => d);

// Verify call count
mock.Verify(m => m.SaveAsync(It.IsAny<CancellationToken>()), Times.Once);
mock.Verify(m => m.DeleteAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
```

---

## 🎯 Sealed Client Wrapper Pattern

When external clients are `sealed` (ElasticsearchClient, MinioClient, HttpClient), wrap them:

```csharp
// ═══════════════════════════════════════════════════════════════
// INTERFACE (for mocking)
// ═══════════════════════════════════════════════════════════════

internal interface IElasticClientWrapper
{
    Task<bool> IndexExistsAsync(string indexName, CancellationToken ct);
    Task CreateIndexAsync(string indexName, CancellationToken ct);
    Task<IndexResponse> IndexDocumentAsync<T>(T document, string id, CancellationToken ct) where T : class;
    Task<DeleteResponse> DeleteDocumentAsync(string id, CancellationToken ct);
    IAsyncEnumerable<T> SearchAsync<T>(string query, int limit, CancellationToken ct) where T : class;
}

// ═══════════════════════════════════════════════════════════════
// IMPLEMENTATION (delegates to sealed client)
// ═══════════════════════════════════════════════════════════════

internal sealed class ElasticClientWrapper : IElasticClientWrapper
{
    private readonly ElasticsearchClient _client;
    private readonly string _indexName;

    public ElasticClientWrapper(ElasticsearchClient client, IOptions<ElasticsearchOptions> options)
    {
        _client = client;
        _indexName = options.Value.IndexName;
    }

    public async Task<bool> IndexExistsAsync(string indexName, CancellationToken ct)
    {
        var response = await _client.Indices.ExistsAsync(indexName, ct);
        return response.Exists;
    }

    public async Task CreateIndexAsync(string indexName, CancellationToken ct)
    {
        await _client.Indices.CreateAsync(indexName, ct);
    }

    public async Task<IndexResponse> IndexDocumentAsync<T>(T document, string id, CancellationToken ct) where T : class
    {
        return await _client.IndexAsync(document, i => i.Index(_indexName).Id(id), ct);
    }

    // ... other methods
}

// ═══════════════════════════════════════════════════════════════
// DI REGISTRATION
// ═══════════════════════════════════════════════════════════════

services.AddSingleton<IElasticClientWrapper, ElasticClientWrapper>();
```

Now tests use `Mock<IElasticClientWrapper>`:

```csharp
public sealed class SearchIndexServiceTests : IDisposable
{
    private readonly MockRepository _mocks = new(MockBehavior.Strict);
    private readonly Mock<IElasticClientWrapper> _elastic;

    public SearchIndexServiceTests()
    {
        _elastic = _mocks.Create<IElasticClientWrapper>();
    }

    [Fact]
    public async Task EnsureIndexAsync_IndexMissing_CreatesIndex()
    {
        // Arrange
        _elastic.Setup(e => e.IndexExistsAsync("documents", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _elastic.Setup(e => e.CreateIndexAsync("documents", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = new SearchIndexService(_elastic.Object, NullLogger<SearchIndexService>.Instance);

        // Act
        await sut.EnsureIndexAsync(default);

        // Assert - verified in Dispose via VerifyAll()
    }

    public void Dispose() => _mocks.VerifyAll();
}
```

---

## 🔨 Handler Extraction Pattern

When `BackgroundService` uses `IServiceScopeFactory`, extract the handler:

### Before (Hard to Test)

```csharp
public class OcrResultListener : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;  // Hard to mock
    private readonly IRabbitMqConsumerFactory _consumerFactory;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await using var consumer = await _consumerFactory.CreateConsumerAsync<OcrEvent>(ct);
        await foreach (var msg in consumer.ConsumeAsync(ct))
        {
            using var scope = _scopeFactory.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IDocumentService>();

            // 30+ lines of business logic buried here
            try
            {
                bool success = await service.ProcessOcrResultAsync(msg.JobId, msg.Status, msg.Content, ct);
                if (success) await consumer.AckAsync();
                else await consumer.NackAsync(false);
            }
            catch
            {
                await consumer.NackAsync(false);
            }
        }
    }
}
```

### After (Testable)

```csharp
// ═══════════════════════════════════════════════════════════════
// EXTRACTED HANDLER (internal, directly testable)
// ═══════════════════════════════════════════════════════════════

internal sealed class OcrEventHandler
{
    private readonly IDocumentService _documentService;
    private readonly ISseStream<OcrEvent> _sseStream;
    private readonly ILogger<OcrEventHandler> _logger;

    public OcrEventHandler(
        IDocumentService documentService,
        ISseStream<OcrEvent> sseStream,
        ILogger<OcrEventHandler> logger)
    {
        _documentService = documentService;
        _sseStream = sseStream;
        _logger = logger;
    }

    public async Task<HandlerResult> HandleAsync(OcrEvent evt, CancellationToken ct)
    {
        try
        {
            bool success = await _documentService.ProcessOcrResultAsync(
                evt.JobId, evt.Status, evt.Content, ct);

            if (!success)
            {
                _logger.LogWarning("Document {JobId} not found", evt.JobId);
                return HandlerResult.NotFound;
            }

            _sseStream.Publish(evt);
            return HandlerResult.Success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed processing OCR event {JobId}", evt.JobId);
            return HandlerResult.Failed;
        }
    }
}

internal enum HandlerResult { Success, NotFound, Failed }

// ═══════════════════════════════════════════════════════════════
// THIN LISTENER (just orchestration, < 15 lines)
// ═══════════════════════════════════════════════════════════════

public class OcrResultListener : BackgroundService
{
    private readonly IRabbitMqConsumerFactory _consumerFactory;
    private readonly OcrEventHandler _handler;  // Injected, not resolved from scope

    public OcrResultListener(IRabbitMqConsumerFactory consumerFactory, OcrEventHandler handler)
    {
        _consumerFactory = consumerFactory;
        _handler = handler;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await using var consumer = await _consumerFactory.CreateConsumerAsync<OcrEvent>(ct);
        await foreach (var msg in consumer.ConsumeAsync(ct))
        {
            var result = await _handler.HandleAsync(msg, ct);
            if (result == HandlerResult.Success)
                await consumer.AckAsync();
            else
                await consumer.NackAsync(requeue: result == HandlerResult.Failed);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// DI REGISTRATION
// ═══════════════════════════════════════════════════════════════

services.AddScoped<OcrEventHandler>();
services.AddHostedService<OcrResultListener>();
```

### Handler Test

```csharp
public sealed class OcrEventHandlerTests : IDisposable
{
    private const string CompletedStatus = "Completed";
    private const string ExtractedContent = "Extracted text";

    private readonly MockRepository _mocks = new(MockBehavior.Strict);
    private readonly Mock<IDocumentService> _documentService;
    private readonly Mock<ISseStream<OcrEvent>> _sseStream;
    private readonly FakeLogger<OcrEventHandler> _logger;

    public OcrEventHandlerTests()
    {
        _documentService = _mocks.Create<IDocumentService>();
        _sseStream = _mocks.Create<ISseStream<OcrEvent>>();
        _logger = new FakeLogger<OcrEventHandler>();
    }

    private OcrEventHandler CreateSut() => new(
        _documentService.Object,
        _sseStream.Object,
        _logger
    );

    private static OcrEvent CreateEvent(Guid? jobId = null) =>
        new(jobId ?? Guid.CreateVersion7(), CompletedStatus, ExtractedContent, DateTimeOffset.UtcNow);

    [Fact]
    public async Task HandleAsync_ProcessingSucceeds_PublishesAndReturnsSuccess()
    {
        // Arrange
        var evt = CreateEvent();

        _documentService
            .Setup(s => s.ProcessOcrResultAsync(
                evt.JobId, CompletedStatus, ExtractedContent, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _sseStream.Setup(s => s.Publish(evt));

        var sut = CreateSut();

        // Act
        var result = await sut.HandleAsync(evt, CancellationToken.None);

        // Assert
        result.Should().Be(HandlerResult.Success);
    }

    [Fact]
    public async Task HandleAsync_DocumentNotFound_ReturnsNotFound()
    {
        // Arrange
        var evt = CreateEvent();

        _documentService
            .Setup(s => s.ProcessOcrResultAsync(
                It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var sut = CreateSut();

        // Act
        var result = await sut.HandleAsync(evt, CancellationToken.None);

        // Assert
        result.Should().Be(HandlerResult.NotFound);
        _sseStream.Verify(s => s.Publish(It.IsAny<OcrEvent>()), Times.Never);
    }

    public void Dispose() => _mocks.VerifyAll();
}
```

---

## 📁 Assembly Visibility

Enable internal testing without public exposure:

```xml
<!-- Production .csproj -->
<ItemGroup>
  <InternalsVisibleTo Include="MyProject.Tests" />
  <InternalsVisibleTo Include="DynamicProxyGenAssembly2" /> <!-- For Moq -->
</ItemGroup>
```

---

## Common Gotchas

### 1. Anonymous Type Assertions

Production code uses anonymous types:

```csharp
pd.Extensions["debug"] = new
{
    exception_type = ex.GetType().FullName,
    inner_exception = ex.InnerException?.Message,
    stack_trace = ex.StackTrace
};
```

**Solution A: Reflection**

```csharp
var debug = pd.Extensions["debug"]!;
var debugType = debug.GetType();
var innerException = debugType.GetProperty("inner_exception")?.GetValue(debug);
innerException.Should().Be("Expected message");
```

**Solution B: Refactor to Named Type (Better)**

```csharp
// Production
internal sealed record DebugInfo(string? ExceptionType, string? InnerException, string? StackTrace);
pd.Extensions["debug"] = new DebugInfo(ex.GetType().FullName, ex.InnerException?.Message, ex.StackTrace);

// Test
var debug = pd.Extensions["debug"].Should().BeOfType<DebugInfo>().Subject;
debug.InnerException.Should().Be("Expected message");
```

### 2. Static Initialization vs MockFileSystem

When production code has static initialization:

```csharp
private static readonly XmlSchemaSet Schemas = LoadSchemas();

private static XmlSchemaSet LoadSchemas()
{
    string schemaPath = Path.Combine(AppContext.BaseDirectory, "Schemas", "report.xsd");
    // This runs BEFORE test setup - MockFileSystem can't intercept
}
```

**Solutions:**
1. Make schema loading lazy (defer to first use)
2. Inject schema path via constructor
3. Use real file system for that specific test
4. Copy schema to test output directory

### 3. Integration Test Fixture 0ms Failures

When tests fail at 0ms:

```
failed MyIntegrationTest (0ms)
```

**Causes:**
- Fixture `InitializeAsync` threw
- Container startup failed
- Database migration failed
- Multiple fixtures sharing resources

**Fixes:**
- Check Docker is running
- Check container logs: `docker logs <container_id>`
- Use unique database names per fixture
- Ensure single `AssemblyFixture` coordinates all containers

### 4. ErrorOr Result Pattern

For testing `ErrorOr<T>`:

```csharp
// Success case
result.IsError.Should().BeFalse();
result.Value.ProcessedCount.Should().Be(2);

// Error case
result.IsError.Should().BeTrue();
result.FirstError.Code.Should().Be("Report.InvalidGuid");
result.FirstError.Description.Should().Contain("invalid GUID");

// Multiple errors
result.Errors.Should().HaveCount(2);
result.Errors.Select(e => e.Code).Should().Contain(["Error.One", "Error.Two"]);
```

---

## 📊 Coverage Collection

### NUKE Build Target

```csharp
Target CodeCoverage => _ => _
    .DependsOn(Compile)
    .Executes(() =>
    {
        DotNetTest(s => s
            .SetProjectFile(Solution.GetProject("MyProject.Tests"))
            .SetConfiguration(Configuration.Debug)
            .SetProcessAdditionalArguments([
                "--",
                "--coverage",
                "--coverage-output-format", "cobertura",
                "--coverage-output", "./TestResults/coverage.cobertura.xml"
            ])
            .EnableNoBuild());
    });
```

### GitHub Actions

```yaml
- name: Run Tests with Coverage
  run: |
    dotnet test \
      --configuration Release \
      --no-build \
      -- --coverage \
         --coverage-output-format cobertura \
         --coverage-output ./TestResults/coverage.xml

- name: Upload Coverage Report
  uses: codecov/codecov-action@v4
  with:
    files: ./TestResults/coverage.xml
```

---

## 🏗️ Test Project Structure

```
MyProject.Tests/
├── Unit/
│   ├── Services/
│   │   ├── DocumentServiceTests.cs
│   │   └── OcrProcessorTests.cs
│   ├── Handlers/
│   │   ├── OcrEventHandlerTests.cs
│   │   └── GenAiEventHandlerTests.cs
│   └── Validators/
│       └── UploadRequestValidatorTests.cs
├── Integration/
│   ├── SharedContainerFixture.cs
│   ├── Repositories/
│   │   └── DocumentRepositoryIntegrationTests.cs
│   └── Endpoints/
│       └── DocumentEndpointTests.cs
├── Builders/
│   ├── DocumentBuilder.cs
│   └── UploadRequestBuilder.cs
├── GlobalUsings.cs
└── MyProject.Tests.csproj
```

### GlobalUsings.cs

```csharp
global using Xunit;
global using AwesomeAssertions;  // Drop-in replacement for FluentAssertions (Apache 2.0)
global using Moq;
global using Microsoft.Extensions.Logging;
global using Microsoft.Extensions.Logging.Testing;

// Assembly attributes
[assembly: AssemblyFixture(typeof(SharedContainerFixture))]
[assembly: CaptureConsole]
[assembly: CaptureTrace]
```

---

## 📋 Refactoring Checklist

### Before Writing Tests

- [ ] Add `[assembly: InternalsVisibleTo("...Tests")]` to production .csproj
- [ ] Add `[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]` for Moq
- [ ] Identify sealed external clients needing wrappers
- [ ] Identify BackgroundServices needing handler extraction

### Handler Extraction

- [ ] Extract business logic from `ExecuteAsync` to internal handler class
- [ ] Handler takes explicit constructor dependencies (no `IServiceScopeFactory`)
- [ ] Handler returns result enum (`Success`, `NotFound`, `Failed`)
- [ ] Listener/Worker becomes thin orchestration (< 15 lines)
- [ ] Register handler in DI container

### Sealed Client Wrapping

- [ ] Create `I{Client}Wrapper` interface
- [ ] Implementation delegates to sealed client
- [ ] Service depends on interface, not sealed client
- [ ] Register wrapper in DI container

### Test Structure

- [ ] Constants section at top
- [ ] MockRepository for grouped verification
- [ ] Private `CreateSut()` factory method
- [ ] `IDisposable` with `VerifyAll()` in Dispose()
- [ ] Use builders for test data

---

## Examples

### Example 1: PostgreSQL Integration Test

```csharp
public sealed class UserRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("testdb")
        .WithUsername("testuser")
        .WithPassword("testpass")
        .Build();

    public ValueTask InitializeAsync() => new(_postgres.StartAsync());

    public ValueTask DisposeAsync() => _postgres.DisposeAsync();

    [Fact]
    public async Task CreateUser_ValidUser_Persists()
    {
        // Arrange
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT NOT NULL)",
            connection);
        await cmd.ExecuteNonQueryAsync();

        var repo = new UserRepository(connection);

        // Act
        var user = await repo.CreateAsync("Alice");

        // Assert
        user.Id.Should().BeGreaterThan(0);
        user.Name.Should().Be("Alice");
    }
}
```

### Example 2: RabbitMQ Publisher Test

```csharp
public sealed class EventPublisherTests : IAsyncLifetime
{
    private readonly RabbitMqContainer _rabbitmq = new RabbitMqBuilder()
        .WithImage("rabbitmq:4-management-alpine")
        .Build();

    public ValueTask InitializeAsync() => new(_rabbitmq.StartAsync());

    public ValueTask DisposeAsync() => _rabbitmq.DisposeAsync();

    [Fact]
    public async Task PublishAsync_ValidEvent_DeliversToQueue()
    {
        // Arrange
        var factory = new ConnectionFactory
        {
            Uri = new Uri(_rabbitmq.GetConnectionString())
        };

        await using var connection = await factory.CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();

        await channel.QueueDeclareAsync("test-queue", durable: false, exclusive: false, autoDelete: true);

        var publisher = new EventPublisher(channel);

        // Act
        await publisher.PublishAsync("test-queue", new TestEvent { Message = "Hello" });

        // Assert
        var result = await channel.BasicGetAsync("test-queue", autoAck: true);
        result.Should().NotBeNull();

        var message = JsonSerializer.Deserialize<TestEvent>(result.Body.Span);
        message!.Message.Should().Be("Hello");
    }
}
```

### Example 3: Elasticsearch Search Test

```csharp
public sealed class SearchServiceTests : IAsyncLifetime
{
    private readonly ElasticsearchContainer _elasticsearch = new ElasticsearchBuilder()
        .WithImage("elasticsearch:8.17.0")
        .Build();

    public ValueTask InitializeAsync() => new(_elasticsearch.StartAsync());

    public ValueTask DisposeAsync() => _elasticsearch.DisposeAsync();

    [Fact]
    public async Task SearchAsync_MatchingDocument_ReturnsResult()
    {
        // Arrange
        var settings = new ElasticsearchClientSettings(new Uri(_elasticsearch.GetConnectionString()));
        var client = new ElasticsearchClient(settings);

        await client.Indices.CreateAsync("documents");
        await client.IndexAsync(new DocumentIndex { Id = "1", Content = "Hello World" }, i => i.Index("documents"));
        await client.Indices.RefreshAsync("documents");

        var searchService = new SearchService(client);

        // Act
        var results = await searchService.SearchAsync("Hello").ToListAsync();

        // Assert
        results.Should().ContainSingle(d => d.Content.Contains("Hello"));
    }
}
```

### Example 4: MinIO Storage Test

```csharp
public sealed class StorageServiceTests : IAsyncLifetime
{
    private readonly MinioContainer _minio = new MinioBuilder()
        .WithImage("minio/minio:latest")
        .Build();

    public ValueTask InitializeAsync() => new(_minio.StartAsync());

    public ValueTask DisposeAsync() => _minio.DisposeAsync();

    [Fact]
    public async Task UploadAsync_ValidFile_StoresInBucket()
    {
        // Arrange
        var client = new MinioClient()
            .WithEndpoint(_minio.GetConnectionString())
            .WithCredentials("minioadmin", "minioadmin")
            .Build();

        await client.MakeBucketAsync(new MakeBucketArgs().WithBucket("test-bucket"));

        var storageService = new StorageService(client);
        var content = "Hello, MinIO!"u8.ToArray();

        // Act
        await storageService.UploadAsync("test-bucket", "test.txt", new MemoryStream(content));

        // Assert
        var statArgs = new StatObjectArgs().WithBucket("test-bucket").WithObject("test.txt");
        var stat = await client.StatObjectAsync(statArgs);
        stat.Size.Should().Be(content.Length);
    }
}
```

---

## Best Practices Summary

1. **Always use pre-configured modules when available** - They provide sensible defaults
2. **Use AssemblyFixture for integration tests** - Shares containers across all test classes
3. **Extract handlers from BackgroundServices** - Makes business logic directly testable
4. **Wrap sealed clients** - Create mockable interfaces for external dependencies
5. **Use MockRepository with Strict behavior** - Catches unexpected calls
6. **Constants at top of test class** - Makes test data consistent and clear
7. **Private CreateSut() factory** - Single point for SUT construction
8. **IDisposable with VerifyAll()** - Automatic mock verification
9. **Use AwesomeAssertions over FluentAssertions** - Apache 2.0 license, API-compatible
10. **MTP for xUnit v3** - Use `-- --coverage`, not VSTest flags

---

## Additional Resources

- **Testcontainers .NET Documentation**: https://dotnet.testcontainers.org/
- **xUnit v3 Documentation**: https://xunit.net/docs/getting-started/v3
- **Microsoft Testing Platform**: https://learn.microsoft.com/en-us/dotnet/core/testing/microsoft-testing-platform-overview
- **AwesomeAssertions**: https://github.com/AwesomeAssertions/awesomeassertions
- **Moq Documentation**: https://github.com/moq/moq4
- **Testably.Abstractions**: https://github.com/Testably/Testably.Abstractions
