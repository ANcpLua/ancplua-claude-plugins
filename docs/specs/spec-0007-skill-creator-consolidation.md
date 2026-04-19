---
status: proposed
contact: "ANcpLua"
date: "2026-04-16"
deciders: "ANcpLua"
consulted: "skill-judge (8-dimension audit, 82/120 baseline), deep-think-partner"
informed: "ancplua-claude-plugins consumers"
---

# spec-0007: Consolidated Skill Creator Plugin

## Metadata

| Field | Value |
|-------|-------|
| **Status** | proposed |
| **Date** | 2026-04-16 |
| **Contact** | ANcpLua |

---

## Problem / Goal

Skill creation knowledge is fragmented across three locations:

| Location | What it contains | What it lacks |
|----------|-----------------|---------------|
| `~/swizzknife of skills/` | Official Anthropic spec + docs (1250 lines of reference) | No tooling, no scripts, no workflow |
| `~/example_skill_reference_md/` | Full eval infrastructure (10 scripts, 3 agent files, HTML viewers) | No `init_skill.py`, no scaffolding |
| `~/claude-code-rules/plugins/handbook/skills/skill-creator/` | Creation workflow (3 scripts, init/validate/package) | No eval infrastructure |

Both SKILL.md files are named `skill-creator`. Both produce Claude Code skills. But they cover different phases with almost no overlap. The Anthropic spec sits alone with no tooling referencing it.

**Goal:** Consolidate into a single self-contained plugin at `~/WebStormProjects/ancplua-claude-plugins/plugins/skill-creator/` with zero maintenance burden.

---

## Success Metrics

1. One plugin, one skill, one trigger point — `skill-creator` replaces all three sources
2. Full lifecycle coverage: create, evaluate, benchmark, improve, optimize descriptions, package
3. SKILL.md stays under 500 lines with progressive disclosure to references
4. Spec rules from swizzknife baked into validation scripts, not carried as prose
5. Skill-judge score improves from 82/120 baseline (target: 96+/120, Grade B+)

---

## Outcome

### Components Created

```text
plugins/skill-creator/
├── .claude-plugin/
│   └── plugin.json
├── skills/skill-creator/
│   ├── SKILL.md                              (~400 lines, core workflow)
│   ├── scripts/
│   │   ├── __init__.py                       (package init)
│   │   ├── utils.py                          (shared frontmatter parser)
│   │   ├── init_skill.py                     (scaffold new skill directory)
│   │   ├── quick_validate.py                 (full YAML validation, spec enforcement)
│   │   ├── package_skill.py                  (.skill ZIP packaging)
│   │   ├── run_eval.py                       (trigger testing via claude -p)
│   │   ├── run_loop.py                       (train/test optimization loop)
│   │   ├── improve_description.py            (LLM-based description improvement)
│   │   ├── aggregate_benchmark.py            (stats aggregation)
│   │   ├── generate_review.py                (eval output viewer + feedback)
│   │   └── generate_report.py                (description optimization report)
│   ├── references/
│   │   ├── eval-workflow.md                  (detailed eval mechanics)
│   │   ├── description-optimization.md       (trigger eval optimization)
│   │   └── schemas.md                        (JSON schemas, indexed by TOC)
│   ├── agents/
│   │   ├── grader.md                         (assertion grading subagent)
│   │   ├── comparator.md                     (blind A/B comparison)
│   │   └── analyzer.md                       (post-hoc analysis)
│   └── assets/
│       ├── eval_review.html                  (trigger eval query editor)
│       └── viewer.html                       (output review viewer)
└── README.md
```

### Integration Points

| Component | Integration |
|-----------|-------------|
| `plugin.json` | Registered in monorepo `marketplace.json` |
| `SKILL.md` | Invokable as `/skill-creator` in Claude Code |
| `scripts/*.py` | Called via `python ${CLAUDE_SKILL_DIR}/scripts/<name>.py` |
| `agents/*.md` | Spawned as subagent system prompts |
| `references/*.md` | Loaded on demand from SKILL.md pointers |
| `assets/*.html` | Opened in browser or written as static files |

---

## Implementation Details

### SKILL.md Architecture (~400 lines)

The SKILL.md is the core teaching document. It covers the full lifecycle with progressive pointers to references for advanced features.

#### Section 1: Frontmatter

```yaml
name: skill-creator
description: >
  Create, evaluate, and iteratively improve Claude Code skills. Use when
  users want to create a skill from scratch, turn a workflow into a skill,
  edit or optimize an existing skill, run evals to test skill quality,
  benchmark performance with variance analysis, optimize a skill's
  description for better triggering accuracy, or package a skill for
  distribution. Triggers on: "make a skill", "create a skill", "turn this
  into a skill", "test my skill", "improve my skill", "skill not triggering",
  "package skill", "evaluate skill", "benchmark skill".
compatibility: >
  Full features require Claude Code with subagents and claude -p CLI.
  Core creation workflow works in Claude.ai and Cowork with reduced eval
  capabilities.
```

