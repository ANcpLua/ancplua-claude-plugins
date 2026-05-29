// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

import fs from "node:fs/promises";
import path from "node:path";

import { parseFrontmatter } from "../lib/frontmatter.js";
import { isDirectory, isProbablyTextFile, pathExists, readJson, readText, relativePath, walkFiles } from "../lib/files.js";
import { estimateTokenCount, sumTokenCounts } from "../lib/tokens.js";

// Trigger cost is the always-loaded routing surface, so all descriptions are summed — you
// pay for every one at once. Invoke and deferred are mutually-exclusive on-demand loads:
// Claude loads ONE skill body when a skill is invoked, dispatches ONE agent, pulls ONE
// reference at a time. The honest per-interaction cost is therefore the heaviest single
// component, not the sum. Summing them penalized a plugin for shipping more than one of
// anything — the same bytes-on-disk ≠ tokens-in-context mistake as counting src/.
function maxTokenCount(components) {
  return components.reduce((max, component) => Math.max(max, component.tokens), 0);
}

// The set of Claude Code plugin directories that ship content which can enter a Claude
// context: commands/agents/skills bodies load on invoke, and skill `references/` load on
// demand via progressive disclosure. Everything else in a plugin repo never reaches a
// context and must NOT count against the deferred-token budget:
//   - src/, scripts/, tests/, README/SPEC/CHANGELOG, package.json, build output → scaffolding
//   - hooks/ → hook scripts are EXECUTED as processes (their stdout is the interface); their
//     file contents are never loaded as tokens. Hook *quality* is judged by the hooks
//     evaluator, not the token budget.
// Counting any of these tanked code-/hook-shipping plugins on a cost they never pay.
const PLUGIN_CONTENT_DIRS = new Set(["commands", "agents", "skills", "references"]);

function isWithinPluginContentDir(rootPath, filePath) {
  const [firstSegment] = relativePath(rootPath, filePath).split("/");
  return PLUGIN_CONTENT_DIRS.has(firstSegment);
}

function createComponent(label, componentPath, tokens, note) {
  return {
    label,
    path: componentPath,
    tokens,
    note,
  };
}

function buildBudgetBucket(value, thresholds, components) {
  const [goodMax, moderateMax, heavyMax] = thresholds;
  const band =
    value <= goodMax ? "good" : value <= moderateMax ? "moderate" : value <= heavyMax ? "heavy" : "excessive";
  return {
    value,
    band,
    thresholds: {
      goodMax,
      moderateMax,
      heavyMax,
    },
    components,
  };
}

async function gatherDeferredTextFiles(rootPath, excludeFiles = [], { contentDirsOnly = false } = {}) {
  const files = await walkFiles(rootPath);
  return files.filter(
    (filePath) =>
      !excludeFiles.includes(filePath) &&
      isProbablyTextFile(filePath) &&
      (!contentDirsOnly || isWithinPluginContentDir(rootPath, filePath)),
  );
}

async function computeDeferredComponents(rootPath, excludeFiles = [], options = {}) {
  const files = await gatherDeferredTextFiles(rootPath, excludeFiles, options);
  const components = [];
  for (const filePath of files) {
    const content = await readText(filePath);
    const rel = relativePath(rootPath, filePath);
    components.push(
      createComponent(rel, rel, estimateTokenCount(content), "Deferred supporting file"),
    );
  }
  return components;
}

export async function computeSkillBudget(skillRoot) {
  const skillPath = path.join(skillRoot, "SKILL.md");
  const skillPathRel = relativePath(skillRoot, skillPath);
  const content = await readText(skillPath);
  const parsed = parseFrontmatter(content);
  const name = parsed.data?.name || path.basename(skillRoot);
  const description = parsed.data?.description || "";

  const triggerComponents = [
    createComponent("skill-name", skillPathRel, estimateTokenCount(name), "Always-loaded skill identifier"),
    createComponent(
      "skill-description",
      skillPathRel,
      estimateTokenCount(description),
      "Always-loaded trigger description",
    ),
  ];

  const invokeComponents = [
    createComponent("skill-file", skillPathRel, estimateTokenCount(content), "Loaded when the skill is invoked"),
  ];

  const deferredComponents = await computeDeferredComponents(skillRoot, [skillPath]);

  return {
    kind: "skill",
    trigger_cost_tokens: {
      value: sumTokenCounts(triggerComponents),
      components: triggerComponents,
    },
    invoke_cost_tokens: {
      value: maxTokenCount(invokeComponents),
      components: invokeComponents,
    },
    deferred_cost_tokens: {
      value: maxTokenCount(deferredComponents),
      components: deferredComponents,
    },
  };
}

