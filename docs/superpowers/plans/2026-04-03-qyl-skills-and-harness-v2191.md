# qyl Skills Package + v2.1.91 Harness Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the qyl governing skill — the authority layer that any AI agent on any platform reads to understand what qyl is, how it works, and what it must never violate. Integrate Claude Code v2.1.91 features (bin/ executables, MCP 500K, disableSkillShellExecution) across the plugin harness.

**Architecture:** The skill encodes qyl as a compile-time OS for agent workflows. Loom compiler defines the system at compile time, MAF executes it, policy/ledger/telemetry govern it, AG-UI renders it. The skill is the Grand Priest — it governs any AI agent working on qyl regardless of platform.

**Tech Stack:** Markdown (SKILL.md), YAML frontmatter, JSON (evals, plugin.json, hooks.json), Shell scripts, Python scripts

---

## File Map

### New Files (qyl skills package)

| File | Responsibility |
|------|---------------|
| `plugins/qyl/skills/qyl-core/SKILL.md` | Governing authority — system model, invariants, decision rules |
| `plugins/qyl/skills/qyl-core/rules/architecture.md` | 7 bounded subsystems + Loom compiler as centerpiece |
| `plugins/qyl/skills/qyl-core/rules/maf.md` | function/agent/workflow rule + AIFunctionFactoryOptions bridge |
| `plugins/qyl/skills/qyl-core/rules/frontend.md` | React 19 + Base UI + Tailwind CSS 4 + ECharts 6 constraints |
| `plugins/qyl/skills/qyl-core/rules/invariants.md` | Architectural invariants no agent may break (replaces banned-patterns) |
| `plugins/qyl/skills/qyl-core/loom.md` | Loom attribute surface → compiler → descriptor → AIFunction pipeline |
| `plugins/qyl/skills/qyl-core/mcp.md` | MCP server topology + 500K result persistence |
| `plugins/qyl/skills/qyl-core/evals/evals.json` | 4 evaluation prompts grounded in Loom architecture |
| `plugins/qyl/skills/qyl-core/agents/openai.yml` | Non-Claude agent adapter |
| `plugins/qyl/.mcp.json` | MCP server connection config |
| `docs/decisions/ADR-0002-qyl-three-layer-distribution.md` | Decision record |

### New Files (bin/ migration)

| File | Source |
|------|--------|
| `plugins/qyl/bin/inject-ground-truth` | was `hooks/scripts/inject-ground-truth.sh` |
| `plugins/qyl/bin/block-dead-api` | was `hooks/scripts/block-dead-api.py` |
| `plugins/qyl/bin/stop-judge` | was `hooks/stop-judge.py` |
| `plugins/dotnet-architecture-lint/bin/inject-dotnet-rules` | was `hooks/scripts/inject-dotnet-rules.sh` |
| `plugins/dotnet-architecture-lint/bin/precheck-dotnet` | was `scripts/precheck-dotnet.py` |
| `plugins/hookify/bin/hookify-pretooluse` | was `hooks/pretooluse.py` |
| `plugins/hookify/bin/hookify-posttooluse` | was `hooks/posttooluse.py` |
| `plugins/hookify/bin/hookify-stop` | was `hooks/stop.py` |
| `plugins/hookify/bin/hookify-userpromptsubmit` | was `hooks/userpromptsubmit.py` |
| `plugins/hookify/bin/hookify-stopfailure` | was `hooks/stopfailure.py` |
| `plugins/metacognitive-guard/bin/epistemic-guard` | was `hooks/scripts/epistemic-guard.sh` |
| `plugins/metacognitive-guard/bin/commit-integrity-hook` | was `hooks/scripts/commit-integrity-hook.sh` |
| `plugins/metacognitive-guard/bin/objective-watch` | was `hooks/scripts/objective-watch.py` |
| `plugins/metacognitive-guard/bin/ralph-loop` | was `hooks/scripts/ralph-loop.sh` |
| `plugins/exodia/bin/findings-inject` | was `scripts/smart/findings-inject.sh` |
| `plugins/ancplua-project-routing/bin/project-routing` | was `hooks/project-routing.sh` |

### Modified Files

