# metacognitive-guard

Detects when Claude is struggling and escalates to deep-thinking agents for better responses with fewer tokens.

## The Problem

Claude doesn't reliably know when it's struggling. Complex questions often produce:

- Verbose, hedging responses ("I think", "probably", "it depends")
- Multiple back-and-forth exchanges before reaching a useful answer
- 80-120k tokens spent on questions that could be answered in 30-40k

## The Solution

This plugin creates a **metacognitive feedback loop**:

```
Claude responds
       |
       v
struggle-detector.sh analyzes response
       |
       +-- Detects: "4x hedging, 2x weaseling, no code" -> score = 18
       |
       v (next response)
       +-- "3x apologetic, contradiction" -> score = 30, consecutive = 2
       |
       v
Injects: <struggle-detected>
       |
       v
Claude (next turn) sees signal -> offers to spawn deep-think-partner
       |
       v
Deep analysis in isolated context -> structured, actionable output
```

## How It Works

### Detection Signals

| Signal        | Pattern                                           | Score           |
| ------------- | ------------------------------------------------- | --------------- |
| Hedging       | "I think", "probably", "might be", "I'm not sure" | +2 per instance |
| Deflecting    | Many questions, short response                    | +3 per question |
| Verbose       | >400 words, <2 code blocks                        | +10             |
| Contradiction | "but actually", "wait,", "I was wrong"            | +15             |
| Apologetic    | "sorry", "my mistake", "let me try again"         | +5 per apology  |
| Weaseling     | "generally", "it depends", "typically"            | +2 per instance |

### Trigger Conditions

- Score > 25 (single response)
- OR 2+ consecutive struggling responses (score > 10)

### The Deep-Think Partner Agent

When triggered, the `deep-think-partner` agent:

1. **Crystallizes** the problem to essential structure
2. **Maps** the solution space (dimensions, boundaries, attractors)
3. **Explores** 3+ distinct approaches in parallel
4. **Tests** each path adversarially (steel-man, red-team, edge-probe)
5. **Synthesizes** into actionable output with confidence levels

Returns structured output compatible with TodoWrite for immediate execution.

## Installation

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install metacognitive-guard@ancplua-claude-plugins
```

## Results

**Before (typical complex question):**

- 80-120k tokens
- Multiple back-and-forth exchanges
- Gradually improving but unfocused answers

**After (with metacognitive-guard):**

- 30-40k tokens
- Single deep analysis
- Structured, actionable recommendations

**3-4x token efficiency** on complex architectural and design questions.

## Example

**Test Question:**

> "Should I use event sourcing or CQRS for the span ingestion pipeline? What are all the trade-offs considering DuckDB's append-only nature, our SSE streaming requirements, and potential future sharding?"

**Without plugin:** Claude hedges, gives surface-level comparison, requires follow-ups.

**With plugin:** Struggle detected on ambiguity -> deep-think-partner spawned -> comprehensive analysis with:

- Trade-off tables
- Implementation plan with checkpoints
- Sharding strategy
- Clear recommendation with rationale

## Configuration

The plugin works out-of-the-box with sensible defaults. Signal weights and thresholds can be adjusted in `hooks/scripts/struggle-detector.sh`.

### Tunable Parameters

| Parameter             | Default   | Purpose                 |
| --------------------- | --------- | ----------------------- |
| Score threshold       | 25        | Single-response trigger |
| Consecutive threshold | 2         | Multi-response trigger  |
| Hedging weight        | 2x count  | Uncertainty penalty     |
| Verbose threshold     | 400 words | Rambling detection      |

## Architecture

```
metacognitive-guard/
|-- .claude-plugin/
|   `-- plugin.json          # Plugin manifest
|-- agents/
|   `-- deep-think-partner.md # Deep reasoning agent (Opus model)
|-- hooks/
|   |-- hooks.json           # Stop event hook config
|   `-- scripts/
|       `-- struggle-detector.sh  # Response analyzer
`-- README.md
```

### Component Interaction

```
                    +------------------+
                    |   User Question  |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |  Claude Response |
                    +--------+---------+
                             |
                             v
              +-----------------------------+
              |   struggle-detector.sh      |
              |   (Stop hook, analyzes      |
              |    response for signals)    |
              +-------------+---------------+
                            |
            +---------------+---------------+
            |                               |
            v                               v
    +---------------+            +---------------------+
    | score <= 25   |            | score > 25 OR       |
    | Reset counter |            | consecutive >= 2    |
    +---------------+            +----------+----------+
                                            |
                                            v
                              +---------------------------+
                              | Inject <struggle-detected>|
                              | into next turn context    |
                              +-------------+-------------+
                                            |
                                            v
                              +---------------------------+
                              | Claude offers to spawn    |
                              | deep-think-partner agent  |
                              +-------------+-------------+
                                            |
                                            v
                              +---------------------------+
                              | Deep analysis in isolated |
                              | context (Opus model)      |
                              +-------------+-------------+
                                            |
                                            v
                              +---------------------------+
                              | Structured output with    |
                              | recommendations, plan,    |
                              | confidence levels         |
                              +---------------------------+
```

## Why This Works

1. **External detection beats self-assessment**: Claude's metacognition is imperfect. External pattern matching catches struggle Claude doesn't notice.

2. **Agent isolation improves reasoning**: The deep-think-partner gets a clean context without conversation management overhead, leading to more coherent analysis.

3. **Token efficiency through escalation**: Rather than rambling and self-correcting in the main thread, work happens in a subprocess that returns a clean result.

4. **Structured output enables action**: The mandatory output format integrates with TodoWrite for immediate execution.

## Limitations

- **False positives**: Some hedging is appropriate epistemic humility
- **Threshold tuning**: The 25-point threshold may need calibration for different question types
- **Agent routing**: Currently always escalates to deep-think-partner; future versions could route to different agents based on problem type

## Contributing

Contributions welcome! Areas of interest:

- Additional signal detection patterns
- Threshold calibration data
- Alternative escalation agents
- Integration with other plugins

## License

MIT
