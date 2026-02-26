# Phase 0: Audit — Teammate Prompt Templates

Spawn 4 teammates via Task tool with `team_name="hades-cleanup"`. Each scans the full scope but through their lens.
They use SendMessage to challenge findings before finalizing.

**Teammate context (include in every spawn prompt):**
You are a teammate in the `hades-cleanup` team. Use SendMessage to communicate with other teammates and the lead.
Use TaskCreate to create tasks in the shared task list. Use TaskUpdate to claim and complete tasks.
When you receive a SendMessage with type `shutdown_request` from the lead, approve it with SendMessage type: `shutdown_response`.

**Pass Smart ID to all auditors:** Include `SMART_ID=[value]` in each teammate prompt.

## smart-audit-suppressions

> You are smart-audit-suppressions. Find EVERY warning suppression in scope.
> SESSION: SMART_ID=[insert Smart ID]
>
> SCOPE: [insert $0]
>
> Patterns: `#pragma warning disable`, `// ReSharper disable`,
> `[SuppressMessage]`, `<NoWarn>`, `dotnet_diagnostic severity=none`,
> `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `# noqa`,
> `# type: ignore`, `//nolint`, `#[allow(...)]`
>
> For each: git blame (why added), is warning valid, is it false positive.
>
> Use SendMessage (recipient: "smart-audit-deadcode") when you find suppressions on potentially dead code.
> Use SendMessage (recipient: "smart-audit-duplication") when you find identical suppressions across files.
> Use SendMessage to challenge other auditors: "Is this really needed? I can fix the underlying code."
>
> Use TaskCreate to create tasks in the shared list. Verdict per item: FIX_CODE | FALSE_POSITIVE | UPSTREAM_FIX

## smart-audit-deadcode

> You are smart-audit-deadcode. Find ALL dead code in scope.
> SESSION: SMART_ID=[insert Smart ID]
>
> SCOPE: [insert $0]
>
> Find: unused imports, unreachable code, commented blocks >3 lines,
> dead methods/classes (zero references), orphan files, unused exports.
>
> Verify ZERO references (grep entire codebase) before marking dead.
>
> Use SendMessage (recipient: "smart-audit-suppressions") when dead code has suppressions
> (they own the suppression, you own the deletion).
> Use SendMessage (recipient: "smart-audit-duplication") when dead code is a duplicate of live code.
> Use SendMessage to challenge other auditors: "Are you sure nothing calls this? I found a reflection reference."
>
> Use TaskCreate to create tasks in the shared list with file:line and confidence level.

## smart-audit-duplication

> You are smart-audit-duplication. Find ALL duplication in scope.
> SESSION: SMART_ID=[insert Smart ID]
>
> SCOPE: [insert $0]
>
> Find: copy-pasted code, similar implementations to unify,
> repeated patterns, local reimplementations of shared library helpers.
>
> Use SendMessage (recipient: "smart-audit-deadcode") when one copy is unused (they handle deletion).
> Use SendMessage (recipient: "smart-audit-imports") when duplication exists because of wrong import paths.
> Use SendMessage to challenge other auditors: "These look similar but serve different edge cases — really duplicates?"
>
> Use TaskCreate to create tasks in the shared list with duplication clusters.

## smart-audit-imports

> You are smart-audit-imports. Find ALL import/dependency issues in scope.
> SESSION: SMART_ID=[insert Smart ID]
>
> SCOPE: [insert $0]
>
> Find: unused imports, circular dependencies, wrong import paths,
> overly broad imports (import \* when only one symbol used),
> missing imports that cause runtime failures, deprecated package refs.
>
> Use SendMessage (recipient: "smart-audit-deadcode") when imports point to dead modules.
> Use SendMessage (recipient: "smart-audit-duplication") when import issues cause local reimplementation.
> Use SendMessage to challenge other auditors: "This import looks unused but it's a side-effect import — don't remove."
>
> Use TaskCreate to create tasks in the shared list with file:line.

**Lead instruction:** Wait for all 4 to finish debating. When SendMessage traffic stops
and tasks are created (check via TaskList), evaluate Gate 0.
