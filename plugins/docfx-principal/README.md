# DocFX Principal

DocFX documentation pipeline expert agent. Implements, fixes, and optimizes DocFX documentation builds for .NET projects.

## When to Use

Invoke this agent when you need help with:

- **DocFX build failures** - Warnings, errors, or broken output
- **API documentation generation** - Getting XML docs from DLLs into the site
- **Navigation architecture** - Fixing broken `toc.yml` hierarchies
- **Cross-references (xref)** - Resolving UID links within and across projects
- **Multi-repo aggregation** - Pulling documentation from multiple repositories
- **GitHub Pages deployment** - Fixing 404 errors and asset loading issues

## Examples

```
User: "My API docs are empty even though I have XML comments on all my classes"
→ Use docfx-principal to audit metadata configuration and fix API documentation generation

User: "DocFX keeps warning about unresolved UIDs and broken xrefs"
→ Use docfx-principal to trace the xref resolution chain and fix cross-reference configuration

User: "I need to pull documentation from three different repos into one DocFX site"
→ Use docfx-principal to implement multi-repo aggregation with proper content mapping

User: "My sidebar navigation is broken - some pages show, others don't"
→ Use docfx-principal to audit toc.yml hierarchy and fix navigation structure
```

## Agent Capabilities

The docfx-principal agent can:

1. **Audit** existing DocFX configurations and produce `DOCFX_AUDIT.md`
2. **Fix** metadata extraction from .NET assemblies
3. **Configure** navigation (toc.yml) architecture
4. **Resolve** cross-reference issues (xref, UID)
5. **Implement** multi-repo documentation aggregation
6. **Validate** GitHub Pages deployment requirements

## Key Expertise

### Metadata Extraction

- Configuring `docfx.json` metadata section
- Ensuring `<GenerateDocumentationFile>true</GenerateDocumentationFile>` in projects
- Matching `TargetFramework` properties correctly

### Navigation (toc.yml)

- Root vs section toc.yml patterns
- `href` vs `uid` vs `topicHref` usage
- Nested navigation hierarchies

### GitHub Pages Deployment

- The critical `.nojekyll` file requirement
- Resource file configuration
- URL mapping (`.md` → `.html`)

## Model

Uses **Opus** for deep reasoning about documentation architecture.

## Installation

This plugin is part of `ancplua-claude-plugins`. Install via:

```bash
claude plugin add ancplua-claude-plugins
```

## License

MIT
