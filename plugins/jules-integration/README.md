# Jules Integration Plugin

Integration with [Google Jules](https://jules.google) - an asynchronous AI coding agent.

## What is Jules?

Jules is Google's experimental coding agent that:
- Runs tasks asynchronously in the cloud
- Clones your repo, installs dependencies, modifies files
- Creates PRs with changes for you to review
- Works while you focus on other things

## Installation

```bash
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install jules-integration@ancplua-claude-plugins
```

## Setup

1. **Get API Key**
   - Visit https://jules.google
   - Sign in with Google
   - Go to Settings > API Keys
   - Create a new key

2. **Connect Repository**
   - In Jules web app, connect your GitHub account
   - Select the repositories Jules can access

3. **Configure API Key**

   For local use:
   ```bash
   export JULES_API_KEY="your-key-here"
   ```

   For GitHub Actions:
   - Go to repo Settings > Secrets > Actions
   - Add `JULES_API_KEY` secret

## Usage

### Skill

The `jules-integration` skill activates when discussing async coding tasks.

### Command

```bash
/jules "Add unit tests for the authentication module"
```

### Script

```bash
./plugins/jules-integration/scripts/jules-session.sh "Your task"
```

### GitHub Actions

Trigger the `jules-review.yml` workflow manually with your prompt.

## Example Tasks

- `"Fix the N+1 query in UserRepository"`
- `"Add JSDoc comments to all exported functions"`
- `"Write integration tests for the checkout flow"`
- `"Refactor legacy auth code to async/await"`

## Safety

- **Plan approval required** - Review before Jules acts
- **No auto-merge** - PRs require manual merge
- **API key security** - Never commit keys to repo

## Resources

- [Jules Web App](https://jules.google)
- [Jules API Documentation](https://developers.google.com/jules/api)
- [Jules CLI Tool](https://www.npmjs.com/package/@google/jules)
- [Getting Started Guide](https://jules.google/docs/)

## License

MIT
