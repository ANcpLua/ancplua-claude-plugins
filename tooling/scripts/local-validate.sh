#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Running ancplua-claude-plugins local validation..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# Marketplace + plugin validation
if command -v claude >/dev/null 2>&1; then
  echo "▶ claude plugin validate ."
  claude plugin validate .

  if [ -d "plugins" ]; then
    for d in plugins/*; do
      if [ -d "$d" ]; then
        echo "▶ claude plugin validate \"$d\""
        claude plugin validate "$d" || true
      fi
    done
  fi
else
  echo "⚠️ 'claude' CLI not found. Skipping plugin validation."
fi

# Shell scripts
if command -v shellcheck >/dev/null 2>&1; then
  echo "▶ shellcheck on repo shell scripts"
  # Use find to locate all .sh files in tooling/scripts and plugins/**/scripts
  if [ -d "tooling/scripts" ] || [ -d "plugins" ]; then
    find tooling/scripts plugins -type f -name "*.sh" -print0 2>/dev/null | xargs -0 -r shellcheck || true
  else
    echo "ℹ️ No shell scripts found to check."
  fi
else
  echo "⚠️ 'shellcheck' not found. Skipping shell script checks."
fi

# Markdown
if command -v markdownlint >/dev/null 2>&1; then
  echo "▶ markdownlint **/*.md"
  markdownlint "**/*.md" || true
else
  echo "⚠️ 'markdownlint' not found. Skipping markdown checks."
fi

# GitHub Actions workflows
if command -v actionlint >/dev/null 2>&1; then
  if [ -d ".github/workflows" ]; then
    echo "▶ actionlint .github/workflows/*.yml"
    actionlint .github/workflows/*.yml || true
  else
    echo "ℹ️ No .github/workflows directory; skipping workflow checks."
  fi
else
  echo "⚠️ 'actionlint' not found. Skipping workflow syntax checks."
fi

echo "✅ ancplua-claude-plugins local validation finished (some checks may have been skipped if tools were missing)."