| File | Change |
|------|--------|
| `plugins/qyl/.claude-plugin/plugin.json` | Add `skills`, `mcpServers`; bump 1.0.0 → 1.1.0 |
| 6 plugins' `hooks.json` | Update commands to `${CLAUDE_PLUGIN_ROOT}/bin/` |
| 6 plugins' `plugin.json` | Version bumps |
| `.claude-plugin/marketplace.json` | Sync all versions |
| `tooling/templates/plugin-template/` | Add `bin/` example, remove `scripts/` |
| `CHANGELOG.md` | Entries under [Unreleased] |

### Deleted Directories

| Path | Why |
|------|-----|
| `plugins/qyl-continuation/` | Merged into `plugins/qyl/` — orphaned directory |
| `plugins/qyl-instrumentation/` | Merged into `plugins/qyl/` — orphaned directory |
| `plugins/calini/` | Merged into `plugins/qyl/` — orphaned directory |

---

## Task 1: SKILL.md — The Governing Authority

**Files:**
- Create: `plugins/qyl/skills/qyl-core/SKILL.md`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p plugins/qyl/skills/qyl-core/rules plugins/qyl/skills/qyl-core/evals plugins/qyl/skills/qyl-core/agents
```

- [ ] **Step 2: Write SKILL.md**

Write `plugins/qyl/skills/qyl-core/SKILL.md`:

```markdown
---
name: qyl-core
description: >-
  Governing authority for the qyl platform — a compile-time OS for agent workflows.
  Encodes the Loom compiler architecture, 7 bounded subsystems, MAF execution model,
  AIFunctionFactoryOptions bridge, and architectural invariants. Any AI agent working
  on qyl must follow this skill.
user-invocable: false
---

# qyl — Compile-Time OS for Agent Workflows

qyl compiles the system. MAF executes the system. AG-UI renders and drives the system.
Ledger, policy, and telemetry govern the system.

## What qyl Is

qyl is not an observability dashboard. It is a compiler-driven platform where:

1. **Developers declare** tools, contracts, steps, and workflows in normal C# using Loom attributes
2. **The Loom compiler** (Roslyn source generator) extracts those declarations and emits static runtime descriptors, manifests, and registries
3. **The runtime Loom layer** exposes descriptors and bridges tools into `AIFunction`-compatible objects via `AIFunctionFactoryOptions`
4. **MAF consumes** those tools and workflow definitions to execute the system
5. **Policy and telemetry** observe and gate execution using the same generated metadata
6. **The ledger** stores durable run truth and artifacts
7. **AG-UI** projects that state to operators and collects approvals

The system shape is known at compile time. There is no runtime reflection control plane.

## The Seven Subsystems

See [rules/architecture.md](rules/architecture.md) for full boundary definitions.

| Subsystem | Owns | Cares About |
|-----------|------|-------------|
| Telemetry.Core | Schemas, ingestion/query contracts, storage abstractions | Schema stability, replayability |
| Telemetry.Storage | DuckDB, tables, partitions, retention, rollups | Ingestion correctness, storage density, query latency |
| Telemetry.Serving | REST/SSE/MCP read APIs, stable query surfaces | Retention economics, API stability |
| Telemetry.Intelligence | Fingerprinting, regression detection, causal rules, evidence assembly | Deterministic scoring, structured evidence |
| Agenting.Runtime | MAF agents, workflows, approvals, repair loops | Tool selection, workflow state, autonomy boundaries |
| Agenting.Governance | Capability policy, run ledger, audit trail, rollback law | What may run, what needs approval, what is forbidden |
| Agenting.Compiler | Source generators, manifests, descriptor emission | Compile-time truth, registration glue |

## The Design Law

```
AI may reason over telemetry.
AI may propose actions from telemetry.
AI must NOT be in the hot path of telemetry ingestion or core query serving.
```

Telemetry systems and agent systems fail differently. Fusing them makes both worse.

## The Loom Compiler

See [loom.md](loom.md) for the full attribute → compiler → descriptor → AIFunction pipeline.

Developers annotate:
- `[LoomTool]` on methods — deterministic functions the system can invoke
- `[LoomContract]` on types — typed input/output shapes
- `[LoomStep]` on classes — workflow step executors
- `[LoomWorkflow]` on classes — workflow definitions with explicit step ordering

The generator emits:
- Static `LoomToolDescriptor` / `LoomContractDescriptor` / `LoomStepDescriptor` / `LoomWorkflowDescriptor`
- `LoomGeneratedRegistry` — compile-time registry of all declarations
- Telemetry manifest — metadata for observability

The runtime bridge converts descriptors into MAF-consumable `AIFunction` / `AITool` objects using `AIFunctionFactoryOptions`. See [rules/maf.md](rules/maf.md).

