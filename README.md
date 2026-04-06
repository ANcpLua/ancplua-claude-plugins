# ancplua-claude-plugins

Claude Code plugin marketplace. 13 plugins for parallel agent orchestration,
quality gates, and automated enforcement in Claude Code sessions.

## What this does

Spawns up to 12 parallel subagents for audits, fixes, and reviews. Each phase
is gated — work only advances when the gate passes. No manual babysitting.

## Plugins

| Plugin                       | What it does in plain language                                                                                                                                              |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **exodia**                   | Summons up to 12 AI workers that tackle different parts of your code simultaneously. One finds problems, another fixes them, another reviews the fix — all at the same time |
| **metacognitive-guard**      | Watches the AI while it works. If it's about to cut corners, guess instead of verify, or say "done" when it isn't — this blocks it before the mistake happens               |
| **feature-dev**              | A guided process for building new things: understand what exists, design the plan, build it, review it. No skipping steps                                                   |
| **hookify**                  | Custom tripwires you set up. "Never do X" or "Always check Y before Z." The AI physically cannot proceed if it violates your rules                                          |
| **otelwiki**                 | Built-in reference for OpenTelemetry monitoring standards so the AI writes correct telemetry code instead of guessing                                                       |
| **dotnet-architecture-lint** | Enforces .NET project structure rules automatically — catches version mismatches and structural violations before they ship                                                 |
| **council**                  | Five-agent council for complex tasks. Opus captain decomposes and dispatches, three Sonnet specialists research/synthesize/check, Haiku janitor flags bloat                 |
| **design-studio**            | Design intelligence helpers for visual direction, UX patterns, and design-system generation                                                                                 |
| **elegance-pipeline**        | Multi-agent pipeline that scores code elegance and optionally refactors the weakest files through gated stages                                                              |
| **code-simplifier**          | Simplifies implementations while preserving behavior — measures elegance as problem-complexity / solution-complexity                                                        |
| **qyl-instrumentation**      | Observability orchestration for OpenTelemetry instrumentation across the qyl platform                                                                                       |
| **qyl-continuation**         | Smart continuation heuristic that reduces unnecessary model calls while preserving quality checks                                                                           |

### How does this work without failing?

Every step is a gate. Work only moves forward if the gate says PROCEED.
If it says HALT — the work stops, gets diagnosed, and gets fixed before
anything else continues. No hoping. No skipping. No "it probably works."

## Install

Add the marketplace, then install plugins individually:

```bash
# Add the marketplace
/plugin marketplace add ANcpLua/ancplua-claude-plugins

# Install plugins you want
/plugin install exodia@ancplua-claude-plugins
/plugin install metacognitive-guard@ancplua-claude-plugins
/plugin install hookify@ancplua-claude-plugins
```

## Technical details

13 plugins, 28 commands, 6 skills, 25 agents.

Tri-AI review system: Claude, Copilot, and CodeRabbit review PRs independently.

## GitHub review automation

Codex review lives in `.github/workflows/codex-code-review.yml`.

- Set the `OPENAI_API_KEY` repository secret to enable the workflow
- Codex runs in a `read-only` sandbox with `drop-sudo`
- The workflow posts a formal PR review from structured Codex output
- Self-review is blocked when a PR only changes Codex review automation files

```text
plugins/
├── exodia/                  # parallel agent orchestration (9 commands + 2 skills)
├── metacognitive-guard/     # quality gates + commit integrity + CI verification
├── otelwiki/                # OpenTelemetry docs + sync
├── hookify/                 # user-configurable behavior rules
├── feature-dev/             # guided feature development + code review
├── council/                 # five-agent council (Teams API)
├── dotnet-architecture-lint/# .NET build pattern enforcement
├── design-studio/           # design intelligence + BM25 search
├── elegance-pipeline/       # code elegance scoring + gated refactoring
├── code-simplifier/         # complexity reduction agent
├── qyl-instrumentation/     # OTel observability orchestration
└── qyl-continuation/        # smart auto-continuation
```

## Links

- [CHANGELOG](CHANGELOG.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Claude Code Plugins docs](https://code.claude.com/docs/en/plugins)

## License

[MIT](LICENSE)
