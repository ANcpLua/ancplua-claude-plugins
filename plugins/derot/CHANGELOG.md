# Changelog

All notable changes to the derot plugin are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-09

derot grows from a read-only truth-drift auditor into the full **dependency lifecycle**:
audit & propose (`/derot`) **and** migrate & apply (`/depmigrate`).

### Added

- **`/depmigrate <package...>`** — write-capable package → new-API migration. Reads the canonical
  upstream source (releases/tags/changelog/API) for each named package, picks the latest *suitable*
  version, diffs the API, scans every usage site, rewrites call sites to the new API, deletes
  obsolete wrappers/shims/dead branches, and runs the repo's build/test/lint. Reuses the cluster
  instead of reimplementing it — `nuget-opensrc:opensrc-research` and `microsoft-learn-grounding`
  for canonical source, `dep-analyst` for supersession, `rot-scout` for usage discovery,
  `code-modernization` for rewrites, `nihil-shiva` for deletion. Renovate / Dependabot do the
  version *number*; `/depmigrate` does the *code*.
- **`refuter` agent** — the adversarial gate that earns `/depmigrate` the right to write. Takes one
  finding and tries to **disprove** it with concrete counterevidence before it is applied. Toulmin
  output: Finding · Evidence · Warrant · Refutation attempt · Counterevidence · Result · Final
  status (`accepted` / `rejected` / `weakened` / `needs-human`). "Could be wrong" is not a
  refutation; consensus is not correctness; empirical validation beats agreement; incomplete
  evidence → `needs-human`; killed-but-plausible findings carry a resurrection note so true
  positives are not lost.

### Changed

- Plugin identity widened from "truth-drift auditor" to "dependency lifecycle." `/derot` remains
  propose-only; `/depmigrate` is the write-capable sibling, made safe by construction via the
  refutation gate plus mandatory build/test/lint before any destructive finding is `accepted`.
- README, manifest description, and keywords updated to cover both commands.

## [0.1.1] - 2026-06-08

Initial release — truth-drift auditor: comment / doc / CI / version / dependency rot with root +
transitive verification, parallel read-only `rot-scout`s, and a `dep-analyst` for dependency
rationalization. Correct beats delete; proposes dependency changes, never auto-applies.
