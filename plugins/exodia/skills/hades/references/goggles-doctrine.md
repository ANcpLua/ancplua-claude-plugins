# The Goggles (`--goggles`)

When Hades equips the Pink Glasses, he sees beauty — and its absence.

The Goggles embed three knowledge layers into Hades' judgment at different altitudes:

```text
TASTE (high)      → "What should this feel like?"   → frontend-design
SPEC (mid)        → "Does it meet the bar?"         → ui-ux-pro-max
COMPLIANCE (ground) → "Did they build it correctly?" → web-design-guidelines
```

Hades already sees everything that's broken. The goggles raise the bar: broken
includes outdated. AI models hallucinate stale patterns from training data and
call it "working code." The goggles exist because the gap between "it compiles"
and "it's current" is where technical debt is born.

## Classification table — what to flag and why

| Pattern                | Verdict          | Why                                                            | Modern replacement                                                                 |
|------------------------|------------------|----------------------------------------------------------------|------------------------------------------------------------------------------------|
| `rounded-lg shadow-md` | GENERIC-AI-SLOP  | Thoughtless defaults, no hierarchy, no design intent           | Semantic `@theme` tokens: `--radius-card`, `--shadow-card`                         |
| `Inter` as display     | MISAPPLIED       | Fine for body/UI. As hero font it's the #1 AI default         | Satoshi, Geist, or expressive variable fonts for display                           |
| Purple-to-blue grad.   | GENERIC-AI-SLOP  | The canonical AI gradient. v4: `bg-gradient-*` → `bg-linear-*`| `bg-radial-[at_25%_25%]/oklch`, mesh/layered gradients, `bg-conic`                |
| Flat centered card     | GENERIC-AI-SLOP  | The most obvious AI layout pattern                             | Bento grids, asymmetric layouts, varied card sizes, layered depth                  |
| `transition-all`       | ANTI-PATTERN     | Forces browser to watch every CSS property                     | `transition-transform`, `transition-colors`, specific props + `transform-gpu`      |
| `outline-none`         | HARMFUL          | Breaks keyboard nav + invisible in High Contrast Mode          | `outline-hidden` (v4) + `focus-visible:outline-2 focus-visible:outline-offset-2`   |
| `tailwind.config.js`   | OUTDATED         | v4 is CSS-first. `@theme` replaces the JS config               | `@theme { --color-*: oklch(...); --font-*: ...; --radius-*: ...; }`               |

## The v4-native pattern all goggles teammates enforce

```text
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.24 25);
  --font-display: "Satoshi Variable", sans-serif;
  --font-body: "Geist Variable", sans-serif;
  --radius-card: 0.75rem;
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.08);
  --shadow-elevated: 0 10px 25px rgb(0 0 0 / 0.12);
}
```

The reason this matters: LLMs reproduce what they trained on. Training data skews
toward older framework versions. Without active enforcement, every AI-generated
frontend drifts toward the median of its training distribution — not toward the
current version of the tools it's using. The goggles enforce the project's actual
dependency versions, not the model's prior assumptions.

**When to equip:** Any cleanup that touches frontend files (.tsx, .jsx, .css, .html, .svelte, .vue).
**Effect:** +3 goggles teammates in Phase 0. Their findings become elimination tasks.

See [../templates/goggles.md](../templates/goggles.md) for the full goggles teammate prompts.
