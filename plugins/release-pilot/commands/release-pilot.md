---
description: Drive a .NET release for an ANcpLua framework repo — autodetect Pattern A (push-to-main) / B (tag + manual approval) / C (tag-direct), watch CI, classify failures, hard-stop on non-trivial.
effort: medium
argument-hint: ""
---

# /release-pilot

Drives a release of one of Alexander's .NET framework repos
(`ANcpLua.NET.Sdk`, `ANcpLua.Analyzers`, `ANcpLua.Roslyn.Utilities`,
`ANcpLua.Agents`). Detects the release pattern from
`.github/workflows/nuget-publish.yml` and dispatches accordingly.

## Patterns

| Pattern              | Repos                                       | Trigger      | Manual gate        | Release action                                 |
|----------------------|---------------------------------------------|--------------|--------------------|------------------------------------------------|
| **A — auto-bump**    | `ANcpLua.NET.Sdk`                           | push to main | none               | `git push origin main` (CI bumps + tags)       |
| **B — tag-with-gate**| `ANcpLua.Roslyn.Utilities`, `ANcpLua.Agents`| tag `v*`     | `nuget` env approve| `git tag vX.Y.Z && git push origin vX.Y.Z`     |
| **C — tag-direct**   | `ANcpLua.Analyzers`                         | tag `v*`     | none               | `git tag vX.Y.Z && git push origin vX.Y.Z`     |

**Never edit a `<Version>` line in any file.** All four repos compute the
version from git tags or NuGet at CI time. The `999.9.9` placeholder in
`Sdk.props` and the local `Version.props` `ANcpLuaXxxVersion` self-references
are managed by separate rules — not user-edited per release.

## Step 1 — Pre-flight

Run from inside the framework repo. Detect pattern and identify package IDs:

```bash
ROOT="${CLAUDE_PLUGIN_ROOT}"
REPO=$(basename "$(git rev-parse --show-toplevel)")
PATTERN=$("$ROOT/bin/detect-pattern.sh")
echo "Repo: $REPO"
echo "Pattern: $PATTERN"

case "$REPO" in
  ANcpLua.NET.Sdk)
    PKGS="ANcpLua.NET.Sdk ANcpLua.NET.Sdk.Web ANcpLua.NET.Sdk.Test" ;;
  ANcpLua.Analyzers)
    PKGS="ANcpLua.Analyzers" ;;
  ANcpLua.Roslyn.Utilities)
    PKGS="ANcpLua.Roslyn.Utilities ANcpLua.Roslyn.Utilities.Polyfills ANcpLua.Roslyn.Utilities.Sources ANcpLua.Roslyn.Utilities.Testing.Aot ANcpLua.Roslyn.Utilities.Testing" ;;
  ANcpLua.Agents)
    # Only the stable ID. ANcpLua.Agents.Testing and .Testing.Workflows
    # publish exclusively at `X.Y.Z-preview.1` (workflow hardcodes the
    # suffix because they depend on MAF prereleases — NU5104). The stable
    # regex in nuget-latest.sh filters those out anyway, so listing them
    # here would be a no-op. The stable Agents package is the gating ID.
    PKGS="ANcpLua.Agents" ;;
  *)
    echo "ERROR: $REPO is not in the release-pilot map. Add it to commands/release-pilot.md before continuing." >&2
    exit 1 ;;
esac
echo "Packages: $PKGS"
```

Then run the asymmetry pre-flight (informational on Pattern A; gating on
Patterns B and C). Capture stdout (the next version) and exit code:

```bash
# shellcheck disable=SC2086
NEXT=$("$ROOT/bin/next-version.sh" $PKGS); RC=$?
echo "Next version: $NEXT (exit $RC)"
```

- `RC == 0` — proceed.
- `RC == 2` — out-of-band publish (nuget ahead of tag). **Stop and surface
  to the human.** Do not auto-bump past it.
- `RC == 1` — bad input or no version data. Stop and ask.

## Step 2A — Pattern A flow (auto-bump on main push)

For `ANcpLua.NET.Sdk` only.

The deploy job is gated by `if: github.ref == 'refs/heads/main'` with **no
manual approval**. Pushing to main auto-publishes. Note: the `Must Publish
Packages` step compares the diff between previous tag and HEAD against
`*.nuspec`, `src/**`, `tests/**` — if the push only touches docs/workflows,
the deploy step skips silently and CI goes green with no new package on
NuGet.

```bash
RUN_ID=$("$ROOT/bin/release-auto-bump.sh")
echo "Watching run $RUN_ID..."
gh run watch "$RUN_ID" --exit-status
```

On green → Step 3. On red → Step 4.

## Step 2B — Pattern B flow (tag-triggered with manual approval)

For `ANcpLua.Roslyn.Utilities` and `ANcpLua.Agents`.

Pushes to main run CI but do NOT publish (`is_release=false` for non-tag
events). To release, tag and push. **The publish job pauses on the `nuget`
environment gate — a human must click Approve in the GitHub UI.**

**Surface the proposed version `$NEXT` to the human and confirm before
pushing the tag.** Tag pushes are externally visible and create a GitHub
release on success. Once confirmed:

