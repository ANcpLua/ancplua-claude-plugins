# ADR-0003-jules-agent-delegation

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

## Context and Problem Statement

Claude Code agents can handle real-time coding tasks effectively. However, some tasks benefit from asynchronous processing:
- Long-running refactors
- Multi-file documentation updates
- Comprehensive test additions
- Background bug analysis

Google's Jules AI provides asynchronous coding capabilities via API. We need to decide how to integrate Jules into this ecosystem.

---

## Decision Drivers

1. **Complementary capabilities** - Jules handles async, Claude handles interactive
2. **Safety** - No autonomous code changes without human review
3. **Simplicity** - Easy to create and monitor sessions
4. **Security** - API keys must never be exposed
5. **Discoverability** - Integration via existing plugin/skill patterns

---

## Considered Options

### Option A: Direct API calls only

Provide documentation for manual API usage.

**Pros:**
- No code to maintain
- Maximum flexibility

**Cons:**
- Poor developer experience
- Easy to make mistakes (wrong params, security issues)
- No skill/command integration

### Option B: GitHub Action integration

Use a GitHub Action (like `BeksOmega/jules-action`).

**Pros:**
- Familiar GitHub Actions workflow
- CI/CD integration

**Cons:**
- `BeksOmega/jules-action@v1` returns 404 (doesn't exist)
- No official Jules GitHub Action available
- Dependency on third-party action

### Option C: Plugin with skill, command, and API wrapper (Selected)

Create a Claude Code plugin that wraps the Jules API with skill, command, and script.

**Pros:**
- Integrated into plugin ecosystem
- Skill provides guidance on when/how to use Jules
- Command provides quick invocation
- Script provides automation
- Safety settings enforced by default

**Cons:**
- Code to maintain
- API changes require updates

---

## Decision Outcome

**Selected: Option C - Plugin with skill, command, and API wrapper**

The `jules-integration` plugin provides:
1. **Skill** - Guides when to delegate to Jules
2. **Command** - `/jules "task"` for quick invocation
3. **Script** - `jules-session.sh` for automation
4. **Workflow** - GitHub Actions for CI-triggered tasks

Safety enforced via:
- `requirePlanApproval: true` (always)
- `automationMode: "AUTO_CREATE_PR"` (no auto-merge)
- API key via environment/secrets only

---

## Consequences

### Good

- Seamless integration with Claude Code workflow
- Consistent safety defaults
- Discoverable via plugin marketplace
- Extensible for future Jules features

### Bad

- Requires maintaining API wrapper code
- Jules API changes may break integration
- Users need separate Jules setup (API key, GitHub connection)

### Neutral

- Jules remains optional (plugin can be uninstalled)
- Async and interactive workflows remain separate

---

## Implementation Notes

### AGENTS.md Discovery

Jules automatically reads `AGENTS.md` from repo root. This file provides:
- Repository overview
- Coding conventions
- Constraints for Jules tasks

**Key finding:** `jules.yml` does NOT exist as a configuration file. Jules uses `AGENTS.md`.

### API Authentication

```bash
export JULES_API_KEY="key-from-jules.google-settings"
```

For GitHub Actions:
```yaml
env:
  JULES_API_KEY: ${{ secrets.JULES_API_KEY }}
```

### No Official GitHub Action

As of 2025-11-25, there is no official Jules GitHub Action. The workflow uses direct API calls via `curl`.

---

## Related Documents

- [spec-0004-jules-integration](../specs/spec-0004-jules-integration.md)
- [Jules API Documentation](https://developers.google.com/jules/api)
- [Jules Getting Started](https://jules.google/docs/)

---

## References

- https://jules.google
- https://developers.google.com/jules/api
- https://blog.google/technology/google-labs/jules/
