# ancplua-claude-plugins Architecture

This repository is Alexander’s long-lived **Claude Code plugin marketplace** and **agent lab**.

The goals are:

- One repo, many **plugins**, **Skills**, and (later) **agents**
- Explicit, inspectable **architecture**
- Clear integration points with **MCP servers** (for example from `ancplua-mcp`)
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
│   └── marketplace.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── dependabot.yml
│
├── plugins/
│   ├── autonomous-ci/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── README.md
│   │   ├── skills/
│   │   ├── commands/
│   │   ├── hooks/
│   │   └── scripts/
│   ├── wip-plugin-2/
│   └── wip-plugin-3/
│
├── agents/
│   └── (future Agent SDK projects)
│
├── skills/
│   └── working-on-ancplua-plugins/
│       ├── SKILL.md
│       └── references/
│           ├── conventions.md
│           ├── testing.md
│           └── publishing.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PLUGINS.md
│   ├── specs/
│   │   ├── spec-template.md
│   │   └── spec-*.md
│   └── decisions/
│       ├── adr-template.md
│       └── adr-*.md
│
└── tooling/
    ├── scripts/
    │   └── local-validate.sh
    └── templates/
        └── plugin-template/
            ├── .claude-plugin/plugin.json
            ├── README.md
            ├── skills/
            ├── commands/
            └── hooks/
````

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
  - Optional `skills/`, `commands/`, `hooks/`, `scripts/`, `lib/`, `mcp/`

Claude Code (or other clients) can:

- `/plugin marketplace add ANcpLua/ancplua-claude-plugins`
- `/plugin install <plugin>@ancplua-claude-plugins`

The marketplace manifest is the **single source of truth** for what this repo exposes as plugins.

---

## 3. Plugin structure

Each plugin under `plugins/<plugin-name>/` follows this pattern:

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── README.md
├── skills/
│   └── <skill-name>/
│       └── SKILL.md
├── commands/
│   └── <command>.md
├── hooks/
│   └── hooks.json
├── scripts/
│   └── *.sh
└── mcp/           # optional MCP server implementation
    └── (see ancplua-mcp for actual servers)
```

**Minimum requirement:**

- `.claude-plugin/plugin.json` with:

  - `name`
  - `version`
  - `description`
  - `author`
  - `repository`
  - `license`

Optional capabilities:

- `skills/` – repo-specific Skills the agent can call
- `commands/` – slash commands
- `hooks/` – event hooks
- `scripts/` – shell helpers
- `mcp/` – plugin-local MCP server code (if you decide to bundle one here rather than in `ancplua-mcp`)

Detailed rules live in `docs/PLUGINS.md`.

---

## 4. MCP integration

This repo is the **Claude-side** of your ecosystem. Actual MCP servers typically live in a separate repo, for example:

- `ancplua-mcp/` – C# MCP servers (`Ancplua.Mcp.WorkstationServer`, `Ancplua.Mcp.HttpServer`, …)

To connect Claude to those servers, this repo can provide **example configuration files** under:

```text
docs/examples/
└── *.mcp.json
```

These files are **examples only**:

- They show how to configure MCP clients (Claude Code, IDEs, inspector tools) to connect to your C# servers.
- They do **not** run by themselves; users copy/paste/adapt them to their own MCP client config.

Typical examples:

- `docs/examples/ancplua-mcp-stdio.mcp.json` – connect to the workstation server via stdio.
- `docs/examples/ancplua-mcp-http.mcp.json` – connect to the HTTP server.

The contract:

- Plugins in this repo **may** assume that MCP servers exist (for example, filesystem tools, CI tools), but:

  - The actual server implementation lives in `ancplua-mcp/`.
  - This repo only ships **documentation and examples**, not full MCP servers.

Any time a plugin adds or changes MCP usage (for example, it calls tools from `ancplua-mcp`):

1. Update the plugin’s `README.md` with the MCP dependency and configuration hints.
2. Add or update an example under `docs/examples/*.mcp.json`.
3. Update `CHANGELOG.md` and, if the change is architectural, add an ADR/spec in `docs/decisions/` and `docs/specs/`.

---

## 5. Validation and quality gates

Local and CI validation are aligned:

- `tooling/scripts/local-validate.sh` is the **single entry point** for local checks.
- CI uses `.github/workflows/ci.yml` to run the same checks (or stricter variants).

At minimum, `local-validate.sh` should:

- Run `claude plugin validate`:

  - On the marketplace root (`.claude-plugin/marketplace.json`)
  - On each plugin under `plugins/`
- Run `shellcheck` on:

  - `tooling/scripts/*.sh`
  - `plugins/**/scripts/*.sh`
- Run `markdownlint` on `**/*.md`
- Run `actionlint` on `.github/workflows/*.yml`

Rules:

- Before claiming a non-trivial change is “done”, developers (human or Claude) must:

  - Run `./tooling/scripts/local-validate.sh`
  - Fix failures
  - Re-run until clean
- Any change that affects:

  - Marketplace manifest
  - Plugin manifests
  - MCP examples
  - CLAUDE.md / README.md
  - Architecture or behavior
      must update **CHANGELOG.md** and, when appropriate, **ADR/spec** files.

---

## 6. Relationship to ancplua-mcp

The two repos are intentionally decoupled:

- **ancplua-claude-plugins**

  - Claude Code marketplace and Skills
  - Repo-specific behavior and workflows
  - Example configs for talking to MCP servers

- **ancplua-mcp**

  - C# MCP server implementations
  - Tools that expose workstation / CI / infra capabilities
  - .NET solution, tests, and server-specific docs

Integration happens via:

- MCP configuration (for example, `docs/examples/ancplua-mcp-stdio.mcp.json`)
- Plugin Skills that **call tools** exposed by MCP servers

No business logic is duplicated between the repos: **plugins orchestrate**, **MCP servers execute**.
