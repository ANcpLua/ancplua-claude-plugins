# Spec-0006: DocFX Principal Plugin

| Field       | Value                                           |
|-------------|-------------------------------------------------|
| ID          | spec-0006                                       |
| Title       | DocFX Principal Plugin                          |
| Status      | Implemented                                     |
| Created     | 2026-01-14                                      |
| Author      | Claude                                          |

## Summary

A Claude Code plugin providing an Opus-powered agent specialized in DocFX documentation pipelines.
The agent can audit, implement, and fix DocFX configurations for .NET projects.

## Problem Statement

DocFX documentation pipelines have many moving parts:

- Metadata extraction from .NET assemblies
- Navigation hierarchies (toc.yml)
- Cross-reference resolution (xref/UID)
- Multi-repository aggregation
- GitHub Pages deployment quirks

Getting these right requires deep knowledge of DocFX internals, which this agent provides.

## Solution

### Components

| Component           | Path                                             | Purpose                        |
|---------------------|--------------------------------------------------|--------------------------------|
| Plugin manifest     | `.claude-plugin/plugin.json`                     | Plugin configuration           |
| Agent definition    | `agents/docfx-principal.md`                      | Opus agent with full prompt    |
| Skill reference     | `skills/docfx-docs/SKILL.md`                     | Quick reference for DocFX      |

### Agent Capabilities

1. **Audit**: Produces `DOCFX_AUDIT.md` analyzing existing configuration
2. **Metadata**: Fixes XML docs → API YAML extraction
3. **Navigation**: Configures toc.yml hierarchies
4. **Cross-references**: Resolves xref/UID issues
5. **Multi-repo**: Aggregates docs from multiple repositories
6. **Deployment**: Fixes GitHub Pages 404 errors (`.nojekyll`, assets)

### Invocation Triggers

The agent should be invoked when users encounter:

- DocFX build failures or warnings
- Empty API documentation despite XML comments
- Broken navigation or missing pages
- Unresolved cross-references (xref warnings)
- Multi-repository documentation setup
- GitHub Pages 404 errors

## Technical Details

### Model Selection

Uses **Opus** for deep reasoning about documentation architecture.
DocFX issues often require understanding complex dependency chains between:

- Project configurations
- XML doc generation
- Metadata extraction
- Content mapping
- Template rendering

### Tools Required

| Tool      | Purpose                                      |
|-----------|----------------------------------------------|
| Read      | Read docfx.json, toc.yml, project files      |
| Grep      | Search for patterns across config files      |
| Glob      | Find all configuration files                 |
| Write     | Create/update configuration                  |
| Edit      | Modify existing files                        |
| Bash      | Run `docfx metadata`, `docfx build`          |
| WebSearch | Verify current DocFX best practices          |
| WebFetch  | Retrieve external documentation              |

## Success Criteria

- [ ] Agent successfully audits DocFX configurations
- [ ] Agent fixes common metadata extraction issues
- [ ] Agent resolves navigation problems
- [ ] Agent identifies and fixes xref issues
- [ ] Plugin validates with `claude plugin validate`

## References

- [DocFX Documentation](https://dotnet.github.io/docfx/)
- [DocFX GitHub](https://github.com/dotnet/docfx)
