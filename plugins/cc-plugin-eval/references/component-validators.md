# Component Validators

`cc-plugin-eval` ships eight Claude-native evaluators that each emit `findings` mapped to one of the `CC###` error code ranges. This document is the canonical lookup table downstream consumers cite when mapping a finding to remediation copy. See `claude-plugins-reference.md` for the underlying Claude Code component spec each evaluator validates.

## Code ranges

| Range          | Evaluator           | File                              |
| -------------- | ------------------- | --------------------------------- |
| `CC1xx`        | manifest            | `src/evaluators/manifest.js`      |
| `CC2xx`        | skill (Writer A)    | `src/evaluators/skill.js`         |
| `CC3xx`        | hooks               | `src/evaluators/hooks.js`         |
| `CC4xx`        | mcp                 | `src/evaluators/mcp.js`           |
| `CC5xx`        | lsp                 | `src/evaluators/lsp.js`           |
| `CC6xx`        | monitors            | `src/evaluators/monitors.js`      |
| `CC7xx`        | agents              | `src/evaluators/agents.js`        |
| `CC8xx`        | marketplace         | `src/evaluators/marketplace.js`   |
| `CC900-CC909`  | path traversal      | shared (any evaluator can emit)   |
| `CC910-CC919`  | userConfig safety   | `src/evaluators/userconfig.js`    |

## Manifest (`CC1xx`)

| Code  | Severity | Summary                                                                    | Fix                                                                                                  |
| ----- | -------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| CC101 | error    | `name` is missing or empty.                                                | Set `name` to a kebab-case identifier.                                                               |
| CC102 | error    | `name` does not match `[a-z0-9][a-z0-9-]*[a-z0-9]`.                        | Rewrite `name` as kebab-case (lowercase letters, digits, hyphens).                                   |
| CC103 | warn     | `version` is set but is not valid SemVer.                                  | Use `MAJOR.MINOR.PATCH` (with optional prerelease/build) or remove the field.                        |
| CC104 | info     | `$schema` is missing.                                                      | Add `"$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json"` for autocomplete.   |
| CC105 | warn     | `description` longer than 200 chars.                                       | Trim to under 200 chars; marketplace UIs truncate.                                                   |
| CC106 | warn     | `repository` is set but is not a valid URL.                                | Use an `https://` or `git+https://` URL.                                                             |
| CC107 | info     | `keywords` is empty or absent.                                             | Add at least 3 keywords for marketplace discovery.                                                   |
| CC108 | info     | `license` is absent.                                                       | Add an SPDX identifier.                                                                              |
| CC110 | warn     | `${CLAUDE_PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_DATA}` appears in metadata.    | Substitutions only fire in skill/agent content, hook/monitor commands, MCP/LSP configs.              |
| CC120 | warn     | `.claude-plugin/` contains files other than `plugin.json`.                 | Move components to the plugin root.                                                                  |
| CC130 | warn     | A path-like field does not start with `./`.                                | Prefix the value with `./`.                                                                          |
| CC131 | error    | A path-like field points to a missing file or directory.                   | Ship the referenced file or correct the path.                                                        |
| CC132 | warn     | `commands` field is set (deprecated).                                      | Use `skills/` for new plugins.                                                                       |

## Skill (`CC2xx`)

