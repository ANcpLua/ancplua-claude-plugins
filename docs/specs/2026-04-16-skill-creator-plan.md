# Skill Creator Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate three fragmented skill-creation sources into a single `skill-creator` plugin at `plugins/skill-creator/` in the ancplua-claude-plugins monorepo.

**Architecture:** One plugin, one skill, progressive disclosure. SKILL.md (~400 lines) teaches the full create-evaluate-improve lifecycle. Eval infrastructure lives in references/agents loaded on demand. 11 Python scripts handle validation, scaffolding, benchmarking, and description optimization. Spec rules from Anthropic baked into validation scripts, not carried as prose.

**Tech Stack:** Python 3.10+ (scripts), Markdown (SKILL.md, references, agents), HTML/JS (viewers), Claude Code plugin system.

**Source locations:**
- `EXAMPLE` = `/Users/ancplua/example_skill_reference_md/example skill reference md/skill template structure and reference`
- `PLUGIN` = `/Users/ancplua/claude-code-rules/plugins/handbook/skills/skill-creator`
- `TARGET` = `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/skill-creator`

---

### Task 1: Plugin scaffold

**Files:**
- Create: `plugins/skill-creator/.claude-plugin/plugin.json`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/` (empty dir)
- Create: `plugins/skill-creator/skills/skill-creator/references/` (empty dir)
- Create: `plugins/skill-creator/skills/skill-creator/agents/` (empty dir)
- Create: `plugins/skill-creator/skills/skill-creator/assets/` (empty dir)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p "$TARGET/.claude-plugin"
mkdir -p "$TARGET/skills/skill-creator/scripts"
mkdir -p "$TARGET/skills/skill-creator/references"
mkdir -p "$TARGET/skills/skill-creator/agents"
mkdir -p "$TARGET/skills/skill-creator/assets"
```

- [ ] **Step 2: Write plugin.json**

Create `plugins/skill-creator/.claude-plugin/plugin.json`:

```json
{
  "name": "skill-creator",
  "version": "1.0.0",
  "description": "Create, evaluate, and iteratively improve Claude Code skills.",
  "author": {
    "name": "ANcpLua",
    "url": "https://github.com/ANcpLua"
  },
  "repository": "https://github.com/ANcpLua/ancplua-claude-plugins",
  "license": "MIT",
  "keywords": ["skills", "creator", "eval", "benchmark", "packaging"]
}
```

- [ ] **Step 3: Commit scaffold**

```bash
git add plugins/skill-creator/
git commit -m "feat(skill-creator): scaffold plugin directory structure"
```

---

### Task 2: Copy scripts layer

**Files:**
- Create: `plugins/skill-creator/skills/skill-creator/scripts/__init__.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/utils.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/init_skill.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/quick_validate.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/package_skill.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/run_eval.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/run_loop.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/improve_description.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/aggregate_benchmark.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/generate_review.py`
- Create: `plugins/skill-creator/skills/skill-creator/scripts/generate_report.py`

- [ ] **Step 1: Copy init_skill.py from PLUGIN source**

```bash
cp "$PLUGIN/scripts/init_skill.py" "$TARGET/skills/skill-creator/scripts/init_skill.py"
```

This is the only script from the plugin source. It scaffolds new skill directories.

- [ ] **Step 2: Copy 9 scripts from EXAMPLE source**

```bash
for f in __init__.py utils.py quick_validate.py package_skill.py run_eval.py run_loop.py improve_description.py aggregate_benchmark.py generate_review.py generate_report.py; do
  cp "$EXAMPLE/$f" "$TARGET/skills/skill-creator/scripts/$f"
done
```

- [ ] **Step 3: Fix generate_review.py viewer.html path**

In `plugins/skill-creator/skills/skill-creator/scripts/generate_review.py`, line 257, change:

```python
# OLD:
    template_path = Path(__file__).parent / "viewer.html"
```

to:

```python
# NEW:
    template_path = Path(__file__).parent.parent / "assets" / "viewer.html"
```

This is the only code change across all scripts. The template moved from same-directory to `assets/`.

- [ ] **Step 4: Verify scripts are importable**

```bash
cd "$TARGET/skills/skill-creator"
python -c "from scripts.utils import parse_skill_md; print('OK')"
```

Expected: `OK`

- [ ] **Step 5: Commit scripts**

```bash
git add plugins/skill-creator/skills/skill-creator/scripts/
git commit -m "feat(skill-creator): copy scripts from example + plugin sources

init_skill.py from plugin source (scaffolding).
All other scripts from example source (eval infrastructure).
Single path fix in generate_review.py for relocated viewer.html."
```

---

### Task 3: Copy agents and assets

