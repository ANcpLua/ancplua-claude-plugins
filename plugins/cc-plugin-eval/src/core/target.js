// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../../THIRD_PARTY_NOTICES.md.

import path from "node:path";

import { isDirectory, isFile, pathExists, listImmediateDirectories, readJson } from "../lib/files.js";

export async function resolveTarget(inputPath) {
  const resolvedPath = path.resolve(inputPath);
  if (await isFile(resolvedPath)) {
    if (path.basename(resolvedPath) === "SKILL.md") {
      return {
        kind: "skill",
        path: path.dirname(resolvedPath),
        entryPath: resolvedPath,
        name: path.basename(path.dirname(resolvedPath)),
      };
    }
    if (
      path.basename(resolvedPath) === "plugin.json" &&
      path.basename(path.dirname(resolvedPath)) === ".claude-plugin"
    ) {
      return {
        kind: "plugin",
        path: path.dirname(path.dirname(resolvedPath)),
        entryPath: resolvedPath,
        name: path.basename(path.dirname(path.dirname(resolvedPath))),
      };
    }

    return {
      kind: "file",
      path: resolvedPath,
      entryPath: resolvedPath,
      name: path.basename(resolvedPath),
    };
  }

  if (!(await isDirectory(resolvedPath))) {
    throw new Error(`Target path does not exist: ${resolvedPath}`);
  }

  const pluginManifestPath = path.join(resolvedPath, ".claude-plugin", "plugin.json");
  if (await pathExists(pluginManifestPath)) {
    return {
      kind: "plugin",
      path: resolvedPath,
      entryPath: pluginManifestPath,
      name: path.basename(resolvedPath),
    };
  }

  const skillPath = path.join(resolvedPath, "SKILL.md");
  if (await pathExists(skillPath)) {
    return {
      kind: "skill",
      path: resolvedPath,
      entryPath: skillPath,
      name: path.basename(resolvedPath),
    };
  }

  return {
    kind: "directory",
    path: resolvedPath,
    entryPath: resolvedPath,
    name: path.basename(resolvedPath),
  };
}

export async function discoverPluginSkillDirectories(pluginRoot, manifest) {
  const declared = manifest?.skills;
  const configuredPaths = [];
  if (typeof declared === "string") {
    configuredPaths.push(declared.replace(/^\.\//, ""));
  } else if (Array.isArray(declared)) {
    for (const entry of declared) {
      if (typeof entry === "string") configuredPaths.push(entry.replace(/^\.\//, ""));
    }
  } else {
    configuredPaths.push("skills");
  }

  const directories = [];
  const seen = new Set();
  for (const configuredPath of configuredPaths) {
    const skillsRoot = path.join(pluginRoot, configuredPath);
    if (!(await isDirectory(skillsRoot))) {
      continue;
    }
    const candidates = await listImmediateDirectories(skillsRoot);
    for (const candidate of candidates) {
      if (seen.has(candidate)) continue;
      const skillFile = path.join(candidate, "SKILL.md");
      if (await pathExists(skillFile)) {
        seen.add(candidate);
        directories.push(candidate);
      }
    }
  }
  return directories;
}

export async function loadPluginManifest(pluginRoot) {
  const manifestPath = path.join(pluginRoot, ".claude-plugin", "plugin.json");
  return readJson(manifestPath);
}
