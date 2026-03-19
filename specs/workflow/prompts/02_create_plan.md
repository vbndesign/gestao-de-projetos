---
description: Create detailed implementation plans through interactive research and iteration
model: opus
---

# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a PRD file path was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:
```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The PRD file path (e.g., specs/prds/prd-02a-projetos-fases-backend.md)
2. Any relevant context, constraints, or specific requirements
3. Links to related research documents in specs/workflow/research/

I'll analyze this information and work with you to create a comprehensive plan.

Tip: You can also invoke this command with a PRD file directly: `/create_plan specs/prds/prd-02a-projetos-fases-backend.md`
For deeper analysis, try: `/create_plan think deeply about specs/prds/prd-02a-projetos-fases-backend.md`
```

Then wait for the user's input.

## Determine planning mode before doing anything else

Assess what exists in the project:

- **Specs-only mode** — `src/` is absent or empty; specs/PRDs are the primary source. Research means reading specs and the research document, not exploring code. Plan phases should describe what to create from scratch.
- **Codebase mode** — `src/` has application code. Research means exploring live code as the primary source of truth; specs are secondary context.
- **Mixed mode** — some modules are implemented, others are spec-only. Distinguish clearly between "modify existing" and "create from scratch".

---

## Process Steps

### Step 1: Context Gathering & Initial Analysis

1. **Read all mentioned files immediately and FULLY**:
   - PRD files (e.g., `specs/prds/prd-XXx-name.md`)
   - Research documents from `specs/workflow/research/`
   - Related implementation plans from `specs/workflow/plans/`
   - Any JSON/data files mentioned
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: DO NOT spawn sub-tasks before reading these files yourself in the main context
   - **NEVER** read files partially — if a file is mentioned, read it completely

2. **Determine planning mode**:
   - Check whether `src/` exists and has application code
   - This determines how research sub-tasks are structured (see below)

3. **For features with relevant UI (PRD has "Design Reference"):**
   - Do not plan visual frontend without identified Figma nodes
   - Check if the research document has a "Design Reference Analysis" section — if not, alert the user
   - Include an explicit component inventory (create / reuse / extend) before writing the plan
   - Decide whether this is a visual refactor or new implementation (affects phasing)

4. **Spawn initial research tasks to gather context**:
   Before asking the user any questions, use native agents to research in parallel:

   **For spec/doc research (specs-only or mixed mode):**
   - Use **Read** to read full spec files (`specs/foundation/`, `specs/prds/`)
   - Use **Grep/Glob** to find relevant sections across spec documents
   - Focus on: scope definitions, data models, stack decisions, version pins, constraints

   **For codebase research (codebase or mixed mode):**
   - Use the **Explore** agent to find all files related to the PRD/task
   - Use **Grep/Glob** tools to understand how the current implementation works
   - Focus on: source files, configs, existing patterns, data flow, key functions

   All agents return detailed explanations with file:line references.

5. **Read all files identified by research tasks**:
   - After research tasks complete, read ALL files they identified as relevant
   - Read them FULLY into the main context
   - This ensures you have complete understanding before proceeding

6. **Analyze and verify understanding**:
   - **Specs-only:** Cross-reference the PRD with foundation specs and the research document
   - **Codebase/Mixed:** Cross-reference the PRD requirements with actual code
   - Identify any discrepancies or misunderstandings
   - Note assumptions that need verification
   - Determine true scope based on project reality

7. **Present informed understanding and focused questions**:
   ```
   Based on the PRD and my research of the project, I understand we need to [accurate summary].

   I've found that:
   - [Current state detail with file:line reference]
   - [Relevant pattern, constraint, or spec decision discovered]
   - [Potential complexity or edge case identified]

   Questions that my research couldn't answer:
   - [Specific technical question that requires human judgment]
   - [Business logic clarification]
   - [Design preference that affects implementation]
   ```

   Only ask questions that you genuinely cannot answer through investigation.

### Step 2: Research & Discovery

After getting initial clarifications:

1. **If the user corrects any misunderstanding**:
   - DO NOT just accept the correction
   - Spawn new research tasks to verify the correct information
   - Read the specific files/directories they mention
   - Only proceed once you've verified the facts yourself

2. **Create a research todo list** using TodoWrite to track exploration tasks

