// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { analyzeCoverageArtifacts } from "../evaluators/coverage.js";
import { analyzePythonFiles } from "../evaluators/python.js";
import { analyzeTypeScriptFiles } from "../evaluators/typescript.js";
import { formatCommandPath, pathExists, readJson, readText, relativePath, writeJson, writeText } from "../lib/files.js";
import { createBenchmarkRunNextAction, createBenchmarkTemplateNextAction } from "./presentation.js";
import { createArtifact } from "./schema.js";
import { parseClaudeJsonStream, summarizeClaudeEvents } from "./benchmark-events.js";
import {
  defaultTargetProvisioningMode,
  diffWorkspaceSnapshots,
  provisionBenchmarkWorkspace,
  snapshotWorkspace,
  summarizeWorkspaceDiff,
} from "./benchmark-workspace.js";
import { resolveTarget } from "./target.js";
import { buildWorkflowGuide } from "./workflow-guide.js";

const BENCHMARK_SCHEMA_VERSION = 1;
const BENCHMARK_KIND = "cc-plugin-eval-benchmark";

// SPEC §5.3.11: Writer A picks reasonable defaults; Sonnet is the cheaper benchmark
// tier for skills, Opus is the default for plugin-level scenarios. The actual model
// used by the runner is whatever the config or --model flag specifies.
const DEFAULT_MODELS = {
  plugin: "claude-opus-4-7",
  skill: "claude-sonnet-4-7",
};

function sanitizeId(value) {
  return String(value || "scenario")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "scenario";
}

function benchmarkDirectoryForTarget(target) {
  return path.join(target.path, ".cc-plugin-eval");
}

function benchmarkRunsDirectoryForTarget(target) {
  return path.join(benchmarkDirectoryForTarget(target), "runs");
}

function defaultBenchmarkConfigPath(target) {
  return path.join(benchmarkDirectoryForTarget(target), "benchmark.json");
}

function defaultUsageLogPath(target) {
  return path.join(benchmarkDirectoryForTarget(target), "benchmark-usage.jsonl");
}

function defaultModelForTarget(target) {
  return DEFAULT_MODELS[target.kind] || DEFAULT_MODELS.skill;
}

function createRunId() {
  return new Date().toISOString().replaceAll(":", "-").replace(/\..+$/, "");
}

function normalizeScenario(scenario, index) {
  return {
    id: sanitizeId(scenario.id || scenario.title || `scenario-${index + 1}`),
    title: scenario.title || `Scenario ${index + 1}`,
    purpose: scenario.purpose || "",
    userInput: scenario.userInput || "",
    successChecklist: Array.isArray(scenario.successChecklist) ? scenario.successChecklist : [],
  };
}

function normalizeConfig(config, target) {
  if (!config || config.kind !== BENCHMARK_KIND) {
    throw new Error(`Invalid benchmark config. Expected a ${BENCHMARK_KIND} config file.`);
  }

  if (config.schemaVersion !== BENCHMARK_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported benchmark schema version: ${config.schemaVersion}. Re-run \`cc-plugin-eval init-benchmark ${formatCommandPath(target.path)}\` to regenerate the config.`,
    );
  }

  if (config.runner?.type !== "claude-cli") {
    throw new Error('Benchmark runner.type must be "claude-cli".');
  }

  if (!config.workspace?.sourcePath) {
    throw new Error("Benchmark config must set workspace.sourcePath.");
  }

  if (!config.targetProvisioning?.mode) {
    throw new Error("Benchmark config must set targetProvisioning.mode.");
  }

  return config;
}

function buildSetupQuestions(target) {
  const label = target.kind === "plugin" ? "plugin" : "skill";
  return [
    `What are the 3 highest-value real tasks this ${label} should help complete inside a workspace?`,
    `Which scenario is the must-pass end-to-end task for this ${label}?`,
    `What output should exist on disk if the scenario succeeds?`,
    `Which verification command would tell you the result is actually usable?`,
    `What boundary case should this ${label} narrow, refuse, or hand off instead of overreaching on?`,
  ];
}