**Files:**
- Create: `plugins/skill-creator/skills/skill-creator/agents/grader.md`
- Create: `plugins/skill-creator/skills/skill-creator/agents/comparator.md`
- Create: `plugins/skill-creator/skills/skill-creator/agents/analyzer.md`
- Create: `plugins/skill-creator/skills/skill-creator/assets/eval_review.html`
- Create: `plugins/skill-creator/skills/skill-creator/assets/viewer.html`

- [ ] **Step 1: Copy agent files from EXAMPLE source**

```bash
cp "$EXAMPLE/grader.md" "$TARGET/skills/skill-creator/agents/grader.md"
cp "$EXAMPLE/comparator.md" "$TARGET/skills/skill-creator/agents/comparator.md"
cp "$EXAMPLE/analyzer.md" "$TARGET/skills/skill-creator/agents/analyzer.md"
```

No changes — these are standalone subagent system prompts.

- [ ] **Step 2: Copy HTML assets from EXAMPLE source**

```bash
cp "$EXAMPLE/eval_review.html" "$TARGET/skills/skill-creator/assets/eval_review.html"
cp "$EXAMPLE/viewer.html" "$TARGET/skills/skill-creator/assets/viewer.html"
```

No changes — self-contained HTML with inline JS.

- [ ] **Step 3: Commit agents and assets**

```bash
git add plugins/skill-creator/skills/skill-creator/agents/ plugins/skill-creator/skills/skill-creator/assets/
git commit -m "feat(skill-creator): copy agents and HTML assets from example source"
```

---

### Task 4: Write references

**Files:**
- Create: `plugins/skill-creator/skills/skill-creator/references/schemas.md`
- Create: `plugins/skill-creator/skills/skill-creator/references/eval-workflow.md`
- Create: `plugins/skill-creator/skills/skill-creator/references/description-optimization.md`

- [ ] **Step 1: Copy schemas.md and prepend TOC**

Copy `$EXAMPLE/schemas.md` to `$TARGET/skills/skill-creator/references/schemas.md`.

Then prepend this TOC block immediately after the title:

```markdown
## Table of Contents

- [evals.json](#evalsjson) — eval definitions with prompts and assertions
- [grading.json](#gradingjson) — grader output (fields: text, passed, evidence)
- [timing.json](#timingjson) — wall clock and token data
- [benchmark.json](#benchmarkjson) — aggregated run statistics
- [comparison.json](#comparisonjson) — blind comparator output
- [analysis.json](#analysisjson) — post-hoc analyzer findings
- [history.json](#historyjson) — description version progression
- [metrics.json](#metricsjson) — executor metrics
```

Verify the anchor links match the actual section headings in schemas.md. Adjust if they don't match.

- [ ] **Step 2: Write eval-workflow.md**

Extract from the EXAMPLE SKILL.md (lines 164-285 approximately — the "Running and evaluating test cases" section) into `references/eval-workflow.md`. This is the detailed eval mechanics that SKILL.md Section 5 points to.

Content must cover these topics (extracted from the example SKILL.md, not invented):

1. Workspace directory structure (`<skill-name>-workspace/iteration-<N>/eval-<ID>/with_skill/outputs/`)
2. Spawning runs — with-skill AND baseline in same turn, prompt format for subagents
3. `eval_metadata.json` format and per-eval directory naming
4. Assertion drafting while runs execute
5. Timing capture from task notifications (`timing.json` with `total_tokens`, `duration_ms`, `total_duration_seconds`)
6. Grading process — spawn grader (reads `agents/grader.md`), output `grading.json` with `text`/`passed`/`evidence` fields
7. Aggregation — `python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>`, produces `benchmark.json` + `benchmark.md`
8. Analyst pass — read benchmark data, surface patterns per `agents/analyzer.md`
9. Viewer launch — `generate_review.py` with workspace path, `--skill-name`, `--benchmark`, `--previous-workspace` for iteration 2+, `--static` for headless
10. "Outputs" tab and "Benchmark" tab descriptions
11. Feedback collection — user clicks "Submit All Reviews", reads `feedback.json`
12. Kill viewer server when done

Write in the same conversational tone as the example SKILL.md. Include the exact JSON formats inline. This file should be ~200 lines.

- [ ] **Step 3: Write description-optimization.md**

Extract from the EXAMPLE SKILL.md (lines 333-404 approximately — the "Description Optimization" section) into `references/description-optimization.md`.

Content must cover:

