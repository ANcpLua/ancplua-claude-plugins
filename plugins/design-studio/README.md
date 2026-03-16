# design-studio

Design intelligence studio for Claude Code. Combines bold creative direction
with a searchable database of 750+ design recommendations.

## What It Does

1. **Creative Direction** — Commit to a bold aesthetic tone before touching code
2. **Data-Driven Recommendations** — BM25 search across 50 styles, 97 palettes,
  57 font pairings, 99 UX guidelines, 25 chart types
3. **Stack-Specific Guidelines** — Best practices for 13 frameworks
  (React, Next.js, Vue, Svelte, Flutter, SwiftUI, Tailwind, shadcn/ui,
  Astro, Nuxt, React Native, Jetpack Compose)
4. **Implementation** — Production-grade code with distinctive aesthetics and accessibility

## Usage

```bash
/design-studio "Build a landing page for a luxury skincare brand"
```

Or trigger implicitly by asking Claude to design, build, or review any frontend interface.

## Search CLI

```bash
# Generate complete design system
python3 scripts/search.py "beauty spa wellness" --design-system -p "Serenity Spa"

# Search specific domain
python3 scripts/search.py "glassmorphism dark" --domain style

# Stack-specific guidelines
python3 scripts/search.py "responsive layout" --stack html-tailwind
```

## Origin

Merged from two complementary skills:

- **frontend-design** (Anthropic) — creative philosophy for distinctive UIs
- **ui-ux-pro-max** (local) — searchable design database with BM25 search engine

## Requirements

- Python 3.6+ (stdlib only, no pip dependencies)
