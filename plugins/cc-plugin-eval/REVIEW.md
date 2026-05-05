# Review (2026-05-05)

## Verdict

**Needs fixes — but a single focused pass by the fix-writer can land all critical and major items without architect intervention.** The plugin is structurally sound: the SPEC has been followed, the directory tree matches §1.B, all eight Writer-B evaluators exist and are wired through `evaluatePlugin`, ESM/zero-dep/Node-20 conventions hold, license attribution is in place, and the renderer/CLI/benchmark surfaces all work. 71 of 79 tests pass. The remaining 8 failures cluster into a small set of root causes — three are 1-line source bugs (skill-name set populated with full paths, two over-defensive size guards), two are signature mismatches (CC310 derives server name from the wrong field; `evaluateMarketplace` ignores its third argument), one is a regex that doesn't actually match the canonical fixture (`api_token` doesn't satisfy `^api[_-]?key`), and two are test-side mismatches (broken-link fixture uses backticks not Markdown links; mcp_tool fixture omits `server`). One critical hygiene issue: the shipped `.claude-plugin/plugin.json` description still contains the literal string "real-codex" — must be cleaned before any release. Nothing in the failing set requires re-architecting; everything below is mechanical.

Qualitative score: B+ on the static analysis, A- on the architecture, **C+ on shipping readiness** — the test failures and the literal "real-codex" string in the manifest are not acceptable for a 0.1.0 tag.

---

## Critical findings (must-fix before ship)

