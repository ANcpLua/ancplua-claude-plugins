# metacognitive-guard

A cognitive amplification stack for Claude Code that prevents hallucinations,
improves reasoning quality, and escalates complex problems to specialized
deep-thinking agents.

## The Problem

Claude has inherent limitations that cause systematic errors:

1. **Stale training data** - Version info, release dates, and API status are often wrong
2. **Poor self-assessment** - Claude does not reliably know when it is struggling
3. **False confidence** - Claims "it works" without verification
4. **Surface-level analysis** - Complex problems get incomplete treatment

## The Solution

A layered defense system that operates at multiple cognitive levels:

```text
Layer 0: HOOKS - Block wrong OUTPUT
         |
         +-- truth-beacon.sh (SessionStart) - Inject facts before generation
         +-- epistemic-guard.sh (PreToolUse) - Block incorrect writes
         +-- struggle-detector.sh (Stop) - Detect uncertainty patterns
         |
Layers 1-5: SKILLS - Prevent wrong REASONING
         |
         +-- epistemic-checkpoint - Verify before believing
         +-- competitive-review - Dual-agent analysis
         +-- metacognitive-guard - Self-assessment
         +-- verification-before-completion - Prove before claiming
```

## Installation

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install metacognitive-guard@ancplua-claude-plugins
```

## Components

### Agents

| Agent | Focus | Purpose |
|-------|-------|---------|
| `arch-reviewer` | Architecture | Finds SOLID violations, dependency issues, SSOT violations, layer boundaries |
| `impl-reviewer` | Implementation | Finds banned APIs, version errors, null checks; fact-checks with WebSearch |
| `deep-think-partner` | Deep reasoning | Systematic analysis for complex problems with structured output |

### Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `competitive-review` | Before creating/modifying code | Dispatches arch-reviewer and impl-reviewer in parallel competition |
| `epistemic-checkpoint` | Questions involving versions/dates/status | Forces WebSearch verification before forming beliefs |
| `metacognitive-guard` | Complex problems with competing constraints | Self-assessment and proactive escalation guidance |
| `verification-before-completion` | Before claiming "done" or "works" | Requires actual build/test output before success claims |

### Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `truth-beacon.sh` | SessionStart | Injects authoritative facts (runtime versions, banned APIs) before generation |
| `epistemic-guard.sh` | PreToolUse (Write/Edit) | Blocks writing incorrect version claims or banned APIs |
| `struggle-detector.sh` | Stop | Detects hedging/uncertainty patterns; suggests deep-think-partner |

## How It Works

### Struggle Detection

The `struggle-detector.sh` hook analyzes responses for uncertainty signals:

| Signal | Pattern | Score |
|--------|---------|-------|
| Hedging | "I think", "probably", "might be" | +2 per instance |
| Deflecting | Many questions, short response | +2 per question |
| Verbose | >400 words, <2 code blocks | +5 base + scaling |
| Contradiction | "but actually", "wait,", "I was wrong" | +15 |
| Apologetic | "sorry", "my mistake", "let me try again" | +8 per apology |
| Weaseling | "generally", "it depends", "typically" | +3 per instance |
| Restarting | "let me start over", "different approach" | +20 |
| No recommendation | Long response without clear advice | +8 |
| Tool use | "let me read/search/check..." | -5 (negative) |

**Trigger conditions:**

- Single response score > 25
- OR 2+ consecutive responses with score > 10

### Epistemic Guard

The `epistemic-guard.sh` hook blocks writes containing:

- Incorrect version claims (e.g., claiming LTS releases are still in beta)
- Banned APIs (legacy date/time APIs, legacy locking patterns, legacy JSON libraries)

See `blackboard/assertions.yaml` for the complete list of blocked patterns and their modern replacements.

### Competitive Review

The `competitive-review` skill creates a competition between two specialized agents:

```text
User question
     |
     +-- arch-reviewer (parallel) --> Architecture issues
     +-- impl-reviewer (parallel) --> Implementation issues + fact-checking
     |
     v
Merged results (deduplicated, scored)
     |
     v
deep-think-partner (receives verified context)
```

Competition framing ("whoever finds more issues gets promoted") increases thoroughness.

### Deep-Think Partner

When spawned, the `deep-think-partner` agent:

1. **Crystallizes** the problem to essential structure
2. **Maps** the solution space (dimensions, boundaries, attractors)
3. **Explores** 3+ distinct approaches in parallel
4. **Tests** each path adversarially (steel-man, red-team, edge-probe)
5. **Synthesizes** into actionable output with confidence levels

Returns structured output compatible with TodoWrite for immediate execution.

## Usage Examples

### Automatic Struggle Detection

```text
User: "Should I use event sourcing or CQRS for the span ingestion pipeline?"

