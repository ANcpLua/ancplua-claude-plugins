# Project-Memory Update Guidelines

Applies to `CLAUDE.md`, `AGENTS.md`, `.claude.local.md`, and files under `.claude/rules/`.

## Core Principle

Only add information that will genuinely help future agent sessions. The context window is precious — every line must earn its place.

## CLAUDE.md vs AGENTS.md

Both are project memory; they have different audiences and may both need the same facts.

| File | Read by | Write here when |
|---|---|---|
| `CLAUDE.md` | Claude Code | Default. The fact is project context for Claude. |
| `AGENTS.md` | Codex CLI, OpenAI agents, Codeium / Continue, ChatGPT desktop | The same fact must reach those tools. Codex does **not** read `CLAUDE.md`, so omitting `AGENTS.md` silently loses the context for that audience. |
| `.claude.local.md` | Claude Code only, gitignored | The fact is personal (paths, secrets-shaped preferences) and must not ship to teammates. |
| `.claude/rules/<name>.md` | Claude Code, auto-loaded as a flat set | The fact is a standing rule rather than ambient context. Each rule file should be independently coherent — ordering across files is not guaranteed. |

When in doubt: prefer one self-contained fact in two files over a cross-reference. Tools that don't share the same memory file also can't follow links between them.

## What TO Add

### 1. Commands/Workflows Discovered

```markdown
## Build

`npm run build:prod` - Full production build with optimization
`npm run build:dev` - Fast dev build (no minification)
```

Why: Saves future sessions from discovering these again.

### 2. Gotchas and Non-Obvious Patterns

```markdown
## Gotchas

- Tests must run sequentially (`--runInBand`) due to shared DB state
- `yarn.lock` is authoritative; delete `node_modules` if deps mismatch
```

Why: Prevents repeating debugging sessions.

### 3. Package Relationships

```markdown
## Dependencies

The `auth` module depends on `crypto` being initialized first.
Import order matters in `src/bootstrap.ts`.
```

Why: Architecture knowledge that isn't obvious from code.

### 4. Testing Approaches That Worked

```markdown
## Testing

For API endpoints: Use `supertest` with the test helper in `tests/setup.ts`
Mocking: Factory functions in `tests/factories/` (not inline mocks)
```

Why: Establishes patterns that work.

### 5. Configuration Quirks

```markdown
## Config

- `NEXT_PUBLIC_*` vars must be set at build time, not runtime
- Redis connection requires `?family=0` suffix for IPv6
```

Why: Environment-specific knowledge.

## What NOT to Add

### 1. Obvious Code Info

Bad:
```markdown
The `UserService` class handles user operations.
```

The class name already tells us this.

### 2. Generic Best Practices

Bad:
```markdown
Always write tests for new features.
Use meaningful variable names.
```

This is universal advice, not project-specific.

### 3. One-Off Fixes

Bad:
```markdown
We fixed a bug in commit abc123 where the login button didn't work.
```

Won't recur; clutters the file.

### 4. Verbose Explanations

Bad:
```markdown
The authentication system uses JWT tokens. JWT (JSON Web Tokens) are
an open standard (RFC 7519) that defines a compact and self-contained
way for securely transmitting information between parties as a JSON
object. In our implementation, we use the HS256 algorithm which...
```

Good:
```markdown
Auth: JWT with HS256, tokens in `Authorization: Bearer <token>` header.
```

## Diff Format for Updates

For each suggested change:

### 1. Identify the File

```
File: ./CLAUDE.md
Section: Commands (new section after ## Architecture)
```

### 2. Show the Change

```diff
 ## Architecture
 ...

+## Commands
+
+| Command | Purpose |
+|---------|---------|
+| `npm run dev` | Dev server with HMR |
+| `npm run build` | Production build |
+| `npm test` | Run test suite |
```

### 3. Explain Why

> **Why this helps:** The build commands weren't documented, causing
> confusion about how to run the project. This saves future sessions
> from needing to inspect `package.json`.

## Validation Checklist

Before finalizing an update, verify:

- [ ] Each addition is project-specific
- [ ] No generic advice or obvious info
- [ ] Commands are tested and work
- [ ] File paths are accurate
- [ ] Would a new Claude session find this helpful?
- [ ] Is this the most concise way to express the info?
