# spec-0004: MCP Connector Kit

**Status:** Parked (2026-04-15)
**Author:** Alexander + Claude Opus 4.6
**Date:** 2026-03-03
**Target repos:** `mcp-connector-kit` (new, npm package) + `qyl` (connector implementation) + `ancplua-claude-plugins` (plugin wrapper)

> **Parked note (2026-04-15):** Cold since 2026-03-03, ~6 weeks with zero activity. Author could not recall the motivation when asked. The broader MCP landscape has shifted meaningfully in the intervening weeks (new first-party Anthropic connectors, spec revisions), so this draft is likely stale in its prior-art section. Do not treat this as an active anchor — if the MCP Connector Kit becomes priority again, re-verify the prior-art table against current state before resuming. Re-anchoring should be explicit (new status + new date).

---

## 1. Problem

The MCP ecosystem has 8,600+ servers but almost none implement the full OAuth 2.1 auth spec for remote servers. The gap:

| What exists | Limitation |
|-------------|-----------|
| Anthropic's first-party connectors (Gmail, Slack, Linear, GitHub, Google Drive, Calendar) | Closed-source, Anthropic-internal only |
| Cloudflare `workers-oauth-provider` | Locked to Workers/KV/Durable Objects — not self-hostable |
| NapthaAI reference implementation | SSE-focused, no identity federation, no production tooling |
| FastMCP (Python/TypeScript) | Transport layer only — no OAuth broker, no consent page, no token management |
| Community MCP servers (8,600+) | Virtually none implement OAuth 2.1 + Streamable HTTP + Dynamic Client Registration |

**The missing piece:** An open-source, self-hosted, cloud-agnostic MCP connector framework with identity federation. Think "Passport.js for MCP" or "Keycloak adapter for MCP."

Every enterprise runs Keycloak, Entra ID, Auth0, or Okta. None of them can connect their identity infrastructure to Claude Code today without hand-rolling the entire OAuth 2.1 + Streamable HTTP + MCP session management stack from scratch.

---

## 2. Prior Art: How Anthropic Built Gmail MCP (Reverse-Engineered 2026-03-02)

### Evidence from HTTP headers

Reverse-engineering `gmail.mcp.claude.com` during a `/mcp` auth flow:

| Signal | Value | Conclusion |
|--------|-------|------------|
| Domain | `gmail.mcp.claude.com` | Anthropic's DNS (subdomain of `claude.com`) |
| Branding | `"Anthropic Sans"`, `"Anthropic Serif"`, `--anthropic-orange: #D97C57` | Anthropic's design system |
| Fallback URL | `window.location.href = 'https://claude.ai'` | Anthropic's app |
| Server | `Google Frontend` | Hosted on GCP (infrastructure, not ownership) |
| x-powered-by | `Express` | Node.js Express application |
| Remote Address | `[2a00:1450:4016:801::2013]:443` | Google Cloud IP |
| OAuth client ID | `101988054943-...apps.googleusercontent.com` | Anthropic's GCP project registered with Google OAuth |
| Redirect URI | `gmail.mcp.claude.com/google/oauth_redirect` | Anthropic's server receives the token |
| CSP form-action | `'self' https://accounts.google.com` | Forms submit to Google OAuth |
| Content-Type | `text/html; charset=utf-8` | Consent page served as HTML |

### Architecture (confirmed)

```
Claude Code CLI                    Anthropic's Broker                  Google
─────────────                      ──────────────────                  ──────
     │                                    │                               │
     │ 1. needs Gmail auth                │                               │
     │ ──generates metadata token──►      │                               │
     │                                    │                               │
     │ 2. opens browser                   │                               │
     │ ──────────────────────────────►    │                               │
     │    gmail.mcp.claude.com/           │                               │
     │    google/install?metadata=xxx     │                               │
     │                                    │                               │
     │                          3. user clicks "Continue"                 │
     │                                    │ ────────────────────────────► │
     │                                    │  accounts.google.com/oauth    │
     │                                    │                               │
     │                          4. user grants Gmail scopes              │
     │                                    │ ◄──── auth code ──────────── │
     │                                    │  /google/oauth_redirect       │
     │                                    │                               │
     │                          5. exchanges code for tokens             │
     │                                    │ ────────────────────────────► │
     │                                    │ ◄──── access + refresh ───── │
     │                                    │                               │
     │ 6. CLI polls/receives confirmation │                               │
     │ ◄──── session linked via metadata  │                               │
     │                                    │                               │
     │ 7. MCP calls go through broker     │                               │
     │ ──── tool call ──────────────────► │ ──── Gmail API call ────────► │
     │ ◄──── response ────────────────── │ ◄──── response ──────────── │
```

