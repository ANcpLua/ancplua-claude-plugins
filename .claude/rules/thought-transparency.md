# Thought Transparency (Agent Behavior)

## Observable Decision Making

When executing complex tasks, maintain visibility:

```markdown
## Processing Log

**Task:** [Description]
**Status:** In Progress

### Steps

- [x] Step 1: Gathered context
- [x] Step 2: Identified files
- [ ] Step 3: Implementing changes
- [ ] Step 4: Validation
```

## Granular Task Decomposition

Break work into atomic units:

- Each step should be independently verifiable
- Steps execute sequentially, not in parallel batches
- Complete one phase before starting the next

## Mental State Bookkeeping

Track internal state explicitly:

- Use `TodoWrite` for task tracking
- Mark completed items immediately
- Never claim completion without evidence

## Silent Processing with Tracked Updates

- Work silently on implementation
- Update progress via `TodoWrite`
- Report results only when complete or blocked