## Decision Rules

| Work type | Use | Why |
|-----------|-----|-----|
| Deterministic computation | `function` via `[LoomTool]` | Pure, testable, no LLM overhead |
| Open-ended planning | `agent` (bounded reasoning) | LLM needed, but constrained by `[LoomBudget]` |
| Multi-step lifecycle | `workflow` via `[LoomWorkflow]` | Explicit ordering, checkpointing, approval ports |

## Architectural Invariants

See [rules/invariants.md](rules/invariants.md) for the full list.

1. **No runtime reflection as control plane** — system shape comes from the Loom compiler, not reflection
2. **No prompt-only orchestration** — use typed workflows with `[LoomWorkflow]`, not ad-hoc prompt chains
3. **No fused execution/audit state** — MAF session state is execution state; qyl ledger is platform truth
4. **No AI in the telemetry hot path** — ingestion and core query serving must be deterministic
5. **No hand-wired tool registration** — use `LoomGeneratedRegistry.ToAIFunctions()`, not manual wiring

## Frontend Constraints

See [rules/frontend.md](rules/frontend.md). Base UI 1.3.0 (never Radix/shadcn), ECharts 6, lucide-react, TypeScript strict.

## MCP Server

See [mcp.md](mcp.md). 100+ tools, supports v2.1.91 `_meta["anthropic/maxResultSizeChars"]` up to 500K.
```

- [ ] **Step 3: Commit**

```bash
git add plugins/qyl/skills/qyl-core/SKILL.md
git commit -m "feat(qyl): SKILL.md — governing authority for any AI agent"
```

---

## Task 2: Loom Pipeline Doc

**Files:**
- Create: `plugins/qyl/skills/qyl-core/loom.md`

- [ ] **Step 1: Write loom.md**

Write `plugins/qyl/skills/qyl-core/loom.md`. Content should be extracted and synthesized from the actual code at:
- `src/qyl.instrumentation/Instrumentation/Loom/LoomAttributes.cs` — the 8 attribute types
- `src/qyl.instrumentation/Instrumentation/Loom/LoomDescriptors.cs` — the 5 descriptor records
- `src/qyl.instrumentation/Instrumentation/Loom/LoomEnums.cs` — `LoomPhase` (6 phases) + `ToolSideEffect` (6 effects)
- `src/qyl.instrumentation/Instrumentation/Loom/LoomToolCatalog.cs` — the `AIFunction` bridge
- `src/qyl.instrumentation.generators/Loom/LoomSourceGenerator.cs` — the generator entry point
- `src/qyl.loom/CompilerDemo/` — real annotated demo (contracts, tools, workflow)

Structure the doc as:

```markdown
# The Loom Compiler Pipeline

## Declaration Surface (what developers write)

### Attributes
[Table of all 8 attributes with their targets, properties, and purpose]

### Enums
[LoomPhase: Detect → Plan → Fix → Verify → Report → Close]
[ToolSideEffect: None, ReadsExternalState, WritesExternalState, MutatesCode, Deploys, ClosesIssue]

## Compiler (what the generator emits)

[LoomSourceGenerator: ForAttributeWithMetadataName for each of the 4 attribute types]
[Output: per-type .LoomTools.g.cs, .LoomContract.g.cs, .LoomStep.g.cs, .LoomWorkflow.g.cs]
[Registry: LoomGeneratedRegistry.g.cs — compile-time truth]
[Telemetry manifest: LoomGeneratedRegistry.TelemetryManifest.g.cs]

## Descriptors (the generated output)

[LoomToolDescriptor — name, description, phase, parameters, capabilities, approval, side effect, invoker]
[LoomContractDescriptor — name, type, properties]
[LoomStepDescriptor — id, phase, executor type]
[LoomWorkflowDescriptor — id, run state type, step ordering]

## Runtime Bridge (how descriptors become executable)

[LoomToolDescriptor.ToAIFunction() → LoomToolAIFunction → MAF AIFunction]
[LoomGeneratedRegistry.ToAIFunctions() → all tools as AIFunction[]]
[LoomGeneratedRegistry.ToToolCatalog() → all tools as AITool[]]

### AIFunctionFactoryOptions (.NET 10 end-state)

[ConfigureParameterBinding — hide CancellationToken, IServiceProvider, ILogger from schema]
[MarshalResult — control result surfaces for patches, evidence, approvals]
[ExcludeResultSchema — suppress when return shape is dynamic/marshaled]
[AdditionalProperties — loom.phase, loom.sideEffect, loom.requiresApproval, etc.]

