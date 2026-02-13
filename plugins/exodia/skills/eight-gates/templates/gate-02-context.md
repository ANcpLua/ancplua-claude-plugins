# Gate 2: 休門 KYŪMON — CONTEXT

> Passive context beats active retrieval.
> Load only what is always true. This is Yin: form, intent, meaning.
> Skills aren't just "helpful docs." They are the mechanism that makes
> agent behavior consistent across people and prompts.

## Entry Condition

- Gate 1 checkpoint exists with status "scope-defined"
- Objective type classified

## Actions

### 1. Load Passive Context

Read these files (if they exist) and extract relevant sections:

- `CLAUDE.md` — repo conventions and routing (always loaded, but re-read relevant sections)
- Relevant skill descriptions (from CLAUDE.md routing tree for this objective type)
- `docs/ARCHITECTURE.md` — structural context
- Relevant specs from `docs/specs/` matching the scope
- Relevant ADRs from `docs/decisions/` matching the scope

### 2. Build Artifact Cache

Cache expensive-to-reconstruct facts so later gates don't re-derive them.
Use Read/Grep/Glob to extract information, then cache via artifact commands:

```bash
# Cache conventions relevant to this objective
# (Lead: use Read tool on CLAUDE.md, .claude/rules/, relevant specs —
#  extract sections matching the objective type, then cache the result)
plugins/exodia/scripts/smart/session-state.sh artifact add "conventions" \
  "CONTENT_FROM_READ_TOOL_HERE"

# Cache dependency/API surface info
# (Lead: use Grep to find imports, exports, public interfaces in scope files)
plugins/exodia/scripts/smart/session-state.sh artifact add "api-surface" \
  "CONTENT_FROM_GREP_RESULTS_HERE"

# Cache file relationships
# (Lead: use Glob to map directory structure, Grep for import/require statements)
plugins/exodia/scripts/smart/session-state.sh artifact add "dependencies" \
  "CONTENT_FROM_ANALYSIS_HERE"
```

The placeholders above are filled by the lead using Read, Grep, and Glob tools — not by
shell functions. Subagents at later gates receive these artifacts via their spawn prompts.

### 3. Identify Guardrails

| Guardrail | Source | Example |
|-----------|--------|---------|
| Allowed tools | Skill frontmatter, CLAUDE.md | "Task, Bash, TodoWrite" |
| Forbidden patterns | .claude/rules/, CLAUDE.md | "No DateTime.Now, no Newtonsoft" |
| Quality bars | CLAUDE.md workflow section | "weave-validate.sh must pass" |
| Output formats | Skill descriptions | "GATE template, FINAL REPORT template" |

### 4. Verify Assumptions (0-2 agents if needed)

If the objective involves versions, dates, APIs, or "current" state — verify before acting:

> subagent: metacognitive-guard:deep-think-partner
>
> You are **assumption-verifier**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE | TYPE: $TYPE
>
> Verify these assumptions about the codebase:
> [Lead: list the specific assumptions from Gate 1 scope document
> and context loading. Examples: "project uses .NET 10", "tests run
> via `npm test`", "no breaking API changes since v2.0".
> Subagents have NO conversation history — inject everything here.]
>
> For each assumption:
> 1. Is this still true? (check files, check dates)
> 2. WebSearch for any version/date/status claims
> 3. Confidence level (high/medium/low)
>
> Output: Verified facts only. Flag anything uncertain.

### 5. Log Initial Decisions

```bash
plugins/exodia/scripts/smart/session-state.sh decision "context-approach" \
  "Loaded [n] context files, cached [n] artifacts, verified [n] assumptions"

plugins/exodia/scripts/smart/session-state.sh decision "guardrails-identified" \
  "Tools: [list] | Forbidden: [list] | Quality bar: [description]"
```

## Output Schema

```json
{
  "gate": 2,
  "context_files_loaded": 0,
  "artifacts_cached": 0,
  "assumptions_verified": 0,
  "assumptions_failed": 0,
  "guardrails": {
    "allowed_tools": [],
    "forbidden_patterns": [],
    "quality_bars": []
  }
}
```

## Exit Condition

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 2 "context-loaded" \
  "artifacts=$(find .eight-gates/artifacts -maxdepth 1 -type f | wc -l)" \
  "assumptions_verified=[n]" \
  "assumptions_failed=[n]"
```

**PROCEED** if context loaded and no critical assumptions failed.
**HALT** if a critical assumption is wrong → escalate to user with evidence.
