# code-simplifier

Code simplification agent tuned to qyl engineering principles.

## Philosophy

Elegance = problem complexity / solution complexity. High ratio is good. This agent finds low-ratio code and fixes it.

## How it differs from Anthropic's code-simplifier

| Aspect | Anthropic | qyl-tuned |
|--------|-----------|-----------|
| Language | JS/React-centric (ES modules, arrow functions, Props types) | Language-agnostic — reads CLAUDE.md |
| Standards | Hardcoded conventions | Project's CLAUDE.md is the source of truth |
| Elegance metric | None — general "clarity" | Problem complexity / solution complexity ratio |
| Suppression | Not mentioned | Zero tolerance — fix the code, not the warning |
| Abstractions | "Maintain balance" | Less code is better. Delete before abstracting |
| Type safety | Not mentioned | Compile-time over runtime. Make invalid states unrepresentable |

## Agent

| Agent | Model | Purpose |
|-------|-------|---------|
| `code-simplifier` | Opus | Simplify recently modified code |

## Usage

The agent activates when the skill `simplify` is invoked. It reads the project's CLAUDE.md, identifies recent changes, scores elegance, and simplifies candidates.