3. **Spawn parallel sub-tasks for comprehensive research**:
   - Create multiple Task agents to research different aspects concurrently
   - Use the right agent for each type of research:

   **For spec research (specs-only or mixed mode):**
   - **Read** tool — to read full spec files and research documents
   - **Grep/Glob** tools — to find relevant sections across specs

   **For codebase research (codebase or mixed mode):**
   - **Explore** agent — to find specific files and understand implementation details
   - **Grep/Glob** tools — to find similar patterns we can model after

   Each agent should:
   - Find the right files, spec sections, or code patterns
   - Identify conventions, constraints, and decisions to follow
   - Look for integration points and dependencies
   - Return specific file:line references
   - Find existing examples or spec definitions

4. **Wait for ALL sub-tasks to complete** before proceeding

5. **Present findings and design options**:
   ```
   Based on my research, here's what I found:

   **Current State:**
   - [Key discovery about existing code or spec definitions]
   - [Pattern or convention to follow]

   **Design Options:**
   1. [Option A] - [pros/cons]
   2. [Option B] - [pros/cons]

   **Open Questions:**
   - [Technical uncertainty]
   - [Design decision needed]

   Which approach aligns best with your vision?
   ```

### Step 3: Plan Structure Development

Once aligned on approach:

1. **Create initial plan outline**:
   ```
   Here's my proposed plan structure:

   ## Overview
   [1-2 sentence summary]

   ## Implementation Phases:
   1. [Phase name] - [what it accomplishes]
   2. [Phase name] - [what it accomplishes]
   3. [Phase name] - [what it accomplishes]

   Does this phasing make sense? Should I adjust the order or granularity?
   ```

2. **Get feedback on structure** before writing details

### Step 4: Detailed Plan Writing

After structure approval:

1. **Write the plan** to `specs/workflow/plans/YYYY-MM-DD-[prd-ref-]description.md`
   - Format where:
     - `YYYY-MM-DD` is today's date
     - `prd-ref` is the PRD reference if applicable (e.g. `prd-00a`), omit otherwise
     - `description` is a brief kebab-case description
   - Examples:
     - With PRD: `2026-03-12-prd-00a-setup.md`
     - Without PRD: `2026-03-12-improve-error-handling.md`

2. **Use this template structure**:

````markdown
# [Feature/Task Name] Implementation Plan

## Overview

