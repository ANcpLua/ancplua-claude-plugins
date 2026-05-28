# Gold-lift handoff (transient — delete when done)

> **This is a transient handoff brief, not a durable spec.** The durable record
> is [`2026-05-25-marketplace-prune-and-lift-design.md`](2026-05-25-marketplace-prune-and-lift-design.md).
> **When the Gold lift is complete and pushed, delete THIS file
> (`docs/specs/2026-05-25-gold-lift-handoff.md`) and commit its removal** so it
> doesn't linger. Do not leave it in the repo.

## You're picking up

The "Gold lift" of the `ancplua-claude-plugins` marketplace.
Repo: `/Users/ancplua/RiderProjects/ancplua-claude-plugins` (`main`, clean).
Read the design doc first — it has the full niche + cut rationale. The prune
(21→10 plugins) is **DONE**. Your job is **sub-project 3**: get every `SKILL.md`
in the 10 surviving plugins to Gold on TomeVault.

## Survivors (10)

`council`, `exodia`, `elegance-pipeline`, `feature-dev`, `metacognitive-guard`,
`mutation-minded-testing`, `cc-plugin-eval`, `skill-creator`,
`html-effectiveness`, `nuget-opensrc`.

## Primary surface

The 15 `SKILL.md` files under `plugins/*/skills/*/SKILL.md`.
`council` / `feature-dev` / `metacognitive-guard` have no skills — polish their
`plugin.json` descriptions instead.

## Proven Gold pattern

From git history (`c11f1ab` "adopt hades-style multi-IF descriptions to lift
TomeVault scores") and the already-Gold skills (`hades`, `html-effectiveness`,
`skill-creator`): **trigger-rich, multi-IF descriptions** — "IF \<situation\>
THEN use this", eager triggering, concrete use cases, English + German trigger
phrases where relevant. Plus clear headings, worked examples, and explicit
error/edge handling in the body. Reference exemplar:
`plugins/exodia/skills/hades/SKILL.md`.

## Per-skill loop

1. **Baseline.** Run `skill-tools` (`/skill-tools:check <path>` or
   `npx skill-tools lint --format json`) for the 0–100 score + gap list. Run
   `claude plugin validate ./plugins/<name> --strict` for the schema floor.
2. **Compare** the description against an already-Gold one (`hades`).
3. **Rewrite** description + structure to close the gaps.
   **Do NOT change skill behavior/logic** — this is description-engineering, not
   refactoring.
4. **Re-measure.** Re-run `skill-tools`; confirm the score rose.
5. **Commit per-plugin** (small commits), push.

## Gotchas

- **An automation/Relay bot commits to `main` while you work.** Pushes may be
  rejected → `git fetch && git rebase origin/main && git push`. After each push
  confirm `git rev-list --left-right --count origin/main...HEAD` shows `0 0`.
- **TomeVault shows "SKILL" instead of the real name for UNATTESTED entries** —
  a display tier, not a bug. The Relay (installed 2026-05-25) re-attests on
  scan. Fix quality; let the scan catch up. Don't chase the name.
- **Verify with the repo's own gate:** `bash tooling/scripts/sync-marketplace.sh`
  must exit 0 after any `marketplace.json` touch (it also enforces
  `plugin.json` ↔ `marketplace.json` version parity).
- **Never edit `CHANGELOG.md`** to erase history; it's append-only.
- **Sub-project 2 (the bespoke teams-aware validator) stays parked.** This lift
  deliberately uses existing tools so it isn't blocked on a build.

## Success criterion

Every survivor's skills score Gold-equivalent on `skill-tools` and pass
`claude plugin validate --strict`; all changes pushed to `main`; **this handoff
file deleted and its removal committed.**
