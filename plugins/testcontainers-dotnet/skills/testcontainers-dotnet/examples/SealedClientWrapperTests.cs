namespace Examples;

/// <summary>
/// Demonstrates the Sealed Client Wrapper pattern from SKILL.md.
/// Use this pattern when external clients are sealed (ElasticsearchClient, MinioClient, HttpClient).
/// The wrapper interface allows mocking in unit tests.
/// </summary>
public sealed class SealedClientWrapperTests : IDisposable
{
	// ═══════════════════════════════════════════════════════════════
	// CONSTANTS
	// ═══════════════════════════════════════════════════════════════

	private const string IndexName = "documents";
	private const string DocumentId = "doc-123";
	private const string DocumentContent = "Hello World";
	private const string SearchQuery = "Hello";

	// ═══════════════════════════════════════════════════════════════
	// CONSTRUCTION
	// ═══════════════════════════════════════════════════════════════

	private readonly MockRepository _mocks = new(MockBehavior.Strict)
	{
		DefaultValue = DefaultValue.Empty
	};

	private readonly Mock<IElasticClientWrapper> _elasticClient;
	private readonly FakeLogger<SearchIndexService> _logger;

	public SealedClientWrapperTests()
	{
		_elasticClient = _mocks.Create<IElasticClientWrapper>();
		_logger = new FakeLogger<SearchIndexService>();
	}

	// ═══════════════════════════════════════════════════════════════
	// SUT FACTORY
	// ═══════════════════════════════════════════════════════════════

	private SearchIndexService CreateSut() => new(
		_elasticClient.Object,
		_logger
	);

