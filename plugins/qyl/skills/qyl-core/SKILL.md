---
name: qyl-core
description: >-
  Governing authority for the qyl platform — a compile-time OS for agent workflows.
  Encodes the Loom compiler architecture, 7 bounded subsystems, MAF execution model,
  AIFunctionFactoryOptions bridge, and architectural invariants. Any AI agent working
  on qyl must follow this skill.
user-invocable: false
---

# qyl Governing Authority

qyl compiles the system. MAF executes the system. AG-UI renders and drives the system. Ledger, policy, and telemetry govern the system.

## The Pipeline

1. Developers declare tools, contracts, steps, and workflows in C# using Loom attributes
2. The Loom compiler (Roslyn `IIncrementalGenerator`) extracts declarations and emits static descriptors, manifests, and registries
3. The runtime Loom layer bridges descriptors into `AIFunction` via `AIFunctionFactoryOptions`
4. MAF consumes tools and workflow definitions to execute
5. Policy and telemetry observe and gate execution using generated metadata
6. Ledger stores durable run truth and artifacts
7. AG-UI projects state to operators and collects approvals

The system shape is known at compile time. There is no runtime reflection control plane.

## The Seven Planes

| Plane | Mission | Owns | Must Not Depend On |
|-------|---------|------|--------------------|
| **Data** | Ingest, normalize, persist telemetry | OTLP receivers, DuckDB storage, ingestion pipeline | MAF, AG-UI, LLM providers, workflow orchestration |
| **Serving** | Expose stable platform state to operators, MCP clients, internal services | REST/gRPC endpoints, query engine, MCP server surface | Free-form agent reasoning, UI component decisions |
| **Intelligence** | Convert telemetry into structured diagnostic facts and evidence | Diagnostic patterns, evidence packs, anomaly detection | AG-UI, workflow hosting, prose-first agent behavior |
| **Agent/Control** | Run bounded investigations and repair workflows over structured evidence | Agent orchestration, Loom workflows, tool execution | Raw storage internals, implicit shared memory, unbounded autonomy |
| **Ledger/Governance** | Store truth about what the system decided, did, and was allowed to do | Audit log, run records, approval chains, policy enforcement | Agent session state as truth, workflow checkpoint state as audit truth |
| **UI/Protocol** | Project platform state and workflows to humans and external clients | AG-UI surface, SSE streaming, approval/rejection UX | Hidden domain logic in components, direct storage coupling |
| **Compiler** | Make platform structure explicit at compile time | Loom generators, static descriptors, telemetry manifests | Runtime reflection as primary discovery, ad hoc startup registration |

## The Design Law

```
AI may reason over telemetry.
AI may propose actions from telemetry.
AI must NOT be in the hot path of telemetry ingestion or core query serving.
```

Telemetry systems and agent systems fail differently. Fusing them makes both worse.

## The Loom Compiler

Developers annotate C# code with four attribute types:

| Attribute | Target | Meaning |
|-----------|--------|---------|
| `[LoomTool]` | Methods | Deterministic function exposed as an AI tool |
| `[LoomContract]` | Types | Typed I/O shape for tool parameters and returns |
| `[LoomStep]` | Classes | Workflow step executor with explicit inputs/outputs |
| `[LoomWorkflow]` | Classes | Workflow definition with step ordering and approval ports |

The generator emits: static descriptors per tool/contract, a `LoomGeneratedRegistry` aggregating all declarations, and a telemetry manifest mapping tools to semantic conventions.

At runtime, descriptors are bridged into `AIFunction` instances via `AIFunctionFactoryOptions` -- no reflection, no hand-wired registration.

See [loom.md](loom.md) for the full pipeline.

## Decision Rules

| Work Type | Use | Why |
|-----------|-----|-----|
| Deterministic computation | `function` via `[LoomTool]` | Pure, testable, no LLM overhead |
| Open-ended planning | `agent` (bounded reasoning) | LLM needed, constrained by `[LoomBudget]` |
| Multi-step lifecycle | `workflow` via `[LoomWorkflow]` | Explicit ordering, checkpointing, approval ports |

## Architectural Invariants

1. **No runtime reflection as control plane.** The compiler emits everything the runtime needs.
2. **No prompt-only orchestration.** Every workflow is a typed graph with explicit steps, not a prompt chain.
3. **No fused execution/audit state.** Ledger records are separate from workflow checkpoint state.
4. **No AI in the telemetry hot path.** Ingestion and query serving never call an LLM.
5. **No hand-wired tool registration.** Tools come from Loom descriptors via `AIFunctionFactoryOptions`, not manual `AddTool` calls.

See [rules/invariants.md](rules/invariants.md) for enforcement details and rationale.

## Success Conditions

Each plane has one non-negotiable success condition:

- **Data:** Same input produces the same stored truth regardless of any agent subsystem.
- **Serving:** Platform capabilities reachable through explicit contracts without requiring an agent in the request path.
- **Intelligence:** Agents receive structured evidence packs instead of reconstructing truth from raw spans and logs.
- **Agent/Control:** Every autonomous action is capability-bounded, explainable, restartable, and approval-aware.
- **Ledger/Governance:** An operator can reconstruct any run without reading prompts or replaying execution state.
- **UI/Protocol:** Operators can inspect, approve, reject, and diff system behavior without needing chat transcripts as the UI model.
- **Compiler:** Runtime registration, telemetry semantics, tool exposure, and workflow metadata are compiler-emitted rather than hand-wired.

## Supporting Documentation

- [loom.md](loom.md) -- Loom compiler pipeline
- [rules/architecture.md](rules/architecture.md) -- 7 planes in detail
- [rules/maf.md](rules/maf.md) -- MAF execution + AIFunctionFactoryOptions
- [rules/invariants.md](rules/invariants.md) -- Invariants no agent may break
- [rules/frontend.md](rules/frontend.md) -- Dashboard constraints
- [mcp.md](mcp.md) -- MCP server and 500K result persistence
