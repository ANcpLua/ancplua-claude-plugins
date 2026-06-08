---
name: cc-plugin-eval
description: 'Analyze, lint, and check a local Claude Code add-on or capability, explain the result, and rank the top fixes first. Use when the user says "audit this", "why did it score that way", "what should I fix first", "validate the manifest", "lint the hooks", or "benchmark the real token usage".'
---
# cc-plugin-eval

Use this as the umbrella entrypoint for local Claude Code plugin and skill evaluation. cc-plugin-eval is deterministic, local-first, and zero-dependency.

The runnable command blocks below invoke the shipped script through the plugin root, which works in any checkout: `node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" <command> <args>`. Inline mentions of `cc-plugin-eval <command>` are shorthand for that same invocation; the bare `cc-plugin-eval` alias only exists if you ran `npm link` in the plugin directory.

## Start Here

1. Resolve whether the target path is a skill (contains `SKILL.md`), a plugin (contains `.claude-plugin/plugin.json`), or another local folder.
2. If the user spoke naturally, prefer the chat-first router so they see the routed local command:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" start <path> --request "<user request>" --format markdown
```

3. Map natural chat requests to workflows:
   - "Evaluate this plugin." -> `cc-plugin-eval analyze <path> --format markdown`
   - "Evaluate this skill." -> `cc-plugin-eval analyze <path> --format markdown` (or `evaluate-skill` alias)
   - "Why did this score that way?" -> `cc-plugin-eval analyze <path> --format markdown`
   - "What should I fix first?" -> `cc-plugin-eval analyze <path> --format markdown`
   - "Explain the token budget for this plugin." -> `cc-plugin-eval explain-budget <path> --format markdown`
   - "Validate the manifest." / "Lint this plugin." -> `cc-plugin-eval validate <path> --format markdown`
   - "Inspect the hooks." / "Inspect the mcp servers." -> `cc-plugin-eval inspect <path> --component <name> --format markdown`
   - "Measure the real token usage of this skill." -> `init-benchmark` then `benchmark`, then `analyze --observed-usage`, then `measurement-plan`
   - "Help me benchmark this plugin." -> starter benchmark flow
   - "What should I run next?" -> `cc-plugin-eval start <path> --request "What should I run next?" --format markdown`
4. If the user wants a rewrite plan, route to `../improve-skill/SKILL.md`. That skill produces a brief and then hands the brief to `skill-creator` for the actual rewrite pass.
5. If the user wants a custom rubric, route to `../metric-pack-designer/SKILL.md`.
6. If the user names a plugin or skill instead of giving a path, resolve it locally before running commands. Prefer `~/.claude/plugins/cache/<plugin-id>` for installed plugins, then any repo-local `plugins/<name>` or `skills/<name>` directory. If still ambiguous, ask one short clarifying question.
7. When the request sounds like "give me a full analysis" rather than just "evaluate", do the fuller path:
   - run `analyze`
   - initialize `.cc-plugin-eval/benchmark.json`
   - surface the setup questions that refine the starter scenarios
   - preview the first benchmark command the user can execute next

## Chat Requests To Recognize

- `Evaluate this plugin.`
- `Evaluate this skill.`
- `Give me an analysis of this plugin.`
- `Why did this score that way?`
- `What should I fix first?`
- `Explain the token budget for this plugin.`
- `Validate the manifest.`
- `Lint this plugin.`
- `Inspect the hooks.`
- `Inspect the mcp servers.`
- `Audit the components.`
- `Measure the real token usage of this skill.`
- `Help me benchmark this plugin.`
- `What should I run next?`

## Matching Commands

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" start <path> --request "Evaluate this plugin." --format markdown
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" start <path> --request "Give me a full analysis of this plugin, including benchmark setup." --format markdown
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" analyze <path> --format markdown
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" validate <path> --format markdown
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" validate <path> --strict
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" inspect <path> --component all --format markdown
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" inspect <path> --component hooks --format markdown
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" explain-budget <path> --format markdown
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" measurement-plan <path> --format markdown
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" init-benchmark <path>
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" benchmark <path>
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" improve <path> --brief-out ./skill-brief.json
node "${CLAUDE_PLUGIN_ROOT}/scripts/cc-plugin-eval.js" compare before.json after.json --format markdown
```

## Output Expectations

- Treat the JSON payload as the source of truth. Markdown and HTML are renderings.
- Lead with `At a Glance`, `Why It Matters`, `Fix First`, and `Recommended Next Step`.
- Keep the `why` content terse and easy to skim.
- Call out whether budget numbers are static estimates or measured benchmark results.
- Show the user the exact chat phrase they can reuse next, the `cc-plugin-eval start` command that routes it, and the first local workflow command behind it.
- When the user asks for a full analysis of a named plugin, do not stop at the report if benchmark setup is still missing.
- Hand off to `../evaluate-plugin/SKILL.md` for plugin-specific reports and to `../evaluate-skill/SKILL.md` for skill-specific reports.

## When To Hand Off

- For a skill rewrite plan: `../improve-skill/SKILL.md`. That skill writes a brief and then hands the brief to the `skill-creator` skill (Anthropic's `skill-creator@claude-plugins-official`). cc-plugin-eval focuses on structural and budget signals; skill-creator owns LLM-graded per-skill rewrites.
- For a custom rubric or domain-specific check: `../metric-pack-designer/SKILL.md`.
- For plugin-specific evaluation: `../evaluate-plugin/SKILL.md`.
- For skill-specific evaluation: `../evaluate-skill/SKILL.md`.

## References

- `../../references/chat-first-workflows.md`
- `../../references/technical-design.md`
- `../../references/evaluation-result-schema.md`
- `../../references/component-validators.md`