| Code  | Severity | Summary                                                                                                | Fix                                                                                          |
| ----- | -------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| CC201 | error    | Skill `description` is missing.                                                                        | Add a one-paragraph description that includes "Use when ..." trigger phrases.                |
| CC202 | warn     | Combined `description + when_to_use` exceeds 1536 chars (Claude per-entry cap).                        | Trim to under 1536 chars.                                                                    |
| CC203 | warn     | Description lacks a clear "Use when" / "Trigger" phrase.                                               | Add `Use when ...` so Claude routes to the skill reliably.                                   |
| CC204 | info     | No `Triggers on:` line and no `when_to_use` field.                                                     | Add `when_to_use` or a `Triggers on:` keyword line.                                          |
| CC205 | error    | `name` is missing.                                                                                     | Set `name` in frontmatter.                                                                   |
| CC206 | error    | `name` is not kebab-case.                                                                              | Rewrite `name` as `[a-z0-9][a-z0-9-]*[a-z0-9]`.                                              |
| CC207 | info     | Skill name does not match its directory basename.                                                      | Cosmetic; Claude tolerates mismatch when `skills` points at a directory containing SKILL.md. |
| CC208 | info     | SKILL.md exceeds 350 lines (recommended progressive-disclosure threshold).                             | Move detail into `references/`, `examples.md`, or `scripts/`.                                |
| CC209 | warn     | SKILL.md exceeds 800 lines (hard limit).                                                               | Refactor into supporting files.                                                              |
| CC210 | warn     | SKILL.md exceeds 500 lines.                                                                            | Refactor into supporting files.                                                              |
| CC211 | warn     | A relative link in the body resolves to a missing file.                                                | Fix the path or remove the link.                                                             |
| CC212 | warn     | Frontmatter contains keys outside the Claude allow-list.                                               | Remove or rename the unknown key.                                                            |
| CC213 | error    | Frontmatter does not parse.                                                                            | Fix YAML syntax.                                                                             |
| CC214 | warn     | Skill ships extra `.md` files at the same level as SKILL.md.                                           | Move docs into `references/`.                                                                |
| CC215 | warn     | `allowed-tools` uses comma-separated form or non-PascalCase tool names.                                | Use space-separated tool names; PascalCase (`Bash`, `Read`).                                 |
| CC216 | info     | Task-style skill does not set `disable-model-invocation: true`.                                        | Set `disable-model-invocation: true` if the skill must be invoked manually.                  |

## Hooks (`CC3xx`)

| Code  | Severity | Summary                                                                                                                | Fix                                                                                               |
| ----- | -------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| CC301 | error    | Hook config does not parse as JSON.                                                                                    | Fix JSON syntax.                                                                                  |
| CC302 | error    | Top-level key is not a recognized Claude hook event name.                                                              | Use a supported event such as `PostToolUse`, `SessionStart`, `UserPromptSubmit`, etc.             |
| CC303 | warn     | Event name is recognized but cased wrong (e.g. `postToolUse`).                                                         | Use the canonical case (`PostToolUse`).                                                           |
| CC304 | error    | Hook entry has a `type` other than `command`, `http`, `mcp_tool`, `prompt`, `agent`.                                   | Use a supported hook type.                                                                        |
| CC305 | warn     | `command` references `${CLAUDE_PLUGIN_ROOT}/...` and the script does not exist on disk.                                | Ship the referenced script or fix the path.                                                       |
| CC306 | warn     | `command` does not reference `${CLAUDE_PLUGIN_ROOT}` and is not an allowed system bin.                                 | Use `${CLAUDE_PLUGIN_ROOT}` for plugin scripts.                                                   |
| CC307 | info     | Tool-related event has no `matcher` field.                                                                             | Add a `matcher` to scope the hook (e.g. `"Write\|Edit"`).                                         |
| CC309 | warn     | `prompt`-type hook does not reference `$ARGUMENTS`.                                                                    | Add `$ARGUMENTS` so the hook receives context.                                                    |
| CC310 | warn     | `mcp_tool`-type hook references an MCP server name not declared in `mcpServers` or `.mcp.json`.                        | Declare the server or fix the reference.                                                          |

## MCP (`CC4xx`)

