// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

import path from "node:path";

import { createArtifact, createCheck, createMetric } from "../core/schema.js";
import { parseFrontmatter } from "../lib/frontmatter.js";
import { pathExists, readText, relativePath, walkFiles } from "../lib/files.js";

// Per /tmp/plugin-compare/refs/claude-skills-reference.md (May 2026 docs.claude.com)
// the full list of recognized SKILL.md frontmatter keys is:
const ALLOWED_FRONTMATTER_KEYS = new Set([
  "name",
  "description",
  "when_to_use",
  "argument-hint",
  "arguments",
  "disable-model-invocation",
  "user-invocable",
  "allowed-tools",
  "model",
  "effort",
  "context",
  "agent",
  "hooks",
  "paths",
  "shell",
  "license",
  "metadata",
  // skill-creator (the user's existing plugin) emits this; it is not in the ref but is in
  // the wild and harmless. Treated as info-level.
  "compatibility",
]);

// Claude Code per-entry description budget: combined description + when_to_use is
// truncated to 1,536 chars in the listing (see ref §"SKILL.md frontmatter").
const DESCRIPTION_CHAR_BUDGET = 1536;

// Claude Code tool names are PascalCase (Bash, Read, Edit, Skill, Task, etc.) or the
// MCP-style triple-underscore form (mcp__server__tool). Lowercase-only words like
// `bash` or `read` indicate the author confused Claude tool names with shell binaries.
const COMMON_LOWERCASE_TOOL_TYPOS = new Set([
  "bash",
  "read",
  "edit",
  "write",
  "glob",
  "grep",
  "task",
  "skill",
  "websearch",
  "webfetch",
]);

