namespace Examples;

/// <summary>
/// Demonstrates the Handler Extraction pattern from SKILL.md.
/// This pattern makes BackgroundServices testable by extracting business logic
/// into a separate handler class with explicit dependencies.
/// </summary>
public sealed class HandlerExtractionTests : IDisposable
{
	// ═══════════════════════════════════════════════════════════════
	// CONSTANTS
	// ═══════════════════════════════════════════════════════════════

	private const string CompletedStatus = "Completed";
	private const string FailedStatus = "Failed";
	private const string ExtractedContent = "Extracted text from document";

	// ═══════════════════════════════════════════════════════════════
	// CONSTRUCTION
	// ═══════════════════════════════════════════════════════════════

	private readonly MockRepository _mocks = new(MockBehavior.Strict)
	{
		DefaultValue = DefaultValue.Empty
	};

	private readonly Mock<IDocumentService> _documentService;
	private readonly Mock<ISseStream<OcrEvent>> _sseStream;
	private readonly FakeLogCollector _logCollector;
	private readonly FakeLogger<OcrEventHandler> _logger;

	public HandlerExtractionTests()
	{
		_documentService = _mocks.Create<IDocumentService>();
		_sseStream = _mocks.Create<ISseStream<OcrEvent>>();
		_logCollector = new FakeLogCollector();
		_logger = new FakeLogger<OcrEventHandler>(_logCollector);
	}

	// ═══════════════════════════════════════════════════════════════
	// SUT FACTORY
	// ═══════════════════════════════════════════════════════════════

	private OcrEventHandler CreateSut() => new(
		_documentService.Object,
		_sseStream.Object,
		_logger
	);

	// ═══════════════════════════════════════════════════════════════
	// TEST DATA FACTORY
	// ═══════════════════════════════════════════════════════════════

	private static OcrEvent CreateEvent(
		Guid? jobId = null,
		string status = CompletedStatus,
		string? content = ExtractedContent) =>
		new(jobId ?? Guid.CreateVersion7(), status, content, DateTimeOffset.UtcNow);

	// ═══════════════════════════════════════════════════════════════
	// TESTS: HandleAsync - Success Path
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task HandleAsync_WhenProcessingSucceeds_PublishesAndReturnsSuccess()
	{
		// Arrange
		OcrEvent evt = CreateEvent();

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				evt.JobId, CompletedStatus, ExtractedContent, It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		_sseStream.Setup(s => s.Publish(evt));

		OcrEventHandler sut = CreateSut();

		// Act
		HandlerResult result = await sut.HandleAsync(evt, CancellationToken.None);

		// Assert
		result.Should().Be(HandlerResult.Success);
	}

