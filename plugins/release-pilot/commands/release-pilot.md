---
description: Drive a .NET release for an ANcpLua framework repo — autodetect Pattern A (push-to-main) vs Pattern B (tag-triggered), watch CI, classify failures, hard-stop on non-trivial.
effort: medium
argument-hint: "[--version X.Y.Z]"
---

# /release-pilot

Drives a release of one of Alexander's .NET framework repos
(`ANcpLua.NET.Sdk`, `ANcpLua.Analyzers`, `ANcpLua.Roslyn.Utilities`,
`ANcpLua.Agents`). Detects the release pattern from
`.github/workflows/nuget-publish.yml` and dispatches accordingly.

## Patterns

| Pattern              | Repos                                                              | Release action                                                       |
|----------------------|--------------------------------------------------------------------|----------------------------------------------------------------------|
| **A — push-to-main** | `ANcpLua.NET.Sdk`                                                  | `git push origin main`. Workflow auto-bumps from `git describe`.     |
| **B — tag-triggered**| `ANcpLua.Analyzers`, `ANcpLua.Roslyn.Utilities`, `ANcpLua.Agents`  | `git tag vX.Y.Z && git push origin vX.Y.Z`. No file edits, never retag. |

**Never edit a `<Version>` line in any file.** All four repos compute the
version from git tags or NuGet at CI time.

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
    PKGS="ANcpLua.Agents" ;;
  *)
    echo "ERROR: $REPO is not in the release-pilot map. Add it to commands/release-pilot.md before continuing." >&2
    exit 1 ;;
esac
echo "Packages: $PKGS"
```

Then run the asymmetry pre-flight (informational on Pattern A, gating on
Pattern B). Capture stdout (the next version) and exit code:

```bash
# shellcheck disable=SC2086
NEXT=$("$ROOT/bin/next-version.sh" $PKGS); RC=$?
echo "Next version: $NEXT (exit $RC)"
```

- `RC == 0` — proceed.
- `RC == 2` — out-of-band publish (nuget ahead of tag). **Stop and surface
  to the human.** Do not auto-bump past it.
- `RC == 1` — bad input or no version data. Stop and ask.

## Step 2A — Pattern A flow (push-to-main)

For `ANcpLua.NET.Sdk` only.

Inform the human that pushing to main will auto-publish via the workflow's
`compute_version` job. Note: if the diff between the previous tag and HEAD
doesn't touch `*.nuspec`, `src/**`, or `tests/**`, the deploy step skips
silently — the workflow may go green with no new package on NuGet.

```bash
RUN_ID=$("$ROOT/bin/release-auto-bump.sh")
echo "Watching run $RUN_ID..."
gh run watch "$RUN_ID" --exit-status
```

On green, proceed to Step 3. On red (`gh run watch` exits non-zero),
proceed to Step 4.

## Step 2B — Pattern B flow (tag-triggered)

For `ANcpLua.Analyzers`, `ANcpLua.Roslyn.Utilities`, `ANcpLua.Agents`.

**Surface the proposed version `$NEXT` to the human and confirm before
pushing the tag.** A tag push is externally visible and creates a GitHub
release on success. Once confirmed:

```bash
RUN_ID=$("$ROOT/bin/release-tag-triggered.sh" "$NEXT")
echo "Watching run $RUN_ID..."
gh run watch "$RUN_ID" --exit-status
```

If the run pauses on the publish step for `Roslyn.Utilities` or `Agents`,
that's the `nuget` environment manual-approval gate — open the run URL
and approve in the GitHub UI. It is not a CI hang.

## Step 3 — On green

```bash
echo "Run URL: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/$RUN_ID"
TAG="v$NEXT"
if gh release view "$TAG" >/dev/null 2>&1; then
  gh release view "$TAG" --json url,tagName,publishedAt
fi
```

For Pattern A, the actual published version may differ from `$NEXT` if
`compute_version` saw a fresher tag. Read it from the release list:

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

Run the format fix, recommit, re-trigger. **Cap: one auto-fix iteration.**
If CI is still red after this, treat as `hard`.

```bash
dotnet format whitespace
git add -A
git commit -m "style: dotnet format whitespace (auto-fix from /release-pilot)"
```

Then re-enter Step 2A or 2B (same pattern). For Pattern B, **do not bump
the version** — the existing tag is on the build-broken commit; delete it
locally and remotely first, then retag the new commit:

```bash
git tag -d "v$NEXT"
git push origin --delete "v$NEXT"
```

(This is the only situation where deleting a tag is correct: the format
fix is on a *new* commit, so the tag must move forward to that commit. The
ghost-tag rule prevents *retagging the same broken commit*; moving the tag
to a fixed commit is not a ghost-tag operation.)

### `flake`

Rerun the failed jobs once. If still red, treat as `hard`.

```bash
gh run rerun "$RUN_ID" --failed
gh run watch "$RUN_ID" --exit-status
```

### `hard`

**Stop.** Print the verdict message, the run URL, and the last 50 lines of
the failed-step log. Do not auto-fix. Surface to the human.

```bash
echo "STOP: $MSG"
echo "Run URL: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/$RUN_ID"
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
- **Never retags an existing tag at the same commit.** Ghost tags on
  build-broken commits stay on the remote — bump to next patch.
- **Never auto-fixes** outside `dotnet format whitespace`. No
  auto-add-using, no auto-null-guard — those usually indicate real issues
  per the global "fix at source" rule.
