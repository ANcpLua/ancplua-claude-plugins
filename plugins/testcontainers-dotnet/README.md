# testcontainers-dotnet

.NET integration testing patterns with Testcontainers, xUnit v3, and Moq.

## Install

```bash
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install testcontainers-dotnet
```

## Contents

- Package compatibility matrix (.NET 8/9/10)
- Container fixtures (IAsyncLifetime, ClassFixture, AssemblyFixture)
- MockRepository patterns
- Sealed client wrappers
- Handler extraction for BackgroundServices
- FakeLogger usage

## Versions

| Package | Version |
|---------|---------|
| xUnit v3 | 3.2.1 |
| Testcontainers | 4.9.0 |
| AwesomeAssertions | 9.3.0 |

See [SKILL.md](skills/testcontainers-dotnet/SKILL.md) for full documentation.
