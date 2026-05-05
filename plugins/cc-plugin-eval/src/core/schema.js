// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

import { relativePath } from "../lib/files.js";

export const TOOL_NAME = "cc-plugin-eval";
export const TOOL_VERSION = "0.1.0";
export const SCHEMA_VERSION = 1;

// The Claude Code plugin manifest schema, sourced verbatim from
// /tmp/plugin-compare/refs/claude-plugins-reference.md (May 2026 docs.claude.com).
// Writer B's manifest evaluator uses this to validate fields. Only fields documented
// in the reference are listed; unknown fields surface as info-level findings.
export const CLAUDE_PLUGIN_MANIFEST_SCHEMA = {
  required: ["name"],
  metadata: {
    $schema: { type: "string" },
    name: { type: "string", pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/ },
    version: { type: "string", pattern: /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i },
    description: { type: "string", maxChars: 200 },
    author: { type: "object", subkeys: ["name", "email", "url"] },
    homepage: { type: "string" },
    repository: { type: "string" },
    license: { type: "string" },
    keywords: { type: "array", itemType: "string" },
  },
  componentPaths: {
    skills: { types: ["string", "array"], default: "./skills/", mustStartWith: "./" },
    commands: { types: ["string", "array"], default: "./commands/", mustStartWith: "./", deprecated: true },
    agents: { types: ["string", "array"], default: "./agents/", mustStartWith: "./" },
    hooks: { types: ["string", "array", "object"], default: "./hooks/hooks.json", mustStartWith: "./" },
    mcpServers: { types: ["string", "array", "object"], default: "./.mcp.json", mustStartWith: "./" },
    lspServers: { types: ["string", "array", "object"], default: "./.lsp.json", mustStartWith: "./" },
    monitors: { types: ["string", "array"], default: "./monitors/monitors.json", mustStartWith: "./" },
    outputStyles: { types: ["string", "array"], default: "./output-styles/", mustStartWith: "./" },
    themes: { types: ["string", "array"], default: "./themes/", mustStartWith: "./" },
  },
  declarativeFields: {
    userConfig: { type: "object" },
    channels: { type: "array" },
    dependencies: { type: "array" },
  },
  // Per ref §"Environment variables", these substitutions are valid only inside skill
  // content, agent content, hook commands, monitor commands, and MCP/LSP server configs.
  // Validators emit CC110 if they appear in metadata scalar fields.
  envVarsAllowedIn: ["skill-content", "agent-content", "hook-command", "monitor-command", "mcp-config", "lsp-config"],
  envVarsForbiddenIn: ["description", "homepage", "repository", "license", "keywords"],
};

// Maps CC error code prefixes to human-readable categories used in the
// ported `checks[]` schema. Writer A's findingToCheck adapter uses this.
export const CC_CODE_CATEGORY = {
  CC1: "manifest",
  CC2: "skill-structure",
  CC3: "hooks",
  CC4: "mcp",
  CC5: "lsp",
  CC6: "monitors",
  CC7: "agents",
  CC8: "marketplace",
  CC9: "security",
};

export function categoryFromCode(code) {
  if (typeof code !== "string" || code.length < 3) {
    return "best-practice";
  }
  const prefix = code.slice(0, 3);
  return CC_CODE_CATEGORY[prefix] || "best-practice";
}

export function createEvaluationResult(target) {
  return {
    schemaVersion: SCHEMA_VERSION,
    tool: {
      name: TOOL_NAME,
      version: TOOL_VERSION,
    },
    createdAt: new Date().toISOString(),
    target: {
      ...target,
      relativePath: relativePath(process.cwd(), target.path),
    },
    summary: {
      score: 0,
      grade: "F",
      riskLevel: "high",
      riskReasons: [],
      scoreBreakdown: {
        startingScore: 100,
        totalDeductions: 0,
        finalScore: 0,
      },
      checkCounts: {
        total: 0,
        pass: 0,
        warn: 0,
        fail: 0,
        info: 0,
        error: 0,
        warning: 0,
      },
      deductions: [],
      categoryDeductions: [],
      topRecommendations: [],
      whyBullets: [],
      fixFirst: [],
      watchNext: [],
    },
    budgets: {},
    observedUsage: null,
    checks: [],
    metrics: [],
    artifacts: [],
    extensions: [],
    measurementPlan: null,
    improvementBrief: null,
    nextAction: null,
  };
}

export function createCheck({
  id,
  category,
  severity,
  status,
  message,
  evidence = [],
  remediation = [],
  source = "core",
  targetPath = null,
  why = null,
}) {
  return {
    id,
    category,
    severity,
    status,
    message,
    evidence,
    remediation,
    source,
    ...(why ? { why } : {}),
    ...(targetPath ? { targetPath } : {}),
  };
}

export function createMetric({
  id,
  category,
  value,
  unit,
  band = "info",
  source = "core",
  targetPath = null,
}) {
  return {
    id,
    category,
    value,
    unit,
    band,
    source,
    ...(targetPath ? { targetPath } : {}),
  };
}

export function createArtifact({
  id,
  type,
  label,
  description,
  data = null,
  path = null,
  source = "core",
}) {
  return {
    id,
    type,
    label,
    description,
    source,
    ...(path ? { path } : {}),
    ...(data ? { data } : {}),
  };
}

// Writer B's evaluators emit findings via this helper. Per SPEC §5.3.5/§8.4
// the canonical shape is {severity, code, message, location, fix?}. evaluatePlugin
// converts findings to checks via findingToCheck before merging.
export function createFinding({ severity, code, message, location, fix }) {
  return {
    severity,
    code,
    message,
    location: location || null,
    ...(fix ? { fix } : {}),
  };
}
