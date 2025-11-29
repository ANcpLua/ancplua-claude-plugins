namespace Examples;

/// <summary>
/// Basic PostgreSQL integration tests demonstrating Testcontainers patterns.
/// These tests validate the patterns documented in the SKILL.md.
/// </summary>
public sealed class PostgresBasicTests : IAsyncLifetime
{
    // ═══════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════

    private const string PostgresImage = "postgres:16-alpine";
    private const string DatabaseName = "testdb";
    private const string Username = "testuser";
    private const string Password = "testpass";

    // ═══════════════════════════════════════════════════════════════
    // CONTAINER
    // ═══════════════════════════════════════════════════════════════

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage(PostgresImage)
        .WithDatabase(DatabaseName)
        .WithUsername(Username)
        .WithPassword(Password)
        .Build();

    // ═══════════════════════════════════════════════════════════════
    // LIFECYCLE (xUnit v3 uses ValueTask)
    // ═══════════════════════════════════════════════════════════════

    public async ValueTask InitializeAsync() => await _postgres.StartAsync();

    public async ValueTask DisposeAsync() => await _postgres.DisposeAsync();

    // ═══════════════════════════════════════════════════════════════
    // TESTS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public async Task Container_StartsSuccessfully_CanConnect()
    {
        // Arrange
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());

        // Act
        await connection.OpenAsync(TestContext.Current.CancellationToken);

        // Assert
        connection.State.Should().Be(System.Data.ConnectionState.Open);
    }

    [Fact]
    public async Task Container_CanExecuteQueries_ReturnsResults()
    {
        // Arrange
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync(TestContext.Current.CancellationToken);

        // Act
        await using var cmd = new NpgsqlCommand("SELECT 1 + 1 AS result", connection);
        var result = await cmd.ExecuteScalarAsync(TestContext.Current.CancellationToken);

        // Assert
        result.Should().Be(2);
    }

    [Fact]
    public async Task Container_CanCreateTable_InsertsData()
    {
        // Arrange
        CancellationToken ct = TestContext.Current.CancellationToken;
        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync(ct);

        // Create table
        await using var createCmd = new NpgsqlCommand(
            "CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT NOT NULL)",
            connection);
        await createCmd.ExecuteNonQueryAsync(ct);

        // Act - Insert data
        await using var insertCmd = new NpgsqlCommand(
            "INSERT INTO users (name) VALUES ('Alice') RETURNING id",
            connection);
        var id = await insertCmd.ExecuteScalarAsync(ct);

        // Assert
        id.Should().Be(1);

        // Verify data persisted
        await using var selectCmd = new NpgsqlCommand(
            "SELECT name FROM users WHERE id = 1",
            connection);
        var name = await selectCmd.ExecuteScalarAsync(ct);
        name.Should().Be("Alice");
    }
}
