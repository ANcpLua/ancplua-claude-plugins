---
name: improve-skill
description: This skill should be used when the user asks to "improve this skill based on the evaluation", "rewrite this skill using the cc-plugin-eval findings", "produce a rewrite brief", "hand the brief to skill-creator", or "fix what's most important first in this skill" after a prior cc-plugin-eval run. Turns deterministic findings into a structured rewrite brief; hands the brief off to the user's skill-creator plugin for the actual LLM-graded rewrite pass.
version: 0.1.0
author: AncpLua
---

# Improve Skill

Use this skill after `cc-plugin-eval` has already produced findings for a local skill.

## What This Skill Does NOT Do

This skill does not perform LLM-driven rewrites. That is the job of the user's existing `skill-creator` plugin (`../../../skill-creator/skills/skill-creator/SKILL.md`). cc-plugin-eval produces structured findings and a rewrite brief; skill-creator turns the brief into edits with subagent-driven evals and grading. Keep the two boundaries clear.

## Workflow

1. Run `cc-plugin-eval analyze <skill-path> --brief-out ./skill-brief.json`. The same payload is also produced by `cc-plugin-eval improve <skill-path> --brief-out ./skill-brief.json`, which writes the improvement brief as the top-level payload.
2. Read the improvement brief. Group work into required fixes (severity `error` or `fail`) versus recommended fixes (severity `warn` or `info`).
3. Hand the brief to the user's existing `skill-creator` plugin (`../../../skill-creator/skills/skill-creator/SKILL.md`). That plugin specializes in skill rewrites with subagent-driven evals.
4. Re-run `cc-plugin-eval analyze <skill-path> --output ./after.json` and use `cc-plugin-eval compare ./before.json ./after.json --format markdown` to measure the delta.

## Focus Areas

- reduce trigger and invoke token costs (move bulky details into references, scripts, or helper files)
- keep `SKILL.md` compact (target under 500 lines; hard limit at 800; reference threshold is 350)
- improve trigger descriptions so Claude reliably routes to the skill (CC203, CC204)
- fix broken relative links (CC211), oversized descriptions (CC202), and frontmatter issues (CC213)
- normalize `allowed-tools` syntax (CC215) and add `disable-model-invocation` to task-style skills where appropriate (CC216)

## Chat Requests To Recognize

- `Improve this skill based on the evaluation.`
- `Rewrite this skill using the cc-plugin-eval findings.`
- `What should I fix first in this skill?`
- `Hand the brief to skill-creator.`

## Commands

```bash
cc-plugin-eval analyze <skill-path> --brief-out ./skill-brief.json
cc-plugin-eval improve <skill-path> --brief-out ./skill-brief.json --format markdown
cc-plugin-eval analyze <skill-path> --output ./after.json
cc-plugin-eval compare ./before.json ./after.json --format markdown
```

## References

- `../../references/chat-first-workflows.md`
- `../../references/evaluation-result-schema.md`
