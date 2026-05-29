// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

import path from "node:path";

import { loadBudgetBaseline } from "./baseline.js";
import { applyBudgetBands, computeBudgetProfile } from "./budget.js";
import { buildImprovementBrief } from "./improvement-brief.js";
import { buildMeasurementPlan } from "./measurement-plan.js";
import { runMetricPacks } from "./metric-packs.js";
import { analyzeObservedUsage } from "./observed-usage.js";
import {
  applyEvaluationPresentation,
  createBudgetNextAction,
  createInspectNextAction,
  createMeasurementPlanNextAction,
} from "./presentation.js";
import { createArtifact, createCheck, createEvaluationResult, createMetric } from "./schema.js";
import { computeSummary, summarizeChecks } from "./scoring.js";
import { resolveTarget } from "./target.js";
import { buildWorkflowGuide } from "./workflow-guide.js";
import { analyzeCodeMetrics } from "../evaluators/code.js";
import { analyzeCoverageArtifacts } from "../evaluators/coverage.js";
import { evaluatePlugin, evaluatePluginComponents } from "../evaluators/plugin.js";
import { evaluateSkill } from "../evaluators/skill.js";

function appendFragment(result, fragment) {
  result.checks.push(...(fragment.checks || []));
  result.metrics.push(...(fragment.metrics || []));
  result.artifacts.push(...(fragment.artifacts || []));
}

function addBudgetFindings(result, budgets, baselineEvidence) {
  result.budgets = budgets;
  const bucketNames = ["trigger_cost_tokens", "invoke_cost_tokens", "deferred_cost_tokens"];

  for (const bucketName of bucketNames) {
    const bucket = budgets[bucketName];
    result.metrics.push(
      createMetric({
        id: bucketName,
        category: "budget",
        value: bucket.value,
        unit: "tokens",
        band: bucket.band,
      }),
    );

    if (bucket.band === "heavy" || bucket.band === "excessive") {
      result.checks.push(
        createCheck({
          id: `${bucketName}-budget-high`,
          category: "budget",
          severity: bucket.band === "excessive" ? "error" : "warning",
          status: bucket.band === "excessive" ? "fail" : "warn",
          message: `${bucketName} is ${bucket.band} relative to the current Claude Code baseline.`,
          evidence: [
            `Value: ${bucket.value} tokens`,
            `Baseline: ${baselineEvidence.source} (${bucket.thresholds.goodMax}/${bucket.thresholds.moderateMax}/${bucket.thresholds.heavyMax} good/moderate/heavy)`,
          ],
          remediation: ["Reduce repeated instruction text and move detail into deferred supporting files."],
        }),
      );
    }
  }

  result.artifacts.push(
    createArtifact({
      id: "budget-breakdown",
      type: "budget",
      label: "Budget breakdown",
      description: "Trigger, invoke, and deferred token budget analysis.",
      data: {
        budgets,
        baselineEvidence,
      },
    }),
  );
}

function normalizeExtensionPayload(extension) {
  return {
    ...extension,
    checks: extension.checks.map((check) => ({ ...check, source: `extension:${extension.name}` })),
    metrics: extension.metrics.map((metric) => ({ ...metric, source: `extension:${extension.name}` })),
    artifacts: extension.artifacts.map((artifact) => ({ ...artifact, source: `extension:${extension.name}` })),
  };
}

async function buildInspectResult(target, options) {
  // SPEC §3.2 / §5.3.2: inspect runs ONLY the requested Writer-B evaluators and skips
  // budget, code, coverage, measurement, observed-usage, improvement-brief, and the
  // workflow-guide build. Output kind is "inspect-result".
  if (target.kind !== "plugin") {
    throw new Error("inspect only supports plugin targets (a directory containing .claude-plugin/plugin.json).");
  }

  const components = Array.isArray(options.componentsOnly) && options.componentsOnly.length > 0
    ? options.componentsOnly
    : ["all"];
  const fragment = await evaluatePluginComponents(target.path, components);

  const stub = {
    target,
    checks: fragment.checks || [],
    metrics: fragment.metrics || [],
    artifacts: fragment.artifacts || [],
    budgets: {},
    observedUsage: null,
  };
  const summary = computeSummary(stub);

  const payload = {
    kind: "inspect-result",
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    tool: { name: "cc-plugin-eval", version: "0.1.0" },
    target,
    componentsRequested: components,
    findings: fragment.findings || [],
    checks: stub.checks,
    metrics: stub.metrics,
    artifacts: stub.artifacts,
    summary: {
      score: summary.score,
      grade: summary.grade,
      riskLevel: summary.riskLevel,
      checkCounts: summarizeChecks(stub.checks),
      findingCounts: {
        total: (fragment.findings || []).length,
        error: (fragment.findings || []).filter((f) => f.severity === "error").length,
        warn: (fragment.findings || []).filter((f) => f.severity === "warn").length,
        info: (fragment.findings || []).filter((f) => f.severity === "info").length,
      },
    },
  };
  payload.nextAction = createInspectNextAction(payload);
  return payload;
}

