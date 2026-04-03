# Policy Gate Rules

Capability, approval, and destructive-action coverage requirements.

## Policy attributes

| Attribute | Purpose |
|-----------|---------|
| `[RequiresCapability("name")]` | Declares a capability the caller must possess |
| `[RequiresApproval]` | Marks a tool/step as requiring human approval before execution |
| `[ToolSideEffect(kind)]` | Classifies what the tool does to external state |
| `[LoomBudget]` | Sets execution budget (MaxAttempts, MaxToolCalls, MaxTokens) |

## Side-effect classifications

| Classification | Meaning | Requires gating? |
|---------------|---------|-------------------|
| `None` | Pure computation | No |
| `ReadsExternalState` | Reads from external systems | No (but should be declared) |
| `WritesExternalState` | Writes to external systems | Yes — needs `[RequiresCapability]` |
| `MutatesCode` | Modifies source code | Yes — needs `[RequiresCapability]` + `[RequiresApproval]` |
| `Deploys` | Triggers a deployment | Yes — needs `[RequiresCapability]` + `[RequiresApproval]` |
| `ClosesIssue` | Closes an issue tracker entry | Yes — needs `[RequiresApproval]` |

## Rules

### Destructive actions must have approval gates

Any tool with `WritesExternalState`, `MutatesCode`, `Deploys`, or `ClosesIssue` must have:

- `[RequiresApproval]` attribute, OR
- Be inside a workflow step that has an approval port before it

### Capability-bounded autonomy

Every tool that performs non-trivial work should declare its required
capabilities via `[RequiresCapability]`.

### Budget constraints

Agents that reason (not just execute deterministic functions) should have
`[LoomBudget]` to prevent unbounded execution.

## Checking procedure

```text
1. Grep for [ToolSideEffect] attributes across src/
2. For each tool with WritesExternalState, MutatesCode, Deploys, ClosesIssue:
   a. Check if [RequiresApproval] is present on the same method/class
   b. If not, check if the tool is used inside a workflow with an approval port
   c. If neither, emit policy_gap finding
3. Grep for [LoomTool] without any [ToolSideEffect]:
   a. If the tool method name suggests side effects (write, delete, close, deploy, mutate, create, update)
      but has no [ToolSideEffect], emit info finding
4. Grep for agent invocations without [LoomBudget]:
   a. If the agent does open-ended reasoning (not a deterministic function), emit warning
```

## Common gaps

- Tool has `[ToolSideEffect(ClosesIssue)]` but no `[RequiresApproval]`
- Tool writes to external state but is classified as `None`
- Workflow has a destructive final step with no `RequestPort` before it
- Agent reasoning loops have no budget constraints
