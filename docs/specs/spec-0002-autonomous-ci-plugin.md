---
status: superseded
contact: "Alexander Nachtmann"
date: "2025-11-24"
deciders: "Alexander Nachtmann"
consulted: "Anthropic Claude Code docs, Superpowers verification patterns"
informed: "Plugin users, CI maintainers, developers using Claude Code"
---

# spec-0002: Autonomous CI Plugin

## Feature Name

autonomous-ci: Ensures Claude verifies local tests AND CI before claiming completion.

## 1. Goal

Provide a Claude Code plugin that enforces verification discipline:

- Claude MUST run local tests before claiming work is complete.
- Claude MUST monitor CI pipeline status before confirming success.
- Claude MUST NOT claim "done" until both local and remote validation pass.

### Success Metric

This plugin is successful when:

- Claude consistently runs `verify-local.sh` after making code changes.
- Claude waits for CI pipelines to complete before claiming success.
- Developers trust Claude's "complete" status because it has been verified.
- False positives (claiming success when tests fail) are eliminated.

### Outcome (implementation-free description)

Developers obtain:

- A **Skill** (`autonomous-ci`) that guides Claude through verification steps.
- **Scripts** (`verify-local.sh`, `wait-for-ci.sh`) that automate common verification tasks.
- Confidence that Claude-driven changes are validated before being considered complete.

## 2. Problem being solved

### Current difficulties

Without this plugin:

- Claude may claim work is "done" without running tests.
- Local test failures are discovered only after human review.
- CI failures are discovered only after pushing, causing rework.
- Developers cannot trust autonomous Claude operations.

### Pain points

This plugin removes:

- **Premature completion claims**: Claude cannot skip verification.
- **Broken builds**: Local tests catch issues before CI.
- **Wasted CI cycles**: Local verification reduces failed CI runs.

### System complexity issues

Without explicit verification discipline:

- Claude may develop habits of skipping verification.
- Different projects have inconsistent verification workflows.
- It becomes unclear whether "done" means "code written" or "code verified".

## 3. API and structure changes

### 3.1 Plugin structure

```text
plugins/autonomous-ci/
├── .claude-plugin/
│   └── plugin.json
├── README.md
├── skills/
│   └── autonomous-ci/
│       └── SKILL.md
├── scripts/
│   ├── verify-local.sh
│   └── wait-for-ci.sh
├── commands/
└── hooks/
```

### 3.2 Skill interface

The `autonomous-ci` Skill provides:

- **Pre-completion checklist**: Steps Claude MUST follow before claiming done.
- **Script invocation**: How to call `verify-local.sh` and `wait-for-ci.sh`.
- **Error handling**: What to do when verification fails.

### 3.3 Scripts

**`verify-local.sh`**

- Runs project-specific tests (detects build system: npm, dotnet, gradle, etc.)
- Returns exit code 0 on success, non-zero on failure.
- Claude MUST NOT proceed if this script fails.

**`wait-for-ci.sh`**

- Monitors GitHub Actions (or other CI) for the current branch.
- Polls until CI completes or times out.
- Returns exit code 0 if CI passes, non-zero otherwise.
- Claude SHOULD use this after pushing changes.

## 4. Usage samples

### 4.1 Install the plugin

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install autonomous-ci@ancplua-claude-plugins
```

### 4.2 Use the Skill

When Claude is about to claim completion:

```text
I'm using the autonomous-ci skill to verify my changes.

Running local verification...
$ ./plugins/autonomous-ci/scripts/verify-local.sh
> All tests passed.

Waiting for CI...
$ ./plugins/autonomous-ci/scripts/wait-for-ci.sh
> CI pipeline completed successfully.

Verification complete. The changes are ready.
```

### 4.3 Handle verification failure

```text
Running local verification...
$ ./plugins/autonomous-ci/scripts/verify-local.sh
> ERROR: 3 tests failed.

I cannot claim completion. Let me fix the failing tests first.
```

## 5. Maintenance rules for Claude

Claude MUST:

- Update this spec when the plugin's behavior changes.
- Keep the plugin structure aligned with this spec.
- Update the `date` field when making changes.

Claude MUST NOT:

- Remove verification requirements from the Skill.
- Allow claiming completion without running verification.
- Leave this spec inconsistent with the actual plugin implementation.
