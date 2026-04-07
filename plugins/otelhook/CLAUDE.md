# otelhook

Hook-only plugin that injects OTel GenAI + MCP semantic conventions as passive context on SessionStart.

## What it injects

`data/genai-semconv.md` — condensed from YAML registry at semantic-conventions v1.40.0:

**GenAI** (from `model/gen-ai/*.yaml`):
- Span types: inference, embeddings, retrieval (RAG), create_agent, invoke_agent, execute_tool
- Full attribute tables with requirement levels
- Operation names and provider names enums
- Tool types enum (function, extension, datastore)
- Events: operation.details, evaluation.result
- Metrics: token.usage, operation.duration, server TPOT/TTFT
- Anthropic-specific token counting rules (cache_read + cache_creation)
- Message JSON schemas: 8 part types, roles, modalities, finish reasons
- Retrieval documents schema

**MCP** (from `model/mcp/*.yaml`):
- Client and server spans with method-based naming
- All 26 MCP method names by category
- MCP metrics: operation.duration, session.duration (client + server)
- MCP/GenAI span compatibility rules (don't double-trace)

## When to update this plugin

When `open-telemetry/semantic-conventions` cuts a new release that changes `model/gen-ai/` or `model/mcp/`.
Check: https://github.com/open-telemetry/semantic-conventions/releases

Update checklist:
1. Fetch new YAML files from the release tag (`model/gen-ai/*.yaml`, `model/mcp/*.yaml`)
2. Update `data/genai-semconv.md` with changes
3. Update version tag in genai-semconv.md and hooks.json statusMessage
4. Bump plugin version in plugin.json
5. Sync marketplace.json

## Files

| File | Purpose |
|------|---------|
| `hooks/hooks.json` | SessionStart hook (once: true) |
| `bin/inject-genai-semconv` | Cats data/genai-semconv.md |
| `data/genai-semconv.md` | Condensed GenAI + MCP semconv v1.40.0 |

## Known gaps vs upstream

- OpenAI-specific semconv (`model/openai/`) — not included
- AWS Bedrock-specific (`aws.bedrock.guardrail.id`, `aws.bedrock.knowledge_base.id`) — not included
- Azure AI Inference-specific — not included
- Provider-specific pages in `docs/gen-ai/` (anthropic.md, aws-bedrock.md, etc.) — core rules extracted, provider detail omitted
