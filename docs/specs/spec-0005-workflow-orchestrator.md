---
status: proposed
contact: "AncpLua"
date: "2025-11-25"
deciders: "AncpLua"
consulted: "Claude"
informed: "ancplua-claude-plugins users"
---

# spec-0005: Workflow Orchestrator Agent

## Feature name

Workflow Orchestrator Agent - Pipeline coordination for automated CI/CD workflows.

## 1. Goal of this feature

Create an autonomous agent that coordinates existing plugins into cohesive CI/CD pipelines, reducing manual
orchestration overhead and enabling reliable, repeatable workflows.

### Success metric

- Pre-commit pipeline reduces manual validation steps from 4+ to 1 command
- CI recovery pipeline successfully diagnoses and fixes 80%+ of common failures
- PR creation pipeline successfully delegates to Jules with proper context

### Outcome

Developers can invoke a single command or skill to execute multi-step workflows that previously required manual
coordination of multiple tools. The orchestrator maintains state awareness and provides evidence-based completion
reports.

## 2. Problem being solved

### Current difficulties

- Manual execution of `local-validate.sh` → code-review → smart-commit → jules-delegation
- No automated recovery path when CI fails
- Context lost between plugin invocations
- Inconsistent workflow execution (steps skipped, order varies)

### Pain points

- Repetitive validation sequences before every commit
- CI failures require manual diagnosis and intervention
- Jules delegation requires re-gathering context each time
- No visibility into pipeline state or progress

### System complexity

- Four separate plugins with no coordination layer
- CHANGELOG context not automatically considered
- Retry logic duplicated across scripts
- No unified error handling strategy

## 3. API and structure changes

### 3.1 New APIs

**CLI Interface:**

```bash
./agents/workflow-orchestrator/scripts/orchestrate.sh <pipeline>
```

**Skill Interface:**

```text
Use the workflow-orchestration skill to run the pre-commit pipeline
```

### 3.2 Breaking changes

None - this is additive.

## 4. Implementation details

### 4.1 Directory structure

```text
agents/workflow-orchestrator/
├── README.md                           # Agent documentation
├── config/
│   └── agent.json                      # Agent configuration
├── skills/
│   └── workflow-orchestration/
│       └── SKILL.md                    # Orchestration skill
└── scripts/
    └── orchestrate.sh                  # CLI entrypoint
```

### 4.2 Pipelines

#### Pre-Commit Pipeline

```text
local-validate.sh → code-review → smart-commit
```

| Step           | Action                      | On Failure |
|----------------|-----------------------------|------------|
| validate       | Run local-validate.sh       | Abort      |
| review         | Invoke code-review skill    | Report     |
| commit-message | Invoke smart-commit skill   | Report     |

#### PR-Create Pipeline

```text
pre-commit → jules-delegation
```

| Step        | Action                          | On Failure |
|-------------|---------------------------------|------------|
| pre-commit  | Run pre-commit pipeline         | Abort      |
| delegate-pr | Invoke jules-integration skill  | Report     |

#### CI-Recover Pipeline

```text
diagnose → fix → re-validate
```

| Step     | Action                             | On Failure   |
|----------|------------------------------------|--------------|
| diagnose | Invoke systematic-debugging skill  | Escalate     |
| fix      | Implement fix                      | Escalate     |
| validate | Run local-validate.sh              | Retry (3x)   |

### 4.3 State awareness

The orchestrator reads state from:

1. **CHANGELOG.md** - Recent changes and pending work
2. **Git status** - Working directory state
3. **CI status** - Remote pipeline state (via autonomous-ci)

### 4.4 Error handling

| Failure Type       | Response                                    |
|--------------------|---------------------------------------------|
| Validation failure | Retry up to 3 times with 5s/15s/30s delays  |
| Review failure     | Report issues, wait for human               |
| Jules API failure  | Exponential backoff, then report            |

## 5. E2E code and usage samples

### Example 1: Pre-Commit Pipeline

```bash
# Developer makes changes
vim plugins/my-plugin/README.md

# Run pre-commit pipeline
./agents/workflow-orchestrator/scripts/orchestrate.sh pre-commit

# Output:
# ═══════════════════════════════════════
#   Pipeline: PRE-COMMIT
# ═══════════════════════════════════════
# [INFO] Gathering context...
#
# CHANGELOG [Unreleased]:
#   ### Added
#   - workflow-orchestrator agent
#
# ━━━ Step 1: Validation ━━━
# [SUCCESS] Validation passed
#
# ━━━ Step 2: Code Review ━━━
# [INFO] No critical issues found
#
# ━━━ Step 3: Commit Message Generation ━━━
# Suggested: feat(docs): update my-plugin README
#
# ═══════════════════════════════════════
#   Pre-commit pipeline complete
# ═══════════════════════════════════════
```

