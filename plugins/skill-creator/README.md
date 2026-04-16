# skill-creator

Create, evaluate, and iteratively improve Claude Code skills.

## Quick Start

```
/skill-creator "build a skill for X"
```

## What It Does

Full skill lifecycle: capture intent, scaffold, write, test, evaluate, benchmark, improve descriptions, package for distribution.

## Layout

```
skills/skill-creator/
├── SKILL.md              — core workflow (~400 lines)
├── scripts/              — 11 Python scripts (init, validate, package, eval, benchmark)
├── references/           — detailed guides loaded on demand
├── agents/               — subagent prompts (grader, comparator, analyzer)
└── assets/               — HTML viewers (eval review, output review)
```

## Requirements

- **Full features**: Claude Code with subagents, `claude -p` CLI, Python 3.10+
- **Core creation**: Works in Claude.ai and Cowork with reduced eval capabilities
