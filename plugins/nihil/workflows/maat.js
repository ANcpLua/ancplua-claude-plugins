export const meta = {
  name: 'nihil-maat',
  description:
    "Nihil / Ma'at — absence-of-value-and-meaning code-quality review. Read-only. Audits a branch diff or path across quality dimensions, adversarially refutes every finding, returns a prioritized Nihil verdict. Confidence is not evidence.",
  whenToUse:
    'Strict read-only maintainability + abstraction-quality review of the current diff or a path. Never writes. Pass args.scope = "diff" (default) or a path/glob.',
  phases: [
    { title: 'Scope', detail: 'resolve the review target' },
    { title: 'Review', detail: 'one agent per quality dimension' },
    { title: 'Verify', detail: 'adversarially refute each finding' },
    { title: 'Judge', detail: "synthesize the Ma'at verdict" },
  ],
}

// ---- inputs -----------------------------------------------------------------
const scope = (args && args.scope) || 'diff'

// ---- Scope preflight: workflow agents inherit the session cwd; an absolute ----
// scope outside this repo cannot be audited from here. Abort cheaply instead.
if (/(^|\s)\//.test(scope)) {
  const preflight = await agent(
    `Run \`git rev-parse --show-toplevel\` (fall back to \`pwd\` outside a git repo) and report that root. The requested scope/target is:
${scope}

Decide whether every absolute path in it lies INSIDE the root you found. A path outside it (a different repository or directory tree) is out of reach: workflow agents cannot be retargeted. Do not start any other work.`,
    {
      label: 'scope:preflight',
      phase: 'Scope',
      effort: 'low',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['inside', 'root'],
        properties: {
          inside: { type: 'boolean', description: 'true only if the whole scope resolves inside this session\u2019s repo root' },
          root: { type: 'string', description: 'the repo root / working directory found' },
          reason: { type: 'string' },
        },
      },
    }
  )
  if (!preflight || !preflight.inside) {
    return `ABORTED: the requested scope does not resolve inside this session's repository${preflight ? ` (${preflight.root})` : ''}. Workflow agents inherit the session working directory and cannot be retargeted by scope prose \u2014 start a Claude Code session in the target repo and re-run /nihil-maat there.${preflight && preflight.reason ? ` Detail: ${preflight.reason}` : ''}`
  }
}

const target =
  scope === 'diff'
    ? "the current branch's uncommitted and unpushed changes (inspect with `git status --short`, `git diff`, and `git diff --staged`)"
    : `the files matching: ${scope}`

phase('Scope')
log(`Ma'at — reviewing ${scope === 'diff' ? 'the branch diff' : scope}`)

// ---- the doctrine the reviewers share --------------------------------------
const DOCTRINE = `You serve Nihil. Doctrine: nothing is sacred, nothing is worthless by default, every artifact must justify its existence by evidence. Be ambitious about STRUCTURAL simplification — hunt "code-judo" moves that delete whole categories of complexity rather than rearrange them. Prefer the structure that feels inevitable in hindsight. Be direct and demanding, never rude. Prefer a few high-conviction findings over a flood of nits. Cite file:line for every finding.`

