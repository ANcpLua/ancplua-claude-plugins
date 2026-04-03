# Architectural Invariants

These are laws no agent may violate. They are not duplicates of hook-enforced bans (DateTime.Now, etc.) -- these govern structural decisions.

## 1. No runtime reflection as control plane

System shape comes from the Loom compiler. Runtime reflection is not the primary discovery mechanism. Ad hoc startup registration is not the source of truth.

## 2. No prompt-only orchestration

Use typed workflows with `[LoomWorkflow]` and `Executor` steps, not ad-hoc prompt chains or while loops.

## 3. No fused execution/audit state

MAF session state is execution state. Workflow checkpoint state is execution state. The qyl ledger is business/audit truth. Never use agent session state or workflow checkpoints as the source of audit truth.

## 4. No AI in the telemetry hot path

The data plane must not depend on MAF, AG-UI, LLM providers, or workflow orchestration. Same input must produce same stored truth regardless of any agent subsystem.

## 5. No hand-wired tool registration

Use `LoomGeneratedRegistry.ToAIFunctions()` or `ToToolCatalog()`. The compiler emits the registry.

## 6. No crossing plane boundaries

Data plane doesn't import agent/control plane. Serving plane doesn't own domain reasoning. Intelligence plane prefers deterministic logic over prose. Dependencies flow one way.

## 7. No unbounded autonomy

Every autonomous action is capability-bounded (`[RequiresCapability]`), explainable, restartable, and approval-aware (`[RequiresApproval]`).

## 8. Collector owns DuckDB

Loom and MCP read via HTTP (CollectorClient) only. No direct DuckDB access from outside the data plane.

## 9. Contracts are BCL-only

qyl.contracts has zero NuGet dependencies. It is the shared type surface.
