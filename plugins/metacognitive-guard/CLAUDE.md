# metacognitive-guard

Cognitive amplification stack. Hooks prevent wrong output, commands prevent wrong reasoning,
agents amplify thinking. Absorbs completion-integrity and autonomous-ci.

## Hooks (Layer 0)

| Hook | Event | Script | Purpose |
|------|-------|--------|---------|
| Truth Beacon | SessionStart + InstructionsLoaded | `truth-beacon.sh` | Injects `blackboard/assertions.yaml` as authoritative facts |
| Epistemic Guard | PreToolUse (Write/Edit) | `epistemic-guard.sh` | Blocks writes with wrong versions, banned APIs, AGENTS.md in plugins |
| Commit Integrity | PreToolUse (Bash) | `commit-integrity-hook.sh` | Blocks `git commit` with suppressions, commented tests, deleted assertions |
| Struggle Detector | Stop (async) | `struggle-detector.sh` | Scores response for uncertainty, writes to blackboard |
| Struggle Inject | UserPromptSubmit | `struggle-inject.sh` | Reads blackboard, injects deep-think suggestion as `additionalContext` |
| Objective Watch | UserPromptSubmit + PostToolUse (Bash/Task/Read/Grep/Glob/Write/Edit) | `objective-watch.py` | Tracks one lead-agent anchor in `.blackboard/objective.json` and injects a short reminder before silent pivots to another spec, orchestration flow, or shipping step |
| Ralph Loop | PostToolUse (Write/Edit) | prompt (haiku) + `ralph-loop.sh` | Two-layer drift detection: haiku analyzes context (over-engineering, complexity, premature optimization), grep catches surface patterns (TODO, suppressions, catch-all). Both inject via additionalContext. Silent when clean |
| Task Completion Gate | TaskCompleted | prompt (haiku) | Validates task completions in team workflows aren't premature |

## Commands

| Command | Purpose |
|---------|---------|
| `metacognitive-guard` | Self-assessment: when to escalate to deep-think-partner |
| `competitive-review` | Spawns arch-reviewer + impl-reviewer in parallel competition |
| `epistemic-checkpoint` | Forces WebSearch verification for version/date/status claims |
| `verification-before-completion` | Blocks "done" claims without build/test output |
| `deep-analysis` | 4-phase structured thinking: decompose, adversarial review, implement, verify |

## Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `arch-reviewer` | opus | SOLID violations, dependency issues, coupling |
| `impl-reviewer` | opus | Banned APIs, version mismatches, fact-checks with WebSearch |
| `deep-think-partner` | opus | Async reasoning amplifier for complex problems |

## Utility Scripts

| Script | Purpose |
|--------|---------|
| `integrity-check.sh` | Validates staged git changes for 6 shortcut patterns (suppressions, commented tests, deleted assertions, etc.) |
| `verify-local.sh` | Auto-detects project type (dotnet/node/python/go) and runs build+test |
| `wait-for-ci.sh` | Monitors GitHub Actions workflows for a commit until all pass or any fails |

## Key Files

- `blackboard/assertions.yaml`: Ground truth (runtime versions, banned APIs, conventions)
- `.blackboard/`: Runtime state (struggle count, signals) - gitignored
- `.blackboard/objective.json`: Active lead-agent anchor (objective text + optional spec/ADR path)
- `hooks/scripts/`: hook handlers + utility scripts, including `objective-watch.py`

## Notes

- Commit integrity hook fires on every Bash tool call but exits immediately unless the command is `git commit`.
- verify-local.sh and wait-for-ci.sh are utility scripts for the verification workflow, not hook triggers.
- Hades god mode: active delete permit causes epistemic-guard to exit early.
- Struggle detector tracks consecutive struggling responses via `.blackboard/.struggle-count`.
- Struggle detector is a two-part system: Stop hook (async) does analysis + blackboard writes,
  UserPromptSubmit hook reads blackboard and injects `additionalContext` so Claude actually sees the
  suggestion. No latency on responses.
- Struggle detector and Ralph Loop skip subagents via `agent_type` filtering (only lead agent matters).
- Objective Watch is advisory only. It never blocks. It only injects short anchor reminders when the lead agent appears to pivot without explicitly re-anchoring.
- TaskCompleted prompt hook fires on lead agent only (skips subagents via agent_type check).
- Ralph Loop fires PostToolUse on Write/Edit — two layers run in parallel:
  (1) Haiku prompt analyzes context for deep drift (over-engineering, complexity creep, premature
  optimization, unclear naming). (2) Grep script catches surface antipatterns instantly (TODO/HACK,
  suppressions, catch-all, empty catch, 150+ line dumps). Both inject via additionalContext.
  Silent when code is clean. Skips docs/config.
