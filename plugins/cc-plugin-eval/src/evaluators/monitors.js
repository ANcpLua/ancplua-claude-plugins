import path from "node:path";

import { createFinding, createMetric } from "../core/schema.js";
import { pathExists, readText, toPosixPath, listImmediateDirectories } from "../lib/files.js";

const WHEN_RE = /^(?:always|on-skill-invoke:[a-z0-9][a-z0-9-]*)$/;
const ON_SKILL_INVOKE_RE = /^on-skill-invoke:([a-z0-9][a-z0-9-]*)$/;
const USER_CONFIG_REF_RE = /\$\{user_config\.([A-Za-z0-9_]+)\}/g;

const SYSTEM_BIN_ALLOWLIST = new Set([
  "tail",
  "watch",
  "ping",
  "curl",
  "node",
  "bash",
  "sh",
  "zsh",
  "python",
  "python3",
  "rg",
  "jq",
]);

function escapesRoot(rootPath, candidatePath) {
  const rel = path.relative(rootPath, candidatePath);
  return rel === "" ? false : rel.startsWith("..") || path.isAbsolute(rel);
}

async function loadMonitorsConfig(pluginRoot, manifest) {
  // Inline support: manifest.monitors as array.
  if (Array.isArray(manifest?.monitors)) {
    return { entries: manifest.monitors, sourceFile: ".claude-plugin/plugin.json", parseError: null, missing: false };
  }
  const candidatePath = (() => {
    if (typeof manifest?.monitors === "string") {
      return path.resolve(pluginRoot, manifest.monitors.replace(/^\.\//, ""));
    }
    return path.resolve(pluginRoot, "monitors", "monitors.json");
  })();
  const fileRel = toPosixPath(path.relative(pluginRoot, candidatePath));
  if (typeof manifest?.monitors === "string" && escapesRoot(pluginRoot, candidatePath)) {
    return {
      entries: null,
      sourceFile: fileRel,
      parseError: null,
      missing: false,
      escaped: true,
    };
  }
  if (!(await pathExists(candidatePath))) {
    return { entries: null, sourceFile: fileRel, parseError: null, missing: true };
  }
  let raw;
  try {
    raw = await readText(candidatePath);
  } catch (error) {
    return {
      entries: null,
      sourceFile: fileRel,
      parseError: error instanceof Error ? error.message : String(error),
      missing: false,
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return { entries: parsed, sourceFile: fileRel, parseError: null, missing: false };
  } catch (error) {
    return {
      entries: null,
      sourceFile: fileRel,
      parseError: error instanceof Error ? error.message : String(error),
      missing: false,
    };
  }
}

async function discoverSkillNames(pluginRoot, manifest) {
  // The monitors evaluator only needs a best-effort set of skill names.
  // Default convention: each subdir under skills/.
  const names = new Set();
  const declared = manifest?.skills;
  const dirs = [];
  if (typeof declared === "string") dirs.push(declared.replace(/^\.\//, ""));
  else if (Array.isArray(declared)) {
    for (const entry of declared) if (typeof entry === "string") dirs.push(entry.replace(/^\.\//, ""));
  } else {
    dirs.push("skills");
  }
  for (const rel of dirs) {
    const skillsDir = path.join(pluginRoot, rel);
    if (!(await pathExists(skillsDir))) continue;
    const subdirs = await listImmediateDirectories(skillsDir).catch(() => []);
    for (const fullPath of subdirs) names.add(path.basename(fullPath));
  }
  return names;
}

function collectUserConfigKeys(manifest) {
  const keys = new Set();
  if (manifest?.userConfig && typeof manifest.userConfig === "object" && !Array.isArray(manifest.userConfig)) {
    for (const key of Object.keys(manifest.userConfig)) keys.add(key);
  }
  if (Array.isArray(manifest?.channels)) {
    for (const channel of manifest.channels) {
      if (channel?.userConfig && typeof channel.userConfig === "object" && !Array.isArray(channel.userConfig)) {
        for (const key of Object.keys(channel.userConfig)) keys.add(key);
      }
    }
  }
  return keys;
}

function firstWord(command) {
  if (typeof command !== "string") return "";
  const trimmed = command.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0].replace(/^["']/, "").replace(/["']$/, "");
}

export async function evaluateMonitors(pluginRoot, manifest) {
  const findings = [];
  const metrics = [];
  const artifacts = [];

  const { entries, sourceFile, parseError, missing, escaped } = await loadMonitorsConfig(pluginRoot, manifest);

  if (escaped) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC900",
        message: `Manifest \`monitors\` path "${manifest.monitors}" escapes the plugin root.`,
        location: { file: ".claude-plugin/plugin.json" },
        fix: "Use a path that resolves inside the plugin directory (no `../` traversal).",
      }),
    );
    return { findings, metrics, artifacts };
  }

  if (parseError) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC601",
        message: `Monitors config does not parse: ${parseError}`,
        location: { file: sourceFile },
      }),
    );
    return { findings, metrics, artifacts };
  }

  if (missing) {
    return { findings, metrics, artifacts };
  }

  if (!Array.isArray(entries)) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC601",
        message: "Monitors config root is not an array.",
        location: { file: sourceFile },
        fix: "Use a JSON array of {name, command, description, when?} objects.",
      }),
    );
    return { findings, metrics, artifacts };
  }

  const skillNames = await discoverSkillNames(pluginRoot, manifest);
  const userConfigKeys = collectUserConfigKeys(manifest);
  const seenNames = new Map();
  let onSkillInvokeCount = 0;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC602",
          message: `Monitor at index ${i} is not an object.`,
          location: { file: sourceFile },
        }),
      );
      continue;
    }

    const missingFields = [];
    if (typeof entry.name !== "string" || entry.name === "") missingFields.push("name");
    if (typeof entry.command !== "string" || entry.command === "") missingFields.push("command");
    if (typeof entry.description !== "string" || entry.description === "") missingFields.push("description");
    if (missingFields.length > 0) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC602",
          message: `Monitor at index ${i} is missing required field(s): ${missingFields.join(", ")}.`,
          location: { file: sourceFile },
          fix: "Each monitor needs name, command, and description.",
        }),
      );
      continue;
    }

    if (seenNames.has(entry.name)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC603",
          message: `Duplicate monitor name "${entry.name}" (also at index ${seenNames.get(entry.name)}).`,
          location: { file: sourceFile },
          fix: "Monitor names must be unique within the plugin.",
        }),
      );
    } else {
      seenNames.set(entry.name, i);
    }

    if (entry.when != null) {
      if (typeof entry.when !== "string" || !WHEN_RE.test(entry.when)) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC604",
            message: `Monitor "${entry.name}" \`when\` value "${entry.when}" is invalid.`,
            location: { file: sourceFile },
            fix: 'Use "always" or "on-skill-invoke:<skill-name>".',
          }),
        );
      } else {
        const skillMatch = ON_SKILL_INVOKE_RE.exec(entry.when);
        if (skillMatch) {
          onSkillInvokeCount += 1;
          const referencedSkill = skillMatch[1];
          if (!skillNames.has(referencedSkill)) {
            findings.push(
              createFinding({
                severity: "warn",
                code: "CC605",
                message: `Monitor "${entry.name}" references unknown skill "${referencedSkill}" in \`when\`.`,
                location: { file: sourceFile },
                fix: `Create skills/${referencedSkill}/ or fix the \`when\` value.`,
              }),
            );
          }
        }
      }
    }

    // CC606 — recommended cd-prefix or system bin.
    const command = entry.command;
    const usesPluginVar = /\$\{CLAUDE_PLUGIN_ROOT\}|\$\{CLAUDE_PLUGIN_DATA\}/.test(command);
    const startsWithCdRoot = /^cd\s+["']?\$\{CLAUDE_PLUGIN_ROOT\}["']?\s*&&/.test(command.trim());
    const head = firstWord(command);
    if (!startsWithCdRoot && !usesPluginVar && !SYSTEM_BIN_ALLOWLIST.has(head)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC606",
          message: `Monitor "${entry.name}" command does not start with \`cd "\${CLAUDE_PLUGIN_ROOT}" && \` or a system binary.`,
          location: { file: sourceFile },
          fix: 'Prefix the command with `cd "${CLAUDE_PLUGIN_ROOT}" && ` or use a system binary like tail/watch.',
        }),
      );
    }

    if (typeof entry.description === "string" && entry.description.length > 80) {
      findings.push(
        createFinding({
          severity: "info",
          code: "CC607",
          message: `Monitor "${entry.name}" description is ${entry.description.length} chars (>80); the task panel truncates.`,
          location: { file: sourceFile },
          fix: "Shorten the description.",
        }),
      );
    }

    // CC608 — ${user_config.X} for missing X.
    USER_CONFIG_REF_RE.lastIndex = 0;
    let match;
    while ((match = USER_CONFIG_REF_RE.exec(command)) !== null) {
      const referenced = match[1];
      if (!userConfigKeys.has(referenced)) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC608",
            message: `Monitor "${entry.name}" references \${user_config.${referenced}}, which is not declared in manifest.userConfig.`,
            location: { file: sourceFile },
            fix: `Declare ${referenced} in manifest.userConfig.`,
          }),
        );
      }
    }

    // Path traversal in command.
    const stripped = command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, "").replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, "");
    if (/(?:^|\s|\/)\.\.\//.test(stripped)) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC900",
          message: `Monitor "${entry.name}" command contains \`../\` traversal: ${command}.`,
          location: { file: sourceFile },
          fix: "Reference scripts via ${CLAUDE_PLUGIN_ROOT}/...; external paths do not survive caching.",
        }),
      );
    }
  }

  metrics.push(
    createMetric({
      id: "monitor_count",
      category: "monitors",
      value: entries.length,
      unit: "monitors",
      band: "info",
    }),
    createMetric({
      id: "monitor_on_skill_invoke_count",
      category: "monitors",
      value: onSkillInvokeCount,
      unit: "monitors",
      band: "info",
    }),
  );

  return { findings, metrics, artifacts };
}
