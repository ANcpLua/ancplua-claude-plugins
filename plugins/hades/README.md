# Hades

The rules enforcer. Exodia's counterpart.

Exodia = God. Creation. 8 skills that build, fix, review, compete.
Hades = Satan. Judgment. 2 commands that evaluate and enforce.

Hades follows the rules. Else we can't play games.

## Commands

| Command | What it does |
|---------|-------------|
| `/hades:judge` | Runs 6 enforcement agents in parallel. Returns PROCEED/HALT verdict. |
| `/hades:enforce` | Fixes all violations. Loops judge->fix->judge until clean. |

## The Duality

```
Exodia creates  ->  Hades judges  ->  HALT?  ->  Hades enforces  ->  PROCEED  ->  Ship
```

Without Hades, Exodia builds garbage confidently.
Without Exodia, Hades has nothing to judge.

## What Hades Enforces

| Domain | Agent | What it catches |
|--------|-------|----------------|
| Architecture | arch-reviewer | SOLID, coupling, boundaries, SSOT |
| Implementation | impl-reviewer | Banned APIs, versions, security |
| Integrity | code-reviewer | Warning suppressions, commented tests, shortcuts |
| Build/Test | verification-subagent | Compilation, test pass, format |
| MSBuild/CPM | Bash | Hardcoded versions, inline PackageReference |
| Cleanup | cleanup-specialist | Dead code, duplication, stale comments |

## Unifies These Plugins

Hades consolidates enforcement logic scattered across:

- `metacognitive-guard` (competitive review, verification)
- `completion-integrity` (shortcut detection)
- `autonomous-ci` (CI verification)
- `dotnet-architecture-lint` (MSBuild rules)
- `cleanup-specialist` (debt elimination)

One plugin. Two commands. All enforcement.

## LAW 2: Agent Loop

```
Execute (Exodia builds)
    -> Evaluate (Hades judges)
        -> Decide (PROCEED / HALT)
            -> If HALT: Enforce (Hades fixes)
                -> Re-evaluate (Hades re-judges)
                    -> PROCEED or escalate
```

## HALT Conditions

- Any P0 violation = HALT
- More than 3 P1 violations = HALT
- Build or test failure = HALT
- Everything else = PROCEED with advisories
