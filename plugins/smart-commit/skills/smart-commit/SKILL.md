---
name: smart-commit
description: Generate intelligent, semantic commit messages following conventional commits format. Use when you have staged changes ready to commit and want well-structured messages with proper type, scope, and issue references.
---

# Skill: smart-commit

Purpose: Generate intelligent, semantic commit messages following conventional commits format.

## When to use this Skill

Use this Skill when:

- You have staged changes ready to commit.
- You want a well-structured commit message.
- You need to follow conventional commits format.
- You want to link commits to issues or PRs.

## Workflow

### 1. Analyze staged changes

Before generating a commit message:

```bash
git status --short
git diff --cached --stat
git diff --cached
```

Identify:

- Files added, modified, or deleted.
- Nature of changes (feature, fix, docs, refactor, etc.).
- Scope of changes (which module or component).

### 2. Determine commit type

Choose the appropriate type:

| Type       | Description                                   |
| ---------- | --------------------------------------------- |
| `feat`     | New feature                                   |
| `fix`      | Bug fix                                       |
| `docs`     | Documentation only                            |
| `style`    | Formatting, no code change                    |
| `refactor` | Code restructuring, no behavior change        |
| `test`     | Adding or updating tests                      |
| `chore`    | Maintenance, dependencies, build              |
| `perf`     | Performance improvement                       |
| `ci`       | CI/CD changes                                 |

### 3. Identify scope

Determine the affected area:

- Module name (e.g., `auth`, `api`, `ui`).
- Component name (e.g., `button`, `modal`).
- File or directory (e.g., `readme`, `config`).

### 4. Write commit message

Follow the format:

```text
<type>(<scope>): <subject>

[body]

[footer]
```

Rules:

- Subject: imperative mood, lowercase, no period, max 50 chars.
- Body: explain what and why, wrap at 72 chars.
- Footer: reference issues, breaking changes.

### 5. Validate message

Check:

- [ ] Type is valid.
- [ ] Scope is meaningful.
- [ ] Subject is clear and concise.
- [ ] Body explains context if needed.
- [ ] Footer references issues if applicable.

## Examples

### Feature commit

```text
feat(auth): add OAuth2 support for Google login

Implement OAuth2 flow with PKCE for enhanced security.
Adds login button and callback handler.

Closes #123
```

### Bug fix commit

```text
fix(api): handle null response in user endpoint

The endpoint was throwing when user data was missing.
Now returns 404 with appropriate error message.

Fixes #456
```

### Documentation commit

```text
docs(readme): add installation instructions

Include step-by-step setup guide and troubleshooting section.
```

### Refactoring commit

```text
refactor(utils): extract validation helpers

Move repeated validation logic to shared utility module.
No functional changes.
```

## Breaking changes

For breaking changes, add `BREAKING CHANGE:` in footer:

```text
feat(api)!: change user endpoint response format

BREAKING CHANGE: User response now includes nested profile object.
Migration guide available in docs/migration.md
```

## Multi-line bodies

Use heredoc for complex messages:

```bash
git commit -m "$(cat <<'EOF'
feat(plugin): add smart-commit skill

- Analyze staged changes semantically
- Generate conventional commit messages
- Support breaking change notation
- Include issue references

Closes #789
EOF
)"
```

## Integration

### With code-review

1. Make changes.
2. Run `code-review` to check quality.
3. Fix any issues.
4. Stage changes.
5. Use `smart-commit` to generate message.
6. Commit.

### With autonomous-ci

1. Complete implementation.
2. Stage changes.
3. Use `smart-commit` to commit.
4. Use `autonomous-ci` to verify.

## Checklist

Before committing:

- [ ] All changes are staged.
- [ ] Commit type is correct.
- [ ] Scope is meaningful.
- [ ] Subject is clear.
- [ ] Body explains context (if needed).
- [ ] Issues are referenced (if applicable).
- [ ] Breaking changes are noted (if applicable).