| Code  | Severity | Summary                                                                                | Fix                                                                                                  |
| ----- | -------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| CC401 | error    | `.mcp.json` does not parse, or `manifest.mcpServers` is not an object.                 | Fix the structure to match the Claude MCP server schema.                                             |
| CC402 | error    | A server entry is missing `command`.                                                   | Add a `command` value.                                                                               |
| CC403 | warn     | `command` references a `${CLAUDE_PLUGIN_ROOT}/...` script that does not exist.         | Ship the referenced binary or fix the path.                                                          |
| CC404 | warn     | `command` is a relative path without `${CLAUDE_PLUGIN_ROOT}`.                          | Prefix with `${CLAUDE_PLUGIN_ROOT}`.                                                                 |
| CC405 | warn     | `args` is set but is not an array of strings.                                          | Use a string array.                                                                                  |
| CC406 | warn     | `env` contains a non-string value.                                                     | Coerce environment values to strings.                                                                |
| CC407 | info     | `cwd` is hard-coded to an absolute path other than `${CLAUDE_PLUGIN_ROOT}`.            | Use `${CLAUDE_PLUGIN_ROOT}` for portability.                                                         |
| CC408 | warn     | Server name does not match `[a-z0-9][a-z0-9-]*` (kebab-case).                          | Rename the server.                                                                                   |
| CC409 | info     | `env` value looks like a literal secret.                                               | Move secrets to `userConfig` with `sensitive: true` and reference via `${user_config.KEY}`.          |

## LSP (`CC5xx`)

| Code  | Severity | Summary                                                                | Fix                                                                                              |
| ----- | -------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| CC501 | error    | `.lsp.json` does not parse.                                            | Fix JSON syntax.                                                                                 |
| CC502 | error    | A server entry is missing `command`.                                   | Add a `command` value.                                                                           |
| CC503 | error    | A server entry is missing `extensionToLanguage` (required per ref).    | Add `extensionToLanguage`.                                                                       |
| CC504 | warn     | `extensionToLanguage` keys do not start with `.`.                      | Prefix every extension key with a leading dot (e.g. `.go`).                                      |
| CC505 | warn     | `transport` is not `stdio` or `socket`.                                | Use one of the documented transports.                                                            |
| CC506 | info     | LSP binary install instructions are not documented in README.          | Document the install command in the plugin's README so users can install the binary separately. |
| CC507 | warn     | `startupTimeout` or `shutdownTimeout` is not a positive integer.       | Use a positive integer (milliseconds).                                                           |
| CC508 | warn     | `restartOnCrash: true` without `maxRestarts`.                          | Set `maxRestarts` so the server cannot spin.                                                     |

## Monitors (`CC6xx`)

| Code  | Severity | Summary                                                                                                | Fix                                                                                       |
| ----- | -------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| CC601 | error    | `monitors/monitors.json` does not parse, or the parsed value is not an array.                          | Use a JSON array of monitor entries.                                                      |
| CC602 | error    | Monitor entry is missing `name`, `command`, or `description`.                                          | Set the missing fields.                                                                   |
| CC603 | error    | Two monitor entries share the same `name`.                                                             | Rename one entry; names must be unique.                                                   |
| CC604 | warn     | `when` is set and is not `"always"` or `on-skill-invoke:<skill-name>`.                                 | Use the documented values.                                                                |
| CC605 | warn     | `on-skill-invoke:<name>` references a missing skill.                                                   | Use a skill `name` declared in this plugin.                                               |
| CC606 | warn     | `command` does not start with `cd "${CLAUDE_PLUGIN_ROOT}" && ` and does not reference the root.        | Use the recommended prefix or a system bin like `tail`/`watch`.                           |
| CC607 | info     | `description` is longer than 80 chars (gets truncated in the task panel).                              | Trim to under 80 chars.                                                                   |
| CC608 | warn     | `${user_config.X}` references a key not declared in `manifest.userConfig`.                             | Declare the key or rename the reference.                                                  |

## Agents (`CC7xx`)