1. How skill triggering works — progressive disclosure, agent sees only name+description, triggers only for tasks agent can't handle alone
2. Generating trigger eval queries — 20 queries, 8-10 should-trigger, 8-10 should-not-trigger, minimum 16 for meaningful train/test split
3. Query design guidance — realistic prompts with file paths, personal context, typos; near-miss negatives; bad vs good examples
4. Review with user — `eval_review.html` template: replace `__EVAL_DATA_PLACEHOLDER__`, `__SKILL_NAME_PLACEHOLDER__`, `__SKILL_DESCRIPTION_PLACEHOLDER__`, write to temp file, open in browser, user exports to `~/Downloads/eval_set.json`
5. Running the optimization loop — `python -m scripts.run_loop --eval-set <path> --skill-path <path> --model <model-id> --max-iterations 5 --verbose`, background execution, periodic progress checks
6. What the loop does internally — 60/40 train/test split, 3 runs per query, trigger rate threshold 0.5, iterates up to 5 times, selects best by test score
7. Applying the result — take `best_description`, update frontmatter, show before/after, report scores

Write in conversational tone. Include the exact command-line invocations. ~150 lines.

- [ ] **Step 4: Commit references**

```bash
git add plugins/skill-creator/skills/skill-creator/references/
git commit -m "feat(skill-creator): write reference docs (eval-workflow, description-optimization, schemas)"
```

---

### Task 5: Write SKILL.md

This is the core task. The SKILL.md must be written from scratch, synthesizing both source SKILL.md files plus the 7 audit fixes.

**Files:**
- Create: `plugins/skill-creator/skills/skill-creator/SKILL.md`

**Source material to read before writing:**
- EXAMPLE SKILL.md: `/Users/ancplua/example_skill_reference_md/example skill reference md/skill template structure and reference/SKILL.md` (486 lines)
- PLUGIN SKILL.md: `/Users/ancplua/claude-code-rules/plugins/handbook/skills/skill-creator/SKILL.md` (210 lines)
- Spec: `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/docs/specs/spec-0007-skill-creator-consolidation.md` (Sections 1-11 architecture)

**Read all three files completely before writing anything.**

- [ ] **Step 1: Write SKILL.md following the spec's 11-section architecture**

The spec defines the exact section structure (spec lines 103-260). Write the file section by section:

**Frontmatter** — use exactly the description and compatibility from the spec (lines 105-119).

**Section 2: Entry-Point Router** — structured IF/THEN decision tree (spec lines 126-133). Not prose — use a markdown table or code block.

**Section 3: Anti-Patterns** — the 7 NEVER items with WHY (spec lines 140-168). Copy verbatim from the spec.

**Section 4: Creating a Skill** — merge from both sources:
- Interview/capture-intent approach from EXAMPLE SKILL.md lines 46-58
- init_skill.py usage from PLUGIN SKILL.md lines 136-153
- Spec rules baked in (name: kebab-case max 64, description: max 1024 + WHAT/WHEN/KEYWORDS, progressive disclosure, writing style)
- Skill writing guide from EXAMPLE SKILL.md lines 73-139 (anatomy, progressive disclosure, writing patterns) — but condensed, removing redundant content the audit flagged
- Do NOT include: "Communicating with the user" generic advice, "Principle of Lack of Surprise", triple repetition of core loop

**Section 5: Running & Evaluating** — condensed from EXAMPLE SKILL.md lines 164-285:
- Test case design, spawn runs, capture timing, draft assertions, grade, aggregate, viewer
- Hardened integration points: workspace path format is EXACT, grading.json fields are ZERO FREEDOM
- Point to `references/eval-workflow.md` for full details
- Include: "GENERATE THE EVAL VIEWER BEFORE evaluating outputs yourself" (promoted from Cowork-only to universal)

**Section 6: Improving the Skill** — from EXAMPLE SKILL.md lines 290-326:
- Generalize, keep lean, explain why, bundle repeated work
- The iteration loop with viewer `--previous-workspace`
- Remove the motivational tone ("we are trying to create billions a year in economic value here!") — replace with clear rationale

**Section 7: Description Optimization** — condensed from EXAMPLE SKILL.md lines 333-404:
- Generate queries, review with HTML, run loop, apply result
- Point to `references/description-optimization.md` for full details

**Section 8: Packaging** — from EXAMPLE SKILL.md lines 409-416:
- `scripts/package_skill.py` command
- Brief: validates first, creates .skill ZIP

**Section 9: Environment Adaptations** — from EXAMPLE SKILL.md lines 420-455:
- Claude.ai (no subagents), Cowork (no browser, use --static), updating existing skills
- Condensed — remove anything already covered in main sections

**Section 10: Error Recovery** — NEW section from spec (lines 239-247):
- The error recovery table from the spec

**Section 11: Reference Index** — from spec (lines 249-260):
- File pointers with "Do NOT Load" guidance

**Budget: ~400 lines. Hard ceiling: 500 lines.**

- [ ] **Step 2: Validate SKILL.md with quick_validate.py**

```bash
cd "$TARGET/skills/skill-creator"
python scripts/quick_validate.py .
```

