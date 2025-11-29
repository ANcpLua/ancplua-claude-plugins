namespace Examples;

/// <summary>
/// Demonstrates FakeLogger and FakeLogCollector from Microsoft.Extensions.Diagnostics.Testing.
/// Use this pattern when you need to verify logging behavior in unit tests.
/// </summary>
public sealed class FakeLogCollectorTests : IDisposable
{
	// ═══════════════════════════════════════════════════════════════
	// CONSTANTS
	// ═══════════════════════════════════════════════════════════════

	private const string ValidOrderId = "ORD-12345";
	private const string ValidCustomerId = "CUST-001";
	private const decimal ValidOrderTotal = 99.99m;

	// ═══════════════════════════════════════════════════════════════
	// CONSTRUCTION
	// ═══════════════════════════════════════════════════════════════

	private readonly MockRepository _mocks = new(MockBehavior.Strict)
	{
		DefaultValue = DefaultValue.Empty
	};

	private readonly Mock<IOrderRepository> _orderRepository;
	private readonly Mock<IPaymentGateway> _paymentGateway;

	// FakeLogCollector captures log entries for assertions
	private readonly FakeLogCollector _logCollector;
	private readonly FakeLogger<OrderProcessor> _logger;

	public FakeLogCollectorTests()
	{
		_orderRepository = _mocks.Create<IOrderRepository>();
		_paymentGateway = _mocks.Create<IPaymentGateway>();

		// FakeLogCollector is the key - it stores all log entries
		_logCollector = new FakeLogCollector();
		_logger = new FakeLogger<OrderProcessor>(_logCollector);
	}

	// ═══════════════════════════════════════════════════════════════
	// SUT FACTORY
	// ═══════════════════════════════════════════════════════════════

	private OrderProcessor CreateSut() => new(
		_orderRepository.Object,
		_paymentGateway.Object,
		_logger
	);

	// ═══════════════════════════════════════════════════════════════
	// TESTS: Logging Information
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task ProcessOrderAsync_ValidOrder_LogsInformationOnStart()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		SetupSuccessfulPayment(order);

		OrderProcessor sut = CreateSut();

