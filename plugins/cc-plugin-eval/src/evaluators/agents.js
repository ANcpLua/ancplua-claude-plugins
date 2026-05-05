import path from "node:path";
import fs from "node:fs/promises";

import { createFinding, createMetric } from "../core/schema.js";
import { parseFrontmatter, extractFrontmatter } from "../lib/frontmatter.js";
import { pathExists, readText, toPosixPath } from "../lib/files.js";

const ALLOWED_AGENT_KEYS = new Set([
  "name",
  "description",
  "model",
  "effort",
  "maxTurns",
  "tools",
  "disallowedTools",
  "skills",
  "memory",
  "background",
  "isolation",
]);

const FORBIDDEN_AGENT_KEYS = new Set(["hooks", "mcpServers", "permissionMode"]);

const VALID_MODEL_ALIASES = new Set([
  "sonnet",
  "opus",
  "haiku",
  "inherit",
  // Concrete prefixes — accept anything starting with claude-
]);

const VALID_EFFORT_VALUES = new Set(["low", "medium", "high", "xhigh", "max"]);

function asArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    if (value.trim() === "") return [];
    return value.split(/[,\s]+/).filter(Boolean);
  }
  return [];
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isPlausibleModel(value) {
  if (typeof value !== "string" || value === "") return false;
  if (VALID_MODEL_ALIASES.has(value)) return true;
  if (value.startsWith("claude-")) return true;
  return false;
}

