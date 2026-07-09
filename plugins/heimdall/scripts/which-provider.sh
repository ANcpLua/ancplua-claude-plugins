#!/usr/bin/env bash
# which-provider.sh — WHERE is this session routed, and how is it authed?
#
# Answers provider/region/auth/edge questions. It deliberately does NOT try to
# name the serving model: network timing and Cloudflare edge codes cannot
# fingerprint Opus vs Fable — only the transcript's message.model can (see
# model-ledger.sh). No secrets are ever printed.
set -u
API="${ANTHROPIC_BASE_URL:-https://api.anthropic.com}"
line() { printf '%s\n' "------------------------------------------------------------"; }

echo "heimdall · provider / routing"
line
echo "1) PROVIDER & AUTH"
line
if [ -n "${CLAUDE_CODE_USE_BEDROCK:-}" ]; then
  echo "  provider : AWS Bedrock (region=${AWS_REGION:-unset})"
elif [ -n "${CLAUDE_CODE_USE_VERTEX:-}" ]; then
  echo "  provider : Google Vertex (region=${CLOUD_ML_REGION:-unset})"
else
  echo "  provider : Anthropic-direct (no Bedrock/Vertex)"
fi
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  echo "  auth     : API key present (${#ANTHROPIC_API_KEY} chars)"
else
  echo "  auth     : subscription/OAuth (no ANTHROPIC_API_KEY in env)"
fi
echo "  model cfg: ANTHROPIC_MODEL=${ANTHROPIC_MODEL:-unset} (env override, if any)"

line
echo "2) NETWORK PATH  (your distance to the edge — NOT the model)"
line
curl -o /dev/null -s -w \
"  dns=%{time_namelookup}s connect=%{time_connect}s tls=%{time_appconnect}s ttfb=%{time_starttransfer}s total=%{time_total}s http=%{http_code}\n" \
"$API/" || echo "  (curl failed — offline?)"

line
echo "3) EDGE LOCATION  (which CDN edge is nearest YOU)"
line
CFRAY=$(curl -sv "$API/v1/messages" -o /dev/null 2>&1 | grep -i "^< cf-ray:" | awk '{print $3}')
echo "  cf-ray  : ${CFRAY:-n/a}  (3-letter suffix = airport code, e.g. VIE=Vienna)"
echo "  server  : $(curl -sI "$API/" 2>/dev/null | grep -i '^server:' | awk '{print $2}' | tr -d '\r')"

line
echo "NOTE: none of the above names the serving model. For that, run the"
echo "companion  model-ledger.sh  (reads message.model from the transcript),"
echo "or type  /model  in Claude Code."
