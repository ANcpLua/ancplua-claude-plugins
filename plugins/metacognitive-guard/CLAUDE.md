# metacognitive-guard

Cognitive amplification stack. Hooks prevent wrong output, commands prevent wrong reasoning,
agents amplify thinking. Absorbs completion-integrity and autonomous-ci.

## Hooks (Layer 0)

| Hook | Event | Script | Purpose |
|------|-------|--------|---------|
| Truth Beacon | SessionStart | `truth-beacon.sh` | Injects `blackboard/assertions.yaml` as authoritative facts |
| Epistemic Guard | PreToolUse (Write/Edit) | `epistemic-guard.sh` | Blocks writes with wrong versions, banned APIs, AGENTS.md in plugins |
| Commit Integrity | PreToolUse (Bash) | `commit-integrity-hook.sh` | Blocks `git commit` with suppressions, commented tests, deleted assertions |
| Struggle Detector | Stop | `struggle-detector.sh` | Scores response for uncertainty, triggers deep-think suggestion |

## Commands

| Command | Purpose |
|---------|---------|
| `metacognitive-guard` | Self-assessment: when to escalate to deep-think-partner |
| `competitive-review` | Spawns arch-reviewer + impl-reviewer in parallel competition |
| `epistemic-checkpoint` | Forces WebSearch verification for version/date/status claims |
| `verification-before-completion` | Blocks "done" claims without build/test output |

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
- `hooks/scripts/`: 7 shell scripts (4 hook handlers + 3 utility scripts)

## Notes

- Commit integrity hook fires on every Bash tool call but exits immediately unless the command is `git commit`.
- verify-local.sh and wait-for-ci.sh are utility scripts for the verification workflow, not hook triggers.
- Hades god mode: active delete permit causes epistemic-guard to exit early.
- Struggle detector tracks consecutive struggling responses via `.blackboard/.struggle-count`.
