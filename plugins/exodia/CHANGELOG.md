# Changelog

All notable changes to the Exodia plugin are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [3.0.1] - 2026-06-11

### Fixed

- Corrected `/exodia:fix` P0 invocation guidance after the v3 fix-family collapse:
  P0 emergency handoffs require both `P0` severity and `maximum` parallelism.
- Updated mega-swarm P0 handoffs to expose persisted finding IDs and pass them to
  `/exodia:fix "<finding-id>" P0 maximum`.
- Made inherited finding context point at `.eight-gates/artifacts/findings.json`
  instead of referring to a generic `findings.json`.

## [3.0.0] - 2026-06-10

### Changed

- Collapsed the previous fix-family commands into `/exodia:fix`.
- Updated Exodia documentation and marketplace metadata for the seven-command,
  two-skill v3 layout.
