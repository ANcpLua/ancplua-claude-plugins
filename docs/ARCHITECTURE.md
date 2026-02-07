# ancplua-claude-plugins Architecture

This repository is Alexander’s long-lived **Claude Code plugin marketplace** and **agent lab**.

The goals are:

- One repo, many **plugins**, **Skills**, and (later) **agents**
- Explicit, inspectable **architecture**
- Clear integration points with **MCP servers** (from `ancplua-mcp`)
- Deterministic behavior backed by **validation** and **docs**

---

## 1. Architectural Separation (Type A vs Type T)

This ecosystem follows a strict separation of concerns:

### Type A: Application (This Repo)

- **Role:** The "Brain"
- **Components:** Plugins, Skills, Agents, Prompts, Orchestration
- **Language:** TypeScript, Bash, Markdown/YAML
- **Responsibility:** Consumes tools to execute workflows.

### Type T: Technology (External Repo: `ancplua-mcp`)

- **Role:** The "Hands"
- **Components:** MCP Servers, Low-level Tools, Sensors
- **Language:** C# / .NET
- **Responsibility:** Exposes raw capabilities (file system, CI control, etc.).

**Rule:** This repo (`ancplua-claude-plugins`) NEVER contains MCP server implementations. It only contains the
**configuration** to connect to them.

---

## 2. Top-level layout

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
│   ├── autonomous-ci/
│   ├── code-review/
│   ├── metacognitive-guard/
│   └── ... (12 plugins total)
│
├── agents/                      # Agent SDK projects
│
├── skills/                      # Repo-level skills
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── examples/                # MCP Connection Configs (Type T consumption)
│   └── specs/
│
└── tooling/
    ├── scripts/                 # Validation & Sync scripts
    └── templates/               # Plugin generators
```

This layout is the **target state**. If the filesystem differs, `CLAUDE.md` defines how Claude Code must migrate toward
it.

---

## 3. Marketplace model

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

## 4. Plugin structure (Type A)

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

## 5. MCP integration (Type T Consumption)

To connect Claude to the Type T servers (in `ancplua-mcp`), this repo provides **example configuration files** under:

```text
docs/examples/
└── *.mcp.json
```

These files are **examples only**:

- They show how to configure MCP clients (Claude Code, IDEs) to connect to the C# servers.
- They do **not** run by themselves.

Typical examples:

- `docs/examples/ancplua-mcp-stdio.mcp.json` – connect to the workstation server via stdio.
- `docs/examples/ancplua-mcp-http.mcp.json` – connect to the HTTP server.

Any time a plugin adds or changes MCP usage:

1. Update the plugin’s `README.md` with the MCP dependency and configuration hints.
2. Add or update an example under `docs/examples/*.mcp.json`.
3. Update `CHANGELOG.md`.

---

## 6. Validation and quality gates

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

## 7. Relationship to ancplua-mcp

The two repos are intentionally decoupled:

- **ancplua-claude-plugins (Type A)**
  - "The Brain"
  - Plugins, Skills, Agents
  - Orchestrates workflows

- **ancplua-mcp (Type T)**
  - "The Hands"
  - C# MCP server implementations
  - Exposes raw tools

Integration happens via:

1. **Configuration:** `docs/examples/*.mcp.json`
2. **Orchestration:** Skills in this repo calling tools from that repo.

No business logic is duplicated between the repos: **plugins orchestrate, MCP servers execute.**

---

## 8. Design Principles (SOLID for Plugins)

### Single Responsibility

Each plugin handles ONE concern:

| Plugin | Responsibility |
|--------|----------------|
| `autonomous-ci` | CI verification and monitoring |
| `code-review` | Code quality analysis |
| `metacognitive-guard` | Cognitive amplification and struggle detection |
| `workflow-tools` | Multi-agent orchestration workflows |

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

Plugins orchestrate via Skills. Skills define contracts. MCP servers implement.

---

## 9. DevOps Integration (CALMS)

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

## 10. Compliance Status

**Last Verified:** 2026-02-07

All components pass `claude plugin validate .` and `weave-validate.sh` checks.
See CLAUDE.md Section 8 (CI & Validation) for the validation pipeline.
