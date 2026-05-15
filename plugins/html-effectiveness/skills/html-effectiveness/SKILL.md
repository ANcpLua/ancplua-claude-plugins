---
name: html-effectiveness
description: >
  Produce a single self-contained .html file instead of a wall of markdown when the
  user wants a report, dashboard, triage board, design doc, code-review, flowchart,
  slide deck, postmortem, implementation plan, feature-flag editor, prompt tuner,
  annotated PR writeup, status update, or any artifact that benefits from layout,
  interaction, drag-drop, live preview, or a copy-to-clipboard export. Triggers on:
  "html instead of markdown", "make me a dashboard", "build an interactive", "html
  report", "triage board", "status report", "postmortem", "implementation plan",
  "side by side", "drag drop", "click through", "give me an editor for", "tune the
  prompt", "feature flag editor", "explainer with interaction", "annotated diff".
  Trigger eagerly — if the output would be a long markdown table, several sections
  of prose with categories, or a list the user will sort/filter, HTML wins.
compatibility: >
  Works in any environment where the agent can write files. The output is a
  vanilla .html with inline CSS/JS — open in a browser, no build, no npm.
---

# html-effectiveness

Based on Thariq Shihipar's [html-effectiveness](https://github.com/ThariqS/html-effectiveness) repo. He works on Claude Code at Anthropic; the philosophy: **agents producing HTML files instead of markdown walls** because HTML carries spatial information and interaction that markdown flattens.

## Decision protocol

1. **Load the routing data.** Read `references/patterns.json` from this skill folder. It contains 20 canonical patterns + a `decision_tree` with `if_user_says` triggers mapping to `use_pattern` IDs.

2. **Match the user's intent against the decision tree.** Pick the pattern whose triggers best match. If multiple match, choose the one whose `key_pattern` field most closely describes what the user described.

3. **Study the canonical source.** Open `~/RiderProjects/thariq-html-effectiveness/<pattern.file>` and read it end-to-end. Don't paraphrase the pattern — internalize the HTML structure, CSS tokens, JS interaction code, and copy-button mechanism. If the clone is missing, run `gh repo clone ThariqS/html-effectiveness ~/RiderProjects/thariq-html-effectiveness` first.

4. **Replicate the pattern with the user's real data.** Replace Thariq's example data (Acme tickets, Birchline comments, etc.) with the user's actual data. Keep the design tokens, layout, and interaction code intact. If the user has no real data yet, ask once for a sample — do not invent fictional company data.

5. **Honor the principles** (see `references/patterns.json:principles`):
   - Self-contained: inline `<style>` and `<script>`, no external dependencies beyond Google Fonts.
   - Anthropic Coral DNA: design tokens in `references/patterns.json:design_tokens`.
   - Vanilla JS only. No React, no jQuery.
   - Editors end with a `Copy as markdown` (or `Copy diff` / `Copy JSON`) button that exports the UI state.

6. **Output the .html** at a sensible location (default: `~/<task>/output.html` or alongside related artifacts). Open it in the user's browser via `open <file>` for immediate inspection.

## When to skip this skill

- The user explicitly asked for markdown / a commit message / a code change in a `.py` / `.cs` / etc. file.
- The output is genuinely a single short paragraph or single code snippet.
- The user wants prose they will paste into another system that doesn't render HTML (e.g., a Slack message, a commit body).

## Examples

- "give me a triage of these 46 delete candidates" → `18-editor-triage-board.html` pattern, real data = the 46 repos from a repo-audit JSON.
- "make me a status report for this week" → `11-status-report.html` pattern, real data = the user's recent commits / shipped PRs.
- "show me what the new OTel semconv classes look like vs the old ones" → `01-exploration-code-approaches.html` pattern, real data = the generator's YAML input + generated C# + previous-generation diff.
- "explain how rate limiting works in this codebase" → `14-research-feature-explainer.html` pattern.
- "tune my SKILL.md description so it triggers on these 10 phrases but not these 10" → `20-editor-prompt-tuner.html` pattern.

## Bundled asset

`assets/otel-semconv-demo.html` is a concrete proof-of-concept built on top of `01-exploration-code-approaches` pattern, showing OTel semantic-convention YAML → generated C# diff with breaking-change filter. Open it to see the pattern applied to Alexander's actual problem domain.
