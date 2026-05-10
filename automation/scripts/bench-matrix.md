# Parallel-agent host benchmark — results matrix

Fill one row per `(date, N, host)` after running `automation/scripts/ghostty-launch.sh`
+ `automation/scripts/bench.sh` together. Reproduces the 1..8 scaling per host
across separate days (one host per Monday until all 8 are covered).

| Date (UTC) | N | Host         | Wall (s) | Σ agent CPU% (peak) | Σ agent RSS (MB peak) | Host CPU% | Host RSS (MB) | Failures | Notes |
|------------|---|--------------|----------|---------------------|------------------------|-----------|---------------|----------|-------|
|            | 8 | Ghostty      |          |                     |                        |           |               |          |       |
|            | 8 | Warp         |          |                     |                        |           |               |          |       |
|            | 8 | Terminal.app |          |                     |                        |           |               |          |       |
|            | 8 | iTerm2       |          |                     |                        |           |               |          |       |
|            | 8 | Cursor       |          |                     |                        |           |               |          |       |
|            | 8 | Rider        |          |                     |                        |           |               |          |       |
|            | 8 | WebStorm     |          |                     |                        |           |               |          |       |
|            | 8 | tmux/cmux    |          |                     |                        |           |               |          |       |

## Computing each cell from `out/<host>-n<N>.csv`

- `Wall (s)` — `max(elapsed_s)` where `n_agents == N`.
- `Σ agent CPU% (peak)` — max over time of `sum(cpu_pct)` where `role == 'agent'`.
- `Σ agent RSS (MB peak)` — max over time of `sum(rss_mb)` where `role == 'agent'`.
- `Host CPU%` — `max(cpu_pct)` where `role == 'host'`.
- `Host RSS (MB)` — `max(rss_mb)` where `role == 'host'`.
- `Failures` — count of agents that exited non-zero (separate log).
- `Notes` — anything notable: rate limits, kernel panics, fan ramp, etc.

## Plotting

When at least 3 N points exist for a host (e.g. `N ∈ {1, 4, 8}`):

```python
import glob, pandas as pd, matplotlib.pyplot as plt
df = pd.concat(pd.read_csv(f) for f in glob.glob("automation/scripts/out/*.csv"))
agg = df[df.role == 'agent'].groupby(['host', 'n_agents', 'ts_iso'])['cpu_pct'].sum().reset_index()
peak = agg.groupby(['host', 'n_agents'])['cpu_pct'].max().reset_index()
for host, g in peak.groupby('host'):
    plt.plot(g.n_agents, g.cpu_pct, marker='o', label=host)
plt.xlabel('N agents'); plt.ylabel('Peak Σ CPU%'); plt.legend(); plt.savefig('scaling.png')
```

## Honest caveats

- One Monday gives **one row** per host. The full N=1..8 curve per host needs
  ≥3 separate Mondays (or 3 separate runs with different N at the same host).
- Wall time depends on the agents' actual workload — quick-gate-skipped repos
  finish in seconds. To get comparable numbers, run all 8 templates against
  the same dirty-state seed.
- `cmux` and `supacode` were named in the original ask but are unverified by
  the author of this file — confirm what tool you mean before recording rows.
