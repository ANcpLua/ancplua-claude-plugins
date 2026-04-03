# The Loom Compiler Pipeline

Loom makes platform structure explicit at compile time. Developers declare tools, contracts, steps, and workflows with attributes on methods, types, and classes. The Roslyn source generator (`LoomSourceGenerator`) extracts these declarations during compilation and emits static descriptor records plus a unified registry. At runtime, the bridge layer converts descriptors into Microsoft.Extensions.AI `AIFunction` objects consumable by any MAF-compatible host, carrying full binding metadata, policy enforcement, and telemetry context as additional properties.

## Declaration Surface

### Attributes

| Attribute | Target | Primary Constructor Params | Init Properties | Purpose |
|-----------|--------|---------------------------|-----------------|---------|
| `LoomToolAttribute` | `Method` | `string name` | `Description`, `Phase` (LoomPhase), `UseOnlyWhen`, `DoNotUseWhen` | Marks a method as a Loom tool with phase assignment and usage constraints |
| `LoomContractAttribute` | `Class`, `Struct` | `string name` | -- | Marks a type as a Loom contract (structured input/output schema) |
| `LoomStepAttribute` | `Class` | `string id` | `Phase` (LoomPhase), `Description` | Marks a class as a workflow step executor |
| `LoomWorkflowAttribute` | `Class` | `string id`, `Type runStateType`, `params string[] stepIds` | `Description` | Declares a workflow as an ordered sequence of step IDs with a run-state type |
| `RequiresCapabilityAttribute` | `Method`, `Class` | `string capability` | -- | Declares a capability requirement; `AllowMultiple = true` |
| `RequiresApprovalAttribute` | `Method`, `Class` | -- | -- | Marks a tool or step as requiring explicit human approval before execution |
| `ToolSideEffectAttribute` | `Method`, `Class` | `ToolSideEffect sideEffect` | -- | Declares the side-effect classification of a tool |
| `EmitsStructuredOutputAttribute` | `Method`, `Class` | `Type outputType` | -- | Declares the structured output type for schema emission |
| `LoomBudgetAttribute` | `Method`, `Class` | -- | `MaxAttempts` (default 1), `MaxToolCalls` (default 8), `MaxTokens` (default 16000) | Sets execution budget constraints for the tool |

### Enums

**LoomPhase** -- the lifecycle phase a tool or step operates in:

| Value | Meaning |
|-------|---------|
| `Detect` | Identify and localize a signal (regression, anomaly, incident) |
| `Plan` | Produce root-cause analysis and a bounded remediation plan |
| `Fix` | Generate a candidate patch or mutation |
| `Verify` | Confirm the fix resolves the issue without creating new regressions |
| `Report` | Project artifacts into an operator-grade report |
| `Close` | Close the issue via an explicit approval boundary |

**ToolSideEffect** -- classifies what a tool does to external state:

| Value | Meaning |
|-------|---------|
| `None` | Pure computation, no external state touched |
| `ReadsExternalState` | Reads from external systems (APIs, databases, files) |
| `WritesExternalState` | Writes to external systems |
| `MutatesCode` | Modifies source code |
| `Deploys` | Triggers a deployment |
| `ClosesIssue` | Closes an issue tracker entry |

## The Generator

`LoomSourceGenerator` is an `IIncrementalGenerator` that uses `ForAttributeWithMetadataName` to intercept four attribute types:

| Attribute | Syntax Filter | Extractor | Output per type |
|-----------|--------------|-----------|-----------------|
| `LoomToolAttribute` | `MethodDeclarationSyntax` | `LoomToolExtractor` | `{ContainingType}.LoomTools.g.cs` |
| `LoomContractAttribute` | `TypeDeclarationSyntax` | `LoomContractExtractor` | `{Type}.LoomContract.g.cs` |
| `LoomStepAttribute` | `TypeDeclarationSyntax` | `LoomStepExtractor` | `{Type}.LoomStep.g.cs` |
| `LoomWorkflowAttribute` | `TypeDeclarationSyntax` | `LoomWorkflowExtractor` | `{Type}.LoomWorkflow.g.cs` |

All four pipelines feed into a single `RegisterSourceOutput` that additionally emits:

