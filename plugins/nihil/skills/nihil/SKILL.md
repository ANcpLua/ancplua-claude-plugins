---
name: nihil
description: Last-resort first-principles repository transformation run as a pantheon of dynamic workflows, where no artifact has intrinsic preservation value and every no-op, patch, deletion, public-API break, or rebuild must be justified by evidence. Use for Nihil, first-principles transformation, aggressive architectural simplification, destructive code cleanup, public API redesign, dead-code evaporation, codebase rescue, or last-resort remediation. Routes to the /nihil, /nihil-maat, /nihil-odin, /nihil-shiva, and /nihil-athena workflows.
---

# Nihil: First-Principles Repository Transformation

Nihil is the final escalation path before abandonment, archival, or replacement of a project. Use it only when ordinary review, incremental refactoring, routine remediation, local cleanup, and standard maintenance are insufficient.

Nihil does **not** mean destroy by default. It means **no artifact has intrinsic preservation value**:

- No file is presumed valuable. No abstraction is presumed meaningful. No API is presumed correct.
- No dependency is presumed justified. No convention is presumed wise. No compatibility promise is presumed absolute.
- No deletion is presumed safe without evidence. No rewrite is presumed necessary without evidence. No no-op is presumed acceptable without evidence.

Every artifact must justify its continued existence through current value, semantic clarity, cohesion, correctness, security, maintainability, testability, observability, operability, performance, user impact, and long-term system integrity.

**The goal is the smallest coherent system that deserves to exist** — which may be no change at all.

## The five workflows

The pantheon is delivered as dynamic workflows. Run them directly, or let `/nihil` convene them.

| Command | God | Role |
|---------|-----|------|
| `/nihil` | Zeus orchestrates | Establish authority, inspect, convene the council, issue the verdict and transformation plan |
| `/nihil-maat` | Ma'at verifies | Read-only absence-of-value code-quality review; confidence is not evidence |
| `/nihil-odin` | Odin researches | Deep research; familiarity is not knowledge — every claim cross-checked and cited |
| `/nihil-shiva` | Shiva deletes | Dead code, duplication, and over-broad public API; deletion is permitted, never assumed |
| `/nihil-athena` | Athena restructures | Architecture judgment panel; existing architecture is not sacred |

Install them with `/nihil:summon` (copies the scripts into `.claude/workflows/`). They compose one level deep through the runtime's native `workflow()`.

## Authority — read-only by default

Phase 0 of any Nihil run is **Establish Authority**. If the run has not been explicitly initialized as write-capable, operate as read-only review and do not modify files.

- `/nihil-maat`, `/nihil-odin`, `/nihil-athena`, and `/nihil` never write — they emit reviews, reports, and plans.
- Only `/nihil-shiva` writes, and only with `args.execute=true`, applying just the *private* removals that survived adversarial proof.
- Public-API breaks, rewrites, and rebuilds always require explicit human sign-off — never auto-applied. The master `/nihil` plans and delegates execution to `/nihil-shiva`.

When write-capable, continue until the repository reaches a coherent end state. Do not stop because the change is large, the architecture is familiar, public APIs would break, or deletion feels aggressive. Stop only for missing permissions, missing credentials, unavailable infrastructure, unresolved external product decisions, unsafe uncertainty, or explicit user interruption. **Never leave a degraded intermediate state.**

## Change-magnitude ladder

These rung names are the **canonical Nihil Decision vocabulary** — the single source of
truth. Every workflow's `Nihil Decision:` line uses an exact subset of these tokens; do
not invent synonyms (`rewrite`, `Ex Nihilo`, `Public API correction` are not tokens).
Select the smallest coherent transformation that reaches the target state:

1. **no-op** — preserve unchanged when the current design already justifies itself.
2. **suggestion** — review feedback only (no write access, risk too high, or external decision required).
3. **patch** — the smallest safe change for an isolated defect.
4. **targeted rework** — rewrite a limited area when local structure is the defect.
5. **simplification** — collapse branches, wrappers, modes, flags, or helpers whose complexity exceeds their value.
6. **deletion** — remove dead code, duplication, or an unjustified abstraction outright, with evidence it is unused or superseded.
7. **restructure** — move ownership boundaries, split modules, collapse layers, reshape internal APIs.
8. **public API break** — change exposed behavior or signatures when compatibility preserves a misleading or worse contract.
9. **subsystem replacement** — replace an area when preserving it keeps systemic coupling or security risk alive.
10. **rebuild** (Ex Nihilo) — rebuild from nothing only when no smaller intervention can reach a coherent, validated end state.

## Compatibility rule

Compatibility is user-facing value, but it is not absolute. Public APIs, behavior, conventions, and semver expectations may be broken when preserving them would keep the system less correct, less secure, less cohesive, less expressive, more coupled, more misleading, harder to maintain/test/observe, or semantically dishonest.

No public break ships silently. Every public break states: the broken contract, the reason preservation is worse, the replacement contract, the migration path, the semver impact, the user impact, the validation evidence, and the documentation update.

## Simplicity rule

Simple means semantically direct, idiomatic, cohesive, loosely coupled, easy to name, easy to test, easy to delete, and hard to misuse — **not** "shorter by accident." Prefer standard platform/framework constructs over private abstractions unless the abstraction carries durable domain meaning, centralizes non-trivial policy, removes repeated meaningful complexity, improves correctness, or makes misuse materially harder. A wrapper that only hides a better platform API is debt.

## The god team

The five workflows draw on a wider pantheon of roles. Activate by semantic fit, not fixed order; use the smallest team that covers the risk surface.

**Always active:** Zeus (orchestrate — no agent owns the whole truth), Amaterasu (discover — ambiguity is a defect), Ma'at (verify — confidence is not evidence), Janus (review — no break ships silently).

**By need:** Odin (research), Athena (refactor), Shiva (delete), Anubis (archive before destructive removal), Prometheus (code-judo leverage), Ra (canonical source-of-truth), Thoth (records/output precision), Hermes (routing), Brahma (scaffold), Hephaestus (implement), Nemesis (tests that can fail), Saraswati (document), Horus / Hecate (security & secrets), Themis (policy), Heimdall / Prometheus (observability & metrics), Lakshmi (cost), Hades (storage / hidden debt), Moirai (forecast), Durga (escalate when one god cannot safely resolve the risk).

The evaluated default team for a Nihil run is `k=10`: Ma'at, Hermes, Janus, Prometheus, Thoth, Shiva, Athena, Hades, Odin, Ra.

## Absolute prohibitions

Do not preserve code because it is familiar. Do not delete code because deletion feels powerful. Do not rewrite code because rewriting feels cleaner. Do not break public APIs silently. Do not hide failed validation or claim tests passed when they were not run. Do not fabricate evidence. Do not overwrite unrelated user work. Do not leave the repository half-transformed. Do not create private abstractions that merely rename clearer platform APIs. Do not confuse cleverness with clarity, compatibility with correctness, fewer lines with better design, or a green test suite with a finished transformation.

## Final principle

Nothing is sacred. Nothing is worthless by default. Everything must justify its existence. The best system survives.
