# Workflow Orchestrator Agent

> Extends: [AGENTS_BASE.md](../../agents/AGENTS_BASE.md)

Autonomous agent that coordinates CI/CD workflows by chaining existing plugins into cohesive pipelines.

---

## Overview

The workflow-orchestrator agent combines the capabilities of:

| Plugin | Role in Pipeline |
|--------|------------------|
| `autonomous-ci` | Validation triggers and CI monitoring |
| `code-review` | Quality gates before merge |
| `smart-commit` | Semantic commit message generation |
| `jules-integration` | Async task delegation for PRs |

It reads `CHANGELOG.md [Unreleased]` to understand pending work and orchestrates multi-step
workflows without human intervention for routine tasks.

---

## Capabilities

**Inherited from AGENTS_BASE.md:**

- Full local file permissions
- MCP tool access
- Superpowers skills (TDD, debugging, verification)
- Jules delegation

**Additional:**

- Pipeline composition and execution
- State awareness via CHANGELOG parsing
- Failure routing with automatic retry logic
- Cross-plugin coordination

---

## Workflows

### 1. Pre-Commit Pipeline

Triggered before any commit to ensure quality:

```text
local-validate.sh → code-review → smart-commit
```

**Steps:**

1. Run `./tooling/scripts/local-validate.sh`
2. If validation passes, invoke `code-review` skill for analysis
3. If review passes, invoke `smart-commit` skill for message generation
4. Report summary with evidence

### 2. PR Creation Pipeline

Triggered when changes are ready for review:

```text
validation → review → commit → jules-delegation
```

**Steps:**

1. Execute pre-commit pipeline
2. Stage changes (human approval required for commit)
3. Delegate PR creation to Jules via `jules-integration`
4. Monitor PR status

### 3. CI Recovery Pipeline

Triggered when CI fails:

```text
ci-failure → systematic-debugging → fix → re-validate
```

**Steps:**

1. Detect CI failure via `autonomous-ci` monitoring
2. Invoke `systematic-debugging` skill (from Superpowers)
3. Attempt fix
4. Re-run validation
5. Report outcome

---

## Configuration

### agent.json

```json
{
  "name": "workflow-orchestrator",
  "version": "0.1.0",
  "extends": "AGENTS_BASE.md",
  "plugins": [
    "autonomous-ci",
    "code-review",
    "smart-commit",
    "jules-integration"
  ],
  "triggers": {
    "pre-commit": true,
    "ci-failure": true,
    "manual": true
  },
  "settings": {
    "auto_retry_on_failure": true,
    "max_retries": 3,
    "require_human_approval": ["git commit", "git push", "pr-merge"]
  }
}
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JULES_API_KEY` | Jules API authentication | For PR delegation |
| `GITHUB_TOKEN` | GitHub API access | For PR creation |

---

## Usage

### Manual Invocation

```bash
# Run pre-commit pipeline
./agents/workflow-orchestrator/scripts/orchestrate.sh pre-commit

# Run full PR pipeline
./agents/workflow-orchestrator/scripts/orchestrate.sh pr-create

# Run CI recovery
./agents/workflow-orchestrator/scripts/orchestrate.sh ci-recover

# Check status
./agents/workflow-orchestrator/scripts/orchestrate.sh status
```

### Via Skill

```text
Use the workflow-orchestration skill to run the pre-commit pipeline
```

### Via Command (Future)

```text
/orchestrate pre-commit
/orchestrate pr-create
```

---

## State Management

The orchestrator maintains awareness through:

1. **CHANGELOG.md** - What's been done, what's pending
2. **Git status** - Current working state
3. **CI status** - Remote pipeline state
4. **Jules sessions** - Delegated task status

### Reading State

Before any pipeline execution:

```bash
# Parse CHANGELOG for context
grep -A 50 "\[Unreleased\]" CHANGELOG.md

# Check git state
git status --porcelain
git log --oneline -5
```

---

## Error Handling

| Failure Type | Response |
|--------------|----------|
| Validation failure | Invoke systematic-debugging, attempt fix, retry |
| Review failure | Report issues, suggest fixes, wait for human |
| Commit failure | Report error, do not retry automatically |
| Jules API failure | Retry with exponential backoff, then report |

### Retry Logic

```text
attempt 1 → wait 5s → attempt 2 → wait 15s → attempt 3 → escalate
```

---

## Integration Points

### With MCP Servers (ancplua-mcp)

When MCP servers are available:

- Use `filesystem` tools for file operations
- Use `github` tools for PR operations
- Use `ci` tools for pipeline monitoring

### With Superpowers

Always use these skills when relevant:

- `systematic-debugging` - For failure analysis
- `test-driven-development` - When writing fixes
- `verification-before-completion` - Before claiming done

---

## Permissions

**Automatic (no approval needed):**

- Read any file
- Run validation scripts
- Invoke skills
- Call MCP tools
- Create Jules sessions

**Requires Human Approval:**

- `git commit`
- `git push`
- PR merge
- Modifying CLAUDE.md or AGENTS.md

---

## Roadmap

- [ ] v0.1.0 - Core pipeline orchestration
- [ ] v0.2.0 - CI failure auto-recovery
- [ ] v0.3.0 - Multi-repo coordination
- [ ] v1.0.0 - Full autonomous operation

---

## Resources

- [AGENTS_BASE.md](../../agents/AGENTS_BASE.md) - Base agent capabilities
- [autonomous-ci plugin](../../plugins/autonomous-ci/)
- [code-review plugin](../../plugins/code-review/)
- [smart-commit plugin](../../plugins/smart-commit/)
- [jules-integration plugin](../../plugins/jules-integration/)