function buildSkillScenarios(target) {
  return [
    {
      id: "happy-path",
      title: "Happy path implementation",
      purpose: "Run a representative task that should clearly justify using this skill inside the workspace.",
      userInput: `Use the local Claude Code skill "${target.name}" if it helps. Complete a representative task for this skill in the current workspace and leave the result on disk.`,
      successChecklist: [
        "The task is completed in the workspace, not only described.",
        "The final answer explains what changed.",
        "The run stays aligned with the skill's specialty.",
      ],
    },
    {
      id: "follow-up",
      title: "Focused refinement",
      purpose: "Measure whether the skill can improve an implementation cleanly instead of restarting from scratch.",
      userInput: `Use the local Claude Code skill "${target.name}" if it helps. Refine or extend the current workspace with one focused follow-up improvement and finish the change end to end.`,
      successChecklist: [
        "The result makes a concrete change on disk.",
        "The follow-up remains scoped and coherent.",
      ],
    },
    {
      id: "boundary-case",
      title: "Boundary handling",
      purpose: "Check whether the skill avoids overreaching when the task is only a partial fit.",
      userInput: `This task is only a partial match for the local Claude Code skill "${target.name}". Handle the appropriate slice in the workspace and narrow or refuse the rest honestly.`,
      successChecklist: [
        "The run sets good boundaries instead of pretending the skill fits everything.",
        "Any edits stay aligned with the justified scope.",
      ],
    },
  ];
}

function buildPluginScenarios(target) {
  return [
    {
      id: "entrypoint-routing",
      title: "Entrypoint routing",
      purpose: "Check whether the plugin routes a representative request through the right capability and finishes the task in the workspace.",
      userInput: `Use the local Claude Code plugin "${target.name}" if it helps. Handle a representative request for this plugin in the current workspace and finish the task.`,
      successChecklist: [
        "The run uses the right plugin capability.",
        "The result changes the workspace instead of only describing work.",
      ],
    },
    {
      id: "multi-skill-follow-up",
      title: "Multi-capability follow-up",
      purpose: "Measure whether a second request stays coherent when the plugin needs a different angle.",
      userInput: `Use the local Claude Code plugin "${target.name}" if it helps. Complete a follow-up task in the current workspace that needs a different angle from the same plugin, and keep the result cohesive.`,
      successChecklist: [
        "The task completes end to end.",
        "The run stays coherent instead of redoing unrelated work.",
      ],
    },
    {
      id: "plugin-boundary",
      title: "Plugin boundary",
      purpose: "Check whether the plugin narrows scope when the request is a weak match.",
      userInput: `This task is a weak match for the local Claude Code plugin "${target.name}". Handle the appropriate slice in the workspace, leave unrelated work alone, and explain the boundary clearly.`,
      successChecklist: [
        "The run narrows scope instead of forcing a bad fit.",
        "Any edits stay justified by the request.",
      ],
    },
  ];
}

async function createStarterBenchmarkConfig(target, options = {}) {
  if (!["skill", "plugin"].includes(target.kind)) {
    throw new Error("Benchmarking only supports Claude Code skills and plugins.");
  }

  return {
    kind: BENCHMARK_KIND,
    schemaVersion: BENCHMARK_SCHEMA_VERSION,
    version: BENCHMARK_SCHEMA_VERSION,
    targetKind: target.kind,
    targetName: target.name,
    runner: {
      type: "claude-cli",
      model: options.model || defaultModelForTarget(target),
      // Permission/sandbox knobs are passed through verbatim by buildClaudeExecArgs.
      // Defaults match Claude Code's per-session bypass mode (the user runs benchmarks
      // in an isolated workspace, so loosened permissions are bounded by the sandbox).
      permissionMode: "bypassPermissions",
      extraArgs: [],
    },
    workspace: {
      sourcePath: path.resolve(options.sourcePath || process.cwd()),
      setupMode: "copy",
      preserve: "on-failure",
    },
    targetProvisioning: {
      mode: defaultTargetProvisioningMode(target),
    },
    verifiers: {
      commands: [],
    },
    notes: [
      "Edit workspace.sourcePath so it points at the repo or template you want Claude Code to work inside.",
      "Edit the scenarios so they match real tasks instead of generic starter prompts.",
      "Benchmark means real `claude` runs now. There is no simulated dry-run mode.",
    ],
    setupQuestions: buildSetupQuestions(target),
    scenarios: target.kind === "plugin" ? buildPluginScenarios(target) : buildSkillScenarios(target),
  };
}

async function loadBenchmarkConfig(target, options = {}) {
  if (options.configPath) {
    const config = readJson(path.resolve(options.configPath));
    return {
      config: normalizeConfig(await config, target),
      configPath: path.resolve(options.configPath),
      source: "file",
    };
  }

  const defaultConfigPath = defaultBenchmarkConfigPath(target);
  if (await pathExists(defaultConfigPath)) {
    const config = await readJson(defaultConfigPath);
    return {
      config: normalizeConfig(config, target),
      configPath: defaultConfigPath,
      source: "file",
    };
  }

  const generated = await createStarterBenchmarkConfig(target, options);
  return {
    config: generated,
    configPath: null,
    source: "generated",
  };
}

