# session-debrief

Self-contained HTML debriefs of Claude Code session usage. Reads
`~/.claude/projects/**/*.jsonl` transcripts, extracts token spend, cache
behaviour, subagent activity, skill invocations, and the most expensive
prompts, and renders an explorable single-file report.

## What it does

Bundled assets (alongside `SKILL.md`):

| Asset | Purpose |
|---|---|
| `analyze-sessions.mjs` | Streaming transcript parser. Dedupes API calls by `requestId` (Claude Code splits one response across multiple `assistant` entries; only the last carries final `output_tokens`). Walks subagent transcripts under `<sessionId>/subagents/`, links them to their spawning prompt via `tool_use_id`. Emits JSON. |
| `template.html` | Self-contained renderer. JS reads `<script id="report-data" type="application/json">`, draws hero totals, sortable tables, expand/collapse drill-downs, and block-character bar charts. |

The skill drives the analyzer with the user-requested time window
(`24h`, `7d`, `30d`, `all`), drops the JSON into the template, fills the
**anomalies** block (3-5 one-line `% of total tokens` findings) and the
**optimizations** block (1-4 callouts tied to specific rows), and saves the
result.

Default anomaly categories:

- A project or skill eating a disproportionate share of total tokens
- Cache-hit ratio < 85%
- A single prompt > 2% of total tokens
- Subagent types averaging > 1M tokens per call
- Cache breaks clustering (uncached input > 100k tokens repeatedly)

## Usage

```text
"give me a session debrief for the last 7 days"
"session debrief --since 24h"
"session debrief for all time"
```

Or invoke the skill directly:

```text
/session-debrief
```

The HTML lands in the current working directory as
`session-debrief-YYYYMMDD-HHMM.html`. Open it in a browser; everything is
inline (no network calls).

## Attribution

Forked from [`anthropics/claude-plugins-official` `session-report`](https://github.com/anthropics/claude-plugins-official).
Original `LICENSE` retained inside this plugin directory.

Phase 1 modifications (this commit):

- Renamed plugin and skill to `session-debrief` (after-action review framing
  matches what the HTML actually delivers; avoids collision with Claude Code's
  first-party "recap" feature).
- Added `.claude-plugin/plugin.json` (upstream shipped without one).
- Added this `README.md` (upstream shipped without one).
- Output filename pattern updated: `session-report-` → `session-debrief-`.

Phase 2 work (cache-rot threshold > 300k flag, effort-level attribution from
`~/.claude/settings.json`, marketplace-aware project tier mapping, default
output dir `~/.claude/reports/`, smoke-test harness) is tracked in
[`AGENTS.md`](../../AGENTS.md) under "Next session — start here".
