---
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
---

# Skill Creator

Your job is to figure out where the user is in the skill lifecycle and help them progress. Use this decision tree to route:

| User says / has | Start at |
|-----------------|----------|
| "make a skill for X" / "create a skill" | Capture Intent (Section: Creating a Skill) |
| "turn this into a skill" | Extract from conversation history, then Write |
| Already has a draft SKILL.md | Test & Evaluate (Section: Running & Evaluating) |
| "not triggering" / "wrong skill fires" | Description Optimization |
| "outputs are wrong" / "skill needs work" | Improvement Loop |
| "just vibe with me" / no formal evals | Skip formal evals, iterate informally |
| "package my skill" | Packaging |

If the user's situation doesn't match any row, ask a clarifying question. Don't guess the workflow.

---

## What NOT to Do

These are the highest-impact failure modes. Each one has burned real iterations.

- **NEVER modify both the skill AND the eval set in the same iteration.**
  Change one variable at a time. Otherwise you cannot attribute improvements to either change.

- **NEVER read test outputs before the grader runs.**
  This biases improvement suggestions toward what you saw rather than what structured grading reveals.

- **NEVER use field names other than `text`, `passed`, `evidence` in grading.json.**
  The viewer renders empty cells silently with wrong field names. This is the number one integration failure.

- **NEVER make eval queries simple one-step tasks for trigger testing.**
  Claude handles simple tasks without consulting skills, so one-step queries test nothing regardless of description quality.

- **NEVER generate the eval viewer yourself (custom HTML). Always use generate_review.py.**
  The viewer handles file embedding, feedback collection, benchmark display, and previous-iteration comparison. Custom HTML misses all of these.

- **NEVER self-evaluate outputs before showing them to the user.**
  Get outputs in front of the human ASAP. Your assessment is less valuable than their domain expertise. Generate the eval viewer BEFORE evaluating outputs yourself.

- **NEVER add assertions that always pass regardless of skill presence.**
  Non-discriminating assertions inflate pass rates without measuring skill value. If the baseline passes too, the assertion tests nothing.

---

## Creating a Skill

### Capture Intent

Start by understanding what the user wants. The current conversation might already contain a workflow they want to capture ("turn this into a skill"). If so, extract answers from the conversation history first -- tools used, sequence of steps, corrections made, input/output formats observed. Then confirm with the user before proceeding.

Four key questions to answer (ask one or two at a time, not all at once):

1. **What should this skill enable Claude to do?** The core capability.
2. **When should this skill trigger?** User phrases, contexts, edge cases.
3. **What is the expected output format?** Files, text, structured data.
4. **Should we set up test cases?** Skills with objectively verifiable outputs (file transforms, data extraction, code generation) benefit from test cases. Skills with subjective outputs (writing style, design) often don't. Suggest the appropriate default, but let the user decide.

### Research

Proactively investigate before writing. Check available MCPs for relevant docs, similar skills, or best practices. Research in parallel via subagents if available, otherwise inline. The goal is to come prepared with context so the user doesn't have to provide what's already discoverable.

Ask about edge cases, input/output formats, example files, success criteria, and dependencies. Wait to write test prompts until this is ironed out.

### Initialize

For new skills, always run the scaffolding script:

```bash
python ${CLAUDE_SKILL_DIR}/scripts/init_skill.py <skill-name> --path <output-directory>
```

This creates the skill directory with a SKILL.md template (frontmatter + TODO placeholders) and example files in `scripts/`, `references/`, and `assets/`. Customize or remove the generated examples as needed.

Skip this step only when iterating on an existing skill.

### Write the SKILL.md

A skill is a self-contained package that extends Claude with specialized knowledge:

