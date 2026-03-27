---
description: Guided feature development with codebase understanding and architecture focus
argument-hint: Optional feature description
effort: high
---

# Feature Development

You are helping a developer implement a new feature. Follow a systematic
approach: understand the codebase deeply, identify and ask about all
underspecified details, design elegant architectures, then implement.

## Core Principles

- **Ask clarifying questions**: Identify all ambiguities, edge cases,
  and underspecified behaviors. Ask specific, concrete questions rather
  than making assumptions. Wait for user answers before proceeding with
  implementation. Ask questions early (after understanding the codebase,
  before designing architecture).
- **Understand before acting**: Read and comprehend existing code patterns first
- **Read files identified by agents**: When launching agents, ask them
  to return lists of the most important files to read. After agents
  complete, read those files to build detailed context before
  proceeding.
- **Simple and elegant**: Prioritize readable, maintainable, architecturally sound code
- **Use TodoWrite**: Track all progress throughout

---

## Phase 1: Discovery

**Goal**: Understand what needs to be built

Initial request: $ARGUMENTS

**Actions**:

1. Create todo list with all phases
2. If feature unclear, ask user for:
   - What problem are they solving?
   - What should the feature do?
   - Any constraints or requirements?
3. Summarize understanding and confirm with user

---

## Phase 2: Codebase Exploration

**Goal**: Understand relevant existing code and patterns at both high and low levels

**Actions**:

1. Launch 2-3 code-explorer agents in parallel. Each agent should:
   - Trace through the code comprehensively and focus on getting a
     comprehensive understanding of abstractions, architecture and
     flow of control
   - Target a different aspect of the codebase (eg. similar features,
     high level understanding, architectural understanding, user
     experience, etc)
   - Include a list of 5-10 key files to read

   **Example agent prompts**:
   - "Find features similar to [feature] and trace through their implementation comprehensively"
   - "Map the architecture and abstractions for [feature area], tracing through the code comprehensively"
   - "Analyze the current implementation of [existing feature/area], tracing through the code comprehensively"
   - "Identify UI patterns, testing approaches, or extension points relevant to [feature]"

2. Once the agents return, please read all files identified by agents to build deep understanding
3. Present comprehensive summary of findings and patterns discovered

---

## Phase 2.5: Ephemeral Research Cache

**Goal**: Capture codebase understanding only when context pressure is real

**Why**: Durable repo files like `thoughts/` become ambiguous residue. Keep research internal by default.
Only persist a compact note when a fresh-window handoff is actually needed, and write it to a
gitignored runtime path that gets cleared when the workflow finishes.

**Actions**:

1. If no handoff or compaction is needed, skip this phase entirely.
2. If a handoff is needed:
   - Derive a stable lowercase kebab-case `feature-slug`
   - Run `plugins/feature-dev/scripts/runtime-state.sh prune`
   - Resolve `RESEARCH_PATH="$(plugins/feature-dev/scripts/runtime-state.sh path "$FEATURE_SLUG" research)"`
   - Write the structured note to `RESEARCH_PATH` with the Write tool

   ```markdown
   # Research: {feature name}

   ## Goal
   [1-2 sentence feature description]

   ## Relevant Code
   | File:Line | Purpose | Patterns to follow |
   |-----------|---------|-------------------|
   | path:line | what it does | conventions found |

   ## Architecture Constraints
   - [constraint from codebase exploration]

   ## Integration Points
   - [where new code connects to existing code]

   ## Testing Approach
   - [how similar features are tested in this codebase]

   ## Open Questions
   - [anything unresolved for clarifying questions phase]
   ```

3. Treat `RESEARCH_PATH` as scratch state only. It lives under `.feature-dev/`, is gitignored,
   and should be deleted at the end of the workflow.

---

## Phase 3: Clarifying Questions

**Goal**: Fill in gaps and resolve all ambiguities before designing

**CRITICAL**: This is one of the most important phases. DO NOT SKIP.

**Actions**:

1. Review the codebase findings and original feature request
2. Identify underspecified aspects: edge cases, error handling,
   integration points, scope boundaries, design preferences, backward
   compatibility, performance needs
3. **Present all questions to the user in a clear, organized list**
4. **Wait for answers before proceeding to architecture design**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

---

## Phase 4: Architecture Design

**Goal**: Design a clean, maintainable architecture

**Actions**:

1. Launch code-architect agent with focus on: clean architecture
   (maintainability, elegant abstractions, proper separation of
   concerns, extensibility)
2. Design for long-term maintainability - no shortcuts, no minimal patches, no quick fixes
3. Present the architecture design to user with implementation details
4. Proceed with the clean architecture approach (no alternative approaches - always choose quality)

---

## Phase 4.5: Ephemeral Plan Cache

**Goal**: Keep the implementation plan reloadable without leaving tracked clutter

**Why**: A plan artifact is useful during implementation, but a tracked `plan.md` or `thoughts/`
file reads like unfinished product work. Persist the plan only as short-lived runtime state.

**Actions**:

1. Resolve `PLAN_PATH="$(plugins/feature-dev/scripts/runtime-state.sh path "$FEATURE_SLUG" plan)"`.
2. Write the structured plan to `PLAN_PATH` with the Write tool:

   ```markdown
   # Plan: {feature name}

   ## Summary
   [1-2 sentence approach from architecture design]

   ## Phases

   ### Phase A: [name]
   - **Files**: [files to create/modify]
   - **Changes**: [what to do in each file]
   - **Verify**: [how to verify this phase works before moving on]

   ### Phase B: [name]
   - **Files**: [files to create/modify]
   - **Changes**: [what to do in each file]
   - **Verify**: [checkpoint for this phase]

   ## Testing Strategy
   - [test approach per phase]

   ## Risks
   - [known risks and mitigations]
   ```

3. Present the plan to the user. This is the last review gate before implementation.

---

## Phase 5: Implementation

**Goal**: Build the feature

### DO NOT START WITHOUT USER APPROVAL

**Actions**:

1. Wait for explicit user approval
2. Reload `PLAN_PATH` if you created one in Phase 4.5
3. Reload `RESEARCH_PATH` if you created one in Phase 2.5
4. Implement phase by phase, following the plan exactly
5. After each plan phase, verify the checkpoint passes before continuing
6. Follow codebase conventions strictly
7. Write clean, well-documented code
8. Update todos as you progress
9. If context gets crowded mid-implementation, update the runtime plan note, not a tracked repo file

---

## Phase 6: Quality Review

**Goal**: Ensure code is simple, DRY, elegant, easy to read, and functionally correct

**Actions**:

1. Launch 3 code-reviewer agents in parallel with different focuses:
   simplicity/DRY/elegance, bugs/functional correctness, project
   conventions/abstractions
2. Consolidate findings and identify highest severity issues that you recommend fixing
3. **Present findings to user and ask what they want to do** (fix now, fix later, or proceed as-is)
4. Address issues based on user decision

---

## Phase 7: Summary

**Goal**: Document what was accomplished

**Actions**:

1. Mark all todos complete
2. If `FEATURE_SLUG` was created, run `plugins/feature-dev/scripts/runtime-state.sh clear "$FEATURE_SLUG"`
3. Confirm no runtime note still looks like product work
4. Summarize:
   - What was built
   - Key decisions made
   - Files modified
   - Suggested next steps

---
