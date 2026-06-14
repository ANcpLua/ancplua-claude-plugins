import path from "node:path";

import { createFinding, createMetric } from "../core/schema.js";
import { pathExists, readText, toPosixPath } from "../lib/files.js";

const SERVER_NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const SECRET_KEY_RE = /(token|key|secret|password|api[_-]?key|credential)/i;
const USER_CONFIG_REF_RE = /\$\{user_config\.[A-Za-z0-9_]+\}/;
const ENV_REF_RE = /\$\{[A-Z_][A-Z0-9_]*\}/;

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

function normalizeServerMap(parsed) {
  return parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    parsed.mcpServers &&
    typeof parsed.mcpServers === "object" &&
    !Array.isArray(parsed.mcpServers)
    ? parsed.mcpServers
    : parsed;
}

async function readMcpConfigFile(pluginRoot, configuredPath) {
  const { candidatePath, fileRel, error } = resolvePluginPath(pluginRoot, configuredPath);
  if (error) {
    return { servers: null, sourceFile: fileRel, parseError: error, missing: false };
  }
  if (!(await pathExists(candidatePath))) {
    return { servers: null, sourceFile: fileRel, parseError: null, missing: true };
  }
  let raw;
  try {
    raw = await readText(candidatePath);
  } catch (error) {
    return {
      servers: null,
      sourceFile: fileRel,
      parseError: error instanceof Error ? error.message : String(error),
      missing: false,
    };
  }
  try {
    return { servers: normalizeServerMap(JSON.parse(raw)), sourceFile: fileRel, parseError: null, missing: false };
  } catch (error) {
    return {
      servers: null,
      sourceFile: fileRel,
      parseError: error instanceof Error ? error.message : String(error),
      missing: false,
    };
  }
}

async function loadMcpConfig(pluginRoot, manifest) {
  if (manifest && typeof manifest.mcpServers === "object" && !Array.isArray(manifest.mcpServers)) {
    return { servers: manifest.mcpServers, sourceFile: ".claude-plugin/plugin.json", parseError: null, missing: false };
  }

  const configured = Array.isArray(manifest?.mcpServers)
    ? manifest.mcpServers
    : [typeof manifest?.mcpServers === "string" ? manifest.mcpServers : ".mcp.json"];
  const mergedServers = {};
  const sourceFiles = [];
  let found = false;

  for (const entry of configured) {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const servers = normalizeServerMap(entry);
      if (!servers || typeof servers !== "object" || Array.isArray(servers)) {
        return {
          servers,
          sourceFile: ".claude-plugin/plugin.json",
          parseError: null,
          missing: false,
        };
      }
      Object.assign(mergedServers, servers);
      sourceFiles.push(".claude-plugin/plugin.json");
      found = true;
      continue;
    }
    if (typeof entry !== "string") {
      return {
        servers: null,
        sourceFile: ".claude-plugin/plugin.json",
        parseError: "mcpServers array entries must be path strings or server maps.",
        missing: false,
      };
    }
    const loaded = await readMcpConfigFile(pluginRoot, entry);
    sourceFiles.push(loaded.sourceFile);
    if (loaded.parseError) return loaded;
    if (loaded.missing) continue;
    found = true;
    if (!loaded.servers || typeof loaded.servers !== "object" || Array.isArray(loaded.servers)) {
      return { ...loaded, servers: loaded.servers };
    }
    Object.assign(mergedServers, loaded.servers);
  }

  return {
    servers: found ? mergedServers : null,
    sourceFile: sourceFiles.join(", ") || ".mcp.json",
    parseError: null,
    missing: !found,
  };
}

function stripPluginVars(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, "").replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, "");
}

