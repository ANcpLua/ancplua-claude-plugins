# ancplua-claude-plugins

Claude Code plugin marketplace — an agent-teams-aware advanced software-engineering
base set. 9 plugins for parallel agent orchestration, parallel code review,
cognitive guardrails, behavior-first test quality, plugin/skill evaluation, and
code-elegance work.

## What this does

Built around Claude Code's multi-agent capabilities — from one-shot subagent
fan-out (exodia spawns up to 12 workers) to the experimental agent-teams feature
(council reconciles an Opus team against a /deep-research report via the Teams API). Each phase is gated — work
only advances when the gate passes. No manual babysitting.

## Plugins

9 plugins, 22 commands, 14 skills, 21 agents:

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

### How does this work without failing?

Every step is a gate. Work only moves forward if the gate says PROCEED.
If it says HALT — the work stops, gets diagnosed, and gets fixed before
anything else continues. No hoping. No skipping. No "it probably works."

## Install

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

9 plugins, 22 commands, 14 skills, 21 agents.

Tri-AI review system: Claude, Copilot, and CodeRabbit review PRs independently.

## GitHub review automation

Codex review lives in `.github/workflows/codex-code-review.yml`.

- Set the `OPENAI_API_KEY` repository secret to enable the workflow
- Codex runs in a `read-only` sandbox with `drop-sudo`
- The workflow posts a formal PR review from structured Codex output
- Self-review is blocked when a PR only changes Codex review automation files

```text
plugins/
├── exodia/                  # parallel agent orchestration (9 commands + 2 skills)
├── council/                 # Opus council + /deep-research workflow (Teams API)
├── elegance-pipeline/       # code elegance scoring + gated refactoring + standalone simplifier
├── metacognitive-guard/     # quality gates + commit integrity + CI verification
├── feature-dev/             # guided feature development + code review
├── mutation-minded-testing/ # behavior-first test quality (4 agents)
├── cc-plugin-eval/          # plugin & skill evaluator (static analysis + benchmarking)
├── html-effectiveness/      # route output to a self-contained HTML file
└── nuget-opensrc/           # commit-pinned NuGet → source fetcher
```

## Links

- [CHANGELOG](CHANGELOG.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Claude Code Plugins docs](https://code.claude.com/docs/en/plugins)

## License

[MIT](LICENSE)