#### Section 2: Entry-Point Router (~25 lines)

Structured decision tree replacing prose-based routing:

```
IF user says "make/create a skill for X"     → Capture Intent (Section 4)
IF user says "turn this into a skill"        → Extract from conversation history → Write (Section 4)
IF user has a draft SKILL.md                 → Skip to Test & Evaluate (Section 5)
IF user says "not triggering" / "wrong skill"→ Description Optimization (Section 7)
IF user says "outputs are wrong"             → Improvement Loop (Section 6)
IF user says "just vibe with me"             → Skip formal evals, iterate informally
IF user says "package my skill"              → Packaging (Section 8)
```

#### Section 3: Anti-Patterns (~35 lines)

Consolidated NEVER list with WHY — the highest-impact addition per skill-judge audit:

```markdown
## What NOT to do

- NEVER modify both the skill AND the eval set in the same iteration.
  WHY: Cannot attribute improvements to either change. Change one variable at a time.

- NEVER read test outputs before the grader runs.
  WHY: Biases improvement suggestions toward what you saw rather than what
  structured grading reveals.

- NEVER use field names other than `text`, `passed`, `evidence` in grading.json.
  WHY: The viewer.html renders empty cells silently with wrong field names.
  This is the #1 integration failure.

- NEVER make eval queries simple one-step tasks for trigger testing.
  WHY: Claude handles these without consulting skills, so they test nothing
  regardless of description quality.

- NEVER generate the eval viewer yourself (custom HTML). Always use generate_review.py.
  WHY: The viewer handles file embedding, feedback collection, benchmark display,
  and previous-iteration comparison. Custom HTML misses all of these.

- NEVER self-evaluate outputs before showing them to the user.
  WHY: Get outputs in front of the human ASAP. Your assessment is less valuable
  than their domain expertise.

- NEVER add assertions that always pass regardless of skill presence.
  WHY: Non-discriminating assertions inflate pass rates without measuring skill value.
  If baseline passes too, the assertion tests nothing.
```

#### Section 4: Creating a Skill (~120 lines)

Merged from both sources:

- **Capture intent**: Interview approach — what should it do, when should it trigger, expected output format, should we set up test cases? One question at a time.
- **Research**: Check MCPs, existing patterns, similar skills. Research in parallel via subagents if available.
- **Initialize**: Always run `scripts/init_skill.py <name> --path <dir>` for new skills. Creates directory with SKILL.md template, example scripts/references/assets.
- **Write SKILL.md**: Spec rules baked in (not referenced):
  - `name`: kebab-case, max 64 chars, must match directory name
  - `description`: max 1024 chars, must answer WHAT + WHEN + KEYWORDS, be pushy about triggering
  - Progressive disclosure: SKILL.md < 500 lines, heavy content in references/
  - Writing style: imperative form, explain the why behind instructions, provide defaults not menus
  - Patterns: output format templates, gotchas sections, validation loops, plan-validate-execute

#### Section 5: Running & Evaluating (~100 lines)

Condensed from example version with hardened integration points:

- **Test case design**: 2-3 realistic prompts. Save to `evals/evals.json`. Don't write assertions yet.
- **Spawn runs**: For each test case, spawn with-skill AND baseline in the same turn (HARD REQUIREMENT). Save to `<skill-name>-workspace/iteration-<N>/eval-<ID>/with_skill/outputs/` (EXACT PATH — downstream scripts depend on this).
- **Capture timing**: Save `timing.json` from task notifications immediately (only chance).
- **Draft assertions while runs execute**: Objectively verifiable, descriptive names. Don't force assertions onto subjective qualities.
- **Grade**: Spawn grader subagent (reads `agents/grader.md`). Output to `grading.json` with fields `text`, `passed`, `evidence` (ZERO FREEDOM — viewer depends on exact names).
- **Aggregate**: `python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>`
- **Analyze**: Read benchmark data, surface patterns (see `agents/analyzer.md` for details).
- **Launch viewer**: `generate_review.py` with `--static <path>` for headless environments.
- **Tell user**: Get them reviewing outputs BEFORE you evaluate anything yourself.
- Points to `references/eval-workflow.md` for full details.

#### Section 6: Improving the Skill (~50 lines)

The iteration philosophy — high freedom, appropriate for creative/analytical work:

- **Generalize from feedback**: Skills get used across many prompts. Don't overfit to test cases.
- **Keep the prompt lean**: Read transcripts. If the skill makes Claude waste time, remove those instructions.
- **Explain the why**: Reasoning-based instructions outperform rigid directives. If writing ALWAYS/NEVER in caps, reframe as explanation.
- **Bundle repeated work**: If all test runs independently wrote similar helper scripts, bundle it in `scripts/`.
- **The loop**: Improve → Rerun into `iteration-<N+1>/` → Launch viewer with `--previous-workspace` → Read feedback → Repeat until: user is happy, feedback is empty, or no meaningful progress.

