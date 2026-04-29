# Claude Code Patch Notes Overview
## Latest 10 Releases (v2.1.122 → v2.1.113)

---

## v2.1.122 (April 28, 2026)

### New Features

- **Bedrock Service Tier Selection**: Added `ANTHROPIC_BEDROCK_SERVICE_TIER` environment variable to select a service tier 
  (`default`, `flex`, or `priority`), sent as the `X-Amzn-Bedrock-Service-Tier` header
- **PR URL Resume**: Pasting a PR URL into the `/resume` search box now finds the session that created that PR (supports GitHub, 
  GitHub Enterprise, GitLab, and Bitbucket)
- **MCP Server Improvements**: `/mcp` now shows claude.ai connectors hidden by manually-added servers with the same URL,
  including a hint to remove duplicates
- **OpenTelemetry Enhancements**: Numeric attributes on `api_request`/`api_error` log events are now emitted as numbers 
  instead of strings; added `claude_code.at_mention` log event for `@`-mention resolution

---

## v2.1.121 (April 27, 2026)

### New Features

- **MCP Tool Deferral Control**: Added `alwaysLoad` option to MCP server config — when `true`, all tools from that server 
  skip tool-search deferral and are always available
- **Plugin Dependency Management**: Added `claude plugin prune` to remove orphaned auto-installed plugin dependencies; 
  `plugin uninstall --prune` cascades
- **Skill Search**: Added a type-to-filter search box to `/skills` so you can find a skill in long lists without scrolling
- **Enhanced Hook Output**: PostToolUse hooks can now replace tool output for all tools via `hookSpecificOutput.updatedToolOutput` 
  (previously MCP-only)
- **Fullscreen Improvements**: Typing into the prompt no longer jumps scroll back to the bottom after you've scrolled up to 
  read earlier output
- **Scrollable Dialogs**: Dialogs that overflow the terminal are now scrollable with arrow keys, PgUp/PgDn, home/end, and 
  mouse wheel in both fullscreen and non-fullscreen modes

---

## v2.1.120 (April 26, 2026)

### New Features

- **Windows Shell Defaults**: Git for Windows (Git Bash) is no longer required — when absent, Claude Code uses PowerShell 
  as the shell tool
- **Ultrareview CLI**: Added `claude ultrareview [target]` subcommand to run `/ultrareview` non-interactively from CI 
  or scripts
- **Skill Environment Variables**: Skills can now reference the current effort level with `${CLAUDE_EFFORT}` in their content
- **Agent Attribution**: Set `AI_AGENT` environment variable for subprocesses so `gh` can attribute traffic to Claude Code
- **Faster Sessions**: Session start is faster when you have many claude.ai connectors configured but not authorized

---

## v2.1.119 (April 24, 2026)

### New Features

- **Settings Persistence**: `/config` settings (theme, editor mode, verbose, etc.) now persist to `~/.claude/settings.json` 
  and participate in project/local/policy override precedence
- **Custom PR URLs**: Added `prUrlTemplate` setting to point the footer PR badge at a custom code-review URL instead of github.com
- **CWD Visibility Control**: Added `CLAUDE_CODE_HIDE_CWD` environment variable to hide the working directory in the startup logo
- **Extended PR Support**: `--from-pr` now accepts GitLab merge-request, Bitbucket pull-request, and GitHub Enterprise PR URLs
- **Print Mode Improvements**: `--print` mode now honors the agent's `tools:` and `disallowedTools:` frontmatter, matching 
  interactive-mode behavior
- **Agent Permission Modes**: `--agent <name>` now honors the agent definition's `permissionMode` for built-in agents

---

## v2.1.118 (April 23, 2026)

### New Features

- **Vim Visual Mode**: Added vim visual mode (`v`) and visual-line mode (`V`) with selection, operators, and visual feedback
- **Unified Metrics Dashboard**: Merged `/cost` and `/stats` into `/usage` — both remain as typing shortcuts that open the 
  relevant tab
- **Custom Themes**: Create and switch between named custom themes from `/theme`, or hand-edit JSON files in `~/.claude/themes/`; 
  plugins can also ship themes
- **MCP Tool Hooks**: Hooks can now invoke MCP tools directly via `type: "mcp_tool"`
- **Update Control**: Added `DISABLE_UPDATES` env var to completely block all update paths including manual `claude update` 
  — stricter than `DISABLE_AUTOUPDATER`
- **WSL Settings Inheritance**: WSL on Windows can now inherit Windows-side managed settings via the `wslInheritsWindowsSettings` 
  policy key

---

## v2.1.117 (April 22, 2026)

### New Features