- **`LoomGeneratedRegistry.g.cs`** -- the unified registry exposing `Tools`, `Contracts`, `Steps`, `Workflows` as static descriptor collections, plus `RuntimeMetadata` for the factory bridge.
- **`LoomGeneratedRegistry.TelemetryManifest.g.cs`** -- telemetry manifest with pre-computed spans, metrics, and capability maps for each declared tool.

## Descriptors

### LoomToolDescriptor

The primary descriptor for a declared tool.

| Property | Type | Description |
|----------|------|-------------|
| `Name` | `string` | Tool name from the attribute |
| `Description` | `string` | Human/model-readable description |
| `Phase` | `LoomPhase` | Lifecycle phase |
| `UseOnlyWhen` | `string?` | Positive usage constraint (appended to description) |
| `DoNotUseWhen` | `string?` | Negative usage constraint (appended to description) |
| `DeclaringType` | `Type` | The type containing the tool method |
| `MethodName` | `string` | The method name |
| `OutputType` | `Type?` | Structured output type from `EmitsStructuredOutput` |
| `Parameters` | `IReadOnlyList<LoomToolParameterDescriptor>` | All method parameters |
| `RequiredCapabilities` | `IReadOnlyList<string>` | Capabilities from `RequiresCapability` |
| `RequiresApproval` | `bool` | Whether approval is required |
| `SideEffect` | `ToolSideEffect` | Side-effect classification |
| `Invoker` | `LoomToolInvoker` | Generator-emitted delegate: `(IServiceProvider, object?[], CancellationToken) -> ValueTask<object?>` |

### LoomToolParameterDescriptor

| Property | Type | Description |
|----------|------|-------------|
| `Name` | `string` | Parameter name |
| `Type` | `Type` | CLR type |
| `IsNullable` | `bool` | Whether the parameter accepts null |
| `HasDefaultValue` | `bool` | Whether a compile-time default exists |
| `DefaultValueLiteral` | `string?` | JSON literal of the default value |
| `Description` | `string?` | From `[Description]` attribute |
| `EnumValues` | `IReadOnlyList<string>` | Pre-extracted enum member names if the type is an enum |

### LoomContractDescriptor

| Property | Type | Description |
|----------|------|-------------|
| `Name` | `string` | Contract name from the attribute |
| `Type` | `Type` | The CLR type of the contract |
| `Properties` | `IReadOnlyList<LoomContractPropertyDescriptor>` | All properties |

### LoomContractPropertyDescriptor

| Property | Type | Description |
|----------|------|-------------|
| `Name` | `string` | Property name |
| `Type` | `Type` | CLR type |
| `IsNullable` | `bool` | Whether the property accepts null |
| `IsRequired` | `bool` | Whether the property is required in the schema |
| `EnumValues` | `IReadOnlyList<string>` | Pre-extracted enum member names if the type is an enum |

### LoomStepDescriptor

| Property | Type | Description |
|----------|------|-------------|
| `Id` | `string` | Step identifier (e.g. `loom.demo.detect`) |
| `Phase` | `LoomPhase` | Lifecycle phase |
| `ExecutorType` | `Type` | The executor class type |
| `Description` | `string?` | Human-readable description |

### LoomWorkflowDescriptor

| Property | Type | Description |
|----------|------|-------------|
| `Id` | `string` | Workflow identifier (e.g. `loom.demo.full_cycle`) |
| `RunStateType` | `Type` | The run-state record type that accumulates workflow data |
| `StepIds` | `IReadOnlyList<string>` | Ordered sequence of step IDs |
| `Description` | `string?` | Human-readable description |

## Runtime Bridge

Two bridge paths convert descriptors into `AIFunction` objects. Both are valid; the factory bridge is the end-state.

### Current: LoomToolAIFunction

`LoomToolAIFunction` is a custom `AIFunction` subclass that wraps a `LoomToolDescriptor` directly.

**Conversion entry points on `LoomToolDescriptorExtensions`:**

- `descriptor.ToAIFunction(services?)` -- single tool, default options
- `descriptor.ToAIFunction(options, services?)` -- single tool with custom binding options
- `descriptors.ToAIFunctions(services?)` -- collection to `AIFunction[]`
- `descriptors.ToToolCatalog(services?)` -- collection to `AITool[]`

**Registry entry points on `LoomGeneratedRegistry`:**