		// Act
		await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert - check that Information level log was emitted
		_logCollector.GetSnapshot()
			.Should().Contain(log =>
				log.Level == LogLevel.Information &&
				log.Message.Contains("Processing order") &&
				log.Message.Contains(ValidOrderId));
	}

	[Fact]
	public async Task ProcessOrderAsync_ValidOrder_LogsOrderTotal()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		SetupSuccessfulPayment(order);

		OrderProcessor sut = CreateSut();

		// Act
		await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert - verify the order total was logged
		_logCollector.GetSnapshot()
			.Should().Contain(log =>
				log.Message.Contains(ValidOrderTotal.ToString()));
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: Logging Warnings
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task ProcessOrderAsync_PaymentFailed_LogsWarning()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		SetupFailedPayment(order);

		OrderProcessor sut = CreateSut();

		// Act
		ProcessingResult result = await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert
		result.Success.Should().BeFalse();
		_logCollector.GetSnapshot()
			.Should().Contain(log =>
				log.Level == LogLevel.Warning &&
				log.Message.Contains("Payment failed"));
	}

	[Fact]
	public async Task ProcessOrderAsync_LowInventory_LogsWarning()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal, LowInventory: true);
		SetupSuccessfulPayment(order);

		OrderProcessor sut = CreateSut();

		// Act
		await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert
		_logCollector.GetSnapshot()
			.Should().Contain(log =>
				log.Level == LogLevel.Warning &&
				log.Message.Contains("low inventory"));
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: Logging Errors
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task ProcessOrderAsync_RepositoryThrows_LogsError()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		InvalidOperationException exception = new("Database unavailable");

		// Payment must succeed first, then repository throws
		_paymentGateway
			.Setup(p => p.ProcessPaymentAsync(order.CustomerId, order.Total, It.IsAny<CancellationToken>()))
			.ReturnsAsync(new PaymentResult(true, $"PAY-{order.Id}"));

		_orderRepository
			.Setup(r => r.SaveAsync(order, It.IsAny<CancellationToken>()))
			.ThrowsAsync(exception);

		OrderProcessor sut = CreateSut();

		// Act
		ProcessingResult result = await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert
		result.Success.Should().BeFalse();
		_logCollector.GetSnapshot()
			.Should().Contain(log =>
				log.Level == LogLevel.Error &&
				log.Message.Contains("Failed to process order"));
	}

	[Fact]
	public async Task ProcessOrderAsync_ExceptionThrown_LogsExceptionDetails()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		InvalidOperationException exception = new("Database unavailable");

		// Payment must succeed first, then repository throws
		_paymentGateway
			.Setup(p => p.ProcessPaymentAsync(order.CustomerId, order.Total, It.IsAny<CancellationToken>()))
			.ReturnsAsync(new PaymentResult(true, $"PAY-{order.Id}"));

		_orderRepository
			.Setup(r => r.SaveAsync(order, It.IsAny<CancellationToken>()))
			.ThrowsAsync(exception);

		OrderProcessor sut = CreateSut();

		// Act
		await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert - check that the exception was captured
		_logCollector.GetSnapshot()
			.Should().Contain(log =>
				log.Level == LogLevel.Error &&
				log.Exception != null &&
				log.Exception.Message.Contains("Database unavailable"));
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: Log Entry Count
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task ProcessOrderAsync_Success_EmitsExpectedLogCount()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		SetupSuccessfulPayment(order);

		OrderProcessor sut = CreateSut();

		// Act
		await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert - expect exactly 2 information logs (start + complete)
		_logCollector.GetSnapshot()
			.Count(log => log.Level == LogLevel.Information)
			.Should().Be(2);
	}

	[Fact]
	public async Task ProcessOrderAsync_Success_NoErrorsLogged()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		SetupSuccessfulPayment(order);

		OrderProcessor sut = CreateSut();

		// Act
		await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert - no errors or warnings
		_logCollector.GetSnapshot()
			.Should().NotContain(log => log.Level >= LogLevel.Warning);
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: Structured Logging Parameters
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task ProcessOrderAsync_ValidOrder_LogsStructuredParameters()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		SetupSuccessfulPayment(order);

		OrderProcessor sut = CreateSut();

		// Act
		await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Assert - verify structured logging captures parameters
		IReadOnlyList<FakeLogRecord> logs = _logCollector.GetSnapshot();

		// Find the "Processing order" log entry
		FakeLogRecord? processingLog = logs.FirstOrDefault(l =>
			l.Message.Contains("Processing order"));

		processingLog.Should().NotBeNull();
		// The OrderId should be captured in the log
		processingLog!.Message.Should().Contain(ValidOrderId);
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: Log Filtering
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task ProcessOrderAsync_MultipleOperations_CanFilterByLevel()
	{
		// Arrange
		Order order1 = new("ORD-1", ValidCustomerId, 50.00m);
		Order order2 = new("ORD-2", ValidCustomerId, 75.00m, LowInventory: true);

		SetupSuccessfulPayment(order1);
		SetupSuccessfulPayment(order2);

		OrderProcessor sut = CreateSut();

		// Act
		await sut.ProcessOrderAsync(order1, CancellationToken.None);
		await sut.ProcessOrderAsync(order2, CancellationToken.None);

		// Assert - filter only warnings
		IReadOnlyList<FakeLogRecord> warnings = _logCollector.GetSnapshot()
			.Where(log => log.Level == LogLevel.Warning)
			.ToList();

		warnings.Should().HaveCount(1);
		warnings[0].Message.Should().Contain("low inventory");
	}

	// ═══════════════════════════════════════════════════════════════
	// TESTS: Clear and Snapshot
	// ═══════════════════════════════════════════════════════════════

	[Fact]
	public async Task FakeLogCollector_Clear_ResetsLogs()
	{
		// Arrange
		Order order = new(ValidOrderId, ValidCustomerId, ValidOrderTotal);
		SetupSuccessfulPayment(order);

		OrderProcessor sut = CreateSut();
		await sut.ProcessOrderAsync(order, CancellationToken.None);

		// Verify logs exist
		_logCollector.GetSnapshot().Should().NotBeEmpty();

		// Act - clear the collector
		_logCollector.Clear();

		// Assert - logs are cleared
		_logCollector.GetSnapshot().Should().BeEmpty();
	}

	// ═══════════════════════════════════════════════════════════════
	// HELPER METHODS
	// ═══════════════════════════════════════════════════════════════

	private void SetupSuccessfulPayment(Order order)
	{
		_paymentGateway
			.Setup(p => p.ProcessPaymentAsync(order.CustomerId, order.Total, It.IsAny<CancellationToken>()))
			.ReturnsAsync(new PaymentResult(true, $"PAY-{order.Id}"));

		_orderRepository
			.Setup(r => r.SaveAsync(order, It.IsAny<CancellationToken>()))
			.Returns(Task.CompletedTask);
	}

	private void SetupFailedPayment(Order order)
	{
		_paymentGateway
			.Setup(p => p.ProcessPaymentAsync(order.CustomerId, order.Total, It.IsAny<CancellationToken>()))
			.ReturnsAsync(new PaymentResult(false, null));
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
// DOMAIN TYPES
// ═══════════════════════════════════════════════════════════════

public sealed record Order(
	string Id,
	string CustomerId,
	decimal Total,
	bool LowInventory = false);

public sealed record PaymentResult(bool Success, string? TransactionId);

public sealed record ProcessingResult(bool Success, string? TransactionId, string? Error);

// ═══════════════════════════════════════════════════════════════
// DEPENDENCIES
// ═══════════════════════════════════════════════════════════════

public interface IOrderRepository
{
	Task SaveAsync(Order order, CancellationToken ct);
}

public interface IPaymentGateway
{
	Task<PaymentResult> ProcessPaymentAsync(string customerId, decimal amount, CancellationToken ct);
}

// ═══════════════════════════════════════════════════════════════
// SERVICE UNDER TEST
// ═══════════════════════════════════════════════════════════════

/// <summary>
/// Order processor that demonstrates various logging scenarios.
/// </summary>
public sealed class OrderProcessor
{
	private readonly IOrderRepository _repository;
	private readonly IPaymentGateway _paymentGateway;
	private readonly ILogger<OrderProcessor> _logger;

	public OrderProcessor(
		IOrderRepository repository,
		IPaymentGateway paymentGateway,
		ILogger<OrderProcessor> logger)
	{
		_repository = repository;
		_paymentGateway = paymentGateway;
		_logger = logger;
	}

	public async Task<ProcessingResult> ProcessOrderAsync(Order order, CancellationToken ct)
	{
		_logger.LogInformation("Processing order {OrderId} for customer {CustomerId}, total: {Total}",
			order.Id, order.CustomerId, order.Total);

		try
		{
			// Check inventory warning
			if (order.LowInventory)
			{
				_logger.LogWarning("Order {OrderId} has low inventory items", order.Id);
			}

			// Process payment
			PaymentResult paymentResult = await _paymentGateway.ProcessPaymentAsync(
				order.CustomerId, order.Total, ct);

			if (!paymentResult.Success)
			{
				_logger.LogWarning("Payment failed for order {OrderId}", order.Id);
				return new ProcessingResult(false, null, "Payment failed");
			}

			// Save order
			await _repository.SaveAsync(order, ct);

			_logger.LogInformation("Order {OrderId} processed successfully with transaction {TransactionId}",
				order.Id, paymentResult.TransactionId);

			return new ProcessingResult(true, paymentResult.TransactionId, null);
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, "Failed to process order {OrderId}", order.Id);
			return new ProcessingResult(false, null, ex.Message);
		}
	}
}
