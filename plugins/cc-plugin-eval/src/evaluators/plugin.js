// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

import path from "node:path";

import { categoryFromCode, createArtifact, createCheck, createMetric } from "../core/schema.js";
import { evaluateSkill } from "./skill.js";
import { discoverPluginSkillDirectories } from "../core/target.js";
import { pathExists, readJson, relativePath } from "../lib/files.js";

// Writer B's evaluators (SPEC §6). Imported by name with the signatures the SPEC
// commits them to so that integrator merges Writer A and B work cleanly.
import { evaluateManifest } from "./manifest.js";
import { evaluateHooks } from "./hooks.js";
import { evaluateMcp } from "./mcp.js";
import { evaluateLsp } from "./lsp.js";
import { evaluateMonitors } from "./monitors.js";
import { evaluateAgents } from "./agents.js";
import { evaluateMarketplace } from "./marketplace.js";
import { evaluateUserConfig } from "./userconfig.js";

async function isCommandsConfigured(manifest, pluginRoot) {
  const declared = manifest?.commands;
  if (declared === undefined || declared === null) {
    return pathExists(path.join(pluginRoot, "commands"));
  }
  if (typeof declared === "string") {
    if (declared.trim() === "") return false;
    return pathExists(path.join(pluginRoot, declared.replace(/^\.\//, "")));
  }
  if (Array.isArray(declared)) {
    return declared.length > 0;
  }
  // Plain objects like `{}` or other truthy non-paths do not configure commands.
  return false;
}

const STATUS_FROM_SEVERITY = {
  error: "fail",
  warn: "warn",
  info: "info",
};

const CHECK_SEVERITY_FROM_FINDING = {
  error: "error",
  warn: "warning",
  info: "info",
};

function findingToCheck(finding, pluginRoot) {
  const status = STATUS_FROM_SEVERITY[finding.severity] || "info";
  const severity = CHECK_SEVERITY_FROM_FINDING[finding.severity] || "info";
  const evidence = finding.location
    ? [`${finding.location.file}${finding.location.line ? `:${finding.location.line}` : ""}`]
    : [];

  return createCheck({
    id: finding.code,
    category: categoryFromCode(finding.code),
    severity,
    status,
    message: finding.message,
    evidence,
    remediation: finding.fix ? [finding.fix] : [],
    source: "evaluator",
    targetPath: relativePath(process.cwd(), pluginRoot),
  });
}

function appendFindingFragment(target, fragment, pluginRoot) {
  if (!fragment) return;
  const findingChecks = (fragment.findings || []).map((finding) => findingToCheck(finding, pluginRoot));
  target.checks.push(...findingChecks);
  target.metrics.push(...(fragment.metrics || []));
  target.artifacts.push(...(fragment.artifacts || []));
}

function appendCheckFragment(target, fragment) {
  if (!fragment) return;
  target.checks.push(...(fragment.checks || []));
  target.metrics.push(...(fragment.metrics || []));
  target.artifacts.push(...(fragment.artifacts || []));
}

async function countDeclaredComponents(pluginRoot, manifest) {
  // Counts plugin component fields whose declared paths actually exist on disk
  // (or whose value is an inline object/array). This is the plugin_component_count
  // metric from SPEC §5.3.7.
  const fields = [
    "skills",
    "commands",
    "agents",
    "hooks",
    "mcpServers",
    "lspServers",
    "monitors",
    "outputStyles",
    "themes",
    "userConfig",
    "channels",
    "dependencies",
  ];
  let count = 0;
  for (const field of fields) {
    const value = manifest?.[field];
    if (!value) continue;
    if (typeof value === "string") {
      const candidate = path.join(pluginRoot, value.replace(/^\.\//, ""));
      if (await pathExists(candidate)) {
        count += 1;
      }
      continue;
    }
    if (Array.isArray(value) && value.length > 0) {
      count += 1;
      continue;
    }
    if (typeof value === "object" && Object.keys(value).length > 0) {
      count += 1;
    }
  }
  return count;
}

export async function evaluatePlugin(pluginRoot) {
  const manifestPath = path.join(pluginRoot, ".claude-plugin", "plugin.json");
  const targetPath = relativePath(process.cwd(), pluginRoot);
  const result = { checks: [], metrics: [], artifacts: [] };

  if (!(await pathExists(manifestPath))) {
    result.checks.push(
      createCheck({
        id: "CC101",
        category: "manifest",
        severity: "error",
        status: "fail",
        message: "The plugin root is missing .claude-plugin/plugin.json.",
        evidence: [targetPath],
        remediation: ["Add .claude-plugin/plugin.json to the plugin root."],
        targetPath,
      }),
    );
    return result;
  }

  let manifest;
  try {
    manifest = await readJson(manifestPath);
  } catch (error) {
    result.checks.push(
      createCheck({
        id: "CC102",
        category: "manifest",
        severity: "error",
        status: "fail",
        message: "plugin.json could not be parsed as JSON.",
        evidence: [error instanceof Error ? error.message : String(error)],
        remediation: ["Fix the JSON syntax in .claude-plugin/plugin.json."],
        targetPath,
      }),
    );
    return result;
  }

  // Dispatch to all Writer B evaluators. Each returns a {findings, metrics, artifacts}
  // fragment per SPEC §6.1; findingToCheck adapts findings into the canonical checks[] shape.
  appendFindingFragment(result, await evaluateManifest(manifest, pluginRoot), pluginRoot);
  appendFindingFragment(result, await evaluateHooks(pluginRoot, manifest), pluginRoot);
  appendFindingFragment(result, await evaluateMcp(pluginRoot, manifest), pluginRoot);
  appendFindingFragment(result, await evaluateLsp(pluginRoot, manifest), pluginRoot);
  appendFindingFragment(result, await evaluateMonitors(pluginRoot, manifest), pluginRoot);
  appendFindingFragment(result, await evaluateAgents(pluginRoot, manifest), pluginRoot);
  appendFindingFragment(result, await evaluateUserConfig(manifest, pluginRoot), pluginRoot);

  // Marketplace lives at <plugin-parent>/<plugin-parent>/.claude-plugin/marketplace.json
  // for the user's monorepo case. SPEC §6.8 only invokes this evaluator if such a file
  // exists; otherwise it is a no-op.
  const marketplacePath = path.resolve(pluginRoot, "..", "..", ".claude-plugin", "marketplace.json");
  if (await pathExists(marketplacePath)) {
    appendFindingFragment(result, await evaluateMarketplace(marketplacePath, manifest?.name, manifest), pluginRoot);
  }

  // Per-skill evaluation. Walk the configured skills directory and run skill.js for each.
  const skillDirs = await discoverPluginSkillDirectories(pluginRoot, manifest);
  if (skillDirs.length === 0) {
    // Only emit CC103 (skills missing) if the plugin also lacks a commands directory
    // — Claude allows commands/ as a flat alternative to skills/.
    // F-cr-023: a truthy but malformed manifest.commands (e.g. `{}` or a path that
    // does not resolve) must NOT silence CC103.
    const commandsConfigured = await isCommandsConfigured(manifest, pluginRoot);
    if (!commandsConfigured) {
      result.checks.push(
        createCheck({
          id: "CC103",
          category: "manifest",
          severity: "warning",
          status: "warn",
          message: "The plugin did not expose any discoverable skills or commands.",
          evidence: [manifest?.skills || "./skills/"],
          remediation: ["Add at least one skill under the configured skills path, or a commands/ directory."],
          targetPath,
        }),
      );
    }
  }

  for (const skillDir of skillDirs) {
    const prefix = `skill:${path.basename(skillDir)}`;
    appendCheckFragment(result, await evaluateSkill(skillDir, { prefix }));
  }

  // Plugin-level metrics: plugin_skill_count, plugin_keyword_count, and the new
  // plugin_component_count from SPEC §5.3.7.
  const componentCount = await countDeclaredComponents(pluginRoot, manifest);
  result.metrics.push(
    createMetric({
      id: "plugin_skill_count",
      category: "manifest",
      value: skillDirs.length,
      unit: "skills",
      band: skillDirs.length > 0 ? "good" : "moderate",
      targetPath,
    }),
    createMetric({
      id: "plugin_keyword_count",
      category: "manifest",
      value: Array.isArray(manifest?.keywords) ? manifest.keywords.length : 0,
      unit: "keywords",
      band: Array.isArray(manifest?.keywords) && manifest.keywords.length > 0 ? "good" : "info",
      targetPath,
    }),
    createMetric({
      id: "plugin_component_count",
      category: "manifest",
      value: componentCount,
      unit: "components",
      band: componentCount > 0 ? "good" : "info",
      targetPath,
    }),
  );

  result.artifacts.push(
    createArtifact({
      id: "plugin-skill-inventory",
      type: "inventory",
      label: "Plugin skills",
      description: "Discoverable skills under the plugin.",
      data: {
        skills: skillDirs.map((skillDir) => relativePath(pluginRoot, skillDir)),
      },
    }),
  );

  return { ...result, manifest };
}

// Convenience export so cli.js / analyze.js can drive a subset of the Writer-B
// evaluators directly for the `inspect` subcommand. See SPEC §3.2/§5.3.2.
export async function evaluatePluginComponents(pluginRoot, components) {
  const manifestPath = path.join(pluginRoot, ".claude-plugin", "plugin.json");
  const targetPath = relativePath(process.cwd(), pluginRoot);
  const result = { checks: [], metrics: [], artifacts: [], findings: [] };

  if (!(await pathExists(manifestPath))) {
    const finding = {
      severity: "error",
      code: "CC101",
      message: "The plugin root is missing .claude-plugin/plugin.json.",
      location: { file: ".claude-plugin/plugin.json" },
      fix: "Add .claude-plugin/plugin.json to the plugin root.",
    };
    result.findings.push(finding);
    result.checks.push(findingToCheck(finding, pluginRoot));
    return result;
  }

  let manifest;
  try {
    manifest = await readJson(manifestPath);
  } catch (error) {
    const parserMessage = error instanceof Error ? error.message : String(error);
    const finding = {
      severity: "error",
      code: "CC102",
      message: `plugin.json could not be parsed as JSON: ${parserMessage}`,
      location: { file: ".claude-plugin/plugin.json" },
      fix: "Validate the JSON with `jq . .claude-plugin/plugin.json` and fix the reported syntax error.",
    };
    result.findings.push(finding);
    result.checks.push(findingToCheck(finding, pluginRoot));
    return result;
  }

  const requested = new Set(components && components.length > 0 ? components : ["all"]);
  const wantAll = requested.has("all");
  const dispatchTable = [
    ["manifest", () => evaluateManifest(manifest, pluginRoot)],
    ["hooks", () => evaluateHooks(pluginRoot, manifest)],
    ["mcp", () => evaluateMcp(pluginRoot, manifest)],
    ["lsp", () => evaluateLsp(pluginRoot, manifest)],
    ["monitors", () => evaluateMonitors(pluginRoot, manifest)],
    ["agents", () => evaluateAgents(pluginRoot, manifest)],
    ["userconfig", () => evaluateUserConfig(manifest, pluginRoot)],
    [
      "marketplace",
      async () => {
        const marketplacePath = path.resolve(pluginRoot, "..", "..", ".claude-plugin", "marketplace.json");
        if (!(await pathExists(marketplacePath))) {
          return { findings: [], metrics: [], artifacts: [] };
        }
        return evaluateMarketplace(marketplacePath, manifest?.name, manifest);
      },
    ],
  ];

  for (const [name, runner] of dispatchTable) {
    if (!wantAll && !requested.has(name)) continue;
    const fragment = await runner();
    if (!fragment) continue;
    result.findings.push(...(fragment.findings || []));
    appendFindingFragment(result, fragment, pluginRoot);
  }

  return result;
}