	[Fact]
	public async Task HandleAsync_WhenProcessingSucceeds_PublishesToSseStream()
	{
		// Arrange
		OcrEvent evt = CreateEvent();
		OcrEvent? publishedEvent = null;

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		_sseStream
			.Setup(s => s.Publish(It.IsAny<OcrEvent>()))
			.Callback<OcrEvent>(e => publishedEvent = e);

		OcrEventHandler sut = CreateSut();

		// Act
		await sut.HandleAsync(evt, CancellationToken.None);

		// Assert
		publishedEvent.Should().NotBeNull();
		publishedEvent!.JobId.Should().Be(evt.JobId);
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: HandleAsync - Not Found Path
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task HandleAsync_WhenDocumentNotFound_ReturnsNotFound()
	{
		// Arrange
		OcrEvent evt = CreateEvent();

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		OcrEventHandler sut = CreateSut();

		// Act
		HandlerResult result = await sut.HandleAsync(evt, CancellationToken.None);

		// Assert
		result.Should().Be(HandlerResult.NotFound);
	}

	[Fact]
	public async Task HandleAsync_WhenDocumentNotFound_DoesNotPublish()
	{
		// Arrange
		OcrEvent evt = CreateEvent();

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		OcrEventHandler sut = CreateSut();

		// Act
		await sut.HandleAsync(evt, CancellationToken.None);

		// Assert - verify Publish was never called
		_sseStream.Verify(s => s.Publish(It.IsAny<OcrEvent>()), Times.Never);
	}

	[Fact]
	public async Task HandleAsync_WhenDocumentNotFound_LogsWarning()
	{
		// Arrange
		OcrEvent evt = CreateEvent();

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		OcrEventHandler sut = CreateSut();

		// Act
		await sut.HandleAsync(evt, CancellationToken.None);

		// Assert
		_logCollector.GetSnapshot()
			.Should().Contain(log =>
				log.Level == LogLevel.Warning &&
				log.Message.Contains("not found"));
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: HandleAsync - Exception Path
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task HandleAsync_WhenExceptionThrown_ReturnsFailed()
	{
		// Arrange
		OcrEvent evt = CreateEvent();

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(new InvalidOperationException("Database connection failed"));

		OcrEventHandler sut = CreateSut();

		// Act
		HandlerResult result = await sut.HandleAsync(evt, CancellationToken.None);

		// Assert
		result.Should().Be(HandlerResult.Failed);
	}

	[Fact]
	public async Task HandleAsync_WhenExceptionThrown_LogsError()
	{
		// Arrange
		OcrEvent evt = CreateEvent();
		InvalidOperationException exception = new("Database connection failed");

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(exception);

		OcrEventHandler sut = CreateSut();

		// Act
		await sut.HandleAsync(evt, CancellationToken.None);

		// Assert
		_logCollector.GetSnapshot()
			.Should().Contain(log =>
				log.Level == LogLevel.Error &&
				log.Message.Contains(evt.JobId.ToString()));
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: HandleAsync - Edge Cases
	// ═══════════════════════════════════════════════════════════════

	[Theory]
	[InlineData(null)]
	[InlineData("")]
	public async Task HandleAsync_WhenContentNullOrEmpty_StillProcesses(string? content)
	{
		// Arrange
		OcrEvent evt = CreateEvent(content: content);

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				evt.JobId, CompletedStatus, content, It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		_sseStream.Setup(s => s.Publish(evt));

		OcrEventHandler sut = CreateSut();

		// Act
		HandlerResult result = await sut.HandleAsync(evt, CancellationToken.None);

		// Assert
		result.Should().Be(HandlerResult.Success);
	}

	[Fact]
	public async Task HandleAsync_WhenCancellationRequested_PassesCancellationToken()
	{
		// Arrange
		using CancellationTokenSource cts = new();
		CancellationToken receivedToken = default;
		OcrEvent evt = CreateEvent();

		_documentService
			.Setup(s => s.ProcessOcrResultAsync(
				It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
			.Callback<Guid, string, string?, CancellationToken>((_, _, _, ct) => receivedToken = ct)
			.ReturnsAsync(true);

		_sseStream.Setup(s => s.Publish(evt));

		OcrEventHandler sut = CreateSut();

		// Act
		await sut.HandleAsync(evt, cts.Token);

		// Assert
		receivedToken.Should().Be(cts.Token);
	}

	// ═══════════════════════════════════════════════════════════════
	// TEARDOWN
	// ═══════════════════════════════════════════════════════════════

	public void Dispose()
	{
		_mocks.VerifyAll();
		// Note: VerifyNoOtherCalls() intentionally omitted here because some tests
		// use Times.Never verification which would conflict
	}
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED HANDLER (the pattern being demonstrated)
// This is what makes BackgroundServices testable
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// Extracted handler for OCR event processing.
/// Takes explicit dependencies (no IServiceScopeFactory).
/// Returns a result enum for the caller to decide what to do.
/// </summary>
public sealed class OcrEventHandler
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

/// <summary>
/// Result enum allows caller to decide how to respond.
/// </summary>
public enum HandlerResult
{
	Success,
	NotFound,
	Failed
}

// ═══════════════════════════════════════════════════════════════
// DEPENDENCIES (interfaces for mocking)
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// Event data for OCR processing.
/// </summary>
public sealed record OcrEvent(
	Guid JobId,
	string Status,
	string? Content,
	DateTimeOffset Timestamp);

/// <summary>
/// Document service interface.
/// </summary>
public interface IDocumentService
{
	Task<bool> ProcessOcrResultAsync(
		Guid jobId,
		string status,
		string? content,
		CancellationToken ct);
}

/// <summary>
/// Server-Sent Events stream for real-time notifications.
/// </summary>
public interface ISseStream<T>
{
	void Publish(T message);
}