```
skill-name/
├── SKILL.md              (required -- core instructions, <500 lines)
│   ├── YAML frontmatter  (name + description required)
│   └── Markdown body     (procedures, patterns, gotchas)
└── Bundled Resources     (optional)
    ├── scripts/          (deterministic/repetitive tasks, executable without loading)
    ├── references/       (docs loaded into context on demand)
    └── assets/           (templates, icons, fonts used in output)
```

**Progressive disclosure**: Skills load in three tiers:
1. **Metadata** (name + description) -- always in context (~100 words)
2. **SKILL.md body** -- loaded when skill triggers (<500 lines)
3. **Bundled resources** -- loaded as needed (unlimited; scripts execute without reading)

Keep SKILL.md under 500 lines. When approaching this limit, move detailed content to `references/` with clear pointers about when to load each file.

#### Frontmatter Rules

- **name**: kebab-case, max 64 chars, must match the directory name. No consecutive hyphens, no leading/trailing hyphens.
- **description**: max 1024 chars. Must answer three questions: WHAT does it do, WHEN should it trigger, and what KEYWORDS activate it. Be pushy about triggering -- Claude tends to undertrigger skills, so explicitly list contexts where the skill should activate even if the user doesn't name it directly.
- **compatibility** (optional): max 500 chars. Required tools, dependencies, environment constraints.

#### Writing Style

- **Imperative form**: "Run the script" not "You should run the script."
- **Explain the why**: Today's LLMs respond better to reasoning than rigid directives. If you find yourself writing ALWAYS or NEVER in caps, reframe as an explanation of why it matters. Understanding produces better results than obedience.
- **Provide defaults, not menus**: Instead of "Choose between X, Y, or Z," recommend the right default and explain when to deviate.
- **Skill audience**: The skill will be read by another Claude instance. Focus on information that is beneficial and non-obvious -- procedural knowledge, domain-specific details, integration gotchas.

#### Useful Patterns

**Output format templates** -- Define the exact structure when output format matters:
```markdown
## Report Structure
ALWAYS use this template:
# [Title]
## Executive Summary
## Key Findings
## Recommendations
```

**Gotchas sections** -- Surface integration pain points and non-obvious constraints upfront.

