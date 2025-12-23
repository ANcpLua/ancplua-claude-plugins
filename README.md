# ancplua-claude-plugins

**Claude Code plugins for faster, safer development.**

## Plugins

| Plugin | Purpose | Trigger |
|--------|---------|---------|
| **code-review** | AI code review (bugs, security, style) | `/code-review` |
| **smart-commit** | Semantic commit messages | `/commit` |
| **autonomous-ci** | Local CI verification | *ask Claude* |
| **jules-integration** | Delegate tasks to Google Jules | `/jules <task>` |
| **testcontainers-dotnet** | .NET integration testing patterns | *skill* |
| **metacognitive-guard** | Detects Claude struggling, escalates to deep-thinking | *auto-hook* |
| **otelwiki** | OpenTelemetry docs + semconv validation | *auto-hook* |

---

## Install

```bash
cd your-project && claude
```

Inside Claude Code:

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install code-review@ancplua-claude-plugins
```

Or browse: `/plugin` → "Browse Plugins"

---

## Plugin Details

### code-review

```text
/code-review

→ HIGH: SQL injection in auth.py:45
  MEDIUM: Unused import in utils.py:3
```

### smart-commit

```text
/commit

→ feat(auth): add JWT refresh token support
  Commit? [Y/n]
```

### autonomous-ci

```text
"Will CI pass?"

→ Tests: 47 passed
  Type check: 2 errors in src/api.ts
```

### jules-integration

```text
/jules Refactor user service to use DI

→ Created Jules task. PR incoming.
```

### metacognitive-guard

Hooks into Claude's responses. When it detects uncertainty, hedging, or struggle patterns, it escalates to deep-thinking agents for better answers.

**Auto-triggers on:** Long pauses, excessive caveats, circular reasoning

### otelwiki

Bundled OpenTelemetry documentation (172 files, 32K+ lines). Auto-validates semantic conventions when you edit C# telemetry code.

**Auto-triggers on:** ActivitySource, Meter, OTLP, spans, traces, metrics

```text
/otelwiki:sync  # Update bundled docs
```

---

## Repository Structure

```text
ancplua-claude-plugins/
├── plugins/
│   ├── autonomous-ci/
│   ├── code-review/
│   ├── jules-integration/
│   ├── metacognitive-guard/
│   ├── otelwiki/
│   ├── smart-commit/
│   └── testcontainers-dotnet/
├── docs/
└── tooling/
```

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Rules for Claude |
| `CHANGELOG.md` | Version history |
| `.claude-plugin/marketplace.json` | Plugin registry |

---

## Architecture

**Type A (Application)** - Orchestration logic only.

Consumes tools from **Type T (Technology)** repos like `ancplua-mcp`.

**Rule:** No MCP implementations here. Plugins, skills, hooks only.

---

## AI Review

PRs reviewed by 5 AI agents:

| Agent | Fix PRs |
|-------|---------|
| Claude | Yes |
| Jules | Yes |
| Copilot | Yes |
| Gemini | No |
| CodeRabbit | No |

---

## Docs

- [Plugins](https://docs.anthropic.com/en/docs/claude-code/plugins)
- [Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)

---

## License

[MIT](LICENSE)
