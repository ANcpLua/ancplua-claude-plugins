# Description Optimization

How to optimize a skill's description for better triggering accuracy. The description field in SKILL.md frontmatter is the primary mechanism that determines whether Claude invokes a skill -- getting it right matters. Run this after the skill itself is in good shape (the create/iterate loop is done and the user is happy with quality).

## How skill triggering works

Understanding the triggering mechanism helps you design better eval queries and write better descriptions. Skills use progressive disclosure -- a three-level loading system:

1. **Metadata** (name + description) -- always in context. This is all the agent sees when deciding whether to trigger.
2. **SKILL.md body** -- loaded only after the skill triggers.
3. **Bundled resources** -- loaded on demand from within the skill body.

The agent sees only level 1 when making the trigger decision. It decides whether to consult a skill based on the name and description alone.

The important thing to know: Claude only consults skills for tasks it cannot easily handle on its own. Simple, one-step queries like "read this PDF" may not trigger a skill even if the description matches perfectly, because Claude can handle them directly with basic tools. Complex, multi-step, or specialized queries reliably trigger skills when the description matches.

This means your eval queries need to be substantive enough that Claude would actually benefit from consulting a skill. Simple queries like "read file X" are poor test cases -- they will not trigger skills regardless of description quality.

## Step 1: Generate trigger eval queries

Create 20 eval queries -- a mix of should-trigger and should-not-trigger. You want 8-10 of each, with a minimum of 16 total for a meaningful train/test split. Save them as JSON:

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

### Writing good queries

The queries must be realistic -- things a Claude Code or Claude.ai user would actually type. Not abstract requests, but concrete and specific with good detail. Include file paths, personal context about the user's job or situation, column names and values, company names, URLs. A little backstory. Some in lowercase, some with abbreviations or typos or casual speech. Mix up the lengths and focus on edge cases rather than clear-cut examples (the user will get a chance to sign off on them).

**Bad queries:**
- `"Format this data"`
- `"Extract text from PDF"`
- `"Create a chart"`

**Good query:**
- `"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage. The revenue is in column C and costs are in column D i think"`

### Should-trigger queries (8-10)

Think about coverage. You want different phrasings of the same intent -- some formal, some casual. Include:

- Cases where the user does not explicitly name the skill or file type but clearly needs it
- Uncommon or edge-case use cases the skill handles
- Cases where this skill competes with another skill but should win
- Different levels of technical sophistication in phrasing

### Should-not-trigger queries (8-10)

The most valuable ones are the near-misses -- queries that share keywords or concepts with the skill but actually need something different. Think:

- Adjacent domains (a "data analysis" skill should not trigger for "analyze this poem")
- Ambiguous phrasing where a naive keyword match would trigger but should not
- Queries that touch on something the skill does but in a context where another tool is more appropriate
- Requests that use skill-related vocabulary in an unrelated domain

The key thing to avoid: don't make should-not-trigger queries obviously irrelevant. "Write a fibonacci function" as a negative test for a PDF skill is too easy -- it does not test anything. The negative cases should be genuinely tricky.

## Step 2: Review with the user

Present the eval set to the user for review using the HTML template. Bad eval queries lead to bad descriptions, so this step matters -- don't skip it.

1. Read the template from `assets/eval_review.html`
2. Replace the three placeholders in the template:
   - `__EVAL_DATA_PLACEHOLDER__` -- the JSON array of eval items (no quotes around it -- it is a JS variable assignment, e.g., `const evalData = [...]`)
   - `__SKILL_NAME_PLACEHOLDER__` -- the skill's name (string)
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` -- the skill's current description (string)
3. Write to a temp file and open it in the browser:
   ```bash
   open /tmp/eval_review_<skill-name>.html
   ```
4. The user reviews the queries in the browser. They can:
   - Edit query text inline
   - Toggle should-trigger / should-not-trigger
   - Add new entries or remove existing ones
   - Click "Export Eval Set" when done
5. The exported file downloads to `~/Downloads/eval_set.json` -- check the Downloads folder for the most recent version in case there are multiple (e.g., `eval_set (1).json`)

## Step 3: Run the optimization loop

Tell the user: "This will take some time -- I'll run the optimization loop in the background and check on it periodically."

Save the eval set to the workspace, then kick it off in the background:

```bash
python -m scripts.run_loop \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

Use the model ID from your system prompt (the one powering the current session) so the triggering test matches what the user actually experiences. This is important -- a description optimized against one model may not trigger the same way on another.

While it runs, periodically tail the output to give the user updates on which iteration it is on and what the scores look like. The loop typically takes several minutes.

### What the loop does internally

The script handles the full optimization loop automatically:

1. **Splits** the eval set into 60% train and 40% held-out test using stratified sampling (maintaining the should-trigger / should-not-trigger ratio in both splits)
2. **Evaluates** the current description by running each query 3 times to get a reliable trigger rate
3. **Uses a trigger rate threshold of 0.5** -- queries that trigger more than half the time count as "would trigger"
4. **Calls Claude** to propose an improved description based on what failed
5. **Re-evaluates** each new description on both train and test splits
6. **Iterates** up to 5 times
7. **Selects the best** description by test score (not train score) to avoid overfitting

When it finishes, it opens an HTML report in the browser showing per-iteration results and returns JSON with `best_description`.

## Step 4: Apply the result

Take `best_description` from the JSON output and update the skill's SKILL.md frontmatter. Show the user a clear before/after:

```
Before: "Create dashboards for data visualization."
After:  "Create dashboards for data visualization. Use when the user mentions
         dashboards, data visualization, internal metrics, or wants to display
         any kind of company data, even if they don't explicitly ask for a
         'dashboard.'"
```

Report both scores:
- **Train score**: how well the description did on queries it was optimized against
- **Test score**: how well it generalized to unseen queries (the held-out 40%)

The test score is what matters for real-world performance. If the train score is high but the test score is low, the description is overfitting -- the loop's selection criterion (best test score) should prevent this, but flag it if you see a large gap.
