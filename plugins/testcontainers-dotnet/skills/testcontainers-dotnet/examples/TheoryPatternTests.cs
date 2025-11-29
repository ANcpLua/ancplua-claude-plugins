using Xunit.v3;

namespace Examples;

/// <summary>
/// Demonstrates Theory patterns for branch coverage in xUnit v3.
/// Theory tests run the same test logic with different inputs.
/// </summary>
public sealed class TheoryPatternTests
{
	// ═══════════════════════════════════════════════════════════════
	// CONSTANTS
	// ═══════════════════════════════════════════════════════════════

	private const int MinPasswordLength = 8;
	private const int MaxPasswordLength = 128;

	// ═══════════════════════════════════════════════════════════════
	// PATTERN 1: InlineData - Simple inline values
	// ═══════════════════════════════════════════════════════════════

	[Theory]
	[InlineData("", false)] // Empty
	[InlineData("short", false)] // Too short
	[InlineData("ValidP@ss1", true)] // Valid
	[InlineData("NoSpecialChar1", false)] // Missing special char
	[InlineData("nouppercase1!", false)] // Missing uppercase
	[InlineData("NOLOWERCASE1!", false)] // Missing lowercase
	[InlineData("NoNumber!!", false)] // Missing number
	public void IsValidPassword_VariousInputs_ReturnsExpected(string password, bool expected)
	{
		// Arrange
		PasswordValidator validator = new();

		// Act
		bool result = validator.IsValid(password);

		// Assert
		result.Should().Be(expected, $"password '{password}' should be {(expected ? "valid" : "invalid")}");
	}

	// ═══════════════════════════════════════════════════════════════
	// PATTERN 2: MemberData - Complex data from method
	// ═══════════════════════════════════════════════════════════════

	public static IEnumerable<TheoryDataRow<HttpStatusCode, string, LogLevel>> StatusCodeCases()
	{
		// 2xx - Success (no logging)
		yield return new TheoryDataRow<HttpStatusCode, string, LogLevel>(
				HttpStatusCode.OK, "success", LogLevel.Information)
			.WithTestDisplayName("200 OK");

		yield return new TheoryDataRow<HttpStatusCode, string, LogLevel>(
				HttpStatusCode.Created, "created", LogLevel.Information)
			.WithTestDisplayName("201 Created");

		// 4xx - Client errors (warning)
		yield return new TheoryDataRow<HttpStatusCode, string, LogLevel>(
				HttpStatusCode.BadRequest, "bad_request", LogLevel.Warning)
			.WithTestDisplayName("400 BadRequest");

		yield return new TheoryDataRow<HttpStatusCode, string, LogLevel>(
				HttpStatusCode.NotFound, "not_found", LogLevel.Information)
			.WithTestDisplayName("404 NotFound");

		yield return new TheoryDataRow<HttpStatusCode, string, LogLevel>(
				HttpStatusCode.Forbidden, "forbidden", LogLevel.Warning)
			.WithTestDisplayName("403 Forbidden");

		// 5xx - Server errors (error)
		yield return new TheoryDataRow<HttpStatusCode, string, LogLevel>(
				HttpStatusCode.InternalServerError, "internal_error", LogLevel.Error)
			.WithTestDisplayName("500 InternalServerError");

		yield return new TheoryDataRow<HttpStatusCode, string, LogLevel>(
				HttpStatusCode.GatewayTimeout, "timeout", LogLevel.Error)
			.WithTestDisplayName("504 GatewayTimeout");
	}

	[Theory]
	[MemberData(nameof(StatusCodeCases))]
	public void MapStatusCode_VariousCodes_ReturnsExpectedMapping(
		HttpStatusCode statusCode, string expectedCode, LogLevel expectedLevel)
	{
		// Arrange
		StatusCodeMapper mapper = new();

		// Act
		(string code, LogLevel level) = mapper.Map(statusCode);

		// Assert
		code.Should().Be(expectedCode);
		level.Should().Be(expectedLevel);
	}

	// ═══════════════════════════════════════════════════════════════
	// PATTERN 3: Exception Type Testing
	// ═══════════════════════════════════════════════════════════════