Current bridge: custom AIFunction subclass (LoomToolAIFunction).
End-state: AIFunctionFactory.Create(method, AIFunctionFactoryOptions) with custom wrapper only where factory options can't express it.

## Demo (proof it works)

[Reference CompilerDemo/ — real annotated contracts, 4 tools across phases, 6-step workflow with approval port]
```

- [ ] **Step 2: Commit**

```bash
git add plugins/qyl/skills/qyl-core/loom.md
git commit -m "feat(qyl): loom.md — full compiler pipeline documentation"
```

---

## Task 3: Rule Files

**Files:**
- Create: `plugins/qyl/skills/qyl-core/rules/architecture.md`
- Create: `plugins/qyl/skills/qyl-core/rules/maf.md`
- Create: `plugins/qyl/skills/qyl-core/rules/invariants.md`
- Create: `plugins/qyl/skills/qyl-core/rules/frontend.md`

- [ ] **Step 1: Write architecture.md**

The 7 bounded subsystems with ownership rules, data flow, and the telemetry/agenting separation. Show how current src/ projects map to subsystems. Include the design law.

Key content:
- Telemetry subsystem: Core (qyl.contracts partial), Storage (qyl.collector/Storage), Serving (qyl.collector/Endpoints + qyl.mcp), Intelligence (scattered → consolidating)
- Agenting subsystem: Runtime (qyl.loom MAF), Governance (emerging), Compiler (qyl.instrumentation.generators/Loom)
- Data flow diagram: OTLP → collector → DuckDB; REST/SSE/MCP → agents/dashboard/loom
- Why telemetry and agenting are separate subsystems (they fail differently)

- [ ] **Step 2: Write maf.md**

The MAF execution model grounded in Loom.

Key content:
- function/agent/workflow decision rule with examples
- How Loom-compiled descriptors become MAF tools via AIFunctionFactoryOptions
- The 3 power knobs: ConfigureParameterBinding, MarshalResult, ExcludeResultSchema
- AdditionalProperties metadata (loom.phase, loom.sideEffect, loom.requiresApproval, etc.)
- Hosted pattern (AddAIAgent for collector) vs standalone pattern (AsAIAgent for loom)
- Built-in MAF observability spans (invoke_agent, chat, execute_tool, workflow.*)
- Dead APIs (QylAgentBuilder, MapQylAguiChat, GenerateResponseAsync)

- [ ] **Step 3: Write invariants.md**

Architectural invariants — things no agent may violate. NOT a copy of hook-enforced bans.

Key content:
1. No runtime reflection as control plane — Loom compiler replaces it
2. No prompt-only orchestration — use [LoomWorkflow], not ad-hoc chains
3. No fused execution/audit state — MAF session ≠ qyl ledger
4. No AI in telemetry hot path — ingestion/query serving is deterministic
5. No hand-wired tool registration — use LoomGeneratedRegistry
6. No mixing subsystem boundaries — Telemetry.* doesn't import Agenting.*, vice versa
7. Collector owns DuckDB — loom/MCP read via HTTP only
8. Contracts are BCL-only — zero NuGet dependencies

- [ ] **Step 4: Write frontend.md**

React 19 + Base UI 1.3.0 + Tailwind CSS 4 + ECharts 6 constraints. Same content as previous plan — these constraints haven't changed.

- [ ] **Step 5: Commit**

```bash
git add plugins/qyl/skills/qyl-core/rules/
git commit -m "feat(qyl): rule files — architecture, maf, invariants, frontend"
```

---

## Task 4: MCP Doc + Evals + Agent Adapter

**Files:**
- Create: `plugins/qyl/skills/qyl-core/mcp.md`
- Create: `plugins/qyl/skills/qyl-core/evals/evals.json`
- Create: `plugins/qyl/skills/qyl-core/agents/openai.yml`

- [ ] **Step 1: Write mcp.md**

MCP server config + 500K result persistence + tool categories. Same structure as previous plan but add: the MCP tools serve Telemetry.Serving — they are the read API, not the agenting layer.

- [ ] **Step 2: Write evals.json**

4 evals grounded in Loom architecture:

```json
[
  {
    "name": "instrument-with-loom",
    "prompt": "Add a new Loom tool to qyl that detects latency regressions",
    "expected_keywords": ["[LoomTool]", "LoomPhase.Detect", "[LoomContract]", "[EmitsStructuredOutput]", "qyl.instrumentation.generators"],
    "unexpected_keywords": ["runtime reflection", "hand-wired", "QylAgentBuilder"],
    "rationale": "Must use Loom attributes, not manual registration. Generator handles emission."
  },
  {
    "name": "bridge-to-maf",
    "prompt": "Make this Loom tool available to MAF agents with ILogger and CancellationToken hidden from the schema",
    "expected_keywords": ["AIFunctionFactoryOptions", "ConfigureParameterBinding", "ExcludeFromSchema", "LoomGeneratedRegistry"],
    "unexpected_keywords": ["runtime reflection", "manual AIFunction"],
    "rationale": "Must use AIFunctionFactoryOptions to hide infra params, not custom subclass."
  },
  {
    "name": "workflow-not-prompt",
    "prompt": "Build an autofix pipeline that detects a regression, plans a fix, applies it, and verifies",
    "expected_keywords": ["[LoomWorkflow]", "[LoomStep]", "Executor", "WorkflowBuilder", "RequestPort"],
    "unexpected_keywords": ["prompt chain", "ad-hoc", "while loop"],
    "rationale": "Must use typed workflow with explicit steps and approval ports, not prompt-only orchestration."
  },
  {
    "name": "subsystem-boundary",
    "prompt": "Add a new DuckDB table and query it from the loom autofix agent",
    "expected_keywords": ["qyl.collector", "CollectorClient", "HTTP", "REST API"],
    "unexpected_keywords": ["direct DuckDB", "DuckDbStore", "using Qyl.Collector"],
    "rationale": "Loom reads via HTTP (Telemetry.Serving). Collector owns storage (Telemetry.Storage). No crossing."
  }
]
```

- [ ] **Step 3: Write openai.yml**

```yaml
interface:
  display_name: "qyl"
  short_description: "Compile-time OS for agent workflows — Loom compiler, MAF execution, telemetry governance."
  categories:
    - agent-platform
    - observability
    - dotnet
    - opentelemetry