#### Section 7: Description Optimization (~35 lines)

Condensed trigger eval flow:

- Generate 20 eval queries (8-10 should-trigger, 8-10 should-not-trigger). Minimum 16 required for meaningful train/test split.
- Near-miss negatives are the most valuable (share keywords but need different skill).
- Review with user via `assets/eval_review.html` template.
- Run: `python -m scripts.run_loop --eval-set <path> --skill-path <path> --model <model-id> --max-iterations 5`
- Apply `best_description` from results.
- Points to `references/description-optimization.md` for full details.

#### Section 8: Packaging (~15 lines)

```bash
python ${CLAUDE_SKILL_DIR}/scripts/package_skill.py <path/to/skill-folder>
```

Validates before packaging. Creates `.skill` ZIP excluding `evals/` and build artifacts.

#### Section 9: Environment Adaptations (~25 lines)

**Claude.ai**: No subagents — run test cases sequentially yourself. Skip baseline runs, benchmarking, blind comparison, description optimization. Focus on qualitative feedback.

**Cowork**: Has subagents but no browser. Use `--static <path>` for viewer. Feedback downloads as file. Description optimization works (uses `claude -p`).

**Updating existing skills**: Preserve original name. Copy to writable location before editing. Package from the copy.

#### Section 10: Error Recovery (~20 lines)

What to do when things go wrong:

| Problem | Recovery |
|---------|----------|
| Subagent timeout | Run test prompts in series instead of parallel |
| Viewer port in use | Script auto-picks next port; or use `--static` |
| `claude -p` unavailable | Skip description optimization, iterate manually |
| User never submits reviews | Prompt them; read partial `feedback.json` |
| Grading shows empty results | Check field names: must be `text`/`passed`/`evidence` |

#### Section 11: Reference Index (~10 lines)

Pointers to progressive-disclosure files:

- `references/eval-workflow.md` — detailed eval spawning, grading, aggregation, viewer usage
- `references/description-optimization.md` — trigger eval design, optimization loop internals
- `references/schemas.md` — JSON schemas (indexed: evals.json, grading.json, timing.json, benchmark.json, comparison.json, analysis.json)
- `agents/grader.md` — spawn when grading assertions against outputs
- `agents/comparator.md` — spawn for blind A/B comparison (optional, advanced)
- `agents/analyzer.md` — spawn for post-hoc analysis of comparison results
- Do NOT load comparator.md or analyzer.md unless user explicitly requests blind comparison
- Do NOT load schemas.md unless manually constructing JSON output files

### Scripts Specification

#### Source Mapping

| Script | Source | Changes |
|--------|--------|---------|
| `__init__.py` | example | None (empty package init) |
| `utils.py` | example (48 lines) | None — shared frontmatter parser |
| `init_skill.py` | plugin (307 lines) | None — standalone, no imports to adjust |
| `quick_validate.py` | example (103 lines) | Preferred over plugin's 65-line regex version — full YAML parsing |
| `package_skill.py` | example (137 lines) | Uses full validator, .skill ZIP format |
| `run_eval.py` | example (310 lines) | None |
| `run_loop.py` | example (328 lines) | None |
| `improve_description.py` | example (247 lines) | None |
| `aggregate_benchmark.py` | example (401 lines) | None |
| `generate_review.py` | example (471 lines) | None |
| `generate_report.py` | example (327 lines) | None |

Most scripts are taken as-is. Key decisions:
- `quick_validate.py` uses the full YAML-parsing version (example) over the regex-only version (plugin)
- `package_skill.py` uses the example version which validates before packaging and produces `.skill` format
- `generate_review.py` needs its `viewer.html` path constant updated: the template moves from same-directory to `../assets/viewer.html` (resolved via `Path(__file__).parent.parent / "assets" / "viewer.html"`)

#### Validation Rules Enforced (from Anthropic spec, baked into quick_validate.py)

- SKILL.md exists in skill root
- Valid YAML frontmatter with `---` delimiters
- `name` field: required, kebab-case, max 64 chars, no consecutive hyphens, no leading/trailing hyphens
- `description` field: required, max 1024 chars, no angle brackets
- `name` matches parent directory name
- `compatibility` field: optional, max 500 chars if present

### References Specification

#### eval-workflow.md

Detailed eval mechanics extracted from the example SKILL.md sections 5 ("Running and evaluating test cases"). Covers:

- Workspace directory structure diagram
- Step-by-step for spawning with-skill and baseline runs
- `eval_metadata.json` format
- Assertion drafting while runs execute
- Timing capture from task notifications
- Grading process (spawn grader subagent or grade inline)
- Aggregation command and benchmark.json interpretation
- Viewer launch: server mode vs `--static`
- Feedback collection from `feedback.json`
- Previous-iteration comparison via `--previous-workspace`

#### description-optimization.md

Trigger eval optimization workflow. Covers:

- How skill triggering works (agent-side progressive disclosure matching)
- Designing should-trigger queries (vary phrasing, explicitness, detail, complexity)
- Designing should-not-trigger queries (near-misses, shared keywords, adjacent domains)
- Realism tips (file paths, personal context, typos, casual speech)
- The `eval_review.html` review step (placeholder replacement, file export)
- Running `run_loop.py` (train/test split, parallel evaluation, iteration tracking)
- Interpreting results (best description selected by test score, not train score)
- Applying the result and manual sanity-check

#### schemas.md

JSON schema documentation with TABLE OF CONTENTS at the top:

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

Each schema section includes the JSON structure with field descriptions and required/optional markers.

### Agents Specification

All three agent files are taken from the example version with no content changes. They are standalone system prompts for subagents:

- `grader.md` (224 lines) — evaluates assertions against outputs with pass/fail + evidence, critiques eval quality
- `comparator.md` (203 lines) — blind A/B comparison using content + structure rubrics
- `analyzer.md` (275 lines) — post-hoc analysis of comparison results, benchmark pattern detection

### Assets Specification

- `eval_review.html` (146 lines) — interactive table for creating/editing trigger eval queries. Supports toggle, sort, export.
- `viewer.html` (1325 lines) — comprehensive output review viewer with multi-run display, grading visualization, benchmark tab, keyboard navigation, auto-save feedback.

### Plugin Shell

#### plugin.json

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

#### README.md

Brief: what it does, quick start (`/skill-creator "build a skill for X"`), file layout tree, requirements (Python 3.10+, Claude Code for full features).

### Monorepo Integration

| File | Change |
|------|--------|
| `marketplace.json` | Add `skill-creator` plugin entry |
| `CHANGELOG.md` | Add under `[Unreleased]`: "Added skill-creator plugin — consolidated from 3 sources" |
| Run `weave-validate.sh` | Must pass before claiming done |

---

## Security Considerations

- `run_eval.py` and `run_loop.py` spawn `claude -p` subprocesses — input is user-controlled eval queries, not arbitrary code injection vectors (queries are passed as `-p` flag values, not shell-expanded)
- `quick_validate.py` checks for angle brackets in description to prevent prompt injection via frontmatter
- `package_skill.py` excludes `evals/` directory to prevent shipping test data with packaged skills
- HTML viewers use inline JavaScript only — no external resource loading, no CDN dependencies
- `generate_review.py` serves on localhost only (127.0.0.1), not exposed to network

---

## Related Documents

- [Agent Skills Specification](https://agentskills.io) — upstream spec, rules baked into `quick_validate.py`
- Supersedes: `~/swizzknife of skills/`, `~/example_skill_reference_md/`, `~/claude-code-rules/plugins/handbook/skills/skill-creator/`

---

## Maintenance Rules for Claude

1. When modifying SKILL.md, keep it under 500 lines. Move new detailed content to references/.
2. When modifying grading integration, the field names `text`/`passed`/`evidence` are load-bearing — viewer.html depends on them.
3. When adding scripts, update the reference index in SKILL.md Section 11.
4. The Anthropic spec rules live in `quick_validate.py`, not in prose. To update spec compliance, update the script.
5. Run `../../tooling/scripts/weave-validate.sh` before committing changes to the plugin.

---

## Skill-Judge Audit Trail

Baseline evaluation of the design (before consolidation fixes): **82/120 (68%, Grade D)**

| Dimension | Baseline | Target | Fix Applied |
|-----------|----------|--------|-------------|
| D1: Knowledge Delta | 12/20 | 16/20 | Remove ~55 lines of redundant content (triple core-loop, generic comm advice) |
| D2: Mindset + Procedures | 11/15 | 13/15 | Add structured entry-point decision tree |
| D3: Anti-Pattern Quality | 6/15 | 13/15 | Add consolidated NEVER list with WHY (Section 3) |
| D4: Spec Compliance | 12/15 | 14/15 | Pushy description with trigger keywords, add compatibility field |
| D5: Progressive Disclosure | 13/15 | 14/15 | Add TOC to schemas.md, add "Do NOT Load" guidance |
| D6: Freedom Calibration | 10/15 | 13/15 | Mark fragile integration points as zero-freedom |
| D7: Pattern Recognition | 7/10 | 8/10 | Explicit phase transition triggers |
| D8: Practical Usability | 11/15 | 13/15 | Add error recovery table, promote viewer-first anti-pattern |
| **Total** | **82/120** | **104/120** | **Target: Grade B (87%)** |
