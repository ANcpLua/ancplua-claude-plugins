#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Running ancplua-claude-plugins local validation..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# 1. Marketplace + Plugin Validation
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

  # Validate individual plugins
  if [ -d "plugins" ]; then
    for d in plugins/*; do
      if [ -d "$d" ]; then
        echo "▶ claude plugin validate \"$d\""
        "$CLAUDE_CMD" plugin validate "$d" || true
      fi
    done
  fi

  # Validate agent configs (Type A components)
  if [ -d "agents" ]; then
    echo "▶ Validating agent configurations..."
    for agent_dir in agents/*; do
      if [ -d "$agent_dir/config" ] && [ -f "$agent_dir/config/agent.json" ]; then
        echo "  ✓ $agent_dir/config/agent.json exists"
        jq . "$agent_dir/config/agent.json" >/dev/null 2>&1 || echo "  ❌ Invalid JSON in $agent_dir/config/agent.json"
      fi
    done
  fi
else
  echo "⚠️ 'claude' CLI not found. Skipping plugin validation."
  echo "   Checked: PATH, ~/.claude/local/node_modules/.bin/, ~/.claude/bin/"
fi

# 2. Shell Scripts (ShellCheck)
if command -v shellcheck >/dev/null 2>&1; then
  echo "▶ shellcheck on repo shell scripts"
  # Use find to locate all .sh files in tooling/scripts, plugins/**/scripts, and agents/**/scripts
  SCRIPT_DIRS=""
  [ -d "tooling/scripts" ] && SCRIPT_DIRS="tooling/scripts"
  [ -d "plugins" ] && SCRIPT_DIRS="$SCRIPT_DIRS plugins"
  [ -d "agents" ] && SCRIPT_DIRS="$SCRIPT_DIRS agents"

  if [ -n "$SCRIPT_DIRS" ]; then
    # shellcheck disable=SC2086
    find $SCRIPT_DIRS -type f -name "*.sh" -print0 2>/dev/null | xargs -0 -r shellcheck || true
  else
    echo "ℹ️ No shell scripts found to check."
  fi
else
  echo "⚠️ 'shellcheck' not found. Skipping shell script checks."
fi

# 3. Markdown (MarkdownLint)
if command -v markdownlint >/dev/null 2>&1; then
  echo "▶ markdownlint **/*.md"
  markdownlint "**/*.md" || true
else
  echo "⚠️ 'markdownlint' not found. Skipping markdown checks."
fi

# 4. GitHub Actions Workflows (ActionLint)
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

# 5. JSON Validation (Basic check for critical JSONs)
if command -v jq >/dev/null 2>&1; then
  echo "▶ Validating critical JSON files..."
  find . -name "*.json" -not -path "*/node_modules/*" -not -path "*/.git/*" -print0 | xargs -0 -I {} bash -c 'jq . "{}" >/dev/null || echo "❌ Invalid JSON: {}"'
else
  echo "⚠️ 'jq' not found. Skipping JSON syntax checks."
fi

echo "✅ ancplua-claude-plugins local validation finished (some checks may have been skipped if tools were missing)."