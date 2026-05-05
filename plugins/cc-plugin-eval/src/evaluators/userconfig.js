import path from "node:path";

import { createFinding, createMetric } from "../core/schema.js";
import { pathExists, readText, walkFiles } from "../lib/files.js";

const VALID_TYPES = new Set(["string", "number", "boolean", "directory", "file"]);
const KEY_RE = /^[A-Za-z0-9_]+$/;
const SECRET_NAME_RE = /^(?:api[_-]?(?:key|token)|token|secret|password|credential)/i;
const USER_CONFIG_REF_GLOBAL_RE = /\$\{user_config\.([A-Za-z0-9_]+)\}/g;
const SENSITIVE_VALUE_LIMIT = 2 * 1024;

const LOC = { file: ".claude-plugin/plugin.json" };

function asEntries(userConfig) {
  if (!userConfig || typeof userConfig !== "object" || Array.isArray(userConfig)) return [];
  return Object.entries(userConfig);
}

function isFinding(value) {
  return value && typeof value === "object" && typeof value.code === "string";
}

function validateUserConfigBlock(block, options) {
  const { sourceLabel, declaredKeys } = options;
  const findings = [];
  const entries = asEntries(block);

  for (const [key, raw] of entries) {
    if (typeof key === "string") declaredKeys.add(key);

    // CC910 — invalid key.
    if (typeof key !== "string" || !KEY_RE.test(key)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC910",
          message: `userConfig key "${key}" contains characters outside [A-Za-z0-9_] (${sourceLabel}).`,
          location: LOC,
          fix: "Rename the key to a valid identifier (letters, digits, underscore).",
        }),
      );
    }

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC911",
          message: `userConfig "${key}" entry is not an object.`,
          location: LOC,
        }),
      );
      continue;
    }

    // CC911 — required fields.
    const missing = [];
    if (!("type" in raw)) missing.push("type");
    if (typeof raw.title !== "string" || raw.title === "") missing.push("title");
    if (typeof raw.description !== "string" || raw.description === "") missing.push("description");
    if (missing.length > 0) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC911",
          message: `userConfig "${key}" is missing required field(s): ${missing.join(", ")}.`,
          location: LOC,
          fix: "Each userConfig entry needs `type`, `title`, and `description`.",
        }),
      );
    }

    // CC912 — invalid type.
    if ("type" in raw && (typeof raw.type !== "string" || !VALID_TYPES.has(raw.type))) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC912",
          message: `userConfig "${key}" \`type\` "${String(raw.type)}" is not one of string, number, boolean, directory, file.`,
          location: LOC,
        }),
      );
    }

    // CC913 — multiple only valid for string.
    if (raw.multiple === true && raw.type !== "string") {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC913",
          message: `userConfig "${key}" sets \`multiple: true\` on type "${String(raw.type)}" (only valid for string).`,
          location: LOC,
          fix: "Set `multiple: true` only on string-typed userConfig fields.",
        }),
      );
    }

    // CC914 — min/max only valid for number.
    if (("min" in raw || "max" in raw) && raw.type !== "number") {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC914",
          message: `userConfig "${key}" sets \`min\`/\`max\` on type "${String(raw.type)}" (only valid for number).`,
          location: LOC,
        }),
      );
    }

    // CC915 — secret-looking name without sensitive: true.
    if (typeof key === "string" && SECRET_NAME_RE.test(key) && raw.sensitive !== true) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC915",
          message: `userConfig "${key}" name suggests a secret but \`sensitive\` is not true.`,
          location: LOC,
          fix: "Add `sensitive: true` so the value lands in the system keychain instead of settings.json.",
        }),
      );
    }

    // Sensitive value > 2KB warn (default field length proxy).
    if (raw.sensitive === true && typeof raw.default === "string" && raw.default.length > SENSITIVE_VALUE_LIMIT) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC915",
          message: `userConfig "${key}" sensitive default exceeds ~2KB; keychain storage is shared and limited.`,
          location: LOC,
          fix: "Move large secrets into a file referenced by ${user_config.<file_key>} and load on demand.",
        }),
      );
    }
  }

  return findings;
}

