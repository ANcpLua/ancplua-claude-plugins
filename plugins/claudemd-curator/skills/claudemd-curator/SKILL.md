---
name: claudemd-curator
description: 'IF auditing CLAUDE.md / AGENTS.md / .claude.local.md / .claude/rules/*.md THEN use this. IF project-memory quality report needed THEN this. IF Codex AGENTS.md and Claude CLAUDE.md have drifted apart THEN this. IF marketplace plugin drift signals need consuming (via capability-snapshot) THEN this. IF .claude/rules/*.md need scoring THEN this. IF "memory optimization" or "project memory" mentioned THEN this. IF multi-repo workspace audit via WORKSPACE_DIRS THEN this. Discovers all memory artifacts, scores each against a 6-criterion rubric (commands, architecture, patterns, conciseness, currency, actionability), prints a report, and makes targeted Edit-tool updates only after approval. MEMORY.md (auto-memory index) is read-only.'
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
effort: medium
---

## MANDATORY ACTIVATION

Use this skill when the user asks for:
- "audit CLAUDE.md" or "check CLAUDE.md"
- "improve project memory" or "optimize memory"
- "sync AGENTS.md" or "Codex AGENTS.md sync"
- "update .claude/rules" or "review .claude/rules"
- "memory quality report"

## FAILURE CONDITIONS

**Skipping the claudemd-curator skill entirely** leaves project memory in a degraded state, causing:

- **Degraded memory quality**: Stale, incomplete, or conflicting instructions in `CLAUDE.md`, `AGENTS.md`, `.claude.local.md`, and `.claude/rules/*.md`
- **Missed rule updates**: Critical commands, patterns, or architecture changes remain undocumented
- **Unsynced cross-tool memory**: Claude Code and Codex/Codeium agents diverge when `CLAUDE.md` and `AGENTS.md` fall out of sync
- **Audit omissions**: Marketplace drift signals (from `marketplace-tour`) go unconsumed, leaving memory guidance mismatched to current plugin capabilities
- **Downstream agent failures**: Other agents operate on outdated commands, obsolete architecture notes, or missing gotchas

**Severity & Escalation**: Treat skipped memory curation as **high severity** when the task depends on repository instructions, cross-tool consistency, or accurate project context. Escalate when memory staleness blocks task completion or causes repeated agent failures.

**Per-Phase Failure Details**: See individual phase sections below for specific failure conditions during discovery (Phase 1, line 52), quality assessment (Phase 2, line 98), plugin mode (Phase 2.5, line 108), report output (Phase 3, line 159), targeted updates (Phase 4, line 204), and applying updates (Phase 5, line 212). These describe granular failure modes; this section summarizes the global impact when claudemd-curator is bypassed entirely.

# claudemd-curator

Audit, evaluate, and improve project-memory artifacts across a codebase so Claude Code (and Codex / Codeium / ChatGPT, which read `AGENTS.md`) have optimal project context.

**This skill can write to memory files.** After presenting a quality report and getting user approval, it updates `CLAUDE.md`, `AGENTS.md`, `.claude.local.md`, or files under `.claude/rules/` with targeted improvements.

`MEMORY.md` (the auto-memory index under `~/.claude/projects/*/memory/`) is recognized but **never rewritten by this skill** — it is owned by the Claude Code memory subsystem and has its own format with frontmatter.

## Workflow

**Tool surface:** `Bash` for `find` discovery, `Glob` for path expansion, `Grep` for content scanning, `Read` for artifact contents, `Edit` and `Write` for Phase 5 updates after approval. `MEMORY.md` is read-only — never written by this skill.

### Phase 1: Discovery

Find all project-memory artifacts in the repository and known Claude user-memory locations. When the user explicitly asks for multi-repo coverage (e.g., "check all workspaces", "audit workspace memory"), extend discovery to workspace roots configured in WORKSPACE_DIRS environment variable or use default examples.

