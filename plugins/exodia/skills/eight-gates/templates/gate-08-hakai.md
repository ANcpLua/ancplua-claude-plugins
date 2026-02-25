# Gate 8: 死門 SHIMON — HAKAI

> The Death Gate. Nothing final happens without verified preconditions.
> The point isn't destruction. The point is truth:
> only what survives verification exists.
>
> Gate 8 introduces irreversibility rules: the agent cannot pretend it can
> undo reality. If something is destructive, it must be explicit, logged,
> and require human approval where appropriate.

## Entry Condition

- Gate 7 checkpoint exists (`checkpoint.sh verify 7`)
- Build passes. Tests pass.

## Actions

### 1. Full Verification Suite (Direct — No Agents)

```bash
# Build (try common build systems in order)
dotnet build --no-incremental 2>&1 || npm run build 2>&1 || make build 2>&1

# Test
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1

# Lint
dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1 || make lint 2>&1

# Repo-specific validation (non-fatal if absent)
if [ -f ./tooling/scripts/weave-validate.sh ]; then ./tooling/scripts/weave-validate.sh 2>&1; fi
```

If ANY check fails: **do not proceed.** Fix the issue or ITERATE back to Gate 7.

### 2. Cleanup + Deletion (If Required)

If the objective involved cleanup (type=CLEANUP) or implementation created dead code:

```bash
# Create deletion permit (shared Hades infrastructure)
plugins/exodia/scripts/smart/permit.sh create "$SESSION_ID" "$SCOPE" --ttl=1800

# For EACH deletion: log to ledger BEFORE deleting
plugins/exodia/scripts/smart/ledger.sh append \
  "$SESSION_ID" "delete" "$FILE_PATH" "$REASON" "gate-8-hakai"

# After all deletions: re-run full verification suite
# Build + test + lint must still pass

# Revoke permit when done
plugins/exodia/scripts/smart/permit.sh revoke
```

Every deletion must be:

- **Permitted** — active permit exists before deletion
- **Logged** — ledger entry created before the file is touched
- **Verified** — build + tests pass after deletion
- **Auditable** — ledger is append-only, survives session expiry

### 3. Irreversibility Rules

Gate 8 makes explicit what cannot be undone:

| Action | Reversible? | Requirement |
|--------|-------------|-------------|
| File edit | Yes (git revert) | Normal flow |
| File delete | Soft yes (git) | Permit + ledger entry |
| Git push | Soft yes (force-push) | Human approval required |
| Published release | No | Human approval required |
| Database migration | No | Human approval required |
| External API call | No | Human approval required |
| Sent message/email | No | Human approval required |

If an action is irreversible and not pre-authorized: **HALT, ask user.**

### 4. Verification Agents (0-4, Optional)

For high-risk objectives or large scopes, spawn verification agents:

> subagent: feature-dev:code-reviewer
>
> You are **verification-challenger**.
> SESSION: $SESSION_ID
>
> Challenge ALL claims from Gate 7 implementation.
> For each change:
>
> 1. Does the test actually test what it claims?
> 2. Are there edge cases not covered?
> 3. Could this change break something not in scope?
> 4. Is the change minimal (no unnecessary additions)?
>
> Be adversarial. Evidence only. No hand-waving.

<!-- -->

> subagent: general-purpose
>
> You are **build-verifier**.
> SESSION: $SESSION_ID | SCOPE: $SCOPE
>
> Run FULL verification from clean state:
>
> 1. Build from scratch (not incremental)
> 2. Run ALL tests (not just affected)
> 3. Check for new warnings (zero tolerance)
> 4. Verify no regressions in unrelated areas
>
> Output: Full verification log with pass/fail evidence.

### 5. Session Cleanup

```bash
# Expire session
plugins/exodia/scripts/smart/session-state.sh expire

# Revoke any remaining permits
plugins/exodia/scripts/smart/permit.sh revoke 2>/dev/null || true

# Show final summaries
plugins/exodia/scripts/smart/checkpoint.sh list
plugins/exodia/scripts/smart/ledger.sh count 2>/dev/null || true
plugins/exodia/scripts/smart/session-state.sh decision list
```

## Output Schema

```json
{
  "gate": 8,
  "build": "PASS|FAIL",
  "tests": "PASS|FAIL",
  "lint": "PASS|FAIL",
  "validation": "PASS|FAIL",
  "deletions": 0,
  "ledger_entries": 0,
  "permits_used": 0,
  "challenges_raised": 0,
  "challenges_resolved": 0,
  "agents_spawned": 0,
  "verdict": "SHIP|ITERATE|HALT"
}
```

## Exit Condition

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 8 "hakai-complete" \
  "build=PASS" \
  "tests=PASS" \
  "lint=PASS" \
  "deletions=[n]" \
  "ledger_entries=[n]" \
  "total_agents=[n]" \
  "total_gates=[n]" \
  "verdict=[SHIP|ITERATE|HALT]"
```

**SHIP** if ALL verification passes. Zero warnings. Zero failures.
**ITERATE** if fixable issues remain → back to Gate 7 with targeted work queue.
**HALT** if unfixable → escalate to user with full evidence.

No "mostly done." No "it should work." No "I think it passes."
Zero or complete. Evidence or silence.
