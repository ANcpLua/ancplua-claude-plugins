---
description: Capture session learnings into CLAUDE.md / AGENTS.md / .claude/rules
allowed-tools: Read, Edit, Glob
---

Review this session for learnings about working with Claude Code (or Codex / Codeium) in this codebase. Update the appropriate project-memory artifact with context that would help future agent sessions be more effective.

Recognised targets in priority order:

| Target | When to write here |
|---|---|
| `./CLAUDE.md` | Primary Claude Code memory; team-shared; checked into git |
| `./AGENTS.md` | Codex / OpenAI / Codeium memory; peer of CLAUDE.md; same facts often need to live in both because each tool reads only its own |
| `./.claude.local.md` | Personal-only; gitignored |
| `./.claude/rules/<name>.md` | Auto-loaded rule file; use when the learning is a standing rule rather than ambient context |

Never write to `~/.claude/projects/*/memory/MEMORY.md` — that file is owned by the Claude Code auto-memory subsystem.

## Step 1: Reflect

What context was missing that would have helped Claude work more effectively?
- Bash commands that were used or discovered
- Code style patterns followed
- Testing approaches that worked
- Environment/configuration quirks
- Warnings or gotchas encountered

## Step 2: Find Project-Memory Files

```bash
{
  find . \( -name "CLAUDE.md" -o -name "AGENTS.md" -o -name ".claude.local.md" \) 2>/dev/null
  find . -path "*/.claude/rules/*.md" 2>/dev/null
} | head -20
```

Decide where each addition belongs:
- `CLAUDE.md` — Team-shared Claude Code memory (checked into git)
- `AGENTS.md` — Team-shared Codex / OpenAI / Codeium memory (checked into git)
- `.claude.local.md` — Personal/local only (gitignored)
- `.claude/rules/<name>.md` — Standing rule, auto-loaded, not narrative context

## Step 3: Draft Additions

**Keep it concise** - one line per concept. CLAUDE.md is part of the prompt, so brevity matters.

Format: `<command or pattern>` - `<brief description>`

Avoid:
- Verbose explanations
- Obvious information
- One-off fixes unlikely to recur

## Step 4: Show Proposed Changes

For each addition:

```
### Update: ./CLAUDE.md

**Why:** [one-line reason]

\`\`\`diff
+ [the addition - keep it brief]
\`\`\`
```

## Step 5: Apply with Approval

Ask if the user wants to apply the changes. Only edit files they approve.
