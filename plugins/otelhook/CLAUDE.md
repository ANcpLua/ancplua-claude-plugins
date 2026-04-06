# otelhook

Hook-only plugin that injects OTel GenAI semantic conventions as passive context on SessionStart.

## Why separate from otelwiki?

GenAI semconv changes every 1-2 semconv releases. otelwiki bundles stable docs (collector, instrumentation,
protocol, general semconv). This plugin isolates the volatile part so updating gen-ai conventions
doesn't require touching otelwiki.

## What it injects

`data/genai-semconv.md` — condensed from semantic-conventions v1.40.0:
- Span types: inference, create_agent, invoke_agent, execute_tool
- Attribute tables with requirement levels
- Operation names and provider names enums
- Events: operation.details, evaluation.result
- Metrics: token.usage, operation.duration, server metrics
- Message JSON schemas: part types, roles, modalities, finish reasons
- Content recording rules (opt-in, sensitive data)

## When to update this plugin

When open-telemetry/semantic-conventions cuts a new release that changes gen-ai/ docs.
Check: https://github.com/open-telemetry/semantic-conventions/releases

Update checklist:
1. Read new gen-ai/ docs from the release tag
2. Update `data/genai-semconv.md` with changes
3. Update version tag in genai-semconv.md and hooks.json statusMessage
4. Bump plugin version in plugin.json
5. Sync marketplace.json

## Files

| File | Purpose |
|------|---------|
| `hooks/hooks.json` | SessionStart hook (once: true) |
| `bin/inject-genai-semconv` | Cats data/genai-semconv.md |
| `data/genai-semconv.md` | Condensed GenAI semconv v1.40.0 |

## Known gaps vs upstream

- `gen-ai-retrieval-documents.json` — not in v1.40.0 bundled docs, may appear in v1.41+
- OpenAI-specific semconv (`openai.md`) — not included, check otelwiki bundled docs
- AWS Bedrock, Azure-specific semconv — not included