| Code  | Severity | Summary                                                                                                                                | Fix                                                                                                |
| ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| CC701 | error    | Agent file has no frontmatter.                                                                                                         | Add YAML frontmatter with `name` and `description`.                                                |
| CC702 | error    | Agent frontmatter is missing `name` or `description`.                                                                                  | Set both fields.                                                                                   |
| CC703 | error    | Agent frontmatter contains forbidden fields `hooks`, `mcpServers`, or `permissionMode`.                                                | Remove the forbidden fields - they are unsupported for plugin-shipped agents.                      |
| CC704 | warn     | `model` is empty, numeric, or otherwise unrecognized.                                                                                  | Use `sonnet`, `opus`, `haiku`, `inherit`, or a known concrete model id.                            |
| CC705 | warn     | `effort` is not one of `low`, `medium`, `high`, `xhigh`, `max`.                                                                        | Use a documented effort level.                                                                     |
| CC706 | warn     | `maxTurns` is not a positive integer.                                                                                                  | Use a positive integer.                                                                            |
| CC707 | warn     | `isolation` is set to anything other than `"worktree"`.                                                                                | The only documented value is `"worktree"`.                                                         |
| CC708 | info     | Agent body is shorter than 50 chars (probably a stub).                                                                                 | Flesh out the agent prompt.                                                                        |
| CC709 | warn     | `tools` and `disallowedTools` overlap.                                                                                                 | Remove the duplicate so policy is unambiguous.                                                     |

## Marketplace (`CC8xx`)

| Code  | Severity | Summary                                                                          | Fix                                                                       |
| ----- | -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| CC801 | error    | `.claude-plugin/marketplace.json` does not parse.                                | Fix JSON syntax.                                                          |
| CC802 | error    | Top-level `name` or `plugins` is missing.                                        | Add the missing fields.                                                   |
| CC803 | error    | The plugin being evaluated has no entry in `plugins[]`.                          | Add an entry whose `name` matches `manifest.name`.                        |
| CC804 | warn     | Matched entry's `version` differs from `manifest.version`.                       | Align the marketplace entry with the manifest.                            |
| CC805 | warn     | Matched entry's `source` does not point at the plugin's directory.               | Use `./plugins/<plugin-name>` (or the correct relative path).             |
| CC806 | info     | Matched entry's `description` differs from `manifest.description`.               | Keep them aligned for marketplace UI consistency.                         |
| CC807 | warn     | Two marketplace entries share the same `name`.                                   | Rename one entry; marketplace names must be unique.                       |

## Cross-cutting safety (`CC9xx`)

| Code  | Severity | Summary                                                                                            | Fix                                                                          |
| ----- | -------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| CC900 | error    | A path-like value contains `../` after the leading `./` (path traversal).                          | Keep all paths inside the plugin root.                                       |
| CC910 | error    | `userConfig` key contains characters outside `[A-Za-z0-9_]`.                                       | Rename the key to a valid identifier.                                        |
| CC911 | error    | A `userConfig` entry is missing `type`, `title`, or `description`.                                 | Set the missing fields.                                                      |
| CC912 | error    | `type` is not one of `string`, `number`, `boolean`, `directory`, `file`.                           | Use a documented type.                                                       |
| CC913 | warn     | `multiple: true` set on a non-string `type`.                                                       | Drop `multiple` or change `type` to `string`.                                |
| CC914 | warn     | `min`/`max` set on a non-number `type`.                                                            | Drop the bounds or change `type` to `number`.                                |
| CC915 | warn     | Field name looks like a secret but `sensitive` is not `true`.                                      | Set `sensitive: true` so the value is masked and stored in secure storage.   |
| CC916 | warn     | `channels[*].server` does not match a key in `mcpServers`.                                         | Update the channel `server` reference or declare the MCP server.             |
| CC917 | info     | A `userConfig` field is unused (no `${user_config.<KEY>}` reference anywhere).                     | Remove the field or wire it into a hook, monitor, MCP/LSP, or skill body.    |

## Cross-references

- Claude Code plugins reference (cached): `/tmp/plugin-compare/refs/claude-plugins-reference.md`
- Claude Code skills reference (cached): `/tmp/plugin-compare/refs/claude-skills-reference.md`
- Schema for the canonical evaluation result: `evaluation-result-schema.md`
