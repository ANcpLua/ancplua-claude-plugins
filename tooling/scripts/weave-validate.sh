#!/usr/bin/env bash
set -euo pipefail

# weave-validate.sh — Single validation entrypoint for ancplua-claude-plugins
# Exit code: 0 = all checks pass, 1 = hard failures detected
#
# Hard failures (block merge):  plugin validate, shellcheck, actionlint, JSON syntax
# Soft warnings (informational): markdownlint, SKILL.md count, CHANGELOG existence

HARD_FAILURES=0
SOFT_WARNINGS=0

hard_fail() { echo "  FAIL: $1"; HARD_FAILURES=$((HARD_FAILURES + 1)); }
soft_warn() { echo "  WARN: $1"; SOFT_WARNINGS=$((SOFT_WARNINGS + 1)); }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "=== ancplua-claude-plugins validation ==="
echo ""

# ── 1. Plugin Validation (HARD) ──────────────────────────────────────────────
CLAUDE_CMD=""
if command -v claude >/dev/null 2>&1; then
  CLAUDE_CMD="claude"
elif [ -x "$HOME/.claude/local/node_modules/.bin/claude" ]; then
  CLAUDE_CMD="$HOME/.claude/local/node_modules/.bin/claude"
elif [ -x "$HOME/.claude/bin/claude" ]; then
  CLAUDE_CMD="$HOME/.claude/bin/claude"
fi

if [ -n "$CLAUDE_CMD" ]; then
  echo "[1/5] Plugin validation (claude CLI)"

  if ! "$CLAUDE_CMD" plugin validate . 2>&1; then
    hard_fail "marketplace validation failed"
  fi

  if [ -d "plugins" ]; then
    for d in plugins/*/; do
      [ -d "$d" ] || continue
      if ! "$CLAUDE_CMD" plugin validate "$d" 2>&1; then
        hard_fail "plugin validation failed: $d"
      fi
    done
  fi

  # Agent config JSON syntax
  if [ -d "agents" ]; then
    for agent_dir in agents/*/; do
      [ -d "$agent_dir" ] || continue
      if [ -f "$agent_dir/config/agent.json" ]; then
        if ! jq . "$agent_dir/config/agent.json" >/dev/null 2>&1; then
          hard_fail "invalid JSON: $agent_dir/config/agent.json"
        fi
      fi
    done
  fi
else
  echo "[1/5] Plugin validation (SKIPPED — claude CLI not found)"
fi

echo ""

# ── 2. Shell Scripts (HARD) ──────────────────────────────────────────────────
echo "[2/5] ShellCheck"

if command -v shellcheck >/dev/null 2>&1; then
  SHELL_FILES=()
  while IFS= read -r -d '' f; do
    SHELL_FILES+=("$f")
  done < <(find tooling plugins agents -type f -name "*.sh" -print0 2>/dev/null)

  if [ ${#SHELL_FILES[@]} -gt 0 ]; then
    if ! shellcheck --severity=warning "${SHELL_FILES[@]}" 2>&1; then
      hard_fail "shellcheck violations found"
    else
      echo "  OK: ${#SHELL_FILES[@]} scripts clean"
    fi
  else
    echo "  OK: no shell scripts found"
  fi
else
  echo "  SKIP: shellcheck not installed"
fi

echo ""

# ── 3. Markdown (SOFT) ──────────────────────────────────────────────────────
echo "[3/5] Markdown lint"

if command -v markdownlint >/dev/null 2>&1; then
  if ! markdownlint "**/*.md" 2>&1; then
    soft_warn "markdownlint violations (non-blocking)"
  else
    echo "  OK: markdown clean"
  fi
else
  echo "  SKIP: markdownlint not installed"
fi

echo ""

# ── 4. GitHub Actions Workflows (HARD) ───────────────────────────────────────
echo "[4/5] ActionLint"

if command -v actionlint >/dev/null 2>&1; then
  if [ -d ".github/workflows" ]; then
    if ! actionlint .github/workflows/*.yml 2>&1; then
      hard_fail "actionlint violations found"
    else
      echo "  OK: workflows clean"
    fi
  else
    echo "  OK: no workflows directory"
  fi
else
  echo "  SKIP: actionlint not installed"
fi

echo ""

# ── 5. JSON Syntax (HARD) ───────────────────────────────────────────────────
echo "[5/5] JSON syntax"

JSON_COUNT=0
JSON_ERRORS=0
while IFS= read -r -d '' f; do
  JSON_COUNT=$((JSON_COUNT + 1))
  if ! jq . "$f" >/dev/null 2>&1; then
    hard_fail "invalid JSON: $f"
    JSON_ERRORS=$((JSON_ERRORS + 1))
  fi
done < <(find . -name "*.json" -not -path "*/node_modules/*" -not -path "*/.git/*" -print0)

if [ "$JSON_ERRORS" -eq 0 ]; then
  echo "  OK: $JSON_COUNT JSON files valid"
fi

echo ""

# ── Summary ─────────────────────────────────────────────────────────────────
echo "=== Results ==="

if [ "$HARD_FAILURES" -gt 0 ]; then
  echo "FAILED: $HARD_FAILURES hard failure(s), $SOFT_WARNINGS warning(s)"
  echo ""
  echo "Fix hard failures before merging."
  EXIT_CODE=1
else
  echo "PASSED: 0 failures, $SOFT_WARNINGS warning(s)"
  EXIT_CODE=0
fi

exit "$EXIT_CODE"
