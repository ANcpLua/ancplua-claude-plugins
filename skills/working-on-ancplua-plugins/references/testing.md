# Testing & Debugging

## Automated Validation

Run the full suite before pushing:

```bash
./tooling/scripts/local-validate.sh
```

This enforces:

1. **Plugin Validity**: `claude plugin validate`
2. **Shell Safety**: `shellcheck`
3. **Formatting**: `markdownlint`
4. **CI Workflows**: `actionlint`

## Unit Testing

For logic-heavy plugins:

- **JS/TS**: `npm test` (Jest/Vitest)
- **Python**: `pytest`
- **Go**: `go test ./...`

## Manual Verification & Debugging

If `local-validate.sh` passes but the plugin fails:

### 1. Validate JSON Syntax

Parser errors are often silent. Check manually:

```bash
cat .claude-plugin/plugin.json | jq .
cat hooks/hooks.json | jq .
```

### 2. Check Permissions

Scripts and binaries **must** be executable:

```bash
find . -name "*.sh" -exec ls -l {} \;
# Fix if needed:
chmod +x path/to/script.sh
```

### 3. Verify Paths

Ensure no hardcoded paths exist in configs:

```bash
grep -r "/Users/" .
# Should return empty. If not, replace with ${CLAUDE_PLUGIN_ROOT}
```

### 4. Test Components Independently

- **MCP Servers**: Run the server command directly in terminal to see crash logs.
- **Hooks**: Execute the hook script manually to verify it runs without error.
