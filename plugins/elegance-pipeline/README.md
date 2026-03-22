# elegance-pipeline

Multi-agent code-elegance workflow for Claude Code. Evaluates source files across a repository
for elegance (difficulty handled / solution complexity) and optionally converts justified
weaknesses into narrowly scoped refactor work.

## Pipeline

```text
4 Scouts (parallel, sonnet) -> 2 Judges (parallel, opus) -> 1 Planner (opus)
  -> 1 Verifier (opus) -> 1 Implementer (gated, opus)
```

- **Scouts**: Read-only. Each inspects an assigned scope for elegant code candidates.
- **Judges**: Read-only. Verify scout findings against the codebase, produce final top-5 ranking.
- **Planner**: Read-only. Converts judge verdicts into max 3 actionable refactor tasks.
- **Verifier**: Read-only. Validates the plan is justified and narrow. Controls the implementation gate.
- **Implementer**: Full edit access. Only runs when the verifier approves. Implements the verified plan.

## Setup

```bash
python plugins/elegance-pipeline/elegance_pipeline/pipeline.py --state-dir .claude/elegance_pipeline/dashboard init \
  --project-anchor CLAUDE.md \
  --scope plugins/exodia \
  --scope plugins/metacognitive-guard \
  --scope plugins/hookify \
  --scope plugins/feature-dev
```

## Usage

```text
/elegance-pipeline:status     # Check pipeline state
/elegance-pipeline:run        # Run next ready stage
/elegance-pipeline:run scouts # Run only scout phase
```

## State

Default state is project-local at `.claude/elegance_pipeline/state/`. Not committed to git.
Use `--state-dir` to isolate parallel runs per spec, for example `.claude/elegance_pipeline/dashboard`
and `.claude/elegance_pipeline/mcp`.

Subagent names should be treated as fully qualified runtime IDs:
`elegance-pipeline:elegance-scout`, `elegance-pipeline:elegance-judge`,
`elegance-pipeline:elegance-planner`, `elegance-pipeline:elegance-verifier`,
and `elegance-pipeline:elegance-implementer`.

## Origin

Converted from the Codex `elegance-pipeline-bundle.zip`. All `.codex/` references rewritten
to Claude Code native plugin structure. Codex-Spark -> sonnet, GPT-5.4 -> opus.
Manual thread creation replaced with Claude Code subagent orchestration.