### Example 2: CI Recovery

```bash
# CI fails on GitHub Actions
# Agent detects failure via autonomous-ci monitoring

./agents/workflow-orchestrator/scripts/orchestrate.sh ci-recover

# Output:
# ═══════════════════════════════════════
#   Pipeline: CI-RECOVER
# ═══════════════════════════════════════
#
# ━━━ Step 1: CI Failure Diagnosis ━━━
# [INFO] Analyzing CI logs...
# [FOUND] shellcheck SC2086: Double quote to prevent globbing
# [FIX] Adding quotes to line 42 in scripts/deploy.sh
#
# ━━━ Step 2: Validation ━━━
# Validation attempt 1/3
# [SUCCESS] Validation passed
#
# [SUCCESS] CI recovery successful!
```

### Example 3: Via Claude Skill

```text
User: Run the full pre-commit pipeline

Claude: I'll use the workflow-orchestration skill to execute the pre-commit pipeline.

[Invokes workflow-orchestration skill]

## Pipeline Execution Summary

| Step       | Status | Evidence                             |
|------------|--------|--------------------------------------|
| Validation | ✅     | local-validate.sh exit 0             |
| Review     | ✅     | No critical issues                   |
| Commit     | ✅     | Generated: `feat(agent): add orchestrator` |

The pipeline completed successfully. Ready for human approval to commit.
```

## 6. Maintenance rules for Claude

1. **Pipeline Order:** The execution order within pipelines is fixed and must not be reordered without an ADR:
   - pre-commit: validate → review → commit-message
   - pr-create: pre-commit → stage → delegate
   - ci-recover: diagnose → fix → validate

2. **State Awareness:** Always read CHANGELOG.md before pipeline execution. This prevents duplicate work.

3. **Human Approval Gates:** Never bypass human approval for:
   - git commit
   - git push
   - PR merge

4. **Evidence Requirement:** Never claim pipeline completion without:
   - Validation script exit code
   - Review summary
   - Commit message (if applicable)

5. **Error Handling:** All pipeline steps must follow the pattern:
   - Log the error with context
   - Attempt automatic fix if deterministic
   - Retry with backoff if transient
   - Escalate with full context if persistent

6. **CHANGELOG Updates:** Every successful pipeline execution that modifies files must update CHANGELOG.md.

7. **Skill Dependencies:** If any dependent skill changes its interface, update the orchestration skill accordingly.

## 7. Dependencies

### Required plugins

- `autonomous-ci` - Validation triggers and CI monitoring
- `code-review` - Quality gates before merge
- `smart-commit` - Semantic commit message generation

### Optional plugins

- `jules-integration` - Async task delegation for PRs

### Required Superpowers skills

- `systematic-debugging` - For CI failure diagnosis
- `verification-before-completion` - For evidence-based completion

## 8. Security considerations

- Human approval required for all git operations
- No secrets stored in agent configuration
- Environment variables for API keys (JULES_API_KEY, GITHUB_TOKEN)

## 9. Testing strategy

- Manual testing via `./orchestrate.sh status`
- Integration testing by running pre-commit pipeline
- CI testing via workflow execution

## 10. Rollout plan

1. v0.1.0 - Core pipeline orchestration (this spec)
2. v0.2.0 - CI failure auto-recovery
3. v0.3.0 - Multi-repo coordination
4. v1.0.0 - Full autonomous operation

## 11. Open questions

- Should pipelines be configurable via agent.json or fixed?
- How to handle concurrent pipeline executions?
- Integration with GitHub Actions for CI status?

## 12. References

- [AGENTS_BASE.md](../../agents/AGENTS_BASE.md) - Base agent capabilities
- [autonomous-ci plugin](../../plugins/autonomous-ci/)
- [code-review plugin](../../plugins/code-review/)
- [smart-commit plugin](../../plugins/smart-commit/)
- [jules-integration plugin](../../plugins/jules-integration/)
- [spec-0004-jules-integration](./spec-0004-jules-integration.md)
