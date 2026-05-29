# Eight Gates — Status & Final Report Templates

## Gate Status Template

Print this at any point to show progress across all eight gates:

```text
+====================================================================+
|                    EIGHT GATES STATUS                               |
+====================================================================+
| Session: [SESSION_ID]                                               |
| Objective: $0 | Type: [BUG|AUDIT|FEATURE|CLEANUP|CUSTOM]            |
| Scope: $1 | Gate Limit: $2                                         |
+--------------------------------------------------------------------+
| Gate 1 開門 SCOPE:      [DONE|ACTIVE|PENDING] | agents: 0          |
| Gate 2 休門 CONTEXT:    [DONE|ACTIVE|PENDING] | agents: [n]        |
| Gate 3 生門 MAP:        [DONE|ACTIVE|PENDING] | agents: [n]        |
| Gate 4 傷門 CHECKPOINT: [DONE|ACTIVE|PENDING] | agents: 0          |
| Gate 5 杜門 REFLECT:    [DONE|ACTIVE|PENDING] | agents: 1          |
| Gate 6 景門 REDUCE:     [DONE|ACTIVE|PENDING] | agents: [n]        |
| Gate 7 驚門 EXECUTE:    [DONE|ACTIVE|PENDING] | agents: [n]        |
| Gate 8 死門 HAKAI:      [DONE|ACTIVE|PENDING] | agents: [n]        |
+--------------------------------------------------------------------+
| Checkpoints: [n] | Decisions: [n]                                   |
| Session TTL: [remaining]s                                           |
+====================================================================+
| VERDICT: SHIP | HALT at Gate [n] | IN PROGRESS Gate [n]            |
+====================================================================+
```

## Final Report

Print after SHIP:

```text
+====================================================================+
|                    EIGHT GATES — MISSION COMPLETE                   |
+====================================================================+
| Session: [SESSION_ID]                                               |
| Objective: $0 | Type: [type]                                       |
| Gates Opened: [n]/8                                                 |
+====================================================================+
|  Gate 1 SCOPE:      [summary]                                      |
|  Gate 2 CONTEXT:    [n] artifacts, [n] assumptions verified         |
|  Gate 3 MAP:        [n] agents, [n] findings (P0:[n] P1:[n])       |
|  Gate 4 CHECKPOINT: [n] artifacts, [n] decisions                    |
|  Gate 5 REFLECT:    [n] validated, [n] challenged                   |
|  Gate 6 REDUCE:     [n] work items, [n] killed                     |
|  Gate 7 EXECUTE:    [n] items done, [n] tests passing               |
|  Gate 8 HAKAI:      build=PASS tests=PASS verification=COMPLETE    |
+====================================================================+
|  Agents spawned: [n] | ITERATIONS: [n]                               |
|  SESSION: created [time] | duration [n]s                            |
|  LEDGER: [n] entries                                                |
+====================================================================+
```
