# Codex pull request review

Review only the changes introduced by the current pull request.

## Available environment variables

- `PR_NUMBER`
- `PR_BASE_SHA`
- `PR_HEAD_SHA`
- `PR_AUTHOR`
- `PR_HEAD_REF`

## Repository context

This repository is a Claude Code plugin marketplace.

- Primary files: `SKILL.md`, `plugin.json`, Markdown docs, shell scripts, YAML workflows
- User-facing changes should update `CHANGELOG.md`
- `.cs` and `.csproj` files do not belong in this repo

## Required review flow

1. Run `git diff --name-status "$PR_BASE_SHA...$PR_HEAD_SHA"`
2. Run `git diff --stat "$PR_BASE_SHA...$PR_HEAD_SHA"`
3. Read `AGENTS.md`, `README.md`, and `CLAUDE.md` if you need repo conventions
4. Read the changed files and any nearby context required to review them well
5. Ignore unrelated pre-existing issues

## Review rules

- Ground every finding in the actual diff or repository rules
- Do not speculate about undocumented Claude Code behavior or private Anthropic docs
- Do not suggest changes based on unofficial or unverifiable platform guidance
- Prefer concrete, actionable feedback over style nitpicks
- Request changes only for blocking issues that would break automation, validation, or published guidance

## Checklist

- GitHub Actions workflow safety and correctness
- Prompt quality, clarity, and task grounding
- JSON, Markdown, and YAML validity
- Shell command safety and quoting
- `CHANGELOG.md` coverage for user-facing changes
- No forbidden repo content

## Output requirements

Return JSON that matches the provided schema.

- Set `event` to `APPROVE`, `REQUEST_CHANGES`, or `COMMENT`
- Set `body` to concise Markdown with these sections:
  - `## Codex Review`
  - `**Verdict:** ...`
  - `### Summary`
  - `### Findings`
  - `### Strengths`
- If you found no issues, write `- None.` under `### Findings`
- End with `*Autonomous review by Codex via GitHub Actions*`