export async function computePluginBudget(pluginRoot, manifest) {
  const manifestPath = path.join(pluginRoot, ".claude-plugin", "plugin.json");
  const manifestPathRel = relativePath(pluginRoot, manifestPath);
  const manifestContent = await readText(manifestPath);
  const skillDirs = manifest?.skills
    ? await discoverSkillDirs(pluginRoot, manifest.skills)
    : await discoverSkillDirs(pluginRoot, "./skills/");

  const triggerComponents = [
    createComponent(
      "plugin-description",
      manifestPathRel,
      estimateTokenCount(manifest?.description || ""),
      "Plugin marketplace summary",
    ),
    createComponent(
      "keywords",
      manifestPathRel,
      estimateTokenCount((manifest?.keywords || []).join(" ")),
      "Marketplace discovery keywords",
    ),
  ];

  const invokeComponents = [
    createComponent("plugin-manifest", manifestPathRel, estimateTokenCount(manifestContent), "Manifest load cost"),
  ];

  for (const skillDir of skillDirs) {
    const skillPath = path.join(skillDir, "SKILL.md");
    if (!(await pathExists(skillPath))) {
      continue;
    }
    const skillPathRel = relativePath(pluginRoot, skillPath);
    const content = await readText(skillPath);
    const parsed = parseFrontmatter(content);
    triggerComponents.push(
      createComponent(
        `${path.basename(skillDir)}-description`,
        skillPathRel,
        estimateTokenCount(parsed.data?.description || ""),
        "Skill trigger description exposed through the plugin",
      ),
    );
    invokeComponents.push(
      createComponent(
        `${path.basename(skillDir)}-skill-file`,
        skillPathRel,
        estimateTokenCount(content),
        "Skill invocation cost ceiling",
      ),
    );
  }

  const deferredComponents = await computeDeferredComponents(
    pluginRoot,
    [manifestPath, ...skillDirs.map((skillDir) => path.join(skillDir, "SKILL.md"))],
    { contentDirsOnly: true },
  );

  return {
    kind: "plugin",
    trigger_cost_tokens: {
      value: sumTokenCounts(triggerComponents),
      components: triggerComponents,
    },
    invoke_cost_tokens: {
      value: maxTokenCount(invokeComponents),
      components: invokeComponents,
    },
    deferred_cost_tokens: {
      value: maxTokenCount(deferredComponents),
      components: deferredComponents,
    },
  };
}

async function discoverSkillDirs(pluginRoot, skillsPath) {
  const directory = path.join(pluginRoot, skillsPath.replace(/^\.\//, ""));
  if (!(await isDirectory(directory))) {
    return [];
  }
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

export async function computeBudgetProfile(target) {
  if (target.kind === "skill") {
    return computeSkillBudget(target.path);
  }
  if (target.kind === "plugin") {
    const manifest = await readJson(path.join(target.path, ".claude-plugin", "plugin.json"));
    return computePluginBudget(target.path, manifest);
  }

  const files = await gatherDeferredTextFiles(target.path);
  const components = [];
  for (const filePath of files) {
    const content = await readText(filePath);
    const rel = relativePath(target.path, filePath);
    components.push(
      createComponent(rel, rel, estimateTokenCount(content), "Generic text file budget"),
    );
  }
  return {
    kind: target.kind,
    trigger_cost_tokens: { value: 0, components: [] },
    invoke_cost_tokens: { value: 0, components: [] },
    deferred_cost_tokens: { value: maxTokenCount(components), components },
  };
}

export function applyBudgetBands(rawBudget, baseline) {
  const profile = baseline?.[rawBudget.kind] || baseline?.directory || baseline?.skill;
  const trigger = buildBudgetBucket(
    rawBudget.trigger_cost_tokens.value,
    profile.trigger_cost_tokens,
    rawBudget.trigger_cost_tokens.components,
  );
  const invoke = buildBudgetBucket(
    rawBudget.invoke_cost_tokens.value,
    profile.invoke_cost_tokens,
    rawBudget.invoke_cost_tokens.components,
  );
  const deferred = buildBudgetBucket(
    rawBudget.deferred_cost_tokens.value,
    profile.deferred_cost_tokens,
    rawBudget.deferred_cost_tokens.components,
  );
  const total = trigger.value + invoke.value + deferred.value;
  return {
    method: "estimated-static",
    trigger_cost_tokens: trigger,
    invoke_cost_tokens: invoke,
    deferred_cost_tokens: deferred,
    total_tokens: {
      value: total,
      band:
        [trigger.band, invoke.band, deferred.band].includes("excessive")
          ? "excessive"
          : [trigger.band, invoke.band, deferred.band].includes("heavy")
            ? "heavy"
            : [trigger.band, invoke.band, deferred.band].includes("moderate")
              ? "moderate"
              : "good",
    },
  };
}
