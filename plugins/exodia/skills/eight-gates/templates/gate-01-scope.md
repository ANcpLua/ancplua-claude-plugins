# Gate 1: 開門 KAIMON — SCOPE

> Before tools. Before code. Before "analysis."
> Define the arena. If the scope can't be made crisp, the gate stays closed.
> This prevents the classic failure mode: the agent starts sprinting in a random direction.

## Entry Condition

- Session initialized (`$SESSION_ID` exists)
- Objective provided (`$0`)

## Actions

### 1. Inventory Scope

```bash
# Count files in scope
find "$1" -type f \
  | grep -v node_modules \
  | grep -v .git \
  | grep -v __pycache__ \
  | grep -v '.eight-gates' \
  > .eight-gates/artifacts/scope.txt

wc -l < .eight-gates/artifacts/scope.txt
```

### 2. Produce Scope Statement

| Field | Value |
|-------|-------|
| **Goal** | What are we trying to achieve? (one sentence) |
| **In scope** | Files, directories, components (explicit list) |
| **Out of scope** | What we will NOT touch (explicit list) |
| **Success criteria** | How do we know we're done? (testable) |
| **Risk level** | Low / Medium / High |
| **Stop condition** | When to HALT rather than thrash |

The stop condition is critical. Examples:

- "HALT if root cause not found after 3 agents"
- "HALT if scope grows beyond 50 files"
- "HALT if build fails twice after fix attempt"

### 3. Estimate Work + Agent Ceiling

| Estimate | Files | Agent Ceiling | Rounds |
|----------|-------|---------------|--------|
| S (small) | <20 | 4 | 1 |
| M (medium) | 20-100 | 8 | 1 |
| L (large) | 100-500 | 12 | 1-2 |
| XL (extra large) | 500+ | 12 | multi-round |

### 4. Auto-Classify Objective Type

```text
IF $0 matches "fix|bug|error|crash|fail"         → type=BUG
IF $0 matches "audit|review|scan|check"           → type=AUDIT
IF $0 matches "add|create|implement|feature"      → type=FEATURE
IF $0 matches "clean|remove|delete|dead|suppress"  → type=CLEANUP
ELSE                                               → type=CUSTOM
```

The type determines which agent prompts Gate 3 uses.

### 5. Detect Smart Targets

```bash
# Check for frontend files (may trigger goggles at Gate 8)
FRONTEND_COUNT=$(grep -cE '\.(tsx|jsx|css|html|svelte|vue)$' .eight-gates/artifacts/scope.txt || true)

# Check for test files
TEST_COUNT=$(grep -cE '(test|spec)\.' .eight-gates/artifacts/scope.txt || true)

# Check for config files
CONFIG_COUNT=$(grep -cE '\.(json|yaml|yml|toml|ini|env)$' .eight-gates/artifacts/scope.txt || true)
```

Log these counts — they inform agent selection at later gates.

## Output Schema

```json
{
  "gate": 1,
  "scope": {
    "in": ["list of paths"],
    "out": ["list of excluded paths"],
    "file_count": 0,
    "frontend_count": 0,
    "test_count": 0
  },
  "objective": {
    "goal": "one sentence",
    "type": "BUG|AUDIT|FEATURE|CLEANUP|CUSTOM",
    "success_criteria": "testable statement",
    "stop_condition": "when to halt"
  },
  "estimate": "S|M|L|XL",
  "agent_ceiling": 8,
  "rounds": 1,
  "risk": "low|medium|high"
}
```

## Exit Condition

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 1 "scope-defined" \
  "files=$(wc -l < .eight-gates/artifacts/scope.txt | tr -d ' ')" \
  "type=[BUG|AUDIT|FEATURE|CLEANUP|CUSTOM]" \
  "estimate=[S|M|L|XL]" \
  "agents=[4|8|12]" \
  "risk=[low|medium|high]"
```

**PROCEED** if scope is clear.
**HALT** if scope is ambiguous → ask user to clarify.
