# Gate 4: 傷門 SHŌMON — CHECKPOINT

> Agents don't need infinite tokens. They need memory that survives reality.
> No checkpoint = no progress. This is how multi-round workflows stay sane.
> The cost of persistence is paid here so it doesn't compound later.

## Entry Condition

- Gate 3 checkpoint exists (`checkpoint.sh verify 3`)
- Agent findings available from Gate 3

## Actions (Lead Only — 0 Agents)

### 1. Merge Findings

Collect all Gate 3 agent outputs into a single consolidated artifact.
The lead builds this by combining the text/JSON returned by each Task tool call:

```bash
# Lead: construct merged findings from Gate 3 agent outputs,
# then cache as a single artifact for later gates
plugins/exodia/scripts/smart/session-state.sh artifact add "findings" \
  "MERGED_FINDINGS_JSON_HERE"
```

Deduplicate: if two agents found the same issue (same file:line), keep the
higher-confidence version. Note the overlap — it increases confidence.

### 2. Decision Log

For every major choice, log WHY. This survives session crashes:

```bash
plugins/exodia/scripts/smart/session-state.sh decision "prioritized-P0-over-P2" \
  "P0 blocks deployment, P2 is cosmetic"

plugins/exodia/scripts/smart/session-state.sh decision "excluded-file-X" \
  "Out of scope per Gate 1 boundaries"

plugins/exodia/scripts/smart/session-state.sh decision "objective-type-confirmed" \
  "Auto-classified as BUG, confirmed by root-cause-hunter findings"
```

### 3. Idempotent Guards

Mark each finding with a hash so re-runs skip already-processed work:

```text
FINDING_HASH = sha256(file_path + ":" + line_number + ":" + description)
```

Store hashes in `.eight-gates/artifacts/finding-hashes.txt`.
On resume: compare against existing hashes, skip matches.

### 4. Cache Work Items

Extract actionable items from findings. The lead parses the merged findings
artifact and extracts items with severity, file, description, and evidence:

```bash
# Lead: extract actionable work items from merged findings,
# then cache for Gate 6 to prioritize and assign
plugins/exodia/scripts/smart/session-state.sh artifact add "work-items-raw" \
  "EXTRACTED_WORK_ITEMS_JSON_HERE"
```

## Output Schema

```json
{
  "gate": 4,
  "artifacts_cached": 0,
  "decisions_logged": 0,
  "findings_total": 0,
  "findings_deduplicated": 0,
  "agents_spawned": 0
}
```

## Exit Condition

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 4 "checkpoint-complete" \
  "artifacts=$(find .eight-gates/artifacts -maxdepth 1 -type f | wc -l | tr -d ' ')" \
  "decisions=$(wc -l < .eight-gates/decisions.jsonl | tr -d ' ')" \
  "agents_spawned=[n]"
```

**PROCEED** always (bookkeeping can't fail structurally).
