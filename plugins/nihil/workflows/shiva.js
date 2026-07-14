export const meta = {
  name: 'nihil-shiva',
  description:
    'Nihil / Shiva — deletion and public-API evaporation. Backward compatibility is not sacred. Loop-until-dry sweep for dead code, duplication, unjustified abstractions, upstream reimplementations, and over-broad public surface; every candidate must survive a per-file usage census (call sites, parameter audit, dependency supersession, cohesion) before it reaches the evidenced break/deletion manifest. Read-only by default.',
  whenToUse:
    'When artifacts may no longer earn their existence and you want an evidenced deletion + public-break manifest. Pass args.scope (path/glob, default whole repo) and args.execute=true ONLY to apply removals after review. Deletion is permitted, never assumed.',
  phases: [
    { title: 'Sweep', detail: 'multi-modal hunt for removal candidates, loop until dry' },
    { title: 'Prove', detail: 'usage census per file: call sites, parameter audit, supersession, cohesion' },
    { title: 'Manifest', detail: 'evidenced break/deletion manifest' },
    { title: 'Execute', detail: 'apply only when args.execute === true' },
  ],
}

const scope = (args && args.scope) || 'the whole repository'
const execute = !!(args && args.execute)

const DOCTRINE = `You serve Nihil / Shiva, destroyer of what no longer earns its keep. Deletion is permitted, never assumed. Nothing is removed merely because removal is dramatic. Every removal needs evidence (no references, dead path, superseded API, duplicate of a canonical helper). Public APIs may be broken when preserving them keeps a worse contract alive — but no public break ships silently. Cite file:line and the evidence for every candidate.

What survives must be maximally cohesive, loosely coupled, and expressive to read. Never preserve a homegrown copy of what the platform or a referenced dependency already ships — read the dependency's actual API before concluding it doesn't. Never create or tolerate near-identical names for different things (types, targets, models, paths); confusable names cause edits to land in the wrong artifact. Think ahead: a parameter nobody varies, a helper with one caller, an abstraction with one implementation — each is a removal, narrowing, or relocation candidate.`

// Multi-modal finders: each hunts a different class, blind to the others.
const FINDERS = [
  { key: 'dead-code', hunt: 'unreachable code, unexported/unused symbols, functions and files with no inbound references, commented-out blocks, dead feature flags and their branches, and parameters that are unused in the body or passed the same value at every call site.' },
  { key: 'duplication', hunt: 'copy-pasted logic and near-duplicate helpers that should collapse into one canonical implementation.' },
  { key: 'thin-abstraction', hunt: 'wrappers, identity/pass-through helpers, and private aliases that only rename a clearer platform API and carry no durable policy.' },
  { key: 'public-surface', hunt: 'exported/public API that is over-broad, redundant, misleading, or no longer used by any consumer — candidates for narrowing or a documented break.' },
  { key: 'dependency', hunt: 'dependencies, build steps, or config that nothing live depends on.' },
  { key: 'upstream-reimplementation', hunt: 'homegrown helpers, targets, or pipelines that reimplement a facility a referenced dependency or the platform already ships (inspect the package references, then the dependency’s public API/source before assuming the local copy is needed), and glue made obsolete by a newer platform capability (e.g. credential-push plumbing superseded by trusted publishing).' },
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

const VERDICTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'removable', 'action', 'callSites', 'reason'],
        properties: {
          id: { type: 'string', description: 'the candidate id this verdict answers' },
          removable: { type: 'boolean', description: 'true only if the census proves the action is safe (or a public break is justified)' },
          action: { type: 'string', enum: ['delete', 'narrow-params', 'replace-with-upstream', 'relocate', 'keep'], description: 'what the evidence supports' },
          callSites: { type: 'integer', description: 'inbound reference count found by the census (excluding the definition itself)' },
          unusedParameters: { type: 'array', items: { type: 'string' }, description: 'parameters unused in the body or identical at every call site (narrow-params)' },
          reason: { type: 'string', description: 'the census evidence, citing file:line' },
          replacement: { type: 'string', description: 'the upstream API / canonical helper / migration path when action is replace-with-upstream or a public break' },
        },
      },
    },
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

// ---- Prove: usage census per file, not blind refutation per candidate -------
// Candidates are grouped by file so one prover shares the Read/Grep context for
// everything in that file, instead of N agents re-reading the same code.
phase('Prove')
const byFile = new Map()
for (const c of fresh) {
  const file = c.location.split(':')[0]
  if (!byFile.has(file)) byFile.set(file, [])
  byFile.get(file).push(c)
}