async function runProcessCapture({
  command,
  args,
  cwd,
  env,
  stdoutPath,
  stderrPath,
  stdinInput,
}) {
  const startedAt = Date.now();
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: [stdinInput ? "pipe" : "ignore", "pipe", "pipe"],
  });

  const stdoutChunks = [];
  const stderrChunks = [];

  if (child.stdout) {
    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(chunk);
    });
  }

  if (child.stderr) {
    child.stderr.on("data", (chunk) => {
      stderrChunks.push(chunk);
    });
  }

  if (stdinInput && child.stdin) {
    child.stdin.end(stdinInput);
  }

  const outcome = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      resolve({ code: code ?? 1, signal });
    });
  });

  const stdoutText = Buffer.concat(stdoutChunks).toString("utf8");
  const stderrText = Buffer.concat(stderrChunks).toString("utf8");

  if (stdoutPath) {
    await writeText(stdoutPath, stdoutText);
  }
  if (stderrPath) {
    await writeText(stderrPath, stderrText);
  }

  return {
    ...outcome,
    durationMs: Date.now() - startedAt,
    stdoutText,
    stderrText,
  };
}

function buildObservedUsageLine(target, scenario, usage) {
  return JSON.stringify({
    id: `${target.name}-${scenario.id}`,
    usage: usage.raw || usage,
    metadata: {
      scenario: scenario.title,
      scenario_id: scenario.id,
      benchmark_target_name: target.name,
      benchmark_target_kind: target.kind,
    },
  });
}

// SPEC §5.3.11: the Claude Code CLI invocation. We use
// `claude --print --output-format stream-json` so each tool call and the final usage
// payload arrive as JSON lines on stdout. The test harness substitutes a fake binary
// for offline tests, so the real-world correctness here is confirmed at runtime by
// the benchmark fixture (Writer C). Unknown flags are passed through via extraArgs.
function buildClaudeExecArgs({
  config,
  model,
  workspacePath,
  finalMessagePath,
  prompt,
}) {
  const args = [
    "--print",
    prompt,
    "--output-format",
    "stream-json",
  ];
  if (model) {
    args.push("--model", model);
  }
  if (workspacePath) {
    args.push("--add-dir", workspacePath);
  }
  if (config?.runner?.permissionMode) {
    args.push("--permission-mode", config.runner.permissionMode);
  }
  if (Array.isArray(config?.runner?.extraArgs)) {
    args.push(...config.runner.extraArgs);
  }
  // finalMessagePath is recorded for downstream consumers; the streaming JSON output
  // already contains the final message, so we leave the file write to a post-run step.
  return { args, finalMessagePath };
}

function filterCodeFiles(filePaths) {
  const tsFiles = [];
  const pyFiles = [];

  for (const filePath of filePaths) {
    const extension = path.extname(filePath).toLowerCase();
    if ([".ts", ".tsx", ".mts", ".cts"].includes(extension)) {
      tsFiles.push(filePath);
    } else if (extension === ".py") {
      pyFiles.push(filePath);
    }
  }

  return { tsFiles, pyFiles };
}

async function analyzeChangedWorkspaceCode(workspacePath, changedRelativePaths) {
  const absoluteFilePaths = changedRelativePaths
    .map((filePath) => path.join(workspacePath, filePath))
    .filter((filePath) => path.extname(filePath));
  const { tsFiles, pyFiles } = filterCodeFiles(absoluteFilePaths);
  const tsAnalysis = await analyzeTypeScriptFiles(tsFiles, workspacePath);
  const pyAnalysis = await analyzePythonFiles(pyFiles, workspacePath);
  const coverageAnalysis = await analyzeCoverageArtifacts(workspacePath);

  return {
    checks: [...tsAnalysis.checks, ...pyAnalysis.checks, ...coverageAnalysis.checks],
    metrics: [...tsAnalysis.metrics, ...pyAnalysis.metrics, ...coverageAnalysis.metrics],
    artifacts: [...tsAnalysis.artifacts, ...pyAnalysis.artifacts, ...coverageAnalysis.artifacts],
  };
}

