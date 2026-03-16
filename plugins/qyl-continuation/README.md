# qyl-continuation

Smart auto-continuation for Claude Code.
Heuristic pre-filter eliminates ~80% of unnecessary Haiku calls;
improved judge prompt handles the rest.

Based on [double-shot-latte](https://github.com/anthropics/claude-code-plugins/tree/main/plugins/double-shot-latte) (MIT).

## How It Works

**Phase 1 — Heuristics (no LLM call):**

- H1: Assistant asked user a question → stop
- H2: Completion signal without stated next steps → stop
- H3: Tool results already addressed by assistant → stop
- H4: Substantial text-only response (no pending tool calls) → stop

**Phase 2 — Haiku judge (~20% of cases):**

- Only fires when heuristics are inconclusive
- Structured JSON output: `should_continue` + `reasoning`
- Throttled: max 3 continuations per 5-minute window

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `QYL_CONTINUATION_TIMEOUT` | `30` | Haiku judge timeout (seconds) |
| `QYL_CONTINUATION_MODEL` | `haiku` | Judge model |
