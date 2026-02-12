#!/bin/bash
# Monitor GitHub Actions and wait for completion
# Usage: ./wait-for-ci.sh [commit-sha]

set -e

COMMIT_SHA=${1:-$(git rev-parse HEAD)}
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "⏳ Monitoring CI for commit: $COMMIT_SHA"
echo "📍 Repository: $REPO"
echo ""

# Wait a few seconds for workflow to start
sleep 5

# Get all workflow runs for this commit
echo "🔍 Finding workflow runs..."
RUNS=$(gh run list --commit "$COMMIT_SHA" --json databaseId,name,status,conclusion)

if [ -z "$RUNS" ] || [ "$RUNS" = "[]" ]; then
  echo "❌ No workflow runs found for commit $COMMIT_SHA"
  echo "   Workflows may not have started yet. Wait a moment and try again."
  exit 1
fi

# Parse run IDs and names
RUN_COUNT=$(echo "$RUNS" | jq '. | length')
echo "📊 Found $RUN_COUNT workflow(s) for this commit"
echo ""

# Monitor each workflow
SUCCESS_COUNT=0
FAILED_WORKFLOWS=()

for i in $(seq 0 $((RUN_COUNT - 1))); do
  RUN_ID=$(echo "$RUNS" | jq -r ".[$i].databaseId")
  RUN_NAME=$(echo "$RUNS" | jq -r ".[$i].name")

  echo "⏳ Monitoring: $RUN_NAME (ID: $RUN_ID)"
  echo "🔗 View at: https://github.com/$REPO/actions/runs/$RUN_ID"

  # Watch this workflow (blocks until completion)
  gh run watch "$RUN_ID" --interval 10 2>/dev/null || true

  # Check conclusion
  CONCLUSION=$(gh run view "$RUN_ID" --json conclusion -q .conclusion)

  if [ "$CONCLUSION" = "success" ]; then
    echo "✅ $RUN_NAME: PASSED"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "❌ $RUN_NAME: FAILED (conclusion: $CONCLUSION)"
    FAILED_WORKFLOWS+=("$RUN_NAME:$RUN_ID")
  fi

  echo ""
done

# Report final status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#FAILED_WORKFLOWS[@]} -eq 0 ]; then
  echo "✅ ALL CI CHECKS PASSED!"
  echo ""
  echo "Summary:"
  echo "  Total workflows: $RUN_COUNT"
  echo "  Passed: $SUCCESS_COUNT"
  echo "  Failed: 0"
  echo ""
  echo "Commit $COMMIT_SHA is verified ✨"
  exit 0
else
  echo "❌ CI FAILED!"
  echo ""
  echo "Summary:"
  echo "  Total workflows: $RUN_COUNT"
  echo "  Passed: $SUCCESS_COUNT"
  echo "  Failed: ${#FAILED_WORKFLOWS[@]}"
  echo ""
  echo "Failed workflows:"
  for workflow_info in "${FAILED_WORKFLOWS[@]}"; do
    IFS=':' read -r name id <<< "$workflow_info"
    echo "  ❌ $name"
    echo "     Logs: gh run view $id --log-failed"
    echo "     URL: https://github.com/$REPO/actions/runs/$id"
  done
  echo ""
  echo "🔍 View failed logs with:"
  echo "   gh run view ${FAILED_WORKFLOWS[0]##*:} --log-failed"
  exit 1
fi