	public static IEnumerable<TheoryDataRow<Type, int, string>> ExceptionMappingCases()
	{
		// 400 Bad Request
		yield return new TheoryDataRow<Type, int, string>(
				typeof(ArgumentNullException), 400, "bad_request")
			.WithTestDisplayName("ArgumentNull -> 400");

		yield return new TheoryDataRow<Type, int, string>(
				typeof(ArgumentException), 400, "bad_request")
			.WithTestDisplayName("Argument -> 400");

		yield return new TheoryDataRow<Type, int, string>(
				typeof(InvalidOperationException), 400, "bad_request")
			.WithTestDisplayName("InvalidOperation -> 400");

		// 404 Not Found
		yield return new TheoryDataRow<Type, int, string>(
				typeof(KeyNotFoundException), 404, "not_found")
			.WithTestDisplayName("KeyNotFound -> 404");

		yield return new TheoryDataRow<Type, int, string>(
				typeof(FileNotFoundException), 404, "not_found")
			.WithTestDisplayName("FileNotFound -> 404");

		// 403 Forbidden
		yield return new TheoryDataRow<Type, int, string>(
				typeof(UnauthorizedAccessException), 403, "forbidden")
			.WithTestDisplayName("UnauthorizedAccess -> 403");

		// 504 Timeout
		yield return new TheoryDataRow<Type, int, string>(
				typeof(TimeoutException), 504, "timeout")
			.WithTestDisplayName("Timeout -> 504");

		// 500 Internal Server Error (fallback)
		yield return new TheoryDataRow<Type, int, string>(
				typeof(Exception), 500, "internal_error")
			.WithTestDisplayName("Exception -> 500");
	}

	[Theory]
	[MemberData(nameof(ExceptionMappingCases))]
	public void MapException_VariousExceptions_ReturnsExpectedStatusAndCode(
		Type exceptionType, int expectedStatus, string expectedCode)
	{
		// Arrange
		Exception exception = (Exception)Activator.CreateInstance(exceptionType, "Test message")!;
		ExceptionMapper mapper = new();

		// Act
		(int status, string code) = mapper.Map(exception);

		// Assert
		status.Should().Be(expectedStatus);
		code.Should().Be(expectedCode);
	}

	// ═══════════════════════════════════════════════════════════════
	// PATTERN 4: ClassData - Reusable test data class
	// ═══════════════════════════════════════════════════════════════

	[Theory]
	[ClassData(typeof(EmailValidationTestData))]
	public void IsValidEmail_VariousInputs_ReturnsExpected(string email, bool expected)
	{
		// Arrange
		EmailValidator validator = new();

		// Act
		bool result = validator.IsValid(email);

		// Assert
		result.Should().Be(expected);
	}

	// ═══════════════════════════════════════════════════════════════
	// PATTERN 5: Enum Exhaustive Testing
	// ═══════════════════════════════════════════════════════════════

	[Theory]
	[InlineData(DocumentStatus.Pending, "Pending processing")]
	[InlineData(DocumentStatus.Processing, "Currently processing")]
	[InlineData(DocumentStatus.Completed, "Processing complete")]
	[InlineData(DocumentStatus.Failed, "Processing failed")]
	public void GetStatusDescription_AllStatuses_ReturnsDescription(
		DocumentStatus status, string expectedDescription)
	{
		// Arrange
		StatusDescriber describer = new();

		// Act
		string description = describer.GetDescription(status);

		// Assert
		description.Should().Be(expectedDescription);
	}

	// Ensure all enum values are tested
	[Fact]
	public void GetStatusDescription_AllEnumValuesCovered()
	{
		// This test ensures we haven't forgotten any enum values
		DocumentStatus[] allStatuses = Enum.GetValues<DocumentStatus>();
		StatusDescriber describer = new();

		// Assert all enum values produce a non-null, non-empty description
		allStatuses.All(status => !string.IsNullOrEmpty(describer.GetDescription(status))).Should().BeTrue();
	}

	// ═══════════════════════════════════════════════════════════════
	// PATTERN 6: Boundary Testing
	// ═══════════════════════════════════════════════════════════════

