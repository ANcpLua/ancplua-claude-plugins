export const meta = {
  name: 'nihil-shiva',
  description:
    'Nihil / Shiva — deletion and public-API evaporation. Backward compatibility is not sacred. Loop-until-dry sweep for dead code, duplication, unjustified abstractions, and over-broad public surface; every candidate must survive an adversarial "prove it is NOT safe to remove" check; emits an evidenced break/deletion manifest. Read-only by default.',
  whenToUse:
    'When artifacts may no longer earn their existence and you want an evidenced deletion + public-break manifest. Pass args.scope (path/glob, default whole repo) and args.execute=true ONLY to apply removals after review. Deletion is permitted, never assumed.',
  phases: [
    { title: 'Sweep', detail: 'multi-modal hunt for removal candidates, loop until dry' },
    { title: 'Prove', detail: 'adversarially require evidence each is truly removable' },
    { title: 'Manifest', detail: 'evidenced break/deletion manifest' },
    { title: 'Execute', detail: 'apply only when args.execute === true' },
  ],
}

const scope = (args && args.scope) || 'the whole repository'
const execute = !!(args && args.execute)

const DOCTRINE = `You serve Nihil / Shiva, destroyer of what no longer earns its keep. Deletion is permitted, never assumed. Nothing is removed merely because removal is dramatic. Every removal needs evidence (no references, dead path, superseded API, duplicate of a canonical helper). Public APIs may be broken when preserving them keeps a worse contract alive — but no public break ships silently. Cite file:line and the evidence for every candidate.`

// Multi-modal finders: each hunts a different class, blind to the others.
const FINDERS = [
  { key: 'dead-code', hunt: 'unreachable code, unexported/unused symbols, functions and files with no inbound references, commented-out blocks, dead feature flags and their branches.' },
  { key: 'duplication', hunt: 'copy-pasted logic and near-duplicate helpers that should collapse into one canonical implementation.' },
  { key: 'thin-abstraction', hunt: 'wrappers, identity/pass-through helpers, and private aliases that only rename a clearer platform API and carry no durable policy.' },
  { key: 'public-surface', hunt: 'exported/public API that is over-broad, redundant, misleading, or no longer used by any consumer — candidates for narrowing or a documented break.' },
  { key: 'dependency', hunt: 'dependencies, build steps, or config that nothing live depends on.' },
]