```bash
{
  find . \( -name "CLAUDE.md" -o -name "AGENTS.md" -o -name ".claude.md" -o -name ".claude.local.md" \) 2>/dev/null
  find . -path "*/.claude/rules/*.md" 2>/dev/null

  # Workspace mode: only when user explicitly requests multi-repo coverage
  # Configure via WORKSPACE_DIRS environment variable, e.g.:
  #   export WORKSPACE_DIRS="$HOME/framework $HOME/qyl $HOME/marketplaces"
  # Or update these example paths to match your actual workspace locations.
  if [ "${WORKSPACE_MODE:-false}" = "true" ]; then
    workspace_roots="${WORKSPACE_DIRS:-$HOME/framework $HOME/qyl $HOME/marketplaces}"
    for workspace_root in $workspace_roots; do
      [ -d "$workspace_root" ] || continue
      echo "[workspace-scan] $workspace_root" >&2
      find "$workspace_root" -maxdepth 5 \( -name "CLAUDE.md" -o -name "AGENTS.md" -o -name ".claude.md" -o -name ".claude.local.md" \) 2>/dev/null
      find "$workspace_root" -maxdepth 6 -path "*/.claude/rules/*.md" 2>/dev/null
    done
  fi

  find ~/.claude -maxdepth 1 -name "CLAUDE.md" 2>/dev/null
  find ~/.claude/projects -path "*/memory/MEMORY.md" 2>/dev/null
}
```

Discovery runs across all matching artifacts with no sampling or truncation. The skill processes the complete list to satisfy the claudemd-curator contract.

**Workspace Mode Activation:** Set `WORKSPACE_MODE=true` when the user asks for multi-repo coverage. The report must include a workspace discovery section listing:
- Which workspace roots from WORKSPACE_DIRS (or the default list) were checked
- Which roots existed on disk
- How many artifacts each contributing workspace yielded
- Total artifacts across all workspaces

**Verification:** At least one project-memory artifact is discovered, and every advertised location type that exists on disk appears in the candidate list.

**Failure condition:** If no artifacts are found, stop and report the repository path, workspace roots checked (if workspace mode was active), and discovery commands instead of inventing memory updates.

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

Before final scoring, compare `~/.claude/CLAUDE.md` (when present) with every project-level `CLAUDE.md`. Surface duplicated commands, overlapping standing rules, and conflicting instructions as potential drift. The report must name the global file and each affected project path; do not silently merge or rewrite global content.

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

**Verification:** Every discovered writable artifact has a score and notes for each checklist criterion, and the report includes a global/project overlap note when both global and project `CLAUDE.md` files exist.

**Failure condition:** If an artifact cannot be read or scored, mark it blocked with the exact path and continue scoring the remaining artifacts.

### Phase 2.5: Plugin Mode

When the repository includes marketplace/plugin metadata, run plugin-aware audit against existing marketplace truth signals instead of producing duplicate drift facts. Consume `capability-snapshot` output from `marketplace-tour` when available and cross-reference discovered memory artifacts with `METADATA_DRIFT`, `CONTENT_DRIFT`, and `STALE_<N>d` signals.

Use Phase 2.5 to explain whether memory guidance matches the current plugin registry, manifests, command names, skill names, and documented capability surface. The skill must not re-emit duplicate `METADATA_DRIFT`, `CONTENT_DRIFT`, or `STALE_<N>d` signals; it should link or cite the existing signal and describe the memory-file impact.

**Verification:** Plugin-mode output lists the capability-snapshot source, every consumed marketplace-tour signal, and the memory artifacts affected by each signal.

**Failure condition:** If capability-snapshot data is unavailable, mark Phase 2.5 as skipped with the exact missing source and continue the normal memory-quality report.

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

**Verification:** The report includes file count, average score, every discovered artifact, concrete issues, and recommended additions.

**Failure condition:** If recommendations do not name the target file and reason, do not proceed to updates.

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

**Verification:** Each proposed update is a minimal diff with a target file and a one-line reason tied to the quality report.

**Failure condition:** If a proposed change is generic, stale, or not backed by repo evidence, remove it from the proposal.

### Phase 5: Apply Updates

After user approval, apply changes using the Edit tool. Preserve existing content structure.

**Verification:** Re-read each edited artifact and confirm the approved text landed without unrelated rewrites.

**Failure condition:** If approval is missing or ambiguous, stop before editing and ask for the specific target files to update.

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
