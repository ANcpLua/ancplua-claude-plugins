#!/usr/bin/env bash
# Marketplace guards — additive CI checks, no runtime effect. Each one maps to a
# failure that actually happened in this repo:
#
#   1. version-sync — a plugin's plugin.json version drifting from its
#      marketplace.json entry (the two carry the version twice).
#   2. mirror-sync  — CLAUDE.md drifting from its hand-maintained .cursor /
#      .windsurf copies (they silently went stale).
#   3. version-bump — a behavioral change shipped without bumping the plugin
#      version, which makes `/plugin update` a silent no-op so the fix never
#      reaches the running cache.
#
# Usage: guards.sh [BASE_REF]
#   BASE_REF (e.g. origin/main) is only needed for guard 3; omit it for a local
#   run of guards 1 and 2.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

MKT=".claude-plugin/marketplace.json"
rc=0
err()  { echo "::error::$*"; rc=1; }
info() { echo "  $*"; }

echo "== version-sync (plugin.json vs marketplace.json) =="
while IFS=$'\t' read -r name src mver; do
  pj="${src#./}/.claude-plugin/plugin.json"
  if [ ! -f "$pj" ]; then err "$name: marketplace source has no $pj"; continue; fi
  pver=$(jq -r '.version' "$pj")
  if [ "$pver" != "$mver" ]; then
    err "$name: version mismatch — $pj=$pver but marketplace.json=$mver"
  else
    info "$name $pver ok"
  fi
done < <(jq -r '.plugins[] | [.name, .source, (.version // "MISSING")] | @tsv' "$MKT")

echo "== mirror-sync (CLAUDE.md vs .cursor / .windsurf copies) =="
# Compare the shared body: from the H1 down to the closing "Keep the mirrors in
# sync" section, which legitimately differs per file. Command substitution drops
# trailing newlines, so this is robust to EOF-whitespace noise.
body() { awk 'f{print} /^# ancplua-claude-plugins/{print; f=1}' "$1" | sed '/^## Keep the mirrors in sync/,$d'; }
canon=$(body CLAUDE.md)
for m in .cursor/rules/project-config.mdc .windsurf/rules/project-config.md; do
  if [ "$canon" != "$(body "$m")" ]; then
    err "$m body drifted from CLAUDE.md — re-sync the copy"
  else
    info "$m in sync"
  fi
done

echo "== version-bump (behavioral change must bump the plugin version) =="
base="${1:-}"
if [ -z "$base" ]; then
  info "no base ref passed — skipping (local run)"
else
  changed=$(git diff --name-only "$base"...HEAD)
  # plugins (top dir only — excludes cc-plugin-eval/fixtures/** test corpus) with
  # a change under a behavior-bearing directory
  plugins=$(printf '%s\n' "$changed" \
    | sed -nE 's#^plugins/([^/]+)/(hooks|scripts|agents|commands|skills)/.*#\1#p' \
    | sort -u)
  [ -z "$plugins" ] && info "no plugin behavioral files changed vs $base"
  for p in $plugins; do
    pj="plugins/$p/.claude-plugin/plugin.json"
    [ -f "$pj" ] || continue
    oldv=$(git show "$base:$pj" 2>/dev/null | jq -r '.version' 2>/dev/null || echo "")
    newv=$(jq -r '.version' "$pj")
    if [ -n "$oldv" ] && [ "$oldv" = "$newv" ]; then
      err "$p: behavioral change but version stayed $newv — bump $pj (/plugin update needs it)"
    else
      info "$p version $oldv -> $newv"
    fi
  done
fi

if [ $rc -eq 0 ]; then echo "All guards passed."; else echo "Guards FAILED."; fi
exit $rc
