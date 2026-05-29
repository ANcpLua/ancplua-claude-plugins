// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

// Fixed budget bands: [good_max, moderate_max, heavy_max] tokens per cost bucket.
//
// Pinned, not sampled. These were previously re-sampled at runtime as p50/p75/p90 quantiles
// of whichever plugins lived in ~/.claude/plugins/cache, so the same unchanged skill scored
// 91 one run and 85 the next as the installed set shifted. A scoring oracle must be
// reproducible, so the bands are fixed here.
//
// The values reflect PER-COMPONENT cost, matching how budget.js now aggregates (invoke and
// deferred take the heaviest single component, not the sum — see maxTokenCount). The three
// buckets are calibrated to how their tokens reach a context, not to any sampled corpus:
//   - trigger  (always-loaded: every skill/plugin description, permanently in context) — the
//     strictest bucket, because every token here is paid on every turn.
//   - invoke   (one skill/command/agent BODY, loaded only when that component runs) —
//     moderate. A focused body sits well under the moderate band; a 5k+ single body is
//     genuinely bloated and should push detail into references.
//   - deferred (one reference/agent file, loaded ON DEMAND via progressive disclosure) — the
//     most lenient bucket. Progressive disclosure exists precisely so bulk content can be
//     large WITHOUT sitting in always-loaded context; penalizing a big on-demand reference
//     would punish the pattern Claude Code recommends. Only a genuinely huge single file
//     (>16k) is flagged.
const DEFAULT_BASELINE = {
  skill: {
    trigger_cost_tokens: [120, 250, 400],
    invoke_cost_tokens: [800, 1800, 3000],
    deferred_cost_tokens: [2000, 5000, 10000],
  },
  plugin: {
    trigger_cost_tokens: [300, 600, 1200],
    invoke_cost_tokens: [1500, 3000, 5000],
    deferred_cost_tokens: [3000, 8000, 16000],
  },
  directory: {
    trigger_cost_tokens: [1, 1, 1],
    invoke_cost_tokens: [1, 1, 1],
    // Generic directory deferred is a SUM of all text files (see computeBudgetProfile), so
    // these bands stay strict — a directory holding lots of text is the cost signal here.
    deferred_cost_tokens: [240, 640, 1600],
  },
};

export async function loadBudgetBaseline() {
  return {
    skill: DEFAULT_BASELINE.skill,
    plugin: DEFAULT_BASELINE.plugin,
    directory: DEFAULT_BASELINE.directory,
    evidence: { source: "pinned-default-baseline" },
  };
}
