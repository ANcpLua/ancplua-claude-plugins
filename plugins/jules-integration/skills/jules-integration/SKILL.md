---
name: jules-integration
description: Use when delegating async coding tasks to Jules AI. Helps create Jules sessions, monitor progress, and integrate results. Use for bug fixes, documentation, tests, or refactoring that can run in the background.
---

# Jules Integration Skill

## Overview

Jules is Google's asynchronous AI coding agent. It runs tasks in the background on a cloud VM, clones your repo, and creates PRs with changes.

**When to use Jules:**
- Bug fixes that need deep codebase analysis
- Documentation improvements across many files
- Test suite additions
- Code cleanup and refactoring
- Tasks you want to run while you focus elsewhere

**When NOT to use Jules:**
- Quick, simple changes (do them directly)
- Tasks requiring real-time interaction
- Changes to CI/CD workflows (handle manually)

## Prerequisites

1. **Jules API Key** - Get from https://jules.google (Settings)
2. **GitHub connected** - Your repo must be connected to Jules
3. **AGENTS.md** - Should exist in repo root (Jules reads it for context)

## Creating a Jules Session

### Via API (recommended)

```bash
export JULES_API_KEY="your-key-here"

curl 'https://jules.googleapis.com/v1alpha/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  -d '{
    "prompt": "YOUR TASK DESCRIPTION HERE",
    "sourceContext": {
      "source": "sources/github/OWNER/REPO",
      "githubRepoContext": { "startingBranch": "main" }
    },
    "automationMode": "AUTO_CREATE_PR",
    "requirePlanApproval": true
  }'
```

### Via Jules CLI

```bash
npm install -g @google/jules
jules login
jules remote new --repo . --session "YOUR TASK"
```

### Via GitHub Actions

Trigger the `jules-review.yml` workflow manually with your prompt.

## Session Workflow

1. **Create Session** - Jules starts analyzing your codebase
2. **Review Plan** - Jules generates a plan; approve it at jules.google
3. **Monitor Progress** - Watch Jules work in real-time
4. **Review PR** - Jules creates a PR with changes
5. **Merge** - Review and merge manually

## Best Practices

### Writing Good Prompts

**Do:**
- Be specific: "Add unit tests for `parseQueryString` in `utils.js`"
- Set constraints: "Do not modify public APIs"
- Define scope: "Focus on the `src/auth/` directory"

**Don't:**
- Be vague: "Make the code better"
- Skip context: "Fix the bug" (which bug?)
- Request unsafe operations: "Auto-merge when done"

### Safety Settings

Always use:
- `requirePlanApproval: true` - Review before Jules acts
- `automationMode: "AUTO_CREATE_PR"` - Creates PR, doesn't merge
- Check Jules' proposed changes before approving

## Monitoring Sessions

```bash
# List your sessions
curl 'https://jules.googleapis.com/v1alpha/sessions' \
  -H "X-Goog-Api-Key: $JULES_API_KEY"

# Get session details
curl 'https://jules.googleapis.com/v1alpha/sessions/SESSION_ID' \
  -H "X-Goog-Api-Key: $JULES_API_KEY"

# List activities (progress updates)
curl 'https://jules.googleapis.com/v1alpha/sessions/SESSION_ID/activities' \
  -H "X-Goog-Api-Key: $JULES_API_KEY"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Source not found" | Connect repo at jules.google first |
| "401 Unauthorized" | Check API key is valid |
| Session stuck | Check jules.google for status; may need feedback |
| Bad PR | Reject plan, provide clearer instructions |

## Security Notes

- **Never commit API keys** - Use environment variables or secrets
- **Review all changes** - Jules is helpful but not perfect
- **Start small** - Test with minor tasks before major refactors

## Resources

- [Jules Web App](https://jules.google)
- [Jules API Docs](https://developers.google.com/jules/api)
- [Jules CLI](https://www.npmjs.com/package/@google/jules)
- [Jules Blog Post](https://blog.google/technology/google-labs/jules/)
