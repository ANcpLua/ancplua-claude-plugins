# metacognitive-guard

Cognitive amplification stack. 3 layers: hooks prevent wrong output, skills prevent wrong reasoning, agents amplify thinking.

## Hooks (Layer 0)

| Hook | Script | Purpose |
|------|--------|---------|
| SessionStart | `truth-beacon.sh` | Injects `blackboard/assertions.yaml` as authoritative facts |
| PreToolUse | `epistemic-guard.sh` | Blocks writes with wrong versions, banned APIs, AGENTS.md in plugins |
| Stop | `struggle-detector.sh` | Scores response for uncertainty, triggers deep-think suggestion |

## Skills (Layers 1-5)

| Skill | Purpose |
|-------|---------|
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

## Key Files

- `blackboard/assertions.yaml`: Ground truth (runtime versions, banned APIs, conventions)
- `.blackboard/`: Runtime state (struggle count, signals) - gitignored
- `hooks/scripts/`: 3 shell scripts implementing hook logic

## Notes

- Hades god mode: active delete permit causes epistemic-guard to exit early.
- Struggle detector tracks consecutive struggling responses via `.blackboard/.struggle-count`.
- Score >25 or 2+ consecutive struggles >10 triggers deep-think suggestion.
