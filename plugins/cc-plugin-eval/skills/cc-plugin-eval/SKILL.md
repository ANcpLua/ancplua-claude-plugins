---
name: cc-plugin-eval
description: This skill should be used when the user asks to "evaluate this plugin", "evaluate this skill", "give me an analysis of this plugin", "explain the token budget for this plugin", "help me benchmark this plugin", or "What should I run next?". Umbrella entrypoint for local Claude Code plugin and skill evaluation — routes natural chat language to deterministic, zero-dependency analyze/validate/inspect/benchmark/compare/improve workflows. Sub-skills `evaluate-plugin`, `evaluate-skill`, `improve-skill`, and `metric-pack-designer` cover the specialized routes.
version: 0.1.0
author: AncpLua
---

# cc-plugin-eval

Umbrella entrypoint for local plugin and skill evaluation. Deterministic, local-first, zero-dependency.

## Start Here

1. Resolve the target: skill (has `SKILL.md`), plugin (has `.claude-plugin/plugin.json`), or generic folder.
2. For natural-language requests, prefer the chat-first router so the user sees the routed command: `cc-plugin-eval start <path> --request "<user request>" --format markdown`.
3. Hand off to the specialist skill:
   - Plugin-shaped target → `../evaluate-plugin/SKILL.md`.
   - Skill-shaped target → `../evaluate-skill/SKILL.md`.
   - Rewrite plan / brief → `../improve-skill/SKILL.md` (briefs only; rewrite via the user's `skill-creator` plugin).
   - Custom rubric → `../metric-pack-designer/SKILL.md`.
4. If the user names a plugin or skill instead of a path, resolve locally first: the plugin cache directory (`<PLUGIN_CACHE_DIR>/<plugin-id>`) then any repo-local `plugins/<name>` or `skills/<name>`. Ask one short clarifying question if still ambiguous.
5. For "give me a full analysis" requests, run `analyze` then `init-benchmark` and preview the first benchmark command. The detailed chat-phrase → command map lives in `../../references/chat-first-workflows.md`.

## Subcommands

`start` (chat-first router) · `analyze` · `validate` (`--strict` for CI) · `inspect --component <name>` · `explain-budget` · `measurement-plan` · `init-benchmark` · `benchmark` · `improve --brief-out <path>` · `compare before.json after.json` · `report --format html`. Every subcommand accepts `--format markdown|html|json` and writes to `--output <path>`. The matching `npm run <name>` scripts live in `package.json`.

## Output Expectations

- JSON payload is the source of truth; markdown and HTML are renderings.
- Lead with `At a Glance`, `Why It Matters`, `Fix First`, `Recommended Next Step`.
- Mark whether budget numbers are static estimates or measured benchmarks.
- Surface the next chat phrase + `cc-plugin-eval start` command + workflow command behind it.

## When To Hand Off

- Skill rewrite plan → `../improve-skill/SKILL.md` (briefs only; the user's `skill-creator` plugin owns the LLM-graded rewrite).
- Custom rubric → `../metric-pack-designer/SKILL.md`.
- Plugin-specific report → `../evaluate-plugin/SKILL.md`. Skill-specific report → `../evaluate-skill/SKILL.md`.

## References

- `../../references/chat-first-workflows.md`
- `../../references/technical-design.md`
- `../../references/evaluation-result-schema.md`
- `../../references/component-validators.md`