const CANDIDATES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['candidates'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'kind', 'location', 'evidence', 'public'],
        properties: {
          id: { type: 'string', description: 'stable key: kind + location' },
          kind: { type: 'string' },
          location: { type: 'string', description: 'file:line or file' },
          evidence: { type: 'string', description: 'why it appears removable (reference counts, search results, supersession)' },
          public: { type: 'boolean', description: 'true if this touches a public/exported contract' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['removable', 'reason'],
  properties: {
    removable: { type: 'boolean', description: 'true only if evidence proves removal is safe (or a public break is justified)' },
    reason: { type: 'string' },
    replacement: { type: 'string', description: 'replacement contract / migration path when this is a public break' },
  },
}

// ---- Sweep: loop until two consecutive dry rounds ---------------------------
phase('Sweep')
const seen = new Set()
const fresh = []
let dry = 0
let round = 0
const key = (c) => `${c.kind}::${c.location}`

while (dry < 2 && round < 4 && (!budget.total || budget.remaining() > 60000)) {
  round++
  const found = (
    await parallel(
      FINDERS.map((f) => () =>
        agent(
          `${DOCTRINE}

Round ${round}. Hunt ONLY this class within ${scope}: ${f.hunt}
Use Grep/Glob/Read and reference-counting (search for every usage before declaring something unused). Report removal candidates with evidence. If a previous round already took the obvious ones, dig for the non-obvious. Return an empty array if this class is exhausted.`,
          { label: `sweep:${f.key}#${round}`, phase: 'Sweep', schema: CANDIDATES_SCHEMA }
        )
      )
    )
  )
    .filter(Boolean)
    .flatMap((r) => r.candidates || [])

  const novel = found.filter((c) => !seen.has(key(c)))
  if (novel.length === 0) {
    dry++
  } else {
    dry = 0
    novel.forEach((c) => {
      seen.add(key(c))
      fresh.push(c)
    })
  }
  log(`round ${round}: +${novel.length} candidate(s), ${fresh.length} total`)
}

// ---- Prove: adversarially require evidence per candidate --------------------
phase('Prove')
const judged = await parallel(
  fresh.map((c) => () =>
    agent(
      `${DOCTRINE}

Adversarially decide whether this is genuinely removable. Default removable=false. Search the entire repo for any reference, reflection, dynamic dispatch, public consumer, test, or doc that depends on it before agreeing.

Candidate: ${c.kind}
Location: ${c.location}
Claimed evidence: ${c.evidence}
Touches public surface: ${c.public}

removable=true only if removal is safe OR (for a public item) the break is justified and you can state the replacement/migration. Otherwise removable=false with the dependency you found.`,
      { label: `prove:${c.kind}`, phase: 'Prove', schema: VERDICT_SCHEMA }
    ).then((v) => ({ ...c, verdict: v }))
  )
)

const droppedProofs = judged.filter((c) => !c || !c.verdict).length
const proven = judged.filter((c) => c && c.verdict && c.verdict.removable)
const integrity =
  droppedProofs > 0
    ? `INCOMPLETE: ${droppedProofs} proof agent(s) did not return — this manifest is NOT exhaustive; unproven candidates were neither confirmed nor cleared.`
    : 'Every candidate was adversarially proven.'
log(`${proven.length} of ${fresh.length} candidate(s) proven removable. ${integrity}`)

// ---- Manifest ---------------------------------------------------------------
phase('Manifest')
const manifest = await agent(
  `${DOCTRINE}

You are Shiva. Produce the evidenced break/deletion manifest for ${scope} from these proven-removable artifacts:
${JSON.stringify(
    proven.map((c) => ({ kind: c.kind, location: c.location, public: c.public, reason: c.verdict.reason, replacement: c.verdict.replacement })),
    null,
    2
  )}

Manifest integrity: ${integrity}
If INCOMPLETE, state that at the top of the manifest — an unproven candidate is neither a confirmed deletion nor a cleared one.

Format:

Nihil Decision: <deletion | public API break | simplification | no-op>

Private removals:
<file:line — what — evidence>

Public breaks (each REQUIRES all fields):
<broken contract | reason preservation is worse | replacement contract | migration path | semver impact | user impact>

If nothing was proven removable, the decision is no-op and you say the code earns its existence. Never pad the manifest.`,
  { label: 'shiva:manifest', phase: 'Manifest' }
)

// ---- Execute (gated) --------------------------------------------------------
if (!execute) {
  return `${manifest}

---
EXECUTION: skipped (read-only). Re-run with args.execute=true to apply the private removals above. Public breaks always require explicit human sign-off and are never auto-applied.`
}

phase('Execute')
const applied = await parallel(
  proven
    .filter((c) => !c.public)
    .map((c) => () =>
      agent(
        `${DOCTRINE}

WRITE-ENABLED. Remove this proven-removable artifact and everything that exists only to support it. Make the smallest coherent edit, update imports/exports, and leave the build consistent. Do NOT touch public/exported contracts.

Target: ${c.kind} at ${c.location}
Reason: ${c.verdict.reason}

Report exactly what you changed (files + lines).`,
        { label: `delete:${c.kind}`, phase: 'Execute', isolation: 'worktree' }
      )
    )
)

return `${manifest}

---
EXECUTED ${applied.filter(Boolean).length} private removal(s) in isolated worktrees:
${applied.filter(Boolean).join('\n\n')}

Public breaks were NOT auto-applied — they require human sign-off.`
