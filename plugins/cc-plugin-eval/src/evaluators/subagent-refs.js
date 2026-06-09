import path from "node:path";
import fs from "node:fs/promises";

import { createFinding } from "../core/schema.js";
import { pathExists, readText, toPosixPath } from "../lib/files.js";
import { parseFrontmatter } from "../lib/frontmatter.js";

// Built-in subagent types the Task tool resolves without a plugin agent file.
const BUILTIN_AGENT_TYPES = new Set([
  "general-purpose",
  "Explore",
  "Plan",
  "output-style-setup",
  "statusline-setup",
]);

// Documentation placeholders — not real dispatch targets, never flagged.
const PLACEHOLDER_REFS = new Set([
  "agent",
  "agent-name",
  "name",
  "subagent",
  "type",
  "plugin:agent",
  "plugin:agent-name",
]);

// Only the two real dispatch forms — not arbitrary prose mentioning "subagent".
const SUBAGENT_PATTERNS = [
  // Task-tool dispatch: subagent_type="x" / subagent_type: x
  /subagent_type\s*[:=]\s*["']?([A-Za-z0-9:._-]+)/g,
  // Blockquote annotation convention used across the marketplace: > subagent: x
  /^\s*>\s*subagent\s*:\s*["']?([A-Za-z0-9:._-]+)/g,
];

async function listMarkdownFiles(dir) {
  if (!(await pathExists(dir))) return [];
  let entries;
  try {
    entries = await fs.readdir(dir, { recursive: true, withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.join(entry.parentPath ?? dir, entry.name));
    }
  }
  return files;
}

function pluginDir(repoRoot, entry) {
  const source =
    entry && typeof entry.source === "string" ? entry.source : `./plugins/${entry?.name}`;
  return path.resolve(repoRoot, source);
}

// Index every marketplace agent, by bare `name` and by `plugin:name` id.
async function buildAgentIndex(repoRoot, plugins) {
  const bareNames = new Set();
  const qualifiedIds = new Set();
  for (const entry of plugins) {
    if (!entry || typeof entry !== "object" || typeof entry.name !== "string") continue;
    const agentsDir = path.join(pluginDir(repoRoot, entry), "agents");
    for (const file of await listMarkdownFiles(agentsDir)) {
      let raw;
      try {
        raw = await readText(file);
      } catch {
        continue;
      }
      const name = parseFrontmatter(raw)?.data?.name;
      if (typeof name === "string" && name) {
        bareNames.add(name);
        qualifiedIds.add(`${entry.name}:${name}`);
      }
    }
  }
  return { bareNames, qualifiedIds };
}

function resolvesAgainst(ref, index) {
  if (BUILTIN_AGENT_TYPES.has(ref) || PLACEHOLDER_REFS.has(ref)) return true;
  if (ref.includes(":")) return index.qualifiedIds.has(ref);
  return index.bareNames.has(ref);
}

/**
 * CC710 — cross-plugin subagent-reference resolver.
 *
 * Scans every plugin's markdown for dispatched subagents (`subagent_type=...`
 * and the `> subagent: ...` annotation) and flags any that resolve to no
 * marketplace agent and no built-in type. This is the check whose absence let
 * `subagent_type: deep-debugger` be dispatched across 7 files with zero agent
 * definitions and fail silently at dispatch (PRs #300/#302). It must run at
 * marketplace scope so cross-plugin `plugin:agent` references resolve.
 *
 * @param {string} repoRoot Absolute repo root (parent of the plugins dir).
 * @param {Array<object>} plugins The `plugins[]` array from marketplace.json.
 * @returns {Promise<{ findings: object[], scanned: number }>}
 */
export async function findUnresolvedSubagents(repoRoot, plugins) {
  const findings = [];
  let scanned = 0;
  if (!repoRoot || !Array.isArray(plugins) || plugins.length === 0) {
    return { findings, scanned };
  }
  const index = await buildAgentIndex(repoRoot, plugins);
  for (const entry of plugins) {
    if (!entry || typeof entry !== "object" || typeof entry.name !== "string") continue;
    for (const file of await listMarkdownFiles(pluginDir(repoRoot, entry))) {
      let raw;
      try {
        raw = await readText(file);
      } catch {
        continue;
      }
      const rel = toPosixPath(path.relative(repoRoot, file));
      const lines = raw.split("\n");
      for (let i = 0; i < lines.length; i += 1) {
        for (const pattern of SUBAGENT_PATTERNS) {
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(lines[i])) !== null) {
            const ref = match[1];
            if (!ref) continue;
            scanned += 1;
            if (!resolvesAgainst(ref, index)) {
              findings.push(
                createFinding({
                  severity: "warn",
                  code: "CC710",
                  message: `Subagent "${ref}" resolves to no agent in the marketplace and is not a built-in type — it dispatches against nothing and fails silently.`,
                  location: { file: rel, line: i + 1 },
                  fix: "Point it at a real agent (a defined agents/*.md name or a plugin:agent id) or a built-in type (general-purpose, Explore, Plan).",
                }),
              );
            }
          }
        }
      }
    }
  }
  return { findings, scanned };
}
