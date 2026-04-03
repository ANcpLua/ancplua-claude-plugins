# Plane Boundary Rules

The seven planes and their forbidden dependencies. Use `repo-map.md` to map projects to planes.

## Rules

### Data Plane

**Projects:** `qyl.collector` (ingest/storage), `qyl.collector.storage.generators`

Must not depend on:

- `Microsoft.Agents.*` (MAF)
- AG-UI packages
- LLM provider packages
- Workflow orchestration packages

Must not contain:

- Agent reasoning logic
- Prompt construction
- LLM calls in the ingest/query path

**Check:** Grep `qyl.collector.csproj` and `qyl.collector.storage.generators.csproj`
for forbidden PackageReferences. Grep source files in ingest/storage paths
for `using Microsoft.Agents`.

### Serving Plane

**Projects:** `qyl.collector` (endpoints), `qyl.mcp`

Must not contain:

- Free-form agent reasoning
- UI component decisions
- Domain logic that belongs to intelligence plane

**Check:** Grep endpoint registration files for agent invocation patterns.
Endpoints should return data, not run agents inline.

### Intelligence Plane

**Projects:** `qyl.collector/Intelligence`

Must not depend on:

- AG-UI packages
- Workflow hosting concerns

Outputs must be:

- Structured records (evidence packs, scores, fingerprints)
- Not prose or free-form text

**Check:** Grep intelligence output types for structured shapes
(records, classes with typed properties) vs string-only outputs.

### Agent/Control Plane

**Projects:** `qyl.loom`

Must not depend on:

- Raw storage internals (no direct DuckDB access)
- Implicit shared memory assumptions

Must use:

- HTTP to collector (CollectorClient) for data access
- Bounded execution (LoomBudget)
- Capability requirements (RequiresCapability)

**Check:** Grep `qyl.loom.csproj` for DuckDB references.
Grep source for direct database access patterns.

### Ledger/Governance Plane

**Scope:** Run records, approval history, policy decisions (spread across loom + collector)

Must not use:

- Agent session state as source of truth
- Workflow checkpoint state as audit truth

**Check:** Grep for patterns where session/checkpoint state is treated as durable audit record.

### UI/Protocol Plane

**Projects:** `qyl.dashboard`

Must not contain:

- Hidden domain logic in components
- Direct storage coupling (no DuckDB, no direct .NET ProjectReference)

Must consume:

- Collector REST API only
- SSE for live data

**Check:** Verify `qyl.dashboard` has no ProjectReference to .NET projects.
Verify API calls go through the REST surface.

### Compiler Plane

**Projects:** `qyl.instrumentation.generators`, `qyl.instrumentation`

Must not use:

- Runtime reflection as primary discovery
- Ad hoc startup registration as source of truth

Must use:

- `IIncrementalGenerator` (never `ISourceGenerator`)
- `ForAttributeWithMetadataName`
- Value-equatable models
- Raw strings (never `SyntaxFactory`)

**Check:** Grep generator projects for `ISourceGenerator`, `SyntaxFactory`,
reflection-based discovery.

## Instruction-Surface Consistency

The plane rules should be consistent across:

- Root `AGENTS.md`
- Root `CLAUDE.md`
- `.claude/planes/*.md` (if exists)
- `.claude/AGENTS.md` (if exists)

**Check:** Read all four surfaces. Flag contradictions or missing planes.

## Dependency Direction Check

Verify one-way dependency flow:

```text
Data <- Serving <- Intelligence
                <- Agent/Control <- Ledger/Governance
                                  <- UI/Protocol
Compiler -> all
```

**Check:** Read each `.csproj` for ProjectReference. Flag any reverse-direction dependency.
