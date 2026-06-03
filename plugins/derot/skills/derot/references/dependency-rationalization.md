# Dependency rationalization (rot dimension 5)

The hardest dimension: a dependency choice is "rot" when a narrower or superseded package is used where a better one exists. Unlike the other four dimensions, this is **not** fully verifiable inside the repo — you need the package graph and ecosystem knowledge. Flag ONLY with concrete evidence; otherwise report as a human decision (`unverified`).

## The three shapes

### 1. Transitive-already-present
A direct reference to package **B** where B is already pulled in transitively by package **A** you also reference, and you don't use B's API beyond what A re-exports.
- **Evidence:** the NuGet dependency graph — `dotnet nuget why <project> <B>`; or B in A's dependency list (nuget.org registration/flat-container, or the `nuget-opensrc` skill to fetch A's real `.nuspec`).
- **Fix:** drop the direct B reference — *unless* you pin a B version A doesn't, or use B APIs A doesn't surface. Then the direct reference is justified; say so.

### 2. Subset / parent-package
Several narrow sub-packages of one family used where a single parent/meta package would cover them.
- **Evidence:** the parent/meta package's dependency list contains the siblings you reference.
- **Trade-off:** a meta package can pull *more* than you need. Recommend the swap only when you already reference enough of the family that the meta is net-smaller or net-clearer — and say which.

### 3. Superseded / successor
Package **X** still used after its official successor **Y** shipped, where Y replaces X (often reusing X's work) — e.g. a vendor ships a successor SDK that supersedes a predecessor while reusing it. This is a strategic vendor decision and is **not** in the dependency graph.
- **Do not hardcode X→Y pairs.** A baked-in succession list goes stale and becomes the exact rot this dimension exists to catch — discover and verify each succession fresh, per run. (This page deliberately names no specific pair.)
- **Evidence:** vendor docs / blogs / release notes stating the succession — **fetch and quote them per run**. A succession claim with no cited source is `unverified`; report it, never apply it.

## How to verify (don't guess)

- **Graph facts** (shapes 1–2): `dotnet nuget why`; the package's dependencies on nuget.org; or the `nuget-opensrc` skill for the real `.nuspec`/source.
- **Succession facts** (shape 3): the `microsoft-docs` skill for Microsoft stacks, otherwise `WebSearch`/`WebFetch` of the official docs/release notes. Quote the URL.

## Output

Per finding: `package`, `shape` (transitive / subset / superseded), `evidence` (graph path or cited doc URL), `recommendation`, `confidence`. Dependency changes alter the build — mark them **flagged, not changed**. derot proposes; the human disposes.
