# ancplua-claude-plugins Architecture

This repository is Alexander’s long-lived **Claude Code plugin marketplace** and **agent lab**.

The goals are:

- One repo, many **plugins**, **Skills**, and (later) **agents**
- Explicit, inspectable **architecture**
- Deterministic behavior backed by **validation** and **docs**

---

## 1. Top-level layout

```text
ancplua-claude-plugins/
├── CLAUDE.md
├── README.md
├── CHANGELOG.md
├── .gitignore
│
├── .claude-plugin/
│   └── marketplace.json         # The Catalog
│
├── .github/
│   └── workflows/               # CI Pipelines
│
├── plugins/
│   ├── metacognitive-guard/
│   ├── feature-dev/
│   └── ... (7 plugins total)
│
├── skills/                      # Repo-level skills
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── specs/
│
└── tooling/
    ├── scripts/                 # Validation & Sync scripts
    └── templates/               # Plugin generators
```

This layout is the **target state**. If the filesystem differs, `CLAUDE.md` defines how Claude Code must migrate toward
it.

---

## 2. Marketplace model

This repo is a **Claude Code marketplace**:

- `.claude-plugin/marketplace.json` lists all published plugins:

  - `name` – plugin identifier
  - `source` – relative path under `plugins/`
  - `description`, `version` – human and semver info
- Each plugin lives under `plugins/<plugin-name>/` with its own:

  - `.claude-plugin/plugin.json`
  - `README.md`
  - Optional `skills/`, `commands/`, `hooks/`, `scripts/`

The marketplace manifest is the **single source of truth** for what this repo exposes as plugins.

---

## 3. Plugin structure

Each plugin under `plugins/<plugin-name>/` follows this pattern:

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json      # Manifest
├── README.md            # Documentation
├── skills/
│   └── <skill-name>/
│       └── SKILL.md     # The Intelligence
├── commands/
│   └── <command>.md     # Slash Commands
├── hooks/
│   └── hooks.json       # Event Hooks
└── scripts/
    └── *.sh             # Helper Scripts
```

**Minimum requirement:**

- `.claude-plugin/plugin.json` with:

  - `name`
  - `version`
  - `description`
  - `author`
  - `repository`
  - `license`

Detailed rules live in `docs/PLUGINS.md`.

---

## 4. Validation and quality gates

Local and CI validation are aligned:

- `tooling/scripts/weave-validate.sh` is the **single entry point** for local checks.
- CI uses `.github/workflows/ci.yml` to run the same checks.

At minimum, `weave-validate.sh` should:

- Run `claude plugin validate`:
  - On the marketplace root (`.claude-plugin/marketplace.json`)
  - On each plugin under `plugins/`
- Run `shellcheck` on `*.sh` files
- Run `markdownlint` on `**/*.md`
- Run `actionlint` on `.github/workflows/*.yml`

Rules:

- Before claiming a non-trivial change is “done”, developers (human or Claude) must:
  - Run `./tooling/scripts/weave-validate.sh`
  - Fix failures
  - Re-run until clean

---

## 5. Design Principles (SOLID for Plugins)

### Single Responsibility

Each plugin handles ONE concern:

| Plugin | Responsibility |
|--------|----------------|
| `metacognitive-guard` | Cognitive amplification, commit integrity, CI verification |
| `feature-dev` | Guided feature development + code review |
| `exodia` | Multi-agent orchestration (9 commands + hades skill) |

**Anti-pattern:** A "super-plugin" that does everything.

### Open/Closed

- **Extend:** Add new skills to a plugin
- **Don't modify:** Core plugin logic for edge cases
- **Use hooks:** For customization points

### Interface Segregation

Not all plugins need all features:

| Component | Required | Purpose |
|-----------|----------|---------|
| `.claude-plugin/plugin.json` | ✓ Always | Plugin manifest |
| `README.md` | ✓ Always | Documentation |
| `skills/` | Optional | Workflow guidance |
| `commands/` | Optional | Slash commands |
| `hooks/` | Optional | Event handling |
| `scripts/` | Optional | Shell automation |

### Dependency Inversion

Plugins orchestrate via Skills. Skills define contracts.

---

## 6. DevOps Integration (CALMS)

### Automation Touchpoints

| Stage | Tool | Purpose |
|-------|------|---------|
| Local | `weave-validate.sh` | Pre-commit checks |
| CI | `ci.yml` | Automated validation |
| Review | `claude-code-review.yml` | AI-assisted review |
| Merge | `auto-merge.yml` | Tiered auto-merge |

### Quality Gates

1. **Plugin validation:** `claude plugin validate .`
2. **Shell scripts:** `shellcheck`
3. **Markdown:** `markdownlint`
4. **Workflows:** `actionlint`
5. **JSON:** `jq` syntax check

### DORA Metrics Targets

| Metric | Target |
|--------|--------|
| Deployment Frequency | Multiple per day |
| Lead Time | < 1 hour |
| Change Failure Rate | < 15% |
| MTTR | < 30 minutes |

---

## 7. Compliance Status

**Last Verified:** 2026-02-13

All components pass `claude plugin validate .` and `weave-validate.sh` checks.
See CLAUDE.md Section 8 (CI & Validation) for the validation pipeline.