async function gatherSubstitutionSources(pluginRoot, manifest) {
  // Aggregate every place the ref says ${user_config.*} can appear:
  // hooks/monitor commands, MCP/LSP server configs, skill content, agent content.
  const fragments = [];

  // Inline manifest config blocks. These are always available and never depend on disk.
  if (manifest && typeof manifest === "object") {
    if (manifest.hooks && typeof manifest.hooks === "object") {
      fragments.push(JSON.stringify(manifest.hooks));
    }
    if (manifest.mcpServers && typeof manifest.mcpServers === "object") {
      fragments.push(JSON.stringify(manifest.mcpServers));
    }
    if (manifest.lspServers && typeof manifest.lspServers === "object") {
      fragments.push(JSON.stringify(manifest.lspServers));
    }
    if (Array.isArray(manifest.monitors)) {
      fragments.push(JSON.stringify(manifest.monitors));
    }
  }

  // Skip the file walk when pluginRoot does not look like a plugin tree (no
  // .claude-plugin/plugin.json). Unit tests sometimes pass process.cwd();
  // walking the world from there is slow and nondeterministic.
  const manifestPath = path.join(pluginRoot, ".claude-plugin", "plugin.json");
  if (!(await pathExists(manifestPath))) {
    return fragments.join("\n");
  }

  // External JSON config files.
  const candidatePaths = [
    path.join(pluginRoot, ".mcp.json"),
    path.join(pluginRoot, ".lsp.json"),
    path.join(pluginRoot, "hooks", "hooks.json"),
    path.join(pluginRoot, "monitors", "monitors.json"),
  ];
  for (const candidate of candidatePaths) {
    if (await pathExists(candidate)) {
      try {
        fragments.push(await readText(candidate));
      } catch {
        // ignore unreadable files
      }
    }
  }

  // Skill and agent markdown bodies (best-effort scan, capped to avoid runaway IO).
  const scanDirs = [
    path.join(pluginRoot, "skills"),
    path.join(pluginRoot, "agents"),
    path.join(pluginRoot, "commands"),
  ];
  for (const dir of scanDirs) {
    if (!(await pathExists(dir))) continue;
    let files = [];
    try {
      files = await walkFiles(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!/\.md$/i.test(file)) continue;
      try {
        fragments.push(await readText(file));
      } catch {
        // ignore
      }
    }
  }

  return fragments.join("\n");
}

export async function evaluateUserConfig(manifest, pluginRoot) {
  const findings = [];
  const metrics = [];
  const artifacts = [];

  const declaredKeys = new Set();
  const sensitiveKeys = new Set();
  const channelCount = Array.isArray(manifest?.channels) ? manifest.channels.length : 0;

  // Top-level userConfig.
  findings.push(
    ...validateUserConfigBlock(manifest?.userConfig, {
      sourceLabel: "userConfig",
      declaredKeys,
    }),
  );
  if (manifest?.userConfig && typeof manifest.userConfig === "object") {
    for (const [key, raw] of Object.entries(manifest.userConfig)) {
      if (raw && typeof raw === "object" && raw.sensitive === true) sensitiveKeys.add(key);
    }
  }

  // Per-channel userConfig + CC916 server cross-check.
  const mcpServerKeys = new Set();
  if (manifest?.mcpServers && typeof manifest.mcpServers === "object" && !Array.isArray(manifest.mcpServers)) {
    for (const key of Object.keys(manifest.mcpServers)) mcpServerKeys.add(key);
  }
  if (Array.isArray(manifest?.channels)) {
    for (let i = 0; i < manifest.channels.length; i += 1) {
      const channel = manifest.channels[i];
      if (!channel || typeof channel !== "object") continue;
      if (typeof channel.server !== "string" || channel.server === "") {
        findings.push(
          createFinding({
            severity: "error",
            code: "CC911",
            message: `Channel at index ${i} is missing required \`server\` field.`,
            location: LOC,
          }),
        );
      } else if (mcpServerKeys.size > 0 && !mcpServerKeys.has(channel.server)) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC916",
            message: `Channel server "${channel.server}" does not match a key in manifest.mcpServers.`,
            location: LOC,
            fix: "Declare the MCP server first; the channel binds to a server name.",
          }),
        );
      }
      findings.push(
        ...validateUserConfigBlock(channel.userConfig, {
          sourceLabel: `channels[${i}].userConfig`,
          declaredKeys,
        }),
      );
      if (channel.userConfig && typeof channel.userConfig === "object") {
        for (const [key, raw] of Object.entries(channel.userConfig)) {
          if (raw && typeof raw === "object" && raw.sensitive === true) sensitiveKeys.add(key);
        }
      }
    }
  }

  // CC917 — unused userConfig keys (heuristic, soft).
  if (declaredKeys.size > 0) {
    const haystack = await gatherSubstitutionSources(pluginRoot, manifest);
    const referenced = new Set();
    USER_CONFIG_REF_GLOBAL_RE.lastIndex = 0;
    let match;
    while ((match = USER_CONFIG_REF_GLOBAL_RE.exec(haystack)) !== null) {
      referenced.add(match[1]);
    }
    for (const key of declaredKeys) {
      if (!referenced.has(key)) {
        findings.push(
          createFinding({
            severity: "info",
            code: "CC917",
            message: `userConfig "${key}" is declared but not referenced via \${user_config.${key}} anywhere in the plugin tree.`,
            location: LOC,
            fix: "Reference the value in an MCP/LSP/hook/monitor command, or remove the field if unused.",
          }),
        );
      }
    }
  }

  metrics.push(
    createMetric({
      id: "userconfig_field_count",
      category: "userconfig",
      value: declaredKeys.size,
      unit: "fields",
      band: "info",
    }),
    createMetric({
      id: "userconfig_sensitive_count",
      category: "userconfig",
      value: sensitiveKeys.size,
      unit: "fields",
      band: "info",
    }),
    createMetric({
      id: "channel_count",
      category: "userconfig",
      value: channelCount,
      unit: "channels",
      band: "info",
    }),
  );

  return { findings, metrics, artifacts };
}
