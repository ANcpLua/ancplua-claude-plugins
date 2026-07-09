---
description: Report which model actually served each turn this session (ground truth from the transcript), flag any silent Opus↔Fable fallback swaps, and show provider/region/auth routing context. Answers "am I still on Opus?" with evidence.
---

Run a **heimdall** watch: tell the user, with evidence, which model has been serving this session and whether it silently swapped.

Do this:

1. **Ground truth — served model per turn.** Run the ledger script:
   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/scripts/model-ledger.sh"
   ```
   It reads the session transcript's `message.model` (stamped by the inference
   server, not the client) and prints per-model turn counts, token usage, the
   current served model, and any mid-session swaps. If it reports no rows yet,
   say so plainly — the field populates once turns have completed.

2. **Routing context.** Run the provider script:
   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/scripts/which-provider.sh"
   ```
   It shows provider (Anthropic-direct / Bedrock / Vertex), auth mode, network
   path, and the nearest CDN edge. Make clear this locates the *user*, not the
   model — the edge airport code says nothing about which model answered.

3. **Report.** Lead with the answer: **the current served model**, and whether
   it changed this session. If a swap happened, explain the mechanism honestly:
   each model has its own usage bucket; when the primary (per `model` in
   settings) is exhausted or under high demand, the configured `fallbackModel`
   serves instead so the session keeps working — the swap is why the served
   model changed. Then give the two levers: `/model` to pin/switch, and
   `/usage` (or `/usage-credits`) to see per-model budget and add credits.

Rules:
- **Never guess the model.** Only report what `message.model` shows. If the
  transcript has no served-model rows yet, say that instead of inferring from
  latency, config, or a UI banner — those are not evidence.
- No secrets: the scripts never print API keys or tokens.
- Keep it tight: the headline is "you are on X (changed/unchanged this session)."

Optional: the plugin also ships a passive `model-drift-net` Stop hook that
surfaces a one-line notice the moment a swap happens, so drift is caught
automatically without running this command.
