namespace Examples;

/// <summary>
/// Demonstrates the MockRepository pattern from the SKILL.md.
/// Uses Strict behavior with unified verification.
/// </summary>
public sealed class MockRepositoryPatternTests : IDisposable
{
    // ═══════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════

    private const string ValidUserName = "Alice";
    private const string ValidEmail = "alice@example.com";

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTION
    // ═══════════════════════════════════════════════════════════════

    private readonly MockRepository _mocks = new(MockBehavior.Strict)
    {
        DefaultValue = DefaultValue.Empty
    };

    private readonly Mock<IUserRepository> _userRepository;
    private readonly FakeLogger<UserService> _logger;

    public MockRepositoryPatternTests()
    {
        _userRepository = _mocks.Create<IUserRepository>();
        _logger = new FakeLogger<UserService>();
    }

    // ═══════════════════════════════════════════════════════════════
    // SUT FACTORY
    // ═══════════════════════════════════════════════════════════════

    private UserService CreateSut() => new(_userRepository.Object, _logger);

    // ═══════════════════════════════════════════════════════════════
    // TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetUserAsync_ExistingUser_ReturnsUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expectedUser = new UserDto(userId, ValidUserName, ValidEmail);

        _userRepository
            .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedUser);

        var sut = CreateSut();

        // Act
        var result = await sut.GetUserAsync(userId, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be(ValidUserName);
        result.Email.Should().Be(ValidEmail);
    }

    [Fact]
    public async Task GetUserAsync_NonExistingUser_ReturnsNull()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepository
            .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserDto?)null);

        var sut = CreateSut();

        // Act
        var result = await sut.GetUserAsync(userId, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateUserAsync_ValidInput_ReturnsCreatedUser()
    {
        // Arrange
        _userRepository
            .Setup(r => r.AddAsync(It.IsAny<UserDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserDto u, CancellationToken _) => u);

        var sut = CreateSut();

        // Act
        var result = await sut.CreateUserAsync(ValidUserName, ValidEmail, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(ValidUserName);
        result.Email.Should().Be(ValidEmail);
        result.Id.Should().NotBe(Guid.Empty);
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

// ═══════════════════════════════════════════════════════════════
// SAMPLE TYPES (for demonstration)
// Note: Named UserDto to avoid conflict with User in ClassFixtureExample.cs
// ═══════════════════════════════════════════════════════════════

public sealed record UserDto(Guid Id, string Name, string Email);

public interface IUserRepository
{
    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<UserDto> AddAsync(UserDto user, CancellationToken ct);
}

public sealed class UserService
{
    private readonly IUserRepository _repository;
    private readonly ILogger<UserService> _logger;

    public UserService(IUserRepository repository, ILogger<UserService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<UserDto?> GetUserAsync(Guid id, CancellationToken ct)
    {
        _logger.LogInformation("Getting user {UserId}", id);
        return await _repository.GetByIdAsync(id, ct);
    }

    public async Task<UserDto> CreateUserAsync(string name, string email, CancellationToken ct)
    {
        var user = new UserDto(Guid.NewGuid(), name, email);
        _logger.LogInformation("Creating user {UserName}", name);
        return await _repository.AddAsync(user, ct);
    }
}