```bash
RUN_ID=$("$ROOT/bin/release-tag-triggered.sh" "$NEXT")
echo "Watching run $RUN_ID with approval-aware poller..."
"$ROOT/bin/wait-for-approval.sh" "$RUN_ID"
```

`wait-for-approval.sh` polls every 15s. When the publish job hits the
environment gate, it prints the approval URL **once** and keeps polling, so
the orchestrator resumes automatically once the human clicks Approve.
Timeout default: 30 min (override via `WAIT_TIMEOUT_SEC=…`).

On exit 0 (success) → Step 3. On exit 1 (failure/cancelled) → Step 4. On
exit 2 (timeout) → stop and report; user likely walked away from the
approval, can pick up later with the run URL.

## Step 2C — Pattern C flow (tag-triggered, no gate)

For `ANcpLua.Analyzers`.

Pushes to main run a **separate** `ci.yml` workflow for validation; tag
pushes trigger `nuget-publish.yml` which publishes directly without any
manual approval gate. Same tag-and-push action as Pattern B, but `gh run
watch` is sufficient — no approval-aware poller needed.

```bash
RUN_ID=$("$ROOT/bin/release-tag-triggered.sh" "$NEXT")
echo "Watching run $RUN_ID..."
gh run watch "$RUN_ID" --exit-status
```

On green → Step 3. On red → Step 4.

## Step 3 — On green

```bash
RUN_URL=$(gh run view "$RUN_ID" --json url -q .url)
echo "Run URL: $RUN_URL"
TAG="v$NEXT"
if gh release view "$TAG" >/dev/null 2>&1; then
  gh release view "$TAG" --json url,tagName,publishedAt
fi
```

For Pattern A, the actual published version may differ from `$NEXT` if
`compute_version` saw a fresher tag than `next-version.sh` did. Read the
real version from the release list:

```bash
gh release list --limit 3
```

Done. No further action.

## Step 4 — On red — classify and decide

```bash
VERDICT_LINE=$("$ROOT/bin/classify-failure.sh" "$RUN_ID")
echo "$VERDICT_LINE"
VERDICT="${VERDICT_LINE%%|*}"
MSG="${VERDICT_LINE#*|}"
```

Branch on `$VERDICT`:

### `trivial-format`

Run the format fix, recommit, **bump to a new patch version**, retry.
**Cap: one auto-fix iteration.** If CI is still red after this, treat as `hard`.

```bash
dotnet format whitespace
git add -A
git commit -m "style: dotnet format whitespace (auto-fix from /release-pilot)"
```

Then re-enter the dispatcher:

- **Pattern A**: just push the new commit; `compute_version` will bump
  from the last tag.
  ```bash
  git push origin main
  RUN_ID=$("$ROOT/bin/release-auto-bump.sh" || true)
  ```

- **Patterns B and C**: the existing tag points at the broken commit and
  becomes a ghost tag — **leave it on the remote, do NOT delete or
  reassign it**. Compute a new next-patch version and tag the format-fix
  commit with that. (Per CLAUDE.md "Statt remote zu re-assignen, nächste
  Patch-Version verwenden.")
  ```bash
  # shellcheck disable=SC2086
  NEXT_FIX=$("$ROOT/bin/next-version.sh" $PKGS)
  echo "Format-fix bump: $NEXT → $NEXT_FIX (ghost tag v$NEXT remains)"
  RUN_ID=$("$ROOT/bin/release-tag-triggered.sh" "$NEXT_FIX")
  ```

Then re-watch with the appropriate watcher (`gh run watch` for A/C;
`wait-for-approval.sh` for B). One iteration only — if still red, hard-stop.

### `flake`

Rerun the failed jobs once. If still red, treat as `hard`.

```bash
gh run rerun "$RUN_ID" --failed
# Same watcher as the original step
```

### `hard`

**Stop.** Print the verdict message, the run URL, and the last 50 lines of
the failed-step log. Do not auto-fix. Surface to the human.

```bash
RUN_URL=$(gh run view "$RUN_ID" --json url -q .url)
echo "STOP: $MSG"
echo "Run URL: $RUN_URL"
gh run view "$RUN_ID" --log-failed | tail -50
```

## Cap

**1 auto-fix iteration + 1 flake rerun.** Never loop further. The user's
global CLAUDE.md "fix at source, never suppress" rule means a recurring
red on auto-fix indicates a real issue that needs human eyes.

## What this skill never does

- **Never edits `<Version>`, `<VersionPrefix>`, `<PackageVersion>`, or
  `Version.props` files.** Those are computed by CI from git tags or
  stamped at pack time.
- **Never deletes or reassigns a remote tag.** Ghost tags on build-broken
  commits stay on the remote — bump to next patch.
- **Never auto-fixes outside `dotnet format whitespace`.** No
  auto-add-using, no auto-null-guard — those usually indicate real issues
  per the global "fix at source" rule.
- **Never bypasses the `nuget` environment gate** for Pattern B repos.
  Surfaces the approval URL and waits.
