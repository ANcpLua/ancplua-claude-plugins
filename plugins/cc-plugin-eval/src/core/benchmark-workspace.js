// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { isProbablyTextFile, isDirectory, readText, relativePath } from "../lib/files.js";

const execFileAsync = promisify(execFile);

const SNAPSHOT_IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".cache",
  ".tmp",
  ".venv",
  "venv",
  "__pycache__",
  ".pytest_cache",
  ".cc-plugin-eval",
]);

function testFilePattern(filePath) {
  return /(^|\/)(tests?|__tests__)\/|(\.test|\.spec)\.|(^|\/)test_[^/]+\.py$/.test(filePath);
}

async function copyDirectory(sourcePath, destinationPath) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.cp(sourcePath, destinationPath, { recursive: true });
}

async function copyIfExists(sourcePath, destinationPath) {
  try {
    await fs.access(sourcePath);
  } catch {
    return false;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
  return true;
}

async function resolveGitRoot(sourcePath) {
  try {
    const { stdout } = await execFileAsync("git", ["-C", sourcePath, "rev-parse", "--show-toplevel"]);
    return stdout.trim();
  } catch (error) {
    throw new Error(
      `Cannot resolve git root for "${sourcePath}": ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

async function createWorkspaceCopy(sourcePath, workspacePath) {
  await copyDirectory(sourcePath, workspacePath);
  return {
    workspacePath,
    cleanup: async () => {
      await fs.rm(workspacePath, { recursive: true, force: true });
    },
  };
}

async function createWorkspaceFromGitWorktree(sourcePath, workspacePath) {
  const repoRoot = await resolveGitRoot(sourcePath);
  await execFileAsync("git", ["-C", repoRoot, "worktree", "add", "--detach", workspacePath]);
  return {
    workspacePath,
    cleanup: async () => {
      await execFileAsync("git", ["-C", repoRoot, "worktree", "remove", "--force", workspacePath]);
    },
  };
}

async function provisionSkillInstall(target, claudeHomePath) {
  // Per Claude's per-user skill location convention, skills live under
  // ~/.claude/skills/<name>/. Inside the isolated workspace we put them at
  // <claudeHomePath>/skills/<name>/.
  const skillPath = path.join(claudeHomePath, "skills", target.name);
  await copyDirectory(target.path, skillPath);
  return skillPath;
}

async function provisionPluginInstall(target, workspacePath) {
  // Project-scope marketplace path is .claude-plugin/marketplace.json per the
  // marketplace ref. The plugin source itself goes under ./plugins/<name>/ inside
  // the workspace and is referenced by relative path from the marketplace entry.
  let manifest = {};
  try {
    const manifestPath = path.join(target.path, ".claude-plugin", "plugin.json");
    const content = await fs.readFile(manifestPath, "utf8");
    manifest = JSON.parse(content);
  } catch {
    // Best effort; the marketplace entry just gets minimal metadata.
  }

  const pluginsRoot = path.join(workspacePath, "plugins");
  const installPath = path.join(pluginsRoot, target.name);
  await copyDirectory(target.path, installPath);

  const marketplacePath = path.join(workspacePath, ".claude-plugin", "marketplace.json");
  const marketplace = {
    name: "cc-plugin-eval-benchmark",
    owner: { name: "cc-plugin-eval" },
    metadata: {
      description: "Isolated workspace marketplace for cc-plugin-eval benchmarks.",
    },
    plugins: [
      {
        name: target.name,
        description: manifest.description || "",
        version: manifest.version || "0.0.0",
        source: `./plugins/${target.name}`,
      },
    ],
  };

  await fs.mkdir(path.dirname(marketplacePath), { recursive: true });
  await fs.writeFile(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`, "utf8");
  return installPath;
}

async function seedClaudeHome(claudeHomePath) {
  const sourceClaudeHome = process.env.CC_PLUGIN_EVAL_CLAUDE_HOME_SOURCE
    ? path.resolve(process.env.CC_PLUGIN_EVAL_CLAUDE_HOME_SOURCE)
    : path.join(os.homedir(), ".claude");

  await fs.mkdir(claudeHomePath, { recursive: true });
  await Promise.all([
    copyIfExists(path.join(sourceClaudeHome, "auth.json"), path.join(claudeHomePath, "auth.json")),
    copyIfExists(path.join(sourceClaudeHome, "settings.json"), path.join(claudeHomePath, "settings.json")),
  ]);
}

export function defaultTargetProvisioningMode(target) {
  if (target.kind === "skill") {
    return "isolated-skill-home";
  }
  if (target.kind === "plugin") {
    return "workspace-plugin-marketplace";
  }
  throw new Error("Benchmarking only supports Claude Code skills and plugins.");
}

export async function provisionBenchmarkWorkspace({ target, config, scenarioId }) {
  const sourcePath = path.resolve(config.workspace.sourcePath);
  if (!(await isDirectory(sourcePath))) {
    throw new Error(`Benchmark workspace.sourcePath must be a directory: ${sourcePath}`);
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), `cc-plugin-eval-${scenarioId}-`));
  const workspacePath = path.join(tempRoot, "workspace");
  const homePath = path.join(tempRoot, "home");
  const claudeHomePath = path.join(homePath, ".claude");
  const setupMode = config.workspace.setupMode || "copy";

  await seedClaudeHome(claudeHomePath);

  const workspace =
    setupMode === "git-worktree"
      ? await createWorkspaceFromGitWorktree(sourcePath, workspacePath)
      : await createWorkspaceCopy(sourcePath, workspacePath);

  let installedTargetPath = null;
  if (config.targetProvisioning.mode === "isolated-skill-home") {
    installedTargetPath = await provisionSkillInstall(target, claudeHomePath);
  } else if (config.targetProvisioning.mode === "workspace-plugin-marketplace") {
    installedTargetPath = await provisionPluginInstall(target, workspacePath);
  } else {
    throw new Error(`Unsupported target provisioning mode: ${config.targetProvisioning.mode}`);
  }

  return {
    tempRoot,
    workspacePath,
    homePath,
    claudeHomePath,
    installedTargetPath,
    setupMode,
    cleanup: async () => {
      await workspace.cleanup();
      await fs.rm(tempRoot, { recursive: true, force: true });
    },
  };
}

