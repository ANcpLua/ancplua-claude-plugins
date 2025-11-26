# spec-0004-jules-integration

## Metadata

| Field | Value |
|-------|-------|
| **Status** | accepted |
| **Date** | 2025-11-25 |
| **Contact** | AncpLua |
| **Deciders** | AncpLua |
| **Consulted** | - |
| **Informed** | Users of ancplua-claude-plugins |

---

## Problem / Goal

Enable Claude Code agents and users to delegate asynchronous coding tasks to Google's Jules AI
agent. Jules can run background tasks (bug fixes, documentation, tests) while users continue
other work.

---

## Success Metrics

1. Users can create Jules sessions via plugin skill/command
2. Jules reads `AGENTS.md` for codebase context
3. Sessions require plan approval (no auto-execution)
4. PRs created by Jules require manual merge
5. API key security maintained (never committed)

---

## Outcome

### Components Created

1. **`AGENTS.md`** (repo root)
   - Context file Jules reads automatically
   - Describes agents, conventions, constraints

2. **`plugins/jules-integration/`**
   - Plugin manifest (`plugin.json`)
   - Skill (`skills/jules-integration/SKILL.md`)
   - Command (`commands/jules.md`)
   - Script (`scripts/jules-session.sh`)

3. **`.github/workflows/jules-review.yml`**
   - GitHub Actions workflow for Jules API calls
   - Manual trigger with prompt input
   - Creates sessions via API (not GitHub Action)

4. **`agents/AGENTS_BASE.md`**
   - Shared foundation prompt for all agents
   - Includes Jules delegation workflows

### Integration Points

| Component | Integration |
|-----------|-------------|
| Jules API | `https://jules.googleapis.com/v1alpha/*` |
| Auth | `X-Goog-Api-Key` header with `JULES_API_KEY` |
| Context | `AGENTS.md` in repo root |
| Output | PR created on GitHub |

---

## API Usage

### Create Session

```bash
curl 'https://jules.googleapis.com/v1alpha/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  -d '{
    "prompt": "Task description",
    "sourceContext": {
      "source": "sources/github/OWNER/REPO",
      "githubRepoContext": { "startingBranch": "main" }
    },
    "automationMode": "AUTO_CREATE_PR",
    "requirePlanApproval": true
  }'
```

### Safety Settings

| Setting | Value | Reason |
|---------|-------|--------|
| `requirePlanApproval` | `true` | Human reviews plan before execution |
| `automationMode` | `AUTO_CREATE_PR` | Creates PR, doesn't merge |

---

## Security Considerations

1. **API Key Storage**
   - Local: Environment variable `$JULES_API_KEY`
   - CI: GitHub Secret `JULES_API_KEY`
   - Never committed to repository

2. **Permissions**
   - Jules has repo read access via GitHub OAuth
   - Jules creates branches and PRs
   - Merge requires human approval

3. **Constraints in AGENTS.md**
   - No auto-merge
   - No workflow modifications
   - Respect branch protection

---

## Related Documents

- [ADR-0003-jules-agent-delegation](../decisions/ADR-0003-jules-agent-delegation.md)
- [Jules API Documentation](https://developers.google.com/jules/api)
- [Jules Getting Started](https://jules.google/docs/)

---

## Future Enhancements

- [ ] Webhook for session completion notifications
- [ ] MCP server for Jules API (programmatic access)
- [ ] Session monitoring dashboard
- [ ] Multi-session orchestration
