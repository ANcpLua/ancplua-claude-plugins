# metacognitive-guard

A cognitive amplification stack for Claude Code that prevents hallucinations,
improves reasoning quality, blocks shortcut commits, keeps the lead agent anchored
to its objective, and escalates complex problems to specialized deep-thinking agents.

Absorbs the former `completion-integrity` plugin.

## The Problem

Claude has inherent limitations that cause systematic errors:

1. **Stale training data** - Version info, release dates, and API status are often wrong
2. **Silent objective drift** - The lead agent pivots to a different spec without re-anchoring
3. **False confidence** - Claims "it works" or commits with suppressions/skipped tests
4. **Surface-level analysis** - Complex problems get incomplete treatment

## The Solution

A layered defense system that operates at multiple cognitive levels:

```text
Layer 0: HOOKS - Block or steer wrong OUTPUT
         |
         +-- epistemic-guard (PreToolUse Write/Edit) - Block version/banned-API writes
         +-- commit-integrity-hook (PreToolUse Bash git commit) - Block shortcut commits
         +-- objective-watch (PostToolUse + UserPromptSubmit) - Warn on objective drift
         +-- ralph-loop (PostToolUse Write/Edit) - Inject the right engineering principle
         |
Commands: SKILLS - Prevent wrong REASONING
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
| `epistemic-guard` | PreToolUse (Write/Edit) | Blocks writes that hallucinate the .NET 10 version or use a banned API |
| `commit-integrity-hook` | PreToolUse (Bash `git commit`) | Blocks `git commit` with warning suppressions, commented/skipped tests, bulk TODOs, net assertion loss, or catch-all handlers |
| `objective-watch` | PostToolUse + UserPromptSubmit | Tracks one anchor spec and warns when the lead agent silently pivots to a different one |
| `ralph-loop` | PostToolUse (Write/Edit) | Stays silent on clean code; injects one engineering principle when an antipattern is written |

`commit-integrity-hook` delegates the staged-diff scan to `hooks/scripts/integrity-check.sh`.

## How It Works

### Epistemic Guard

The `epistemic-guard` hook (PreToolUse Write/Edit) scans the content being written
and denies the write with an authoritative correction when it matches a hardcoded
danger pattern. It enforces a fixed subset of the catalog:

- **.NET version hallucination** - content that misstates the current .NET as
  preview / unreleased / non-LTS, or targets the previous TFM
- **`DateTime.Now`/`UtcNow` / `DateTimeOffset.Now`/`UtcNow`** - use `TimeProvider.System.GetUtcNow()`
- **`object _lock = ...`** - use `Lock _lock = new()` (.NET 9+ `Lock` type)
- **`Newtonsoft.Json` / `JsonConvert.`** - use `System.Text.Json`

The banned-API checks fire on code files only; documentation files (`.md`, `.yaml`,
`.yml`, `.json`, `.txt`) and `assertions.yaml` itself are skipped so catalogs and
examples can reference the patterns freely. The version check still applies to all
files. An active Hades `delete-permit.json` bypasses every check.

`blackboard/assertions.yaml` is the human-maintained catalog and seed for these
rules, not a runtime config the hook parses — the four patterns above are hardcoded
in `bin/epistemic-guard`. Keep the two in sync when you add a rule.

### Objective Watch

The `objective-watch` hook (PostToolUse + UserPromptSubmit) tracks a single anchor
document — a spec, ADR, design doc, plan, RFC, or proposal under `docs/specs/`,
`docs/decisions/`, `docs/designs/`, `.feature-dev/`, `.eight-gates/artifacts/`, or
`.smart/artifacts/`, or a `spec-*/adr-*/design-*/plan-*/rfc-*/proposal-*.md`
filename. Once an anchor is set, it warns (as injected context, never a block) when
a later prompt or tool call silently pivots to a *different* spec, kicks off an
orchestration flow, or ships, without explicitly re-anchoring. Warnings are
cooldown-limited per anchor+category, and the hook ignores subagents.

### Ralph Loop

The `ralph-loop` hook (PostToolUse Write/Edit) is silent when code is clean and
injects exactly one engineering principle when the content just written matches an
antipattern:

| Signal | Pattern | Principle |
|--------|---------|-----------|
| Band-aid marker | `TODO`/`FIXME`/`HACK`/`WORKAROUND`/`XXX`/`KLUDGE` | Fix root causes, not symptoms |
| Warning suppression | `#pragma warning disable`, `eslint-disable`, `@ts-ignore`, `# noqa`, `# type: ignore`, ... | Understand why before suppressing |
| Catch-all handler | `catch (Exception ...)`, `except:`, `rescue` | Fail loud and immediately |
| Massive single write | content over 150 lines | Less code = better code |
| Empty catch block | `catch (...) {}`, `except: pass` | Don't swallow errors silently |

