---
name: design-studio
description: "Design intelligence studio. Creative direction + data-driven recommendations for distinctive frontend interfaces. 50 styles, 97 palettes, 57 font pairings, 99 UX guidelines, 25 chart types, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, Astro, Nuxt, Jetpack Compose). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient."
effort: medium
---

# Design Studio

Creative direction + data-driven design intelligence for distinctive,
production-grade frontend interfaces. Merges bold aesthetic philosophy
with a searchable database of 750+ recommendations.

## Workflow

### Step 1: Creative Direction

Before touching any tool, commit to a **bold aesthetic direction**:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick a strong direction: brutally minimal, maximalist chaos,
  retro-futuristic, organic/natural, luxury/refined, playful/toy-like,
  editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel,
  industrial/utilitarian
- **Constraints**: Framework, performance, accessibility requirements
- **Differentiator**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision.
Bold maximalism and refined minimalism both work —
the key is intentionality, not intensity.

Also extract from the user request:

- **Product type**: SaaS, e-commerce, portfolio, dashboard, landing page, etc.
- **Industry**: healthcare, fintech, gaming, education, beauty, etc.
- **Stack**: React, Vue, Next.js, or default to `html-tailwind`

### Step 2: Generate Design System (REQUIRED)

Feed your creative direction into the search engine:

```bash
python3 scripts/search.py "<product_type> <tone> <industry> <keywords>" --design-system [-p "Project Name"]
```

This searches 5 domains in parallel (product, style, color, landing, typography),
applies reasoning rules, and returns a complete design system:
pattern, style, colors, typography, effects, anti-patterns.

**Persist for multi-session projects:**

```bash
python3 scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

Creates `design-system/MASTER.md` (global source of truth) and `design-system/pages/` for page-specific overrides.

**With page override:**

```bash
python3 scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

### Step 3: Refine with Domain Searches

Supplement the design system with targeted lookups:

| Need | Command |
|------|---------|
| More style options | `python3 scripts/search.py "glassmorphism dark" --domain style` |
| Chart recommendations | `python3 scripts/search.py "real-time dashboard" --domain chart` |
| UX best practices | `python3 scripts/search.py "animation accessibility" --domain ux` |
| Alternative fonts | `python3 scripts/search.py "elegant luxury serif" --domain typography` |
| Landing structure | `python3 scripts/search.py "hero social-proof" --domain landing` |
| Icon guidance | `python3 scripts/search.py "navigation menu" --domain icons` |

Feed your creative direction into these queries —
if you chose "brutalist/raw", search for `brutalism raw concrete`,
not just `dashboard`.

### Step 4: Stack Guidelines

Get implementation-specific best practices (default: `html-tailwind`):

```bash
python3 scripts/search.py "<keyword>" --stack html-tailwind
```

Available stacks: `html-tailwind`, `react`, `nextjs`, `vue`, `svelte`,
`nuxtjs`, `nuxt-ui`, `astro`, `swiftui`, `react-native`, `flutter`,
`shadcn`, `jetpack-compose`

### Step 5: Implement with Aesthetic Precision

Build working code (HTML/CSS/JS, React, Vue, etc.) that is production-grade,
visually striking, and cohesive. Apply these principles:

- **Typography**: Choose distinctive, characterful fonts. Pair a display font
  with a refined body font. NEVER use Inter, Roboto, Arial, or system fonts
- **Color & Theme**: Commit to a cohesive palette. Use CSS variables.
  Dominant colors with sharp accents outperform timid,
  evenly-distributed palettes
- **Motion**: CSS-only solutions for HTML, Motion library for React.
  Focus on high-impact moments: one well-orchestrated page load with
  staggered reveals creates more delight than scattered
  micro-interactions. Use scroll-triggering and hover states that surprise
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap.
  Diagonal flow. Grid-breaking elements. Generous negative space
  OR controlled density
- **Backgrounds & Visual Details**: Create atmosphere and depth.
  Gradient meshes, noise textures, geometric patterns,
  layered transparencies, dramatic shadows, decorative borders,
  grain overlays

**Match complexity to vision**: Maximalist designs need elaborate code
with extensive animations. Minimalist designs need restraint, precision,
and careful attention to spacing and subtle details.

## Search Reference

### Available Domains

| Domain | Use For | Example Keywords |
|--------|---------|------------------|
| `product` | Product type recommendations | SaaS, e-commerce, portfolio, healthcare |
| `style` | UI styles, colors, effects | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Font pairings, Google Fonts | elegant, playful, professional, modern |
| `color` | Color palettes by product type | saas, ecommerce, healthcare, beauty, fintech |
| `landing` | Page structure, CTA strategies | hero, testimonial, pricing, social-proof |
| `chart` | Chart types, library recommendations | trend, comparison, timeline, funnel, pie |
| `ux` | Best practices, anti-patterns | animation, accessibility, z-index, loading |
| `icons` | Icon libraries, usage patterns | navigation, social, status, action |
| `react` | React/Next.js performance | waterfall, bundle, suspense, memo, rerender |
| `web` | Web interface guidelines | aria, focus, keyboard, semantic, virtualize |

