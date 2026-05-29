# Eight Gates — Gate Summaries

Per-gate entry conditions, agent counts, intent, and exit conditions. Each gate's
full specialist instructions live in the matching `../templates/gate-0N-*.md`.

## Gate 1: 開門 KAIMON — SCOPE

> Removes mental inhibitions → removes ambiguity.

**Entry:** Session initialized. **Agents:** 0 (lead only).

Before tools. Before code. Before "analysis." The agent must produce a scope
statement: what is in, what is out, what "done" means, and when to stop.
If the scope can't be made crisp, the gate stays closed.

Gate 1 also sets one primary anchor. If the objective centers on a spec or ADR,
that file stays primary until Gate 8 or an explicit re-anchor decision is logged.
Do not pivot to another spec implicitly.

**Template:** [../templates/gate-01-scope.md](../templates/gate-01-scope.md)
**Exit:** Scope document exists. PROCEED. Ambiguous → HALT, ask user.

---

## Gate 2: 休門 KYŪMON — CONTEXT

> Increases strength, re-energizes → loads passive context.

**Entry:** Gate 1 PROCEED. **Agents:** 0-2.

Load only what is always true for the repo: conventions, standards, quality bars,
tooling guardrails. Build an artifact cache of expensive-to-reconstruct facts.
This is Yin: form, intent, meaning. No execution yet.

**Template:** [../templates/gate-02-context.md](../templates/gate-02-context.md)
**Exit:** Context loaded, assumptions verified. PROCEED. Critical assumption wrong → HALT.

---

## Gate 3: 生門 SEIMON — MAP

> Skin turns red, visible change → creates visible work items.

**Entry:** Gate 2 PROCEED. **Agents:** 4-12 (from Gate 1 estimate).

Parallel discovery. Run specialist agents per objective type (BUG/AUDIT/FEATURE/CLEANUP).
Each returns findings, evidence, confidence, assumptions. No agent implements changes.
MAP means observe and report, not edit and pray. ALL agents launch in ONE message.

**Template:** [../templates/gate-03-map.md](../templates/gate-03-map.md)
**Exit:** >=80% agents complete → PROCEED. <80% → report partial, offer retry.

---

## Gate 4: 傷門 SHŌMON — CHECKPOINT

> Muscles tear, bleeding → persistence is painful but necessary.

**Entry:** Gate 3 PROCEED. **Agents:** 0 (lead only).

State snapshot. Decision log. Artifact cache.
No checkpoint = no progress. This is how multi-round workflows stay sane.
Mark each finding with a hash so re-runs skip already-processed work.

**Template:** [../templates/gate-04-checkpoint.md](../templates/gate-04-checkpoint.md)
**Exit:** Always PROCEED (bookkeeping can't fail).

---

## Gate 5: 杜門 TOMON — REFLECT

> Compound fractures → hitting the wall, bounded reflection.

**Entry:** Gate 4 PROCEED. **Agents:** 1 (hard limit).

Reflection is powerful — and expensive — so it gets rules. One round.
Three questions per finding. If the agent wants to philosophize: stop.
Run the mini-test instead. Evidence beats eloquence.

**Template:** [../templates/gate-05-reflect.md](../templates/gate-05-reflect.md)
**Exit:** Always PROCEED. Reflection informs, it doesn't block.

---

## Gate 6: 景門 KEIMON — REDUCE

> All abilities increase, Morning Peacock → sees everything clearly.

**Entry:** Gate 5 PROCEED. **Agents:** 0-1.

Parallel work produces fragments. This gate merges them into one canonical queue.
Deduplicate. Resolve contradictions. Create kill list (work that should NOT be done).
Assign file ownership — one agent per file. Order by dependency.

**Template:** [../templates/gate-06-reduce.md](../templates/gate-06-reduce.md)
**Exit:** Work queue exists with clear ownership. PROCEED. Conflicts unresolvable → HALT.

---

## Gate 7: 驚門 KYŌMON — EXECUTE

> Blue sweat, compressed air → creates real output under pressure.

**Entry:** Gate 6 PROCEED. **Agents:** 1-12 (lanes from dependency graph).

Execution happens in small commits. Implement a chunk, verify, checkpoint, continue.
Parallelism is disciplined: lanes own files, avoid collisions, report back.
For L/XL objectives: Agent Teams with delegate mode.

**Template:** [../templates/gate-07-execute.md](../templates/gate-07-execute.md)
**Exit:** All lanes + build + tests pass → PROCEED. Remaining → ITERATE Gate 7. Fail → HALT.

---

## Gate 8: 死門 SHIMON — HAKAI

> Heart pumps maximum, reduces to ash → irreversible finalization.

**Entry:** Gate 7 PROCEED. Build passes. Tests pass. **Agents:** 0-4.

The Death Gate. Nothing final happens without verified preconditions.
The point isn't destruction. The point is truth: only what survives verification exists.
If deletions happen: Smart ID + deletion permit + append-only audit ledger.
Irreversible actions require explicit logging and (for externals) human approval.

**Template:** [../templates/gate-08-hakai.md](../templates/gate-08-hakai.md)
**Exit:** SHIP (all green) or ITERATE (back to Gate 7). No "mostly done."