[Brief description of what we're implementing and why]

## Current State Analysis

[What exists now, what's missing, key constraints discovered]

## Desired End State

[A Specification of the desired end state after this plan is complete, and how to verify it]

### Key Discoveries:
- [Important finding with file:line reference]
- [Pattern to follow]
- [Constraint to work within]

## What We're NOT Doing

[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach

[High-level strategy and reasoning]

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

```[language]
// Specific code to add/modify
```

### Success Criteria:

#### Automated Verification:
- [ ] Migration applies cleanly: `npx prisma migrate dev`
- [ ] Type checking passes: `pnpm build`
- [ ] Prisma client updated: `npx prisma generate`

#### Manual Verification:
- [ ] Feature works as expected when tested via UI
- [ ] Edge case handling verified manually
- [ ] No regressions in related features

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: [Descriptive Name]

[Similar structure with both automated and manual success criteria...]

---

## Testing Strategy

### Manual Testing Steps:
1. [Specific step to verify feature]
2. [Another verification step]
3. [Edge case to test manually]

## Migration Notes

[If applicable, how to handle existing data/systems]

## References

- Original PRD: `specs/prds/prd-XXx-description.md`
- Related research: `specs/workflow/research/[relevant].md`
- Similar implementation: `[file:line]`
````

### Step 5: Review

1. **Present the draft plan location**:
   ```
   I've created the initial implementation plan at:
   `specs/workflow/plans/YYYY-MM-DD-prd-XXx-description.md`

   Please review it and let me know:
   - Are the phases properly scoped?
   - Are the success criteria specific enough?
   - Any technical details that need adjustment?
   - Missing edge cases or considerations?
   ```

2. **Iterate based on feedback** — be ready to:
   - Add missing phases
   - Adjust technical approach
   - Clarify success criteria (both automated and manual)
   - Add/remove scope items

3. **Continue refining** until the user is satisfied

## Important Guidelines

1. **Be Skeptical**:
   - Question vague requirements
   - Identify potential issues early
   - Ask "why" and "what about"
   - Don't assume — verify with code or specs

2. **Be Interactive**:
   - Don't write the full plan in one shot
   - Get buy-in at each major step
   - Allow course corrections
   - Work collaboratively

3. **Be Thorough**:
   - Read all context files COMPLETELY before planning
   - Research actual code patterns using parallel sub-tasks
   - Include specific file paths and line numbers
   - Write measurable success criteria with clear automated vs manual distinction
   - Automated steps should use `pnpm` — for example `pnpm build` instead of `npm run typecheck`

4. **Be Practical**:
   - Focus on incremental, testable changes
   - Consider migration and rollback
   - Think about edge cases
   - Include "what we're NOT doing"

5. **Track Progress**:
   - Use TodoWrite to track planning tasks
   - Update todos as you complete research
   - Mark planning tasks complete when done

6. **No Open Questions in Final Plan**:
   - If you encounter open questions during planning, STOP
   - Research or ask for clarification immediately
   - Do NOT write the plan with unresolved questions
   - The implementation plan must be complete and actionable
   - Every decision must be made before finalizing the plan

## Success Criteria Guidelines

**Always separate success criteria into two categories:**

1. **Automated Verification** (can be run by execution agents):
   - Commands that can be run: `pnpm build`, `npx prisma generate`, etc.
   - Specific files that should exist
   - Code compilation/type checking

2. **Manual Verification** (requires human testing):
   - UI/UX functionality
   - Edge cases that are hard to automate
   - User acceptance criteria

**Format example:**
```markdown
### Success Criteria:

#### Automated Verification:
- [ ] Migration applies cleanly: `npx prisma migrate dev`
- [ ] Type checking passes: `pnpm build`

#### Manual Verification:
- [ ] New feature appears correctly in the UI
- [ ] Error messages are user-friendly
```

## Common Patterns

### For Project Bootstrap / Initial Setup:
- Initialize project tooling (package manager, framework)
- Configure core settings (TypeScript, linting, paths)
- Set up UI foundation (CSS framework, component library)
- Create folder structure with empty placeholders
- Validate with build and dev server

### For Database Changes:
- Start with schema/migration
- Add queries
- Update business logic in services
- Expose via Server Actions
- Update UI last

### For New Features:
- Research existing patterns first
- Start with data model
- Build backend logic in services
- Add Server Actions
- Implement UI last

### For New Features with UI (PRD has "Design Reference"):
- Phase A: Data — schema, queries, actions, services
- Phase B: Semantic components — new or extended (via Figma MCP, node by node)
- Phase C: Screen composition — using Phase B components
- Phase D: Visual validation — screenshot vs. Figma node by node, fine-tuning
- Phase E: Code Connect — only after component stabilizes (2+ visual validations)

Component inventory is required before writing Phase B:
- Reuse existing: [which component, from which file]
- Extend primitive: [which, how — variant, wrapper or composition]
- Create new: [Level 1/2/3, why, Figma node ID]

### For Refactoring:
- Document current behavior
- Plan incremental changes
- Maintain backwards compatibility
- Include migration strategy

## Sub-task Spawning Best Practices

When spawning research sub-tasks:

1. **Spawn multiple tasks in parallel** for efficiency
2. **Each task should be focused** on a specific area
3. **Provide detailed instructions** including:
   - Exactly what to search for
   - Which directories to focus on (`src/services/`, `src/queries/`, `src/actions/`, etc.)
   - What information to extract
   - Expected output format
4. **Be EXTREMELY specific about directories**:
   - In specs-only mode, specify spec file paths (e.g., `specs/foundation/03_arquitetura.md`)
   - In codebase mode, specify source directories (e.g., `src/services/`, `src/queries/`)
   - Include the full path context in your prompts
5. **Specify read-only tools** to use
6. **Request specific file:line references** in responses
7. **Wait for all tasks to complete** before synthesizing
8. **Verify sub-task results**:
   - If a sub-task returns unexpected results, spawn follow-up tasks
   - Cross-check findings against the actual codebase or specs
   - Don't accept results that seem incorrect

## Example Interaction Flow

```
User: /create_plan
Assistant: I'll help you create a detailed implementation plan...

User: specs/prds/prd-02a-projetos-fases-backend.md
Assistant: Let me read that PRD file completely first...

[Reads file fully]

Based on the PRD, I understand we need to implement the Projetos + Fases backend including schema migration, queries, service with R1/R2 rules, and Server Actions. Before I start planning, I have some questions...

[Interactive process continues...]
```
