# Conventions

## Critical Architecture Rules

### 1. Path Variables

**ALWAYS** use `${CLAUDE_PLUGIN_ROOT}` for paths in configuration files (MCP, Hooks, etc.).
This ensures portability across different users and systems.

**✅ CORRECT:**

```json
"args": ["${CLAUDE_PLUGIN_ROOT}/server/index.js"]
```

**❌ WRONG:**

```json
"args": ["/Users/ancplua/projects/plugins/server/index.js"]
```

### 2. Manifest Locations

The `.claude-plugin/` directory is **ONLY** for manifests (`plugin.json`, `marketplace.json`).

- **DO NOT** put `skills/`, `commands/`, or `hooks/` inside `.claude-plugin/`.
- **DO** put them at the plugin root.

### 3. Relative Paths

In `plugin.json`, all relative paths must start with `./` and be relative to the plugin root.

---

## Naming Conventions

| Entity | Convention | Example |
| :--- | :--- | :--- |
| **Plugin Directory** | `kebab-case` | `autonomous-ci` |
| **Skill Directory** | `kebab-case` | `code-review` |
| **Script File** | `kebab-case.sh` | `verify-local.sh` |
| **Manifest** | strict name | `plugin.json` |

## Directory Layout

Every plugin under `plugins/<plugin-name>/` must follow this structure:

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   ├── plugin.json       # REQUIRED: Metadata only
│   └── marketplace.json  # OPTIONAL: For local dev/testing
├── skills/               # Agent Skills (1 folder per skill)
│   └── my-skill/
│       └── SKILL.md
├── commands/             # Custom Slash Commands
│   └── my-command.md
├── hooks/                # Event Handlers
│   └── hooks.json
├── scripts/              # Executable helper scripts
├── lib/                  # Shared library code
└── README.md             # REQUIRED
```

## Git Conventions

- **Branches**: `feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>`
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat: add new skill`
  - `fix: resolve path issue`
  - `docs: update readme`
- **PRs**: Link related issues/specs.

## Documentation Standards

- **README.md**: Every plugin must have one.
- **CHANGELOG.md**: Required for non-trivial changes.
- **ADRs**: Architectural decisions go in `docs/decisions/`.
- **Specs**: Complex features need specs in `docs/specs/`.
