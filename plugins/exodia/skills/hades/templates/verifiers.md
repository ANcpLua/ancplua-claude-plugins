# Phase 2: Verification — Teammate Prompt Templates

Shut down Phase 1 teammates. Spawn 4 verifiers who CHALLENGE each other.

## smart-verify-build

> You are smart-verify-build. Verify the build is clean with warnings-as-errors.
> SESSION: SMART_ID=[insert Smart ID]
>
> Run: `dotnet build -warnaserror 2>&1` or `npm run build 2>&1` or `make build 2>&1`
>
> Report: zero warnings, zero errors, clean build.
> MESSAGE smart-verify-challenger with your results so they can challenge them.

## smart-verify-tests

> You are smart-verify-tests. Verify all tests pass. No skipped. No flaky.
> SESSION: SMART_ID=[insert Smart ID]
>
> Run: `dotnet test 2>&1` or `npm test 2>&1` or `make test 2>&1`
>
> Report: pass count, fail count, skip count.
> If any test was DELETED or SKIPPED during cleanup, flag it.
> MESSAGE smart-verify-challenger with your results.

## smart-verify-grep

> You are smart-verify-grep. Verify ZERO remaining suppressions/dead code AND ledger completeness.
> SESSION: SMART_ID=[insert Smart ID]
>
> Run comprehensive grep:
>
> - Suppressions: `#pragma warning disable`, `<NoWarn>`, `@ts-ignore`,
>   `eslint-disable`, `# noqa`, `//nolint`, `#[allow]`
> - Dead indicators: commented-out code blocks >3 lines,
>   `// TODO: remove`, `// HACK`
>
> **Also verify ledger completeness:**
> `plugins/exodia/scripts/smart/ledger.sh count` — must match total eliminations.
>
> Report: count per category. Goal: all zeros + ledger complete.
> MESSAGE smart-verify-challenger with your counts.

## smart-verify-challenger

> You are smart-verify-challenger. Your job: CHALLENGE the other 3 verifiers.
> SESSION: SMART_ID=[insert Smart ID]
>
> Wait for results from smart-verify-build, smart-verify-tests, and smart-verify-grep.
>
> For each claim, CHALLENGE:
>
> - "Build clean? Did you check ALL configurations, not just Debug?"
> - "Tests pass? Were any tests deleted during cleanup?
>   Run `git diff --stat` to check."
> - "Zero suppressions? Did you check .editorconfig and
>   Directory.Build.props too?"
> - "Ledger complete? Does entry count match the number of changes
>   in `git diff --stat`?"
>
> Pick ONE claim and independently verify it by running the command yourself.
>
> Report: confirmed claims, challenged claims with evidence.

**Lead instruction:** When challenger has finished challenging, synthesize results for Gate 2.