```

- [ ] **Step 4: Commit**

```bash
git add plugins/qyl/skills/qyl-core/mcp.md plugins/qyl/skills/qyl-core/evals/ plugins/qyl/skills/qyl-core/agents/
git commit -m "feat(qyl): mcp docs, evals, and agent adapter"
```

---

## Task 5: Plugin Config + MCP + Version Bump + Orphan Cleanup

**Files:**
- Create: `plugins/qyl/.mcp.json`
- Modify: `plugins/qyl/.claude-plugin/plugin.json` — add skills/mcpServers, bump to 1.1.0
- Modify: `.claude-plugin/marketplace.json` — sync version
- Delete: `plugins/qyl-continuation/`, `plugins/qyl-instrumentation/`, `plugins/calini/`

- [ ] **Step 1: Create .mcp.json**

```json
{
  "mcpServers": {
    "qyl": {
      "type": "http",
      "url": "https://mcp.qyl.info/mcp"
    }
  }
}
```

- [ ] **Step 2: Update plugin.json**

Add `"skills": "./skills"` and `"mcpServers": "./.mcp.json"` after agents array. Bump version to `"1.1.0"`.

- [ ] **Step 3: Sync marketplace.json**

Change qyl version from `"1.0.0"` to `"1.1.0"`.

- [ ] **Step 4: Delete orphaned plugin directories**

```bash
rm -rf plugins/qyl-continuation/ plugins/qyl-instrumentation/ plugins/calini/
```

These were merged into `plugins/qyl/` in commit 9732e78 but the directories were never cleaned up.

- [ ] **Step 5: Commit**

```bash
git add plugins/qyl/.mcp.json plugins/qyl/.claude-plugin/plugin.json .claude-plugin/marketplace.json
git rm -r plugins/qyl-continuation/ plugins/qyl-instrumentation/ plugins/calini/
git commit -m "feat(qyl): MCP config, skills field, 1.1.0, delete orphaned plugins"
```

---

## Task 6: bin/ Migration — All Plugins

**Files:** 16 scripts across 6 plugins move to `bin/`, hooks.json updated, versions bumped.

- [ ] **Step 1: qyl plugin**

```bash
mkdir -p plugins/qyl/bin
cp plugins/qyl/hooks/scripts/inject-ground-truth.sh plugins/qyl/bin/inject-ground-truth
cp plugins/qyl/hooks/scripts/block-dead-api.py plugins/qyl/bin/block-dead-api
cp plugins/qyl/hooks/stop-judge.py plugins/qyl/bin/stop-judge
chmod +x plugins/qyl/bin/*
```

Update `plugins/qyl/hooks/hooks.json` — all 3 commands to `${CLAUDE_PLUGIN_ROOT}/bin/<name>`.
Remove old files: `hooks/scripts/inject-ground-truth.sh`, `hooks/scripts/block-dead-api.py`, `hooks/stop-judge.py`, `rmdir hooks/scripts`.

- [ ] **Step 2: dotnet-architecture-lint**

Move 2 scripts to `bin/`. Bump 1.1.3 → 1.1.4.

- [ ] **Step 3: hookify**

Move 5 scripts to `bin/` (prefix `hookify-`). Bump 0.4.0 → 0.4.1.

- [ ] **Step 4: metacognitive-guard**

Move 4 scripts to `bin/`. Bump 0.6.6 → 0.6.7.

- [ ] **Step 5: exodia**

Move `findings-inject.sh` only to `bin/`. Keep `scripts/smart/` (other scripts invoked from skills, not hooks). Bump 2.1.3 → 2.1.4.

- [ ] **Step 6: ancplua-project-routing**

Move `project-routing.sh` to `bin/`. Bump 2.0.1 → 2.0.2.

- [ ] **Step 7: Sync all version bumps in marketplace.json**

- [ ] **Step 8: Commit**

```bash
git add plugins/*/bin/ plugins/*/hooks/ plugins/*/.claude-plugin/ .claude-plugin/marketplace.json
git commit -m "refactor: migrate all hook scripts to bin/ executables (v2.1.91)"
```

---

## Task 7: Plugin Template Update

**Files:**
- Create: `tooling/templates/plugin-template/bin/example-check`
- Modify: `tooling/templates/plugin-template/hooks/hooks.json`
- Delete: `tooling/templates/plugin-template/scripts/example-script.sh`
- Modify: `tooling/templates/plugin-template/CLAUDE.md`

- [ ] **Step 1: Create bin/ example, update hooks.json, update CLAUDE.md, remove scripts/**

- [ ] **Step 2: Commit**

```bash
git add tooling/templates/
git commit -m "refactor: update plugin template with bin/ convention (v2.1.91)"
```

---

## Task 8: ADR-0002

**Files:**
- Create: `docs/decisions/ADR-0002-qyl-three-layer-distribution.md`

- [ ] **Step 1: Write ADR**

Framing: qyl knowledge locked in Claude Code plugins → adopt three-layer model (skills as governing authority + netagents + MCP). Document the Grand Priest role of the skill, the 7-subsystem architecture it encodes, and the Loom compiler as architectural centerpiece.

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/
git commit -m "docs: ADR-0002 three-layer distribution model for qyl"
```

