// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../THIRD_PARTY_NOTICES.md.

import path from "node:path";

import { compareResults } from "./core/compare.js";
import { analyzePath, explainBudget, recommendMeasures, validatePath } from "./core/analyze.js";
import { initializeBenchmark, runBenchmark } from "./core/benchmark.js";
import { buildWorkflowGuide } from "./core/workflow-guide.js";
import { readJson, writeText } from "./lib/files.js";
import { renderPayload } from "./renderers/index.js";

const VALID_INSPECT_COMPONENTS = new Set([
  "manifest",
  "hooks",
  "mcp",
  "lsp",
  "monitors",
  "agents",
  "marketplace",
  "userconfig",
  "all",
]);

function usage() {
  return `cc-plugin-eval helps Claude Code plugin and skill authors start from chat and keep the workflow local-first.

Start here:
  cc-plugin-eval start <path> [--request "<chat request>"] [--goal evaluate|budget|measure|benchmark|next|validate|inspect|analysis] [--format json|markdown|html] [--output <file>]

Core workflows:
  cc-plugin-eval analyze <path> [--format json|markdown|html] [--output <file>] [--metric-pack <manifest.json>] [--observed-usage <file>] [--brief-out <file>]
  cc-plugin-eval validate <path> [--strict] [--format json|markdown|html] [--output <file>]
  cc-plugin-eval inspect <path> [--component manifest|hooks|mcp|lsp|monitors|agents|marketplace|userconfig|all] [--format json|markdown|html] [--output <file>]
  cc-plugin-eval evaluate-skill <path> [--format json|markdown|html] [--output <file>] [--brief-out <file>]
  cc-plugin-eval improve <path> [--format json|markdown|html] [--output <file>] [--brief-out <file>]
  cc-plugin-eval explain-budget <path> [--format json|markdown] [--output <file>]
  cc-plugin-eval measurement-plan <path> [--format json|markdown] [--observed-usage <file>] [--output <file>]
  cc-plugin-eval init-benchmark <path> [--output <benchmark.json>] [--model <model>] [--format json|markdown]
  cc-plugin-eval benchmark <path> [--config <benchmark.json>] [--usage-out <usage.jsonl>] [--result-out <result.json>] [--model <model>] [--format json|markdown|html] [--output <file>]

Reports:
  cc-plugin-eval report <result.json> [--format json|markdown|html] [--output <file>]
  cc-plugin-eval compare <before.json> <after.json> [--format json|markdown|html] [--output <file>]

Chat-first examples:
  cc-plugin-eval start ./plugins/my-plugin --request "Evaluate this plugin." --format markdown
  cc-plugin-eval start ./skills/my-skill --request "Why did this score that way?" --format markdown
  cc-plugin-eval start ./plugins/my-plugin --request "What should I fix first?" --format markdown
  cc-plugin-eval start ./plugins/my-plugin --request "Validate the manifest." --format markdown
  cc-plugin-eval inspect ./plugins/my-plugin --component hooks --format markdown
  cc-plugin-eval start ./plugins/my-plugin --request "Help me benchmark this plugin." --format markdown
  cc-plugin-eval start ./skills/my-skill --request "What should I run next?" --format markdown

Compatibility aliases:
  guide -> start
  recommend-measures -> measurement-plan
`;
}

function parseOptions(argv) {
  const positional = [];
  const options = {
    format: "json",
    output: null,
    metricPackManifests: [],
    observedUsagePaths: [],
    configPath: null,
    usageOutPath: null,
    resultOutPath: null,
    model: null,
    goal: null,
    request: null,
    briefOut: null,
    strict: false,
    component: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format") {
      options.format = argv[index + 1];
      index += 1;
    } else if (arg === "--output") {
      options.output = argv[index + 1];
      index += 1;
    } else if (arg === "--metric-pack") {
      options.metricPackManifests.push(argv[index + 1]);
      index += 1;
    } else if (arg === "--observed-usage") {
      options.observedUsagePaths.push(argv[index + 1]);
      index += 1;
    } else if (arg === "--config") {
      options.configPath = argv[index + 1];
      index += 1;
    } else if (arg === "--usage-out") {
      options.usageOutPath = argv[index + 1];
      index += 1;
    } else if (arg === "--result-out") {
      options.resultOutPath = argv[index + 1];
      index += 1;
    } else if (arg === "--model") {
      options.model = argv[index + 1];
      index += 1;
    } else if (arg === "--goal") {
      options.goal = argv[index + 1];
      index += 1;
    } else if (arg === "--request") {
      options.request = argv[index + 1];
      index += 1;
    } else if (arg === "--brief-out") {
      options.briefOut = argv[index + 1];
      index += 1;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--component") {
      options.component = argv[index + 1];
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      positional.push(arg);
    }
  }

  return { positional, options };
}