Claude: [Hedging response with uncertainty...]

[struggle-detector.sh triggers]

Claude: "I'm finding this complex. Want me to spawn a deep-thinker
for a more thorough analysis?"
```

### Competitive Review (Manual)

```text
User: "Review this implementation before I merge"

Claude: "I'm dispatching two competing reviewers to analyze this."

[arch-reviewer and impl-reviewer run in parallel]

Claude: "Review Competition Results:

| Reviewer | Issues Found | HIGH | MED | LOW |
|----------|--------------|------|-----|-----|
| arch-reviewer | 3 | 0 | 2 | 1 |
| impl-reviewer | 4 | 1 | 2 | 1 |

Winner: impl-reviewer (1 HIGH vs 0 HIGH)

Combined Issues:
1. HIGH [impl]: Wrong version assumption detected
2. MED [arch]: Extension methods in wrong project
..."
```

### Epistemic Checkpoint

```text
User: "What version of .NET should I target?"

[epistemic-checkpoint skill activates]

Claude: "Epistemic Checkpoint

Claim to verify: Current .NET LTS version
Source checked: WebSearch + assertions.yaml
Verified fact: .NET 10 is LTS since November 2025

Proceeding with verified baseline..."
```

## Configuration

### Ground Truth Assertions

The plugin includes default assertions in `blackboard/assertions.yaml`. This file defines:

- **Runtime versions** - Current .NET and C# versions with release dates
- **Banned APIs** - Legacy patterns that should be replaced with modern alternatives
- **Authority levels** - Whether facts are authoritative, verified, or tentative

Override with user-level assertions at `~/.claude/assertions.yaml`.

### Tunable Parameters

Adjust in `hooks/scripts/struggle-detector.sh`:

| Parameter | Default | Purpose |
|-----------|---------|---------|
| Score threshold | 25 | Single-response trigger |
| Consecutive threshold | 2 | Multi-response trigger |
| Hedging weight | 2x count | Uncertainty penalty |
| Verbose threshold | 400 words | Rambling detection |

## Architecture

```text
metacognitive-guard/
|-- .claude-plugin/
|   `-- plugin.json              # Plugin manifest
|-- agents/
|   |-- arch-reviewer.md         # Architecture analysis agent
|   |-- deep-think-partner.md    # Deep reasoning agent (Opus)
|   `-- impl-reviewer.md         # Implementation analysis agent
|-- blackboard/
|   `-- assertions.yaml          # Ground truth facts
|-- hooks/
|   |-- hooks.json               # Hook configuration
|   `-- scripts/
|       |-- epistemic-guard.sh   # PreToolUse blocker
|       |-- struggle-detector.sh # Stop response analyzer
|       `-- truth-beacon.sh      # SessionStart fact injection
|-- skills/
|   |-- competitive-review/
|   |   `-- SKILL.md             # Dual-agent competition
|   |-- epistemic-checkpoint/
|   |   `-- SKILL.md             # Version/date verification
|   |-- metacognitive-guard/
|   |   `-- SKILL.md             # Self-escalation guidance
|   `-- verification-before-completion/
|       `-- SKILL.md             # Pre-completion verification
`-- README.md
```

## Results

**Before (typical complex question):**

- 80-120k tokens
- Multiple back-and-forth exchanges
- Gradually improving but unfocused answers
- Wrong version assumptions go undetected

**After (with metacognitive-guard):**

- 30-40k tokens
- Single deep analysis with verified facts
- Structured, actionable recommendations
- Wrong assumptions blocked or corrected

**3-4x token efficiency** on complex architectural and design questions.

## Why This Works

1. **External detection beats self-assessment** - Claude's metacognition is imperfect.
   External pattern matching catches struggle Claude does not notice.

2. **Proactive injection beats reactive correction** - The truth beacon establishes facts BEFORE wrong beliefs form.

3. **Competition increases thoroughness** - Agents try harder when told they are competing against each other.

4. **Verification prevents false confidence** - Requiring actual test output eliminates "should work" claims.

5. **Layered defense provides redundancy** - If one layer fails, others catch the error.

## Limitations

- **False positives** - Some hedging is appropriate epistemic humility
- **Threshold tuning** - The 25-point threshold may need calibration for different question types
- **Scope** - Default assertions are .NET focused; customize for other stacks

## Contributing

Areas of interest:

- Additional signal detection patterns
- Threshold calibration data
- Stack-specific assertion files
- Alternative escalation agents

## License

MIT
