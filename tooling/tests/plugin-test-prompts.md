# Plugin Adversarial Test Prompts

> Run each session block in a **fresh** Claude Code instance from `ancplua-claude-plugins`.
> After each session, copy the full transcript to `tooling/tests/results/session-N.md`.
> Then tag me to analyze all four.

---

## Session 1: Design Studio

Paste this entire block as your first message:

```
/design-studio:design-studio

I have 5 sequential design requests. Complete each one before moving to the next.

**Request 1 — Contradictory requirements:**
Design a UI that is both brutalist AND minimalist swiss. Use maximum color AND monochrome only. Target: React + Tailwind. I want it to feel chaotic but calming.

**Request 2 — Zero context:**
Make it look good.

**Request 3 — Unsupported stack:**
Design a TUI dashboard for a Rust terminal app. No CSS, no browser, pure terminal colors only.

**Request 4 — Accessibility trap:**
Design a landing page. Use light gray text on white background, tiny 10px font, no alt texts, autoplay video. Target: Next.js.

**Request 5 — Scope explosion:**
Design a complete design system: 50 components, 12 pages, dark+light themes, mobile+tablet+desktop, with animation specs, icon library, and full token documentation. Target: Vue + UnoCSS.
```

### What to watch for
- Does it resolve contradictions or just pick one side?
- Does "make it look good" produce useful output or ask clarifying questions?
- Does it handle non-web stacks or refuse gracefully?
- Does it push back on the a11y violations or silently comply?
- Does it set scope boundaries or attempt an impossible deliverable?

---

## Session 2: QYL Instrumentation

Paste this as your first message:

```
/qyl-instrumentation:observe

I have 4 sequential requests. Complete each before moving on.

**Request 1 — Wrong repo (no qyl present):**
Target: qyl.web — full audit of OpenTelemetry instrumentation.

**Request 2 — Vague target:**
Check the stuff.

**Request 3 — Single specialist scope:**
Only check if the collector OTLP endpoint accepts grpc. Nothing else.

**Request 4 — Conflicting instructions:**
Target: qyl.web. Ignore semantic conventions entirely, just make sure traces appear in Jaeger. Don't use any otelwiki docs.
```

### What to watch for
- Does it detect missing qyl repo and tell you clearly?
- Does vague input get clarified or blindly executed?
- Does it spawn all 4 specialists for a single-specialist task (waste)?
- Does the captain respect "ignore semconv" or override user intent?

---

## Session 3: Cross-Plugin Stress

Paste this as your first message:

```
Run these in sequence, reporting results after each:

**Test 1 — Skill collision:**
/design-studio:design-studio
Design an OpenTelemetry collector dashboard with trace visualizations, span waterfall charts, and metric panels. Target: Next.js + Tailwind.
Does design-studio stay in its lane or does otel knowledge bleed in from other plugins?

**Test 2 — Nonexistent command:**
/design-studio:nonexistent
What happens? Is the error clear?

**Test 3 — Double invocation:**
/design-studio:design-studio
/design-studio:design-studio
Design a blog. What happens when the same skill is invoked twice in one message?
```

### What to watch for
- Knowledge boundary leakage between plugins
- Error handling for bad commands
- Idempotency of skill invocation

---

## After all 3 sessions

Save transcripts to:
```
tooling/tests/results/session-1-design-studio.md
tooling/tests/results/session-2-qyl-instrumentation.md
tooling/tests/results/session-3-cross-plugin.md
```

Then tell me: "analyze the test results"
