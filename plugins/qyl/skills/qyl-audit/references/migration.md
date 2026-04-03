# Migration Rules

How to judge old path vs new path, and when deletion is safe.

## Migration structure

Each migration has:

- **Old path:** the thing being replaced (type, file, pattern)
- **New path:** the replacement
- **Consumers:** code that references the old path
- **Blockers:** conditions that prevent deletion

## Safe deletion criteria

A target is safe to delete ONLY when ALL of these are true:

1. **Replacement exists** — the new path is implemented and compiles
2. **Replacement is wired** — the new path is actually used where the old path was used
3. **No remaining consumers** — grep shows zero references to the old path outside of the old path itself
4. **No conditional dependents** — no code branches on the existence of the old path

If ANY of these is false, the target is NOT safe to delete.
Mark it as a migration blocker instead.

## Checking procedure

```text
1. Identify known migrations from:
   a. CHANGELOG.md entries mentioning "replace", "migrate", "deprecate", "remove"
   b. Instruction files mentioning "old" vs "new" or "dead API" vs "replacement"
   c. Code comments mentioning "TODO: remove", "legacy", "deprecated"
2. For each migration:
   a. Grep for old path references (type names, method calls, using statements)
   b. Grep for new path references
   c. Check if old path code is still reachable
   d. Check if new path is fully wired (not just defined but actually used)
3. Classify:
   a. safe_to_delete — all 4 criteria met
   b. migration_blocker — one or more criteria not met (state which)
   c. info — migration is in progress, expected state
```

## Known migration patterns in qyl

These are patterns to look for, not hardcoded facts. Verify against actual code.

### Loom tool bridge

- **Old:** `LoomToolAIFunction` custom subclass
- **New:** `LoomToolFactoryBridge` via `AIFunctionFactory.Create` with `AIFunctionFactoryOptions`
- **Check:** Are both paths active? Does the factory bridge cover everything the custom subclass does?

### Agent APIs

- **Old:** `GenerateResponseAsync`, `GenerateStreamingResponseAsync`,
  `QylAgentBuilder`, `MapQylAguiChat()`
- **New:** `RunAsync`, `RunStreamingAsync`, `AddAIAgent()` / `AsAIAgent()`, `MapAGUI()`
- **Check:** Grep for old API names. Any hit is a migration blocker or a violation.

### Session/store patterns

- **Old:** Custom `QylAgentSessionStore`
- **New:** `WithInMemorySessionStore()` or `ChatHistoryProvider`
- **Check:** Grep for old store type references.

## Deletion decision output

When reporting a deletion decision:

```text
Target: [file or type name]
Reason: [why it might be deletable]
Replacement: [what replaces it]
Replacement wired: [yes/no, with evidence]
Remaining consumers: [list with file:line, or "none"]
Verdict: safe / unsafe / conditional
Condition: [what must happen first, if conditional]
```

## Do not guess

If you cannot verify whether a replacement is wired or whether consumers remain,
say "could not verify" and explain what you would need to check.
Never mark something as safe to delete based on assumptions.
