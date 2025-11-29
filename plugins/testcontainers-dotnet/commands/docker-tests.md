---
name: docker-tests
description: Generate .NET integration tests using Testcontainers, xUnit v3, and Moq
---

Generate a Testcontainers-based integration test for .NET applications.

## Usage

```text
/testcontainers-dotnet:docker-tests [target]
```

## Targets

- `/testcontainers-dotnet:docker-tests` - Analyze current context and generate appropriate test.
- `/testcontainers-dotnet:docker-tests MyService.cs` - Generate tests for a specific service.
- `/testcontainers-dotnet:docker-tests --postgres` - Generate PostgreSQL container fixture test.
- `/testcontainers-dotnet:docker-tests --rabbitmq` - Generate RabbitMQ container fixture test.
- `/testcontainers-dotnet:docker-tests --elasticsearch` - Generate Elasticsearch container test.
- `/testcontainers-dotnet:docker-tests --minio` - Generate MinIO storage container test.

## Behavior

1. Read the target service/class to understand dependencies.
2. Identify container requirements (databases, queues, search, storage).
3. Apply appropriate fixture pattern (IAsyncLifetime, ClassFixture, AssemblyFixture).
4. Generate test class with MockRepository pattern.
5. Include FakeLogger for log assertions.
6. Use AwesomeAssertions (Apache 2.0 FluentAssertions fork).
7. Add proper package references if needed.

## Generated Test Structure

```csharp
public sealed class MyServiceTests : IDisposable
{
    // Constants section
    private const string ValidInput = "test-value";

    // MockRepository for unified verification
    private readonly MockRepository _mocks = new(MockBehavior.Strict);
    private readonly Mock<IDependency> _dependency;
    private readonly FakeLogger<MyService> _logger;

    public MyServiceTests()
    {
        _dependency = _mocks.Create<IDependency>();
        _logger = new FakeLogger<MyService>();
    }

    private MyService CreateSut() => new(
        _dependency.Object,
        _logger
    );

    [Fact]
    public async Task MethodAsync_ValidInput_ExpectedBehavior()
    {
        // Arrange
        _dependency.Setup(d => d.DoSomethingAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var sut = CreateSut();

        // Act
        var result = await sut.MethodAsync(ValidInput, CancellationToken.None);

        // Assert
        result.Should().Be(expected);
    }

    public void Dispose() => _mocks.VerifyAll();
}
```

## Options

- `/testcontainers-dotnet:docker-tests --unit` - Generate unit test with mocks only.
- `/testcontainers-dotnet:docker-tests --integration` - Generate integration test with containers.
- `/testcontainers-dotnet:docker-tests --assembly-fixture` - Use AssemblyFixture pattern.
- `/testcontainers-dotnet:docker-tests --class-fixture` - Use ClassFixture pattern.
- `/testcontainers-dotnet:docker-tests --packages` - Show required package references.

## Package Requirements

The command will ensure these packages are referenced (xUnit v3 + .NET 8/9/10):

```xml
<PackageReference Include="xunit.v3" Version="3.2.1" />
<PackageReference Include="Moq" Version="4.20.72" />
<PackageReference Include="AwesomeAssertions" Version="9.3.0" />
<PackageReference Include="Microsoft.Extensions.Diagnostics.Testing" Version="8.0.0" />
<PackageReference Include="Testcontainers.PostgreSql" Version="4.9.0" />
```

## Related

- Run the `testcontainers-dotnet` skill for comprehensive guidance.
- See skill documentation for package compatibility matrix.
