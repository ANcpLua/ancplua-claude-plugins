---
description: Apply every IDE hint Rider's daemon reports onto a dry-run branch (no commit, no merge)
effort: medium
---

# /rider-respect

One-shot: pull every diagnostic Rider's analysis daemon currently reports for the
target scope, apply the fixes on an isolated branch, build, and leave the branch
for human review. **Never commits, never merges, never pushes.** Default scope
is "files modified in the working tree"; pass a path/glob to widen or narrow.

## Usage

```text
/rider-respect                       # working-tree changes
/rider-respect path/to/File.cs       # one file
/rider-respect "src/**/*.cs"         # glob
/rider-respect --severity=warning    # skip suggestions/hints
/rider-respect --severity=error      # only errors (e.g. IDE1006 set to error)
```

## Preconditions (verify, fail loudly if missing)

1. `git rev-parse --git-dir` succeeds — must be inside a repo.
2. `mcp__rider__*` tools must be loadable. The Rider MCP server only responds
   when the JetBrains IDE is open on the same solution. If `ToolSearch
   select:mcp__rider__get_file_problems` returns nothing, **stop and tell the
   user** to open Rider on the solution; do not silently fall back to
   `dotnet build` (different signal, different fixes).
3. Working tree should be clean OR the user has explicitly opted in. If dirty,
   `git stash push -u -m "rider-respect-pre"` and report the stash ref so the
   user can restore.

## Workflow

### 1. Branch off

```bash
TS=$(date +%Y%m%d-%H%M%S)
BASE=$(git rev-parse --abbrev-ref HEAD)
git checkout -b "rider-respect/${BASE}/${TS}"
```

State the branch name back to the user immediately so they can `git checkout -`
to bail at any point.

### 2. Resolve scope

- No arg → `git diff --name-only HEAD` (or `git diff --name-only` if HEAD is
  the only commit) restricted to `*.cs`/`*.vb`.
- Path arg → that path, expanded via `find`.
- Glob arg → `mcp__rider__find_files_by_glob`.

If scope is empty: stop and tell the user, do not invent files.

### 3. Pull diagnostics per file

For each file in scope:

```text
ToolSearch select:mcp__rider__get_file_problems
mcp__rider__get_file_problems(filePath: "<absolute>")
```

Parse the result into `(severity, ruleId, line, column, message, suggestedFix?)`
tuples. Bucket by category so the human-readable report stays small:

- **Errors** — always fix. CS errors, IDE1006 set to error, custom analyzer
  errors.
- **Warnings** — fix unless the rule appears in `<NoWarn>` of the project's
  csproj/Directory.Build.props. Don't override project policy.
- **Suggestions / hints** — fix only if `--severity=suggestion` (default) is
  in effect. Skip for `--severity=warning` / `--severity=error`.

### 4. Apply fixes — pick the right MCP tool per rule class

| Diagnostic class | Tool | Notes |
|---|---|---|
| Naming (IDE1006, ReSharper InconsistentNaming) | `mcp__rider__rename_refactoring` | Handles call sites across the solution. **Never hand-edit names** — you'll miss references. |
| Formatting / whitespace / using order | `mcp__rider__reformat_file` | Applies the IDE's configured code-style profile. Run once per file after content edits. |
| Move type to namespace mismatch | `mcp__rider__move_type_to_namespace` | Don't try to do this with text edits. |
| Code-style (var/explicit, pattern match, expression body, etc.) | `Edit` tool with the suggested fix from `get_file_problems`, or `mcp__rider__replace_text_in_file` with exact span | Use the daemon's suggested replacement verbatim when available. |
| Suppressible CA rules (CA1062 null check, CA2007, etc.) | `Edit` | Apply the canonical fix; do NOT add `#pragma warning disable` or `[SuppressMessage]` — that violates the user's global "fix at source" policy. |
| Diagnostics with no automatic fix | Skip; record in report | Don't guess. |

### 5. Verify

After all edits:

```text
mcp__rider__build_solution
```

If build fails, **do not attempt to repair**. Stop, surface the failing
diagnostics, and tell the user: "Rider's daemon disagreed with the build
compiler on file X — branch left in failing state for inspection." This is
exactly the kind of finding the dry-run is meant to expose.

### 6. Report — and stop

Print a single summary block:

```text
rider-respect dry run on  rider-respect/<base>/<ts>
base commit:               <sha>
files in scope:            N
diagnostics found:         E errors, W warnings, S suggestions
fixes applied:             A
fixes skipped (no auto):   K
build after fixes:         pass | fail (<count> errors)

review:    git diff <base>...HEAD
discard:   git checkout - && git branch -D <branch>
keep:      (do nothing — branch is already detached from <base>)
```

**Do not commit. Do not push. Do not open a PR.** The dry-run branch's value
is *exactly* that the human inspects the diff and decides.

## What this command will not do

- Will not `git add` / `git commit` / `git push` / `git merge` under any flag
  combination. Adding such a flag is an explicit followup, not a default.
- Will not edit `.editorconfig` or any other rule-config file. If a rule is
  wrong for the project, that's a separate decision; this command applies
  rules as-currently-configured.
- Will not suppress warnings via `#pragma`, `<NoWarn>`, or `[SuppressMessage]`
  to "fix" a hint. A diagnostic that has no clean fix is reported, not muted.
- Will not run if `mcp__rider__*` tools are unavailable. The whole point is
  to use Rider's daemon analysis; without it, this command has no signal
  source. `dotnet build` produces a strict subset of the same diagnostics
  and is a separate concern.

## Notes for the model executing this command

- Naming-rule fixes through `rename_refactoring` can rewrite files outside
  the original scope (call sites in untouched files). That's expected and
  correct — list those files in the report so the human knows the diff is
  wider than the scope they asked for.
- Some Rider hints encode *opinions* (e.g. "convert lambda to method group",
  "use expression-bodied member"). They're not bugs. Apply them when
  `get_file_problems` reports them — the human reviews on the branch.
- If two diagnostics on the same span conflict (e.g. one wants `var`, another
  wants explicit type), apply the higher-severity one. If equal, apply
  neither and note the conflict.
- Cancellation: respect Ctrl-C. Leave the branch in whatever partial state
  was reached; the human can `git diff` and decide.
