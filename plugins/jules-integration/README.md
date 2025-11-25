# Jules Integration Plugin

Integration with [Google Jules](https://jules.google) - your personal asynchronous AI coding assistant.

## What is Jules?

Jules is Google's experimental coding agent powered by Gemini 2.5 Pro. It works as your **personal coding assistant** that:

- Runs tasks asynchronously in the cloud while you focus elsewhere
- Clones your repo, installs dependencies, modifies files autonomously
- Creates PRs with changes for you to review
- Understands your codebase via `AGENTS.md` context
- Handles complex, multi-file changes with speed and precision

**Use Jules for:**

- Bug fixes and debugging
- Adding documentation
- Writing tests
- Code refactoring
- Feature implementation

## Installation

```bash
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install jules-integration@ancplua-claude-plugins
```

## Setup

### 1. Get API Key

- Visit [jules.google](https://jules.google)
- Sign in with Google
- Go to Settings > API Keys
- Create a new key

### 2. Connect Repository

- In Jules web app, connect your GitHub account
- Select the repositories Jules can access

### 3. Configure API Key

**For local use:**

```bash
export JULES_API_KEY="your-key-here"
```

**For GitHub Actions:**

- Go to repo Settings > Secrets > Actions
- Add `JULES_API_KEY` secret

### 4. Install Jules CLI (Recommended)

```bash
npm install -g @google/jules
jules login
```

## Usage

### Jules CLI (Recommended)

```bash
# Create a new task
jules remote new --repo . --session "Add unit tests for auth module"

# List your sessions
jules remote list --session

# List connected repos
jules remote list --repo

# Interactive dashboard
jules
```

### Claude Code Skill

The `jules-integration` skill activates when discussing async coding tasks.

### Claude Code Command

```bash
/jules "Add unit tests for the authentication module"
```

### Shell Script

```bash
./plugins/jules-integration/scripts/jules-session.sh "Your task"
```

### GitHub Actions

Trigger the `jules-review.yml` workflow manually with your prompt.

### MCP Integration (Autonomous)

If you have an MCP server with Jules tools (like `ancplua-mcp`), Claude can call Jules autonomously:

```text
# Claude can invoke Jules via MCP tools
mcp__jules__InvokeJules(owner, repo, prNumber, request)
mcp__jules__CheckJulesConfig(owner, repo)
```

This enables fully autonomous workflows where Claude delegates tasks to Jules without manual intervention.

### Direct API

```bash
curl 'https://jules.googleapis.com/v1alpha/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  -d '{
    "prompt": "Your task description",
    "sourceContext": {
      "source": "sources/github/OWNER/REPO",
      "githubRepoContext": { "startingBranch": "main" }
    },
    "automationMode": "AUTO_CREATE_PR",
    "requirePlanApproval": true
  }'
```

## AGENTS.md Context

Jules automatically reads `AGENTS.md` from your repository root. This file helps Jules understand:

- Repository structure and conventions
- Coding standards and patterns
- Constraints and safety rules
- How to interact with your codebase

Keep `AGENTS.md` up to date for better results.

## Example Prompts

**Bug Fixes:**

- `"Fix the N+1 query in UserRepository.GetAll()"`
- `"Debug why the login form fails on mobile"`

**Documentation:**

- `"Add JSDoc comments to all exported functions in src/utils/"`
- `"Write a README for the authentication module"`

**Testing:**

- `"Write integration tests for the checkout flow"`
- `"Add unit tests for parseQueryString function in utils.js"`

**Refactoring:**

- `"Refactor legacy auth code to async/await"`
- `"Convert CommonJS modules to ES modules"`

## Workflow

1. **Create Session** - Submit your task via CLI, API, or command
2. **Review Plan** - Jules generates a plan; approve it at [jules.google](https://jules.google)
3. **Monitor Progress** - Watch Jules work in real-time
4. **Review PR** - Jules creates a PR with changes
5. **Merge** - Review and merge manually (no auto-merge)

## Safety

- **Plan approval required** - Review before Jules acts
- **No auto-merge** - PRs require manual merge
- **API key security** - Never commit keys to repo
- **Constrained scope** - Define limits in `AGENTS.md`

## Notifications

Enable browser notifications in Jules to stay informed:

- Task completion alerts
- When Jules needs your input
- Plan ready for review

Go to Settings > Notifications in the Jules web app.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Source not found" | Connect repo at [jules.google](https://jules.google) first |
| "401 Unauthorized" | Check API key is valid |
| Session stuck | Check [jules.google](https://jules.google) for status; may need feedback |
| Bad PR | Reject plan, provide clearer instructions |

## Resources

- [Jules Web App](https://jules.google) - Main interface for managing sessions
- [Jules API Documentation](https://developers.google.com/jules/api) - REST API reference
- [Getting Started Guide](https://jules.google/docs/) - Official onboarding docs
- [Jules CLI Tool](https://www.npmjs.com/package/@google/jules) - `@google/jules` npm package
- [Jules Announcement](https://blog.google/technology/google-labs/jules/) - Google Labs blog post
- [Jules Changelog](https://jules.google/docs/changelog/) - Latest updates and features

## License

MIT
