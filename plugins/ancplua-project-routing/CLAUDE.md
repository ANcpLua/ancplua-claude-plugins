# ancplua-project-routing

SessionStart hook that auto-routes Claude to specialist agents based on `$PWD`.

## Files

| File | Purpose |
|------|---------|
| `hooks/hooks.json` | Declares SessionStart hook |
| `hooks/project-routing.sh` | Maps directory patterns to specialist agents |

## Routing Table

| Directory Pattern | Specialist Agents |
|-------------------|-------------------|
| ErrorOrX | erroror-generator-specialist |
| ANcpLua.Analyzers | ancplua-analyzers-specialist |
| ANcpLua.NET.Sdk | ancplua-sdk-specialist, msbuild-expert |
| ANcpLua.Roslyn.Utilities | (caution: shared dependency) |
| qyl | qyl-observability-specialist, servicedefaults-specialist |
| Template | template-clean-arch-specialist |
| ancplua-claude-plugins | Plugin rules (no C#, skills only) |

## Notes

- Hook-only plugin. No skills, commands, or agents.
- Each routing context includes key patterns, available skills, and verification commands.