### Output Formats

```bash
# ASCII box (default)
python3 scripts/search.py "fintech crypto" --design-system

# Markdown
python3 scripts/search.py "fintech crypto" --design-system -f markdown
```

## Anti-Patterns

NEVER produce generic AI aesthetics:

| Category | Never Do |
|----------|----------|
| Typography | Inter, Roboto, Arial, system fonts. Never converge on Space Grotesk |
| Color | Purple gradients on white backgrounds. Timid, evenly-distributed palettes |
| Layout | Predictable component patterns. Cookie-cutter grids |
| Icons | Emojis as UI icons. Mix icon sizes. Guess brand logos |
| Hover | Scale transforms that shift layout. Missing cursor-pointer on clickable elements |
| Contrast | `bg-white/10` glass cards in light mode. gray-400 body text. Invisible borders |
| Character | No design should look the same. Vary themes, fonts, aesthetics across generations |

## Professional UI Rules

### Icons & Visual Elements

| Rule | Do | Don't |
|------|----|----- |
| **No emoji icons** | SVG icons (Heroicons, Lucide, Simple Icons) | Emojis as UI icons |
| **Stable hover** | Color/opacity transitions | Scale transforms that shift layout |
| **Brand logos** | Official SVG from Simple Icons | Guessed or incorrect logo paths |
| **Icon sizing** | Fixed viewBox (24x24) with w-6 h-6 | Mixed sizes |

### Interaction

| Rule | Do | Don't |
|------|----|----- |
| **Cursor pointer** | `cursor-pointer` on all clickable elements | Default cursor on interactive elements |
| **Hover feedback** | Visual feedback (color, shadow, border) | No indication element is interactive |
| **Transitions** | `transition-colors duration-200` | Instant changes or >500ms |

### Light/Dark Mode

| Rule | Do | Don't |
|------|----|----- |
| **Glass cards** | `bg-white/80` or higher in light mode | `bg-white/10` (invisible) |
| **Text contrast** | `#0F172A` (slate-900) for body text | `#94A3B8` (slate-400) |
| **Muted text** | `#475569` (slate-600) minimum | gray-400 or lighter |
| **Borders** | `border-gray-200` in light mode | `border-white/10` (invisible) |

### Layout

| Rule | Do | Don't |
|------|----|----- |
| **Floating navbar** | `top-4 left-4 right-4` spacing | Stick to `top-0 left-0 right-0` |
| **Content padding** | Account for fixed navbar height | Content hidden behind fixed elements |
| **Container width** | Consistent `max-w-6xl` or `max-w-7xl` | Mixed container widths |

## UX Priority Rules

| Priority | Category | Key Rules |
|----------|----------|-----------|
| 1 (CRITICAL) | Accessibility | 4.5:1 contrast, visible focus rings, alt text, aria-labels, keyboard nav, form labels |
| 2 (CRITICAL) | Touch & Interaction | 44x44px touch targets, click/tap primary, loading buttons, error feedback |
| 3 (HIGH) | Performance | WebP + srcset + lazy loading, `prefers-reduced-motion`, reserve async space |
| 4 (HIGH) | Layout | viewport meta, 16px min body text, no horizontal scroll, z-index scale (10/20/30/50) |
| 5 (MEDIUM) | Typography | 1.5-1.75 line-height, 65-75 char line length, matched font personalities |
| 6 (MEDIUM) | Animation | 150-300ms micro-interactions, transform/opacity only, skeleton screens |

## Pre-Delivery Checklist

### Visual Quality

- [ ] No emojis used as icons (SVG only)
- [ ] All icons from consistent set (Heroicons/Lucide)
- [ ] Brand logos verified (Simple Icons)
- [ ] Hover states don't cause layout shift
- [ ] Design is distinctive — not generic AI output

### Interaction

- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation

### Light/Dark Mode

- [ ] Text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes

### Layout

- [ ] Floating elements have proper edge spacing
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected

### Creative Distinctiveness

- [ ] Does this look genuinely designed for the context, or like template output?
- [ ] Would someone remember this design? What's the unforgettable element?
- [ ] Is the aesthetic direction executed with precision and intentionality?

## Prerequisites

```bash
python3 --version || python --version
```

**macOS:** `brew install python3` |
**Ubuntu:** `sudo apt install python3` |
**Windows:** `winget install Python.Python.3.12`