async function emit(payload, format, output) {
  const rendered = renderPayload(payload, format);
  if (output) {
    await writeText(path.resolve(output), rendered);
    return;
  }
  process.stdout.write(rendered);
}

function applyValidateExitCode(payload, options) {
  const counts = payload?.summary?.checkCounts || {};
  const failCount = counts.fail || 0;
  const warnCount = counts.warn || 0;
  if (failCount > 0) {
    process.exitCode = 2;
    return;
  }
  if (options.strict && warnCount > 0) {
    process.exitCode = 2;
  }
}

export async function runCli(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(usage());
    return;
  }

  const { positional, options } = parseOptions(rest);
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  if (command === "analyze") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const result = await analyzePath(positional[0], {
      metricPackManifests: options.metricPackManifests,
      observedUsagePaths: options.observedUsagePaths,
    });
    if (options.briefOut) {
      await writeText(path.resolve(options.briefOut), `${JSON.stringify(result.improvementBrief, null, 2)}\n`);
    }
    await emit(result, options.format, options.output);
    return;
  }

  if (command === "improve") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const result = await analyzePath(positional[0], {
      metricPackManifests: options.metricPackManifests,
      observedUsagePaths: options.observedUsagePaths,
    });
    const briefOut = options.briefOut ? path.resolve(options.briefOut) : null;
    if (briefOut) {
      await writeText(briefOut, `${JSON.stringify(result.improvementBrief, null, 2)}\n`);
    }
    const payload = {
      ...result.improvementBrief,
      kind: "improvement-brief",
      target: result.target,
      summaryReport: result.summary,
      ...(briefOut ? { briefPath: briefOut } : {}),
    };
    await emit(payload, options.format, options.output);
    return;
  }

  if (command === "validate") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const payload = await validatePath(positional[0]);
    applyValidateExitCode(payload, options);
    await emit(payload, options.format, options.output);
    return;
  }

  if (command === "evaluate-skill") {
    if (positional.length < 1) {
      throw new Error("Missing skill path.\n\n" + usage());
    }
    const result = await analyzePath(positional[0], {
      metricPackManifests: options.metricPackManifests,
      observedUsagePaths: options.observedUsagePaths,
    });
    if (result.target.kind !== "skill") {
      throw new Error(`evaluate-skill requires a skill target. Resolved kind: ${result.target.kind}.`);
    }
    if (options.briefOut) {
      await writeText(path.resolve(options.briefOut), `${JSON.stringify(result.improvementBrief, null, 2)}\n`);
    }
    await emit(result, options.format, options.output);
    return;
  }

  if (command === "inspect") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const requested = options.component || "all";
    if (!VALID_INSPECT_COMPONENTS.has(requested)) {
      throw new Error(
        `Unknown --component value: ${requested}. Expected one of: ${[...VALID_INSPECT_COMPONENTS].join(", ")}.`,
      );
    }
    const components = requested === "all" ? ["all"] : [requested];
    const payload = await analyzePath(positional[0], {
      componentsOnly: components,
    });
    await emit(payload, options.format, options.output);
    return;
  }

  if (command === "report") {
    if (positional.length < 1) {
      throw new Error("Missing result.json path.\n\n" + usage());
    }
    const result = await readJson(path.resolve(positional[0]));
    await emit(result, options.format, options.output);
    return;
  }

  if (command === "compare") {
    if (positional.length < 2) {
      throw new Error("Missing before/after result paths.\n\n" + usage());
    }
    const before = await readJson(path.resolve(positional[0]));
    const after = await readJson(path.resolve(positional[1]));
    await emit(compareResults(before, after), options.format, options.output);
    return;
  }

  if (command === "start" || command === "guide") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const payload = await buildWorkflowGuide(positional[0], {
      goal: options.goal,
      request: options.request,
    });
    await emit(payload, options.format, options.output);
    return;
  }

  if (command === "explain-budget") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const payload = await explainBudget(positional[0]);
    await emit(payload, options.format, options.output);
    return;
  }

  if (command === "measurement-plan" || command === "recommend-measures") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const payload = await recommendMeasures(positional[0], {
      observedUsagePaths: options.observedUsagePaths,
    });
    await emit(payload, options.format, options.output);
    return;
  }

  if (command === "init-benchmark") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const payload = await initializeBenchmark(positional[0], {
      outputPath: options.output,
      model: options.model,
    });
    await emit(payload, options.format, null);
    return;
  }

  if (command === "benchmark") {
    if (positional.length < 1) {
      throw new Error("Missing target path.\n\n" + usage());
    }
    const payload = await runBenchmark(positional[0], {
      configPath: options.configPath,
      usageOutPath: options.usageOutPath,
      resultOutPath: options.resultOutPath,
      model: options.model,
    });
    await emit(payload, options.format, options.output);
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}