**Examples** -- Include concrete input/output examples to anchor expectations:
```markdown
## Commit Message Format
**Example:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

**Domain organization** -- When a skill supports multiple domains, organize by variant in `references/`:
```
cloud-deploy/
├── SKILL.md          (workflow + domain selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
Claude reads only the relevant reference file.

#### Start with Bundled Resources

Before writing SKILL.md prose, implement the reusable resources identified during research: scripts for repetitive code, references for domain docs, assets for templates. This may require user input (brand assets, API docs, schema files). Delete any scaffolding examples not needed for the skill.

Then write SKILL.md to reference these resources with clear guidance on when to use each one.

---

## Running and Evaluating

This section is one continuous sequence. Do not stop partway through.

### Design Test Cases

Come up with 2-3 realistic test prompts -- the kind of thing a real user would actually say. Share them with the user for confirmation. Save to `evals/evals.json`:

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

Don't write assertions yet -- just prompts. Assertions come in a later step. See `references/schemas.md` for the full schema.

### Spawn Runs

For each test case, spawn **with-skill AND baseline in the same turn** (hard requirement -- don't spawn one group first and come back for the other). This ensures everything finishes around the same time.

**With-skill run**: Point the subagent at the skill, provide the eval prompt, and save outputs to:
```
<skill-name>-workspace/iteration-<N>/eval-<ID>/with_skill/outputs/
```
This exact path structure matters -- downstream scripts depend on it.

**Baseline run** (same prompt, no skill or old skill version):
- Creating a new skill: no skill at all. Save to `without_skill/outputs/`.
- Improving an existing skill: snapshot the old version first (`cp -r`), point the baseline at the snapshot. Save to `old_skill/outputs/`.

Write an `eval_metadata.json` for each test case with a descriptive name. If this iteration uses new eval prompts, create fresh metadata files -- they don't carry over.

### Capture Timing

When each subagent completes, you receive a notification with `total_tokens` and `duration_ms`. Save to `timing.json` in the run directory immediately -- this is the only opportunity to capture this data.

### Draft Assertions While Runs Execute

Use the wait productively. Draft quantitative assertions for each test case -- objectively verifiable with descriptive names that read clearly in the benchmark viewer. Update `eval_metadata.json` and `evals/evals.json` with the assertions.

Don't force assertions onto subjective qualities. Writing style, design aesthetics, and similar qualities are better evaluated qualitatively by the human.

### Grade

Once runs complete, spawn a grader subagent that reads `agents/grader.md`. Output `grading.json` in each run directory. The expectations array must use exactly these fields:

- `text` -- what was checked
- `passed` -- boolean
- `evidence` -- supporting detail

Zero freedom on field names. The viewer depends on them. For programmatically checkable assertions, write and run a script rather than eyeballing it.

### Aggregate

Run the aggregation script:
```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
```

This produces `benchmark.json` and `benchmark.md` with pass rate, time, and tokens for each configuration (mean +/- stddev and the delta).

### Analyze

Surface patterns the aggregate stats might hide. See `agents/analyzer.md` for what to look for: non-discriminating assertions (always pass regardless of skill), high-variance evals (possibly flaky), and time/token tradeoffs.

### Launch Viewer

```bash
python ${CLAUDE_SKILL_DIR}/scripts/generate_review.py \
  <workspace>/iteration-N \
  --skill-name "my-skill" \
  --benchmark <workspace>/iteration-N/benchmark.json
```

For iteration 2+, also pass `--previous-workspace <workspace>/iteration-<N-1>`.

For headless environments (Cowork, no display), use `--static <output_path>` to write a standalone HTML file instead of starting a server. Feedback downloads as `feedback.json` when the user clicks "Submit All Reviews."

Tell the user the viewer is open and what the two tabs show (Outputs for qualitative review + feedback, Benchmark for quantitative comparison). Then wait for their feedback.

### Read Feedback

When the user says they're done, read `feedback.json` from the workspace. Empty feedback means the user thought the output was fine. Focus improvements on test cases with specific complaints.

See `references/eval-workflow.md` for full details on every step above.

---

## Improving the Skill

### How to Think About Improvements

1. **Generalize from feedback.** Skills get used across many different prompts. You and the user are iterating on a few examples because it's fast, but the skill must work broadly. Avoid overfitting -- don't add fiddly constraints that only help the test cases. If something is stubbornly wrong, try a different approach or metaphor rather than adding more rigid rules.

2. **Keep the prompt lean.** Read the transcripts from test runs, not just the final outputs. If the skill is making Claude waste time on unproductive steps, remove those instructions and see what happens.

3. **Explain the why.** Reasoning-based instructions outperform rigid directives. If feedback leads you to write "ALWAYS do X," step back and explain why X matters. A model that understands the reasoning adapts better to novel situations.

4. **Bundle repeated work.** Read the test run transcripts and notice if all subagents independently wrote similar helper scripts or took the same multi-step approach. If every run created a `build_chart.py`, that's a signal to bundle it in `scripts/`. This saves every future invocation from reinventing the wheel.

### The Iteration Loop

1. Apply improvements to the skill.
2. Rerun all test cases into `iteration-<N+1>/`, including baselines. For new skills, the baseline is always no-skill. For existing skills, use your judgment -- the original version or the previous iteration, whichever comparison is more informative.
3. Launch the viewer with `--previous-workspace` pointing at the previous iteration.
4. Wait for the user to review and submit feedback.
5. Read feedback, improve again, repeat.

Stop when: the user is happy, feedback is all empty, or improvements have plateaued.

---

## Description Optimization

The description field is the primary mechanism that determines whether Claude invokes a skill. After creating or improving a skill, offer to optimize it.

### Generate Trigger Eval Queries

Create 20 eval queries -- 8-10 should-trigger, 8-10 should-not-trigger. Minimum 16 total for a meaningful train/test split. Save as JSON:

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

Queries must be realistic -- include file paths, personal context, abbreviations, typos, casual speech, varying lengths. Focus on edge cases, not clear-cut examples.

**Should-trigger queries**: Different phrasings of the same intent, including cases where the user doesn't explicitly name the skill but clearly needs it. Cover uncommon use cases and competitive scenarios where this skill should win.

**Should-not-trigger queries**: Near-miss negatives are the most valuable -- queries that share keywords or concepts but actually need something different. "Write a fibonacci function" as a negative for a PDF skill tests nothing. The negatives should be genuinely tricky.

### Review with User

Present the eval set via `assets/eval_review.html` (replace `__EVAL_DATA_PLACEHOLDER__`, `__SKILL_NAME_PLACEHOLDER__`, `__SKILL_DESCRIPTION_PLACEHOLDER__`). Write to a temp file and open it. The user can edit queries, toggle should-trigger, add/remove entries, then export. Check `~/Downloads/` for the exported `eval_set.json`.

### Run the Optimization Loop

```bash
python -m scripts.run_loop \
  --eval-set <path-to-eval-set.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

This splits the eval set 60/40 train/test, evaluates the current description (3 runs per query for reliability), proposes improvements, and iterates. The best description is selected by test score (not train score) to avoid overfitting.

### Apply the Result

Take `best_description` from the JSON output and update the skill's SKILL.md frontmatter. Show the user before/after and report the scores.

See `references/description-optimization.md` for full details.

---

## Packaging

```bash
python ${CLAUDE_SKILL_DIR}/scripts/package_skill.py <path/to/skill-folder>
```

Validates the skill first (frontmatter format, required fields, naming conventions). If validation passes, creates a `.skill` ZIP excluding `evals/` and build artifacts. If validation fails, fix the reported errors and retry.

If the `present_files` tool is available, present the `.skill` file to the user. Otherwise, tell them the file path.

---

## Environment Adaptations

**Claude.ai** (no subagents): Run test cases sequentially yourself -- read the skill, then follow its instructions for each test prompt. Skip baseline runs, benchmarking, blind comparison, and description optimization (requires `claude -p`). Focus on qualitative feedback inline.

**Cowork** (subagents, no browser): The full workflow works. Use `--static <path>` for the viewer. Feedback downloads as a file. Description optimization works (uses `claude -p` via subprocess).

**Updating existing skills**: Preserve the original name and `name` frontmatter field unchanged. Copy to a writable location before editing (installed skill paths may be read-only). Package from the copy.

---

## Error Recovery

| Problem | Recovery |
|---------|----------|
| Subagent timeout | Run test prompts in series instead of parallel |
| Viewer port in use | Script auto-picks next port; or use `--static` |
| `claude -p` unavailable | Skip description optimization, iterate manually |
| User never submits reviews | Prompt them; read partial `feedback.json` |
| Grading shows empty results | Check field names: must be `text`/`passed`/`evidence` |

---

## Reference Index

Load these files on demand. Do NOT preload them all.

- `references/eval-workflow.md` -- detailed eval spawning, grading, aggregation, viewer usage
- `references/description-optimization.md` -- trigger eval design, optimization loop internals
- `references/schemas.md` -- JSON schemas (indexed by TOC: evals.json, grading.json, timing.json, benchmark.json, comparison.json, analysis.json)
- `agents/grader.md` -- spawn when grading assertions against outputs
- `agents/comparator.md` -- spawn for blind A/B comparison (optional, advanced)
- `agents/analyzer.md` -- spawn for post-hoc analysis of benchmark results

Do NOT load `comparator.md` or `analyzer.md` unless the user explicitly requests blind comparison or post-hoc analysis. Do NOT load `schemas.md` unless manually constructing JSON output files.