- `ToAIFunctions(services?)` -- all tools as `AIFunction[]` via `LoomToolAIFunction`
- `ToToolCatalog(services?)` -- all tools as `AITool[]` via `LoomToolAIFunction`

**Binding surface:** `LoomToolBindingSurface` computed via `descriptor.GetBindingSurface(options?)` determines which parameters are model-visible vs infrastructure-bound. Default binding rules:

| Parameter Type | Binding Kind | Visible to Model | Excluded from Schema |
|----------------|-------------|-------------------|---------------------|
| `IServiceProvider` | `ServiceProvider` | No | Yes |
| `CancellationToken` | `CancellationToken` | No | Yes |
| `AIFunctionArguments` | `Runtime` | No | Yes |
| Everything else | `AiArgument` | Yes | No |

**AdditionalProperties** attached to every `LoomToolAIFunction`:

`loom.phase`, `loom.sideEffect`, `loom.requiresApproval`, `loom.declaringType`, `loom.methodName`, `loom.outputType`, `loom.useOnlyWhen`, `loom.doNotUseWhen`, `loom.requiredCapabilities`, `loom.binding.parameters`, `loom.binding.result`

**Customization via `LoomToolAIFunctionOptions`:**

| Property | Type | Purpose |
|----------|------|---------|
| `BindParameter` | `Func<LoomToolParameterDescriptor, LoomToolParameterBindingDescriptor>?` | Override default parameter binding |
| `ResolveParameter` | `Func<LoomToolParameterBindingContext, object?>?` | Custom parameter resolution at invocation time |
| `BindResult` | `Func<LoomToolDescriptor, LoomToolResultBindingDescriptor>?` | Override default result binding |
| `MarshalResult` | `Func<LoomToolResultBindingContext, object?, object?>?` | Transform results before returning to model |
| `ExcludeResultSchema` | `bool` | Suppress return schema when return shape is dynamic |
| `SerializerOptions` | `JsonSerializerOptions?` | Override JSON serialization |
| `AdditionalProperties` | `IReadOnlyDictionary<string, object?>?` | Merge extra metadata into the AIFunction |

### End-state: LoomToolFactoryBridge

`LoomToolFactoryBridge` converts `LoomRuntimeMetadataDescriptor` into `AIFunction` instances via `AIFunctionFactory.Create()` instead of the custom subclass. All binding metadata is compiler-emitted; the bridge performs no runtime discovery.

**Registry entry points on `LoomGeneratedRegistry`:**

- `ToFactoryAIFunctions(services?)` -- all tools via `AIFunctionFactory`
- `ToInstrumentedFactoryAIFunctions(services?)` -- all tools via factory, wrapped in `InstrumentedAIFunction`
- `ToPairedFactoryAIFunctions(services?)` -- pairs `LoomToolDescriptor` + `LoomRuntimeMetadataDescriptor` for richer descriptions

**The three power knobs on `AIFunctionFactoryOptions`:**

**ConfigureParameterBinding** -- hide infrastructure params from model schema:

Parameters like `CancellationToken`, `IServiceProvider`, `ILogger<T>`, `IHttpClientFactory` are excluded from the JSON schema via `ExcludeFromSchema = true`. Infrastructure types get a custom `BindParameter` delegate that resolves them from `AIFunctionArguments.Services` or DI. `CancellationToken` is handled natively by MEAI -- excluded from schema only, no custom binder needed.

**MarshalResult** -- control the result boundary:

When `EmitsStructuredOutput` is present, the bridge serializes the result to `JsonElement` via the declared structured output type. This strips internal shapes, producing model-safe payloads. When no structured output is declared, no marshaling is applied.

**ExcludeResultSchema** -- suppress when return shape is dynamic or marshaled:

Set to `true` when `LoomResultDescriptor.IsSchemaVisible` is `false` (no structured output type declared). Prevents the factory from attempting to reflect a return schema that does not exist or is meaningless.

**Runtime metadata descriptors** (compiler-emitted, consumed by the factory bridge):