export async function evaluateMcp(pluginRoot, manifest) {
  const findings = [];
  const metrics = [];
  const artifacts = [];

  const { servers, sourceFile, parseError, missing } = await loadMcpConfig(pluginRoot, manifest);

  if (parseError) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC401",
        message: `MCP config does not parse: ${parseError}`,
        location: { file: sourceFile },
      }),
    );
    return { findings, metrics, artifacts };
  }

  if (missing) {
    return { findings, metrics, artifacts };
  }

  if (!servers || typeof servers !== "object" || Array.isArray(servers)) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC401",
        message: "MCP config root is not an object keyed by server name.",
        location: { file: sourceFile },
        fix: "Use {<server-name>: {command, args, env, ...}}.",
      }),
    );
    return { findings, metrics, artifacts };
  }

  let serverCount = 0;
  let serversWithEnv = 0;

  for (const [serverName, server] of Object.entries(servers)) {
    serverCount += 1;

    if (!server || typeof server !== "object" || Array.isArray(server)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC401",
          message: `MCP server "${serverName}" entry is not an object.`,
          location: { file: sourceFile },
        }),
      );
      continue;
    }

    if (!SERVER_NAME_RE.test(serverName)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC408",
          message: `MCP server name "${serverName}" is not kebab-case ([a-z0-9][a-z0-9-]*).`,
          location: { file: sourceFile },
          fix: "Rename the server to kebab-case for consistency with Claude conventions.",
        }),
      );
    }

    const isRemoteServer =
      server.type === "http" || server.type === "sse" || typeof server.url === "string";

    if (isRemoteServer) {
      // Remote MCP servers (Streamable HTTP / SSE) are addressed by `url`, not
      // `command`; the command-path checks below do not apply to them.
      if (typeof server.url !== "string" || server.url.trim() === "") {
        findings.push(
          createFinding({
            severity: "error",
            code: "CC410",
            message: `Remote MCP server "${serverName}" (type "${server.type ?? "http"}") is missing required \`url\`.`,
            location: { file: sourceFile },
            fix: "Add a `url` string (e.g. https://example.com/mcp).",
          }),
        );
      } else if (!/^https?:\/\//.test(server.url.trim())) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC411",
            message: `Remote MCP server "${serverName}" \`url\` "${server.url}" is not an http(s) URL.`,
            location: { file: sourceFile },
            fix: "Use an http:// or https:// URL.",
          }),
        );
      }
    } else if (typeof server.command !== "string" || server.command.trim() === "") {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC402",
          message: `MCP server "${serverName}" is missing required \`command\`.`,
          location: { file: sourceFile },
          fix: "Add a `command` string (script path or system binary), or a `url` for a remote (type http/sse) server.",
        }),
      );
    } else {
      const command = server.command;

      // CC900 — path traversal.
      const stripped = stripPluginVars(command);
      if (/(?:^|\/)\.\.\//.test(stripped)) {
        findings.push(
          createFinding({
            severity: "error",
            code: "CC900",
            message: `MCP server "${serverName}" command contains \`../\` traversal: ${command}.`,
            location: { file: sourceFile },
            fix: "Use ${CLAUDE_PLUGIN_ROOT}/... and keep all references inside the plugin tree.",
          }),
        );
      }

      // CC403 — referenced script under ${CLAUDE_PLUGIN_ROOT} missing.
      const rootMatch = command.match(/\$\{CLAUDE_PLUGIN_ROOT\}([^\s"';|&<>]+)/);
      if (rootMatch) {
        const scriptRel = rootMatch[1].replace(/^\//, "");
        const scriptPath = path.join(pluginRoot, scriptRel);
        if (scriptRel && !(await pathExists(scriptPath))) {
          findings.push(
            createFinding({
              severity: "warn",
              code: "CC403",
              message: `MCP server "${serverName}" command references missing script: \${CLAUDE_PLUGIN_ROOT}/${scriptRel}.`,
              location: { file: sourceFile },
              fix: `Create ${scriptRel} or update the command path.`,
            }),
          );
        }
      } else if (/^\.{1,2}\//.test(command)) {
        // CC404 — relative without ${CLAUDE_PLUGIN_ROOT}.
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC404",
            message: `MCP server "${serverName}" uses relative \`command\` "${command}" without \${CLAUDE_PLUGIN_ROOT}; runtime CWD is unspecified.`,
            location: { file: sourceFile },
            fix: "Prefix with ${CLAUDE_PLUGIN_ROOT}/.",
          }),
        );
      }
    }

    if (server.args != null) {
      if (!Array.isArray(server.args) || server.args.some((value) => typeof value !== "string")) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC405",
            message: `MCP server "${serverName}" \`args\` is not an array of strings.`,
            location: { file: sourceFile },
            fix: "Convert args to an array of strings.",
          }),
        );
      }
    }

    if (server.env != null) {
      if (typeof server.env !== "object" || Array.isArray(server.env)) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC406",
            message: `MCP server "${serverName}" \`env\` is not an object.`,
            location: { file: sourceFile },
          }),
        );
      } else {
        serversWithEnv += 1;
        for (const [envKey, envValue] of Object.entries(server.env)) {
          if (typeof envValue !== "string") {
            findings.push(
              createFinding({
                severity: "warn",
                code: "CC406",
                message: `MCP server "${serverName}" env key "${envKey}" has non-string value (${typeof envValue}).`,
                location: { file: sourceFile },
                fix: "Cast env values to strings.",
              }),
            );
            continue;
          }
          // CC409 — secret-looking env name with literal value.
          if (
            SECRET_KEY_RE.test(envKey) &&
            envValue !== "" &&
            !USER_CONFIG_REF_RE.test(envValue) &&
            !ENV_REF_RE.test(envValue)
          ) {
            findings.push(
              createFinding({
                severity: "info",
                code: "CC409",
                message: `MCP server "${serverName}" env key "${envKey}" contains a literal value that looks like a secret.`,
                location: { file: sourceFile },
                fix: `Move "${envKey}" to userConfig with sensitive: true and reference as \${user_config.${envKey.toLowerCase()}}.`,
              }),
            );
          }
        }
      }
    }

    if (typeof server.cwd === "string" && server.cwd !== "") {
      const cwd = server.cwd;
      const usesRoot = cwd.includes("${CLAUDE_PLUGIN_ROOT}") || cwd.includes("${CLAUDE_PLUGIN_DATA}");
      if (!usesRoot && path.isAbsolute(cwd)) {
        findings.push(
          createFinding({
            severity: "info",
            code: "CC407",
            message: `MCP server "${serverName}" \`cwd\` is hard-coded absolute path "${cwd}"; portability concern.`,
            location: { file: sourceFile },
            fix: "Use ${CLAUDE_PLUGIN_ROOT} for portability.",
          }),
        );
      }
    }
  }

  metrics.push(
    createMetric({
      id: "mcp_server_count",
      category: "mcp",
      value: serverCount,
      unit: "servers",
      band: "info",
    }),
    createMetric({
      id: "mcp_servers_with_env_count",
      category: "mcp",
      value: serversWithEnv,
      unit: "servers",
      band: "info",
    }),
  );

  return { findings, metrics, artifacts };
}
