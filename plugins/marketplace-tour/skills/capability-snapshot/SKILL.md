---
name: capability-snapshot
description: Use when the user asks "what does plugin X do", "show me what the plugins can do", or any capability question about plugins in this repo. Produces schema-validated snapshots from CLAUDE.md + git log. Refuses to paraphrase marketplace.json (it's stale marketing metadata, not truth).
---

# Capability Snapshot

## The Rule

`marketplace.json` descriptions are install metadata, not capability specs. They are written once and almost never updated. For "what does plugin X actually do", read truth files directly.

**Truth hierarchy** (first existing wins):
1. `plugins/<name>/CLAUDE.md`
2. `plugins/<name>/README.md`
3. `plugins/<name>/.claude-plugin/plugin.json` description
4. `.claude-plugin/marketplace.json` — **NEVER**

You have a deterministic bash script. Use it. Do not re-explore with `Glob`/`Grep` — that's how prior agents burned 22 minutes producing 4-month-old output.

## Run It

```bash
# single plugin
bash plugins/marketplace-tour/bin/plugin-snapshot qyl \
  | bash plugins/marketplace-tour/bin/validate-snapshot

# all plugins
bash plugins/marketplace-tour/bin/plugin-snapshot all \
  | bash plugins/marketplace-tour/bin/validate-snapshot
```

Validator passes JSON through on success, exits 1 + prints violation on schema fail. If it fails, STOP and surface the failure — do not paper over.

## Output Fields

`plugin`, `version`, `truth_source`, `truth_identity`, `plugin_json_description`, `marketplace_description`, `marketplace_version`, `drift.{status, metadata_sync, truth_overlap_pct, mtime_delta_days}`, `commands[]`, `agents[]`, `skills[]`, `hooks[]`, `keywords[]`, `recent_commits[{date,subject}]`

**`drift.status`** is computed in three layers, in priority order:

| Status | Meaning |
|---|---|
| `MISSING` | plugin not in marketplace.json |
| `METADATA_DRIFT` | plugin.json description ≠ marketplace.json description (someone bumped plugin.json but did not sync marketplace) |
| `CONTENT_DRIFT` | metadata in sync, but `truth_overlap_pct < 30` — marketplace and plugin.json both agree on a description that shares <30% meaningful tokens with the CLAUDE.md first paragraph (both metadata files are stale together) |
| `STALE_<N>d` | content checks passed, but truth file's git mtime is N>14 days newer than marketplace.json (soft signal) |
| `FRESH` | all three checks passed |

`truth_overlap_pct` is the jaccard similarity (0–100) of the lowercased, stopword-filtered token sets of marketplace_description vs truth_identity. A value below 30 almost always means the description is describing an old version of the plugin.

`metadata_sync` is a boolean: true when `plugin_json_description == marketplace_description` verbatim.

## Present To User

**Single plugin** — 5 lines max:
```
qyl 1.2.0 — <truth_identity>  [source: plugins/qyl/CLAUDE.md]
Commands: /qyl:audit, /qyl:observe, /qyl:calini
Agents: 10  Skills: 2  Hooks: SessionStart, PreToolUse, Stop
Recent: 2026-04-03 feat(qyl): add qyl:audit skill
```

**All plugins** — group by drift, STALE first:
```
STALE:  <name> v<ver>  <Nd>  <truth_identity>
FRESH:  <name> v<ver>        <truth_identity>
```

Never 5 lines of prose per plugin. Structure over paraphrase — prose is where drift creeps back in.

## Do Not

- Read `marketplace.json` and paraphrase descriptions
- Explore `plugins/<name>/` broadly with Glob/Grep — the script walks it correctly
- Skip the validator — schema-enforced output is the point
- "Let me summarize that in my own words" — the structured output is the answer
- Take > 60s per plugin or > 5min for `all`

## Why

A prior agent spent 22 minutes producing a capability snapshot by paraphrasing `marketplace.json`, giving output ~4 months stale (qyl described as "observability platform" when it had been refactored into a "compile-time OS for agent workflows" weeks earlier). The script + validator pattern exists so that failure mode cannot recur.

Longer-term fix is harness-enforced `output_schema` in SKILL.md frontmatter with automatic retry on violation. Until that exists, this jq-validated edge check is the workaround.
