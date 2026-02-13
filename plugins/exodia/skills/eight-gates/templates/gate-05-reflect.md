# Gate 5: 杜門 TOMON — REFLECT

> Reflection is powerful — and expensive — so it gets rules.
> One round. Three questions per finding. Then stop.
> If it wants to philosophize: stop. Run the mini-test instead.
> Evidence beats eloquence.

## Entry Condition

- Gate 4 checkpoint exists (`checkpoint.sh verify 4`)
- Findings cached in artifacts

## Rules

- **ONE reflection round.** No more.
- **THREE questions per P0/P1 finding.** No more.
- P2/P3 findings are NOT reflected on (not worth the time).
- If the agent wants more reflection: propose a mini-test instead.
- Mini-test = one command, one check, one grep. Concrete, fast, testable.

## Agent Prompt (1 Agent — Hard Limit)

> subagent: metacognitive-guard:deep-think-partner
>
> You are the **reflector**. One round. Hard limit.
> SESSION: $SESSION_ID
>
> P0/P1 FINDINGS TO REVIEW:
> [Lead: inject P0/P1 findings from Gate 4 artifacts here.
> Use `session-state.sh artifact get "findings"` to retrieve,
> then paste into this prompt. Subagents have NO conversation history.]
>
> For EACH P0/P1 finding, answer ONLY these 3 questions:
>
> 1. **What is PROBABLY WRONG with this finding?**
>    (false positive? misread code? stale assumption? incomplete evidence?)
>
> 2. **Which ASSUMPTION is the riskiest?**
>    (what would invalidate the finding entirely if wrong?)
>
> 3. **What MINI-TEST would validate it fastest?**
>    (one command, one check, one grep — concrete and executable)
>
> DO NOT:
> - Philosophize about architecture
> - Expand scope beyond the findings
> - Add new findings
> - Propose solutions
> - Request additional reflection rounds
>
> 3 answers per finding. Output format:
>
> ```text
> FINDING: [P0/P1] [description] — [file:line]
> PROBABLY WRONG: [specific doubt with reasoning]
> RISKIEST ASSUMPTION: [the one thing that could invalidate this]
> MINI-TEST: [exact command or check to validate]
> ---
> ```
>
> After all findings reviewed: DONE. No summary. No recommendations.

## Post-Reflection Actions (Lead)

For each mini-test proposed by the reflector:

1. **If executable now** → run it. Update finding confidence based on result.
2. **If not executable** → note as "unverified assumption" for Gate 6.
3. **If finding invalidated** → mark as false positive, remove from work queue.

```bash
# Log reflection outcomes
plugins/exodia/scripts/smart/session-state.sh decision "reflection-outcome" \
  "Reviewed [n] findings: [x] confirmed, [y] challenged, [z] invalidated"
```

## Output Schema

```json
{
  "gate": 5,
  "findings_reviewed": 0,
  "confirmed": 0,
  "challenged": 0,
  "invalidated": 0,
  "mini_tests_run": 0,
  "mini_tests_passed": 0
}
```

## Exit Condition

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 5 "reflection-complete" \
  "findings_reviewed=[n]" \
  "confirmed=[n]" \
  "challenged=[n]" \
  "invalidated=[n]" \
  "mini_tests_run=[n]"
```

**PROCEED** always. Reflection informs, it doesn't block.
The refined findings feed into Gate 6 (REDUCE).
