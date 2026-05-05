# Third-Party Notices

cc-plugin-eval is a fork of plugin-eval, originally from OpenAI's plugin-compare/openai-plugins repository (https://github.com/openai/plugins, path `plugins/plugin-eval`). The original code is MIT-licensed.

The MIT License (https://opensource.org/license/mit) terms apply to the ported files in this directory tree:

> MIT License
>
> Copyright (c) 2026 OpenAI
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## Modifications

cc-plugin-eval modifies the original to target Claude Code (https://docs.claude.com/en/code) instead of OpenAI Codex. Specifically:

- Replaces `.codex-plugin/plugin.json` detection with `.claude-plugin/plugin.json`.
- Replaces the Codex `interface{}` block validation with eight new evaluators (manifest, hooks, mcp, lsp, monitors, agents, marketplace, userconfig).
- Replaces `codex exec` with `claude` in the benchmark harness.
- Replaces the `~/.codex/` path conventions with `~/.claude/`.
- Replaces the Codex marketplace shape (`.agents/plugins/marketplace.json` with `policy{installation, authentication}`) with the Claude shape (`.claude-plugin/marketplace.json` with `{name, owner, plugins[]}`).
- Adds new CLI subcommands: `validate`, `inspect`, `evaluate-skill`, `improve`.

## Files ported and derivative status

Verbatim ports (no semantic changes; identifying header `// Ported from openai/plugins plugin-eval (MIT). See ../../THIRD_PARTY_NOTICES.md.`):

- `src/index.js`
- `src/core/compare.js`
- `src/core/measurement-plan.js`
- `src/core/observed-usage.js`
- `src/core/scoring.js`
- `src/core/benchmark-events.js`
- `src/lib/files.js`
- `src/lib/frontmatter.js`
- `src/lib/tokens.js`
- `src/renderers/index.js`
- `src/evaluators/code.js`
- `src/evaluators/coverage.js`
- `src/evaluators/python.js`
- `src/evaluators/typescript.js`
- `fixtures/coverage-samples/*`
- `fixtures/observed-usage/responses.jsonl`
- `fixtures/ts-python-sample/*`
- `fixtures/metric-pack/emit-pack.js`

Derivative ports (modified for Claude Code; identifying header `// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.`):

- `scripts/cc-plugin-eval.js`
- `src/cli.js`
- `src/core/analyze.js`
- `src/core/baseline.js`
- `src/core/budget.js`
- `src/core/improvement-brief.js`
- `src/core/metric-packs.js`
- `src/core/presentation.js`
- `src/core/schema.js`
- `src/core/target.js`
- `src/core/workflow-guide.js`
- `src/core/benchmark.js`
- `src/core/benchmark-workspace.js`
- `src/evaluators/skill.js`
- `src/evaluators/plugin.js`
- `src/renderers/markdown.js`
- `src/renderers/html.js`
- `tests/cc-plugin-eval.test.js`
- `references/chat-first-workflows.md`
- `references/technical-design.md`
- `references/evaluation-result-schema.md`
- `references/observed-usage.md`
- `references/metric-pack-manifest.md`
- `references/benchmark-harness.md`
- `fixtures/minimal-skill/*`

New files (no OpenAI provenance):

- `src/evaluators/manifest.js`
- `src/evaluators/hooks.js`
- `src/evaluators/mcp.js`
- `src/evaluators/lsp.js`
- `src/evaluators/monitors.js`
- `src/evaluators/agents.js`
- `src/evaluators/marketplace.js`
- `src/evaluators/userconfig.js`
- `references/component-validators.md`
- `fixtures/full-plugin/*`
- `fixtures/broken-plugin/*`
- `skills/cc-plugin-eval/SKILL.md`
- `skills/evaluate-plugin/SKILL.md`
- `skills/evaluate-skill/SKILL.md`
- `skills/improve-skill/SKILL.md`
- `skills/metric-pack-designer/SKILL.md`
- `THIRD_PARTY_NOTICES.md`

## License of derivative work

The cc-plugin-eval modifications are also released under MIT, copyright (c) 2026 AncpLua. See the LICENSE file at the repository root.