async function discoverAgentFiles(pluginRoot, manifest) {
  const fileSet = new Set();
  const declared = manifest?.agents;
  const candidates = [];
  if (typeof declared === "string") candidates.push(declared);
  else if (Array.isArray(declared)) {
    for (const entry of declared) if (typeof entry === "string") candidates.push(entry);
  } else {
    candidates.push("./agents/");
  }
  for (const rel of candidates) {
    const cleaned = rel.replace(/^\.\//, "");
    const target = path.join(pluginRoot, cleaned);
    if (!(await pathExists(target))) continue;
    let stat;
    try {
      stat = await fs.stat(target);
    } catch {
      continue;
    }
    if (stat.isFile() && target.endsWith(".md")) {
      fileSet.add(target);
    } else if (stat.isDirectory()) {
      let entries;
      try {
        entries = await fs.readdir(target);
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (entry.endsWith(".md")) fileSet.add(path.join(target, entry));
      }
    }
  }
  return [...fileSet];
}

export async function evaluateAgents(pluginRoot, manifest) {
  const findings = [];
  const metrics = [];
  const artifacts = [];

  const agentFiles = await discoverAgentFiles(pluginRoot, manifest);
  let agentCount = 0;
  let withIsolation = 0;
  let withDisallowedTools = 0;

  for (const filePath of agentFiles) {
    agentCount += 1;
    const fileRel = toPosixPath(path.relative(pluginRoot, filePath));
    let raw;
    try {
      raw = await readText(filePath);
    } catch (error) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC701",
          message: `Agent file could not be read: ${error instanceof Error ? error.message : String(error)}`,
          location: { file: fileRel },
        }),
      );
      continue;
    }

    const parsed = parseFrontmatter(raw);
    if (parsed.errors.length > 0 || !parsed.data) {
      // CC703 takes precedence over a failed parse: an unparseable frontmatter
      // that still contains forbidden security keys must surface the security
      // finding so the deny-list cannot be hidden behind syntactic noise.
      const extracted = extractFrontmatter(raw);
      const reportedForbidden = new Set();
      if (extracted.frontmatterText) {
        for (const forbidden of FORBIDDEN_AGENT_KEYS) {
          const re = new RegExp(`^${forbidden}\\s*:`, "m");
          if (re.test(extracted.frontmatterText)) {
            reportedForbidden.add(forbidden);
            findings.push(
              createFinding({
                severity: "error",
                code: "CC703",
                message: `Agent frontmatter contains forbidden security field \`${forbidden}\`.`,
                location: { file: fileRel },
                fix: `Remove \`${forbidden}\`; plugin-shipped agents cannot configure ${forbidden} (Claude Code reference).`,
              }),
            );
          }
        }
      }
      findings.push(
        createFinding({
          severity: "error",
          code: "CC701",
          message: "Agent file has no parseable frontmatter.",
          location: { file: fileRel },
          fix: "Add YAML frontmatter delimited by `---` lines at the top of the file.",
        }),
      );
      continue;
    }
    const fm = parsed.data;

    // CC703 — forbidden security fields (highest priority; check first).
    for (const forbidden of FORBIDDEN_AGENT_KEYS) {
      if (Object.prototype.hasOwnProperty.call(fm, forbidden)) {
        findings.push(
          createFinding({
            severity: "error",
            code: "CC703",
            message: `Agent frontmatter contains forbidden security field \`${forbidden}\`.`,
            location: { file: fileRel },
            fix: `Remove \`${forbidden}\`; plugin-shipped agents cannot configure ${forbidden} (Claude Code reference).`,
          }),
        );
      }
    }

    // CC702 — required name + description.
    const missingFields = [];
    if (typeof fm.name !== "string" || fm.name === "") missingFields.push("name");
    if (typeof fm.description !== "string" || fm.description === "") missingFields.push("description");
    if (missingFields.length > 0) {
      findings.push(
        createFinding({
          severity: "error",
          code: "CC702",
          message: `Agent frontmatter is missing required field(s): ${missingFields.join(", ")}.`,
          location: { file: fileRel },
          fix: "Add `name` and `description` to the frontmatter.",
        }),
      );
    }

    // Unknown keys — soft signal (the SPEC allows compatibility metadata; we restrict to known keys).
    for (const key of Object.keys(fm)) {
      if (FORBIDDEN_AGENT_KEYS.has(key)) continue; // already reported as CC703
      if (!ALLOWED_AGENT_KEYS.has(key)) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC702",
            message: `Agent frontmatter contains unknown key \`${key}\`.`,
            location: { file: fileRel },
            fix: "Remove the key or move it under `metadata` if your agent runtime supports it.",
          }),
        );
      }
    }

    // CC704 — model.
    if (Object.prototype.hasOwnProperty.call(fm, "model")) {
      const modelValue = fm.model;
      if (modelValue === "" || typeof modelValue === "number" || (typeof modelValue === "string" && !isPlausibleModel(modelValue))) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC704",
            message: `Agent \`model\` "${String(modelValue)}" is not a recognized alias (sonnet, opus, haiku, inherit) or claude-* model id.`,
            location: { file: fileRel },
            fix: "Use sonnet, opus, haiku, inherit, or a concrete claude-* model id.",
          }),
        );
      }
    }

    // CC705 — effort.
    if (Object.prototype.hasOwnProperty.call(fm, "effort")) {
      if (typeof fm.effort !== "string" || !VALID_EFFORT_VALUES.has(fm.effort)) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC705",
            message: `Agent \`effort\` "${String(fm.effort)}" is not low|medium|high|xhigh|max.`,
            location: { file: fileRel },
          }),
        );
      }
    }

    // CC706 — maxTurns.
    if (Object.prototype.hasOwnProperty.call(fm, "maxTurns")) {
      if (!isPositiveInteger(fm.maxTurns)) {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC706",
            message: `Agent \`maxTurns\` "${String(fm.maxTurns)}" is not a positive integer.`,
            location: { file: fileRel },
          }),
        );
      }
    }

    // CC707 — isolation.
    if (Object.prototype.hasOwnProperty.call(fm, "isolation")) {
      if (fm.isolation !== "worktree") {
        findings.push(
          createFinding({
            severity: "warn",
            code: "CC707",
            message: `Agent \`isolation\` "${String(fm.isolation)}" is not "worktree" (the only valid value).`,
            location: { file: fileRel },
            fix: 'Set isolation to "worktree" or remove the field.',
          }),
        );
      } else {
        withIsolation += 1;
      }
    }

    // CC708 — body too short.
    const body = parsed.body || "";
    if (body.trim().length < 50) {
      findings.push(
        createFinding({
          severity: "info",
          code: "CC708",
          message: "Agent body is shorter than 50 characters; consider documenting role, expertise, and behavior.",
          location: { file: fileRel },
        }),
      );
    }

    // CC709 — tools and disallowedTools overlap.
    const tools = new Set(asArray(fm.tools));
    const disallowed = new Set(asArray(fm.disallowedTools));
    if (disallowed.size > 0) withDisallowedTools += 1;
    const overlap = [...tools].filter((tool) => disallowed.has(tool));
    if (overlap.length > 0) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC709",
          message: `Agent \`tools\` and \`disallowedTools\` overlap on: ${overlap.join(", ")}.`,
          location: { file: fileRel },
          fix: "Pick one — either grant the tool or deny it.",
        }),
      );
    }
  }

  metrics.push(
    createMetric({
      id: "agent_count",
      category: "agents",
      value: agentCount,
      unit: "agents",
      band: "info",
    }),
    createMetric({
      id: "agent_with_isolation_count",
      category: "agents",
      value: withIsolation,
      unit: "agents",
      band: "info",
    }),
    createMetric({
      id: "agent_with_disallowed_tools_count",
      category: "agents",
      value: withDisallowedTools,
      unit: "agents",
      band: "info",
    }),
  );

  return { findings, metrics, artifacts };
}
