---
name: verification-before-completion
description: |
  Force verification before claiming success or completion. Prevents false "it works" claims.
  Triggers when about to say "done", "complete", "works", "fixed", or "the implementation is ready".
  Requires actually running builds/tests and showing output before claiming success.
---

# Verification Before Completion

> **If you didn't run it, you don't know if it works.**

## Triggers

Activate when about to say: "done", "complete", "finished", "works", "fixed",
"the implementation is ready", "this should work".

## Verification Checklists

### Code Changes

- [ ] Build passes (no errors)
- [ ] Tests pass (or explicit reason why skipped)
- [ ] No new warnings introduced
- [ ] Actually ran the code and showed output

### Factual Claims

- [ ] Verified against assertions.yaml
- [ ] WebSearch if claim involves dates/versions/status
- [ ] Source cited

### Bug Fixes

- [ ] Reproduced the original bug
- [ ] Applied the fix
- [ ] Verified bug no longer occurs
- [ ] Ran regression tests

## Output Format

```markdown
## Verification Checklist

### Build Status
- [ ] Build - [PASS/FAIL]
- [ ] Tests - [PASS/FAIL/SKIPPED: reason]

### Steps Performed
1. [What you did]
2. [What output you saw]

### Confidence
[high/medium/low] - [why]

### Ready to Claim Complete
[YES/NO] - [if NO, what's missing]
```

## Red Flags

"This should work" → actually test it. "The fix is complete" → run the build.
"I've implemented the feature" → show test output.
