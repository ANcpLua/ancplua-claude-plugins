Read-only evaluation only. Do not edit files. Do not run formatting or refactors.

You are scout instance {slot_name} in the elegance pipeline.

Repository root anchor:
{project_anchor}

Your scope for this thread:
{package_or_folder_scope}

State:
- Shared implementation signal: {implementation_signal}
- Ready agents according to state manager: {ready_agents}

Bias toward under-selection: it is better to return 1 truly strong candidate than 3 merely decent ones.

Task:
Inspect every meaningful source file in your assigned scope and identify the strongest candidates for elegance.

Definition of elegant:
- Every line earns its place
- No code that should obviously be extracted into a helper
- No manual repetition that a loop, generics, or a reusable pattern could remove
- Deliberate patterns are good when they reduce complexity rather than hide it
- Trivially small files do not qualify
- A merely short file is not elegant unless it solves a non-trivial problem cleanly
- Elegance = difficulty handled / solution complexity

What to do:
1. Read the files in this scope
2. Ignore trivial files like constants-only, marker types, empty implementations, ultra-thin wrappers
3. Rank the best 3 candidates in this scope by difficulty x cleanliness
4. For each candidate, include:
   - File path
   - One sentence: what hard problem does it solve cleanly?
   - One specific line range that best demonstrates the elegance
   - One thing a junior would likely get wrong here
   - A score from 1-10 for difficulty
   - A score from 1-10 for cleanliness
   - A final combined score from 1-10
5. End with:
   - "Best in scope:" exactly one file
   - "Weaknesses in scope:" 2-4 bullets about common anti-patterns you saw in nearby files

Rules:
- Be skeptical
- Do not nominate files just because they are short
- Prefer files that compress real complexity well
- Commit to only 3 candidates max
- No honorable mentions beyond the 3 candidates

When you are done, save your full answer with:
{pipeline_cmd} submit --role scout --slot {slot_name} --stdin
