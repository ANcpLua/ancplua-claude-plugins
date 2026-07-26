# Changelog

All notable changes to the Council plugin are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-07-26

Model refresh plus a correctness pass against the current agent-teams API. Three of these
were latent defects, not cosmetics: the plugin as shipped in 1.3.1 could not run.

### Changed

- **The captain is Fable 5 and is now explicitly the session lead.** `agents/opus-captain.md`
  is renamed `agents/fable-captain.md` with `model: fable`. The file documents that it is a
  contract the main session adopts, and refuses to run if it detects it was spawned as a
  teammate.
- **The three teammates are Opus 5**: `opus-synthesizer`, `opus-clarity`, `opus-janitor` now
  declare `model: opus`.
- **Models are declared as aliases, not pinned IDs.** 1.3.1 hard-coded `claude-opus-4-8` in
  21 places across the agents, command, and README, and rotted silently when the generation
  turned over. `fable` and `opus` track the current generation.

### Removed

- **`TeamCreate` and `TeamDelete`.** Both tools no longer exist. The command's `allowed-tools`
  listed them and orchestration steps 3 and 11 called them, so the documented flow could not
  execute. The team now forms implicitly on the first teammate spawn, and its directories are
  cleaned up automatically when the session ends.
- **`team_name` arguments on every `Task` spawn.** The input is accepted but ignored and is
  deprecated; passing it implied a team scoping that no longer exists.

### Fixed

- **The captain could not have orchestrated anything.** 1.3.1 spawned `opus-captain` as an
  agent and then instructed it to spawn three teammates. Agent teams forbid nested teams —
  only the lead may spawn teammates — and the lead is fixed to the main session for its
  lifetime. A captain spawned as a teammate would have deadlocked the council.
- **The "differentiated effort" claim in the README was never true for teammates.** Teammates
  inherit the lead's effort level; a teammate's own `effort:` frontmatter does not apply. The
  field is retained because it still governs these definitions when run as ordinary subagents,
  and the README and command now say which case is which.

### Added

- **A preflight step.** Agent teams are experimental and disabled by default; `/council` now
  checks for `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and fails loudly rather than degrading
  silently to fire-and-forget subagents, which would remove the synthesizer↔clarity cross-talk
  that justifies the plugin.
- **A "Mechanics that constrain this design" section** in `commands/council.md`, recording the
  team properties that are not the plugin's choices: fixed lead, no nested teams, teammates
  not inheriting the lead's model or conversation history, `skills`/`mcpServers` frontmatter
  being ignored for teammates, and `SendMessage` always being available.
- **This changelog**, matching the convention already used by the Charon plugin.