**Key insight:** The `metadata` parameter (`f808adf988fafcd2f03cce554b7c9b5cbcde82021b12536250998876969733d8`) is the session-linking token. It ties the browser OAuth flow back to the specific Claude Code session. Same pattern as Keycloak's `state` parameter.

**Implementation details from source:**
- Consent page: ~5.6 KB HTML, custom CSS with responsive breakpoints (375px–1920px)
- Static assets: `oauth.css`, `oauth.js`, `gmail_logo.svg`, `favicon.svg` (5 requests, 17.1 KB total)
- Cancel button: `window.history.back()` → `window.close()` → `claude.ai` fallback
- OAuth scopes: `openid`, `userinfo.email`, `gmail.readonly`, `gmail.compose`
- Grant type: Authorization Code with `access_type=offline` + `prompt=consent` (forces refresh token)

---

## 3. MCP Auth Spec Summary (2025-03-26 + June 2025 Update)

### OAuth 2.1 Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| OAuth 2.1 (IETF draft) | MUST | For HTTP-based transports |
| PKCE | REQUIRED for ALL clients | Eliminates client secret requirement |
| Dynamic Client Registration (RFC7591) | SHOULD (strongly recommended) | Auto-register with unknown servers |
| Authorization Server Metadata (RFC8414) | MUST for clients, SHOULD for servers | `.well-known/oauth-authorization-server` |
| Resource Indicators (RFC8707) | MUST (June 2025 addition) | Audience-scope tokens to specific MCP server |
| Bearer token in Authorization header | MUST on every HTTP request | Never in query string |

### Streamable HTTP Transport

Replaces deprecated HTTP+SSE (2024-11-05). Single endpoint handles both POST and GET:

- **POST**: Client sends JSON-RPC messages. Server responds with `application/json` or opens SSE stream.
- **GET**: Client opens standing SSE stream for server-initiated messages.
- **Session management**: `Mcp-Session-Id` header. Server issues at init, client includes on all requests.
- **Resumability**: SSE event IDs + `Last-Event-ID` header for reconnection.
- **Backwards compatibility**: Servers can serve old SSE endpoints alongside new Streamable HTTP.

### Third-Party Authorization Flow

The MCP spec explicitly supports delegated authorization (Section "Third-Party Authorization Flow"):

1. MCP client initiates OAuth with MCP server
2. MCP server redirects to third-party auth server (Keycloak, Entra ID, etc.)
3. User authorizes with third-party server
4. Third-party redirects back to MCP server with auth code
5. MCP server exchanges code for third-party tokens
6. MCP server generates its own MCP-scoped token bound to the third-party session
7. MCP server completes original OAuth flow with MCP client

**This is exactly what we're building.** The spec was designed for this use case.

### Session Binding Requirements (from spec)

MCP servers implementing third-party authorization MUST:
1. Maintain secure mapping between third-party tokens and issued MCP tokens
2. Validate third-party token status before honoring MCP tokens
3. Implement appropriate token lifecycle management
4. Handle third-party token expiration and renewal

---

## 4. Solution: Three-Layer Strategy

### Layer 1: `mcp-connector-kit` (open-source npm package)

The missing middleware between any OIDC provider and Claude Code.

```
Any OIDC Provider                    mcp-connector-kit                Claude Code
(Keycloak, Entra ID,                 ─────────────────                ──────────
 Auth0, Okta, Google)                      │
        │                                  │
        │◄── OAuth 2.1 + PKCE ───────────►│
        │    Dynamic Client Registration   │
        │    Token refresh/rotation        │
        │                                  │
        │    Streamable HTTP transport ────┤◄──── claude mcp add --transport http
        │    Session management            │
        │    Consent page (customizable)   │
        │    OTel instrumented             │
```

**One function call:**

