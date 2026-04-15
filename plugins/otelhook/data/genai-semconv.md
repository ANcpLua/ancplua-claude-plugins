<OTEL_GENAI_SEMCONV version="1.40.0" status="Development" source="model/gen-ai/*.yaml + model/mcp/*.yaml">

OTel GenAI + MCP Semantic Conventions from the YAML registry (source of truth).
Use these exact attribute names, span patterns, metric names, and message schemas.

Source: https://github.com/open-telemetry/semantic-conventions/tree/v1.40.0/model/gen-ai
Source: https://github.com/open-telemetry/semantic-conventions/tree/v1.40.0/model/mcp

## Stability

All GenAI and MCP conventions are status: Development.
Instrumentations using v1.36.0 or prior SHOULD NOT change emitted conventions by default.
Opt-in: OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental

---

## GenAI Spans

### Common Client Attributes (inherited by all GenAI spans)

| Attribute | Req Level | Type | Description |
|-----------|-----------|------|-------------|
| gen_ai.operation.name | required | string | chat, text_completion, generate_content, embeddings, etc. |
| gen_ai.provider.name | required | string | openai, anthropic, aws.bedrock, azure.ai.openai, etc. |
| gen_ai.request.model | cond. required | string | Model name as requested |
| server.address | recommended | string | GenAI server address |
| server.port | cond. required | int | If server.address is set |
| error.type | cond. required | string | If operation ended in error |

### Inference Span

Span name: `{gen_ai.operation.name} {gen_ai.request.model}`
Span kind: CLIENT (or INTERNAL if same-process)

Additional attributes beyond common:

| Attribute | Req Level | Type |
|-----------|-----------|------|
| gen_ai.request.max_tokens | recommended | int |
| gen_ai.request.temperature | recommended | double |
| gen_ai.request.top_p | recommended | double |
| gen_ai.request.top_k | recommended | double |
| gen_ai.request.frequency_penalty | recommended | double |
| gen_ai.request.presence_penalty | recommended | double |
| gen_ai.request.stop_sequences | recommended | string[] |
| gen_ai.request.seed | cond. required | int |
| gen_ai.request.choice.count | cond. required | int |
| gen_ai.output.type | cond. required | string |
| gen_ai.response.id | recommended | string |
| gen_ai.response.model | recommended | string |
| gen_ai.response.finish_reasons | recommended | string[] |
| gen_ai.usage.input_tokens | recommended | int |
| gen_ai.usage.output_tokens | recommended | int |
| gen_ai.usage.cache_read.input_tokens | recommended | int |
| gen_ai.usage.cache_creation.input_tokens | recommended | int |
| gen_ai.conversation.id | cond. required | string |
| gen_ai.input.messages | opt-in | any |
| gen_ai.output.messages | opt-in | any |
| gen_ai.system_instructions | opt-in | any |
| gen_ai.tool.definitions | opt-in | any |

### Embeddings Span

Span name: `{gen_ai.operation.name} {gen_ai.request.model}`
Span kind: CLIENT
gen_ai.operation.name = "embeddings"

Additional:
- gen_ai.request.encoding_formats (recommended)
- gen_ai.usage.input_tokens (recommended)
- gen_ai.embeddings.dimension.count (recommended)

### Retrieval Span (RAG)

Span name: `{gen_ai.operation.name} {gen_ai.data_source.id}`
Span kind: CLIENT
gen_ai.operation.name = "retrieval"

Additional:
- gen_ai.data_source.id (cond. required)
- gen_ai.request.top_k (recommended)
- gen_ai.retrieval.query.text (opt-in, sensitive)
- gen_ai.retrieval.documents (opt-in)

### Create Agent Span

Span name: `create_agent {gen_ai.agent.name}`
Span kind: CLIENT
gen_ai.operation.name = "create_agent"

Additional:
- gen_ai.agent.id (cond. required)
- gen_ai.agent.name (cond. required)
- gen_ai.agent.description (cond. required)
- gen_ai.agent.version (cond. required)
- gen_ai.system_instructions (opt-in)

### Invoke Agent Span

Span name: `invoke_agent {gen_ai.agent.name}`
Span kind: CLIENT (or INTERNAL for in-process agents like LangChain, CrewAI)
gen_ai.operation.name = "invoke_agent"

Inherits all inference attributes plus:
- gen_ai.agent.id, gen_ai.agent.name, gen_ai.agent.description, gen_ai.agent.version
- gen_ai.data_source.id (cond. required)
- gen_ai.system_instructions, gen_ai.input.messages, gen_ai.output.messages (opt-in)

### Execute Tool Span

Span name: `execute_tool {gen_ai.tool.name}`
Span kind: INTERNAL
gen_ai.operation.name = "execute_tool"

| Attribute | Req Level | Type |
|-----------|-----------|------|
| gen_ai.tool.name | recommended | string |
| gen_ai.tool.call.id | recommended | string |
| gen_ai.tool.description | recommended | string |
| gen_ai.tool.type | recommended | string |
| gen_ai.tool.call.arguments | opt-in | any |
| gen_ai.tool.call.result | opt-in | any |
| error.type | cond. required | string |

---

## MCP Spans

### MCP Client Span

Span name: `{mcp.method.name} {target}` (target = gen_ai.tool.name or gen_ai.prompt.name)
Span kind: CLIENT

| Attribute | Req Level | Type |
|-----------|-----------|------|
| mcp.method.name | required | string |
| mcp.protocol.version | required | string |
| mcp.session.id | recommended | string |
| mcp.resource.uri | cond. required | string |
| jsonrpc.request.id | cond. required | string |
| server.address | recommended | string |
| server.port | recommended | int |
| gen_ai.tool.call.arguments | opt-in | any |
| gen_ai.tool.call.result | opt-in | any |
| error.type | cond. required | string |

