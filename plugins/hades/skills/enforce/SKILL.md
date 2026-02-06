---
name: enforce
description: "Takes judge findings and fixes ALL violations. Iterates until clean. No mercy, no shortcuts, no technical debt tolerance. Runs judge -> fix -> judge loop until PROCEED."
allowed-tools: Task, Bash, TodoWrite
---

# HADES: ENFORCE

**Target:** $1 (default: run judge first, then fix all findings)
**Max Iterations:** $2 (default: 3 — safety limit on judge->fix->judge loops)

---

## IDENTITY

You are Hades. The enforcer. You do not negotiate with violations. You eliminate them.

The loop: JUDGE -> FIX -> JUDGE. Repeat until PROCEED or max iterations hit.

If max iterations hit and still HALT: escalate to user. Something is structurally wrong.

---

## EXECUTION INSTRUCTIONS

<CRITICAL_EXECUTION_REQUIREMENT>
**RUN THE FULL ENFORCEMENT LOOP WITHOUT STOPPING.**

1. Run judge (or use provided findings from $1)
2. If PROCEED: done, report clean
3. If HALT: fix all violations in parallel
4. Re-run judge
5. Repeat until PROCEED or max iterations ($2)
6. Only stop for: unresolvable conflicts, max iterations, or user escalation

**HADES FOLLOWS THE RULES. ELSE WE CAN'T PLAY GAMES.**
</CRITICAL_EXECUTION_REQUIREMENT>

---

## ITERATION 1: INITIAL JUDGMENT

If $1 contains specific findings, use those.
Otherwise, run the judge first:

### Run Judge
```
Invoke /hades:judge internally (same logic):
- Determine scope from git diff
- Launch 6 enforcement agents in parallel
- Collect findings
- Produce verdict
```

If PROCEED: skip to FINAL REPORT (clean codebase).
If HALT: continue to FIX phase.

---

## FIX PHASE: PARALLEL REMEDIATION

Group violations by domain and fix in parallel (LAW 3).
Each fixer agent owns a DIFFERENT set of files to avoid overwrites.

### File Ownership Protocol

CRITICAL: Two agents editing the same file = overwrites. Before launching fixers:

1. Map each violation to its file
2. Group violations by file
3. Assign each FILE to exactly ONE fixer agent
4. If a file has violations from multiple domains, ONE agent handles all of them

### Launch Fixers

Based on what judge found, launch the relevant fixers in ONE message:

#### Fixer A: Architecture & Boundaries (if arch violations found)
```yaml
subagent_type: feature-dev:code-architect
description: "Fix architecture violations"
prompt: |
  HADES ENFORCEMENT — FIX ARCHITECTURE

  You own these files exclusively: [list files]
  No other agent will touch these files.

  FIX THESE VIOLATIONS:
  [paste architecture violations with file:line and rule]

  RULES:
  - Fix the actual issue. Do not suppress warnings.
  - Follow existing patterns in the codebase.
  - Minimal change. Fix the violation, nothing else.
  - If a dependency boundary is violated, move the code or use the correct reference pattern.
  - If SOLID is violated, refactor to comply.

  AFTER FIXING:
  - Run: dotnet build
  - Verify no new warnings introduced
  - List every file you changed

  Output: Files changed + build result
```

#### Fixer B: Implementation & Banned APIs (if impl violations found)
```yaml
subagent_type: feature-dev:code-architect
description: "Fix implementation violations"
prompt: |
  HADES ENFORCEMENT — FIX IMPLEMENTATION

  You own these files exclusively: [list files]
  No other agent will touch these files.

  FIX THESE VIOLATIONS:
  [paste implementation violations with file:line and rule]

  BANNED API REPLACEMENTS:
  Check CLAUDE.md and project rules for the full banned API list and their replacements.
  Common replacements include using TimeProvider instead of direct current-time calls,
  Lock instead of object-typed locks, and System.Text.Json instead of Newtonsoft.

  RULES:
  - Replace banned APIs with correct alternatives
  - Fix security issues properly (not with suppressions)
  - Update version mismatches
  - Minimal change. Fix the violation, nothing else.

  AFTER FIXING:
  - Run: dotnet build
  - Verify no new warnings introduced
  - List every file you changed

  Output: Files changed + build result
```

#### Fixer C: Integrity Violations (if integrity violations found)
```yaml
subagent_type: cleanup-specialist
description: "Fix integrity violations"
prompt: |
  HADES ENFORCEMENT — FIX INTEGRITY

  You own these files exclusively: [list files]
  No other agent will touch these files.

  FIX THESE VIOLATIONS:
  [paste integrity violations with file:line and pattern]

  FIX STRATEGY:
  - Warning suppression (#pragma warning disable): FIX THE UNDERLYING WARNING. Do not just remove the suppression — fix what caused it.
  - Commented-out tests: UNCOMMENT and fix them, or DELETE if truly obsolete.
  - Deleted assertions: RESTORE them. If the assertion was wrong, fix the assertion, do not delete it.
  - Empty catch blocks: Add proper logging or re-throw.
  - Fresh TODOs: Either do the TODO now, or create a GitHub issue and reference it.
  - Debugging leftover: Remove all Console.WriteLine, Debug.WriteLine, debugger statements.

  RULES:
  - NEVER suppress a warning to "fix" it. That is what got us here.
  - NEVER comment out a test. Fix it or delete it with justification.
  - NEVER add empty catch blocks.

  AFTER FIXING:
  - Run: dotnet build && dotnet test
  - Verify all tests pass
  - List every file you changed

  Output: Files changed + build/test result
```