export async function analyzePath(targetPath, options = {}) {
  const target = await resolveTarget(targetPath);

  if (Array.isArray(options.componentsOnly) && options.componentsOnly.length > 0) {
    return buildInspectResult(target, options);
  }

  const result = createEvaluationResult(target);

  if (target.kind === "skill") {
    appendFragment(result, await evaluateSkill(target.path));
  } else if (target.kind === "plugin") {
    appendFragment(result, await evaluatePlugin(target.path));
  } else {
    result.checks.push(
      createCheck({
        id: "generic-target-analysis",
        category: "best-practice",
        severity: "info",
        status: "info",
        message: "The target is not a skill or plugin root, so only generic code, coverage, and budget analysis will run.",
        evidence: [path.resolve(target.path)],
        remediation: ["Point the analyzer at a skill directory or plugin root for richer structural checks."],
      }),
    );
  }

  const baseline = await loadBudgetBaseline();
  const rawBudget = await computeBudgetProfile(target);
  addBudgetFindings(result, applyBudgetBands(rawBudget, baseline), baseline.evidence);

  const observedUsageFragment = await analyzeObservedUsage(options.observedUsagePaths || [], rawBudget, target);
  if (observedUsageFragment) {
    result.observedUsage = observedUsageFragment.observedUsage;
    appendFragment(result, observedUsageFragment);
  }

  appendFragment(result, await analyzeCodeMetrics(target.path, target));
  appendFragment(result, await analyzeCoverageArtifacts(target.path));

  const extensions = await runMetricPacks(target, options.metricPackManifests || []);
  result.extensions = extensions.map(normalizeExtensionPayload);

  result.summary = computeSummary(result);
  result.measurementPlan = buildMeasurementPlan(result);
  result.artifacts.push(result.measurementPlan.artifact);
  result.improvementBrief = buildImprovementBrief(result);
  result.workflowGuide = await buildWorkflowGuide(target.path, {
    goal: result.observedUsage?.sampleCount ? "measure" : "evaluate",
  });
  result.measurementPlan.nextAction = createMeasurementPlanNextAction(result.measurementPlan);
  applyEvaluationPresentation(result);
  return result;
}

export async function explainBudget(targetPath) {
  const target = await resolveTarget(targetPath);
  const baseline = await loadBudgetBaseline();
  const rawBudget = await computeBudgetProfile(target);
  const payload = {
    kind: "budget-explanation",
    createdAt: new Date().toISOString(),
    target,
    budgets: applyBudgetBands(rawBudget, baseline),
    baselineEvidence: baseline.evidence,
    workflowGuide: await buildWorkflowGuide(target.path, {
      goal: "budget",
    }),
  };
  payload.nextAction = createBudgetNextAction(payload);
  return payload;
}

export async function recommendMeasures(targetPath, options = {}) {
  const result = await analyzePath(targetPath, options);
  const payload = {
    ...result.measurementPlan,
    workflowGuide: await buildWorkflowGuide(result.target.path, {
      goal: "measure",
    }),
  };
  payload.nextAction = payload.nextAction || createMeasurementPlanNextAction(payload);
  return payload;
}

// Validate-only mode: same dispatch as analyze, but skips budget/code/coverage/observed
// and returns a payload tagged mode: "validate". Used by cli `validate` and `--strict`.
export async function validatePath(targetPath, options = {}) {
  const target = await resolveTarget(targetPath);
  const result = createEvaluationResult(target);
  result.mode = "validate";

  if (target.kind === "skill") {
    appendFragment(result, await evaluateSkill(target.path));
  } else if (target.kind === "plugin") {
    appendFragment(result, await evaluatePlugin(target.path));
  } else {
    result.checks.push(
      createCheck({
        id: "validate-target-not-plugin-or-skill",
        category: "manifest",
        severity: "info",
        status: "info",
        message: "Validate only runs on a skill directory or plugin root; the target is neither.",
        evidence: [path.resolve(target.path)],
        remediation: ["Point validate at a directory containing SKILL.md or .claude-plugin/plugin.json."],
      }),
    );
  }

  result.summary = computeSummary(result);
  result.workflowGuide = await buildWorkflowGuide(target.path, {
    goal: "validate",
  });
  applyEvaluationPresentation(result);
  return result;
}
