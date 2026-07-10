# Automation runner — cron infra, not dev work

This directory contains the cron-triggered automation runner that maintains
hygiene across Alexander's working repositories. **Humans editing this repo
should ignore everything in `automation/`** — see project `CHANGELOG.md` and
plugin source for actual product work.

## Files

| Path | Purpose |
|---|---|
| `policy.md` | Single source of truth for runner behaviour: grounding, quick-gate, evidence, action policy, check-wait, output. |
| `templates/*.md` | The 8 cron-slot prompts. Pasted into the schedule UI; each starts by reading `policy.md`. |
| `scripts/quick-gate.sh` | Per-repo fast-exit probe. Exit 0 = clean, exit 10 = work exists. |
| `scripts/log-entry.sh` | Append-then-trim writer for `RUN-LOG.md`. FIFO cap of 10 entries. |
| `scripts/bench.sh` | Process-level measurement harness for parallel-agent benchmarks. |
| `scripts/ghostty-launch.sh` | Build a tmux session with one pane per template; user attaches inside Ghostty. |
| `scripts/bench-matrix.md` | Results table for the multi-host benchmark. |
| `RUN-LOG.md` | Cron output artifact. **Auto-managed; do not hand-edit.** |

## Why a separate `RUN-LOG.md`

The project's `CHANGELOG.md` is human-curated Keep-A-Changelog. Mixing
machine-prepended entries with that would break both audiences:

- Humans need a stable narrative of releases.
- Machines need a structured, FIFO-bounded artifact they can rewrite.

Two files, two owners.

## Quickstart

```bash
# Verify the quick-gate against a clean repo
automation/scripts/quick-gate.sh /path/to/clean/repo
# → NO_WORK=1 ... ; exit 0

# Verify against a repo with work
automation/scripts/quick-gate.sh /path/to/dirty/repo
# → NO_WORK=0 ... ; exit 10

# Build the 8-pane tmux session for a benchmark run
automation/scripts/ghostty-launch.sh
# Attach in Ghostty: tmux attach -t <session-name>

# In another terminal, capture host metrics
HOST=ghostty PATTERN='claude' \
  automation/scripts/bench.sh 8 automation/scripts/out/ghostty-n8.csv
```

## Schedule

The cron schedule itself is configured in your scheduler UI (Anthropic
Schedule, GitHub Actions, launchd, etc.) — this repo does not own the
trigger. Recommended cadences are in `policy.md`.