---

## Task 9: CHANGELOG + Validation + PR

- [ ] **Step 1: CHANGELOG entries under [Unreleased] → Added**

```markdown
- **`qyl` skills package (1.1.0)**: Governing authority skill for any AI agent working on qyl. Encodes the Loom compiler architecture (attribute → generator → descriptor → AIFunction pipeline), 7 bounded subsystems (Telemetry.Core/Storage/Serving/Intelligence + Agenting.Runtime/Governance/Compiler), MAF execution model with AIFunctionFactoryOptions bridge, and 5 architectural invariants. MCP server config with v2.1.91 500K result persistence. 4 Loom-grounded evals. OpenAI agent adapter. ADR-0002 documents the three-layer decision.
- **Plugin executables `bin/` (v2.1.91)**: Migrated all hook scripts across 6 plugins to `bin/` directories with shebangs. Updated plugin template.
- **Orphan cleanup**: Deleted `plugins/qyl-continuation/`, `plugins/qyl-instrumentation/`, `plugins/calini/` — merged into `plugins/qyl/` in v1.0.0.
```

- [ ] **Step 2: Validate**

```bash
./tooling/scripts/weave-validate.sh
```

- [ ] **Step 3: Push + PR**

```bash
git push -u origin HEAD
gh pr create --title "feat: qyl governing skill + v2.1.91 bin/ migration" --body "Three-layer distribution for qyl. Skill encodes the Loom compiler architecture as governing authority for any AI agent. bin/ migration for all hook scripts. ADR-0002." --auto
```
