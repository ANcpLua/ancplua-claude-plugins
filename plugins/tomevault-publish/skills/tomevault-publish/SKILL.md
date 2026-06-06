---
name: tomevault-publish
description: Publish a Skill, config, or plugin to TomeVault as a high-grade Tome — and understand the Skill / Tome / AGENTS.md model behind it. Use when shipping instruction files to TomeVault, indexing a repo, aiming for a Gold grade, passing the TomeVault scan or validator, or answering "what is a Tome / Skill / AGENTS.md". Covers the npx tomevault CLI, the Studio web publish flow, and the grading rubric.
allowed-tools: Read, Grep, Glob, Bash, WebFetch
---

# tomevault-publish

Everything needed to take an instruction file from a repo to a published, high-grade TomeVault Tome — distilled so you never re-read the docs. Two halves: the **model** (what Skills, Tomes, and configs are) and the **workflow** (CLI, Studio publish, grading rubric).

## 1. The model

### Instruction files
An "instruction file" is any Markdown file beside your code that tells an AI tool something true. Two loading patterns:

- **Always-on config** — loads every turn. `AGENTS.md` (repo root, cross-tool) is the 2026 default; `CLAUDE.md` (Claude-only), `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`, and `GEMINI.md` are tool-specific equivalents. Keep it terse — it costs context on every task. Read by Claude Code, Cursor, Codex CLI, Copilot CLI, and Gemini CLI.
- **On-demand skill** — `SKILL.md` loads only when a task matches its description. It costs nothing until it triggers.

The test for "config vs skill": *does this apply to almost every task in the repo?* Yes means AGENTS.md; only sometimes means a Skill.

### Skill
A folder plus a `SKILL.md` with two parts:

1. **Header (frontmatter `description`)** — under 1024 characters, imperative, intent-focused. The description *is* the trigger. Write the body in the same voice — direct, imperative lines, which agents follow more reliably than soft suggestions.
2. **Body** — under 500 lines or 5000 tokens. Steps, gotchas, examples. Bulk goes into a `references/` folder, loaded on demand.

Write a Skill when you would otherwise explain the same procedure more than twice. Universal rules belong in AGENTS.md, not a Skill.

### AGENTS.md vs SKILL.md

| Aspect | AGENTS.md | SKILL.md |
|--------|-----------|----------|
| Loads | Every conversation, always on | Only when the task matches its description |
| For | Truths about the whole project | One specific procedure |
| Lives | One file at repo root | A folder with SKILL.md plus optional files |
| Context cost | Every task | Nothing until it triggers |
| Trigger | Its existence | The `description` field |

Most projects keep one AGENTS.md alongside several Skills — complementary, not competing.

### CLAUDE.md
Same structure and purpose as AGENTS.md, but Claude-only. Prefer **AGENTS.md** (works in five tools). Migration is a single rename: `CLAUDE.md` becomes `AGENTS.md`, commit, done — Claude Code reads both.

### Tome
A portable bundle: an `AGENTS.md` (or `CLAUDE.md`) **plus one or more Skills**, packaged with provenance. Three parts:

