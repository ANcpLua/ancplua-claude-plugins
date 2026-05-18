---
name: evaluate-skill
description: This skill should be used when the user asks to "evaluate this skill", "give me an analysis of this skill", "audit this skill", "explain why this skill scored that way", "fix what's most important first in this skill", "trim this skill because it is too big", "diagnose why this skill is not triggering", or "measure the real token usage of this skill". Targets a local skill directory or SKILL.md file; deterministic structural and budget signals only — LLM-graded rewrites hand off to the skill-creator plugin.
version: 0.1.0
author: AncpLua
---

# Evaluate Skill

Targets a local skill directory or `SKILL.md` file. cc-plugin-eval covers deterministic structural and budget signals; LLM-graded rubric work and rewrites hand off to the user's `skill-creator` plugin.

## Workflow

1. Default entrypoint: "Evaluate this skill." If the user names a skill instead of a path, resolve under `~/.claude/plugins/cache/<plugin-id>/skills/<skill-name>` first, then any repo-local `skills/<skill-name>`. Ask one short clarifying question if ambiguous.
2. Run `cc-plugin-eval analyze <skill-path> --format markdown` (or the `evaluate-skill` alias, which errors out on non-skill paths). Read `At a Glance` → `Why It Matters` → `Fix First` → `Recommended Next Step` before drilling in.
3. Classify findings as structural (frontmatter, size, links), budget (trigger / invoke / deferred), or best-practice (`allowed-tools` syntax, progressive disclosure).
4. For full analysis, follow with `cc-plugin-eval init-benchmark <skill-path>` and the setup questions in `.cc-plugin-eval/benchmark.json`. For measured usage, run the benchmark flow then `measurement-plan --observed-usage <usage.jsonl>`.
5. For rewrite plans, hand off to `../improve-skill/SKILL.md` (briefs only; rewrite via `skill-creator`).

## Skill-Specific Priorities

The full `CC2xx` catalog with severity, summary, and fix lives in `../../references/component-validators.md`. At a glance:

| Threshold       | Code  | Triggers when…                                       |
| --------------- | ----- | ---------------------------------------------------- |
| >350 lines      | CC208 | SKILL.md exceeds reference-split threshold           |
| >500 lines      | CC210 | SKILL.md is heavy enough to feel sluggish on load    |
| >800 lines      | CC209 | SKILL.md exceeds the hard ceiling                    |

Key check families:

- Frontmatter (CC201–CC206, CC213): `name`/`description` quality, allowed-key set, parseability.
- Trigger / scope (CC203, CC204, CC216): trigger sentence presence, `when_to_use` enrichment, `disable-model-invocation` for task-style skills.
- Links and tools (CC211, CC215): broken refs and `allowed-tools` syntax.
- Helper-script quality: TypeScript and Python files inside the skill.

LLM-graded rubric work hands off to the user's existing `skill-creator` plugin.

## Subcommands

`analyze` · `evaluate-skill` (strict alias) · `explain-budget` · `measurement-plan --observed-usage <usage.jsonl>` · `init-benchmark` · `benchmark`. Every subcommand accepts `--format markdown|html|json` and `--output <path>`.

## References

- `../../references/chat-first-workflows.md`
- `../../references/component-validators.md`
