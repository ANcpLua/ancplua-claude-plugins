# DevOps Excellence (CALMS Framework)

## Culture

- **Blameless post-mortems:** When things fail, focus on systemic improvements
- **Shared ownership:** All agents (Claude, Copilot, Codex, Jules, Gemini, CodeRabbit) share responsibility
- **Fast feedback:** Validate early and often

## Automation

- **CI/CD:** All changes go through `.github/workflows/ci.yml`
- **Validation:** `weave-validate.sh` is the single source of truth
- **No manual steps:** If it can be automated, it must be

## Lean

- **Small batches:** Prefer multiple small PRs over one large PR
- **Minimize waste:** Don't over-document, don't over-engineer
- **Build quality in:** Validate during development, not after

## Measurement

Track these DORA-inspired metrics:

| Metric               | Target  | How to Measure           |
|----------------------|---------|--------------------------|
| Validation Pass Rate | >95%    | CI green on first push   |
| Lead Time            | <1 hour | Commit to merge time     |
| Change Failure Rate  | <15%    | PRs requiring fixes      |
| Recovery Time        | <30 min | Time to fix broken build |

## Sharing

- **Document decisions:** ADRs for architecture, specs for features
- **Cross-agent communication:** AGENTS.md, CLAUDE.md, GEMINI.md
- **Knowledge transfer:** Skills encode reusable workflows