async function runVerifierCommands({ commands, cwd, processRunner, basePath }) {
  const results = [];

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    const stdoutPath = path.join(basePath, `verifier-${index + 1}.stdout.log`);
    const stderrPath = path.join(basePath, `verifier-${index + 1}.stderr.log`);
    const outcome = await processRunner({
      kind: "verifier",
      command: "/bin/zsh",
      args: ["-lc", command],
      cwd,
      env: process.env,
      stdoutPath,
      stderrPath,
    });

    results.push({
      command,
      status: outcome.code === 0 ? "passed" : "failed",
      exitCode: outcome.code,
      signal: outcome.signal || null,
      durationMs: outcome.durationMs,
      stdoutPath,
      stderrPath,
    });
  }

  return results;
}

function summarizeRunScenarios(runScenarios) {
  const usageSamples = runScenarios.filter((scenario) => scenario.usage);
  const completedScenarios = runScenarios.filter((scenario) => scenario.status === "completed").length;
  const failedScenarios = runScenarios.filter((scenario) => scenario.status !== "completed").length;
  const input = usageSamples.reduce((sum, scenario) => sum + (scenario.usage?.input_tokens || 0), 0);
  const output = usageSamples.reduce((sum, scenario) => sum + (scenario.usage?.output_tokens || 0), 0);
  const total = usageSamples.reduce((sum, scenario) => sum + (scenario.usage?.total_tokens || 0), 0);
  const generatedFileCount = runScenarios.reduce((sum, scenario) => sum + (scenario.workspaceSummary?.generatedFileCount || 0), 0);
  const generatedTestFileCount = runScenarios.reduce((sum, scenario) => sum + (scenario.workspaceSummary?.generatedTestFileCount || 0), 0);
  const toolCallCount = runScenarios.reduce((sum, scenario) => sum + (scenario.telemetry?.toolCallCount || 0), 0);
  const shellCommandCount = runScenarios.reduce((sum, scenario) => sum + (scenario.telemetry?.shellCommandCount || 0), 0);
  const failedShellCommands = runScenarios.reduce((sum, scenario) => sum + (scenario.telemetry?.failedShellCommandCount || 0), 0);
  const verifierPassCount = runScenarios.reduce(
    (sum, scenario) => sum + scenario.verifierResults.filter((result) => result.status === "passed").length,
    0,
  );
  const verifierFailCount = runScenarios.reduce(
    (sum, scenario) => sum + scenario.verifierResults.filter((result) => result.status === "failed").length,
    0,
  );

  return {
    scenarioCount: runScenarios.length,
    completedScenarios,
    failedScenarios,
    sampleCount: usageSamples.length,
    usageAvailability:
      usageSamples.length === 0
        ? "unavailable"
        : usageSamples.length === runScenarios.length
          ? "present"
          : "partial",
    averageInputTokens: usageSamples.length > 0 ? Number((input / usageSamples.length).toFixed(2)) : 0,
    averageOutputTokens: usageSamples.length > 0 ? Number((output / usageSamples.length).toFixed(2)) : 0,
    averageTotalTokens: usageSamples.length > 0 ? Number((total / usageSamples.length).toFixed(2)) : 0,
    generatedFileCount,
    generatedTestFileCount,
    toolCallCount,
    shellCommandCount,
    failedShellCommands,
    verifierPassCount,
    verifierFailCount,
  };
}

export async function initializeBenchmark(targetPath, options = {}) {
  const target = await resolveTarget(targetPath);
  const config = await createStarterBenchmarkConfig(target, options);
  const outputPath = path.resolve(options.outputPath || defaultBenchmarkConfigPath(target));
  await writeJson(outputPath, config);

  const payload = {
    kind: "benchmark-template-init",
    createdAt: new Date().toISOString(),
    target: {
      ...target,
      relativePath: relativePath(process.cwd(), target.path),
    },
    configPath: outputPath,
    scenarioCount: config.scenarios.length,
    notes: config.notes,
    setupQuestions: config.setupQuestions || [],
    nextSteps: [
      `Edit ${formatCommandPath(outputPath)} so workspace.sourcePath, scenarios, and verifiers match your real workflow.`,
      `Run the benchmark with: cc-plugin-eval benchmark ${formatCommandPath(target.path)} --config ${formatCommandPath(outputPath)}`,
      "The benchmark result will be written under .cc-plugin-eval/runs/<timestamp>/benchmark-run.json.",
    ],
    workflowGuide: await buildWorkflowGuide(target.path, {
      goal: "benchmark",
    }),
    artifact: createArtifact({
      id: "benchmark-template",
      type: "benchmark-template",
      label: "Benchmark template",
      description: "Starter benchmark config for Claude Code CLI execution.",
      path: outputPath,
    }),
  };
  payload.nextAction = createBenchmarkTemplateNextAction(payload);
  return payload;
}