const proofBatches = await parallel(
  [...byFile.entries()].map(([file, cs]) => () =>
    agent(
      `${DOCTRINE}

You are the census-taker. Run this procedure for EVERY candidate below (all live in ${file}); return one verdict per candidate id. Default removable=false.

1. USAGE CENSUS — Grep the whole repo for every reference (direct call, reflection, dynamic dispatch, DI/config wiring, tests, docs, external consumers). Record the inbound call-site count with file:line. Zero references is evidence; "I searched" without the hits shown is not.
2. PARAMETER AUDIT — when the candidate is (or contains) a callable: list its parameters, and for each one check the body AND every call site. A parameter unused in the body, or passed the same value everywhere, is independently removable → action=narrow-params with unusedParameters, even when the callable itself stays.
3. SUPERSESSION — check the referenced dependencies and the platform: does a built-in already provide this? Read the dependency's actual API before concluding it doesn't. If it does → action=replace-with-upstream with the exact upstream symbol as replacement.
4. COHESION — think ahead. Is a "used" artifact used somewhere else in a similar style such that the two should collapse into one canonical form? Does it have a single caller it should live next to (action=relocate)? Would the removal make the surviving code more cohesive and loosely coupled, or just smaller?

removable=true only when the census proves the action safe OR (public items) the break is justified with a stated replacement/migration. Otherwise action=keep with the dependency you found.

Candidates:
${JSON.stringify(cs.map((c) => ({ id: c.id, kind: c.kind, location: c.location, claimedEvidence: c.evidence, public: c.public })), null, 2)}`,
      { label: `prove:${file}`, phase: 'Prove', schema: VERDICTS_SCHEMA }
    )
  )
)

const verdictById = new Map()
for (const batch of proofBatches) {
  if (!batch || !batch.verdicts) continue
  for (const v of batch.verdicts) verdictById.set(v.id, v)
}
const judged = fresh.map((c) => ({ ...c, verdict: verdictById.get(c.id) }))

const droppedProofs = judged.filter((c) => !c.verdict).length
const proven = judged.filter((c) => c.verdict && c.verdict.removable && c.verdict.action !== 'keep')
const integrity =
  droppedProofs > 0
    ? `INCOMPLETE: ${droppedProofs} proof agent(s) did not return — this manifest is NOT exhaustive; unproven candidates were neither confirmed nor cleared.`
    : 'Every candidate was adversarially proven.'
log(`${proven.length} of ${fresh.length} candidate(s) proven removable. ${integrity}`)

// ---- Manifest ---------------------------------------------------------------
phase('Manifest')
const manifest = await agent(
  `${DOCTRINE}

You are Shiva. Produce the evidenced break/deletion manifest for ${scope} from these proven artifacts:
${JSON.stringify(
    proven.map((c) => ({ kind: c.kind, location: c.location, public: c.public, action: c.verdict.action, callSites: c.verdict.callSites, unusedParameters: c.verdict.unusedParameters, reason: c.verdict.reason, replacement: c.verdict.replacement })),
    null,
    2
  )}

Manifest integrity: ${integrity}
If INCOMPLETE, state that at the top of the manifest — an unproven candidate is neither a confirmed deletion nor a cleared one.

Format:

Nihil Decision: <deletion | public API break | simplification | no-op>

Private removals (action=delete):
<file:line — what — census evidence (call-site count)>

Parameter narrowings (action=narrow-params):
<file:line — callable — parameters to drop and why>

Upstream replacements (action=replace-with-upstream):
<file:line — homegrown artifact — the upstream API that supersedes it>

Relocations (action=relocate):
<file:line — artifact — where it belongs and why cohesion improves>

Public breaks (each REQUIRES all fields):
<broken contract | reason preservation is worse | replacement contract | migration path | semver impact | user impact>

If nothing was proven removable, the decision is no-op and you say the code earns its existence. Never pad the manifest.`,
  { label: 'shiva:manifest', phase: 'Manifest' }
)

// ---- Execute (gated) --------------------------------------------------------
if (!execute) {
  return `${manifest}

---
EXECUTION: skipped (read-only). Re-run with args.execute=true to apply the private deletions and parameter narrowings above. Upstream replacements, relocations, and public breaks always require explicit human sign-off and are never auto-applied.`
}

phase('Execute')
const applied = await parallel(
  proven
    .filter((c) => !c.public && (c.verdict.action === 'delete' || c.verdict.action === 'narrow-params'))
    .map((c) => () =>
      agent(
        `${DOCTRINE}

WRITE-ENABLED. Apply this proven verdict with the smallest coherent edit, update imports/exports and every call site, and leave the build consistent. Do NOT touch public/exported contracts, and do NOT introduce names confusable with existing ones.

Target: ${c.kind} at ${c.location}
Action: ${c.verdict.action}${c.verdict.unusedParameters && c.verdict.unusedParameters.length ? `\nParameters to drop: ${c.verdict.unusedParameters.join(', ')}` : ''}
Reason: ${c.verdict.reason}

Report exactly what you changed (files + lines).`,
        { label: `${c.verdict.action}:${c.kind}`, phase: 'Execute', isolation: 'worktree' }
      )
    )
)

return `${manifest}

---
EXECUTED ${applied.filter(Boolean).length} private deletion(s)/narrowing(s) in isolated worktrees:
${applied.filter(Boolean).join('\n\n')}

Upstream replacements, relocations, and public breaks were NOT auto-applied — they require human sign-off.`