- a `tome.json` manifest (every file's path, kind, and hash),
- the files themselves,
- a canonical reproducible hash derived from the manifest and contents.

Provenance is creator plus last-scan date plus quality grade plus SHA-256 hashes; tools verify the hash before trusting the bundle. A Tome is **not** a single converted file — it is the package. **You write Skills and configs; you publish Tomes.** A Tome needs at least one included file — a config and/or one or more Skills. A **skill-only Tome is valid**: Studio labels it "Skill-only Tome — add a Config to complete the bundle", but it publishes and grades fine without a config.

### Progressive disclosure
Only load what you need, when you need it — three layers: description (always, under 1024 chars), body (on disk until relevant), references (only when the Skill asks). Cost scales with usage, not library size, so 100+ Skills stay cheap.

### Skill vs neighbours
- **Skill vs MCP** — a Skill is content (*how to think* about a task). MCP is connectivity (a wire to live data, APIs, files). Not competing — compose a Skill for procedure with an MCP server for access.
- **Skill vs Subagent** — a Skill is a file read into the current context. A Subagent is a separate instance with its own context window and tool list. A Subagent can itself load Skills.

### Distribution standard
`.well-known/agent-skills/index.json` (RFC 8615, merging into the agentskills.io spec): each entry has `name`, `description`, `type`, `url`, and `digest` (SHA-256, verified after download — a mismatch refuses to load). Open, no central registry.

### Cross-format coexistence
- `AGENTS.local.md` **adds** (gitignored, per-machine).
- `AGENTS.override.md` **replaces** (in git, per-worktree).
- `@AGENTS.md` imports inline (Claude Code; dropped on `/compact`).

Pick one canonical file (AGENTS.md in 2026); make tool-specific files thin pointers.

### Cursor rules that silently fail
Agent mode reads `.cursor/rules/*.mdc` and `AGENTS.md`, not legacy root `.cursorrules`. Causes: wrong location, malformed YAML frontmatter (needs valid `description`, `globs`, `alwaysApply`, spaces not tabs), wrong `alwaysApply`, or context compaction dropping rules mid-session. Keep critical rules short; start fresh threads for big tasks.

## 2. The CLI — `npx tomevault` (no install)

```bash
npx tomevault inspect                  # instruction files in this repo plus index status
npx tomevault scan SKILL.md            # local safety, clarity, loadability check (nothing uploaded)
npx tomevault convert                  # detect repo from git remote, check if indexed
npx tomevault init                     # pull missing format conversions locally (repo must be indexed)
npx tomevault search "otel dotnet"     # search the public index
npx tomevault install facebook/react   # install someone else's Tome or skills
```

**Verified gotchas:**

- `convert` does **not** submit — it only checks and prints the web URL. There is **no login command**; the CLI is unauthenticated and **cannot publish to the remote**.
- `convert facebook/react` (shorthand) errors with "Invalid GitHub URL". Pass a full `https://github.com/facebook/react`, or run bare `convert` inside the repo.
- `publish tome.json` expects **schema-v1 JSON**. The docs teach **draft-01 `tome.yaml`**; the shipping CLI does **not** consume draft-01 yet. Never hand-write `tome.lock` — its hash is tool-generated and a mismatch refuses to render.
- `init` only **adds** missing formats; it never overwrites existing files or replaces symlinks.

## 3. Remote publish — Studio (the only path that works)

Publishing is a signed-in web action; the CLI cannot do it.

0. **Sign in first.** TomeVault is free; sign in with GitHub from `https://tomevault.io/account`. Your **creator handle is your GitHub handle** (for example `ANcpLua`) — that is also the name others install by.
1. Go straight to `https://tomevault.io/studio` — it opens the editor directly and your draft auto-saves in the browser; signing in is required only to **publish**, not to edit or grade. (You can also reach it via **Open Studio** on `https://tomevault.io/account/overview`.)
2. **New Tome**, then set **name**, **description** (one sentence), and **slug**.
3. **New file**, toggle **Skill** or **Config**, set the filename (`SKILL.md` or `AGENTS.md`), and paste the content. The right panel scores Quality and Security live as you type.
4. When the Tome reads **Gold** (see section 4), click **Publish**, then the confirm panel's **Publish**, until it shows "Tome queued".
5. Verify under `/account/repos`, in the **Published Tomes** list. Distribution to Claude, Cursor, Gemini, Copilot, and Windsurf lands within about ten minutes.
6. Anyone installs your work with `npx tomevault install ANcpLua/ancplua-claude-plugins` — install targets are `owner/repo`, not a bare handle (the CLI rejects `install ANcpLua` with "Invalid target. Use owner/repo format.").

To index a whole **repo** instead, submit its GitHub URL at `https://tomevault.io/convert` while signed in (owner-only; the CLI just points there).

## 4. Grading rubric — hit GOLD honestly

A SKILL.md is scored on **13 quality checks worth 50 points** (10 shared + 3 Skill-only), graded by **points, not check count**: **Gold 41+, Silver 25–40, Bronze 0–24.** You do not need every check — the twelve checks other than `imperative_tone` are worth **45 points**, so a file can miss imperative tone entirely and still land comfortably in Gold.

Structure checks (easy): substance (roughly 1500+ characters), healthy length, four or more `##` headings, well-structured, uses lists, no filler or stub text, frontmatter `name`, frontmatter `description`, a "Use when" trigger line, unique content, and at least one fenced code block.

The one check that takes real care:

- **Specific tools** (`specific_tools`, 5 pts) needs **two or more recognized framework or language names**: for example python, typescript, go, rust, node.js, jest, vitest, pytest, supabase, postgresql, next.js, react, tailwind. It does **not** count Read, Write, or Bash, nor bare HTML or CSS. Name the technologies the skill **genuinely** relates to — never inject irrelevant names to game the grade; that makes the content worse for a vanity badge.

**Imperative tone** (`imperative_tone`, 5 pts) wants **three or more directive lines that open with** `Always` / `Never` / `Use` / `Avoid`. The detector is form-sensitive: a keyword wrapped in bold or buried mid-sentence often does **not** register — even a rule-heavy `AGENTS.md` scores zero if its directives never start a line with the bare verb. State your genuine hard rules as clean openers (see **Hard rules** below) and it passes honestly. If a file is pure exposition with no real rules, leave it — the other twelve checks are worth **45**, so you still reach Gold. Never fabricate commands to chase the points.

**Security must score 6 of 6.** The scanner rejects leaked secrets, destructive shell commands, covert channels that smuggle data out, instruction-override text, reads outside the project tree, and encoded payloads that hide intent. Keep examples clean — no real keys, no destructive commands.

### Honest-Gold checklist for one SKILL.md
- Frontmatter `name` and `description` (the description under 1024 chars, with a Use-when line).
- Four or more headings, bullet lists, roughly 1500+ characters, under 500 lines total.
- At least one fenced code block.
- Names two or more real, relevant technologies.
- No secrets and no destructive commands.

Then publish via Studio (section 3). Expect Gold (41+ of 50).

## Hard rules

Always sign in before publishing — the CLI is unauthenticated and cannot submit to the remote.

Always confirm the Tome reads Gold before you click Publish.

Never hand-write `tome.lock` — the tooling generates its hash, and a mismatch refuses to render.

Never inject irrelevant tool names to pass `specific_tools`; padding the grade only degrades the skill.

Use Studio to publish; the CLI just checks status and prints the web URL.

Use `AGENTS.md` as the one canonical config; make the other formats thin pointers.

Avoid the bare-handle `install` — every install target is `owner/repo`.

## 5. Decision tree

- "What is a Skill, Tome, or AGENTS.md?" goes to section 1.
- "Ship this to TomeVault, make it Gold" means write or clean one SKILL.md per section 4, then publish per section 3.
- "Index my whole repo" means submit at `tomevault.io/convert` while signed in.
- "The CLI says convert or publish failed" goes to the section 2 gotchas: the CLI cannot submit, so use Studio.
