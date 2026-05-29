# The Guillotine (`--guillotine`)

When Hades equips the Guillotine, his default identity inverts.

```text
default Hades:    "ignores public API, semver, changelog, backwards compat"
guillotine Hades: "actively destroys public API; forbids compat artifacts; demands functional equivalence per removed symbol"
```

This is not a softer mode. It is a stricter one.

## One teammate per phase

| Phase | Teammate                | Question Answered                                                        |
|-------|-------------------------|--------------------------------------------------------------------------|
| 0     | smart-guillotine-audit  | "Which `public` symbols are real contracts vs default access modifiers?" |
| 1     | smart-guillotine-elim   | "Delete or downgrade — and what replaces it?"                            |
| 2     | smart-guillotine-verify | "Shim-free AND functionally equivalent?"                                 |

## Two-axis verification — the load-bearing innovation

`build passes` if you delete `OldThing` and update every caller to do nothing.
`tests pass` if you delete the tests too. Neither rules out silent capability
loss. The Phase 2 verifier checks both axes:

1. **Shim-free.** The diff introduces no `[Obsolete]`, no
   `[EditorBrowsable(EditorBrowsableState.Never)]`, no `[assembly: TypeForwardedTo]`,
   no transitional entries in `<TargetFrameworks>`, no
   `// deprecated|legacy|compat|shim|bridge|transitional|will be removed|kept for`
   comments, no `PublicAPI.Unshipped.txt` lines mirroring removed
   `Shipped.txt` lines.
2. **Functionally equivalent.** Every consumer call site of the removed
   symbol either invokes the replacement now, or has been deleted from the
   codebase entirely. If no replacement, the eliminator must record an
   explicit `removal_justification` that does not match the LLM-default
   blacklist (`"no longer needed"`, `"unused"`, `"dead code"`,
   `"redundant"`, `"cleanup"`, `"refactor"` without a specific
   `file:line` reference or quoted user instruction).

## Audit trail

Alongside the standard deletion ledger at `.smart/delete-ledger.jsonl`, the
Guillotine maintains `.smart/break-manifest.jsonl` — one entry per removed
public symbol with `removed_symbol_id`, `replacement_symbol_id`,
`consumer_call_sites_before`, `consumer_call_sites_after`, `removed_tests`,
`removal_justification`. The verifier validates the manifest before passing Gate 2.

**When to equip:** scope contains `PublicAPI.Shipped.txt`, any `*.csproj`
with `<IsPackable>true</IsPackable>`, or any path under `packages/`. The
flag itself authorizes destruction of real contracts; without it, the
auditor classifies real contracts as `KEEP` and the eliminator no-ops.
**Effect:** +1 teammate per phase (3 across the run). Adds the
break-manifest as a required Gate 2 artifact.

See [../templates/guillotine.md](../templates/guillotine.md) for the full guillotine teammate prompts.
