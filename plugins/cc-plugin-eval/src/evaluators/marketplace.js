import { createFinding, createMetric } from "../core/schema.js";
import { pathExists, readText } from "../lib/files.js";

export async function evaluateMarketplace(marketplacePath, pluginName, manifest = {}) {
  const findings = [];
  const metrics = [];
  const artifacts = [];

  // The integrator passes an absolute path; emit it unchanged.
  const displayFile = marketplacePath;

  if (!(await pathExists(marketplacePath))) {
    return { findings, metrics, artifacts };
  }

  let raw;
  try {
    raw = await readText(marketplacePath);
  } catch (error) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC801",
        message: `Marketplace file could not be read: ${error instanceof Error ? error.message : String(error)}`,
        location: { file: displayFile },
      }),
    );
    return { findings, metrics, artifacts };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC801",
        message: `Marketplace file does not parse as JSON: ${error instanceof Error ? error.message : String(error)}`,
        location: { file: displayFile },
      }),
    );
    return { findings, metrics, artifacts };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC801",
        message: "Marketplace file root is not an object.",
        location: { file: displayFile },
      }),
    );
    return { findings, metrics, artifacts };
  }

  // CC802 — required top-level fields.
  const missingTop = [];
  if (typeof data.name !== "string" || data.name === "") missingTop.push("name");
  if (!Array.isArray(data.plugins)) missingTop.push("plugins");
  if (missingTop.length > 0) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC802",
        message: `Marketplace is missing required field(s): ${missingTop.join(", ")}.`,
        location: { file: displayFile },
        fix: "Add `name` and a `plugins` array. Recommended: `owner` and `metadata.description`.",
      }),
    );
  }

  // CC807 — duplicate plugin entries.
  const plugins = Array.isArray(data.plugins) ? data.plugins : [];
  const seen = new Map();
  for (let i = 0; i < plugins.length; i += 1) {
    const entry = plugins[i];
    if (!entry || typeof entry !== "object") continue;
    const name = entry.name;
    if (typeof name !== "string" || name === "") continue;
    if (seen.has(name)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC807",
          message: `Marketplace has duplicate plugin entries for "${name}" (indexes ${seen.get(name)} and ${i}).`,
          location: { file: displayFile },
          fix: "Remove the duplicate entry from `plugins[]`.",
        }),
      );
    } else {
      seen.set(name, i);
    }
  }

  // CC803 — plugin not in entries.
  const matched = plugins.find(
    (entry) => entry && typeof entry === "object" && entry.name === pluginName,
  );
  if (!matched) {
    findings.push(
      createFinding({
        severity: "error",
        code: "CC803",
        message: `Plugin "${pluginName}" is not listed in marketplace.plugins[].`,
        location: { file: displayFile },
        fix: `Add an entry with name="${pluginName}", description, version, and source.`,
      }),
    );
  } else {
    // CC804 — version drift.
    if (
      typeof matched.version === "string" &&
      typeof manifest.version === "string" &&
      matched.version !== manifest.version
    ) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC804",
          message: `Marketplace entry version "${matched.version}" differs from plugin.json version "${manifest.version}".`,
          location: { file: displayFile },
          fix: "Bump or align the versions; plugin.json wins at resolution time but drift confuses operators.",
        }),
      );
    }

    // CC805 — source path.
    const expectedSource = `./plugins/${pluginName}`;
    if (typeof matched.source === "string" && matched.source !== expectedSource) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC805",
          message: `Marketplace entry \`source\` "${matched.source}" does not match expected "${expectedSource}".`,
          location: { file: displayFile },
          fix: `Set source to "${expectedSource}".`,
        }),
      );
    }

    // CC806 — description drift.
    if (
      typeof matched.description === "string" &&
      typeof manifest.description === "string" &&
      matched.description !== manifest.description
    ) {
      findings.push(
        createFinding({
          severity: "info",
          code: "CC806",
          message: "Marketplace entry description differs from plugin.json description.",
          location: { file: displayFile },
          fix: "Keep marketplace and plugin.json descriptions aligned for predictable UX.",
        }),
      );
    }
  }

  metrics.push(
    createMetric({
      id: "marketplace_plugin_count",
      category: "marketplace",
      value: plugins.length,
      unit: "plugins",
      band: "info",
    }),
  );

  return { findings, metrics, artifacts };
}