async function hashFile(filePath) {
  const hash = createHash("sha1");
  hash.update(await fs.readFile(filePath));
  return hash.digest("hex");
}

async function visitSnapshot(rootPath, currentPath, entries) {
  const directoryEntries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of directoryEntries) {
    const entryPath = path.join(currentPath, entry.name);
    const relativeEntryPath = relativePath(rootPath, entryPath);

    if (entry.isDirectory()) {
      if (SNAPSHOT_IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      await visitSnapshot(rootPath, entryPath, entries);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const stats = await fs.stat(entryPath);
    const isText = isProbablyTextFile(entryPath);
    const text = isText ? await readText(entryPath) : null;

    entries.set(relativeEntryPath, {
      path: relativeEntryPath,
      absolutePath: entryPath,
      size: stats.size,
      hash: await hashFile(entryPath),
      isText,
      lineCount: text === null ? null : text.replace(/\r\n/g, "\n").split("\n").length,
    });
  }
}

export async function snapshotWorkspace(rootPath) {
  const entries = new Map();
  await visitSnapshot(rootPath, rootPath, entries);
  return entries;
}

export function diffWorkspaceSnapshots(beforeSnapshot, afterSnapshot) {
  const added = [];
  const modified = [];
  const deleted = [];

  for (const [filePath, afterEntry] of afterSnapshot.entries()) {
    const beforeEntry = beforeSnapshot.get(filePath);
    if (!beforeEntry) {
      added.push({
        path: filePath,
        status: "added",
        isText: afterEntry.isText,
        lineCountBefore: 0,
        lineCountAfter: afterEntry.lineCount,
        lineDelta: typeof afterEntry.lineCount === "number" ? afterEntry.lineCount : null,
      });
      continue;
    }

    if (beforeEntry.hash !== afterEntry.hash) {
      modified.push({
        path: filePath,
        status: "modified",
        isText: afterEntry.isText || beforeEntry.isText,
        lineCountBefore: beforeEntry.lineCount,
        lineCountAfter: afterEntry.lineCount,
        lineDelta:
          typeof beforeEntry.lineCount === "number" && typeof afterEntry.lineCount === "number"
            ? afterEntry.lineCount - beforeEntry.lineCount
            : null,
      });
    }
  }

  for (const [filePath, beforeEntry] of beforeSnapshot.entries()) {
    if (!afterSnapshot.has(filePath)) {
      deleted.push({
        path: filePath,
        status: "deleted",
        isText: beforeEntry.isText,
        lineCountBefore: beforeEntry.lineCount,
        lineCountAfter: 0,
        lineDelta: typeof beforeEntry.lineCount === "number" ? -beforeEntry.lineCount : null,
      });
    }
  }

  return {
    added: added.sort((a, b) => a.path.localeCompare(b.path)),
    modified: modified.sort((a, b) => a.path.localeCompare(b.path)),
    deleted: deleted.sort((a, b) => a.path.localeCompare(b.path)),
  };
}

export function summarizeWorkspaceDiff(diff) {
  const changedFiles = [...diff.added, ...diff.modified];
  return {
    addedFileCount: diff.added.length,
    modifiedFileCount: diff.modified.length,
    deletedFileCount: diff.deleted.length,
    changedFileCount: changedFiles.length,
    generatedFileCount: diff.added.length,
    generatedTestFileCount: diff.added.filter((entry) => testFilePattern(entry.path)).length,
    changedTestFileCount: changedFiles.filter((entry) => testFilePattern(entry.path)).length,
    changedTextLineDelta: changedFiles.reduce((sum, entry) => sum + (entry.lineDelta || 0), 0),
    changedFiles,
    allChanges: [...diff.added, ...diff.modified, ...diff.deleted],
  };
}
