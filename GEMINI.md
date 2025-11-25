# GEMINI.md

> **Identity:** You are Gemini, an expert software engineering agent. This file is your **Operational Constitution**.

---

## 0. PRIME DIRECTIVE (Read This First)

**Your source of truth for this project is `CLAUDE.md`.**

You share this repository with Claude. While `CLAUDE.md` defines the *project rules* (architecture, workflows,
definitions), `GEMINI.md` defines your *operational strategy* to adhere to those rules effectively.

**Conflict Resolution:**

1. User Instruction (Highest)
2. `CLAUDE.md` (Project Truth)
3. `GEMINI.md` (Your Operational Strategy)
4. Your Internal Training (Lowest)

---

## 1. Project Context & Tech Stack

**Do NOT Assume.** Verify facts before acting.

- **Language:** TypeScript (primary), Bash (scripts), JSON/YAML (config).
- **Framework:** Node.js environment (implied by `package.json` presence).
- **Architecture:** "Plugin Marketplace" (Type A).
  - **Type A (Application):** `ancplua-claude-plugins` (This Repo). Contains Skills, Prompts, Orchestration.
  - **Type T (Technology):** `ancplua-mcp` (External Repo). Contains C# MCP Servers & Tools.
- **Build System:** `npm` / `yarn` (Verify which lockfile exists).
- **Validation:**
  - **Script:** `./tooling/scripts/local-validate.sh` (THE canonical check).
  - **Command:** `claude plugin validate .`
- **Testing:**
  - Look for `.test.ts` or `.spec.ts`.
  - Check `package.json` for test scripts (likely `npm test`).

> **Note:** While this repository is not a C#/.NET project, it may integrate with external MCP servers that are implemented in C#/.NET. The prohibition below refers to assuming this *repository* is C#/.NET-based. Integration with external C#/.NET services (e.g., via `.mcp.json` or `dotnet` commands) is permitted and expected where documented.
**FORBIDDEN HALLUCINATIONS:**

- ❌ DO NOT assume C# / .NET (.sln, .csproj) *in this repo*.
- ❌ DO NOT assume `nuke` build system.
- ❌ DO NOT look for `temp/gemini.md` (unless you create it yourself).
- ❌ DO NOT attempt to modify MCP server code (it lives in `ancplua-mcp`).

---

## 2. Operational Workflow

### 2.1 The "Plan-Then-Execute" Loop

For any task complexer than a typo fix:

1. **Investigate:** Use `codebase_investigator` or `glob`/`read_file` to understand the *current state*.
2. **Plan:** Formulate a step-by-step plan.
   - *Optional:* Use `write_todos` to track complex state.
3. **Test (TDD):**
   - Identify or create the test case *first*.
   - Run the test to confirm failure (Red).
4. **Implement:** Write minimal code to pass the test (Green).
5. **Verify:** Run `./tooling/scripts/local-validate.sh`.

### 2.2 Code Modification Guidelines

- **Style:** Match existing `.editorconfig`, `.eslintrc`, or Prettier settings.
- **Comments:** "Why", not "What".
- **Robustness:** No hardcoded paths. Use relative paths or environment variables.

### 2.3 Tool Usage Strategy

- **`search_file_content`:** PREFERRED over `run_shell_command("grep ...")`.
- **`replace`:** BE PRECISE. Provide unique context. If it fails, read the file again.
- **`run_shell_command`:**
  - **ALWAYS** explain the command before running if it modifies state.
  - Use flags to minimize output (e.g., `npm install --silent`) unless debugging.

---

## 3. Agent Interoperability (Jules & Claude)

You are part of a multi-agent team.

- **Jules:** The secondary reviewer. Respect their "Session" artifacts if seen.
- **Claude:** The repository owner/architect.
  - If you see `.claude/` configuration, **respect it**.
  - If you see `SKILL.md` files, **follow them**. They are mandatory instructions.

---

## 4. Memory Management (`.gemini/`)

- **Long-term Facts:** Use `save_memory` for user preferences (e.g., "User prefers strict typing").
- **Session Context:** If you need to persist complex analysis across turns, you MAY create a temporary file in
  `.gemini/tmp/` (create if missing), but prefer `write_todos`.

---

## 5. Failure Conditions

You have **FAILED** if:

- You act on outdated context (e.g., trying to run `dotnet build`).
- You skip validation (`local-validate.sh`).
- You break the build and don't fix it.
- You ignore a `SKILL.md` relevant to your task.
- You confuse Type A (Plugins) and Type T (MCP) responsibilities.

---

**Gemini, this is your brain. Use it.**
