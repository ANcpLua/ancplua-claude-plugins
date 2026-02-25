# Workflows

This document describes CI workflows and local validation for this repository.

## CI Pipeline

The CI pipeline runs on GitHub Actions via `.github/workflows/ci.yml`.

### Jobs

| Job                 | Description                                     | Trigger       |
| ------------------- | ----------------------------------------------- | ------------- |
| `plugin-validation` | Validates marketplace and plugin manifests      | push, PR      |
| `shell-scripts`     | Runs shellcheck on shell scripts                | push, PR      |
| `markdown`          | Runs markdownlint on markdown files             | push, PR      |
| `workflow-syntax`   | Runs actionlint on workflow files               | push, PR      |

### Plugin validation

```bash
claude plugin validate .
for d in plugins/*; do
  claude plugin validate "$d"
done
```

### Shell script linting

```bash
shellcheck plugins/**/scripts/*.sh tooling/scripts/*.sh
```

### Markdown linting

```bash
markdownlint "**/*.md"
```

### Workflow syntax checking

```bash
actionlint .github/workflows/*.yml
```

## Local validation

Run all checks locally with:

```bash
./tooling/scripts/weave-validate.sh
```

This script mirrors CI and runs:

1. Plugin validation (if `claude` CLI is available)
2. Shell script linting (if `shellcheck` is available)
3. Markdown linting (if `markdownlint` is available)
4. Workflow syntax checking (if `actionlint` is available)

## Pre-commit checklist

Before committing changes:

> **Note:** The `commit-integrity-hook` (metacognitive-guard) automatically blocks commits containing warning suppressions
> or commented-out tests. No manual check needed for these — the hook enforces it.

1. Run `./tooling/scripts/weave-validate.sh`
2. Fix any failures
3. Update `CHANGELOG.md` for non-trivial changes
4. Update relevant specs/ADRs if architectural changes were made
5. Verify the commit message follows conventional commits format

## Dependabot

Dependabot is configured via `.github/dependabot.yml` to:

- Update GitHub Actions dependencies
- Update npm dependencies (when present)

Check the configuration for specific schedules and ignored dependencies.

## Cross-repo docs trigger

`.github/workflows/trigger-docs.yml` runs on every push to `main` and triggers a rebuild of the
`ancplua-docs` documentation site.

**Requires:** `DOCS_TRIGGER_PAT` secret (a GitHub PAT with `repo` scope on the `ancplua-docs` repository).

**Cross-repo dependency:** Changes to plugin docs, SKILL.md files, or README files in this repo will
automatically propagate to the docs site after merge.
