# cc-plugin-eval Chat-First Workflows

`cc-plugin-eval` should feel usable from Claude Code chat before a user knows any CLI flags.

## One Paved Road

If the user speaks in natural language first, use:

```bash
cc-plugin-eval start <path> --request "<chat request>" --format markdown
```

That entrypoint recognizes the request, explains why the workflow fits, and shows the exact local command sequence behind it.

## Recommended Beginner Requests

Use these exact phrases as the paved road:

- `Give me an analysis of this plugin.`
- `Evaluate this skill.`
- `Evaluate this plugin.`
- `Explain the token budget for this plugin.`
- `Validate the manifest.`
- `Inspect the hooks.`
- `Inspect the mcp servers.`
- `Measure the real token usage of this skill.`
- `Help me benchmark this plugin.`
- `What should I run next?`

## How Those Requests Map To Local Workflows

### Give me an analysis of this plugin

Start with:

```bash
cc-plugin-eval start ~/.claude/plugins/cache/example-plugin --request "give me an analysis of this plugin" --format markdown
cc-plugin-eval analyze ~/.claude/plugins/cache/example-plugin --format markdown
cc-plugin-eval init-benchmark ~/.claude/plugins/cache/example-plugin
cc-plugin-eval benchmark ~/.claude/plugins/cache/example-plugin --config ~/.claude/plugins/cache/example-plugin/.cc-plugin-eval/benchmark.json
```

Use this when the user wants the overall report and wants Claude Code to set up starter benchmark scaffolding instead of stopping after the first report.

### Evaluate this skill

Start with:

```bash
cc-plugin-eval start <skill-path> --request "Evaluate this skill." --format markdown
cc-plugin-eval analyze <skill-path> --format markdown
```

Use this when the user wants the overall report first.

### Explain the token budget for this plugin

Start with:

```bash
cc-plugin-eval start <plugin-root> --request "Explain the token budget for this plugin." --format markdown
cc-plugin-eval explain-budget <plugin-root> --format markdown
```

Use this when the question is about cost, context pressure, or why a plugin or skill feels heavy.

### Measure the real token usage of this skill

Start with:

```bash
cc-plugin-eval start <skill-path> --request "Measure the real token usage of this skill." --format markdown
cc-plugin-eval init-benchmark <skill-path>
cc-plugin-eval benchmark <skill-path> --config <benchmark.json>
cc-plugin-eval analyze <skill-path> --observed-usage <benchmark-usage.jsonl> --format markdown
cc-plugin-eval measurement-plan <skill-path> --observed-usage <benchmark-usage.jsonl> --format markdown
```

Use this when the user wants measured usage from a real `claude` run, not just the static estimate.

### Help me benchmark this plugin

Start with:

```bash
cc-plugin-eval start <plugin-root> --request "Help me benchmark this plugin." --format markdown
cc-plugin-eval init-benchmark <plugin-root>
cc-plugin-eval benchmark <plugin-root> --config <benchmark.json>
```

Use this when the user wants starter scenarios or a repeatable real-`claude` measurement harness.

### Validate this manifest

Start with:

```bash
cc-plugin-eval start <plugin-root> --request "Validate the manifest." --format markdown
cc-plugin-eval validate <plugin-root> --format markdown
cc-plugin-eval validate <plugin-root> --strict
```

Use this when the user wants a CI-friendly pass/fail check across every Claude component. The `--strict` flag makes any `warn` finding count as a non-zero exit (exit code 2). The default exit code is 0 even when findings exist.

### Inspect the components

Start with:

```bash
cc-plugin-eval start <plugin-root> --request "Inspect the hooks." --format markdown
cc-plugin-eval inspect <plugin-root> --component hooks --format markdown
cc-plugin-eval inspect <plugin-root> --component mcp --format markdown
cc-plugin-eval inspect <plugin-root> --component all --format markdown
```

Use this when the user wants only the component findings (manifest, hooks, mcp, lsp, monitors, agents, marketplace, userconfig) without the budget, code, or coverage signals.

### What should I run next?

Start with:

```bash
cc-plugin-eval start <path> --request "What should I run next?" --format markdown
```

Use this when the user is unsure whether they should evaluate, validate, inspect, explain a budget, benchmark, or collect measured usage next.
