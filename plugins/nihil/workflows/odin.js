export const meta = {
  name: 'nihil-odin',
  description:
    'Nihil / Odin — deep research. Familiarity is not knowledge. Fans out searches across independent angles, fetches and deep-reads sources, adversarially cross-checks every claim, and returns a cited report with unsupported claims filtered out.',
  whenToUse:
    'When a transformation decision depends on external behavior, upstream docs, or evidence the repo cannot supply. Pass the question as args (string) or args.question. Read-only.',
  phases: [
    { title: 'Angles', detail: 'decompose the question into independent search angles' },
    { title: 'Gather', detail: 'search + deep-read sources per angle' },
    { title: 'Cross-check', detail: 'adversarially verify each claim against sources' },
    { title: 'Synthesize', detail: 'cited report, refuted claims removed' },
  ],
}

const question =
  (args && (typeof args === 'string' ? args : args.question)) ||
  'No question was provided to Odin. Report that the run needs args = the research question.'

const DOCTRINE = `You serve Nihil. Familiarity is not knowledge and confidence is not evidence. Trust only what a primary or authoritative source states. Record every claim with its source URL. Mark anything inferred as inferred. Never invent a citation.`

phase('Angles')
log(`Odin — researching: ${question}`)

const ANGLES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['angles'],
  properties: {
    angles: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['angle', 'why'],
        properties: {
          angle: { type: 'string', description: 'a distinct facet of the question to investigate independently' },
          why: { type: 'string', description: 'what this angle uniquely surfaces' },
        },
      },
    },
  },
}

const plan = await agent(
  `${DOCTRINE}

Decompose this question into 3-6 INDEPENDENT research angles that, together, cover it without overlap. Each angle should be answerable on its own and surface something the others would miss.

Question: ${question}`,
  { label: 'odin:angles', phase: 'Angles', schema: ANGLES_SCHEMA }
)

const CLAIMS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['claims'],
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['claim', 'source', 'confidence'],
        properties: {
          claim: { type: 'string' },
          source: { type: 'string', description: 'the URL or exact document the claim came from' },
          quote: { type: 'string', description: 'a short supporting quote when available' },
          confidence: { type: 'string', enum: ['primary', 'secondary', 'inferred'] },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['supported', 'reason'],
  properties: {
    supported: { type: 'boolean' },
    reason: { type: 'string' },
    correctedClaim: { type: 'string', description: 'a corrected statement if the original was partly wrong' },
  },
}

// gather per angle, then cross-check each claim as soon as its angle returns
phase('Gather')
const investigated = await pipeline(
  plan.angles,
  (a) =>
    agent(
      `${DOCTRINE}

Investigate this angle of the question "${question}":
Angle: ${a.angle}
Why it matters: ${a.why}

Use WebSearch + WebFetch (and Read/Grep if a local repo is relevant). Deep-read the most authoritative sources. Extract concrete, individually-checkable claims, each with its source URL and a short quote where possible. Prefer primary sources.`,
      { label: `gather:${a.angle.slice(0, 32)}`, phase: 'Gather', schema: CLAIMS_SCHEMA }
    ),
  (result, a) =>
    parallel(
      (result.claims || []).map((c) => () =>
        agent(
          `${DOCTRINE}

Adversarially verify this claim. Default to supported=false unless an authoritative source confirms it. Re-fetch the cited source if needed and check whether it actually says this.

Claim: ${c.claim}
Cited source: ${c.source}
${c.quote ? `Quoted as: ${c.quote}` : ''}

supported=true only if the source genuinely supports the claim. If it is partly wrong, set supported=false and provide correctedClaim.`,
          { label: `crosscheck:${a.angle.slice(0, 24)}`, phase: 'Cross-check', schema: VERDICT_SCHEMA }
        ).then((v) => ({ ...c, angle: a.angle, verdict: v }))
      )
    )
)

const flat = investigated.flat()
const droppedChecks = flat.filter((c) => !c || !c.verdict).length
const survived = flat.filter((c) => c && c.verdict && c.verdict.supported)
const integrity =
  droppedChecks > 0
    ? `INCOMPLETE: ${droppedChecks} cross-check(s) did not return — the report may omit verified claims or under-report gaps; do not treat it as exhaustive.`
    : 'All claims were cross-checked.'

log(`${survived.length} claim(s) survived cross-checking. ${integrity}`)

phase('Synthesize')
return await agent(
  `${DOCTRINE}

You are Odin, who traded an eye for knowledge. Synthesize a cited report answering:

  ${question}

Use ONLY these cross-checked claims (each already verified against its source):
${JSON.stringify(survived.map((c) => ({ claim: c.claim, source: c.source, confidence: c.confidence })), null, 2)}

Research integrity: ${integrity}

Structure:
- Direct answer (2-4 sentences).
- Findings, grouped logically, each with inline [source URL] citations.
- Confidence + gaps: what is primary-sourced vs inferred, what could not be confirmed, and the integrity note above if it is INCOMPLETE.
Do not introduce claims that are not in the verified set. If the verified set is thin, say so plainly rather than padding.`,
  { label: 'odin:report', phase: 'Synthesize' }
)
