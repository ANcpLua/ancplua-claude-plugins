# ancplua-claude-plugins

**Alexander’s Claude Code plugin marketplace, skills library, and agent lab.**

This repository is a long-lived, structured home for:

- **Plugins:** Reusable Claude Code extensions (Type A)
- **Skills:** Modular capabilities that encode development discipline
- **Agents:** Autonomous workflows using the Agent SDK
- **Integration:** Configuration to consume external MCP tools (Type T)

---

## At a glance

- **Goal:** A composable "Brain" for the Claude Code ecosystem.
- **Architecture:** Type A (Application) consuming Type T (Technology) from `ancplua-mcp`.
- **Validation:** `./tooling/scripts/local-validate.sh`
- **Operational Spec:** `CLAUDE.md` (The Law)
- **Change Log:** `CHANGELOG.md`

---

## 1. Architecture Overview

This repository operates as the **Application Layer (Type A)** in a larger ecosystem.

### Type A vs. Type T

| Layer | Repository | Role | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Type A (Application)** | `ancplua-claude-plugins` | **The Brain** | Skills, Prompts, Orchestration, Workflow Logic |
| **Type T (Technology)** | `ancplua-mcp` | **The Hands** | C# MCP Servers, Low-level Tools, System Access |

**Key Rule:** This repository NEVER contains MCP server implementations. It only contains the **configuration** (`docs/examples/*.mcp.json`) to connect to them.

### Directory Structure

```text
ancplua-claude-plugins/
├── CLAUDE.md                    # Operational Spec (Source of Truth)
├── GEMINI.md                    # Gemini Operational Constitution
├── README.md                    # This file
├── CHANGELOG.md                 # Version history
│
├── .claude-plugin/
│   └── marketplace.json         # Plugin Catalog
│
├── .github/
│   └── workflows/               # CI Pipelines (Type A validation)
│
├── plugins/                     # The Plugins (Type A artifacts)
│   ├── autonomous-ci/           # CI Verification Skill
│   ├── code-review/             # Automated Reviewer
│   ├── smart-commit/            # Semantic Committer
│   └── jules-integration/       # Jules AI Delegation
│
├── agents/                      # Agent SDK Projects
│   ├── repo-reviewer-agent/
│   └── workflow-orchestrator/
│
├── skills/                      # Repo-level Shared Skills
│
├── docs/
│   ├── ARCHITECTURE.md          # Detailed Architecture
│   ├── examples/                # MCP Configs (Type T consumption)
│   ├── specs/                   # Feature Specs
│   └── decisions/               # ADRs
│
└── tooling/                     # Maintenance Scripts
```

---

## 2. Usage

### 2.1 As a Workbench (Editing this repo)

1.  **Install Dependencies:** Ensure `claude` CLI and `jq` are installed.
2.  **Start Session:**
    ```bash
    cd ancplua-claude-plugins
    claude
    ```
    *Claude will automatically read `CLAUDE.md` to understand the project context.*
3.  **Validate Changes:**
    ```bash
    ./tooling/scripts/local-validate.sh
    ```

### 2.2 As a Marketplace (Installing plugins)

You can install plugins from this repo into *other* projects.

**Add Marketplace:**
```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
```

**Install Plugin:**
```text
/plugin install autonomous-ci@ancplua-claude-plugins
```

---

## 3. Available Plugins

| Plugin | Description | Type |
| :--- | :--- | :--- |
| **autonomous-ci** | Enforces CI verification before "Done". | Skill |
| **smart-commit** | Generates semantic, conventional commits. | Skill + Command |
| **code-review** | Automated security and style review. | Skill + Command |
| **jules-integration**| Delegates tasks to Google Jules AI. | Skill + Command |

---

## 4. Documentation Map

- **Operational Rules:** `CLAUDE.md`
- **Gemini Rules:** `GEMINI.md`
- **Architecture Detail:** `docs/ARCHITECTURE.md`
- **Plugin Standards:** `docs/PLUGINS.md`
- **Agent SDK:** `docs/AGENTS.md`
- **CI/CD Workflows:** `docs/WORKFLOWS.md`

---

## 5. License

Private / Proprietary until a `LICENSE` file is added to the root.