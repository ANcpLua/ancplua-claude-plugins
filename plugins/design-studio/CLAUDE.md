# design-studio

Design intelligence studio merging creative direction with data-driven recommendations.

## Files

- `skills/design-studio/SKILL.md` — Unified skill definition (workflow, rules, checklist)
- `skills/design-studio/scripts/` — Python BM25 search engine + design system generator
- `skills/design-studio/data/` — 11 domain CSVs + 13 stack CSVs (~750 rows)
- `commands/design-studio.md` — `/design-studio` command entry point

## Behavior

1. Step 1 (Creative Direction) is thinking — no tooling, pure aesthetic commitment
2. Step 2 (Generate Design System) MUST run `--design-system` before implementation
3. Scripts use `Path(__file__).parent.parent / "data"` — paths are relative to script location
4. All Python is stdlib-only (csv, re, pathlib, math, collections) — no pip dependencies

## Notes

- Merged from: `frontend-design` (Anthropic plugin) + `ui-ux-pro-max` (local skill)
- Frontend Design contributed: creative philosophy, anti-generic aesthetics, design thinking framework
- UI/UX Pro Max contributed: BM25 search engine, CSV databases, design system generator, pre-delivery checklist