// each dimension is one god's lens
const DIMENSIONS = [
  { key: 'simplification', god: 'Prometheus', lens: 'Code-judo leverage: reframings that delete branches, helpers, modes, conditionals, or layers entirely. Refactors that only move complexity around without reducing the concepts a reader must hold are a failure, not a fix.' },
  { key: 'spaghetti', god: 'Athena', lens: 'Ad-hoc conditionals, one-off branches, flags, nullable modes, and special cases bolted into busy/unrelated flows. Cohesion lost; a previously scannable module made stateful or tangled.' },
  { key: 'abstraction', god: 'Shiva', lens: 'Thin wrappers, identity/pass-through helpers, private aliases that merely rename a clearer platform API, and abstractions that do not earn their name. A wrapper that only hides a better platform API is debt.' },
  { key: 'boundaries', god: 'Janus', lens: 'Type and boundary cleanliness: unnecessary optionality / any / unknown / casts; silent fallbacks papering over invariants; public-API surface leaking implementation detail; any file pushed past ~1000 lines; logic in the wrong layer/package.' },
  { key: 'canonical', god: 'Ra', lens: 'Duplicated helpers or authority, scattered source-of-truth, feature logic leaking into shared paths, near-duplicates of an existing canonical utility.' },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'location', 'evidence', 'remedy', 'severity'],
        properties: {
          title: { type: 'string' },
          location: { type: 'string', description: 'file:line or file range' },
          evidence: { type: 'string', description: 'the concrete code shape that proves the problem' },
          remedy: { type: 'string', description: 'the structural fix; prefer deletion over rearrangement' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['survives', 'reason'],
  properties: {
    survives: { type: 'boolean', description: 'true if the finding withstands refutation and is a real, evidenced quality problem' },
    reason: { type: 'string' },
  },
}

const reviewPrompt = (d) => `${DOCTRINE}

You are ${d.god}. Review ${target}.
Your lens — flag only this class of problem: ${d.lens}

Read the actual code (git/Read/Grep). Report only evidenced findings, each with file:line, the concrete shape that proves it, and the structural remedy. If the code already justifies itself on your lens, return an empty findings array — "no change is justified" is a valid and respected verdict under Nihil.`

const refutePrompt = (f, d) => `${DOCTRINE}

You are an adversarial verifier. Default to survives=false unless the evidence is undeniable. Try hard to REFUTE this ${d.god} finding by reading the real code:

Title: ${f.title}
Location: ${f.location}
Claimed evidence: ${f.evidence}
Proposed remedy: ${f.remedy}

Refute if: the location/evidence is wrong or stale, the "problem" is actually justified by durable domain meaning or a real invariant, the remedy would make things worse, or it is a cosmetic nit rather than a structural issue. survives=true only if a competent maintainer would agree this is a real, evidenced quality problem worth acting on.`

// ---- review, then verify each finding the moment its dimension lands --------
phase('Review')
const reviewed = await pipeline(
  DIMENSIONS,
  (d) => agent(reviewPrompt(d), { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
  (result, d) =>
    parallel(
      (result.findings || []).map((f) => () =>
        agent(refutePrompt(f, d), { label: `verify:${d.key}`, phase: 'Verify', schema: VERDICT_SCHEMA })
          .then((v) => ({ ...f, dimension: d.key, god: d.god, verdict: v }))
      )
    )
)

const flat = reviewed.flat()
const dropped = flat.filter((f) => !f || !f.verdict).length
const confirmed = flat.filter((f) => f && f.verdict && f.verdict.survives)
const integrity =
  dropped > 0
    ? `INCOMPLETE: ${dropped} verifier agent(s) did not return — absent checks are NOT passed checks; treat this verdict as partial.`
    : 'All findings were adversarially verified.'

log(`Confirmed ${confirmed.length} finding(s). ${integrity}`)

// ---- synthesize the verdict -------------------------------------------------
phase('Judge')
const rank = { blocker: 0, major: 1, minor: 2 }
confirmed.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9))

return await agent(
  `${DOCTRINE}

You are Ma'at, who weighs the heart against a feather. Synthesize the final review of ${target}.

These ${confirmed.length} findings survived adversarial refutation (already severity-sorted):
${JSON.stringify(confirmed.map((f) => ({ severity: f.severity, god: f.god, title: f.title, location: f.location, remedy: f.remedy })), null, 2)}

Review integrity: ${integrity}
If integrity is INCOMPLETE, say so prominently at the top — a partial run must never read as a clean pass.

Produce the verdict in exactly this shape:

Nihil Decision:
<no-op | suggestion | patch | targeted rework | simplification | deletion | restructure | public API break>

Evidence:
<the strongest concrete facts behind the decision>

Findings (highest conviction first):
<for each: [severity] file:line — problem -> structural remedy. Lead with code-judo moves that delete complexity.>

Approval Bar:
<met | NOT met — list any presumptive blockers: incidental complexity a code-judo move would delete, a file pushed past 1000 lines, ad-hoc branching tangling a flow, feature logic scattered across shared code, an abstraction/cast/wrapper that does not earn its keep, a canonical-helper duplication, a public API preserved by fear or broken without migration notes.>

Be honest: if nothing survived, the decision is no-op and you say the design already earns its existence. Do not invent findings to look thorough.`,
  { label: 'maat:verdict', phase: 'Judge' }
)
