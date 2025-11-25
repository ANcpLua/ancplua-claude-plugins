---
name: working-on-ancplua-plugins
description: Primary instruction manual for working within the ancplua-claude-plugins monorepo. Use when creating, modifying, or debugging plugins in this repository.
---

# Skill: working-on-ancplua-plugins

## Purpose
This is the **primary instruction manual** for an agent working within the `ancplua-claude-plugins` monorepo. It defines the mandatory conventions, architectural patterns, and workflows required to contribute safely and effectively.

## When to Use
Use this skill when:
- **Creating a new plugin**: Follow the `publishing.md` guide to scaffold correctly.
- **Modifying existing plugins**: Check `conventions.md` to ensure you don't break architecture.
- **Debugging issues**: Use `testing.md` to verify JSON syntax, permissions, and paths.
- **Preparing a PR**: Run the validation commands listed in `testing.md`.

## Reference Library

| Resource | Description |
| :--- | :--- |
| [Conventions](./references/conventions.md) | **Critical Rules**, Naming, Directory Layout, Git flow. |
| [Publishing](./references/publishing.md) | Step-by-step guide to create, version, and release plugins. |
| [Testing](./references/testing.md) | Validation commands and **Debugging Steps** (permissions, JSON). |

## Quick Actions

**Validate Everything:**
```bash
./tooling/scripts/local-validate.sh
```

**Validate Plugin JSON:**
```bash
claude plugin validate .
```

**Repo Layout:**
- `plugins/` - The code lives here.
- `.claude-plugin/` - The repo-level marketplace manifest.
- `tooling/` - Shared scripts.