```typescript
import { createMcpConnector } from 'mcp-connector-kit';

const connector = createMcpConnector({
  // Identity provider configuration
  provider: {
    type: 'oidc',                    // 'oidc' | 'keycloak' | 'entra' | 'auth0' | 'google'
    issuer: 'https://auth.example.com/realms/my-realm',
    clientId: 'my-mcp-server',
    scopes: ['openid', 'profile', 'custom:read'],
  },

  // MCP server configuration
  server: {
    name: 'my-connector',
    version: '1.0.0',
    port: 8080,
    basePath: '/mcp',
  },

  // Consent page (optional — sensible defaults provided)
  consent: {
    title: 'Connect Claude to My Service',
    description: 'Claude will be able to read your data.',
    logoUrl: '/logo.svg',
    permissions: ['Read your projects', 'Search your documents'],
  },

  // MCP tools
  tools: [
    {
      name: 'search_projects',
      description: 'Search for projects by name',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
      handler: async (params, { user, accessToken }) => {
        // user: decoded OIDC claims
        // accessToken: upstream token for API calls
        const results = await myApi.search(params.query, accessToken);
        return { content: [{ type: 'text', text: JSON.stringify(results) }] };
      },
    },
  ],

  // Observability (optional)
  telemetry: {
    enabled: true,
    otlpEndpoint: 'http://localhost:4317',
    serviceName: 'my-mcp-connector',
  },
});

connector.start();
```

#### What `createMcpConnector` handles internally

