# html-effectiveness

Tell Claude "give me a report / dashboard / triage board / status update / postmortem / implementation plan / annotated PR / explainer / editor for X" and get a single self-contained `.html` file back instead of a wall of markdown.

## What's in it

- **`skills/html-effectiveness/SKILL.md`** — decision protocol Claude follows: load `patterns.json`, match user intent against `decision_tree`, study the canonical pattern from Thariq's repo, replicate with the user's real data.
- **`skills/html-effectiveness/references/patterns.json`** — data-driven routing table: 20 patterns × `if_user_says` triggers, design tokens (Anthropic Coral DNA), principles.
- **`skills/html-effectiveness/assets/otel-semconv-demo.html`** — concrete proof-of-concept built on the side-by-side pattern, showing OTel v1.40 → v1.41 generator diff with breaking-change filter and "Copy upgrade-notes" button.
- **`claude-code-bleeding-edge.html`** — curated reference doc built on
  pattern 14 (research-feature-explainer) DNA: post-May-2025 features
  (`/btw`, v2.1 permission modes, 2026 hook extensions),
  hidden/undocumented env vars, CLI flags, `settings.json` power moves,
  Boris Cherny tips. Sticky-toolbar search + category filter pills +
  copy-to-clipboard on every row. Single self-contained file; open offline.

## Source philosophy

[ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness) —
Thariq Shihipar (Claude Code @ Anthropic) argues that agent output should
land as a usable HTML artifact, not a markdown wall the user skims and
forgets. The 20 demos in his repo show what each kind of artifact looks
like when treated as a UI instead of a document.

This plugin operationalizes that catalog: it tells Claude **which** pattern
to pick **when**, so the user doesn't have to keep saying "do it like demo
#18 again."

## Local prerequisite

The skill expects Thariq's repo cloned at
`~/RiderProjects/thariq-html-effectiveness/` so it can study the canonical
source byte-for-byte. If missing, the skill instructs Claude to run `gh
repo clone ThariqS/html-effectiveness
~/RiderProjects/thariq-html-effectiveness`.

## Trying the demo

```bash
open ~/RiderProjects/ancplua-claude-plugins/plugins/html-effectiveness/skills/html-effectiveness/assets/otel-semconv-demo.html
```

Click "Breaking only" to filter, then "Copy upgrade-notes" — the visible
groups land on your clipboard as CHANGELOG-ready markdown.

For the bleeding-edge reference:

```bash
open ~/RiderProjects/ancplua-claude-plugins/plugins/html-effectiveness/claude-code-bleeding-edge.html
```

Toggle category pills, search any env var or flag, jump straight to
`#agent-teams` for the typo correction.