function countCodeFences(markdown) {
  return (markdown.match(/```/g) || []).length / 2;
}

function findRelativeLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter(
      (target) =>
        !target.startsWith("http://") &&
        !target.startsWith("https://") &&
        !target.startsWith("app://") &&
        !target.startsWith("plugin://") &&
        !target.startsWith("rules://") &&
        !target.startsWith("claude://") &&
        !target.startsWith("mailto:") &&
        !target.startsWith("#"),
    );
}

function isKebabCase(value) {
  return /^[a-z0-9-]+$/.test(value) && !value.startsWith("-") && !value.endsWith("-") && !value.includes("--");
}

function isLikelyTaskStyleSkill(body) {
  // A heuristic for SPEC §5.3.8 CC216: `task-style` skills are imperative numbered
  // lists with >5 steps and lacking a "use when" trigger phrase. Soft, info-level.
  const numberedSteps = (body.match(/^\s*\d+\.\s+/gm) || []).length;
  const hasUseWhen = /use when/i.test(body);
  return numberedSteps > 5 && !hasUseWhen;
}

function tokenizeAllowedTools(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function looksLikeLowercaseTypo(toolName) {
  // mcp__server__tool style is fine
  if (toolName.includes("__")) return false;
  // Skill(name) and similar wrappers — strip the inner argument
  const head = toolName.split(/[(\s]/, 1)[0];
  if (!head) return false;
  return COMMON_LOWERCASE_TOOL_TYPOS.has(head);
}

export async function evaluateSkill(skillRoot, options = {}) {
  const prefix = options.prefix ? `${options.prefix}:` : "";
  const skillPath = path.join(skillRoot, "SKILL.md");
  const targetPath = relativePath(process.cwd(), skillRoot);
  const checks = [];
  const metrics = [];
  const artifacts = [];

  if (!(await pathExists(skillPath))) {
    checks.push(
      createCheck({
        id: `${prefix}skill-file-missing`,
        category: "skill-structure",
        severity: "error",
        status: "fail",
        message: "The target skill directory is missing SKILL.md.",
        evidence: [targetPath],
        remediation: ["Add SKILL.md to the skill root."],
        targetPath,
      }),
    );
    return { checks, metrics, artifacts };
  }

  const content = await readText(skillPath);
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const parsed = parseFrontmatter(content);
  const relativeLinks = findRelativeLinks(parsed.body || content);
  const supportFiles = (await walkFiles(skillRoot)).filter((filePath) => filePath !== skillPath);

  if (parsed.errors.length > 0) {
    checks.push(
      createCheck({
        id: `${prefix}CC213`,
        category: "skill-structure",
        severity: "error",
        status: "fail",
        message: "The skill frontmatter could not be parsed.",
        evidence: parsed.errors,
        remediation: ["Fix the YAML frontmatter at the top of SKILL.md."],
        targetPath,
      }),
    );
  }

  const frontmatter = parsed.data || {};
  const unexpectedKeys = Object.keys(frontmatter).filter((key) => !ALLOWED_FRONTMATTER_KEYS.has(key));
  if (unexpectedKeys.length > 0) {
    checks.push(
      createCheck({
        id: `${prefix}CC212`,
        category: "best-practice",
        severity: "warning",
        status: "warn",
        message: "The skill frontmatter contains keys outside the Claude Code skill spec.",
        evidence: unexpectedKeys.map((key) => `Unexpected key: ${key}`),
        remediation: ["Remove non-standard frontmatter keys or move the metadata into references."],
        targetPath,
      }),
    );
  }

  if (!frontmatter.name) {
    checks.push(
      createCheck({
        id: `${prefix}CC205`,
        category: "skill-structure",
        severity: "error",
        status: "fail",
        message: "The skill frontmatter is missing `name`.",
        evidence: [targetPath],
        remediation: ["Add a kebab-case `name` field to the frontmatter."],
        targetPath,
      }),
    );
  } else if (!isKebabCase(frontmatter.name)) {
    checks.push(
      createCheck({
        id: `${prefix}CC206`,
        category: "skill-structure",
        severity: "error",
        status: "fail",
        message: "The skill name should be lowercase kebab-case.",
        evidence: [`Current name: ${frontmatter.name}`],
        remediation: ["Rename the skill using lowercase letters, digits, and single hyphens only."],
        targetPath,
      }),
    );
  } else if (frontmatter.name !== path.basename(skillRoot)) {
    // CC207 — info-level only; Claude tolerates mismatch.
    checks.push(
      createCheck({
        id: `${prefix}CC207`,
        category: "best-practice",
        severity: "info",
        status: "info",
        message: "The skill `name` does not match the directory basename.",
        evidence: [`Directory: ${path.basename(skillRoot)}`, `Manifest: ${frontmatter.name}`],
        remediation: ["Align name with directory if helpful, but Claude tolerates either form."],
        targetPath,
      }),
    );
  }

  const descriptionText = String(frontmatter.description || "");
  const whenToUseText = String(frontmatter.when_to_use || "");
  const combinedDescription = whenToUseText ? `${descriptionText}\n${whenToUseText}` : descriptionText;

  if (!descriptionText) {
    checks.push(
      createCheck({
        id: `${prefix}CC201`,
        category: "skill-structure",
        severity: "error",
        status: "fail",
        message: "The skill frontmatter is missing `description`.",
        evidence: [targetPath],
        remediation: ["Add a description that explains what the skill does and when to use it."],
        targetPath,
      }),
    );
  } else {
    if (combinedDescription.length > DESCRIPTION_CHAR_BUDGET) {
      checks.push(
        createCheck({
          id: `${prefix}CC202`,
          category: "budget",
          severity: "warning",
          status: "warn",
          message: `The combined description and when_to_use exceed Claude's per-entry cap of ${DESCRIPTION_CHAR_BUDGET} characters.`,
          evidence: [`Combined length: ${combinedDescription.length} characters`],
          remediation: ["Shorten description and when_to_use; push details into SKILL.md or references."],
          targetPath,
        }),
      );
    }
    const triggerPattern = /(use when|trigger|triggers on)/i;
    if (!triggerPattern.test(combinedDescription)) {
      checks.push(
        createCheck({
          id: `${prefix}CC203`,
          category: "best-practice",
          severity: "warning",
          status: "warn",
          message: "The description does not advertise when the skill should trigger.",
          evidence: ["Descriptions plus when_to_use are the auto-load surface in Claude Code."],
          remediation: ["Rewrite the description (or when_to_use) to include a clear 'Use when ...' trigger sentence."],
          targetPath,
        }),
      );
    }
    if (!/triggers on:/i.test(combinedDescription) && !whenToUseText) {
      checks.push(
        createCheck({
          id: `${prefix}CC204`,
          category: "best-practice",
          severity: "info",
          status: "info",
          message: "Consider adding a 'Triggers on:' line or a `when_to_use` field for richer auto-load matching.",
          evidence: ["Both forms are recognized by the description budget per Claude's skill spec."],
          remediation: ["Add a 'Triggers on:' bullet list at the end of the description, or set `when_to_use` in frontmatter."],
          targetPath,
        }),
      );
    }
  }

  if (lines.length > 800) {
    checks.push(
      createCheck({
        id: `${prefix}CC209`,
        category: "budget",
        severity: "error",
        status: "fail",
        message: "SKILL.md is extremely large for an always-loaded invocation surface.",
        evidence: [`Line count: ${lines.length}`],
        remediation: ["Move large details into references/ and keep SKILL.md focused on the core workflow."],
        targetPath,
      }),
    );
  } else if (lines.length > 500) {
    checks.push(
      createCheck({
        id: `${prefix}CC210`,
        category: "budget",
        severity: "warning",
        status: "warn",
        message: "SKILL.md exceeds the recommended compact size for progressive disclosure.",
        evidence: [`Line count: ${lines.length}`],
        remediation: ["Trim repetitive detail and move long variants into references/."],
        targetPath,
      }),
    );
  }

  if (lines.length > 350 && supportFiles.filter((filePath) => filePath.includes("/references/")).length === 0) {
    checks.push(
      createCheck({
        id: `${prefix}CC208`,
        category: "best-practice",
        severity: "warning",
        status: "warn",
        message: "The skill is getting large without using references for progressive disclosure.",
        evidence: ["Large skills are easier to maintain when variants live under references/."],
        remediation: ["Move deep detail or edge-case variants into references/ and link them from SKILL.md."],
        targetPath,
      }),
    );
  }

  const brokenLinks = [];
  for (const linkTarget of relativeLinks) {
    const candidatePath = path.resolve(skillRoot, linkTarget);
    const rel = path.relative(skillRoot, candidatePath);
    const escapesSkill = rel === "" ? false : rel.startsWith("..") || path.isAbsolute(rel);
    if (escapesSkill) {
      brokenLinks.push(linkTarget);
      continue;
    }
    if (!(await pathExists(candidatePath))) {
      brokenLinks.push(linkTarget);
    }
  }
  if (brokenLinks.length > 0) {
    checks.push(
      createCheck({
        id: `${prefix}CC211`,
        category: "skill-structure",
        severity: "error",
        status: "fail",
        message: "The skill contains relative links that do not resolve inside the skill directory.",
        evidence: brokenLinks,
        remediation: ["Fix or remove broken links in SKILL.md."],
        targetPath,
      }),
    );
  }

  // CC214 only fires for top-level skill docs (README.md / CHANGELOG.md /
  // CONTRIBUTING.md sitting directly in the skill root); nested README files
  // under references/ etc. are conventional and should not trigger it.
  const extraDocs = supportFiles
    .filter((filePath) => path.dirname(filePath) === skillRoot)
    .map((filePath) => path.basename(filePath))
    .filter((name) => ["README.md", "CHANGELOG.md", "CONTRIBUTING.md"].includes(name));
  if (extraDocs.length > 0) {
    checks.push(
      createCheck({
        id: `${prefix}CC214`,
        category: "best-practice",
        severity: "warning",
        status: "warn",
        message: "The skill includes extra documentation files that usually belong in references/ or outside the skill bundle.",
        evidence: extraDocs,
        remediation: ["Move reusable guidance into references/ and avoid extra top-level docs inside the skill bundle."],
        targetPath,
      }),
    );
  }

  // CC215: allowed-tools syntax check.
  if ("allowed-tools" in frontmatter) {
    const rawAllowedTools = frontmatter["allowed-tools"];
    if (typeof rawAllowedTools === "string" && rawAllowedTools.includes(",")) {
      checks.push(
        createCheck({
          id: `${prefix}CC215`,
          category: "best-practice",
          severity: "info",
          status: "info",
          message: "`allowed-tools` is a comma-separated string; Claude Code expects space-separated or YAML list form.",
          evidence: [`Current value: ${rawAllowedTools}`],
          remediation: ["Use a space-separated string like 'Bash Read Edit' or a YAML list."],
          targetPath,
        }),
      );
    }
    const tokens = tokenizeAllowedTools(rawAllowedTools);
    const lowercaseTypos = tokens.filter(looksLikeLowercaseTypo);
    if (lowercaseTypos.length > 0) {
      checks.push(
        createCheck({
          id: `${prefix}CC215`,
          category: "best-practice",
          severity: "warning",
          status: "warn",
          message: "`allowed-tools` contains lowercase tool names; Claude Code tool names are PascalCase.",
          evidence: lowercaseTypos.map((token) => `Lowercase token: ${token}`),
          remediation: ["Rewrite tool names as Bash, Read, Edit, Skill, Task, or use the mcp__server__tool form."],
          targetPath,
        }),
      );
    }
  }

  // CC216: task-style skills should usually disable model invocation.
  if (
    !frontmatter["disable-model-invocation"] &&
    isLikelyTaskStyleSkill(parsed.body || content)
  ) {
    checks.push(
      createCheck({
        id: `${prefix}CC216`,
        category: "best-practice",
        severity: "info",
        status: "info",
        message: "This skill looks task-style (long imperative numbered list, no 'use when' trigger). Consider `disable-model-invocation: true`.",
        evidence: ["Task-style skills are usually invoked by the user, not auto-loaded by Claude."],
        remediation: ["Set `disable-model-invocation: true` so the skill only fires on explicit invocation."],
        targetPath,
      }),
    );
  }

  metrics.push(
    createMetric({
      id: `${prefix}skill_line_count`,
      category: "budget",
      value: lines.length,
      unit: "lines",
      band: lines.length > 500 ? "heavy" : lines.length > 350 ? "moderate" : "good",
      targetPath,
    }),
    createMetric({
      id: `${prefix}description_length_chars`,
      category: "budget",
      value: combinedDescription.length,
      unit: "chars",
      band:
        combinedDescription.length > DESCRIPTION_CHAR_BUDGET
          ? "heavy"
          : combinedDescription.length > 768
            ? "moderate"
            : "good",
      targetPath,
    }),
    createMetric({
      id: `${prefix}relative_link_count`,
      category: "documentation",
      value: relativeLinks.length,
      unit: "links",
      band: relativeLinks.length > 10 ? "moderate" : "good",
      targetPath,
    }),
    createMetric({
      id: `${prefix}code_fence_count`,
      category: "readability",
      value: countCodeFences(content),
      unit: "blocks",
      band: countCodeFences(content) > 8 ? "moderate" : "good",
      targetPath,
    }),
    createMetric({
      id: `${prefix}support_file_count`,
      category: "documentation",
      value: supportFiles.length,
      unit: "files",
      band: supportFiles.length > 0 ? "good" : "info",
      targetPath,
    }),
  );

  artifacts.push(
    createArtifact({
      id: `${prefix}skill-link-inventory`,
      type: "inventory",
      label: "Skill relative links",
      description: "Relative links found in SKILL.md.",
      data: {
        links: relativeLinks,
      },
    }),
  );

  return { checks, metrics, artifacts };
}
