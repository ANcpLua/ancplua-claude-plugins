<OTEL_GENAI_SEMCONV version="1.40.0" status="Development">

OTel GenAI Semantic Conventions — injected as passive context. Use these exact attribute names,
span patterns, metric names, and message schemas when writing GenAI telemetry code.

Source: https://github.com/open-telemetry/semantic-conventions/tree/v1.40.0/docs/gen-ai

## Stability Warning

Instrumentations using v1.36.0 or prior SHOULD NOT change emitted conventions by default.
Opt-in via env var: OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental

## Span Types

### Inference Span (client call to GenAI model)

Span name: `{gen_ai.operation.name} {gen_ai.request.model}`
Span kind: CLIENT (or INTERNAL if same-process)

Required attributes:
- gen_ai.operation.name (string) — chat, text_completion, generate_content, embeddings, etc.
- gen_ai.provider.name (string) — openai, anthropic, aws.bedrock, azure.ai.openai, etc.

Conditionally required:
- error.type — if operation ended in error
- gen_ai.conversation.id — when available (session/thread correlation)
- gen_ai.output.type — if request specifies output format (text, json, image, speech)
- gen_ai.request.model — if available
- server.port — if server.address is set

Recommended:
- gen_ai.request.{frequency_penalty, max_tokens, presence_penalty, temperature, top_k, top_p, seed, stop_sequences}
- gen_ai.response.{finish_reasons, id, model}
- gen_ai.usage.{input_tokens, output_tokens}
- server.address

Opt-in (sensitive):
- gen_ai.input.messages — chat history (follows InputMessages JSON schema)
- gen_ai.output.messages — model responses (follows OutputMessages JSON schema)
- gen_ai.system_instructions — system prompt (follows SystemInstructions JSON schema)
- gen_ai.tool.definitions — available tools (NOT recommended by default, can be large)

### Create Agent Span

Span name: `create_agent {gen_ai.agent.name}`
Span kind: CLIENT
gen_ai.operation.name = "create_agent"

Additional conditionally required:
- gen_ai.agent.id — unique agent identifier
- gen_ai.agent.name — human-readable name
- gen_ai.agent.description — free-form description

### Invoke Agent Span

Span name: `invoke_agent {gen_ai.agent.name}`
Span kind: CLIENT (or INTERNAL for local frameworks)
gen_ai.operation.name = "invoke_agent"

Additional attributes:
- gen_ai.agent.id, gen_ai.agent.name — conditionally required
- gen_ai.agent.description — recommended

### Execute Tool Span

Span name: `execute_tool {gen_ai.tool.name}`
Span kind: CLIENT (or INTERNAL)
gen_ai.operation.name = "execute_tool"

Additional:
- gen_ai.tool.name (required) — name of the tool
- gen_ai.tool.call.id — unique tool call identifier
- gen_ai.is_side_effect_free (recommended) — true if tool has no side effects

## Operation Names (well-known values)

| Value | Description |
|-------|-------------|
| chat | Chat completion (OpenAI Chat API) |
| text_completion | Text completions (legacy) |
| generate_content | Multimodal (Gemini) |
| embeddings | Embedding generation |
| create_agent | Create GenAI agent |
| invoke_agent | Invoke GenAI agent |
| execute_tool | Execute a tool |

## Provider Names (well-known values)

| Value | Provider |
|-------|----------|
| anthropic | Anthropic |
| openai | OpenAI |
| azure.ai.openai | Azure OpenAI |
| azure.ai.inference | Azure AI Inference |
| aws.bedrock | AWS Bedrock |
| gcp.gemini | Gemini |
| gcp.vertex_ai | Vertex AI |
| gcp.gen_ai | Any Google GenAI |
| cohere | Cohere |
| deepseek | DeepSeek |
| groq | Groq |
| ibm.watsonx.ai | IBM Watsonx |
| mistral_ai | Mistral AI |
| perplexity | Perplexity |
| xai | xAI |

## Events

### gen_ai.client.inference.operation.details
Captures full request/response details including chat history and parameters. Opt-in event.

### gen_ai.evaluation.result
Captures evaluation of GenAI output quality. Parent to the GenAI operation span being evaluated.
- gen_ai.evaluation.name (required) — metric name (e.g. "Relevance", "IntentResolution")
- gen_ai.evaluation.score.value — numeric score
- gen_ai.evaluation.score.label — human-readable label ("relevant", "pass", "fail")
- gen_ai.evaluation.explanation — free-form explanation

## Metrics

### Client Metrics

| Metric | Type | Unit | Description |
|--------|------|------|-------------|
| gen_ai.client.token.usage | Histogram | {token} | Input and output token counts |
| gen_ai.client.operation.duration | Histogram | s | End-to-end operation duration |

Token usage buckets: [1, 4, 16, 64, 256, 1024, 4096, 16384, 65536, 262144, 1048576, 4194304, 16777216, 67108864]
Duration buckets: [0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 0.64, 1.28, 2.56, 5.12, 10.24, 20.48, 40.96, 81.92]

Required metric attributes: gen_ai.operation.name, gen_ai.provider.name
Token-specific: gen_ai.token.type (input | output)

### Server Metrics

| Metric | Type | Unit | Description |
|--------|------|------|-------------|
| gen_ai.server.request.duration | Histogram | s | Server-side request duration |
| gen_ai.server.time_per_output_token | Histogram | s | Time per output token (TPOT) |
| gen_ai.server.time_to_first_token | Histogram | s | Time to first token (TTFT) |

## Message JSON Schemas (condensed)

### Part Types (shared across input/output/system)

| Type | Required Fields | Description |
|------|----------------|-------------|
| text | type, content | Text content |
| tool_call | type, name | Tool call request (optional: id, arguments) |
| tool_call_response | type, response | Tool call result (optional: id) |
| blob | type, modality, content | Binary data inline (base64) |
| file | type, modality, file_id | Pre-uploaded file reference |
| uri | type, modality, uri | External file by URI |
| reasoning | type, content | Model reasoning/thinking |
| generic | type | Extensible custom part |

Roles: system, user, assistant, tool
Modalities: image, video, audio
Finish reasons: stop, length, content_filter, tool_call, error

### InputMessages schema
Array of ChatMessage: { role, parts[], name? }

### OutputMessages schema
Array of OutputMessage: { role, parts[], name?, finish_reason }

### SystemInstructions schema
Array of parts (TextPart, BlobPart, etc.) — no role wrapper

## Content Recording Rules

- Input/output content is opt-in (sensitive data, user/PII)
- When recorded on events: MUST use structured form
- When recorded on spans: MAY use JSON string if structured not supported
- Instrumentations MAY provide filtering/truncation
- Tool definitions are NOT recommended by default (can be large)

## Key Implementation Rules

- Span name format: "{operation} {model}" for inference, "{operation} {agent_name}" for agents
- gen_ai.provider.name is a discriminator — use it consistently across spans/metrics/events
- When report both used and billable tokens: MUST report billable
- Token counting: only if readily available or user-enabled offline counting
- gen_ai.request.model = what was requested, gen_ai.response.model = what actually responded

</OTEL_GENAI_SEMCONV>
