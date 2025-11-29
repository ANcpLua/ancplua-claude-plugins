// ═══════════════════════════════════════════════════════════════
// TESTING FRAMEWORK
// ═══════════════════════════════════════════════════════════════

global using Xunit;
global using Xunit.v3;  // For TheoryDataRow, AssemblyFixture, CaptureConsole, etc.

// ═══════════════════════════════════════════════════════════════
// ASSERTIONS - AwesomeAssertions (Apache 2.0 fork of FluentAssertions)
// FluentAssertions 8.x requires COMMERCIAL LICENSE
// ═══════════════════════════════════════════════════════════════

global using AwesomeAssertions;

// ═══════════════════════════════════════════════════════════════
// MOCKING
// ═══════════════════════════════════════════════════════════════

global using Moq;

// ═══════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════

global using Microsoft.Extensions.Logging;
global using Microsoft.Extensions.Logging.Testing;  // FakeLogger, FakeLogCollector

// ═══════════════════════════════════════════════════════════════
// SYSTEM
// ═══════════════════════════════════════════════════════════════

global using System.Net;  // HttpStatusCode

// ═══════════════════════════════════════════════════════════════
// TESTCONTAINERS
// ═══════════════════════════════════════════════════════════════

global using Testcontainers.PostgreSql;
global using Npgsql;

// ═══════════════════════════════════════════════════════════════
// FILE SYSTEM MOCKING
// IMPORTANT: Testably.Abstractions 10.0.0 + Testing 5.0.0 (NOT 10.0.0!)
// ═══════════════════════════════════════════════════════════════

global using Testably.Abstractions;
global using Testably.Abstractions.Testing;

// ═══════════════════════════════════════════════════════════════
// ASSEMBLY ATTRIBUTES (xUnit v3)
// ═══════════════════════════════════════════════════════════════

// Uncomment when using AssemblyFixture:
// [assembly: AssemblyFixture(typeof(SharedContainerFixture))]

// Capture console output and trace for debugging:
[assembly: CaptureConsole]
[assembly: CaptureTrace]
