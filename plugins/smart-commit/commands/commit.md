---
name: commit
description: Generate a semantic commit message for staged changes
---

Generate an intelligent commit message for the currently staged changes.

## Usage

```text
/commit
```

## Behavior

1. Analyze staged changes using `git diff --cached`.
2. Determine the commit type (feat, fix, docs, etc.).
3. Identify the scope (affected module or component).
4. Generate a conventional commit message.
5. Present the message for confirmation.

## Example output

```text
Analyzing staged changes...

Files changed:
- src/auth/oauth.ts (added)
- src/api/users.ts (modified)
- README.md (modified)

Suggested commit:

feat(auth): add OAuth2 authentication support

- Implement OAuth2 flow with PKCE for security
- Add callback handler for OAuth providers
- Update documentation with setup instructions

Closes #123

---
Would you like to use this message? (y/n/edit)
```

## Options

The command accepts optional arguments:

- `/commit --type=fix` - Force a specific commit type.
- `/commit --scope=api` - Force a specific scope.
- `/commit --breaking` - Mark as breaking change.
- `/commit --issue=123` - Link to issue number.
