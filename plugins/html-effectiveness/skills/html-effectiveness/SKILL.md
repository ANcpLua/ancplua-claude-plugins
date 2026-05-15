---
name: html-effectiveness
description: >
  Produce a single self-contained .html file instead of a wall of markdown when the user wants a report,
  dashboard, triage board, design doc, code review, flowchart, slide deck, postmortem, implementation
  plan, RFC, feature-flag editor, prompt tuner, annotated PR writeup, status update, status report,
  weekly recap, sprint review, module map, architecture overview, design system, component variants,
  animation prototype, interactive explainer, concept explainer, feature explainer, SVG figures,
  pipeline diagram, agent-spawn deck (HTML carrying multiple ready-to-paste agent prompts for fan-out
  work), OR any artifact that benefits from layout, interaction, drag-drop, live preview, side-by-side
  comparison, parallel agent fan-out, or a copy-to-clipboard export. Triggers eagerly on English AND
  German phrases (case-insensitive, typo-tolerant, semantic match — NOT literal): "html instead of
  markdown", "make me a dashboard", "build an interactive", "html report", "triage board", "triage
  me these", "status report", "wochenbericht", "postmortem", "incident", "implementation plan",
  "implementierungsplan", "design doc", "side by side", "drag drop", "click through", "give me an
  editor for", "tune the prompt", "feature flag editor", "explainer with interaction", "concept
  explainer", "annotated diff", "code review", "pr writeup", "pr beschreibung", "slide deck",
  "präsentation", "präsi", "module map", "modulkarte", "flowchart", "flussdiagramm", "vergleich",
  "nebeneinander", "vergleiche x y z", "x vs y vs z", "drei ansätze", "alternativen", "spawn agents",
  "fan out", "agenten spawnen", "agenten team", "parallel scan", "paralleler audit", "multi-agent
  prompt", "give me prompts to run", "deck of prompts". Trigger eagerly — if the output would
  otherwise be a long markdown table, several sections of prose with categories, a list the user
  will sort/filter/diff, OR a task that benefits from parallel agent fan-out, HTML wins. Match on
  user intent, not literal phrase: a list of tickets → triage-board, a diff → code-review, a
  timeline → incident-report, a parallel-audit task → 21-agent-spawn-deck.
compatibility: >
  Works in any environment where the agent can write files. The output is a vanilla .html with inline
  CSS/JS — open in a browser, no build, no npm.
---

# html-effectiveness

Based on Thariq Shihipar's [html-effectiveness](https://github.com/ThariqS/html-effectiveness) repo. He works on Claude Code at Anthropic; the philosophy: **agents producing HTML files instead of markdown walls** because HTML carries spatial information and interaction that markdown flattens.

## Canonical source — exact local path

The 20 canonical patterns live as standalone `.html` files at:

```
/Users/ancplua/RiderProjects/thariq-html-effectiveness/
```

Branch: `main`. If the directory is missing, run:

```bash
gh repo clone ThariqS/html-effectiveness /Users/ancplua/RiderProjects/thariq-html-effectiveness
```

Do **not** modify those files in place — they are the upstream reference. Read them to understand the pattern, then write a new file with the user's data into the user's project area (default: `~/<task>/<slug>.html` or alongside related artifacts, never into `~/RiderProjects/thariq-html-effectiveness/` itself).

## Decision protocol

1. **Load the routing data.** Read `references/patterns.json` from this skill folder. It contains 20 canonical patterns and a `decision_tree` mapping user-intent phrases (English + German + semantic) to `use_pattern` IDs. The `triggering_principles` block at the top tells you HOW to match (fuzzy, multilingual, typo-tolerant, intent-based — not literal).

2. **Match user intent.** Scan the user's request for semantic fit with any entry in `decision_tree`. Match on intent regardless of language, case, or typos. If multiple patterns fit, pick the one whose `key_pattern` field most closely describes the data structure the user has. If still ambiguous, prefer the more interactive pattern (editor > report > diagram).

3. **Study the canonical source.** Open `/Users/ancplua/RiderProjects/thariq-html-effectiveness/<pattern.file>` and read it end-to-end. Don't paraphrase the pattern — internalize the HTML structure, CSS tokens, JS interaction code, and copy-button mechanism. Reuse the same eyebrow / h1 / sub / sticky-toolbar / column / card markup so the output feels like one family.

4. **Replicate with the user's real data.** Replace Thariq's example data (Acme tickets, Birchline comments, etc.) with the user's actual data. Keep the design tokens (`#FAF9F5` ivory bg, `#D97757` clay accent, Lora serif + system-ui + SF Mono), layout, and interaction code intact. If the user has no real data yet, ask once for a sample — do not invent fictional company data.

5. **Honor the principles** (see `references/patterns.json:principles`):
   - Self-contained: inline `<style>` and `<script>`, no external dependencies beyond Google Fonts.
   - Anthropic Coral DNA: design tokens in `references/patterns.json:design_tokens`.
   - Vanilla JS only. No React, no jQuery.
   - Editors end with a `Copy as markdown` (or `Copy diff` / `Copy JSON` / `Copy gh commands`) button that exports the UI state back into something the user can paste into the next prompt.
   - If the artifact contains private data (private repo names, customer info, internal URLs), save it under the user's home (e.g. `~/repo-audit/`, `~/<task>/`) — never commit to a public plugin repo.

