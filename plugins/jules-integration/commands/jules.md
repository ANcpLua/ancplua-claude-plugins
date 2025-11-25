---
name: jules
description: Create a Jules AI session for async coding tasks
arguments:
  - name: task
    description: The task description for Jules
    required: true
---

# /jules Command

Create a Jules AI session to delegate an async coding task.

## Usage

```
/jules "Add unit tests for the authentication module"
```

## What This Does

1. Validates your Jules API key is configured
2. Creates a new Jules session via the API
3. Outputs the session URL for monitoring
4. Jules will:
   - Clone your repo
   - Analyze the codebase
   - Generate a plan (requires your approval)
   - Execute the plan
   - Create a PR with changes

## Requirements

- `JULES_API_KEY` environment variable must be set
- Repository must be connected to Jules at jules.google

## Example Tasks

```
/jules "Fix the N+1 query in UserRepository.GetAll()"
/jules "Add JSDoc comments to all public functions in src/utils/"
/jules "Write integration tests for the checkout flow"
/jules "Refactor the legacy auth code to use modern patterns"
```

## Process

After running this command:

1. Visit the session URL to monitor progress
2. Review and approve the plan Jules generates
3. Watch Jules work and provide feedback if needed
4. Review the resulting PR
5. Merge after CI passes

## Notes

- Jules runs asynchronously - you can continue working while it processes
- Always review Jules' plan before approving
- PRs created by Jules require manual merge (no auto-merge)
