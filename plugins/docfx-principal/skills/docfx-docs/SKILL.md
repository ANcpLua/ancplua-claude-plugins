---
name: docfx-docs
description: >-
  Use this skill when working with DocFX documentation pipelines. Covers
  docfx.json configuration, metadata extraction, toc.yml navigation,
  cross-references (xref/UID), and GitHub Pages deployment.
---

# DocFX Documentation Skill

Use this skill when you need to work with DocFX documentation pipelines.

## When to Use

- Implementing a new DocFX documentation site
- Fixing DocFX build failures or warnings
- Configuring API reference generation from .NET assemblies
- Setting up navigation (toc.yml) hierarchies
- Resolving cross-reference (xref) issues
- Deploying to GitHub Pages

## Quick Reference

### docfx.json Structure

```json
{
  "metadata": [{
    "src": [{"files": ["**/*.csproj"], "src": "src"}],
    "dest": "api",
    "properties": {"TargetFramework": "net10.0"}
  }],
  "build": {
    "content": [
      {"files": ["**/*.md", "**/toc.yml"], "src": "content"},
      {"files": ["**/*.yml"], "src": "api"}
    ],
    "resource": [{"files": [".nojekyll", "images/**"]}],
    "dest": "_site",
    "template": ["default", "modern"]
  }
}
```

### Navigation (toc.yml)

```yaml
- name: Home
  href: index.md
- name: API Reference
  href: api/
- name: Guides
  href: guides/
```

### GitHub Pages Requirements

1. Create empty `.nojekyll` file in content root
2. Add to resources: `"files": [".nojekyll"]`
3. URLs use `.html` extension (not `.md`)

## Agent

For complex DocFX issues, invoke the `docfx-principal` agent which provides
comprehensive analysis and PR-ready fixes.