- **Forked Subagents**: Forked subagents can now be enabled on external builds by setting `CLAUDE_CODE_FORK_SUBAGENT=1`
- **Agent MCP Servers**: Agent frontmatter `mcpServers` are now loaded for main-thread agent sessions via `--agent`
- **Model Selection Persistence**: `/model` selections now persist across restarts even when the project pins a different model; 
  startup header shows when the active model comes from a project or managed-settings pin
- **Session Summarization**: `/resume` command now offers to summarize stale, large sessions before re-reading them, matching 
  the existing `--resume` behavior
- **Concurrent MCP Startup**: Faster startup when both local and claude.ai MCP servers are configured (concurrent connect now default)
- **Plugin Dependency Auto-Install**: `plugin install` on an already-installed plugin now installs any missing dependencies instead 
  of stopping at "already installed"
- **Managed Settings Enforcement**: `blockedMarketplaces` and `strictKnownMarketplaces` are now enforced on plugin install, update, 
  refresh, and autoupdate
- **Native Build Tools**: The `Glob` and `Grep` tools are replaced by embedded `bfs` and `ugrep` available through the Bash tool 
  on macOS and Linux

---

## v2.1.116 (April 20, 2026)

### New Features

- **Large Session Speed**: `/resume` on large sessions is significantly faster (up to 67% on 40MB+ sessions) and handles sessions 
  with many dead-fork entries more efficiently
- **MCP Startup Performance**: Faster MCP startup when multiple stdio servers are configured; `resources/templates/list` is now 
  deferred to first `@`-mention
- **Fullscreen Scrolling**: Smoother fullscreen scrolling in VS Code, Cursor, and Windsurf terminals — `/terminal-setup` now 
  configures the editor's scroll sensitivity
- **Thinking Progress**: Thinking spinner now shows progress inline ("still thinking", "thinking more", "almost done thinking"), 
  replacing the separate hint row
- **Config Search**: `/config` search now matches option values (e.g. searching "vim" finds the Editor mode setting)
- **Doctor in Progress**: `/doctor` can now be opened while Claude is responding, without waiting for the current turn to finish
- **Plugin Auto-Install Dependencies**: `/reload-plugins` and background plugin auto-update now auto-install missing plugin 
  dependencies from marketplaces you've already added
- **GitHub Rate Limit Hints**: Bash tool now surfaces a hint when `gh` commands hit GitHub's API rate limit, so agents can back 
  off instead of retrying
- **Agent Hook Support**: Agent frontmatter `hooks:` now fire when running as a main-thread agent via `--agent`

---

## v2.1.115 (April 19, 2026)

*No significant new features in this release - minor improvements and bug fixes*

---

## v2.1.114 (April 18, 2026)

*Bug fix release focusing on permission dialog crash resolution*

---

## v2.1.113 (April 17, 2026)

### New Features

- **Native Binary Launch**: Changed the CLI to spawn a native Claude Code binary (via a per-platform optional dependency) instead 
  of bundled JavaScript
- **Network Security**: Added `sandbox.network.deniedDomains` setting to block specific domains even when a broader `allowedDomains` 
  wildcard would otherwise permit them
- **Fullscreen Selection**: Shift+↑/↓ now scrolls the viewport when extending a selection past the visible edge
- **Line Navigation**: `Ctrl+A` and `Ctrl+E` now move to the start/end of the current logical line in multiline input, matching 
  readline behavior
- **Windows Input**: `Ctrl+Backspace` now deletes the previous word
- **Clickable URLs**: Long URLs in responses and bash output stay clickable when they wrap across lines (in terminals with OSC 8 
  hyperlinks)
- **Loop Improvements**: Pressing Esc now cancels pending wakeups, and wakeups display as "Claude resuming /loop wakeup" for clarity
- **Remote Control Expansion**: `/extra-usage` now works from Remote Control (mobile/web) clients; Remote Control clients can now 
  query `@`-file autocomplete suggestions
- **Ultrareview Speed**: Improved `/ultrareview` with faster launch via parallelized checks, diffstat in the launch dialog, and 
  animated launching state
- **Subagent Timeouts**: Subagents that stall mid-stream now fail with a clear error after 10 minutes instead of hanging silently
- **Bash Tool Improvements**: Multi-line commands whose first line is a comment now show the full command in the transcript

---

## Summary

Over the last 10 patches (April 17-28, 2026), Claude Code has focused on:

- **Performance**: Faster session resumption, MCP startup, and fullscreen scrolling
- **User Experience**: Better theme support, improved settings persistence, enhanced navigation
- **Integrations**: Extended PR support, MCP tool improvements, Remote Control expansion
- **Developer Tools**: Native binary launch, plugin dependency management, agent enhancements
- **Security**: Network domain blocking, improved path handling, permission dialog fixes
- **Automation**: Loop improvements, subagent timeouts, hook enhancements