6. **Output and open.** Write the `.html` at a sensible location (default: `~/<task>/output.html` or alongside related artifacts). Open it in the user's browser via `open <file>` for immediate inspection. For interactive editors, mention the export-button location so the user knows how to round-trip the UI state.

## Trigger principles — read these before matching

- **Match on intent, not phrase.** The trigger lists are EXAMPLES of intent, not a whitelist. If the user describes a deliverable that would render better with layout + interaction than as markdown prose, fire.
- **Languages: English + German + mixed.** Triggers are listed bilingually. Mixed-language input ("mach mir einen status report"), Austrian/Swiss German variants, and informal contractions all count. Match by semantic intent regardless of language.
- **Typo tolerance.** User typos ("reprot", "staus", "tirage", "flowshart", "implementierungsplan" misspelled) are expected. Match by stem / phonetic similarity.
- **Case-insensitive.** "HTML REPORT", "html report", "Html Report" are the same.
- **Ambiguous user intent.** If the user says "make me a thing for X", look at WHAT X is. A list of tickets → triage-board. A diff → code-review. A timeline → incident-report. Let the data shape decide the pattern.
- **Be pushy.** Default to firing when the output would otherwise be a long markdown table, several sections of prose with categories, or a list the user will sort/filter/diff. Markdown for a paragraph; HTML for anything you'll come back to.

## Palette choice

`patterns.json:palettes` defines two:

- **`coral`** (default) — `#FAF9F5`/`#D97757`/`#141413`/`#788C5D` + Lora serif. Use for reports, plans, design docs, status updates, research explainers, editor UIs. Anything reading-room or knowledge-work.
- **`github_dark`** — `#0d1117`/`#58a6ff`/`#3fb950`/`#f85149`. Use for codebase audits, CI/CD dashboards, fan-out agent decks, terminal-adjacent tooling. Anything that lives next to a terminal session.

Pattern `21-agent-spawn-deck` defaults to `github_dark`. All others default to `coral`. The user can override per request.

## Composition (multi-pattern output)

If a task naturally splits across multiple deliverables (e.g., an implementation-plan AND a spawn-deck for executing the plan), write **multiple linked .htmls** and reference each other via `<a href>` at the bottom. Example: `repo-cleanup-plan.html` (pattern 16, plan) + `repo-cleanup-spawn-deck.html` (pattern 21, parallel scanners) + `repo-cleanup-triage.html` (pattern 18, result triage). Each links the next.

If a single pattern needs sub-work that parallelizes (audit 200 repos, scan 30 services), default to `21-agent-spawn-deck` instead of one giant report — the deck carries N ready-to-paste prompts, the user fan-outs, the lead synthesizes.

## When to skip this skill

- The user explicitly asked for markdown / a commit message / a code change in a `.py` / `.cs` / etc. file.
- The output is genuinely a single short paragraph or single code snippet.
- The user wants prose they will paste into another system that doesn't render HTML (e.g., a Slack message body, a commit body, a CHANGELOG entry).

## Examples (intent → pattern)

| User says | Pattern fires |
|---|---|
| "triage diese 200 dead repos" | `18-editor-triage-board` |
| "make me a weekly status of what shipped" | `11-status-report` |
| "wochenbericht für Sprint 14" | `11-status-report` |
| "zeig mir die generated C# vs YAML side by side" | `01-exploration-code-approaches` |
| "explain how auth flows through this repo" | `14-research-feature-explainer` (or `04-code-understanding` if structural) |
| "tune my SKILL.md description against these 10 prompts" | `20-editor-prompt-tuner` |
| "incident bei deploy gestern, mach postmortem" | `12-incident-report` |
| "implementierungsplan für ANcpLua.NET.Sdk v3 mit Risks" | `16-implementation-plan` |
| "annotated diff für PR #145" | `03-code-review-pr` |
| "präsi für Bachelor-Verteidigung mit Pfeiltasten" | `09-slide-deck` |
| "feature flags editor für flags.production.json" | `19-editor-feature-flags` |
| "concept explainer für consistent hashing, interaktiv" | `15-research-concept-explainer` |
| "fan out 4 agents to scan my 349 repos" | `21-agent-spawn-deck` (github_dark palette) |
| "gib mir das deck mit prompts zum parallel ausführen für den shadow-ai audit" | `21-agent-spawn-deck` |
| "implementation plan PLUS spawn-deck zum ausführen" | `16-implementation-plan` + `21-agent-spawn-deck` (linked) |

## Bundled asset

`assets/otel-semconv-demo.html` is a concrete proof-of-concept built on top of `01-exploration-code-approaches` pattern, showing OTel semantic-convention YAML → generated C# diff with breaking-change filter. Open it to see the pattern applied to Alexander's actual problem domain.
