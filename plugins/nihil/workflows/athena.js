export const meta = {
  name: 'nihil-athena',
  description:
    'Nihil / Athena — architecture restructure judgment panel. Existing architecture is not sacred. Drafts several independent restructurings of a target from different strategic angles, has independent judges score them, and synthesizes the one design that feels inevitable in hindsight. Read-only: emits a plan, not edits.',
  whenToUse:
    'When the defect is structure — cohesion, coupling, naming, module boundaries, abstraction quality, or semantic design — and you want the strongest restructuring rather than a local patch. Pass args.target = a path/module/concept. Read-only.',
  phases: [
    { title: 'Frame', detail: 'map the current shape and its structural defects' },
    { title: 'Draft', detail: 'independent restructurings from distinct angles' },
    { title: 'Judge', detail: 'score each draft on independent criteria' },
    { title: 'Synthesize', detail: 'the inevitable-in-hindsight design' },
  ],
}

const targetArg = (args && (typeof args === 'string' ? args : args.target)) || 'the current branch diff'

const DOCTRINE = `You serve Nihil / Athena, strategist of structure. Judge by cohesion, coupling, naming, module boundaries, abstraction quality, canonical ownership, and semantic honesty. Prefer the design that deletes concepts a maintainer must hold in their head, not one that rearranges them. A green build is not a good design. Cite concrete file:line shapes.`

phase('Frame')
log(`Athena — restructuring: ${targetArg}`)
const frame = await agent(
  `${DOCTRINE}

Map the current shape of ${targetArg}. Read the real code. Produce a tight brief: the core domain concepts, the actual structural defects (giant files, spaghetti control flow, accidental abstractions, leaky boundaries, under-modeled state, wrong-layer logic), and the single hardest structural problem to solve. This brief feeds independent redesign drafts — be concrete, not vague.`,
  { label: 'athena:frame', phase: 'Frame' }
)

// distinct strategic angles — diversity beats redundancy
const ANGLES = [
  { key: 'deletion-first', stance: 'Reach the goal by removing concepts: collapse layers, delete branches/modes/wrappers, fold special cases into one default flow. The best version is the one with the fewest moving parts.' },
  { key: 'boundary-first', stance: 'Redraw ownership boundaries so each concept lives where it is owned: split mixed-purpose files, move logic to the canonical layer, make leaky public surfaces honest.' },
  { key: 'model-first', stance: 'Replace scattered conditionals/flags/stringly-typed state with one explicit typed model or dispatcher, so control flow becomes a consequence of the model.' },
]

const DRAFT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'moves', 'deletedConcepts', 'risks', 'publicImpact'],
  properties: {
    summary: { type: 'string', description: 'the restructuring in 2-3 sentences' },
    moves: { type: 'array', items: { type: 'string' }, description: 'concrete ordered steps, behavior-preserving' },
    deletedConcepts: { type: 'array', items: { type: 'string' }, description: 'concepts/branches/files a maintainer no longer needs to hold' },
    risks: { type: 'array', items: { type: 'string' } },
    publicImpact: { type: 'string', enum: ['none', 'compatible', 'breaking'] },
  },
}

const SCORE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['scores', 'verdict'],
  properties: {
    scores: {
      type: 'object',
      additionalProperties: false,
      required: ['simplicity', 'cohesion', 'feasibility', 'honesty'],
      properties: {
        simplicity: { type: 'integer', minimum: 1, maximum: 5, description: 'fewest concepts a reader must hold' },
        cohesion: { type: 'integer', minimum: 1, maximum: 5 },
        feasibility: { type: 'integer', minimum: 1, maximum: 5, description: 'behavior-preserving and achievable' },
        honesty: { type: 'integer', minimum: 1, maximum: 5, description: 'semantic/boundary honesty' },
      },
    },
    verdict: { type: 'string' },
  },
}

// draft each angle, then immediately have 3 independent judges score it
phase('Draft')
const scored = await pipeline(
  ANGLES,
  (a) =>
    agent(
      `${DOCTRINE}

Draft a complete restructuring of ${targetArg} using this stance and no other:
${a.stance}

Current-shape brief:
${frame}

Stay behavior-preserving unless a public break is clearly justified (mark it). Give concrete ordered moves and name the concepts your design deletes.`,
      { label: `draft:${a.key}`, phase: 'Draft', schema: DRAFT_SCHEMA }
    ).then((draft) => ({ angle: a.key, draft })),
  ({ angle, draft }) =>
    parallel(
      ['simplicity', 'risk', 'maintainer'].map((lens) => () =>
        agent(
          `${DOCTRINE}

Judge this "${angle}" restructuring of ${targetArg} through the ${lens} lens. Be skeptical; do not reward ambition that adds complexity.

${JSON.stringify(draft, null, 2)}

Score 1-5 on each axis and give a one-line verdict naming the single biggest strength or fatal flaw.`,
          { label: `judge:${angle}:${lens}`, phase: 'Judge', schema: SCORE_SCHEMA }
        )
      )
    ).then((votes) => {
      const ok = votes.filter(Boolean)
      const sum = ok.reduce(
        (s, v) => s + v.scores.simplicity + v.scores.cohesion + v.scores.feasibility + v.scores.honesty,
        0
      )
      // average per returning judge, so a draft is not penalized for a judge that failed to return
      return { angle, draft, votes: ok, judges: ok.length, score: ok.length ? sum / ok.length : 0 }
    })
)

const ranked = scored.filter(Boolean).sort((a, b) => b.score - a.score)
const droppedDrafts = scored.length - ranked.length
const integrity =
  droppedDrafts > 0
    ? `INCOMPLETE: ${droppedDrafts} restructuring draft(s) failed to return — fewer angles were weighed than intended.`
    : 'All restructuring drafts were weighed by the panel.'
log(`drafts ranked: ${ranked.map((r) => `${r.angle}(${r.score.toFixed(1)}, ${r.judges}j)`).join(' > ')}. ${integrity}`)

phase('Synthesize')
return await agent(
  `${DOCTRINE}

You are Athena. Synthesize the final restructuring plan for ${targetArg}. Build from the winning draft but graft the best moves from the runners-up where they make the result simpler.

Ranked drafts (score is the average across returning judges):
${JSON.stringify(ranked, null, 2)}

Panel integrity: ${integrity}
If INCOMPLETE, note it under residual risk.

Produce:
- Chosen design (the inevitable-in-hindsight shape, 2-4 sentences).
- Ordered, behavior-preserving moves (the concrete plan).
- Concepts deleted (what a maintainer no longer carries).
- Public/compatibility impact: none | compatible | breaking (+ migration if breaking).
- Residual risk.
This is a plan, not edits. If no restructuring beats the status quo on the scores, say the current structure earns its existence (no-op).`,
  { label: 'athena:plan', phase: 'Synthesize' }
)
