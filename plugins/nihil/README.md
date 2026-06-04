# Nihil

Evidence-gated maintainability review and refactor workflow for Claude Code, with
strict **mode separation**, confidence scoring, scope control, and release-gate
discipline.

> Nihil does not guarantee correct architectural decisions. It enforces evidence,
> confidence, scope, and mode discipline so human review becomes faster and less
> ambiguous.

## What Nihil is

Three namespaced workflows plus hooks that **enforce** how you work in each:

| Command            | Mode           | Does                                                                |
| ------------------ | -------------- | ------------------------------------------------------------------ |
| `/nihil:review`    | Review         | Read / search / compare / trace and report findings only.          |
| `/nihil:implement` | Implementation | Apply evidence-backed findings inside scope; no release steps.     |
| `/nihil:release`   | Release        | Gate a release on green CI and version/tag/publish discipline.     |

Five read-only sub-agents back the review: `evidence-auditor`, `duplication-hunter`,
`abstraction-critic`, `boundary-reviewer`, `release-gatekeeper`.

## What Nihil is not

It is **not** an MCP server, an LSP server, a background monitor, or a release
automator. It does not publish anything, add telemetry, or pull in external services.
It does not think for you — it makes the *discipline* repeatable: every finding must
carry evidence and confidence, every mode forbids the actions that don't belong in it.

## Install / local testing

This plugin lives in the `ancplua-claude-plugins` marketplace at `plugins/nihil/`
(the spec's literal `./nihil` is adapted to the repo's `plugins/<name>/` convention —
see *Deviations*). Load it directly:

```bash
claude --plugin-dir ./plugins/nihil
```

Then in the Claude Code session:

```text
/nihil:review
/nihil:implement
/nihil:release
```

Inspect the loaded inventory and validate:

```bash
claude plugin details nihil
claude plugin validate ./plugins/nihil --strict
```

Requires `python3` on `PATH` (the hooks invoke `python3`).

## Mode behavior

A `UserPromptExpansion` hook (`scripts/nihil-mode.py`) detects a `/nihil:*` command,
pins the mode for the session in `$CLAUDE_PLUGIN_DATA` (temp-dir fallback when unset),
and injects a mode banner. Only `nihil`-namespaced commands set a mode — `/nihil:review`
does **not** collide with other plugins' `review` commands. The mode is **sticky**:
it stays in force until another `/nihil:*` command changes it.

## Hook behavior — exact coverage

Two hooks **enforce** the mode; they are the real guardrails, independent of whether
the banner reached the model.

### `PreToolUse` (`scripts/nihil-pretooluse.py`)

Matched on `Write|Edit|MultiEdit|NotebookEdit|Bash` only (read/search tools are never
slowed). Denies via `permissionDecision: "deny"`.

| Operation                              | Review | Implement | Release        |
| -------------------------------------- | :----: | :-------: | :------------: |
| `Write` / `Edit` / `MultiEdit` / `NotebookEdit` | blocked | allowed | allowed |
| `git commit`                           | blocked | allowed   | allowed        |
| `git push`                             | blocked | blocked   | allowed        |
| `git tag` (create/delete; listing OK)  | blocked | blocked   | allowed        |
| version bump (`npm/pnpm/yarn version`, `hatch/poetry version`, `bump2version`) | blocked | blocked | allowed |
| publish (`npm publish`, `dotnet nuget push`, `nuget push`, `gh release create`, `twine upload`, `cargo publish`) | blocked | blocked | allowed |
| dependency update (`npm/pnpm/yarn install/add/update`, `pip install`, `dotnet add package`, `cargo add/update`) | blocked | allowed | allowed |
| destructive (`rm -rf`, `git reset --hard`, `git push --force`, `git clean -f`, `mkfs`, `dd if=`) | blocked | blocked | **blocked** |

Read-only Bash (`git status`, `git log`, `git diff`, `ls`, `dotnet build/test`, etc.)
is allowed in every mode.

### `Stop` (`scripts/nihil-stop.py`)

Checks the last assistant message and **blocks once per mode cycle**:

- **Review** — if findings are present (`## Findings` or `Severity:`) but missing
  `Confidence:` or `Evidence:`, it blocks and asks for the required finding format.
- **Implement** — if there is no `Verification` section, it blocks.
- **Release** — if there is no Release Readiness / Blockers / Publishing Decision
  section, it blocks.

Loop-safe: it honors `stop_hook_active` and keeps a one-shot per-session flag, so it
blocks at most once; `nihil-mode.py` re-arms it when a new `/nihil:*` command runs.

### What Review Mode blocks