Like the other hooks, it skips documentation/config files and ignores subagents.

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

### Automatic Objective-Drift Warning

```text
User: "Implement docs/specs/spec-span-ingestion.md"

[objective-watch sets the anchor]

... later, mid-task ...

Claude: [about to edit docs/specs/spec-retention-policy.md]

[objective-watch injects context]

Note: Primary anchor is still `docs/specs/spec-span-ingestion.md`.
Do not branch to `docs/specs/spec-retention-policy.md` for a different
spec yet. Finish it, explicitly re-anchor, or tell the user you are
abandoning it.
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

`blackboard/assertions.yaml` is a human-maintained catalog of ground truth that
seeds the rules and is read by the model through the `epistemic-checkpoint` and
`competitive-review` skills. It documents:

- **Runtime versions** - Current .NET and C# versions with release dates
- **Banned APIs** - Legacy patterns that should be replaced with modern alternatives
- **Authority levels** - Whether facts are authoritative, verified, or tentative

It is a catalog, not a runtime config: the `epistemic-guard` hook hardcodes its own
subset of these patterns (see [Epistemic Guard](#epistemic-guard)) and does not
parse this file or any `~/.claude/assertions.yaml`. To change what the hook blocks,
edit `bin/epistemic-guard` and update this catalog to match.

### Tunable Parameters

These thresholds are edited directly in the hook source:

| Parameter | Default | Where | Purpose |
|-----------|---------|-------|---------|
| Massive-write threshold | 150 lines | `bin/ralph-loop` | Single-write size that triggers the "less code" principle |
| Warning cooldown | 60 seconds | `bin/objective-watch` | Minimum gap between repeat drift warnings per anchor+category |
| Bulk-TODO threshold | >2 added | `hooks/scripts/integrity-check.sh` | New TODO/FIXME/HACK count that warns on commit |
| Net assertion-loss threshold | >20 net | `hooks/scripts/integrity-check.sh` | Net assertions removed that blocks a commit |

## Architecture

```text
metacognitive-guard/
|-- .claude-plugin/
|   `-- plugin.json              # Plugin manifest
|-- agents/
|   |-- arch-reviewer.md         # Architecture analysis agent
|   |-- deep-think-partner.md    # Deep reasoning agent (Opus)
|   `-- impl-reviewer.md         # Implementation analysis agent
|-- bin/
|   |-- epistemic-guard          # PreToolUse Write/Edit version/banned-API blocker
|   |-- commit-integrity-hook    # PreToolUse Bash git-commit wrapper
|   |-- objective-watch          # PostToolUse + UserPromptSubmit drift watchdog
|   `-- ralph-loop               # PostToolUse Write/Edit principle injection
|-- blackboard/
|   `-- assertions.yaml          # Ground truth catalog (model-read, hook-seeding)
|-- commands/
|   |-- competitive-review.md    # Dual-agent competition
|   |-- epistemic-checkpoint.md  # Version/date verification
|   |-- metacognitive-guard.md   # Self-escalation guidance
|   `-- verification-before-completion.md  # Pre-completion verification
|-- hooks/
|   |-- hooks.json               # Hook configuration (4 hooks)
|   `-- scripts/
|       `-- integrity-check.sh   # Commit integrity engine (called by commit-integrity-hook)
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
   `objective-watch` catches silent objective drift that Claude does not notice.

2. **Blocking at write time beats reactive correction** - `epistemic-guard` denies a
   bad version claim or banned API at the Write/Edit boundary, before it lands on disk.

3. **Competition increases thoroughness** - Agents try harder when told they are competing against each other.

4. **Verification prevents false confidence** - Requiring actual test output eliminates "should work" claims.

5. **Layered defense provides redundancy** - If one layer fails, others catch the error.

## Limitations

- **False positives** - `ralph-loop` may flag a deliberate `TODO` or a large but
  legitimate single write; the principle is advisory context, not a block
- **Hardcoded subset** - `epistemic-guard` enforces a fixed pattern set; add a rule by
  editing `bin/epistemic-guard` and keeping `assertions.yaml` in sync
- **Scope** - Default assertions are .NET focused; customize for other stacks

## Contributing

Areas of interest:

- Additional signal detection patterns
- Threshold calibration data
- Stack-specific assertion files
- Alternative escalation agents

## License

MIT