	[Theory]
	[InlineData(0, false)] // Below minimum
	[InlineData(7, false)] // One below minimum
	[InlineData(8, true)] // At minimum (boundary)
	[InlineData(9, true)] // One above minimum
	[InlineData(64, true)] // Middle of range
	[InlineData(127, true)] // One below maximum
	[InlineData(128, true)] // At maximum (boundary)
	[InlineData(129, false)] // One above maximum
	[InlineData(256, false)] // Way above maximum
	public void IsValidLength_BoundaryValues_ReturnsExpected(int length, bool expected)
	{
		// Arrange
		LengthValidator validator = new(MinPasswordLength, MaxPasswordLength);

		// Act
		bool result = validator.IsValid(length);

		// Assert
		result.Should().Be(expected);
	}
}

// ═══════════════════════════════════════════════════════════════
// TEST DATA CLASS (for ClassData pattern)
// ═══════════════════════════════════════════════════════════════

public sealed class EmailValidationTestData : TheoryData<string, bool>
{
	public EmailValidationTestData()
	{
		// Valid emails
		Add("user@example.com", true);
		Add("user.name@example.com", true);
		Add("user+tag@example.com", true);

		// Invalid emails
		Add("", false);
		Add("not-an-email", false);
		Add("@example.com", false);
		Add("user@", false);
		Add("user@.com", false);
	}
}

// ═══════════════════════════════════════════════════════════════
// DOMAIN TYPES
// ═══════════════════════════════════════════════════════════════

public enum DocumentStatus
{
	Pending,
	Processing,
	Completed,
	Failed
}

// ═══════════════════════════════════════════════════════════════
// SERVICES UNDER TEST
// ═══════════════════════════════════════════════════════════════

public sealed class PasswordValidator
{
	private const int MinPasswordLength = 8;

	public bool IsValid(string password)
	{
		if (string.IsNullOrEmpty(password) || password.Length < MinPasswordLength)
			return false;

		bool hasUpper = password.Any(char.IsUpper);
		bool hasLower = password.Any(char.IsLower);
		bool hasDigit = password.Any(char.IsDigit);
		bool hasSpecial = password.Any(c => !char.IsLetterOrDigit(c));

		return hasUpper && hasLower && hasDigit && hasSpecial;
	}
}

public sealed class StatusCodeMapper
{
	public (string Code, LogLevel Level) Map(HttpStatusCode statusCode)
	{
		return statusCode switch
		{
			HttpStatusCode.OK => ("success", LogLevel.Information),
			HttpStatusCode.Created => ("created", LogLevel.Information),
			HttpStatusCode.BadRequest => ("bad_request", LogLevel.Warning),
			HttpStatusCode.NotFound => ("not_found", LogLevel.Information),
			HttpStatusCode.Forbidden => ("forbidden", LogLevel.Warning),
			HttpStatusCode.InternalServerError => ("internal_error", LogLevel.Error),
			HttpStatusCode.GatewayTimeout => ("timeout", LogLevel.Error),
			_ => ("unknown", LogLevel.Warning)
		};
	}
}

public sealed class ExceptionMapper
{
	public (int Status, string Code) Map(Exception exception)
	{
		return exception switch
		{
			ArgumentNullException => (400, "bad_request"),
			ArgumentException => (400, "bad_request"),
			InvalidOperationException => (400, "bad_request"),
			KeyNotFoundException => (404, "not_found"),
			FileNotFoundException => (404, "not_found"),
			UnauthorizedAccessException => (403, "forbidden"),
			TimeoutException => (504, "timeout"),
			_ => (500, "internal_error")
		};
	}
}

public sealed class EmailValidator
{
	public bool IsValid(string email)
	{
		if (string.IsNullOrWhiteSpace(email))
			return false;

		int atIndex = email.IndexOf('@');
		if (atIndex <= 0 || atIndex == email.Length - 1)
			return false;

		int dotIndex = email.LastIndexOf('.');
		return dotIndex > atIndex + 1 && dotIndex < email.Length - 1;
	}
}

public sealed class StatusDescriber
{
	public string GetDescription(DocumentStatus status)
	{
		return status switch
		{
			DocumentStatus.Pending => "Pending processing",
			DocumentStatus.Processing => "Currently processing",
			DocumentStatus.Completed => "Processing complete",
			DocumentStatus.Failed => "Processing failed",
			_ => throw new ArgumentOutOfRangeException(nameof(status))
		};
	}
}

public sealed class LengthValidator
{
	private readonly int _min;
	private readonly int _max;

	public LengthValidator(int min, int max)
	{
		_min = min;
		_max = max;
	}

	public bool IsValid(int length) => length >= _min && length <= _max;
}
