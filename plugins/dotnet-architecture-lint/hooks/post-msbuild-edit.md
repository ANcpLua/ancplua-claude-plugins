You just modified an MSBuild file. Run the architecture linter:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/lint-dotnet.sh" .
```

**If output contains VIOLATIONS:**

| Rule | What to fix |
|------|-------------|
| RULE_A | Replace hardcoded version with `$(VariableName)`. Add variable to Version.props if missing. Use naming: `PackageName` -> `PackageNameVersion` |
| RULE_B | Remove the Import of Version.props. Only `Directory.Packages.props` or `eng/Directory.Build.props` may import it. |
| RULE_C | Version.props must be a symlink in consumer repos. Do NOT overwrite with a regular file. If broken, recreate the symlink. |
| RULE_G | Remove `Version` attribute from PackageReference. Add package to Directory.Packages.props with `$(VariableName)` if missing. |

**Fix all violations before any git operations.**

**If output shows CLEAN:** Proceed normally.
