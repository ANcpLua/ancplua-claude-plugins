# Generator/Runtime Parity

The Loom pipeline has three stages. All three must agree for each concern.

```text
Model (LoomModels.cs) -> Generated output (.g.cs) -> Runtime bridge (LoomToolFactoryBridge / LoomToolAIFunction)
```

## What to check

For each concern, verify all three stages exist and connect:

### Parameter Binding

- **Model:** `LoomToolParameterDescriptor` has type info, nullability, defaults
- **Generated:** `LoomRuntimeMetadataDescriptor.ParameterBindings` emits `IsSchemaVisible` and `IsInfrastructureBound`
- **Bridge:** `ConfigureParameterBinding` in the factory bridge uses these to hide infra params

### Result Marshaling

- **Model:** `LoomToolDescriptor` has `OutputType` from `[EmitsStructuredOutput]`
- **Generated:** `LoomResultDescriptor` emits `HasStructuredOutput`, `StructuredOutputType`, `IsSchemaVisible`
- **Bridge:** `MarshalResult` serializes to the declared structured output type

### Telemetry Metadata

- **Model:** Tool attributes carry `Phase`, `SideEffect`, capability info
- **Generated:** `LoomTelemetryDescriptor` emits `Phase`, `SideEffect`, `IsAwaitable`, `ReturnsValue`
- **Bridge:** `AdditionalProperties` on the AIFunction carry `loom.telemetry.*`

### Policy Metadata

- **Model:** `[RequiresApproval]`, `[RequiresCapability]`, `[ToolSideEffect]`, `[LoomBudget]`
- **Generated:** `LoomPolicyDescriptor` emits all policy fields
- **Bridge:** `AdditionalProperties` carry `loom.policy.*`

### Tool Registration

- **Model:** `[LoomTool]` on methods
- **Generated:** `LoomGeneratedRegistry.Tools` aggregates all descriptors
- **Bridge:** `ToFactoryAIFunctions()` or `ToAIFunctions()` converts registry to AIFunction[]

### Workflow Registration

- **Model:** `[LoomWorkflow]` + `[LoomStep]` on classes
- **Generated:** `LoomGeneratedRegistry.Workflows` and `.Steps`
- **Bridge:** Workflow builder uses step descriptors to construct executor graph

## Checking procedure

```text
1. Glob for Loom model types in src/qyl.instrumentation/
2. Glob for generated .g.cs files (or generator source in src/qyl.instrumentation.generators/Loom/)
3. Glob for runtime bridge code (LoomToolFactoryBridge, LoomToolAIFunction, LoomToolCatalog)
4. For each concern above:
   a. Check model has the field/property
   b. Check generator emits the corresponding descriptor
   c. Check bridge reads and uses the descriptor
5. Emit generator_runtime_mismatch for any stage that is missing
```

## Common drift patterns

- Generator emits a new descriptor field but bridge doesn't read it yet
- Model has a new attribute but generator doesn't extract it
- Bridge hardcodes behavior that should come from generated metadata
- Old bridge (LoomToolAIFunction) and new bridge (LoomToolFactoryBridge) disagree on what metadata they carry
