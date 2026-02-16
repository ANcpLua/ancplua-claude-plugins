---
status: accepted
contact: "Alexander Nachtmann"
date: "2025-11-21"
deciders: "Alexander Nachtmann"
consulted: "Anthropic Claude Code docs, Superpowers maintainers' patterns"
informed: "Future contributors, CI maintainers, plugin consumers"
---

# ADR-0001: Repository-as-Marketplace Architecture for Claude Code

## Context and Problem Statement

This project required a place to:

- Develop and maintain multiple Claude Code plugins over time.
- Encode reusable development Skills.
- Experiment with agents and MCP servers.
- Allow Claude Code to act as a long-term maintainer.

Initial approaches (one repo per plugin, or one monolithic plugin) led to:

- Fragmentation of code and knowledge.
- Repeated architecture decisions for each new idea.
- Difficulty for Claude to understand the "shape" of the ecosystem.
- Higher overhead for CI and validation per project.

The key question:

> How should Alexander structure his Claude Code work so that plugins, Skills, and agents can evolve over many years
> without repeatedly redesigning the repository?

## Decision Drivers

- **Single, long-lived home** for Claude-related work.
- **Predictable layout** so Claude can operate autonomously.
- **Compatibility with Anthropic docs** and marketplace semantics.
- **Composability with Superpowers** and other Skill frameworks.
- **Low friction** to add new plugins, Skills, and agents.
- **Explicit CI / validation** integrated into the repo.
- [Driver X] Whether to implement this as a plain plugin, an MCP server, or both.

## Considered Options

Include variants such as **plain plugin vs MCP server vs combined** when relevant.

1. **Option A:** One repository per plugin or experiment.
2. **Option B:** One repository with a single "god plugin" that tries to do everything.
3. **Option C (chosen):** One repository as a **plugin marketplace and lab**:
    - `plugins/` for plugins.
    - `.claude-plugin/marketplace.json` as the manifest.
    - `tooling/` and `docs/` as shared infrastructure (skills and agents live inside their plugins).

## Decision Outcome

### Chosen option: Option C – Repository-as-Marketplace Architecture

The repository `ancplua-claude-plugins` is:

- The **canonical marketplace** for Alexander's Claude Code plugins.
- A **skills and agent lab** with a stable top-level layout.
- The place where Claude Code is expected to operate with full local authority (within the rules of `CLAUDE.md`).

This ADR is **accepted** and is the basis for `spec.md`, `CLAUDE.md`, and the directory structure.

## Consequences

### Good

- **Consistency:** All plugins share the same layout and validation rules.
- **Discoverability:** Claude and humans can find Skills, plugins, and agents by convention.
- **Scalability:** New plugins and agents can be added under existing directories without re-architecting the repo.
- **Easier autonomy:** Claude has a clear mental model of the repo, enabling more autonomous refactors and migrations.
- **Better integration:** The marketplace model aligns with Claude Code's plugin system and official docs.

### Bad

- **Single blast radius:** Mistakes in this repo can affect multiple plugins or workflows.
- **Initial complexity:** Contributors must learn the marketplace layout rather than a simple single-plugin project.
- **Shared CI coupling:** CI changes in this repo can impact all plugins at once.

These trade-offs are considered acceptable given the long-term goals.

## Pros and Cons of the Options

### Option A – One repository per plugin or experiment

**Good:**

- Failures in one repo do not directly affect others.
- Each repo can have tailored CI, docs, and policies.

**Bad:**

- Knowledge and patterns fragment across many repos.
- Harder for Claude to reuse Skills and patterns between projects.
- Higher overhead to maintain CI, workflows, and documentation in many places.
- Harder to develop a "lifecycle" view of Alexander's Claude ecosystem.

### Option B – One monolithic "god plugin"

**Good:**

- Single installation step for users.
- Everything is technically in one place.

**Bad:**

- High risk of **conceptual bloat**.
- Unclear boundaries between unrelated features.
- Difficult for Claude to reason about which behavior belongs where.
- Refactors become risky because everything is tangled inside one plugin.
- Harder to evolve APIs for subsets of behavior (no clear plugin boundaries).

### Option C – Repository-as-Marketplace Architecture (chosen)

**Good:**

- Clear separation between plugins, Skills, agents, and tooling.
- Marketplace manifest (`.claude-plugin/marketplace.json`) gives a single source of truth.
- Plugins remain small and focused, but still share infra.
- Claude can reason about the repo as a **small ecosystem**, not just a single project.
- Easy integration with Superpowers and other frameworks.

**Bad:**

- Requires initial discipline to maintain the layout.
- CI and tooling need to handle multiple plugins at once.
- Some contributors may need time to understand the marketplace model.

## Additional Details of the Chosen Architecture

### Directory roles

- `plugins/` – All Claude Code plugins.
- `.claude-plugin/marketplace.json` – Declares plugin list and metadata.
- `plugins/*/skills/` – Skills live inside their plugins (no repo-wide skills directory).
- `tooling/` – Scripts and templates shared across plugins.
- `docs/` – Architecture, plugin guidelines, workflows, and roadmap.
- `.github/workflows/` – CI and dependency automation.

### Autonomy and safety

- Claude is expected to have **full local authority** inside this repo (create, move, rename, delete), given the
  configured permissions.
- Claude MUST obey `CLAUDE.md`, `spec.md`, and this ADR when making structural changes.
- Validation scripts and CI pipelines are the **safety net** for any large change.

## Maintenance Rules for Claude

This ADR MUST be maintained as follows:

- When a **new architectural decision** is made that changes the fundamental layout or responsibilities of this repo:
  - Claude MUST either:
    - Add a new ADR file (for example, `adr-0002-<short-title>.md`), or
    - Update this ADR's `status` to `deprecated` or `superseded`.
  - If superseded, Claude MUST add a `Superseded by: ADR-XXXX` note near the top.
- When small refinements are made that do not change the core decision (repository-as-marketplace), Claude MAY:
  - Update the `date` field.
  - Adjust wording in **Consequences** or **Additional Details** to reflect reality.

Status options Claude MAY use:

- `proposed` – Decision drafted but not yet adopted.
- `accepted` – Decision implemented and in use.
- `rejected` – Decision considered but not implemented.
- `deprecated` – Decision is still in effect but discouraged.
- `superseded` – Decision replaced by a newer ADR.

Claude MUST NOT:

- Delete this ADR without replacing it with a newer ADR that explains the new architecture.
- Leave `status` and `date` fields inconsistent with the current state of the repository.

When in doubt, Claude MUST:

1. Inspect the actual repository structure and usage.
2. Compare with the intent written here.
3. Either align the repo to this ADR or explicitly update this ADR and `spec.md` to match the new, intentional design.
