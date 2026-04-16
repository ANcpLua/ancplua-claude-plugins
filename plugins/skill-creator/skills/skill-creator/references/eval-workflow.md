# Eval Workflow

How to run test cases, grade them, aggregate results, and collect feedback from the user. This is one continuous sequence -- don't stop partway through.

## Workspace directory structure

All results live in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace, organize by iteration and eval:

```
my-skill-workspace/
  iteration-1/
    eval-descriptive-name/
      eval_metadata.json
      with_skill/
        outputs/          # files the skill produced
        timing.json
        grading.json
      without_skill/      # baseline (or old_skill/ when improving)
        outputs/
        timing.json
        grading.json
    benchmark.json
    benchmark.md
  iteration-2/
    ...
```

Don't create all of this upfront. Create directories as you go.

## Step 1: Spawn all runs

For each test case, spawn two subagents in the **same turn** -- one with the skill, one without. Don't do the with-skill runs first and come back for baselines later. Launch everything at once so it all finishes around the same time.

**With-skill run prompt:**

```
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Outputs to save: <what the user cares about -- e.g., "the .docx file", "the final CSV">
```

**Baseline run** (same prompt, no skill path, save to `without_skill/outputs/`):
- **New skill**: no skill at all. This shows what Claude does without help.
- **Improving existing skill**: use the old version. Before editing, snapshot the skill (`cp -r <skill-path> <workspace>/skill-snapshot/`), then point the baseline at the snapshot. Save to `old_skill/outputs/`.

Write an `eval_metadata.json` for each test case:

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

Give each eval a descriptive name based on what it tests -- not just "eval-0". Use this name for the directory too. If this iteration uses new or modified eval prompts, create these files fresh -- don't assume they carry over from previous iterations.

## Step 2: Draft assertions while runs execute

Don't just wait. Use this time to draft quantitative assertions for each test case and explain them to the user. If assertions already exist in `evals/evals.json`, review them and explain what they check.

Good assertions are objectively verifiable and have descriptive names -- they should read clearly in the benchmark viewer so someone glancing at the results immediately understands what each one checks. Subjective skills (writing style, design quality) are better evaluated qualitatively -- don't force assertions onto things that need human judgment.

Update the `eval_metadata.json` files and `evals/evals.json` with the assertions once drafted. Also explain to the user what they will see in the viewer -- both the qualitative outputs and the quantitative benchmark.

## Step 3: Capture timing data as runs complete

When each subagent task completes, you receive a notification containing `total_tokens` and `duration_ms`. Save this immediately to `timing.json` in the run directory:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

This is the **only** opportunity to capture this data -- it comes through the task notification and is not persisted elsewhere. Process each notification as it arrives rather than trying to batch them.

## Step 4: Grade, aggregate, analyze, and launch the viewer

Once all runs are done, there are four sub-steps here. Do them in order.

### 4a. Grade each run

Spawn a grader subagent (or grade inline) that reads `agents/grader.md` and evaluates each assertion against the outputs. Save results to `grading.json` in each run directory.

The `grading.json` expectations array must use the fields `text`, `passed`, and `evidence` -- not `name`/`met`/`details` or other variants. The viewer depends on these exact field names.

For assertions that can be checked programmatically, write and run a script rather than eyeballing it -- scripts are faster, more reliable, and can be reused across iterations.

### 4b. Aggregate into benchmark

Run the aggregation script from the skill-creator directory:

```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
```

This produces `benchmark.json` and `benchmark.md` with pass_rate, time, and tokens for each configuration, with mean +/- stddev and the delta. Put each with_skill version before its baseline counterpart.

If generating `benchmark.json` manually, see `references/schemas.md` for the exact schema the viewer expects.

### 4c. Analyst pass

Read the benchmark data and surface patterns the aggregate stats might hide. See `agents/analyzer.md` (the "Analyzing Benchmark Results" section) for what to look for -- things like assertions that always pass regardless of skill (non-discriminating), high-variance evals (possibly flaky), and time/token tradeoffs.

### 4d. Launch the viewer

Start the viewer with both qualitative outputs and quantitative data:

```bash
nohup python <skill-creator-path>/eval-viewer/generate_review.py \
  <workspace>/iteration-N \
  --skill-name "my-skill" \
  --benchmark <workspace>/iteration-N/benchmark.json \
  > /dev/null 2>&1 &
VIEWER_PID=$!
```

For iteration 2+, also pass `--previous-workspace <workspace>/iteration-<N-1>`.

**Headless / cowork environments:** If `webbrowser.open()` is not available or the environment has no display, use `--static <output_path>` to write a standalone HTML file instead of starting a server. In that case, feedback will be downloaded as a `feedback.json` file when the user clicks "Submit All Reviews". After download, copy `feedback.json` into the workspace directory for the next iteration to pick up.

Use `generate_review.py` to create the viewer -- there is no need to write custom HTML.

## What the user sees

Tell the user something like: "I've opened the results in your browser. There are two tabs -- 'Outputs' lets you click through each test case and leave feedback, 'Benchmark' shows the quantitative comparison. When you're done, come back here and let me know."

### The Outputs tab

Shows one test case at a time:
- **Prompt**: the task that was given
- **Output**: the files the skill produced, rendered inline where possible
- **Previous Output** (iteration 2+): collapsed section showing last iteration's output
- **Formal Grades** (if grading was run): collapsed section showing assertion pass/fail
- **Feedback**: a textbox that auto-saves as they type
- **Previous Feedback** (iteration 2+): their comments from last time, shown below the textbox

Navigation is via prev/next buttons or arrow keys.

### The Benchmark tab

Shows the stats summary: pass rates, timing, and token usage for each configuration, with per-eval breakdowns and analyst observations.

## Step 5: Collect feedback

When the user tells you they are done reviewing, they click "Submit All Reviews" in the viewer, which saves all feedback to `feedback.json`:

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels", "timestamp": "..."},
    {"run_id": "eval-1-with_skill", "feedback": "", "timestamp": "..."},
    {"run_id": "eval-2-with_skill", "feedback": "perfect, love this", "timestamp": "..."}
  ],
  "status": "complete"
}
```

Empty feedback means the user thought it was fine. Focus your improvements on the test cases where the user had specific complaints.

## Step 6: Clean up

Kill the viewer server when you are done with it:

```bash
kill $VIEWER_PID 2>/dev/null
```

Then proceed to improving the skill based on the feedback and benchmark results.
