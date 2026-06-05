---
name: opensrc-research
description: Fetch and search a dependency's real source before answering, not guessing. Use when checking what a third-party package (npm, PyPI, NuGet, crate, GitHub repo) actually does. Triggers on "how does X work", "verify Y's API", "does Z ship with W", "grep X in <library>", or any shaky dependency claim.
---

# opensrc-research

## Quickstart

One command grounds an answer: resolve the package's real source path, then search it.

```bash
rg "useQuery" "$(opensrc path @tanstack/react-query)"
```

`opensrc path` prints the on-disk checkout (fetching on first use); `rg` greps it for the symbol you're about to make a claim about. Everything below is variations on this shape.

## When to fire

Fire this skill whenever the next answer would otherwise be a guess about how a dependency behaves. Signals:

- "Does library X support Y?" / "How does X actually do Y?"
- "Is the doc claim about X accurate?"
- "Grep for Z in package W"
- Borderline confidence answering an API question — about to write `[unverified]`
- Code under review imports a package and you want to ground a review comment in actual source

## The grounded-answer workflow

1. **Identify the package shape:**

   | Shape | Form | Example |
   |-------|------|---------|
   | npm package | bare name | `opensrc path zod` |
   | PyPI package | `pypi:` prefix | `opensrc path pypi:requests` |
   | Rust crate | `crates:` prefix | `opensrc path crates:serde` |
   | **NuGet package** | **use the wrapper** | `"${CLAUDE_PLUGIN_ROOT}/bin/nuget-opensrc" path Microsoft.Extensions.Logging` |
   | GitHub repo | `owner/repo` (drifts with main) | `opensrc path open-telemetry/opentelemetry-dotnet` |
   | GitHub repo at commit | `owner/repo#<sha>` (pinned) | `opensrc path dotnet/runtime#abc123` |

2. **Fetch and grep:**
   ```bash
   # NuGet (commit-pinned — preferred for .NET work):
   PKG_PATH="$("${CLAUDE_PLUGIN_ROOT}/bin/nuget-opensrc" path Microsoft.AspNetCore.Authentication.JwtBearer)"
   rg "JwtBearerEvents" "$PKG_PATH"

   # npm / PyPI / crates / GitHub:
   rg "parseAsync" "$(opensrc path zod)"
   ```

3. **Cite findings as `file:line` references**, not paraphrases. The whole point is grounding — quote what's actually in the source.

4. **If using bare GitHub form**, the result is the default branch and drifts with `main`. To pin to a specific tag after fetching:
   ```bash
   cd "$(opensrc path open-telemetry/opentelemetry-dotnet)" && git checkout v1.10.0
   ```

## When NOT to fire

- **Stdlib / language built-ins** — faster: `python -c "import inspect; print(inspect.getsource(...))"` or `dotnet decompile`.
- **Closed-source NuGet packages** — no GitHub repository.url metadata, wrapper will error out explicitly.
- **Documented behavior is sufficient** — if the question is "what does the doc say X does" rather than "what does X actually do", docs are faster.
- **You already have the cached path** — `opensrc list` shows what's already on disk; no re-fetch needed.

## Anti-patterns to avoid

- **Guessing then marking `[unverified]`** when opensrc would have given the answer in one command. The marker is for when verification is impossible, not when it's mildly inconvenient.
- **Resolving NuGet packages via plain `opensrc path owner/repo`** without commit-pinning — silently reads `main` and the source you grep may not be what the package shipped. Use the wrapper for NuGet.
- **Falling back to projectUrl** if NuGet metadata lacks repository.url — projectUrl points at marketing pages (e.g. `https://dot.net/`) and lies about source location. The wrapper refuses to use it; you should too.

## Cache hygiene

- `opensrc list` — see what's cached
- `opensrc remove <pkg>` — drop one
- `opensrc clean` — drop everything (regret-only-if-no-network)
- Cache lives at `<OPEN_SRC_CACHE_DIR>/repos/github.com/<owner>/<repo>/<ref>/`
- Microsoft repos (especially `dotnet/dotnet`, the unified VMR) are large (~3-4 GB cloned). Don't pre-warm aggressively.
