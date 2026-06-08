# html-effectiveness

Tell Claude "give me a report / dashboard / triage board / status update / postmortem / implementation plan / annotated PR / explainer / editor for X" and get a single self-contained `.html` file back instead of a wall of markdown.

## What's in it

- **`skills/html-effectiveness/SKILL.md`** — decision protocol Claude follows: load `patterns.json`, match user intent against `decision_tree`, study the vendored canonical pattern (`references/patterns/<file>.html`), replicate with the user's real data.
- **`skills/html-effectiveness/references/patterns.json`** — data-driven routing table: 21 patterns (20 from Thariq's catalog + 1 agent-spawn-deck added here) × `if_user_says` triggers, design tokens (Anthropic Coral DNA), principles.
- **`skills/html-effectiveness/references/patterns/`** — the 20 canonical pattern `.html` files vendored from upstream (Apache-2.0), the byte-for-byte source the skill studies.
- **`skills/html-effectiveness/assets/otel-semconv-demo.html`** — concrete proof-of-concept built on the side-by-side pattern, showing OTel v1.40 → v1.41 generator diff with breaking-change filter and "Copy upgrade-notes" button.

## Source philosophy

[ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness) — Thariq Shihipar (Claude Code @ Anthropic) argues that agent output should land as a usable HTML artifact, not a markdown wall the user skims and forgets. The 20 demos in his repo show what each kind of artifact looks like when treated as a UI instead of a document.

This plugin operationalizes that catalog: it tells Claude **which** pattern to pick **when**, so the user doesn't have to keep saying "do it like demo #18 again."

## Trying the demo

The 20 canonical patterns are vendored in-tree under `skills/html-effectiveness/references/patterns/` (Apache-2.0, `UPSTREAM-LICENSE` alongside them) — zero external setup, works on any machine. To open the bundled proof-of-concept from the plugin root:

```bash
open "${CLAUDE_PLUGIN_ROOT}/skills/html-effectiveness/assets/otel-semconv-demo.html"
```

Click "Breaking only" to filter, then "Copy upgrade-notes" — the visible groups land on your clipboard as CHANGELOG-ready markdown.
