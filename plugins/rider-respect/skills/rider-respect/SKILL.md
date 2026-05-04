---
name: rider-respect
description: Use when the user asks to apply Rider/JetBrains IDE hints, accept the daemon's inspection suggestions on a branch, run a dry-run of editor inspections, "fix all warnings on a test branch", or any phrasing that maps to "let me see what Rider would do." Pulls every diagnostic via `mcp__rider__get_file_problems`, applies fixes through the right MCP tool per class, builds, leaves the branch unmerged for human review. Never commits, pushes, suppresses.
---

# rider-respect

Apply every diagnostic Rider's analysis daemon currently reports onto an
isolated branch, then stop. The human reviews the diff and decides.

## When this skill is the answer

- "Show me what Rider would do if I accepted every hint here."
- "Fix all warnings/suggestions on a throwaway branch."
- "Run a dry-run of the IDE inspections."
- "Apply IDE1006 / formatting / naming refactors and let me see the diff."

## When this skill is NOT the answer

- The user wants a real commit / merge / PR — refuse and ask. This skill never commits.
- Rider isn't open on the solution — refuse, do not fall back to `dotnet build`. Build diagnostics are a strict subset of Rider's daemon and the user explicitly asked for IDE hints.
- The user wants to suppress a diagnostic — refuse. Suppression (`#pragma warning disable`, `<NoWarn>`, `[SuppressMessage]`) is out of scope; this skill applies fixes or skips.

## Preconditions — fail loudly if missing

1. `git rev-parse --git-dir` must succeed (inside a repo).
2. The `mcp__rider__*` tools must be loadable. Verify with:
   ```
   ToolSearch select:mcp__rider__get_file_problems
   ```
   If it returns nothing, stop and tell the user to open Rider on the solution.
3. If the working tree is dirty, `git stash push -u -m "rider-respect-pre"` and report the stash ref so the user can restore.

## Workflow

### 1. Branch off

```bash
TS=$(date +%Y%m%d-%H%M%S)
BASE=$(git rev-parse --abbrev-ref HEAD)
git checkout -b "rider-respect/${BASE}/${TS}"
```

State the branch name back to the user immediately so they can `git checkout -` to bail at any point.

### 2. Resolve scope

| User input | Scope |
|---|---|
| (none) | `git diff --name-only HEAD`, restricted to `*.cs` / `*.vb`. If HEAD is the only commit, use `git diff --name-only`. |
| Path | The path, expanded via `find`. |
| Glob | `mcp__rider__find_files_by_glob`. |

If scope is empty: stop, do not invent files.

### 3. Pull diagnostics per file

For each file, call `mcp__rider__get_file_problems(filePath: "<absolute>")`. Parse results into `(severity, ruleId, line, column, message, suggestedFix?)`.

Bucket by severity, honoring the `--severity` argument:

- **Errors** — always fix (CS errors, IDE rules promoted to error in editorconfig, custom analyzer errors).
- **Warnings** — fix unless the rule appears in `<NoWarn>` of the project's csproj or `Directory.Build.props`. Don't override project policy.
- **Suggestions / hints** — fix only when severity threshold is `suggestion` (the default). Skip for `--severity=warning` / `--severity=error`.

### 4. Apply fixes — pick the right MCP tool per diagnostic class

This is the core knowledge of the skill. The wrong tool for a class either misses call sites or breaks the file.

| Diagnostic class | Tool | Why |
|---|---|---|
| Naming (IDE1006, ReSharper InconsistentNaming, `private_fields_rule` violations) | `mcp__rider__rename_refactoring` | Migrates call sites across the whole solution. **Never hand-edit names** — `Edit` only changes one file and leaves callers broken. |
| Formatting / whitespace / using-directive order | `mcp__rider__reformat_file` | Applies the IDE's configured code-style profile. Run once per file *after* content edits, not before. |
| Type lives in wrong namespace (RD0001 / Rider's "namespace doesn't match folder structure") | `mcp__rider__move_type_to_namespace` | Doing this with text edits leaves stale `using` directives elsewhere. |
| Code-style with a daemon-suggested replacement (var/explicit, pattern matching, expression body, `is null` vs `== null`, etc.) | `Edit` with the suggestion's exact span, OR `mcp__rider__replace_text_in_file` | Use the daemon's `suggestedFix` verbatim when present. Don't paraphrase. |
| Suppressible CA rules with canonical fixes (CA1062 null check, CA2007 ConfigureAwait, CA1822 static, etc.) | `Edit` | Apply the canonical fix. **Do NOT** add `#pragma warning disable` / `[SuppressMessage]`. |
| Diagnostics with no automatic fix (e.g. "consider …") | Skip; record in report | Don't guess. The human decides. |

### 5. Verify

```
mcp__rider__build_solution
```

If build fails, **stop** and tell the user: "Rider's daemon disagreed with the build compiler on file X — branch left in failing state for inspection." This is *exactly* what the dry-run is meant to expose; don't try to repair.

### 6. Report — and stop

```text
rider-respect dry run on  rider-respect/<base>/<ts>
base commit:               <sha>
files in scope:            N
diagnostics found:         E errors, W warnings, S suggestions
fixes applied:             A
fixes skipped (no auto):   K
fixes skipped (NoWarn):    P     (rules respected from project policy)
build after fixes:         pass | fail (<count> errors)

review:    git diff <base>...HEAD
discard:   git checkout - && git branch -D <branch>
keep:      (do nothing — branch is already detached from <base>)
```

**Do not commit. Do not push. Do not open a PR.** The dry-run branch's value is precisely that the human inspects the diff and decides.

## Hard invariants

- Never `git add` / `git commit` / `git push` / `git merge` under any flag combination. There is no `--apply` or `--commit` flag — adding one is an explicit followup PR, not a default.
- Never edit `.editorconfig` or any other rule-config file. If a rule is wrong for the project, that's a separate decision.
- Never suppress via `#pragma`, `<NoWarn>`, or `[SuppressMessage]` to "fix" a hint. A diagnostic with no clean fix is reported, not muted.
- Never run if `mcp__rider__*` tools are unavailable. The whole point is the daemon's signal; without it, this skill has no source.

## Notes on rule conflicts

- Rename refactors will rewrite files outside the original scope (call sites in untouched files). That's expected. List those files in the report so the human knows the diff is wider than what they asked for.
- Some Rider hints are *opinions* (e.g. "convert lambda to method group", "use expression-bodied member"). They are not bugs. Apply them when `get_file_problems` reports them — the human reviews on the branch.
- If two diagnostics on the same span conflict (e.g. one wants `var`, another wants explicit type), apply the higher-severity one. If equal, apply neither and note the conflict in the report.
- Cancellation: respect Ctrl-C. Leave the branch in whatever partial state was reached; the human can `git diff` and decide.