| Concern | Implementation |
|---------|---------------|
| **OAuth 2.1 server** | Authorization endpoint, token endpoint, metadata discovery (RFC8414) |
| **PKCE** | Required for all flows — generates and validates code challenges |
| **Dynamic Client Registration** | RFC7591 endpoint for auto-registration |
| **Resource Indicators** | RFC8707 audience-scoping per MCP spec June 2025 update |
| **Third-party delegation** | Full broker flow — MCP client ↔ connector ↔ upstream OIDC |
| **Token management** | In-memory + optional persistent store. Refresh rotation. Expiry. |
| **Session binding** | Maps MCP session IDs to upstream tokens securely |
| **Consent page** | Customizable HTML page (like Anthropic's Gmail consent) |
| **Streamable HTTP** | Full spec compliance — POST/GET, SSE streaming, session management |
| **MCP session management** | `Mcp-Session-Id` header, session lifecycle, `DELETE` termination |
| **OTel instrumentation** | Spans on auth flows, tool calls, token refresh. Metrics on latency, errors. |
| **Security** | HTTPS enforcement, Origin validation, localhost binding, CORS |

#### Provider presets

```typescript
// Keycloak
{ type: 'keycloak', url: 'https://auth.example.com', realm: 'my-realm', clientId: '...' }

// Microsoft Entra ID
{ type: 'entra', tenantId: 'xxxx-xxxx', clientId: '...', scopes: ['User.Read'] }

// Auth0
{ type: 'auth0', domain: 'my-app.auth0.com', clientId: '...', audience: 'https://api.example.com' }

// Google (same pattern Anthropic uses for Gmail)
{ type: 'google', clientId: '...', scopes: ['gmail.readonly'] }

// Generic OIDC (any provider)
{ type: 'oidc', issuer: 'https://...', clientId: '...' }
```

### Layer 2: `qyl-connector` (proof-of-concept built on Layer 1)

Claude Code connects to qyl through a remote MCP server. Claude queries its own historical telemetry across sessions, projects, and teams.

```
Claude Code ──► qyl-connector (remote MCP, OAuth via qyl) ──► qyl DuckDB
                │
                ├── get_my_sessions(project?, last_n_days?)
                ├── get_session_cost(session_id)
                ├── get_tool_usage_trends(project, period)
                ├── get_error_patterns(project, since)
                ├── compare_sessions(session_a, session_b)
                └── get_team_activity(team_name)
```

#### Telemetry loop completion

```
claude-self-obs (local)     qyl native OTLP          qyl-connector (remote)
────────────────────        ──────────────            ──────────────────────
Hook events (tool           Session metrics           Historical queries
calls, agent life)    →     (cost, tokens,      →    Claude reads its own
In-session only             LOC, prompts)             past across sessions
                            Into DuckDB               Back into Claude
```

Three orthogonal data paths, each filling a different gap:

| Path | Transport | Data | Temporal scope |
|------|-----------|------|---------------|
| `claude-self-obs` | HTTP hooks → local MCP (stdio) | Tool calls, file paths, agent lifecycle, search patterns | Current session only |
| Native OTLP (spec-0002) | OTLP/gRPC → OTel Collector → DuckDB | Metrics (cost, tokens, LOC), events (prompts, API requests) | All sessions, persistent |
| `qyl-connector` | Remote MCP (Streamable HTTP + OAuth) | Historical queries across sessions, projects, teams | All historical data |

#### MCP Tools

**`get_my_sessions`** — List sessions with summary metrics

```typescript
{
  name: 'get_my_sessions',
  description: 'List Claude Code sessions for a project, sorted by recency',
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string', description: 'Project name filter (e.g., "ancplua-claude-plugins")' },
      last_n_days: { type: 'number', description: 'Only sessions from last N days', default: 7 },
      limit: { type: 'number', default: 20 },
    },
  },
}
// Returns: session_id, project, start_time, duration, total_cost, token_count, tool_calls, status
```

**`get_session_cost`** — Cost breakdown for a specific session

```typescript
{
  name: 'get_session_cost',
  description: 'Get detailed cost breakdown for a session (input/output tokens, cache hits, model)',
  inputSchema: {
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'Session UUID' },
    },
    required: ['session_id'],
  },
}
// Returns: model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, total_cost_usd
```

**`get_tool_usage_trends`** — Tool call patterns over time

```typescript
{
  name: 'get_tool_usage_trends',
  description: 'Get tool usage statistics: which tools are called most, success rates, avg durations',
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string' },
      period: { type: 'string', enum: ['day', 'week', 'month'], default: 'week' },
      tool_name: { type: 'string', description: 'Filter to specific tool (optional)' },
    },
  },
}
// Returns: tool_name, call_count, success_rate, avg_duration_ms, trend (up/down/stable)
```

**`get_error_patterns`** — Recurring errors across sessions

```typescript
{
  name: 'get_error_patterns',
  description: 'Find recurring tool errors and failures across sessions',
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string' },
      since: { type: 'string', description: 'ISO date (e.g., "2026-02-01")' },
    },
  },
}
// Returns: error_type, count, first_seen, last_seen, affected_sessions, sample_message
```

**`compare_sessions`** — Side-by-side session comparison

```typescript
{
  name: 'compare_sessions',
  description: 'Compare two sessions: cost, tokens, tool usage, duration',
  inputSchema: {
    type: 'object',
    properties: {
      session_a: { type: 'string' },
      session_b: { type: 'string' },
    },
    required: ['session_a', 'session_b'],
  },
}
// Returns: side-by-side comparison of all metrics
```

**`get_team_activity`** — Multi-agent team telemetry

```typescript
{
  name: 'get_team_activity',
  description: 'Get activity for a multi-agent team (spawned via Teams API)',
  inputSchema: {
    type: 'object',
    properties: {
      team_name: { type: 'string' },
      session_id: { type: 'string', description: 'Parent session (optional)' },
    },
  },
}
// Returns: team_name, agents[], per-agent metrics, total cost, coordination overhead
```

### Layer 3: Connectors Directory Submission

Anthropic published a [Remote MCP Server Submission Guide](https://support.claude.com/en/articles/12922490-remote-mcp-server-submission-guide).

**Submission package:**
1. Working remote MCP server (qyl-connector)
2. OAuth consent flow (branded, spec-compliant)
3. Documentation (usage, security, privacy)
4. The open-source framework it's built on (mcp-connector-kit)

**Strategic value:** Not just submitting a connector — submitting the framework that enables everyone else to submit connectors. This is ecosystem infrastructure.

---

## 5. Implementation Plan

### Phase 1: `mcp-connector-kit` core (npm package)

**Deliverables:**
1. OAuth 2.1 server (authorization endpoint, token endpoint, metadata discovery)
2. PKCE implementation
3. Dynamic Client Registration (RFC7591)
4. Streamable HTTP transport (full MCP spec compliance)
5. MCP session management (`Mcp-Session-Id`)
6. Third-party delegation flow (the broker pattern)
7. Consent page renderer (customizable HTML template)
8. Token store interface (in-memory default, pluggable for Redis/Postgres)
9. OTel instrumentation (spans, metrics)
10. Provider presets (OIDC, Keycloak, Entra, Auth0, Google)

**Tech stack:**
- TypeScript, Node.js (no framework lock-in — raw `http` or optional Express adapter)
- `@modelcontextprotocol/sdk` for MCP protocol handling
- `jose` for JWT/JWK operations
- `opentelemetry` SDK for instrumentation
- Zero Cloudflare dependencies

**Package structure:**

```
mcp-connector-kit/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  # createMcpConnector() entry point
│   ├── oauth/
│   │   ├── server.ts             # OAuth 2.1 authorization server
│   │   ├── pkce.ts               # PKCE challenge/verifier
│   │   ├── registration.ts       # Dynamic Client Registration (RFC7591)
│   │   ├── metadata.ts           # Authorization Server Metadata (RFC8414)
│   │   ├── resource-indicators.ts # RFC8707 audience scoping
│   │   └── tokens.ts             # Token issuance, refresh, rotation
│   ├── providers/
│   │   ├── oidc.ts               # Generic OIDC provider
│   │   ├── keycloak.ts           # Keycloak preset
│   │   ├── entra.ts              # Microsoft Entra ID preset
│   │   ├── auth0.ts              # Auth0 preset
│   │   └── google.ts             # Google preset
│   ├── transport/
│   │   ├── streamable-http.ts    # Streamable HTTP transport (MCP 2025-03-26)
│   │   ├── session.ts            # Mcp-Session-Id management
│   │   └── sse.ts                # SSE stream handling
│   ├── consent/
│   │   ├── page.ts               # Consent page HTML renderer
│   │   ├── template.html         # Default consent page template
│   │   └── styles.css            # Default consent page styles
│   ├── store/
│   │   ├── interface.ts          # TokenStore interface
│   │   ├── memory.ts             # In-memory token store (default)
│   │   └── README.md             # Guide for Redis/Postgres adapters
│   └── telemetry/
│       ├── spans.ts              # OTel span creation for auth + tool calls
│       └── metrics.ts            # OTel metrics (auth latency, token refresh, errors)
└── test/
    ├── oauth.test.ts
    ├── transport.test.ts
    ├── providers.test.ts
    └── e2e/
        └── full-flow.test.ts     # End-to-end: register → authorize → tool call
```

### Phase 2: `qyl-connector` (proof of concept)

**Deliverables:**
1. Remote MCP server using `mcp-connector-kit`
2. OAuth through qyl's auth system
3. 6 MCP tools querying DuckDB
4. OTel instrumentation on all tool calls
5. Deploy alongside qyl backend

**Depends on:** Phase 1 + spec-0002 (qyl OTLP ingest must be working for data to exist)

### Phase 3: Plugin wrapper + Connectors Directory submission

**Deliverables:**
1. Claude Code plugin in `ancplua-claude-plugins` that documents the connector
2. Submission to Anthropic's Connectors Directory
3. Blog post / documentation

---

## 6. Security Considerations

### OAuth Security (per MCP spec + OAuth 2.1 best practices)

- PKCE REQUIRED for all clients (code_challenge_method: S256)
- All authorization endpoints MUST be served over HTTPS
- Redirect URIs MUST be localhost URLs or HTTPS URLs
- Tokens MUST NOT appear in URI query strings
- Token rotation SHOULD be implemented
- Origin header MUST be validated on all incoming connections (DNS rebinding prevention)
- When running locally, bind to localhost only (not 0.0.0.0)

### Token Lifecycle

- Access tokens: short-lived (5-15 minutes)
- Refresh tokens: longer-lived, single-use with rotation
- MCP-scoped tokens bound to upstream session — if upstream token is revoked, MCP token is invalidated
- Token store must handle concurrent access safely

### Third-Party Delegation Security

- Maintain secure mapping between third-party tokens and MCP tokens
- Validate third-party token status before honoring MCP tokens
- Handle third-party token expiration and renewal
- Implement appropriate session timeout handling
- Consider security implications of token chaining

### Consent Page Security

- CSP: `default-src 'self'; form-action 'self' <idp-url>; frame-ancestors 'none'`
- X-Frame-Options: SAMEORIGIN
- No user-controlled content rendered without sanitization

---

## 7. Competitive Analysis

### vs. Cloudflare `workers-oauth-provider`

| Dimension | Cloudflare | mcp-connector-kit |
|-----------|-----------|-------------------|
| Hosting | Workers only | Anywhere Node runs |
| Token store | KV/Durable Objects | Pluggable (memory, Redis, Postgres) |
| Identity federation | Manual wiring | Provider presets (Keycloak, Entra, Auth0, Google) |
| Consent page | Build your own | Template included, customizable |
| OTel instrumentation | None | Built-in |
| Enterprise-ready | Cloudflare Enterprise | Any infrastructure |

### vs. Hand-rolling OAuth for each connector

| Dimension | Hand-rolled | mcp-connector-kit |
|-----------|------------|-------------------|
| OAuth 2.1 compliance | Partial, error-prone | Full spec compliance, tested |
| Development time | Weeks per connector | Hours per connector |
| PKCE | Often forgotten | Enforced by default |
| Dynamic Client Registration | Rarely implemented | Included |
| Maintenance burden | Per-connector | Shared framework |

---

## 8. Sentry Reference (Quality Bar)

Sentry's `.claude/` setup demonstrates enterprise-grade Claude Code configuration:

- **12 skills** with `SKILL.md` frontmatter + `references/` subdirectories
- Skills encode **real production data**: 638 issues, 27M error events, 37 security patches
- Each skill has a **classification step** → **pattern checks** → **report format**
- Reference files provide deep domain context without bloating the main SKILL.md
- Settings use **granular Bash permissions** (`Bash(pytest:*)`, `Bash(pnpm test:*)`)
- MCP servers: Sentry's own MCP (`mcp__sentry__*`) with 8 tools for issue analysis

**Pattern to adopt for mcp-connector-kit skill:**
- SKILL.md with classification → configuration → validation steps
- References for each provider (Keycloak, Entra, Auth0, Google)
- Reference for security checklist (OAuth 2.1 compliance validation)
- Reference for troubleshooting (common auth flow failures)

---

## 9. Success Criteria

### Layer 1: `mcp-connector-kit`

1. `createMcpConnector()` starts a fully compliant remote MCP server in <10 lines
2. OAuth 2.1 + PKCE + Dynamic Client Registration passes compliance tests
3. Streamable HTTP transport works with `claude mcp add --transport http`
4. At least 3 provider presets (OIDC, Keycloak, Google) work end-to-end
5. Consent page renders and completes OAuth flow in browser
6. OTel spans emitted for auth flows and tool calls
7. Zero Cloudflare dependencies

### Layer 2: `qyl-connector`

1. Claude Code can authenticate with qyl via OAuth
2. All 6 MCP tools return accurate data from DuckDB
3. Claude can query its own historical session data
4. OTel instrumentation on all tool calls

### Layer 3: Connectors Directory

1. Submission accepted by Anthropic
2. Listed in Connectors Directory
3. Open-source framework referenced in submission

---

## 10. What This Portfolio Demonstrates

| Signal | What it demonstrates |
|--------|---------------------|
| Reverse-engineered Gmail MCP OAuth from HTTP headers | Security intuition, protocol understanding |
| Built self-obs plugin (Claude watching itself) | Deep Claude Code internals knowledge |
| Built qyl observability platform | Full-stack: OTLP, DuckDB, React, SSE |
| Building the connector kit | Identity/auth expertise (Keycloak, OAuth 2.1, PKCE) |
| Self-hosted, not Cloudflare-locked | Enterprise architecture thinking |
| OTel instrumented throughout | Observability-first engineering |
| Plugin ecosystem (8 plugins, 23 commands, 14 agents) | Lives in the product more than most employees |
| Sentry-quality skill structure | Understands enterprise Claude Code patterns |

---

## 11. Related Documents

- [spec-0002: qyl Claude Code Observability](./spec-0002-qyl-claude-code-observability.md) — Native OTLP → qyl pipeline
- [MCP Authorization Spec (2025-03-26)](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization)
- [MCP Streamable HTTP Transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
- [Anthropic Remote MCP Server Submission Guide](https://support.claude.com/en/articles/12922490-remote-mcp-server-submission-guide)
- [Anthropic Connectors Directory FAQ](https://support.claude.com/en/articles/11596036-anthropic-connectors-directory-faq)
- [Cloudflare workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider)
- [MCP Auth Spec Review — Logto](https://blog.logto.io/mcp-auth-spec-review-2025-03-26)
- [MCP Auth Spec Deep Dive — Descope](https://www.descope.com/blog/post/mcp-auth-spec)
- [MCP June 2025 Auth Updates — Auth0](https://auth0.com/blog/mcp-specs-update-all-about-auth/)

---

## 12. Maintenance Rules for Claude

1. Update this spec when MCP auth spec changes (track `modelcontextprotocol.io/specification/`)
2. Update provider presets when new identity providers gain market share
3. Update competitive analysis when new frameworks emerge
4. Keep Gmail MCP reverse-engineering section as historical reference — do not delete
5. Update success criteria as layers are completed
