---
name: improving-weak-tests
description: Use when a specific test is weak — uses toBeTruthy / toBeDefined / toBeFalsy as its main matcher, asserts only that a mock was called, checks only array length, snapshots an object with no semantic assertion, tests only the happy path, or peeks at internal state. Provides a concrete transformation catalogue with before/after pairs so the rewriter can apply them mechanically. Triggers on "this test is weak", "rewrite this test", "stronger assertions", "make this test catch mutations", "replace toBeTruthy".
effort: low
---

# Improving Weak Tests

## Core principle

Every rewrite must answer: **what plausible mutation does the new test catch
that the old one did not?** If you cannot name that mutation in one
sentence, the rewrite is not done.

## The catalogue

### 1. `toBeTruthy()` → exact shape

```ts
// WEAK
expect(await saveUser(input)).toBeTruthy();

// STRONG
const result = await saveUser(validInput);
expect(result).toEqual({
  id: expect.any(String),
  email: validInput.email,
  createdAt: expect.any(Date),
});
```

Catches: `saveUser` returning `{}` or echoing the input.

### 2. "mock was called" → state + args + output

```ts
// WEAK
await vm.saveUser(input);
expect(httpClient.post).toHaveBeenCalled();

// STRONG
await vm.saveUser(input);
expect(httpClient.post).toHaveBeenCalledWith(`${baseUrl}/users`, input);
expect(vm.users()).toContainEqual(expect.objectContaining({ email: input.email }));
expect(vm.isFormVisible()).toBe(false);
expect(vm.errorMessage()).toBeNull();
```

Catches: the handler not reloading, not closing the form, or silently
failing.

### 3. Happy path only → add failure path + negative space

```ts
it('keeps form open and exposes error when create fails', async () => {
  vm.openCreateForm();
  const promise = vm.saveUser(validInput);
  httpTesting.expectOne('POST', `${baseUrl}/users`)
    .error(new ProgressEvent('error'));
  await promise;
  expect(vm.isFormVisible()).toBe(true);
  expect(vm.errorMessage()).toBeTruthy();
  expect(vm.isSaving()).toBe(false);
  expect(vm.users()).toEqual([]);
});

it('does not issue a write when input is invalid', async () => {
  const promise = vm.saveUser(invalidInput);
  await promise;
  httpTesting.expectNone('POST', `${baseUrl}/users`);
  expect(vm.errorMessage()).toMatch(/invalid/i);
});
```

Catches: silent error swallowing and missing input validation.

### 4. `array.length === N` → content + order

```ts
// WEAK
expect(vm.users().length).toBe(1);

// STRONG
expect(vm.users()).toEqual([
  expect.objectContaining({ id: createdUser.id, email: createdUser.email }),
]);
```

Catches: returning `[anything]` instead of the real user.

### 5. Implementation peek → public contract

If a test reads `_internalMap` or calls `resetForTesting()`, rewrite against
a public observable outcome. If no public outcome exists, the behavior has
no observable contract — hand to `reviewing-testability` rather than keep
the peek.

### 6. Empty snapshot → hand-crafted structural assertion

```ts
// WEAK
expect(vm.state()).toMatchSnapshot();

// STRONG
expect(vm.state()).toEqual({
  phase: 'loaded',
  users: expect.arrayContaining([
    expect.objectContaining({ id: createdUser.id }),
  ]),
  selectedUserId: createdUser.id,
  error: null,
});
```

### 7. Timeout waits → condition-based waiting

```ts
// WEAK
await new Promise(r => setTimeout(r, 100));
expect(vm.loaded()).toBe(true);

// STRONG
await waitFor(() => vm.loaded() === true);
expect(vm.users()).toEqual(expectedUsers);
```

### 8. State transition: before → during → after

```ts
expect(vm.isSaving()).toBe(false);
const p = vm.saveUser(validInput);
expect(vm.isSaving()).toBe(true);
// flush HTTP
await p;
expect(vm.isSaving()).toBe(false);
expect(vm.users()).toContainEqual(
  expect.objectContaining({ email: validInput.email }),
);
```

Catches: the saving flag never being set, or never being cleared.

## Hard rules

- Never use `toBeTruthy()`, `toBeDefined()`, `toBeFalsy()` as a primary
  assertion.
- Never rely on `toHaveBeenCalled()` alone — pair with
  `toHaveBeenCalledWith(specific)` and a state or output assertion, or drop
  the mock check.
- Never assert `.length` without content.
- Never leave a behavior with only a positive-path test.
- Never write `expect(true).toBe(true)` or equivalent padding.
- If you cannot assert something specific because the code shape prevents
  it, stop. Hand the case to `reviewing-testability` rather than writing a
  compromise test.

## Output

For each rewrite, one diff block:

```markdown
### <file>:<test name>

**Before (WEAK)**
<old body>

**After (STRONG)**
<new body>

**Mutation caught:** one sentence.
```

Ship the negative-space counterpart in the same unit of work when the
original covered only the happy path.

## Related

- Before rewriting: run `judging-test-quality` to confirm the verdict.
- If rewriting keeps hitting architectural walls: `reviewing-testability`.
- When driving a whole file or module to full coverage:
  `mutation-resistant-coverage`.
