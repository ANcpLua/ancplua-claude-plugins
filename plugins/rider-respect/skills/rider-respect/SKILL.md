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

## Preconditions — only Rider's MCP is a hard stop

The only hard precondition is **Rider's MCP**. Everything else has a deterministic fallback, because the skill's safety invariants (no commit, no suppression) already prevent damage — pausing for confirmation when we could just switch modes is friction, not safety.

| Check | Pass → | Fail → |
|---|---|---|
| `mcp__rider__get_file_problems` loadable via `ToolSearch select:mcp__rider__get_file_problems` | proceed | **STOP** — tell the user to open Rider on the solution. The daemon is the entire signal source; no fallback exists. |
| `git rev-parse --git-dir` succeeds | continue to next git check | switch to **patch mode** — do not pause |
| `git rev-parse --verify HEAD` succeeds | **git mode** (branch) | switch to **patch mode** — do not pause |
| cwd-root equals Rider-root (see Workflow Step 1) | proceed silently | **ASK** which root is the target — the one legitimate question |

**Modes:**

- **Git mode** — branch off, apply fixes in place on the branch, `git diff` shows the dry-run. The original workflow.
- **Patch mode** — snapshot each in-scope file to `.rider-respect/<ts>/`, apply fixes in place in the working tree, emit `rider-respect-<ts>.patch` via `git diff --no-index` (works without a repo as long as the `git` binary is installed). The hard invariants still hold; the deliverable shape just changes from "branch to inspect" to "patch + dirty files to inspect."

## Workflow

### 1. Resolve the target root — only ask if cwd and Rider disagree

