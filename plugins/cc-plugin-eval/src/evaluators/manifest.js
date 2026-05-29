import path from "node:path";
import fs from "node:fs/promises";

import { createFinding, createMetric } from "../core/schema.js";
import { pathExists, relativePath, toPosixPath } from "../lib/files.js";

const PATH_FIELDS = [
  "skills",
  "commands",
  "agents",
  "hooks",
  "mcpServers",
  "lspServers",
  "monitors",
  "outputStyles",
  "themes",
];

const METADATA_TEXT_FIELDS = ["description", "homepage", "repository", "license"];

const SEMVER_RE = /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i;
const KEBAB_NAME_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const ENV_VAR_RE = /\$\{CLAUDE_PLUGIN_(ROOT|DATA)\}/;
const REPO_URL_RE = /^(https?:\/\/|git\+|git@|ssh:\/\/)/i;

function relPath(pluginRoot, filePath) {
  return toPosixPath(relativePath(pluginRoot, filePath));
}

function locFor(pluginRoot) {
  return { file: ".claude-plugin/plugin.json" };
}

function asArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function isPathString(value) {
  return typeof value === "string";
}

function hasTraversal(value) {
  if (typeof value !== "string") return false;
  const stripped = value.replace(/^\.\//, "");
  if (stripped.startsWith("../")) return true;
  if (stripped.includes("/../")) return true;
  if (stripped === "..") return true;
  return false;
}

async function listClaudePluginDir(pluginRoot) {
  const dirPath = path.join(pluginRoot, ".claude-plugin");
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

export async function evaluateManifest(manifest, pluginRoot) {
  const findings = [];
  const metrics = [];
  const artifacts = [];
  const loc = locFor(pluginRoot);

  // CC101 / CC102 — name
  if (!manifest || typeof manifest.name !== "string" || manifest.name.trim() === "") {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC101",
        message: "Manifest is missing required field `name`.",
        location: loc,
        fix: "Add a kebab-case `name` field to plugin.json.",
      }),
    );
  } else if (!KEBAB_NAME_RE.test(manifest.name)) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC102",
        message: `Manifest \`name\` "${manifest.name}" is not kebab-case.`,
        location: loc,
        fix: "Rename to lowercase letters, digits, and single hyphens (e.g. my-plugin).",
      }),
    );
  }

  // CC103 — version SemVer
  if (typeof manifest?.version === "string" && manifest.version !== "" && !SEMVER_RE.test(manifest.version)) {
    findings.push(
      createFinding({
        severity: "warn",
        code: "CC103",
        message: `Manifest \`version\` "${manifest.version}" is not valid SemVer.`,
        location: loc,
        fix: "Use MAJOR.MINOR.PATCH (semver.org).",
      }),
    );
  }

  // CC104 — $schema info
  if (manifest && !manifest.$schema) {
    findings.push(
      createFinding({
        severity: "info",
        code: "CC104",
        message: "Manifest is missing `$schema` (editor autocomplete will not work).",
        location: loc,
        fix: 'Add "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json".',
      }),
    );
  }

  // CC105 — description length
  if (typeof manifest?.description === "string" && manifest.description.length > 200) {
    findings.push(
      createFinding({
        severity: "warn",
        code: "CC105",
        message: `Manifest \`description\` is ${manifest.description.length} chars (>200); marketplace UIs truncate.`,
        location: loc,
        fix: "Shorten description to under 200 characters.",
      }),
    );
  }

  // CC106 — repository URL
  if (typeof manifest?.repository === "string" && manifest.repository !== "" && !REPO_URL_RE.test(manifest.repository)) {
    findings.push(
      createFinding({
        severity: "warn",
        code: "CC106",
        message: `Manifest \`repository\` "${manifest.repository}" is not a valid URL.`,
        location: loc,
        fix: "Use an https:// or git+... URL.",
      }),
    );
  }

  // CC107 — keywords
  const keywords = Array.isArray(manifest?.keywords) ? manifest.keywords : [];
  if (keywords.length < 3) {
    findings.push(
      createFinding({
        severity: "info",
        code: "CC107",
        message: `Manifest has ${keywords.length} keyword(s); marketplace discovery improves with at least 3.`,
        location: loc,
        fix: "Add a few descriptive keywords to plugin.json.",
      }),
    );
  }

  // CC108 — license absent
  if (!manifest?.license) {
    findings.push(
      createFinding({
        severity: "info",
        code: "CC108",
        message: "Manifest is missing `license`.",
        location: loc,
        fix: "Add an SPDX identifier (e.g. MIT, Apache-2.0).",
      }),
    );
  }

  // CC110 — env-var leak in metadata text fields
  for (const key of METADATA_TEXT_FIELDS) {
    const value = manifest?.[key];
    if (typeof value === "string" && ENV_VAR_RE.test(value)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC110",
          message: `Manifest \`${key}\` contains \${CLAUDE_PLUGIN_ROOT}/DATA; substitution does not run in metadata fields.`,
          location: loc,
          fix: `Replace the variable reference in \`${key}\` with a static value.`,
        }),
      );
    }
  }
  for (const keyword of keywords) {
    if (typeof keyword === "string" && ENV_VAR_RE.test(keyword)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC110",
          message: "Manifest `keywords` contains a ${CLAUDE_PLUGIN_*} reference; substitution does not run in metadata.",
          location: loc,
          fix: "Use plain string keywords.",
        }),
      );
      break;
    }
  }

  // CC120 — stray files in .claude-plugin/
  const claudePluginEntries = await listClaudePluginDir(pluginRoot);
  const stray = claudePluginEntries.filter((entry) => entry !== "plugin.json" && !entry.startsWith("."));
  if (stray.length > 0) {
    findings.push(
      createFinding({
        severity: "warn",
        code: "CC120",
        message: `\`.claude-plugin/\` contains files other than plugin.json: ${stray.join(", ")}.`,
        location: { file: ".claude-plugin/" },
        fix: "Move components (skills/, agents/, hooks/, etc.) to the plugin root; only plugin.json belongs in .claude-plugin/.",
      }),
    );
  }

  // CC130 / CC131 / CC900 — path-like fields
  for (const field of PATH_FIELDS) {
    const value = manifest?.[field];
    if (value == null) continue;
    if (field === "hooks" || field === "mcpServers" || field === "lspServers") {
      // These can be inline objects; only validate when string|array of strings.
      if (typeof value === "object" && !Array.isArray(value)) continue;
    }
    const entries = asArray(value).filter(isPathString);
    for (const entry of entries) {
      if (hasTraversal(entry)) {
        findings.push(
          createFinding({
            severity: "error",
            code: "CC900",
            message: `Manifest field \`${field}\` references a path with \`../\` traversal: ${entry}.`,
            location: loc,
            fix: "Plugin caching strips external paths; keep all references inside the plugin tree.",
          }),
        );
        continue;
      }
      if (!entry.startsWith("./")) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC130",
            message: `Manifest field \`${field}\` value "${entry}" does not start with \`./\`.`,
            location: loc,
            fix: "Prefix paths with `./` (e.g. ./skills/).",
          }),
        );
      }
      const cleaned = entry.replace(/^\.\//, "");
      const onDiskPath = path.join(pluginRoot, cleaned);
      if (!(await pathExists(onDiskPath))) {
        findings.push(
          createFinding({
            severity: "error",
            code: "CC131",
            message: `Manifest field \`${field}\` references missing path "${entry}".`,
            location: loc,
            fix: `Create the path on disk or remove the \`${field}\` declaration.`,
          }),
        );
      }
    }
  }

  // Metrics
  const fieldCount = manifest && typeof manifest === "object" ? Object.keys(manifest).length : 0;
  metrics.push(
    createMetric({
      id: "manifest_field_count",
      category: "manifest",
      value: fieldCount,
      unit: "fields",
      band: fieldCount === 0 ? "info" : fieldCount < 4 ? "moderate" : "good",
    }),
    createMetric({
      id: "manifest_keyword_count",
      category: "manifest",
      value: keywords.length,
      unit: "keywords",
      band: keywords.length === 0 ? "info" : keywords.length < 3 ? "moderate" : "good",
    }),
    createMetric({
      id: "manifest_description_length_chars",
      category: "manifest",
      value: typeof manifest?.description === "string" ? manifest.description.length : 0,
      unit: "chars",
      band:
        typeof manifest?.description === "string" && manifest.description.length > 200
          ? "heavy"
          : typeof manifest?.description === "string" && manifest.description.length > 100
            ? "moderate"
            : "good",
    }),
  );

  return { findings, metrics, artifacts };
}
