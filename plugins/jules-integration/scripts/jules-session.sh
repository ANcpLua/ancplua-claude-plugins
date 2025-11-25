#!/usr/bin/env bash
set -euo pipefail

# Jules Session Creator
# Creates a new Jules AI session via the API
#
# Usage: ./jules-session.sh "Your task description"
#
# Required environment variable: JULES_API_KEY

PROMPT="${1:-}"
BRANCH="${2:-main}"
REPO="${3:-}"

if [ -z "$PROMPT" ]; then
  echo "Usage: $0 \"task description\" [branch] [owner/repo]"
  echo ""
  echo "Example:"
  echo "  $0 \"Add unit tests for auth module\""
  echo "  $0 \"Fix the bug\" feature-branch ANcpLua/my-repo"
  exit 1
fi

if [ -z "${JULES_API_KEY:-}" ]; then
  echo "Error: JULES_API_KEY environment variable is not set"
  echo ""
  echo "Get your API key from: https://jules.google (Settings page)"
  echo "Then run: export JULES_API_KEY='your-key-here'"
  exit 1
fi

# Auto-detect repo from git if not provided
if [ -z "$REPO" ]; then
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  if [ -n "$REMOTE_URL" ]; then
    # Extract owner/repo from git URL
    REPO=$(echo "$REMOTE_URL" | sed -E 's#.*(github\.com[:/])([^/]+/[^/.]+)(\.git)?#\2#')
  fi
fi

if [ -z "$REPO" ]; then
  echo "Error: Could not detect repository. Please provide owner/repo as third argument."
  exit 1
fi

echo "Creating Jules session..."
echo "  Repo:   $REPO"
echo "  Branch: $BRANCH"
echo "  Task:   $PROMPT"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  'https://jules.googleapis.com/v1alpha/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  -d "{
    \"prompt\": $(echo "$PROMPT" | jq -Rs .),
    \"sourceContext\": {
      \"source\": \"sources/github/$REPO\",
      \"githubRepoContext\": {
        \"startingBranch\": \"$BRANCH\"
      }
    },
    \"automationMode\": \"AUTO_CREATE_PR\",
    \"requirePlanApproval\": true,
    \"title\": $(echo "$PROMPT" | head -c 100 | jq -Rs .)
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Jules API returned HTTP $HTTP_CODE"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi

SESSION_ID=$(echo "$BODY" | jq -r '.id')
# SESSION_NAME available for future use: $(echo "$BODY" | jq -r '.name')

echo "Session created successfully!"
echo ""
echo "  Session ID: $SESSION_ID"
echo "  View at:    https://jules.google/session/$SESSION_ID"
echo ""
echo "Next steps:"
echo "  1. Visit the URL above to monitor the session"
echo "  2. Review and approve the plan Jules generates"
echo "  3. Monitor progress and provide feedback if needed"
echo "  4. Review and merge the resulting PR"
