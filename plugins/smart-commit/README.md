# smart-commit

Intelligent commit message generation with semantic analysis and conventional commits enforcement.

## Overview

The `smart-commit` plugin helps Claude and developers create high-quality commit messages by:

- Analyzing staged changes to understand the nature of modifications.
- Generating semantic commit messages following conventional commits format.
- Enforcing consistency across commit history.
- Integrating with issue tracking systems.

## Installation

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install smart-commit@ancplua-claude-plugins
```

## Features

### Semantic Analysis

The plugin analyzes staged changes to determine:

- **Type of change:** feat, fix, docs, style, refactor, test, chore.
- **Scope:** Which module, component, or area is affected.
- **Breaking changes:** Whether the change affects public API.
- **Related issues:** Links to issue trackers.

### Conventional Commits

Generated messages follow the format:

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Examples:

- `feat(auth): add OAuth2 support`
- `fix(api): handle null response in user endpoint`
- `docs(readme): update installation instructions`

## Usage

### Skill Usage

```text
I'm using the smart-commit skill to generate a commit message.

Analyzing staged changes...
- Modified: src/auth/oauth.ts (new file)
- Modified: src/api/users.ts (bug fix)
- Modified: README.md (documentation)

Suggested commit message:
feat(auth): add OAuth2 authentication support

- Implement OAuth2 flow with PKCE
- Add user endpoint error handling
- Update documentation with new auth setup
```

### Command Usage

```text
/commit
```

## Skill: smart-commit

The `smart-commit` Skill provides:

1. **Change Analysis:** Reviews staged changes to understand modifications.
2. **Message Generation:** Creates semantic commit messages.
3. **Validation:** Ensures messages follow conventions.
4. **Integration:** Links to issues and PRs.

See `skills/smart-commit/SKILL.md` for full Skill documentation.

## Configuration

The plugin respects project-level configuration:

- `.commitlintrc` - Commit message rules.
- `.czrc` - Commitizen configuration.
- Custom scope definitions in project config.

## Integration

### With autonomous-ci

When combined with `autonomous-ci`:

1. Make changes and stage them.
2. Use `smart-commit` to generate message.
3. Commit the changes.
4. `autonomous-ci` verifies before claiming done.

### With code-review

When combined with `code-review`:

1. Make changes.
2. Use `code-review` to check quality.
3. Fix any issues found.
4. Use `smart-commit` to commit.

## Requirements

- Git repository with staged changes.
- Claude Code with plugin support.

## License

MIT
