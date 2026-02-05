---
status: accepted
contact: "Alexander Nachtmann"
date: "2025-11-24"
deciders: "Alexander Nachtmann"
consulted: "Superpowers framework patterns, Anthropic Claude Code docs"
informed: "Plugin developers, Skill authors, Claude Code users"
---

# ADR-0002: Superpowers Framework Composition

## Context and Problem Statement

This repository (`ancplua-claude-plugins`) is a Claude Code plugin marketplace that needs to:

- Provide repo-specific Skills and workflows.
- Compose cleanly with external Skill frameworks like **Superpowers**.
- Avoid conflicts between repo Skills and framework Skills.
- Allow Claude to use the best available Skills for each task.

The key question:

> How should this repository's Skills and hooks interact with Superpowers and other external Skill frameworks?

## Decision Drivers

- **Composability:** This repo's plugins should work alongside Superpowers, not replace it.
- **Non-conflict:** Repo hooks and Skills MUST NOT override or break Superpowers workflows.
- **Specialization:** Repo Skills handle repo-specific tasks; Superpowers handles general development workflows.
- **Explicit boundaries:** Clear documentation of which Skills come from where.
- **Fallback behavior:** If Superpowers is not installed, repo Skills should still function.

## Considered Options

1. **Option A:** Replace Superpowers entirely with repo-specific Skills.
2. **Option B:** Depend on Superpowers as a hard requirement; repo Skills extend it.
3. **Option C (chosen):** Compose with Superpowers optionally; repo Skills are complementary.

## Decision Outcome

### Chosen option: Option C - Optional Composition

This repository:

- **Does NOT require** Superpowers to be installed.
- **Does NOT replace** Superpowers workflows (TDD, debugging, verification).
- **Does complement** Superpowers with repo-specific Skills.
- **Does NOT conflict** with Superpowers hooks or Skills.

When Superpowers is installed:

- Claude SHOULD use Superpowers for general workflows (brainstorming, TDD, debugging).
- Claude SHOULD use plugin Skills for repo-specific behavior.
- Plugin Skills (e.g., `autonomous-ci`) add specialized capabilities.

When Superpowers is NOT installed:

- Repo Skills and plugin Skills function independently.
- Some advanced workflows may be less structured but still functional.

## Consequences

### Good

- **Flexibility:** Users can install Superpowers or not, based on preference.
- **No vendor lock-in:** This repo doesn't force any external dependency.
- **Clear boundaries:** Each Skill has a defined scope and source.
- **Graceful degradation:** Missing Superpowers doesn't break the repo.

### Bad

- **Documentation overhead:** Must document which Skills come from which source.
- **Potential overlap:** Some repo Skills may duplicate Superpowers functionality.
- **User confusion:** Users must understand the layering of Skills.

## Pros and Cons of the Options

### Option A - Replace Superpowers

**Good:**

- Complete control over all Skills.
- No external dependencies.

**Bad:**

- Massive duplication of effort (TDD, debugging, verification).
- Loses community-maintained Superpowers improvements.
- Higher maintenance burden.

### Option B - Hard Superpowers Dependency

**Good:**

- Guaranteed access to Superpowers workflows.
- Tighter integration possible.

**Bad:**

- Breaks for users who don't want Superpowers.
- Couples repo to external project's release cycle.
- Harder to test in isolation.

### Option C - Optional Composition (chosen)

**Good:**

- Best of both worlds: use Superpowers if available.
- Repo Skills focus on repo-specific needs.
- No breaking changes if Superpowers updates.

**Bad:**

- Must test both with and without Superpowers.
- Documentation must cover both scenarios.

## Composition Guidelines

### Skill precedence

1. **Superpowers Skills** (if installed): General development workflows.
2. **Plugin Skills** (`plugins/*/skills/`): Plugin-specific and repo-specific behavior.

### Hook guidelines

Repo hooks MUST NOT:

- Override Superpowers' core hooks (e.g., pre-commit verification).
- Conflict with Superpowers' brainstorming or TDD workflows.
- Assume Superpowers is present.

Repo hooks MAY:

- Add repo-specific pre/post actions.
- Extend verification with repo-specific checks.
- Log or report repo-specific metrics.

### Documentation requirements

Every Skill in this repo MUST document:

- Whether it complements or replaces a Superpowers Skill.
- Expected behavior with and without Superpowers installed.
- Any interactions or conflicts with external Skills.

## Maintenance Rules for Claude

Claude MUST:

- Respect Superpowers workflows when installed.
- Use repo Skills for repo-specific tasks.
- Document any new Skill interactions with Superpowers.
- Update this ADR if composition strategy changes.

Claude MUST NOT:

- Create hooks that break Superpowers behavior.
- Assume Superpowers is always available.
- Duplicate Superpowers Skills without clear justification.
