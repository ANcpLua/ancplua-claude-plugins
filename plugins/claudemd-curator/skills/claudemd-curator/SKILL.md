---
name: claudemd-curator
description: Audit and improve project-memory artifacts (CLAUDE.md, AGENTS.md, .claude/rules/*.md, .claude.local.md). Use when the user asks to check, audit, update, improve, or fix CLAUDE.md or AGENTS.md files, or mentions "project memory", "memory optimization", "Codex AGENTS.md sync", or ".claude/rules". Discovers all known artifacts, scores each against the rubric, prints a report, and makes targeted updates only after approval.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# claudemd-curator

Audit, evaluate, and improve project-memory artifacts across a codebase so Claude Code (and Codex / Codeium / ChatGPT, which read `AGENTS.md`) have optimal project context.

**This skill can write to memory files.** After presenting a quality report and getting user approval, it updates `CLAUDE.md`, `AGENTS.md`, `.claude.local.md`, or files under `.claude/rules/` with targeted improvements.

`MEMORY.md` (the auto-memory index under `~/.claude/projects/*/memory/`) is recognised but **never rewritten by this skill** — it is owned by the Claude Code memory subsystem and has its own format with frontmatter.

## Workflow

### Phase 1: Discovery

Find all project-memory artifacts in the repository:

```bash
{
  find . \( -name "CLAUDE.md" -o -name "AGENTS.md" -o -name ".claude.md" -o -name ".claude.local.md" \) 2>/dev/null
  find . -path "*/.claude/rules/*.md" 2>/dev/null
}
```

Discovery is exhaustive for the current repository. Do not sample or truncate the file list before scoring artifacts.

**File Types & Locations:**

| Type | Location | Purpose |
|------|----------|---------|
| Project root (Claude) | `./CLAUDE.md` | Primary project context for Claude Code (checked into git, shared with team) |
| Project root (Codex) | `./AGENTS.md` | Project context for Codex / OpenAI / Codeium tooling — peer of CLAUDE.md, treated as authoritative for those tools |
| Local overrides | `./.claude.local.md` | Personal/local settings (gitignored, not shared) |
| Auto-loaded rules | `./.claude/rules/*.md` | Every `.md` under this directory is auto-loaded by Claude Code into the system prompt |
| Global defaults | `~/.claude/CLAUDE.md` | User-wide defaults across all projects |
| Package-specific | `./packages/*/CLAUDE.md` | Module-level context in monorepos |
| Subdirectory | Any nested location | Feature/domain-specific context |
| Auto-memory index | `~/.claude/projects/*/memory/MEMORY.md` | Auto-memory pointer file — **read-only awareness**, this skill never rewrites it |

**Notes:**
- Claude auto-discovers `CLAUDE.md` files in parent directories, making monorepo setups work automatically.
- `AGENTS.md` is the convention used by Codex, OpenAI Codex CLI, and Codeium / Continue. When both `CLAUDE.md` and `AGENTS.md` exist, treat them as a pair: the same facts may need to live in both, but each file should be self-contained because each tool reads only its own.
- `.claude/rules/*.md` files are loaded as a flat set; ordering across files is not guaranteed. Keep each rule file independently coherent.

### Phase 2: Quality Assessment

For each discovered project-memory artifact (`CLAUDE.md`, `AGENTS.md`, `.claude.local.md`, `.claude/rules/*.md`), evaluate against quality criteria. See [references/quality-criteria.md](references/quality-criteria.md) for detailed rubrics.

**Quick Assessment Checklist:**

| Criterion | Weight | Check |
|-----------|--------|-------|
| Commands/workflows documented | High | Are build/test/deploy commands present? |
| Architecture clarity | High | Can Claude understand the codebase structure? |
| Non-obvious patterns | Medium | Are gotchas and quirks documented? |
| Conciseness | Medium | No verbose explanations or obvious info? |
| Currency | High | Does it reflect current codebase state? |
| Actionability | High | Are instructions executable, not vague? |

**Quality Scores:**
- **A (90-100)**: Comprehensive, current, actionable
- **B (70-89)**: Good coverage, minor gaps
- **C (50-69)**: Basic info, missing key sections
- **D (30-49)**: Sparse or outdated
- **F (0-29)**: Missing or severely outdated

### Phase 3: Quality Report Output

**ALWAYS output the quality report BEFORE making any updates.**

Format:

```
## Project Memory Quality Report

### Summary
- Files found: X (CLAUDE.md, AGENTS.md, .claude.local.md, .claude/rules/*.md discovered)
- Average score: X/100
- Files needing update: X

### File-by-File Assessment

#### 1. ./CLAUDE.md (Project Root - Claude)
**Score: XX/100 (Grade: X)**

| Criterion | Score | Notes |
|-----------|-------|-------|
| Commands/workflows | X/20 | ... |
| Architecture clarity | X/20 | ... |
| Non-obvious patterns | X/15 | ... |
| Conciseness | X/15 | ... |
| Currency | X/15 | ... |
| Actionability | X/15 | ... |

**Issues:**
- [List specific problems]

**Recommended additions:**
- [List what should be added]

#### 2. ./AGENTS.md (Project Root - Codex/OpenAI/Codeium)
[Same format, scored against the same rubric]

#### 3. ./.claude.local.md (Local overrides)
[Same format if present]

#### 4. ./.claude/rules/<rule>.md (Auto-loaded rules)
[One assessment per discovered rule file]

[Repeat for all discovered memory artifacts]
...
```

### Phase 4: Targeted Updates

After outputting the quality report, ask user for confirmation before updating.

**Update Guidelines (Critical):**

1. **Propose targeted additions only** - Focus on genuinely useful info:
   - Commands or workflows discovered during analysis
   - Gotchas or non-obvious patterns found in code
   - Package relationships that weren't clear
   - Testing approaches that work
   - Configuration quirks

2. **Keep it minimal** - Avoid:
   - Restating what's obvious from the code
   - Generic best practices already covered
   - One-off fixes unlikely to recur
   - Verbose explanations when a one-liner suffices

3. **Show diffs** - For each change, show:
   - Which project-memory artifact to update
   - The specific addition (as a diff or quoted block)
   - Brief explanation of why this helps future sessions

**Diff Format:**

```markdown
### Update: ./CLAUDE.md

**Why:** Build command was missing, causing confusion about how to run the project.

```diff
+ ## Quick Start
+
+ ```bash
+ npm install
+ npm run dev  # Start development server on port 3000
+ ```
```
```

### Phase 5: Apply Updates

After user approval, apply changes using the Edit tool. Preserve existing content structure.

## Templates

See [references/templates.md](references/templates.md) for CLAUDE.md templates by project type.

## Common Issues to Flag

1. **Stale commands**: Build commands that no longer work
2. **Missing dependencies**: Required tools not mentioned
3. **Outdated architecture**: File structure that's changed
4. **Missing environment setup**: Required env vars or config
5. **Broken test commands**: Test scripts that have changed
6. **Undocumented gotchas**: Non-obvious patterns not captured

## User Tips to Share

When presenting recommendations, remind users:

- **`#` key shortcut**: During a Claude session, press `#` to have Claude auto-incorporate learnings into CLAUDE.md
- **Keep it concise**: CLAUDE.md should be human-readable; dense is better than verbose
- **Actionable commands**: All documented commands should be copy-paste ready
- **Use `.claude.local.md`**: For personal preferences not shared with team (add to `.gitignore`)
- **Global defaults**: Put user-wide preferences in `~/.claude/CLAUDE.md`

## What Makes a Great CLAUDE.md

**Key principles:**
- Concise and human-readable
- Actionable commands that can be copy-pasted
- Project-specific patterns, not generic advice
- Non-obvious gotchas and warnings

**Recommended sections** (use only what's relevant):
- Commands (build, test, dev, lint)
- Architecture (directory structure)
- Key Files (entry points, config)
- Code Style (project conventions)
- Environment (required vars, setup)
- Testing (commands, patterns)
- Gotchas (quirks, common mistakes)
- Workflow (when to do what)