File writes/edits, `git commit`/`push`/`tag` (creation/deletion), version bumps,
dependency updates, package publishing, and destructive shell. It allows reading,
searching, tracing, building/testing for evidence, and dispatching the read-only agents.

### What Implementation Mode blocks

`git push`, `git tag`, package publishing, version bumps, and destructive shell.
Writes, edits, and `git commit` are allowed.

### What Release Mode requires

Inspect the repo's actual release workflow; verify required checks; publish only on
**green** CI; never on red or **unknown**. For NuGet, use
[trusted publishing](https://learn.microsoft.com/en-gb/nuget/nuget-org/trusted-publishing).
The hook still blocks obviously destructive commands (force-push, hard reset, `rm -rf`).

## Deviations from the build spec

The spec said to follow current docs where they differ and record it here.

1. **Location** — created at `plugins/nihil/` (this repo's marketplace convention),
   not the spec's literal `./nihil`. Local load path adjusts to
   `claude --plugin-dir ./plugins/nihil`.
2. **Extra helper file** — there are four scripts, not three:
   `scripts/_nihil_state.py` holds the shared, security-sensitive session-id→path
   logic. Duplicating it across the three hook entrypoints would have violated Nihil's
   own anti-duplication doctrine and risked the sanitization diverging. The hooks
   import it and fail open if it is missing.
3. **Stop loop guard** — the spec named `stop_hook_active`; current docs do not
   guarantee that field, so the guard *also* uses a one-shot per-session flag. Both
   mechanisms are applied.
4. Everything else in the spec verified as current: `UserPromptExpansion` and
   `$CLAUDE_PLUGIN_DATA` are real (the condensed plugin-dev skill omitted them; the
   live plugin/hook reference confirms them), `disallowedTools` is a supported agent
   field, and `displayName` is in the official manifest schema.

## Known limitations

- **Bash matching is a heuristic on the command string, not a sandbox.** It covers the
  operations in the table above. Unusual tooling, shell aliases, env-var indirection,
  or deliberate obfuscation can evade it. It is a discipline aid, not a security
  boundary.
- **Only `Write|Edit|MultiEdit|NotebookEdit|Bash` are guarded.** A custom MCP tool that
  writes files or performs a release is **not** intercepted. The hook does not pretend
  to block every possible tool.
- **File-edit version bumps are not caught in Implement mode.** Editing a `<Version>`
  in a `.csproj` is an allowed `Edit` there; only command-based bumps are blocked.
  (In Review mode all edits are blocked, so it is moot there.)
- **Mode is sticky per session.** An unrelated command in the same session still runs
  under the last Nihil mode's guard until you switch with another `/nihil:*` command
  or start a new session.
- **Hooks load at session start.** Editing hooks or scripts requires restarting Claude
  Code (`claude --debug` to watch them).
- **Fail-open by design.** If `python3` or `_nihil_state.py` is unavailable, the hooks
  no-op (no enforcement) rather than trapping the session.
- **The Stop hook inspects only the last assistant message** via substring checks for
  the required sections.
- **Banner injection is best-effort.** Enforcement does not depend on the
  `additionalContext` banner reaching the model; the PreToolUse/Stop hooks read the
  persisted mode directly.

## Validation

```bash
claude plugin validate ./plugins/nihil --strict
```

The hook scripts have a standalone behavior test (synthetic stdin shaped like the
documented hook payloads); run any script with a JSON payload on stdin to exercise it,
e.g.:

```bash
echo '{"session_id":"x","command_name":"nihil:review"}' | python3 scripts/nihil-mode.py
```

## Example review output

```markdown
# Nihil Review

## Verdict

Needs changes

## Scope Checked

`src/auth/` (the staged diff) and its callers in `src/api/handlers.ts`.

## Findings

### 1. Two divergent token validators model the same concept

- **Severity:** High
- **Confidence:** 90%
- **Evidence:** `src/auth/verify.ts:14` and `src/api/handlers.ts:88` both decode and
  check the JWT `exp`, but `handlers.ts` omits the `nbf` check present in `verify.ts`.
- **Problem:** Duplicated intent (token validation) with drift; a fix to one is lost
  on the other.
- **Impact:** A not-yet-valid token is accepted on the `handlers.ts` path.
- **Recommendation:** Call `verify.ts`'s `validateToken` from the handler; delete the
  inline copy.
- **Do not change:** `src/auth/refresh.ts` — looked similar but validates a different
  (refresh) token shape; checked and distinct.

## Non-Findings

- `src/auth/verify.ts:30` wraps the decode in a try/catch that looks redundant —
  not flagged: the input is an untrusted header (a real boundary), so the guard is
  warranted. Evidence that would change this: proof the value is validated upstream.
```
