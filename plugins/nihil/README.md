# Nihil

Evidence-gated maintainability review and refactor workflow for Claude Code, with
strict **mode separation**, confidence scoring, scope control, and release-gate
discipline.

> Nihil does not guarantee correct architectural decisions. It enforces evidence,
> confidence, scope, and mode discipline so human review becomes faster and less
> ambiguous.

Nihil ships in **two layers**:

1. **The plugin** (native — everything below the pantheon section). Hook-enforced
   modes: **`/nihil:raze`** (root-authority, write-capable — the one-line default for a
   repo you own) plus the disciplined `/nihil:review` → `/nihil:implement` →
   `/nihil:release` path for code you do not own. A discipline aid, not a security
   boundary — but a secret / API-key brake is active in every mode.
2. **The pantheon** (summonable — see
   [The pantheon](#the-pantheon--summonable-dynamic-workflows)). Five first-principles
   **dynamic workflows** (`/nihil`, `/nihil-maat`, `/nihil-odin`, `/nihil-shiva`,
   `/nihil-athena`). A Claude Code plugin cannot register dynamic workflows, so these
   ride along as payload and install with `/nihil:summon`.

## What Nihil is

Four namespaced mode commands plus hooks that **enforce** how you work in each:

| Command            | Mode           | Does                                                                |
| ------------------ | -------------- | ------------------------------------------------------------------ |
| `/nihil:raze`      | Raze           | **The one-line default for a repo you own.** Write-capable, root authority — rewrite, break the public API, and delete freely; only secret-leak and catastrophic, unrecoverable commands are blocked. |
| `/nihil:review`    | Review         | Read / search / compare / trace and report findings only.          |
| `/nihil:implement` | Implementation | Apply evidence-backed findings inside scope; no release steps.     |
| `/nihil:release`   | Release        | Gate a release on green CI and version/tag/publish discipline.     |

`/nihil:raze` is for code you own (your framework, CI-bot consumers) — it removes the
permission friction the other three impose. The disciplined `review` → `implement` →
`release` path is for code you do not own. Five read-only sub-agents back the review:
`evidence-auditor`, `duplication-hunter`, `abstraction-critic`, `boundary-reviewer`,
`release-gatekeeper`.

## What Nihil is not

It is **not** an MCP server, an LSP server, a background monitor, or a release
automator. It does not publish anything, add telemetry, or pull in external services.
It does not think for you — it makes the *discipline* repeatable: every finding must
carry evidence and confidence, every mode forbids the actions that don't belong in it.

## The pantheon — summonable dynamic workflows

The second layer is the *original* Nihil: first-principles repository transformation
delivered as five **dynamic workflows**. A Claude Code plugin cannot register dynamic
workflows (the manifest has no `workflows/` component), so they ship here under
`workflows/` as payload and install with one command:

```text
/nihil:summon          # copies workflows/*.js + jsconfig.json into ./.claude/workflows/
```

After summoning (and a session restart if needed) the gods run as `/<name>` commands:

| Command         | God                  | Pattern                                    | Writes?                                |
| --------------- | -------------------- | ------------------------------------------ | -------------------------------------- |
| `/nihil`        | Zeus orchestrates    | inspect → council → verdict + plan         | never (plan-only)                      |
| `/nihil-maat`   | Ma'at reviews        | dimensions → adversarial refute → judge    | never                                  |
| `/nihil-odin`   | Odin researches      | angles → gather → cross-check → cite        | never                                  |
| `/nihil-shiva`  | Shiva deletes        | loop-until-dry → usage census → gated execute | gated (`execute=true`, private only) |
| `/nihil-athena` | Athena restructures  | N drafts → score → synthesize              | never                                  |

The four specialists are namespaced `nihil-*` (not bare `/maat`, `/odin`, …) so they do
not collide with other workflows in a shared project. Only `/nihil-shiva` writes, and
only with `execute=true`, applying just the *private* deletions and parameter
narrowings that survived the usage census (call-site counts, parameter audit,
dependency-supersession check, cohesion); upstream replacements, relocations, public
breaks, and rewrites always require human sign-off. The master `/nihil`
plans and delegates execution to `/nihil-shiva` — the orchestrator never writes, which
also avoids a write-while-reading race in its parallel council.

The doctrine behind the pantheon lives in `skills/nihil/SKILL.md`; the review standard
`/nihil-maat` enforces lives in
`skills/absence-of-value-and-meaning-code-quality-review/SKILL.md`. To install the
workflows for every project instead of one, copy them into `~/.claude/workflows/`.

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

**Raze** allows every operation above except catastrophic, unrecoverable shell
(`rm -rf /` or `~`, `mkfs`, `dd of=/dev/…`); `git reset --hard`, force-push, and
`git clean -f` are recoverable and therefore allowed. In addition, a **secret / API-key
brake** is active in **every** mode (raze included): printing, echoing, committing, or
passing a credential inline — `echo $TOKEN`, `cat .env`, `git add .env`,
`--api-key <literal>`, or a key literal like `AKIA…` / `ghp_…` /
`-----BEGIN … PRIVATE KEY-----` — is denied.

### `Stop` (`scripts/nihil-stop.py`)

Checks the last assistant message and **blocks once per mode cycle**:

- **Review** — if findings are present (`## Findings` or `Severity:`) but missing
  `Confidence:` or `Evidence:`, it blocks and asks for the required finding format.
- **Implement** — if there is no `Verification` section, it blocks.
- **Release** — if there is no Release Readiness / Blockers / Publishing Decision
  section, it blocks.
- **Raze** — if there is no `Verification` section, it blocks. The one discipline raze
  keeps: a write-capable transformation must report what it ran and what it changed.

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

### What Raze Mode frees

Everything the other modes gate: writes, edits, `git commit`/`push`/`tag`, version
bumps, dependency updates, publishing, public-API breaks, full rewrites, subsystem
replacement, and deletion — with no per-action sign-off. It is the inverse of Review:
free by default, with two brakes only — the secret / API-key brake (active in every
mode) and the catastrophic-command brake (`rm -rf /` or `~`, `mkfs`, `dd of=/dev/…`).
`git reset --hard`, force-push, and `git clean -f` are allowed because they are
recoverable. Use it on a repository you own, where compatibility ceremony is theater.

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
   live plugin/hook reference confirms them) and `disallowedTools` is a supported
   agent field. (`displayName` was dropped from the manifest in the antipattern
   pass — it is not part of the documented manifest field set.)

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
