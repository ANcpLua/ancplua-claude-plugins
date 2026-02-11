---
description: Ensures Claude verifies both local tests AND remote CI before claiming completion. Use BEFORE any completion claims, commits, or pull requests.
---

# Autonomous CI Verification

**Never claim success without CI verification.** Evidence before claims. Always.

## When to Use

MANDATORY before: completion claims, commits, pull requests, or moving to next task.

## Protocol

```text
1. RUN LOCAL VERIFICATION
   └─> Execute project-specific test command
   └─> If fails: fix and repeat

2. COMMIT AND PUSH
   └─> Only if local tests pass

3. MONITOR CI (BLOCKING)
   └─> gh run list --commit $(git rev-parse HEAD) --limit 1
   └─> gh run watch <run-id>
   └─> Do NOT proceed until complete

4. IF CI FAILS
   └─> gh run view <run-id> --log-failed
   └─> Fix the issue
   └─> REPEAT from step 1

5. ONLY WHEN ALL CI PASSES
   └─> Report success with evidence (URLs, logs)
```

## CI Monitoring Commands

```bash
COMMIT_SHA=$(git rev-parse HEAD)
RUN_ID=$(gh run list --commit "$COMMIT_SHA" --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID"
CONCLUSION=$(gh run view "$RUN_ID" --json conclusion -q .conclusion)
```

## Success Criteria

Claim completion ONLY when:

1. Local tests passed (exit code 0)
2. Code committed and pushed
3. ALL CI workflows passed with status "success"
4. Evidence shown (URLs/logs)

## Red Flags

If you catch yourself saying "should work", "tests pass locally, we're done", or "it's a small change" — STOP. Run the protocol.

## Requirements

- GitHub CLI (`gh`) installed and authenticated
- Git repository with GitHub Actions
- Project with test suite

See `references/` for project-specific examples and CI monitoring patterns.