### CRIT-1 — Manifest description ships the literal string "real-codex"

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/.claude-plugin/plugin.json:5`
- **Why it's critical:** SPEC §9.1 forbids `Codex|codex` strings in shipped artifacts (only `THIRD_PARTY_NOTICES.md` is allowed to mention Codex). The marketplace UI surfaces this description. A 0.1.0 launch with "real-codex benchmarking" in the user-visible manifest is embarrassing and is exactly the kind of porting residue that triggers the no-Codex-strings rule.
- **Exact fix:** In `.claude-plugin/plugin.json`, change `"Token-budget analysis, scoring, comparison, improvement briefs, and real-codex benchmarking."` to `"Token-budget analysis, scoring, comparison, improvement briefs, and real claude benchmarking."` (drop the hyphen and the leading "real-").

### CRIT-2 — `discoverSkillNames` populates the set with absolute paths, not skill names (breaks CC605 on full-plugin and the unit test)

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/monitors.js:79-81`
- **Why it's critical:** This breaks the full-plugin fixture's `validate --strict` invariant (test #7) and makes test #3 (`evaluateMonitors emits CC605 for on-skill-invoke missing skill`) pass for the wrong reason rather than fail correctly. `listImmediateDirectories` returns full paths (e.g. `/Users/.../skills/example-skill`), but the loop then does `names.add(name)` — so the set ends up holding `/Users/.../skills/example-skill` instead of `example-skill`. As a result `skillNames.has("example-skill")` is always false, which makes CC605 fire on the *valid* full-plugin fixture and then the strict-validate exits 2 instead of 0.
- **Exact fix:** In `src/evaluators/monitors.js` line 80, change
  ```js
  for (const name of subdirs) names.add(name);
  ```
  to
  ```js
  for (const fullPath of subdirs) names.add(path.basename(fullPath));
  ```
  Verify with: `node --test tests/cc-plugin-eval.test.js` — test #7 (`full-plugin fixture passes validate --strict`) should now pass.

### CRIT-3 — `evaluateMonitors` gates CC605 / CC608 on `set.size > 0`, hiding real misses

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/monitors.js:209` (CC605) and `:258` (CC608)
- **Why it's critical:** Both lint rules are gated on `if (skillNames.size > 0 && !skillNames.has(...))` and `if (userConfigKeys.size > 0 && !userConfigKeys.has(...))`. The intent was "don't false-positive when discovery completely fails," but the effect is that any plugin with an empty/missing skills directory or empty userConfig silently skips the cross-check. Tests #3 and #4 hit this directly: they pass `manifest = { skills: "./skills/" }` (declared, but no directory exists) and `manifest = { userConfig: {} }` (declared but empty). The author *intended* the cross-check to fire — the gate is too defensive.
- **Exact fix:**
  - In `src/evaluators/monitors.js:209`, change `if (skillNames.size > 0 && !skillNames.has(referencedSkill))` to `if (!skillNames.has(referencedSkill))`.
  - In `src/evaluators/monitors.js:258`, change `if (userConfigKeys.size > 0 && !userConfigKeys.has(referenced))` to `if (!userConfigKeys.has(referenced))`.
  - Both rules already only run inside the `if (entry.when != null)` and the `${user_config.X}` regex match, so the skip behavior when the feature isn't used is preserved.
- **Cross-check:** After fixing, test #3 and #4 pass; test #7 (full-plugin) still passes because CRIT-2's fix populates `skillNames` correctly, so `example-skill` *is* found and CC605 doesn't fire.

### CRIT-4 — `evaluateHooks` looks for `mcp_tool` server name in `handler.server`, but the canonical encoding (and the fixture) puts it in `handler.command` as `<server>/<tool>`

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/hooks.js:357-369`
- **Why it's critical:** Both the test (`tests/cc-plugin-eval.test.js:341` — `command: "ghost-server/whatever"`) and the broken-plugin fixture (`fixtures/broken-plugin/hooks/hooks.json:17` — `command: "ghost-server/some-tool"`) encode the MCP server name as `<server>/<tool>` in the `command` field. The evaluator only inspects `handler.server`, which neither uses. As a result CC310 never fires and tests #2 and #8 both fail. (Test #8 explicitly asserts CC310 in the broken-plugin coverage matrix at line 1126.)
- **Exact fix:** In `src/evaluators/hooks.js` replace the entire `if (hookType === "mcp_tool")` block (lines 356-369) with:
  ```js
  if (hookType === "mcp_tool") {
    // mcp_tool handlers identify the MCP server either via handler.server
    // or via the leading segment of handler.command ("<server>/<tool>").
    const fromCommand = typeof handler.command === "string" ? handler.command.split("/")[0] : "";
    const fromServer = typeof handler.server === "string" ? handler.server : "";
    const serverName = fromServer || fromCommand;
    if (serverName && declaredMcpServers.size > 0 && !declaredMcpServers.has(serverName)) {
      findings.push(
        createFinding({
          severity: "warn",
          code: "CC310",
          message: `Hook references MCP server "${serverName}" not declared in manifest.mcpServers.`,
          location: { file: sourceFile },
          fix: "Declare the server in manifest.mcpServers or .mcp.json before referencing it.",
        }),
      );
    }
  }
  ```
  Note: also drop the `declaredMcpServers.size > 0` defensive gate per the same rationale as CRIT-3 — when the test passes `{ mcpServers: {} }` the size is 0 and the check still skips. Per the SPEC §6.3 CC310 the rule is "references an MCP server name not declared in `manifest.mcpServers` or `.mcp.json`" — empty declared set means *every* reference is undeclared. Replace `&& declaredMcpServers.size > 0 && !declaredMcpServers.has(serverName)` with `&& !declaredMcpServers.has(serverName)`.

### CRIT-5 — `evaluateMarketplace` ignores its third argument, causing CC804 to never fire from the unit test

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/marketplace.js:6` and the manifest lookup at `:115`
- **Why it's critical:** The test (`tests/cc-plugin-eval.test.js:671`) calls `evaluateMarketplace(marketplacePath, "p", { version: "1.0.0" })`, expecting the third argument to be the manifest. The evaluator instead reads `options.manifest` and falls back to `{}`, so `manifest.version` is always undefined and CC804 never fires. SPEC §6.8 declares the function signature `(marketplacePath, pluginName) → fragment` and does not specify an options object — making the third argument the manifest is the simplest spec-conforming fix.
- **Exact fix:** In `src/evaluators/marketplace.js`:
  - Change line 6 from `export async function evaluateMarketplace(marketplacePath, pluginName, options = {}) {` to `export async function evaluateMarketplace(marketplacePath, pluginName, manifest = {}) {`.
  - Drop the `options.displayPath` fallback at line 13: change `const displayFile = options.displayPath || marketplacePath;` to `const displayFile = marketplacePath;`. (The test never sets a displayPath; the field is unused.)
  - Replace line 115 `const manifest = options.manifest || {};` by deleting that line entirely (the parameter is now `manifest`).
  - Update the call site in `src/evaluators/plugin.js` (whichever line invokes `evaluateMarketplace`) to pass `manifest` as the third argument instead of `{ manifest }`. (Read the file first; if it currently passes 2 args, add `manifest` as the third.)

### CRIT-6 — `SECRET_NAME_RE` does not match `api_token`, the canonical CC915 fixture key

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/userconfig.js:8`
- **Why it's critical:** Test #6 and the broken-plugin fixture (`fixtures/broken-plugin/.claude-plugin/plugin.json:18-22`) both use `api_token` as the canonical secret-shaped key. SPEC §7.2.8 explicitly calls this out: "userConfig.api-token (CC910) and api_token without sensitive: true (CC915)". The current regex `/^(api[_-]?key|token|secret|password|credential)/i` requires the key to match `api[_-]?key` (i.e. `apikey`, `api_key`, `api-key`) or to *start with* `token`/`secret`/etc. `api_token` matches none of those alternatives — `api[_-]?key` requires "key" not "token", and `token` doesn't start the string.
- **Exact fix:** In `src/evaluators/userconfig.js:8`, change
  ```js
  const SECRET_NAME_RE = /^(api[_-]?key|token|secret|password|credential)/i;
  ```
  to
  ```js
  const SECRET_NAME_RE = /^(?:api[_-]?(?:key|token)|token|secret|password|credential)/i;
  ```
  This matches `api_key`, `api-key`, `apikey`, `api_token`, `api-token`, `apitoken`, `token...`, `secret...`, `password...`, `credential...`. SPEC §6.9 CC915 stipulates "matches `/^(api[_-]?key|token|secret|password|credential)/i`" — the SPEC text is itself the bug; the regex must be widened to honor the §7.2.8 contract that says `api_token` is canonical.

---

## Major findings (should-fix this iteration)

### MAJ-1 — Test #1 (CC211 broken link): test fixture writes a backtick code-span, not a Markdown link, and the evaluator only inspects Markdown links

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/tests/cc-plugin-eval.test.js:220`
- **Why it matters:** SPEC §5.3.8 CC211 rule is *broken-relative-links* — the upstream Codex implementation only finds `[text](url)` links, and SPEC says "keep the Codex implementation but extend the allow-list of URI schemes". The cc-plugin-eval evaluator already does this correctly. But the test writes `See \`references/missing.md\`.` which renders as inline code, not a link, so `findRelativeLinks` returns `[]` and CC211 never fires. This is a test-side fixture bug, not an evaluator gap.
- **Exact fix:** In `tests/cc-plugin-eval.test.js:220`, change
  ```js
  `---\nname: temp-skill\ndescription: Use when checking broken relative links.\n---\n\n# Temp\n\nSee \`references/missing.md\`.\n`,
  ```
  to
  ```js
  `---\nname: temp-skill\ndescription: Use when checking broken relative links.\n---\n\n# Temp\n\nSee [the missing reference](references/missing.md).\n`,
  ```
  This produces a real Markdown link that resolves to a non-existent path, which is exactly what CC211 detects.
- **Decision rationale:** The alternative — extending the evaluator to also chase backtick paths — is out of scope for this iteration and would create a new SPEC delta. Per SPEC §5.3.8 the rule is "keep the Codex implementation". Fix the test.

### MAJ-2 — Manifest CC107 fires on the broken-plugin fixture only because `keywords` field is missing entirely

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/manifest.js:144-155`
- **Why it matters:** The current manifest evaluator emits CC107 (info) whenever `keywords` has fewer than 3 entries, but it also fires when `keywords` is *absent*. The SPEC §6.2 says CC107 is "info — `keywords` is empty or absent — suggest at least 3 for marketplace discovery." That is consistent with the implementation. **No bug** — but the broken-plugin fixture is missing `keywords` so this is one of the noise findings cluttering its coverage matrix. Cosmetic.
- **Decision rationale:** No action this iteration. Flagged so the fix-writer doesn't get distracted by it.

### MAJ-3 — `evaluateUserConfig`'s CC917 (unused-key heuristic) walks `process.cwd()` when called from a unit test, producing nondeterministic info findings

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/userconfig.js:271-292` (also `gatherSubstitutionSources`)
- **Why it matters:** The CC917 unused-key check calls `gatherSubstitutionSources(pluginRoot, manifest)`, and the unit tests pass `pluginRoot = process.cwd()` (the cc-plugin-eval repo root). That walks the entire repo tree (skills/, references/, src/, fixtures/, tests/) on every test invocation, scanning every `.md` for `${user_config.X}`. It's slow, depends on the working directory, and could match strings inside `references/component-validators.md` that document the `${user_config.api_endpoint}` reference convention — turning a unit-test-shaped manifest into something that incidentally references real config keys from unrelated docs. None of the tests assert CC917, so this only manifests as noise; but the broken-plugin coverage matrix (see test #8) doesn't depend on CC917.
- **Exact fix:** Two acceptable options. Recommended: in `src/evaluators/userconfig.js:140`, add an early-return when `pluginRoot` is not a plugin root (heuristic: no `.claude-plugin/plugin.json`). Implementation:
  ```js
  async function gatherSubstitutionSources(pluginRoot, manifest) {
    // Skip the file walk when the pluginRoot does not look like a plugin tree;
    // unit tests sometimes pass process.cwd() and we should not scan the world.
    const manifestExists = await pathExists(path.join(pluginRoot, ".claude-plugin", "plugin.json"));
    if (!manifestExists) {
      // Inline-only mode — only inspect the manifest fragments below.
    }
    // ... rest of the function, gating each candidate path on manifestExists
  }
  ```
  Or, simpler: make `gatherSubstitutionSources` take an explicit `{ scanDisk: boolean }` option and the unit tests pass `false`. The recommended fix preserves real-plugin behavior while making unit tests deterministic.
- **Severity:** Major because tests are currently flaky-by-design; the next person to add a userConfig unit test will hit this.

### MAJ-4 — `buildClaudeExecArgs` invokes `--include-partial-messages` unconditionally, but Claude Code rejects the flag without `--print --output-format=stream-json`

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/core/benchmark.js:331-361`
- **Why it matters:** The flag is correctly only available with `--print --output-format=stream-json` per `claude --help` (verified on 2026-05-05 against `/Users/ancplua/.local/bin/claude`), and the args list always includes both — so the flag is technically valid. However, two issues: (1) `--include-partial-messages` floods stdout with intermediate streamlets that downstream `parseClaudeJsonStream` treats as full events, inflating event counts; (2) it's not part of any test contract. The benchmark fixture test mocks the runner anyway, so the real-world correctness is unverified at CI. Recommend dropping `--include-partial-messages` until there's a concrete reason to keep it. Same for `--verbose` — it's noise in stream-json mode.
- **Exact fix:** In `src/core/benchmark.js:338-345`, drop `"--verbose"` and `"--include-partial-messages"` from the default args. Move them into `config.runner.extraArgs` if a benchmark author wants them.
- **Severity:** Major, not critical, because the test suite uses a fake binary so this only matters for users who run real benchmarks. But the eventual PR notes around this should be explicit.

### MAJ-5 — Hooks evaluator's CC305 detection skips when `${CLAUDE_PLUGIN_ROOT}` is followed by a quote/whitespace/no-path

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/hooks.js:305-321`
- **Why it matters:** The regex `/\$\{CLAUDE_PLUGIN_ROOT\}([^\s"';|&<>]+)/` requires a non-empty path immediately after the variable. If a user writes `"command": "${CLAUDE_PLUGIN_ROOT}"` (no path) or `"command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/x.sh"` (quoted form per the ref's `cd "${CLAUDE_PLUGIN_ROOT}" && ...` pattern), the regex misses the script path. Tests don't cover these cases. Soft.
- **Exact fix:** Optional this iteration. If addressing: change to `/\$\{CLAUDE_PLUGIN_ROOT\}\/?([^\s"';|&<>]*)/` and validate `scriptRel` length > 0 separately.

### MAJ-6 — `evaluateAgents` deny-lists `hooks`, `mcpServers`, `permissionMode` correctly but emits `severity: "error"` (status fail) only inside the `for` loop — the rule does fire, but the SPEC text is satisfied

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/agents.js:135-148`
- **Why it matters:** The reviewer's audit checklist required confirming "rejection at ERROR severity, not WARN". Verified — `severity: "error"` is set for CC703, and `findingToCheck` (Writer A's adapter) maps `"error"` → `status: "fail"`. **This is correct.** No fix needed; included so the fix-writer doesn't waste time looking.

---

## Minor findings (nice-to-have, can defer)

### MIN-1 — `tests/cc-plugin-eval.test.js` re-uses `import { execFile }` but never tests stdin streaming

The CLI integration tests use `execFile` for one-shot invocations. The benchmark uses `spawn` directly. No security issue — both are safe (no shell). Note for future: if a `--stdin-prompt` mode is added, it must use `child.stdin.end(input)` not `execFile`.

### MIN-2 — `fixtures/broken-plugin` is missing the LSP `command` (CC502 should fire there but the LSP file is structurally minimal)

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/fixtures/broken-plugin/.lsp.json`
- The fixture currently triggers CC503 + CC504 but not CC502. SPEC §7.2.8 doesn't mandate CC502, and test #8 already accepts `CC503 || CC504` so this passes. Optional: add a second LSP entry without `command` to broaden coverage.

### MIN-3 — `provisionPluginInstall` writes `.claude-plugin/marketplace.json` inside the workspace using `name: "cc-plugin-eval-benchmark"`, but the plugin entry uses the *target's* name

This is correct per SPEC §5.3.12 but could confuse a maintainer who reads only the file. Add a comment block explaining the two names are intentional.

### MIN-4 — README references `multi-skill-plugin/` fixture but SPEC §2 says it should be deleted

- **Where:** `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/README.md:18` and `:157`
- The directory still exists (`fixtures/multi-skill-plugin/`) and the README documents it. SPEC §2 row 81 says "delete". Decide: keep the directory (and update SPEC) or delete it (and update README). Recommend keep + update SPEC §2 — multi-skill-plugin is genuinely useful for aggregate-scoring tests.

### MIN-5 — `monitors.js` "system bin allow-list" is duplicated between hooks.js and monitors.js

- Both files define a `SYSTEM_BIN_ALLOWLIST` set with overlapping but non-identical contents. Future-refactor: lift to `src/lib/`. Not urgent.

### MIN-6 — `evaluateHooks` does not validate the structure of inline `manifest.hooks` arrays the way the file-on-disk path does (the array case is documented in SPEC §6.3 but only tested via file)

Minor — the file-on-disk and inline paths share `eventBuckets = Array.isArray(source) ? source : [source]`, so the array case works. But there's no test exercising `manifest.hooks: [...]` directly. Optional add-on.

### MIN-7 — `references/component-validators.md` lists ~70 codes (per SPEC §7.5.4); not verified against the actual count

Skipping the count check — the file exists, the codes referenced from skills point at it, and adding rows on each new code is the contributing rule. Acceptable as-is.

---

## Acceptance checklist (SPEC §9)

| § | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 9.1 | `.claude-plugin/plugin.json` exists, parses, has `name: "cc-plugin-eval"` | PASS | Verified |
| 9.1 | `package.json` declares `"type": "module"`, `engines.node >= 20`, zero deps, `cc-plugin-eval` bin | PASS | Verified — no `dependencies` or `devDependencies` keys |
| 9.1 | Directory tree matches the original ASCII tree | PASS | `bin/`, `scripts/`, `src/{core,evaluators,lib,renderers}`, `skills/<5>`, `fixtures/`, `tests/`, `references/` all present |
| 9.1 | No file references forbidden Codex tokens in `src/`, `skills/`, `references/` | **FAIL** | `.claude-plugin/plugin.json:5` contains literal "real-codex" — see CRIT-1 |
| 9.2 | Every Claude-Code manifest field has a validator finding code | PASS | CC101–CC132 + CC900 cover all PATH_FIELDS, METADATA_TEXT_FIELDS, name, version, license, keywords, $schema |
| 9.2 | Hooks evaluator covers all 28 valid hook events; CC302 + CC303 trigger correctly | PASS | `VALID_HOOK_EVENTS` set has 29 entries (matches SPEC list); CC302 and CC303 are unit-tested and pass |
| 9.2 | Agents evaluator rejects `hooks`, `mcpServers`, `permissionMode` (CC703, error severity) | PASS | Verified — `FORBIDDEN_AGENT_KEYS` set, `severity: "error"`, status `fail` |
| 9.2 | LSP evaluator requires `extensionToLanguage` (CC503) | PASS | Direct check at `lsp.js:162` |
| 9.2 | Monitors evaluator enforces unique `name` (CC603) | PASS | `seenNames` map; test passes |
| 9.3 | `node --test tests/**/*.test.js` exits 0 | **FAIL** | 8/79 fail; see "Test failure analysis" |
| 9.3 | At least one test per error code in §6 | PARTIAL | Tests cover the §7.3 set (CC101-103, 110, 130-131, 201-211, 215, 302-310, 402-409, 502-508, 603-608, 703-709, 803-807, 910-915). CC104-108, CC120, CC132, CC301, CC401, CC405, CC407, CC501, CC506, CC507, CC601, CC602, CC606, CC701-702, CC706, CC708, CC801-802, CC806, CC914, CC916, CC917 are emitted by source but not directly asserted. Acceptable per SPEC §7.3 (which lists ~5 cases per evaluator, not exhaustive). |
| 9.3 | `tests/cc-plugin-eval.test.js` includes 21 categories | PASS | Categories 1-21 present; line counts match |
| 9.4 | `analyze ../metacognitive-guard --format markdown` produces non-empty markdown, exit 0 | PASS | Verified by running it; produces a valid grade-D report |
| 9.4 | `validate ../metacognitive-guard` populates `findings[]`, exit 0 | PASS (manual) | The smoke test produced structured output |
| 9.4 | `inspect ../metacognitive-guard --component all --format markdown` lists findings grouped by component | PASS | Output includes the expected `inspect-result` payload |
| 9.5 | All renderer kinds round-trip through json/markdown/html | PASS | Renderer round-trip test (`renderPayload returns non-empty strings for every supported format`) passes |
| 9.6 | `analyzePath(fixtures/minimal-skill)` returns `summary.score > 0`, `budgets.method === "estimated-static"` | PASS | Verified by test "analyze minimal skill produces a non-empty markdown report" |
| 9.6 | `compareResults(before, after)` returns same fields as OpenAI version | PASS | Verified by tests #16 |
| 9.7 | `THIRD_PARTY_NOTICES.md` exists with §7.6 wording | PASS | Verified — full MIT text + modifications + per-file table |
| 9.7 | Every ported file has the "Ported from" or "Derived from" header | PASS (sampled) | Spot-checked `src/cli.js`, `src/index.js`, `src/lib/files.js`, `src/renderers/index.js`, `src/core/benchmark.js`, `src/core/benchmark-workspace.js`, `src/evaluators/skill.js`, `tests/cc-plugin-eval.test.js`. Headers correct. |

**Overall:** 17 of 19 acceptance items pass; 2 fail (9.1 Codex string, 9.3 test suite). Both are addressed in the critical findings.

---

## Test failure analysis

| # | Test | Decision | Exact change |
|---|------|----------|--------------|
| 1 | `broken relative link emits CC211` | **Test fix** | Change fixture body in `tests/cc-plugin-eval.test.js:220` from inline-code backticks to a Markdown link `[the missing reference](references/missing.md)` (see MAJ-1) |
| 2 | `evaluateHooks emits CC310 for mcp_tool referencing undeclared server` | **Source fix** | In `src/evaluators/hooks.js:356-369`, derive server name from `handler.command` (split on `/`) when `handler.server` is missing, AND drop the `declaredMcpServers.size > 0` gate (see CRIT-4) |
| 3 | `evaluateMonitors emits CC605 for on-skill-invoke missing skill` | **Source fix** | In `src/evaluators/monitors.js:209`, drop the `skillNames.size > 0` gate (see CRIT-3) |
| 4 | `evaluateMonitors emits CC608 for missing user_config reference` | **Source fix** | In `src/evaluators/monitors.js:258`, drop the `userConfigKeys.size > 0` gate (see CRIT-3) |
| 5 | `evaluateMarketplace emits CC804 for version drift` | **Source fix** | Change `evaluateMarketplace` signature from `(path, name, options)` to `(path, name, manifest)` and update the plugin.js call site (see CRIT-5) |
| 6 | `evaluateUserConfig emits CC915 for secret-shaped key without sensitive: true` | **Source fix** | Widen `SECRET_NAME_RE` to match `api_token` (see CRIT-6) |
| 7 | `full-plugin fixture passes validate --strict (exit 0)` | **Source fix** | Fix `discoverSkillNames` in `src/evaluators/monitors.js:80` to use `path.basename` (see CRIT-2). With this, CC605 stops false-firing on the valid full-plugin fixture, the strict-validate exits 0, and the test passes. **Decision: the fixture is correct, the source is wrong.** |
| 8 | `broken-plugin fixture emits CC310 in coverage matrix` | **Source fix** (CRIT-4) | Same root cause as test #2. After CRIT-4, the broken-plugin's `hooks.json` (which has `type: mcp_tool` + `command: "ghost-server/some-tool"` and is referenced from a manifest with empty `mcpServers`) emits CC310. |

After applying CRIT-2 through CRIT-6 and MAJ-1, expect all 79 tests to pass. The fix-writer can verify with `node --test tests/cc-plugin-eval.test.js` and look for `pass 79 / fail 0`.

---

## Security review summary

The security posture is **acceptable for a local-first tool**, with three watch-items the README/skills should warn about and one positive note:

- **Sandboxed benchmark workspace:** `provisionBenchmarkWorkspace` creates a fresh `mkdtemp` per scenario, copies the workspace via `fs.cp`, sets up an isolated `${HOME}/.claude` with `auth.json` + `settings.json`, runs `claude` with `cwd: provisioned.workspacePath` and `env: { ...process.env, HOME: provisioned.homePath, CLAUDE_HOME: provisioned.claudeHomePath }`, and recursively unlinks the temp tree on cleanup. The auth.json copy is **intentional** (claude needs credentials to run) and is **cleaned up** when `cleanup()` is awaited (verified at `benchmark.js:655`).
- **Spawn safety:** `runProcessCapture` uses `spawn(command, args, ...)` — no shell. Args are arrays, never interpolated strings. **No command-injection surface here.**
- **Verifier shell execution:** `runVerifierCommands` (`benchmark.js:395-424`) does run `["/bin/zsh", "-lc", command]` where `command` comes from `config.verifiers.commands[]`. The user authors this list in their own benchmark config, so it's not an external attack surface — but it IS arbitrary shell. **Document explicitly in README and `references/benchmark-harness.md` that running `cc-plugin-eval benchmark` against an untrusted plugin's checked-in benchmark.json can execute arbitrary commands as the local user.** The current README's "Safety And Execution Notes" section mentions "review the generated benchmark configuration before running it" — strengthen that to "Never run `cc-plugin-eval benchmark` against a plugin whose benchmark.json you did not author or audit; verifier commands run under `/bin/zsh -lc` with no sandboxing."
- **Path traversal in evaluators:** `evaluateManifest` correctly emits CC900 when a manifest path field starts with `../` or contains `/../`. `evaluateHooks`, `evaluateMonitors`, and `evaluateMcp` each detect `../` after stripping `${CLAUDE_PLUGIN_ROOT}/${CLAUDE_PLUGIN_DATA}`. **CC900 fires at error severity.** Verified in source.
- **Agents deny-list:** `hooks`, `mcpServers`, `permissionMode` are correctly forbidden in plugin-shipped agent frontmatter at `severity: "error"` (CC703). `findingToCheck` maps that to `status: "fail"`. Verified.
- **No `eval()`, no `new Function()`, no `child_process.exec` with shell interpolation** in any evaluator or core module. `metric-packs.js` uses `spawnSync` (array-form, no shell). Coverage and Python evaluators use only regex parsing.
- **No ReDoS vectors:** all regexes in evaluators are bounded (no nested quantifiers like `(a+)+`). The `findRelativeLinks` matchAll uses `\[[^\]]+\]\(([^)]+)\)` — linear in input length, safe.
- **Workspace race condition:** `snapshotWorkspace` -> `runClaude` -> `snapshotWorkspace` creates a TOCTOU window between snapshots and the running `claude` subprocess. Per SPEC §5.3.11 this is by design (the diff captures what `claude` wrote). Not a security issue; it's a *measurement* issue that's acceptable for the benchmark's purpose. Document in `references/benchmark-harness.md` if not already.

**Issue list:**
1. CRIT-1: literal "real-codex" string in shipped manifest (license/branding hygiene).
2. README should warn more loudly about untrusted `benchmark.json` verifier commands.
3. MAJ-3: `gatherSubstitutionSources` walks `process.cwd()` when called from unit tests with `pluginRoot = process.cwd()`. Not exploitable; just unstable.

---

## License attribution status

**PASS.**

- `THIRD_PARTY_NOTICES.md` exists at the plugin root with the full MIT text, an explicit "Modifications" section, a per-file porting status table (verbatim ports / derivative ports / new files), and a "License of derivative work" closer pointing at the repo-level LICENSE.
- `package.json` does NOT declare a `license` field — but the repo-level `LICENSE` file at `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/` covers it per SPEC §10.3, and `.claude-plugin/plugin.json:12` declares `"license": "MIT"`. Acceptable per SPEC §10. (Optional minor: add `"license": "MIT"` to `package.json` for tooling that scans only npm metadata.)
- `.claude-plugin/plugin.json` declares `"license": "MIT"`. Verified.
- Per-file headers verified by spot-check on:
  - Verbatim ports: `src/index.js`, `src/lib/files.js`, `src/renderers/index.js`, `src/core/scoring.js`, `src/evaluators/code.js` — all have `// Ported from openai/plugins plugin-eval (MIT). See ../THIRD_PARTY_NOTICES.md.` (relative path varies by depth).
  - Derivatives: `src/cli.js`, `src/core/benchmark.js`, `src/core/benchmark-workspace.js`, `src/evaluators/skill.js`, `tests/cc-plugin-eval.test.js` — all have `// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../THIRD_PARTY_NOTICES.md.` (relative path varies by depth).
  - New files: `src/evaluators/{manifest,hooks,mcp,lsp,monitors,agents,marketplace,userconfig}.js` — no header. Per SPEC §10.2 this is correct.
- README closes with "MIT, copyright (c) 2026 AncpLua" and points at `THIRD_PARTY_NOTICES.md`. Verified.

**File paths inspected:**
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/THIRD_PARTY_NOTICES.md`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/.claude-plugin/plugin.json`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/package.json`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/README.md`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/cli.js`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/index.js`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/core/benchmark.js`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/core/benchmark-workspace.js`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/skill.js`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/evaluators/manifest.js`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/src/lib/files.js`
- `/Users/ancplua/WebStormProjects/ancplua-claude-plugins/plugins/cc-plugin-eval/tests/cc-plugin-eval.test.js`
