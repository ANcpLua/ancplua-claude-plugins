# The Seven Planes

qyl is organized into seven planes. Prefer changing one plane at a time and keep dependencies one-way.

## Data Plane

**Mission:** Ingest telemetry, normalize it, persist it cheaply and correctly.

**Owns:** OTLP ingest, canonical telemetry schema, DuckDB storage, promoted columns, retention and compaction, ingestion auth/quotas/backpressure.

**Depends on:** Contracts and storage primitives only.

**Must not depend on:** MAF, AG-UI, LLM providers, workflow orchestration, dashboard composition rules.

**Current qyl areas:** `src/qyl.collector` ingest and storage paths, `specs/collector.md`, `specs/telemetry-data-model.md`.

**Success condition:** Same input produces the same stored truth regardless of any agent subsystem.

## Serving Plane

**Mission:** Expose stable platform state to operators, MCP clients, and internal services.

**Owns:** REST endpoints, SSE streams, MCP-facing read/write adapters, pagination/filters/response envelopes, query/materialization boundaries.

**Depends on:** Data plane, intelligence plane, ledger/governance plane.

**Must not depend on:** Free-form agent reasoning, UI component decisions.

**Current qyl areas:** Collector endpoint registration, MCP HTTP/client surfaces, `specs/api.md`, `specs/mcp.md`.

**Success condition:** Platform capabilities are reachable through explicit contracts without requiring an agent in the request path.

## Intelligence Plane

**Mission:** Convert telemetry into structured diagnostic facts and evidence.

**Owns:** Issue fingerprinting, regression detection, deployment correlation, anomaly and cost heuristics, evidence assembly for investigations and autofix, deterministic scoring and ranking.

**Depends on:** Data plane, contracts.

**Must not depend on:** AG-UI, workflow hosting concerns, prose-first agent behavior for core classification logic.

**Current qyl areas:** `src/qyl.collector/Intelligence`, `core/specs/intelligence`, `src/qyl.contracts/Intelligence`, `specs/issue-fingerprinting.md`, `specs/telemetry-intelligence.md`.

**Success condition:** Agents receive structured evidence packs instead of reconstructing truth from raw spans and logs.

## Agent/Control Plane

**Mission:** Run bounded investigations and repair workflows over structured evidence.

**Owns:** Specialist agents, workflow orchestration, approvals and handoffs, bounded repair loops, report synthesis.

**Execution law:** `function` for deterministic work, `agent` for bounded reasoning and tool choice, `workflow` for orchestration/durability/approvals.

**Depends on:** Intelligence plane, serving plane, ledger/governance plane, compiler plane outputs.

**Must not depend on:** Raw storage internals as its primary API, implicit shared memory assumptions, unbounded autonomy.

**Current qyl areas:** Loom and autofix flows, MAF integration points, issue investigation and repair orchestration.

**Success condition:** Every autonomous action is capability-bounded, explainable, restartable, and approval-aware.

## Ledger/Governance Plane

**Mission:** Store truth about what the system decided, did, and was allowed to do.

**Owns:** Run ledger, artifact registry, approval history, policy decisions, evaluation outcomes, rollback lineage, audit semantics and capability boundaries.

**Depends on:** Contracts, storage primitives.

**Must not depend on:** Agent session state as the source of truth, workflow checkpoint state as audit truth.

**Current qyl areas:** Loom/autofix run records and policy gates, future durable run/session ledger work.

**Success condition:** An operator can reconstruct any run without reading prompts or replaying execution state.

## UI/Protocol Plane

**Mission:** Project platform state and workflows to humans and external clients.

**Owns:** Dashboard surfaces, AG-UI state projection, approvals UI, workflow progress and artifact views, client-facing session/state sync semantics.

**Depends on:** Serving plane, ledger/governance plane, agent/control plane outputs.

**Must not depend on:** Hidden domain logic in components, direct storage coupling.

**Current qyl areas:** `src/qyl.dashboard`, AG-UI hosting/projection work, operator-facing issue/trace/cost/fix-run surfaces.

**Success condition:** Operators can inspect, approve, reject, and diff system behavior without needing chat transcripts as the UI model.

## Compiler Plane

**Mission:** Make platform structure explicit at compile time.

**Owns:** Source generators, descriptors and registries, tool catalogs, workflow manifests, capability and policy manifests, telemetry metadata emission, projection/wiring helpers.

**Depends on:** Roslyn utility libraries, contracts and attribute surfaces.

**Must not depend on:** Runtime reflection as primary discovery, ad hoc startup registration as the source of truth.

**Current qyl areas:** `src/qyl.instrumentation.generators`, Loom generator slice, service-defaults and instrumentation emitters.

**Success condition:** Runtime registration, telemetry semantics, tool exposure, and workflow metadata are compiler-emitted rather than hand-wired.

## Global Laws

1. The data plane is the product core. It must not depend on MAF, AG-UI, or LLM/provider code.
2. The serving plane exposes stable read/write contracts over platform state. It should not own domain reasoning.
3. The intelligence plane turns telemetry into structured facts, scores, and evidence packs. It should prefer deterministic logic over prose.
4. The agent/control plane consumes intelligence outputs and governs investigations, planning, approvals, and bounded repair loops.
5. The ledger/governance plane stores business truth. Agent sessions and workflow checkpoints are execution state, not audit truth.
6. The UI/protocol plane projects existing state to operators and clients. It must not become a second domain model.
7. The compiler plane generates descriptors, registries, manifests, policy metadata, and wiring. Runtime reflection is not the control plane.

## Dependency Direction

Dependencies flow one way:

```
Data <- Serving <- Intelligence
                <- Agent/Control <- Ledger/Governance
                                  <- UI/Protocol
Compiler -> all (emits metadata consumed by every plane)
```