Expected: validation passes (valid frontmatter, name matches directory, description under 1024 chars).

- [ ] **Step 3: Count lines**

```bash
wc -l "$TARGET/skills/skill-creator/SKILL.md"
```

Expected: under 500 lines. If over, identify and cut redundant content.

- [ ] **Step 4: Commit SKILL.md**

```bash
git add plugins/skill-creator/skills/skill-creator/SKILL.md
git commit -m "feat(skill-creator): write consolidated SKILL.md

Synthesizes example (eval infrastructure) and plugin (creation workflow) sources.
Incorporates 7 audit fixes: NEVER list, decision tree router, hardened integration
points, error recovery, redundancy removal, viewer-first anti-pattern, Do NOT Load."
```

---

### Task 6: README and monorepo integration

**Files:**
- Create: `plugins/skill-creator/README.md`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write README.md**

Create `plugins/skill-creator/README.md`:

```markdown
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
```

- [ ] **Step 2: Add skill-creator to marketplace.json**

Add this entry to the `plugins` array in `.claude-plugin/marketplace.json` (after the last existing entry, before the closing `]`):

```json
    {
      "name": "skill-creator",
      "description": "Create, evaluate, and iteratively improve Claude Code skills.",
      "version": "1.0.0",
      "source": "./plugins/skill-creator"
    }
```

- [ ] **Step 3: Add CHANGELOG entry**

Add under `## [Unreleased]` → `### Added` in `CHANGELOG.md`:

```markdown
- **`skill-creator` plugin (1.0.0)**: Consolidated skill creation toolkit. Full lifecycle: scaffold (`init_skill.py`), validate (`quick_validate.py`), evaluate (trigger testing, assertion grading, blind A/B comparison), benchmark (aggregation with variance analysis), optimize descriptions (train/test split, iterative improvement), and package (`.skill` ZIP). Merges three fragmented sources into one plugin with progressive disclosure. See [spec-0007](docs/specs/spec-0007-skill-creator-consolidation.md).
```

- [ ] **Step 4: Commit integration**

```bash
git add plugins/skill-creator/README.md .claude-plugin/marketplace.json CHANGELOG.md
git commit -m "feat(skill-creator): add README and register in monorepo

marketplace.json entry + CHANGELOG under [Unreleased]."
```

---

### Task 7: Validate everything

**Files:** None created — validation only.

- [ ] **Step 1: Run weave-validate.sh**

```bash
cd /Users/ancplua/WebStormProjects/ancplua-claude-plugins
./tooling/scripts/weave-validate.sh
```

Expected: passes. If it fails, the error will indicate which version/description is mismatched between `plugin.json` and `marketplace.json`.

- [ ] **Step 2: Run quick_validate.py on the skill itself**

```bash
cd "$TARGET/skills/skill-creator"
python scripts/quick_validate.py .
```

Expected: all checks pass.

- [ ] **Step 3: Verify file count and structure**

```bash
find "$TARGET" -type f | grep -v '.git' | sort
```

Expected: 25 files total:
- `.claude-plugin/plugin.json` (1)
- `README.md` (1)
- `skills/skill-creator/SKILL.md` (1)
- `skills/skill-creator/scripts/*.py` (11)
- `skills/skill-creator/references/*.md` (3)
- `skills/skill-creator/agents/*.md` (3)
- `skills/skill-creator/assets/*.html` (2)

- [ ] **Step 4: Final line count on SKILL.md**

```bash
wc -l "$TARGET/skills/skill-creator/SKILL.md"
```

Expected: 350-450 lines.

- [ ] **Step 5: Spot-check progressive disclosure**

Read SKILL.md and verify:
- Section 5 points to `references/eval-workflow.md`
- Section 7 points to `references/description-optimization.md`
- Section 11 lists all references, agents, and includes "Do NOT Load" guidance
- No reference file content is duplicated in SKILL.md

---

## Self-Review Notes

**Spec coverage check:**
- Plugin shell (plugin.json, directories) → Task 1
- Scripts (11 files, source mapping, generate_review.py path fix) → Task 2
- Agents (3 files, verbatim copy) → Task 3
- Assets (2 HTML files, verbatim copy) → Task 3
- References (schemas with TOC, eval-workflow, description-optimization) → Task 4
- SKILL.md (11 sections, audit fixes) → Task 5
- README → Task 6
- Monorepo integration (marketplace.json, CHANGELOG) → Task 6
- Validation (weave-validate, quick_validate, file count, line count) → Task 7
- Security considerations → enforced by existing scripts, no new code needed

**No TDD for this plan.** This is a consolidation of existing, working scripts + new markdown content. The "tests" are `quick_validate.py` (validates SKILL.md frontmatter) and `weave-validate.sh` (validates plugin structure). Both run in Task 7.
