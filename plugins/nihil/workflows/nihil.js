export const meta = {
  name: 'nihil',
  description:
    'Nihil — first-principles repository transformation ("Touch of God"). The last escalation before abandonment. Nothing is sacred, nothing is worthless by default; every artifact must justify its existence by evidence. Establishes authority, inspects the repo, convenes the specialist gods (Odin, Ma\'at, Shiva, Athena), and synthesizes the smallest coherent transformation that deserves to exist. Always read-only: it plans, and delegates write execution to the specialist gods (run /nihil-shiva execute=true to apply proven-safe removals).',
  whenToUse:
    'Only when ordinary review, incremental refactoring, and routine remediation are insufficient. Pass args.scope (default "diff") and args.research (a question for Odin, optional). Nihil always emits a read-only plan; apply it deliberately via /nihil-shiva execute=true after review.',
  phases: [
    { title: 'Authority', detail: 'establish read-only vs write-capable' },
    { title: 'Inspect', detail: 'map repo state, constraints, public surfaces' },
    { title: 'Council', detail: 'convene the specialist gods in parallel' },
    { title: 'Judgment', detail: 'Zeus + Ma\'at synthesize the Nihil verdict' },
  ],
}

const scope = (args && args.scope) || 'diff'
const research = args && args.research

// ---- Scope preflight: workflow agents inherit the session cwd; an absolute ----
// scope outside this repo cannot be audited from here. Abort cheaply instead.
if (/(^|\s)\//.test(scope)) {
  const preflight = await agent(
    `Run \`git rev-parse --show-toplevel\` (fall back to \`pwd\` outside a git repo) and report that root. The requested scope/target is:
${scope}

Decide whether every absolute path in it lies INSIDE the root you found. A path outside it (a different repository or directory tree) is out of reach: workflow agents cannot be retargeted. Do not start any other work.`,
    {
      label: 'scope:preflight',
      phase: 'Authority',
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
    return `ABORTED: the requested scope does not resolve inside this session's repository${preflight ? ` (${preflight.root})` : ''}. Workflow agents inherit the session working directory and cannot be retargeted by scope prose \u2014 start a Claude Code session in the target repo and re-run /nihil there.${preflight && preflight.reason ? ` Detail: ${preflight.reason}` : ''}`
  }
}


const DOCTRINE = `You serve Nihil. Doctrine: nothing is sacred, nothing is worthless by default, everything must justify its existence by evidence. Preservation, change, deletion, compatibility breakage, and rebuilds all require justification. No artifact survives by sentiment, age, popularity, ownership, or sunk cost. No public break ships silently. Select the SMALLEST coherent transformation that reaches a coherent end state. Never leave a degraded intermediate state.`

// ---- Phase 0: Establish Authority ------------------------------------------
phase('Authority')
log('Nihil — producing an evidenced transformation plan. Nihil never writes; execution is delegated to the specialist gods after the plan is reviewed.')

// ---- Phase 1: Inspect the Repository ---------------------------------------
phase('Inspect')
const brief = await agent(
  `${DOCTRINE}

Inspect this repository before any judgment. Report concisely:
- repository status, current branch, and any pending uncommitted user changes (do NOT propose touching unrelated user work)
- build/test/lint commands and how validation is run
- package manager + lockfiles
- public API / exported surfaces and any semantic-versioning or release constraints
- generated files, CI gates, ownership boundaries, and existing canonical helpers
Target scope for this run: ${scope === 'diff' ? 'the current branch diff' : scope}
Never invent repository facts; if something is unknown, say so.`,
  { label: 'nihil:inspect', phase: 'Inspect' }
)

// ---- Phase 2: Convene the Council (native one-level workflow composition) ---
phase('Council')
const researchReport = research
  ? await workflow('nihil-odin', { question: research })
  : 'Odin not convened (no args.research supplied).'

// Ma'at (review), Shiva (deletion manifest), Athena (restructure) are
// independent analyses — run them concurrently as one level of nesting.
const [review, deletions, restructure] = await parallel([
  () => workflow('nihil-maat', { scope }),
  () => workflow('nihil-shiva', { scope, execute: false }),
  () => workflow('nihil-athena', { target: scope === 'diff' ? 'the current branch diff' : scope }),
])

// ---- Phase 3: Judgment ------------------------------------------------------
phase('Judgment')
const verdict = await agent(
  `${DOCTRINE}

You are Zeus, coordinating with Ma'at who holds the approval bar. Synthesize the final Nihil verdict for scope "${scope}". No single god owns the whole truth — reconcile them and prevent local optimization from harming the whole system.

Repository brief:
${brief}

Odin (research):
${researchReport}

Ma'at (code-quality review):
${review}

Shiva (deletion / public-break manifest):
${deletions}

Athena (restructure plan):
${restructure}

Produce exactly:

Nihil Decision:
<no-op | suggestion | patch | targeted rework | simplification | deletion | restructure | public API break | subsystem replacement | rebuild>

Selected Gods:
<which gods drove the decision and why>

Evidence:
<the concrete facts behind the decision>

Transformation Plan (smallest coherent change first):
<ordered, behavior-preserving where possible; mark any public break with broken contract / reason / replacement / migration / semver / user impact>

Preserved Artifacts:
<what survives and why it earns its existence>

Public API / Compatibility Impact:
<none | compatible | breaking>

Validation Required:
<the checks that must pass before this ships>

Risk:
<remaining risk + mitigation>

Final Judgment:
<why this plan leaves the repository coherent, or the hard blocker preventing completion>

If the gods found nothing that justifies change, the decision is no-op and you say the system already earns its existence. Do not manufacture a transformation to look decisive.`,
  { label: 'nihil:verdict', phase: 'Judgment' }
)

return `${verdict}

---
EXECUTION: Nihil plans; it does not write. To apply Shiva's proven-safe private removals, run /nihil-shiva with the same scope and execute=true after reviewing this plan. Public breaks, rewrites, and rebuilds are applied deliberately by a human — never by the orchestrator.`