export async function runBenchmark(targetPath, options = {}) {
  const target = await resolveTarget(targetPath);
  const { config, configPath, source } = await loadBenchmarkConfig(target, options);
  const scenarios = (config.scenarios || []).map(normalizeScenario).filter((scenario) => scenario.userInput);
  if (scenarios.length === 0) {
    throw new Error("Benchmark config does not contain any runnable scenarios.");
  }
  if (options.dryRun) {
    throw new Error(
      "CLI-only benchmarking does not support --dry-run. Edit the benchmark config, then run `cc-plugin-eval benchmark` for a real `claude` execution.",
    );
  }

  const processRunner = options.processRunner || runProcessCapture;
  const claudeExecutable = options.claudeExecutable || process.env.CC_PLUGIN_EVAL_CLAUDE_EXECUTABLE || "claude";
  const runId = createRunId();
  const runDirectory = path.join(benchmarkRunsDirectoryForTarget(target), runId);
  await fs.mkdir(runDirectory, { recursive: true });

  let claudeVersion = "unknown";
  try {
    const versionResult = await processRunner({
      kind: "claude-version",
      command: claudeExecutable,
      args: ["--version"],
      cwd: process.cwd(),
      env: process.env,
      stdoutPath: path.join(runDirectory, "claude-version.stdout.log"),
      stderrPath: path.join(runDirectory, "claude-version.stderr.log"),
    });
    claudeVersion = (versionResult.stdoutText || versionResult.stderrText || "unknown").trim().split(/\r?\n/).pop() || "unknown";
  } catch {
    claudeVersion = "unknown";
  }

  const usageLines = [];
  const runScenarios = [];

  for (let index = 0; index < scenarios.length; index += 1) {
    const scenario = scenarios[index];
    const scenarioDirectory = path.join(runDirectory, `${String(index + 1).padStart(2, "0")}-${scenario.id}`);
    await fs.mkdir(scenarioDirectory, { recursive: true });

    const provisioned = await provisionBenchmarkWorkspace({
      target,
      config,
      scenarioId: scenario.id,
    });
    const beforeSnapshot = await snapshotWorkspace(provisioned.workspacePath);
    const stdoutPath = path.join(scenarioDirectory, "claude.stdout.jsonl");
    const stderrPath = path.join(scenarioDirectory, "claude.stderr.log");
    const finalMessagePath = path.join(scenarioDirectory, "final-message.txt");

    const { args } = buildClaudeExecArgs({
      config,
      model: options.model || config.runner.model || defaultModelForTarget(target),
      workspacePath: provisioned.workspacePath,
      finalMessagePath,
      prompt: scenario.userInput,
    });

    const claudeRun = await processRunner({
      kind: "claude",
      command: claudeExecutable,
      args,
      cwd: provisioned.workspacePath,
      env: {
        ...process.env,
        HOME: provisioned.homePath,
        CLAUDE_HOME: provisioned.claudeHomePath,
      },
      stdoutPath,
      stderrPath,
    });

    const parsedEvents = parseClaudeJsonStream(claudeRun.stdoutText);
    const telemetry = summarizeClaudeEvents(parsedEvents.events);
    telemetry.ignoredLineCount = parsedEvents.ignoredLines.length;

    const afterSnapshot = await snapshotWorkspace(provisioned.workspacePath);
    const workspaceDiff = diffWorkspaceSnapshots(beforeSnapshot, afterSnapshot);
    const workspaceSummary = summarizeWorkspaceDiff(workspaceDiff);
    const generatedCode = await analyzeChangedWorkspaceCode(
      provisioned.workspacePath,
      workspaceSummary.changedFiles.map((entry) => entry.path),
    );
    const verifierResults = await runVerifierCommands({
      commands: Array.isArray(config.verifiers?.commands) ? config.verifiers.commands : [],
      cwd: provisioned.workspacePath,
      processRunner,
      basePath: scenarioDirectory,
    });

    // Best-effort capture of the final assistant message: Claude Code emits it as the
    // last `assistant`/`result` event in stream-json; if available, persist it for
    // downstream consumers under the conventional --output-last-message filename.
    const finalMessage = (() => {
      const reversed = [...parsedEvents.events].reverse();
      for (const event of reversed) {
        if (typeof event?.message?.content === "string") return event.message.content;
        if (typeof event?.text === "string") return event.text;
        if (typeof event?.content === "string") return event.content;
      }
      return "";
    })();
    if (finalMessage) {
      await writeText(finalMessagePath, finalMessage);
    }
    const claudeSucceeded = claudeRun.code === 0 && telemetry.finalStatus !== "failed";
    const verifiersPassed = verifierResults.every((result) => result.status === "passed");
    const scenarioStatus = claudeSucceeded && verifiersPassed ? "completed" : "failed";

    if (telemetry.usage) {
      usageLines.push(buildObservedUsageLine(target, scenario, telemetry.usage));
    }

    const preserveMode = config.workspace.preserve || "on-failure";
    const shouldPreserveWorkspace =
      preserveMode === "always" ||
      (preserveMode === "on-failure" && scenarioStatus !== "completed");

    runScenarios.push({
      id: scenario.id,
      title: scenario.title,
      purpose: scenario.purpose,
      successChecklist: scenario.successChecklist,
      status: scenarioStatus,
      exitCode: claudeRun.code,
      signal: claudeRun.signal || null,
      durationMs: claudeRun.durationMs,
      prompt: scenario.userInput,
      finalMessagePath: (await pathExists(finalMessagePath)) ? finalMessagePath : null,
      finalMessagePreview: finalMessage.trim() || null,
      rawEventLogPath: stdoutPath,
      stderrLogPath: stderrPath,
      usage: telemetry.usage,
      usageAvailability: telemetry.usageAvailability,
      telemetry,
      workspacePath: shouldPreserveWorkspace ? provisioned.workspacePath : null,
      workspaceSummary,
      workspaceChanges: workspaceSummary.allChanges,
      generatedCode,
      verifierResults,
      installedTargetPath: provisioned.installedTargetPath,
      claudeHomePath: provisioned.claudeHomePath,
    });

    if (!shouldPreserveWorkspace) {
      await provisioned.cleanup();
    }
  }

  const usageOutPath = usageLines.length > 0
    ? path.resolve(options.usageOutPath || defaultUsageLogPath(target))
    : null;
  if (usageOutPath) {
    await writeText(usageOutPath, `${usageLines.join("\n")}\n`);
    await writeText(path.join(runDirectory, "observed-usage.jsonl"), `${usageLines.join("\n")}\n`);
  }

  const resultOutPath = path.resolve(options.resultOutPath || path.join(runDirectory, "benchmark-run.json"));
  const summary = summarizeRunScenarios(runScenarios);
  const payload = {
    kind: "benchmark-run",
    createdAt: new Date().toISOString(),
    mode: "claude-cli",
    target: {
      ...target,
      relativePath: relativePath(process.cwd(), target.path),
    },
    claudeVersion,
    config: {
      source,
      path: configPath,
      runnerType: config.runner.type,
      model: options.model || config.runner.model || defaultModelForTarget(target),
      permissionMode: config.runner.permissionMode || "bypassPermissions",
      scenarioCount: scenarios.length,
      workspaceSourcePath: path.resolve(config.workspace.sourcePath),
      workspaceSetupMode: config.workspace.setupMode || "copy",
      workspacePreserve: config.workspace.preserve || "on-failure",
      targetProvisioningMode: config.targetProvisioning.mode,
      verifierCount: Array.isArray(config.verifiers?.commands) ? config.verifiers.commands.length : 0,
    },
    runDirectory,
    usageLogPath: usageOutPath,
    resultPath: resultOutPath,
    summary,
    scenarios: runScenarios,
    nextSteps: usageOutPath
      ? [
          `Analyze the observed usage with: cc-plugin-eval analyze ${formatCommandPath(target.path)} --observed-usage ${formatCommandPath(usageOutPath)} --format markdown`,
          `Review the measurement plan with: cc-plugin-eval measurement-plan ${formatCommandPath(target.path)} --observed-usage ${formatCommandPath(usageOutPath)} --format markdown`,
        ]
      : [
          `Review the benchmark report with: cc-plugin-eval report ${formatCommandPath(resultOutPath)} --format markdown`,
          "If token usage was unavailable, use the workspace outputs and verifier results as the primary quality signal.",
        ],
    workflowGuide: await buildWorkflowGuide(target.path, {
      goal: summary.sampleCount > 0 ? "measure" : "benchmark",
    }),
  };

  payload.nextAction = createBenchmarkRunNextAction(payload);
  await writeJson(resultOutPath, payload);
  return payload;
}
