namespace Examples;

/// <summary>
/// Demonstrates IClassFixture pattern - container shared within a single test class.
/// Use when tests in ONE class share expensive setup (faster than per-test containers).
/// </summary>
public sealed class ClassFixtureExample : IClassFixture<PostgresClassFixture>
{
	// ═══════════════════════════════════════════════════════════════
	// CONSTANTS
	// ═══════════════════════════════════════════════════════════════

	private const string TestUserName = "Alice";
	private const string TestUserEmail = "alice@example.com";

	// ═══════════════════════════════════════════════════════════════
	// FIXTURE INJECTION
	// ═══════════════════════════════════════════════════════════════

	private readonly PostgresClassFixture _fixture;

	public ClassFixtureExample(PostgresClassFixture fixture)
	{
		_fixture = fixture;
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: User Repository
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task CreateUser_ValidUser_ReturnsWithId()
	{
		// Arrange
		await using NpgsqlConnection connection = await _fixture.CreateConnectionAsync();
		UserRepository repo = new(connection);

		// Act
		User user = await repo.CreateAsync(TestUserName, TestUserEmail);

		// Assert
		user.Id.Should().BeGreaterThan(0);
		user.Name.Should().Be(TestUserName);
		user.Email.Should().Be(TestUserEmail);
	}

	[Fact]
	public async Task GetById_ExistingUser_ReturnsUser()
	{
		// Arrange
		await using NpgsqlConnection connection = await _fixture.CreateConnectionAsync();
		UserRepository repo = new(connection);
		User created = await repo.CreateAsync("Bob", "bob@example.com");

		// Act
		User? found = await repo.GetByIdAsync(created.Id);

		// Assert
		found.Should().NotBeNull();
		found!.Name.Should().Be("Bob");
	}

	[Fact]
	public async Task GetById_NonExistentUser_ReturnsNull()
	{
		// Arrange
		await using NpgsqlConnection connection = await _fixture.CreateConnectionAsync();
		UserRepository repo = new(connection);

		// Act
		User? found = await repo.GetByIdAsync(99999);

		// Assert
		found.Should().BeNull();
	}

	[Fact]
	public async Task UpdateEmail_ExistingUser_UpdatesSuccessfully()
	{
		// Arrange
		await using NpgsqlConnection connection = await _fixture.CreateConnectionAsync();
		UserRepository repo = new(connection);
		User user = await repo.CreateAsync("Charlie", "charlie@old.com");

		// Act
		await repo.UpdateEmailAsync(user.Id, "charlie@new.com");
		User? updated = await repo.GetByIdAsync(user.Id);

		// Assert
		updated!.Email.Should().Be("charlie@new.com");
	}
}

// ═══════════════════════════════════════════════════════════════
// CLASS FIXTURE - Shared container for one test class
// ═══════════════════════════════════════════════════════════════

public sealed class PostgresClassFixture : IAsyncLifetime
{
	private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
		.WithImage("postgres:16-alpine")
		.WithDatabase("testdb")
		.WithUsername("testuser")
		.WithPassword("testpass")
		.Build();

	public string ConnectionString => _container.GetConnectionString();

	public async ValueTask InitializeAsync()
	{
		await _container.StartAsync();

		// Run schema setup
		await using NpgsqlConnection connection = new(ConnectionString);
		await connection.OpenAsync();

		await using NpgsqlCommand cmd = new(
			"""
			CREATE TABLE IF NOT EXISTS users (
			    id SERIAL PRIMARY KEY,
			    name TEXT NOT NULL,
			    email TEXT NOT NULL UNIQUE,
			    created_at TIMESTAMPTZ DEFAULT NOW()
			)
			""",
			connection);

		await cmd.ExecuteNonQueryAsync();
	}

	public async ValueTask DisposeAsync()
	{
		await _container.DisposeAsync();
	}

	/// <summary>
	/// Creates a new connection for test isolation.
	/// Each test gets its own connection but shares the container.
	/// </summary>
	public async Task<NpgsqlConnection> CreateConnectionAsync()
	{
		NpgsqlConnection connection = new(ConnectionString);
		await connection.OpenAsync();
		return connection;
	}
}

// ═══════════════════════════════════════════════════════════════
// DOMAIN TYPES
// ═══════════════════════════════════════════════════════════════

public sealed record User(int Id, string Name, string Email, DateTime CreatedAt);

// ═══════════════════════════════════════════════════════════════
// REPOSITORY UNDER TEST
// ═══════════════════════════════════════════════════════════════

public sealed class UserRepository
{
	private readonly NpgsqlConnection _connection;

	public UserRepository(NpgsqlConnection connection)
	{
		_connection = connection;
	}

	public async Task<User> CreateAsync(string name, string email)
	{
		await using NpgsqlCommand cmd = new(
			"INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at",
			_connection);

		cmd.Parameters.AddWithValue(name);
		cmd.Parameters.AddWithValue(email);

		await using NpgsqlDataReader reader = await cmd.ExecuteReaderAsync();
		await reader.ReadAsync();

		return new User(
			reader.GetInt32(0),
			reader.GetString(1),
			reader.GetString(2),
			reader.GetDateTime(3));
	}

	public async Task<User?> GetByIdAsync(int id)
	{
		await using NpgsqlCommand cmd = new(
			"SELECT id, name, email, created_at FROM users WHERE id = $1",
			_connection);

		cmd.Parameters.AddWithValue(id);

		await using NpgsqlDataReader reader = await cmd.ExecuteReaderAsync();

		if (!await reader.ReadAsync())
		{
			return null;
		}

		return new User(
			reader.GetInt32(0),
			reader.GetString(1),
			reader.GetString(2),
			reader.GetDateTime(3));
	}

	public async Task UpdateEmailAsync(int id, string newEmail)
	{
		await using NpgsqlCommand cmd = new(
			"UPDATE users SET email = $1 WHERE id = $2",
			_connection);

		cmd.Parameters.AddWithValue(newEmail);
		cmd.Parameters.AddWithValue(id);

		await cmd.ExecuteNonQueryAsync();
	}
}