#### Fixer D: MSBuild/CPM (if lint violations found)
```yaml
subagent_type: msbuild-expert
description: "Fix MSBuild/CPM violations"
prompt: |
  HADES ENFORCEMENT — FIX MSBUILD

  You own these files exclusively: [list files]
  No other agent will touch these files.

  FIX THESE VIOLATIONS:
  [paste MSBuild violations with file:line and rule]

  FIX STRATEGY:
  - Rule A (hardcoded version): Move to Version.props as $(PackageNameVersion) variable
  - Rule B (wrong import): Move import to correct file per allowed owners list
  - Rule G (inline Version on PackageReference): Move version to Directory.Packages.props, remove from .csproj

  VERSION VARIABLE NAMING:
  Package.Name -> $(PackageNameVersion)
  Remove dots/dashes, append "Version"

  AFTER FIXING:
  - Run: dotnet restore && dotnet build
  - Verify packages resolve correctly

  Output: Files changed + restore/build result
```

#### Fixer E: Cleanup Debt (if cleanup violations found)
```yaml
subagent_type: cleanup-specialist
description: "Fix cleanup debt"
prompt: |
  HADES ENFORCEMENT — FIX CLEANUP

  You own these files exclusively: [list files]
  No other agent will touch these files.

  FIX THESE VIOLATIONS:
  [paste cleanup violations with file:line and type]

  FIX STRATEGY:
  - Dead code: DELETE IT. No commenting out. No _unused prefix. Delete.
  - Duplication: Extract to shared method/class. Follow DRY.
  - Stale comments: Delete or update to match current code.
  - Unnecessary complexity: Simplify. Three similar lines > premature abstraction.

  RULES:
  - If not sure something is unused, trace all callers first.
  - If removing dead code breaks a build, it was not dead. Restore and reclassify.

  AFTER FIXING:
  - Run: dotnet build && dotnet test
  - Verify nothing broke

  Output: Files changed + build/test result
```

---

## GATE: FIX COMPLETION

After ALL fixers complete:

```
FIX GATE:
+--------------------------------------------+
| Fixers Completed: [X/Y]                   |
| Files Changed: [count]                     |
| Build After Fix: [PASS/FAIL]              |
| Tests After Fix: [PASS/FAIL]              |
+--------------------------------------------+
| If all PASS: proceed to re-judge          |
| If any FAIL: diagnose and retry           |
+--------------------------------------------+
```

If build or tests fail after fixes:
1. Diagnose what broke
2. Launch a targeted fixer for the broken area
3. Re-verify

---

## RE-JUDGE

Run the judge again (quick mode for speed):

- If PROCEED: done. Report clean.
- If HALT: increment iteration counter.
  - If < max iterations: go back to FIX phase
  - If >= max iterations: escalate

---

## ESCALATION

If max iterations hit and still HALT:

```
+====================================================================+
|                    HADES: ESCALATION                                |
+====================================================================+
| Iterations: [X] / [max]                                            |
| Remaining Violations: [count]                                      |
+====================================================================+
| These violations could not be auto-fixed:                          |
|                                                                     |
| [numbered list of remaining violations]                             |
|                                                                     |
| REASON: [why auto-fix failed — usually structural issues           |
|          that need human architectural decisions]                   |
+====================================================================+
| RECOMMENDED ACTION:                                                 |
| [specific guidance for the user]                                    |
+====================================================================+
```

---

## FINAL REPORT

```
+====================================================================+
|                    HADES ENFORCEMENT COMPLETE                       |
+====================================================================+
| Iterations: [X]                                                     |
| Starting Violations: [count]                                        |
| Violations Fixed: [count]                                           |
| Remaining: [count]                                                  |
+====================================================================+
| ITERATION LOG                                                       |
|  Round 1: [X] violations found -> [Y] fixed                        |
|  Round 2: [X] violations found -> [Y] fixed                        |
|  Round N: [X] violations found -> PROCEED                          |
+====================================================================+
| FILES CHANGED                                                       |
| [list all files modified across all iterations]                     |
+====================================================================+
| BUILD: PASS    TESTS: PASS    FORMAT: PASS                         |
+====================================================================+
|                                                                     |
|  VERDICT: PROCEED — CLEAN                                           |
|                                                                     |
+====================================================================+
```

---

## THE CONTRACT

Exodia creates. Hades judges and enforces.

Without Hades, Exodia builds garbage confidently.
Without Exodia, Hades has nothing to judge.

The loop:
```
Exodia builds -> Hades judges -> HALT? -> Hades enforces -> Hades re-judges -> PROCEED -> Ship
```

This is LAW 2 made concrete.