Compare two roots:
- `git rev-parse --show-toplevel` (cwd's repo root; empty / non-zero exit if not in a repo)
- `mcp__rider__get_repositories` (the root of the solution Rider has open)

**If they match, or only one is non-empty:** silently use it. Move on.

**If they disagree:** this is the one place this skill uses `AskUserQuestion`. Don't guess — the wrong choice means the dry-run runs against the wrong codebase.

```text
AskUserQuestion:
  question: "Your terminal is in <cwd-root>, but Rider has <rider-root> open. Which is the target?"
  options:
    - "<cwd-root> (terminal cwd) — chdir there"
    - "<rider-root> (Rider solution) — chdir there"
```

Set the working directory to the chosen root before any other step.

### 2. Resolve scope — before touching git state

Scope must be captured before any branch / stash / snapshot, otherwise the default no-arg case (which reads dirty working-tree files) silently turns into an empty set.

| User input | Scope (git mode) | Scope (patch mode) |
|---|---|---|
| (none) | `git diff --name-only HEAD`, restricted to `*.cs` / `*.vb`. If clean, stop — there is nothing to dry-run. | All `*.cs` / `*.vb` under the target root via `mcp__rider__find_files_by_glob`. Same scope rules; no git diff available. |
| Path | The path, expanded via `find`. | Same. |
| Glob | `mcp__rider__find_files_by_glob`. | Same. |

If scope is empty: stop, do not invent files.

### 3. Set up the dry-run target

**Git mode — branch off:**

```bash
TS=$(date +%Y%m%d-%H%M%S)
BASE=$(git rev-parse --abbrev-ref HEAD)
git checkout -b "rider-respect/${BASE}/${TS}"
```

Stash policy (git mode only):

- **No-arg (default) case:** do **not** stash. The dirty edits *are* the scope; they ride onto the dry-run branch and get inspected. Stashing first would erase the very files the user is asking us to look at.
- **Explicit path / glob case:** if the working tree is dirty, `git stash push -u -m "rider-respect-pre"` and report the stash ref. This isolates the dry-run diff to *only* the explicit scope.

State the branch name back to the user immediately so they can `git checkout -` to bail at any point.

**Patch mode — snapshot before mutation:**

```bash
TS=$(date +%Y%m%d-%H%M%S)
SNAP=".rider-respect/${TS}"
PATCH="rider-respect-${TS}.patch"
mkdir -p "$SNAP"
# snapshot every in-scope file; flatten the path so the snapshot dir stays flat
for f in <scope>; do
  cp "$f" "$SNAP/$(printf '%s' "$f" | tr '/' '_')"
done
```

State the patch filename and snapshot dir back to the user so they can `rm -r $SNAP $PATCH` to bail at any point. The snapshots are the patch-mode equivalent of git history; we'll diff against them in Step 7.

### 4. Pull diagnostics per file

For each file, call `mcp__rider__get_file_problems(filePath: "<absolute>")`. Parse results into `(severity, ruleId, line, column, message, suggestedFix?)`.

Bucket by severity, honoring the `--severity` argument:

- **Errors** — always fix (CS errors, IDE rules promoted to error in editorconfig, custom analyzer errors).
- **Warnings** — fix unless the rule appears in `<NoWarn>` of the project's csproj or `Directory.Build.props`. Don't override project policy.
- **Suggestions / hints** — fix only when severity threshold is `suggestion` (the default). Skip for `--severity=warning` / `--severity=error`.

### 5. Apply fixes — pick the right MCP tool per diagnostic class

This is the core knowledge of the skill. The wrong tool for a class either misses call sites or breaks the file.

| Diagnostic class | Tool | Why |
|---|---|---|
| Naming (IDE1006, ReSharper InconsistentNaming, `private_fields_rule` violations) | `mcp__rider__rename_refactoring` | Migrates call sites across the whole solution. **Never hand-edit names** — `Edit` only changes one file and leaves callers broken. |
| Formatting / whitespace / using-directive order | `mcp__rider__reformat_file` | Applies the IDE's configured code-style profile. Run once per file *after* content edits, not before. |
| Type lives in wrong namespace (RD0001 / Rider's "namespace doesn't match folder structure") | `mcp__rider__move_type_to_namespace` | Doing this with text edits leaves stale `using` directives elsewhere. |
| Code-style with a daemon-suggested replacement (var/explicit, pattern matching, expression body, `is null` vs `== null`, etc.) | `Edit` with the suggestion's exact span, OR `mcp__rider__replace_text_in_file` | Use the daemon's `suggestedFix` verbatim when present. Don't paraphrase. |
| Suppressible CA rules with canonical fixes (CA1062 null check, CA2007 ConfigureAwait, CA1822 static, etc.) | `Edit` | Apply the canonical fix. **Do NOT** add `#pragma warning disable` / `[SuppressMessage]`. |
| Diagnostics with no automatic fix (e.g. "consider …") | Skip; record in report | Don't guess. The human decides. |

### 6. Verify

```
mcp__rider__build_solution
```

If build fails, **stop** and tell the user: "Rider's daemon disagreed with the build compiler on file X — branch left in failing state for inspection." This is *exactly* what the dry-run is meant to expose; don't try to repair.

### 7. Report — and stop

The skill never commits. Tailor the report to the mode that ran.

**Git mode:**

```text
rider-respect dry run on  rider-respect/<base>/<ts>
base commit:               <sha>
files in scope:            N
diagnostics found:         E errors, W warnings, S suggestions
fixes applied:             A
fixes skipped (no auto):   K
fixes skipped (NoWarn):    P     (rules respected from project policy)
build after fixes:         pass | fail (<count> errors)
stash ref (if any):        stash@{N}     (only when scope was explicit and tree was dirty)

review:    git status -s && git diff
discard:   git restore --staged --worktree . && git clean -fd && git checkout <base> && git branch -D <branch>
adopt:     git add -A && git commit -m "<msg>"   (then merge / PR yourself)
restore:   git stash pop                          (only if a stash ref is listed above)
```

**Patch mode:**

Build the patch by diffing each in-scope file against its snapshot. Prefer `git diff --no-index` (always produces an `apply`-compatible unified diff, even outside a repo). Fall back to `diff -u` only if the `git` binary is unavailable.

```bash
: > "$PATCH"
for f in <scope>; do
  snap="$SNAP/$(printf '%s' "$f" | tr '/' '_')"
  git --no-pager diff --no-index -- "$snap" "$f" >> "$PATCH" || true
done
```

```text
rider-respect dry run via patch file:  rider-respect-<ts>.patch
snapshot dir:                          .rider-respect/<ts>/
target root:                           <cwd-root or rider-root, whichever Step 1 chose>
files in scope:                        N
diagnostics found:                     E errors, W warnings, S suggestions
fixes applied:                         A
fixes skipped (no auto):               K
build after fixes:                     pass | fail (<count> errors)

review:    less rider-respect-<ts>.patch
           # or, per-file:
           diff -u .rider-respect/<ts>/<flattened> <original-path>
discard:   for f in <scope>; do cp ".rider-respect/<ts>/$(printf '%s' "$f" | tr '/' '_')" "$f"; done
           rm -r .rider-respect/<ts> rider-respect-<ts>.patch
adopt:     keep the in-place changes; archive or delete the patch + snapshot dir.
```

**Do not commit. Do not push. Do not open a PR.** In either mode, the dry-run's value is precisely that the human inspects the diff and decides.

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
