---
name: evaluate-skill
description: >
  Evaluate a local Claude Code skill (a directory containing SKILL.md). Use
  when the user says: "evaluate this skill", "give me an analysis of this
  skill", "audit this skill", "why did this skill score that way", "what
  should I fix first in this skill", "this skill is too big", "this skill is
  not triggering", or "measure the real token usage of this skill".
---

# Evaluate Skill

Use this skill when the target is a local skill directory or a `SKILL.md` file. cc-plugin-eval handles the structural and budget signals deterministically without an LLM. If the user wants an LLM-graded rubric or a rewrite pass, hand off to the user's existing `skill-creator` plugin (`../../../skill-creator/skills/skill-creator/SKILL.md`) - that plugin specializes in single-skill grading and rewrites, while cc-plugin-eval focuses on structural and budget signals.

## Workflow

1. Treat "Evaluate this skill." as the default entrypoint.
2. If the user names a skill instead of giving a path, resolve it locally first. Prefer `~/.claude/plugins/cache/<plugin-id>/skills/<skill-name>` for installed-plugin skills, then any repo-local `skills/<skill-name>` directory. If the name is still ambiguous, ask one short clarifying question before running commands.
3. If the user says the request in natural language first, run `cc-plugin-eval start <skill-path> --request "<user request>" --format markdown` to show the routed path clearly.
4. Run `cc-plugin-eval analyze <skill-path> --format markdown`. The convenience alias `cc-plugin-eval evaluate-skill <skill-path>` returns the same payload but errors out if the path is not a skill.
5. Review `At a Glance`, `Why It Matters`, `Fix First`, and `Recommended Next Step` before drilling into details.
6. Explain which findings are structural (frontmatter validity, file size, broken links), which are budget-related (trigger / invoke / deferred), and which are best-practice (allowed-tools syntax, progressive disclosure).
7. If the user asks for an "analysis" of the skill, do not stop at the report. Also run `cc-plugin-eval init-benchmark <skill-path>` and show the setup questions for refining the starter scenarios in `.cc-plugin-eval/benchmark.json`.
8. If the user wants real usage numbers, switch to "Measure the real token usage of this skill." and run the benchmark flow.
9. After observed usage is available, use `cc-plugin-eval measurement-plan <skill-path> --observed-usage <usage.jsonl> --format markdown` to recommend what to instrument next.
10. If the user wants a rewrite plan, route to `../improve-skill/SKILL.md`. That skill writes a brief and hands it to the user's existing `skill-creator` plugin for the actual rewrite.

## Skill-Specific Priorities

- frontmatter validity (CC213) and the Claude allowed-key set (`name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`, `license`, `metadata`)
- `name` and `description` quality (CC201, CC202, CC203, CC204, CC205, CC206)
- progressive disclosure thresholds: `>350 lines` (CC208), `>500 lines` (CC210), `>800 lines` (CC209)
- broken relative links and supported URI schemes (CC211): allow-list includes `claude://`, `app://`, `plugin://`, `rules://`, `mailto:`, `http://`, `https://`, `#`
- oversized SKILL.md or descriptions
- `allowed-tools` syntax (CC215): Claude tool names are PascalCase (`Bash`, `Read`, `Edit`, `Skill`, `mcp__server__tool`); strings should be space-separated or YAML lists, not comma-separated
- explicit `disable-model-invocation: true` on task-style skills (CC216) where automatic invocation would be wrong
- helper script quality for TypeScript and Python files

## Chat Requests To Recognize

- `Evaluate this skill.`
- `Give me an analysis of this skill.`
- `Audit this skill.`
- `Why did this skill score that way?`
- `What should I fix first?`
- `This skill is too big.`
- `This skill is not triggering.`
- `Measure the real token usage of this skill.`

## Commands

```bash
cc-plugin-eval start <skill-path> --request "Evaluate this skill." --format markdown
cc-plugin-eval analyze <skill-path> --format markdown
cc-plugin-eval evaluate-skill <skill-path> --format markdown
cc-plugin-eval explain-budget <skill-path> --format markdown
cc-plugin-eval measurement-plan <skill-path> --format markdown
cc-plugin-eval init-benchmark <skill-path>
cc-plugin-eval benchmark <skill-path>
cc-plugin-eval analyze <skill-path> --observed-usage <usage.jsonl> --format markdown
```

## Reference

- `../../references/chat-first-workflows.md`
- `../../references/component-validators.md`