	// ═══════════════════════════════════════════════════════════════
	// TESTS: EnsureIndexAsync
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task EnsureIndexAsync_WhenIndexMissing_CreatesIndex()
	{
		// Arrange
		_elasticClient
			.Setup(e => e.IndexExistsAsync(IndexName, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		_elasticClient
			.Setup(e => e.CreateIndexAsync(IndexName, It.IsAny<CancellationToken>()))
			.Returns(Task.CompletedTask);

		SearchIndexService sut = CreateSut();

		// Act
		await sut.EnsureIndexAsync(CancellationToken.None);

		// Assert - verified in Dispose via VerifyAll()
	}

	[Fact]
	public async Task EnsureIndexAsync_WhenIndexExists_DoesNotCreateIndex()
	{
		// Arrange
		_elasticClient
			.Setup(e => e.IndexExistsAsync(IndexName, It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		// Note: CreateIndexAsync is NOT setup, so if called, Strict mock will throw

		SearchIndexService sut = CreateSut();

		// Act
		await sut.EnsureIndexAsync(CancellationToken.None);

		// Assert - no CreateIndexAsync call
		_elasticClient.Verify(e => e.CreateIndexAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: IndexDocumentAsync
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task IndexDocumentAsync_ValidDocument_CallsWrapper()
	{
		// Arrange
		SearchDocument doc = new(DocumentId, DocumentContent);

		_elasticClient
			.Setup(e => e.IndexDocumentAsync(doc, DocumentId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(new IndexResult(true, DocumentId));

		SearchIndexService sut = CreateSut();

		// Act
		IndexResult result = await sut.IndexDocumentAsync(doc, CancellationToken.None);

		// Assert
		result.Success.Should().BeTrue();
		result.Id.Should().Be(DocumentId);
	}

	[Fact]
	public async Task IndexDocumentAsync_WhenWrapperFails_ReturnsFalse()
	{
		// Arrange
		SearchDocument doc = new(DocumentId, DocumentContent);

		_elasticClient
			.Setup(e => e.IndexDocumentAsync(doc, DocumentId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(new IndexResult(false, null));

		SearchIndexService sut = CreateSut();

		// Act
		IndexResult result = await sut.IndexDocumentAsync(doc, CancellationToken.None);

		// Assert
		result.Success.Should().BeFalse();
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: DeleteDocumentAsync
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task DeleteDocumentAsync_ExistingDocument_ReturnsTrue()
	{
		// Arrange
		_elasticClient
			.Setup(e => e.DeleteDocumentAsync(DocumentId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		SearchIndexService sut = CreateSut();

		// Act
		bool result = await sut.DeleteDocumentAsync(DocumentId, CancellationToken.None);

		// Assert
		result.Should().BeTrue();
	}

	[Fact]
	public async Task DeleteDocumentAsync_NonExistentDocument_ReturnsFalse()
	{
		// Arrange
		_elasticClient
			.Setup(e => e.DeleteDocumentAsync(DocumentId, It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		SearchIndexService sut = CreateSut();

		// Act
		bool result = await sut.DeleteDocumentAsync(DocumentId, CancellationToken.None);

		// Assert
		result.Should().BeFalse();
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: SearchAsync
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task SearchAsync_MatchingDocuments_ReturnsResults()
	{
		// Arrange
		SearchDocument[] documents =
		[
			new SearchDocument("doc-1", "Hello World"),
			new SearchDocument("doc-2", "Hello Universe")
		];

		_elasticClient
			.Setup(e => e.SearchAsync<SearchDocument>(SearchQuery, 10, It.IsAny<CancellationToken>()))
			.Returns(documents.ToAsyncEnumerable());

		SearchIndexService sut = CreateSut();

		// Act
		CancellationToken ct = TestContext.Current.CancellationToken;
		List<SearchDocument> results = await sut.SearchAsync(SearchQuery, 10, ct).ToListAsync(ct);

		// Assert
		results.Should().HaveCount(2);
		results.Should().Contain(d => d.Id == "doc-1");
		results.Should().Contain(d => d.Id == "doc-2");
	}

	[Fact]
	public async Task SearchAsync_NoMatches_ReturnsEmpty()
	{
		// Arrange
		_elasticClient
			.Setup(e => e.SearchAsync<SearchDocument>(SearchQuery, 10, It.IsAny<CancellationToken>()))
			.Returns(AsyncEnumerable.Empty<SearchDocument>());

		SearchIndexService sut = CreateSut();

		// Act
		CancellationToken ct = TestContext.Current.CancellationToken;
		List<SearchDocument> results = await sut.SearchAsync(SearchQuery, 10, ct).ToListAsync(ct);

		// Assert
		results.Should().BeEmpty();
	}

	// ═══════════════════════════════════════════════════════════════
	// TEARDOWN
	// ═══════════════════════════════════════════════════════════════

	public void Dispose()
	{
		_mocks.VerifyAll();
	}
}

// ═══════════════════════════════════════════════════════════════
// WRAPPER INTERFACE (the pattern being demonstrated)
// This wraps a sealed client (e.g., ElasticsearchClient)
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// Wrapper interface for Elasticsearch operations.
/// Production implementation delegates to sealed ElasticsearchClient.
/// Tests use Mock&lt;IElasticClientWrapper&gt;.
/// </summary>
public interface IElasticClientWrapper
{
	Task<bool> IndexExistsAsync(string indexName, CancellationToken ct);
	Task CreateIndexAsync(string indexName, CancellationToken ct);
	Task<IndexResult> IndexDocumentAsync<T>(T document, string id, CancellationToken ct) where T : class;
	Task<bool> DeleteDocumentAsync(string id, CancellationToken ct);
	IAsyncEnumerable<T> SearchAsync<T>(string query, int limit, CancellationToken ct) where T : class;
}

// ═══════════════════════════════════════════════════════════════
// WRAPPER IMPLEMENTATION (for reference - not tested here)
// In production, this delegates to the sealed client
// ═══════════════════════════════════════════════════════════════

/*
// Example production implementation:

public sealed class ElasticClientWrapper : IElasticClientWrapper
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

    public async Task<IndexResult> IndexDocumentAsync<T>(T document, string id, CancellationToken ct) where T : class
    {
        var response = await _client.IndexAsync(document, i => i.Index(_indexName).Id(id), ct);
        return new IndexResult(response.IsSuccess(), response.Id);
    }

    public async Task<bool> DeleteDocumentAsync(string id, CancellationToken ct)
    {
        var response = await _client.DeleteAsync(_indexName, id, ct);
        return response.IsSuccess();
    }

    public async IAsyncEnumerable<T> SearchAsync<T>(string query, int limit, [EnumeratorCancellation] CancellationToken ct) where T : class
    {
        var response = await _client.SearchAsync<T>(s => s
            .Index(_indexName)
            .Query(q => q.QueryString(qs => qs.Query(query)))
            .Size(limit), ct);

        foreach (var hit in response.Hits)
        {
            yield return hit.Source!;
        }
    }
}
*/

// ═══════════════════════════════════════════════════════════════
// DOMAIN TYPES
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// Document for search indexing.
/// </summary>
public sealed record SearchDocument(string Id, string Content);

/// <summary>
/// Result of an index operation.
/// </summary>
public sealed record IndexResult(bool Success, string? Id);

// ═══════════════════════════════════════════════════════════════
// SERVICE UNDER TEST
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// Service that uses the wrapper interface.
/// This service is now fully testable via Mock&lt;IElasticClientWrapper&gt;.
/// </summary>
public sealed class SearchIndexService
{
	private const string DefaultIndexName = "documents";

	private readonly IElasticClientWrapper _elastic;
	private readonly ILogger<SearchIndexService> _logger;

	public SearchIndexService(IElasticClientWrapper elastic, ILogger<SearchIndexService> logger)
	{
		_elastic = elastic;
		_logger = logger;
	}

	public async Task EnsureIndexAsync(CancellationToken ct)
	{
		bool exists = await _elastic.IndexExistsAsync(DefaultIndexName, ct);
		if (!exists)
		{
			_logger.LogInformation("Creating index {IndexName}", DefaultIndexName);
			await _elastic.CreateIndexAsync(DefaultIndexName, ct);
		}
	}

	public async Task<IndexResult> IndexDocumentAsync(SearchDocument document, CancellationToken ct)
	{
		_logger.LogInformation("Indexing document {DocumentId}", document.Id);
		return await _elastic.IndexDocumentAsync(document, document.Id, ct);
	}

	public async Task<bool> DeleteDocumentAsync(string id, CancellationToken ct)
	{
		_logger.LogInformation("Deleting document {DocumentId}", id);
		return await _elastic.DeleteDocumentAsync(id, ct);
	}

	public IAsyncEnumerable<SearchDocument> SearchAsync(string query, int limit, CancellationToken ct)
	{
		_logger.LogInformation("Searching for {Query}", query);
		return _elastic.SearchAsync<SearchDocument>(query, limit, ct);
	}
}
