# ancplua-claude-plugins

Claude Code plugin marketplace — an agent-teams-aware advanced software-engineering
base set. 13 plugins for parallel agent orchestration, PR-to-merge ferrying,
dependency migration, first-principles repo transformation, parallel code review,
cognitive guardrails, behavior-first test quality, plugin/skill evaluation, and
code-elegance work.

## What this does

Built around Claude Code's multi-agent capabilities — from one-shot subagent
fan-out (exodia spawns up to 12 workers) to the experimental agent-teams feature
(council reconciles an Opus team against a /deep-research report via the Teams API). Each phase is gated — work
only advances when the gate passes. No manual babysitting.

## Plugins

13 plugins, 24 commands, 23 skills, 30 agents:

| Plugin                      | What it does in plain language                                                                                                                                              |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **exodia**                  | Summons up to 12 AI workers that tackle different parts of your code simultaneously. One finds problems, another fixes them, another reviews the fix — all at the same time |
| **council**                 | Council for complex tasks. Opus captain decomposes and runs the /deep-research dynamic workflow, an Opus synthesizer reasons over it, an Opus clarity agent gap-checks it live, and an Opus janitor flags bloat (Teams API) |
| **elegance-pipeline**       | Multi-agent pipeline that scores code elegance and refactors the weakest files through gated stages — plus a standalone simplifier for quick diff cleanups                  |
| **metacognitive-guard**     | Watches the AI while it works. If it's about to cut corners, guess instead of verify, or say "done" when it isn't — this blocks it before the mistake happens               |
| **feature-dev**             | A guided process for building new things: understand what exists, design the plan, build it, review it. No skipping steps                                                   |
| **mutation-minded-testing** | Judges whether your tests actually catch bugs, not just cover lines. Four agents review architecture, test quality, and expressiveness                                      |
| **cc-plugin-eval**          | Evaluates and scores Claude Code plugins and skills: static analysis, token budgeting, and benchmarking across every component type                                        |
| **html-effectiveness**      | Routes output into a single self-contained HTML file — dashboards, reports, code reviews, slide decks — instead of a wall of markdown                                       |
| **nuget-opensrc**           | Fetches the exact source a NuGet package was built from, so the agent greps real code instead of guessing API shapes                                                        |
| **charon**                  | Babysits a pull request all the way to merge — fixes the CI, repairs conflicts, checks reviewer suggestions against real code, and never just says "wait". Say "merge my PR" and it ferries it home |
| **derot**                   | Hunts truth-drift — stale comments, dead docs, wrong versions, dependency rot — and proposes fixes; `/depmigrate` migrates a package to its newer API and deletes the old code, gated by an adversarial refutation check |
| **nihil**                   | The last-resort cleanup judge: decides whether each artifact still earns its existence and plans the smallest transformation that deserves to exist — nothing is sacred, and every deletion must survive a "prove it's not safe to remove" check |
| **tomevault-publish**       | Publishes a skill, config, or plugin to TomeVault as a high-grade Tome, and explains the Skill / Tome / AGENTS.md model and grading rubric behind it |

### How does this work without failing?

Every step is a gate. Work only moves forward if the gate says PROCEED.
If it says HALT — the work stops, gets diagnosed, and gets fixed before
anything else continues. No hoping. No skipping. No "it probably works."

## Install

### Codex

This repo also ships a Codex marketplace at `.agents/plugins/marketplace.json`.
For local development, register this checkout as a Codex marketplace:

```bash
codex plugin marketplace add /Users/ancplua/RiderProjects/ancplua-claude-plugins
```

Then install plugins from the `ancplua-claude-plugins` marketplace in Codex.

### Claude Code

Add the marketplace, then install plugins individually:

```bash
# Add the marketplace
/plugin marketplace add ANcpLua/ancplua-claude-plugins

# Install plugins you want
/plugin install exodia@ancplua-claude-plugins
/plugin install council@ancplua-claude-plugins
/plugin install metacognitive-guard@ancplua-claude-plugins
/plugin install elegance-pipeline@ancplua-claude-plugins
/plugin install cc-plugin-eval@ancplua-claude-plugins
```

## Technical details

Claude package counts: 13 plugins, 24 commands, 23 skills, 30 agents.
Codex migration adds 13 Codex plugin manifests, a repo-local Codex marketplace,
24 command-derived Codex skills, and 30 repo-local Codex custom agents.

(Counts cover shipped marketplace plugins; cc-plugin-eval's `fixtures/` test corpus is excluded.)

Tri-AI review system: Claude, Copilot, and CodeRabbit review PRs independently.

## GitHub review automation

Two workflows drive PR automation:

- **`.github/workflows/auto-merge.yml`** — enables native GitHub auto-merge (squash) for
  Codex-authored PRs (`codex/` branches) and Copilot-authored PRs (`copilot/` branches),
  plus any manual PR approved by `chatgpt-codex-connector[bot]`. Renovate enables its own
  native auto-merge, so it needs no entry here.
- **`.github/workflows/claude.yml`** — runs the Claude Code action on `@claude` mentions in
  issues, pull-request reviews, and comments. The Codex review prompt and output schema live
  in `.github/codex/` (`prompts/review.md`, `schemas/review-output.schema.json`).

```text
plugins/
├── exodia/                  # parallel agent orchestration (7 commands + 2 skills)
├── council/                 # Opus council + /deep-research workflow (Teams API)
├── elegance-pipeline/       # code elegance scoring + gated refactoring + standalone simplifier
├── metacognitive-guard/     # quality gates + commit integrity + CI verification
├── feature-dev/             # guided feature development + code review
├── mutation-minded-testing/ # behavior-first test quality (4 agents)
├── cc-plugin-eval/          # plugin & skill evaluator (static analysis + benchmarking)
├── html-effectiveness/      # route output to a self-contained HTML file
├── nuget-opensrc/           # commit-pinned NuGet → source fetcher
├── charon/                  # ferries a GitHub PR to merge — never waits forever
├── derot/                   # truth-drift hunt + dependency migration (/depmigrate)
├── nihil/                   # evidence-gated first-principles repo transformation
└── tomevault-publish/       # publish skills / configs / plugins to TomeVault as Tomes
```

## Links

- [CHANGELOG](CHANGELOG.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Claude Code Plugins docs](https://code.claude.com/docs/en/plugins)

## License

[MIT](LICENSE)
