---
name: example-skill
description: 'IF [primary trigger condition] THEN use this. IF [secondary trigger] THEN this. IF [tertiary trigger] THEN this. IF [edge case or alternate flag like --goggles] THEN this. IF [user mentions specific phrase] THEN this. [One-sentence summary of what the skill does and what it produces]. Generates / uses [concrete artifacts: file types, ledger names, tool outputs]. [Concurrency or scale hint, e.g., "4 teammates per phase + equipment adds 1-3"].'
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
effort: medium
---

# Example Skill

This is a template skill. Replace this content with your actual skill documentation.

## Overview

Describe what this skill does and why it exists.

## Frontmatter pattern (hades-style)

High-scoring skill descriptions (Gold under deterministic graders like TomeVault) stack **multiple IF/THEN trigger clauses** rather than one prose sentence. Structure:

1. **4–6 `IF X THEN this` clauses** covering primary, secondary, and edge-case triggers
2. **One-sentence summary** of what the skill does and produces
3. **Named artifacts** the skill generates or uses (file types, ledger names, output formats)
4. **Concurrency / scale hint** if relevant (e.g., "4 teammates per phase")
5. **`allowed-tools:`** explicitly listing tools used (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Task`, `WebSearch`, etc.)
6. **`effort:`** field (`low | medium | high | xhigh | max`) to signal complexity

Canonical example: `plugins/exodia/skills/hades/SKILL.md` — 6 IF/THEN clauses, named artifacts (Smart ID, deletion permit, audit ledger, break manifest), concurrency hint (4 teammates per phase).

## When to use this skill

List the situations where this skill should be activated. Use **IF [condition] THEN [action]** trigger language — TomeVault and other deterministic graders reward multi-trigger descriptions, and the IF/THEN pattern composes well with the description's leading clauses:

- IF [specific condition] THEN use this
- IF [alternate condition] THEN this
- IF [edge case or alternate flag] THEN this
- IF [user mentions specific phrase] THEN this

## Protocol

```text
1. First step
   └─> Details about step 1

2. Second step
   └─> Details about step 2

3. Third step
   └─> Details about step 3
```

## Examples

### Good example

```text
User: [example request]
Claude: [example response following the skill]
```

### Bad example

```text
User: [example request]
Claude: [example of what NOT to do]
```

## Red flags

If you catch yourself thinking:

- "This doesn't apply here" - STOP. Check again.
- "I'll skip this step" - STOP. Follow the protocol.
- "It's too complex" - STOP. Break it down.

## Requirements

- Requirement 1
- Requirement 2

## Related

- Link to related skill
- Link to related documentation
