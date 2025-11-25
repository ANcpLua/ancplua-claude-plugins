#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Running ancplua-claude-plugins local validation..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# Marketplace + plugin validation
# Find claude CLI: check PATH first, then common install locations
CLAUDE_CMD=""
if command -v claude >/dev/null 2>&1; then
  CLAUDE_CMD="claude"
elif [ -x "$HOME/.claude/local/node_modules/.bin/claude" ]; then
  CLAUDE_CMD="$HOME/.claude/local/node_modules/.bin/claude"
elif [ -x "$HOME/.claude/bin/claude" ]; then
  CLAUDE_CMD="$HOME/.claude/bin/claude"
fi

if [ -n "$CLAUDE_CMD" ]; then
  echo "▶ claude plugin validate . (using: $CLAUDE_CMD)"
  "$CLAUDE_CMD" plugin validate .

  if [ -d "plugins" ]; then
    for d in plugins/*; do
      if [ -d "$d" ]; then
        echo "▶ claude plugin validate \"$d\""
        "$CLAUDE_CMD" plugin validate "$d" || true
      fi
    done
  fi
else
  echo "⚠️ 'claude' CLI not found. Skipping plugin validation."
  echo "   Checked: PATH, ~/.claude/local/node_modules/.bin/, ~/.claude/bin/"
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
