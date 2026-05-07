import path from "node:path";

import { createFinding, createMetric } from "../core/schema.js";
import { pathExists, readText, toPosixPath } from "../lib/files.js";

const VALID_TRANSPORTS = new Set(["stdio", "socket"]);

// Heuristic — well-known language server binaries that authors typically install separately.
const KNOWN_LSP_BINARIES = new Set([
  "gopls",
  "pyright",
  "pyright-langserver",
  "rust-analyzer",
  "typescript-language-server",
  "lua-language-server",
  "clangd",
  "elixir-ls",
  "ocamllsp",
  "haskell-language-server",
  "metals",
  "solargraph",
  "phpactor",
  "intelephense",
]);

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
    parsed.lspServers &&
    typeof parsed.lspServers === "object" &&
    !Array.isArray(parsed.lspServers)
    ? parsed.lspServers
    : parsed;
}

async function readLspConfigFile(pluginRoot, configuredPath) {
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

async function loadLspConfig(pluginRoot, manifest) {
  if (manifest && typeof manifest.lspServers === "object" && !Array.isArray(manifest.lspServers)) {
    return { servers: manifest.lspServers, sourceFile: ".claude-plugin/plugin.json", parseError: null, missing: false };
  }

  const configured = Array.isArray(manifest?.lspServers)
    ? manifest.lspServers
    : [typeof manifest?.lspServers === "string" ? manifest.lspServers : ".lsp.json"];
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
        parseError: "lspServers array entries must be path strings or server maps.",
        missing: false,
      };
    }
    const loaded = await readLspConfigFile(pluginRoot, entry);
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
    sourceFile: sourceFiles.join(", ") || ".lsp.json",
    parseError: null,
    missing: !found,
  };
}

async function readmeMentions(pluginRoot, term) {
  const candidates = ["README.md", "Readme.md", "readme.md"];
  for (const name of candidates) {
    const filePath = path.join(pluginRoot, name);
    if (!(await pathExists(filePath))) continue;
    try {
      const text = await readText(filePath);
      if (text.toLowerCase().includes(term.toLowerCase())) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

export async function evaluateLsp(pluginRoot, manifest) {
  const findings = [];
  const metrics = [];
  const artifacts = [];

  const { servers, sourceFile, parseError, missing } = await loadLspConfig(pluginRoot, manifest);

  if (parseError) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC501",
        message: `LSP config does not parse: ${parseError}`,
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
        code: "CC501",
        message: "LSP config root is not an object keyed by language-server name.",
        location: { file: sourceFile },
        fix: "Use {<lang>: {command, extensionToLanguage, ...}}.",
      }),
    );
    return { findings, metrics, artifacts };
  }

  let serverCount = 0;
  let extensionCount = 0;

  for (const [serverName, server] of Object.entries(servers)) {
    serverCount += 1;

    if (!server || typeof server !== "object" || Array.isArray(server)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC501",
          message: `LSP server "${serverName}" entry is not an object.`,
          location: { file: sourceFile },
        }),
      );
      continue;
    }

    if (typeof server.command !== "string" || server.command.trim() === "") {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC502",
          message: `LSP server "${serverName}" is missing required \`command\`.`,
          location: { file: sourceFile },
          fix: "Add a `command` string (must be in PATH at runtime).",
        }),
      );
    } else if (KNOWN_LSP_BINARIES.has(server.command)) {
      const mentioned = await readmeMentions(pluginRoot, server.command);
      if (!mentioned) {
        findings.push(
          createFinding({
            severity: "info",
            code: "CC506",
            message: `LSP \`command\` "${server.command}" is a known language-server binary; the README does not mention it.`,
            location: { file: sourceFile },
            fix: `Document how to install ${server.command} (the binary is not bundled with the plugin).`,
          }),
        );
      }
    }

    if (server.extensionToLanguage == null) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC503",
          message: `LSP server "${serverName}" is missing required \`extensionToLanguage\`.`,
          location: { file: sourceFile },
          fix: "Add an `extensionToLanguage` map (e.g. {\".go\": \"go\"}).",
        }),
      );
    } else if (typeof server.extensionToLanguage !== "object" || Array.isArray(server.extensionToLanguage)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC503",
          message: `LSP server "${serverName}" \`extensionToLanguage\` is not an object.`,
          location: { file: sourceFile },
        }),
      );
    } else {
      const ext = server.extensionToLanguage;
      for (const key of Object.keys(ext)) {
        extensionCount += 1;
        if (!key.startsWith(".")) {
          findings.push(
            createFinding({
              severity: "warn",
              code: "CC504",
              message: `LSP server "${serverName}" extension "${key}" does not start with a dot.`,
              location: { file: sourceFile },
              fix: `Use ".${key}" instead of "${key}".`,
            }),
          );
        }
      }
    }

    if (server.transport != null && !VALID_TRANSPORTS.has(server.transport)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC505",
          message: `LSP server "${serverName}" \`transport\` is "${server.transport}"; valid values are "stdio" or "socket".`,
          location: { file: sourceFile },
          fix: "Set transport to stdio (default) or socket.",
        }),
      );
    }

    if (server.startupTimeout != null && !isPositiveInteger(server.startupTimeout)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC507",
          message: `LSP server "${serverName}" \`startupTimeout\` is not a positive integer.`,
          location: { file: sourceFile },
        }),
      );
    }
    if (server.shutdownTimeout != null && !isPositiveInteger(server.shutdownTimeout)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC507",
          message: `LSP server "${serverName}" \`shutdownTimeout\` is not a positive integer.`,
          location: { file: sourceFile },
        }),
      );
    }

    if (server.restartOnCrash === true && server.maxRestarts == null) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC508",
          message: `LSP server "${serverName}" sets \`restartOnCrash: true\` without \`maxRestarts\`; could spin on a crashing binary.`,
          location: { file: sourceFile },
          fix: "Set `maxRestarts` to a small positive integer (e.g. 3).",
        }),
      );
    }

    if (server.args != null && !Array.isArray(server.args)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC505",
          message: `LSP server "${serverName}" \`args\` is not an array.`,
          location: { file: sourceFile },
        }),
      );
    }

    if (server.env != null && (typeof server.env !== "object" || Array.isArray(server.env))) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC505",
          message: `LSP server "${serverName}" \`env\` is not an object.`,
          location: { file: sourceFile },
        }),
      );
    }
  }

  metrics.push(
    createMetric({
      id: "lsp_server_count",
      category: "lsp",
      value: serverCount,
      unit: "servers",
      band: "info",
    }),
    createMetric({
      id: "lsp_extension_count",
      category: "lsp",
      value: extensionCount,
      unit: "extensions",
      band: "info",
    }),
  );

  return { findings, metrics, artifacts };
}