MCP tool call spans are compatible with GenAI execute_tool spans.
If outer GenAI instrumentation already traces the tool execution,
MCP instrumentation SHOULD NOT create a separate span — add MCP attributes to the existing one.

### MCP Server Span

Span name: `{mcp.method.name} {target}`
Span kind: SERVER

Same as client but with:
- client.address (recommended)
- client.port (recommended, when client.address is set)

### MCP Method Names (26 methods)

| Method | Category |
|--------|----------|
| initialize | Init |
| notifications/initialized | Init |
| resources/list | Resources |
| resources/read | Resources |
| resources/subscribe | Resources |
| resources/unsubscribe | Resources |
| notifications/resources/list_changed | Resources |
| notifications/resources/updated | Resources |
| prompts/list | Prompts |
| prompts/get | Prompts |
| notifications/prompts/list_changed | Prompts |
| tools/list | Tools |
| tools/call | Tools |
| notifications/tools/list_changed | Tools |
| notifications/progress | Notifications |
| notifications/cancelled | Notifications |
| notifications/message | Notifications |
| ping | Utility |
| logging/setLevel | Utility |
| sampling/createMessage | Utility |
| completion/complete | Utility |
| roots/list | Server |
| notifications/roots/list_changed | Server |
| elicitation/create | Server |

---

## MCP Metrics

| Metric | Type | Unit | Description |
|--------|------|------|-------------|
| mcp.client.operation.duration | Histogram | s | Round-trip time from sender |
| mcp.server.operation.duration | Histogram | s | Server-side processing duration |
| mcp.client.session.duration | Histogram | s | Client session lifespan |
| mcp.server.session.duration | Histogram | s | Server session lifespan |

---

## GenAI Metrics

| Metric | Type | Unit | Value Type | Description |
|--------|------|------|------------|-------------|
| gen_ai.client.token.usage | Histogram | {token} | int | Input and output token counts |
| gen_ai.client.operation.duration | Histogram | s | double | End-to-end operation duration |
| gen_ai.server.request.duration | Histogram | s | double | Server-side request duration |
| gen_ai.server.time_per_output_token | Histogram | s | double | Time per output token (TPOT) |
| gen_ai.server.time_to_first_token | Histogram | s | double | Time to first token (TTFT) |

Token usage requires: gen_ai.token.type = "input" | "output"
Token buckets: [1, 4, 16, 64, 256, 1024, 4096, 16384, 65536, 262144, 1048576, 4194304, 16777216, 67108864]
Duration buckets: [0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 0.64, 1.28, 2.56, 5.12, 10.24, 20.48, 40.96, 81.92]

When systems report both used and billable tokens: MUST report billable.
If instrumentation cannot efficiently obtain token counts, MAY allow user-enabled offline counting.

---

## GenAI Events

### gen_ai.client.inference.operation.details
Opt-in event capturing full request/response details independently from traces.
Inherits all inference span attributes.

### gen_ai.evaluation.result
Captures evaluation of GenAI output quality.

| Attribute | Req Level | Type |
|-----------|-----------|------|
| gen_ai.evaluation.name | required | string |
| gen_ai.evaluation.score.value | cond. required | double |
| gen_ai.evaluation.score.label | cond. required | string |
| gen_ai.evaluation.explanation | recommended | string |
| gen_ai.response.id | recommended | string |
| error.type | cond. required | string |

---

## Operation Names

| Value | Description |
|-------|-------------|
| chat | Chat completion (OpenAI Chat API) |
| text_completion | Text completions (legacy) |
| generate_content | Multimodal (Gemini) |
| embeddings | Embedding generation |
| retrieval | Vector search / RAG |
| create_agent | Create GenAI agent |
| invoke_agent | Invoke GenAI agent |
| execute_tool | Execute a tool |

## Provider Names

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

## Tool Types

| Value | Description |
|-------|-------------|
| function | Tool backed by a function |
| extension | Tool backed by an extension (e.g. code_interpreter) |
| datastore | Tool backed by a datastore (e.g. file_search) |

---

## Anthropic-Specific Token Rules

gen_ai.provider.name MUST be "anthropic"

Anthropic `input_tokens` EXCLUDES cached tokens. Compute:
```
gen_ai.usage.input_tokens = input_tokens + cache_read_input_tokens + cache_creation_input_tokens
```
- gen_ai.usage.cache_read.input_tokens — from `cache_read_input_tokens` (MUST be added)
- gen_ai.usage.cache_creation.input_tokens — from `cache_creation_input_tokens` (MUST be added)

---

## Message JSON Schemas

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

### InputMessages: Array of { role, parts[], name? }
### OutputMessages: Array of { role, parts[], name?, finish_reason }
### SystemInstructions: Array of parts (no role wrapper)
### RetrievalDocuments: Array of { id: string, score: number }

---

## Key Rules

- Span name: "{operation} {model}" for inference, "{operation} {agent_name}" for agents, "{method} {target}" for MCP
- gen_ai.provider.name is a discriminator — use consistently across spans/metrics/events
- gen_ai.request.model = what was requested, gen_ai.response.model = what actually responded
- Content attributes (input/output messages, system instructions) are opt-in and may contain PII
- Tool definitions NOT recommended by default (can be large)
- MCP resource.uri SHOULD NOT be in span name by default (high cardinality)
- MCP tool spans are compatible with GenAI execute_tool — don't double-trace

</OTEL_GENAI_SEMCONV>
