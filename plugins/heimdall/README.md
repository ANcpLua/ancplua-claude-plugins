# heimdall

**Watchman of the model-routing Bifröst.** Heimdall sees who crosses the
bridge — it tells you which model *actually* served each turn, and shouts when
a silent fallback swap happens.

## Why

Claude Code can transparently fall back from your primary model (e.g.
`opus[1m]`) to a configured `fallbackModel` (e.g. `claude-fable-5[1m]`) when the
primary is under high demand or its usage bucket is exhausted. That swap is
easy to miss — you often only notice when a "you've reached your … limit"
banner appears. And you **cannot** tell which model you're on from latency,
network timing, or a Cloudflare edge code: those locate *you*, not the model.

The one reliable signal is the session transcript: each assistant turn records
`message.model`, stamped by the inference server. Heimdall reads that.

## What you get

| Component | What it does |
|---|---|
| `/heimdall` command | Reports the served model per turn (ground truth), flags swaps, and shows provider/auth/edge routing context. Leads with "you are on X, changed/unchanged this session." |
| `scripts/model-ledger.sh` | The ground-truth detector: parses `message.model` from the transcript → per-model turn counts, token usage, current model, and every swap point. |
| `scripts/session-inspect.sh` | The **extended** read: `advisorModel`, `service_tier`, `speed`, `inference_geo`, cc version/entrypoint, token totals, cache **hit rate**, and cache-**miss reasons** with re-charged token counts + `stop_reason` distribution. |
| `scripts/which-provider.sh` | Provider (Anthropic-direct / Bedrock / Vertex), auth mode, network path, nearest CDN edge. Honestly scoped: it does **not** name the model. |
| `model-drift-net` Stop hook | Passive, non-blocking. Surfaces a one-line notice **only** when the served model changes vs the previous turn. Silent otherwise. No LLM, no network. |

## Usage

```
/heimdall
```

Or run the scripts directly:

```bash
bash scripts/model-ledger.sh          # newest transcript for the current project
bash scripts/model-ledger.sh --all    # newest transcript anywhere
bash scripts/model-ledger.sh path.jsonl
bash scripts/session-inspect.sh       # extended: tier, cache hit rate, cache-miss reasons
bash scripts/which-provider.sh
```

### What the extended read finds

`session-inspect.sh` reads fields the UI never shows. A real example — a
987-turn session at ~100% cache hit rate still re-charged **3.6M tokens** across
22 cache misses, dominated by `messages_changed` (history compaction/edits) and
`tools_changed` (mid-session MCP/tool toggles). Each of those is a lever: fewer
mid-session tool/config changes → fewer cache busts → lower cost. It also stamps
`service_tier`, `speed`, `inference_geo`, and `advisorModel`, so you can see your
cost lane and (when set) where inference actually ran — evidence, not a
Cloudflare-edge guess.

## Design notes

- **Evidence, not inference.** Heimdall never guesses the model from timing or
  config. If the transcript has no served-model rows yet, it says so.
- **No secrets.** Neither script prints API keys or tokens; the provider script
  only checks whether an env key is *present*, never its value.
- **Deterministic, no-LLM.** Pure `bash` + `python3` stdlib. The hook never
  blocks a turn and stays quiet unless the model actually changed.

## When a swap fires

Each model has its own usage bucket. If you hit the primary's limit (or it's
saturated), the `fallbackModel` serves so you keep working — that's the swap.
Two levers: `/model` to pin or switch back, `/usage` (`/usage-credits`) to see
per-model budget and add credits.