| Descriptor | Properties |
|------------|------------|
| `LoomRuntimeMetadataDescriptor` | `Name`, `DeclaringType`, `MethodName`, `Phase`, `ParameterBindings`, `Result`, `Telemetry`, `Policy` |
| `LoomParameterBindingDescriptor` | `Name`, `Type`, `IsNullable`, `HasDefaultValue`, `DefaultValueLiteral`, `Description`, `IsSchemaVisible`, `IsInfrastructureBound`, `EnumValues` |
| `LoomResultDescriptor` | `OutputType`, `StructuredOutputType`, `ResultSchemaHint`, `HasStructuredOutput`, `IsSchemaVisible` |
| `LoomTelemetryDescriptor` | `Name`, `DeclaringType`, `MethodName`, `Phase`, `IsAwaitable`, `ReturnsValue`, `SideEffect`, `RequiredCapabilities` |
| `LoomPolicyDescriptor` | `Name`, `DeclaringType`, `MethodName`, `Phase`, `RequiresApproval`, `SideEffect`, `MaxAttempts`, `MaxToolCalls`, `MaxTokens`, `RequiredCapabilities` |

**AdditionalProperties** attached by the factory bridge:

`loom.name`, `loom.declaringType`, `loom.methodName`, `loom.phase`, `loom.bridge` (`"factory"`), `loom.binding.parameters`, `loom.result.*` (outputType, structuredOutputType, schemaHint, hasStructuredOutput, schemaVisible), `loom.telemetry.*` (isAwaitable, returnsValue, sideEffect, capabilities), `loom.policy.*` (requiresApproval, sideEffect, maxAttempts, maxToolCalls, maxTokens, capabilities)

## CompilerDemo

The `CompilerDemo` in `qyl.loom` is not abstract architecture -- it is real annotated code with a concrete lifecycle that proves the entire pipeline works end-to-end.

### Workflow: Regression Investigation

The `loom.demo.full_cycle` workflow implements a six-phase regression investigation: **detect -> plan -> fix -> verify -> report -> close**.

| Step ID | Phase | Executor | Purpose |
|---------|-------|----------|---------|
| `loom.demo.detect` | Detect | `LoomDemoDetectExecutor` | Detect regression and localize evidence |
| `loom.demo.plan` | Plan | `LoomDemoPlanExecutor` | Produce RCA and a bounded fix plan |
| `loom.demo.fix` | Fix | `LoomDemoFixExecutor` | Generate a candidate patch proposal |
| `loom.demo.verify` | Verify | `LoomDemoVerifyExecutor` | Verify patch safety and effect |
| `loom.demo.report` | Report | `LoomDemoReportExecutor` | Project artifacts into an operator-grade report |
| `loom.demo.close` | Close | `LoomDemoCloseExecutor` | Close issue via explicit approval boundary |

### Tools Mapped to Phases

| Tool Name | Phase | Side Effect | Key Constraint |
|-----------|-------|-------------|----------------|
| `analyze_regression` | Detect | None | Use only when comparing baseline vs suspect window |
| `propose_fix` | Plan | None | Requires `qyl.fix.plan` capability |
| `verify_fix` | Verify | ReadsExternalState | Accepts `CancellationToken` (infrastructure-bound, hidden from model) |
| `close_issue` | Close | ClosesIssue | `RequiresApproval` -- cannot execute without human confirmation |

### Approval Port Pattern

Between Report and Close, the workflow inserts a `RequestPort`:

```
report -> approval (RequestPort<InvestigationReport, ClosureDecision>) -> close
```

The `RequestPort` is a typed boundary: the workflow yields an `InvestigationReport` and blocks until an external actor (human operator) provides a `ClosureDecision`. This enforces that destructive actions (`ClosesIssue`) cannot bypass approval, regardless of what the model requests.

### Contracts

Nine `LoomContract`-annotated records define the data flowing between steps:

| Contract | Role |
|----------|------|
| `loom_demo_analyze_regression_input` | Input to the detect phase |
| `loom_demo_regression_analysis` | Output of detection, input to planning |
| `loom_demo_root_cause_report` | Structured RCA evidence |
| `loom_demo_fix_plan` | Bounded remediation plan |
| `loom_demo_patch_proposal` | Candidate patch with diff and file list |
| `loom_demo_verification_result` | Pass/fail with confidence and check list |
| `loom_demo_investigation_report` | Operator-grade summary |
| `loom_demo_closure_decision` | Approval/rejection with reason |
| `loom_demo_run_state` | Accumulates all phase outputs, tracks attempt count and max attempts |
