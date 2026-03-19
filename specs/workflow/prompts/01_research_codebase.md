---
description: Research and document the project — specs, PRDs, or existing codebase
model: opus
---

# Research

You are tasked with conducting comprehensive research across the project to answer user questions by spawning parallel sub-agents and synthesizing their findings.

## Determine research mode before doing anything else

Assess what exists in the project:

- **Specs-only mode** — `src/` is absent or empty; specs/PRDs are the primary source. Read `specs/foundation/` and the relevant PRD as if they were the codebase. Do NOT try to find application code that does not exist yet. Document what the specs define, what decisions have been made, and what will be built.
- **Codebase mode** — `src/` has application code. Read live code as the primary source of truth; specs are secondary context.
- **Mixed mode** — some modules are implemented, others are spec-only. Distinguish clearly between "currently implemented" and "spec-defined but not yet built".

---

## CRITICAL: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE PROJECT AS IT EXISTS TODAY

- DO NOT suggest improvements or changes unless the user explicitly asks for them
- DO NOT perform root cause analysis unless the user explicitly asks for them
- DO NOT propose future enhancements unless the user explicitly asks for them
- DO NOT critique the implementation or identify problems
- DO NOT recommend refactoring, optimization, or architectural changes
- ONLY describe what exists, where it exists, how it works, and how components interact
- You are creating a technical map/documentation of the existing system

## Initial Setup

When this command is invoked, respond with:

```
I'm ready to research the project. Please provide your research question or area of interest, and I'll analyze it thoroughly by exploring relevant components and connections.
```

Then wait for the user's research query.

## Steps to follow after receiving the research query

1. **Read any directly mentioned files first:**
   - If the user mentions specific files (PRDs, docs, JSON), read them FULLY first
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: Read these files yourself in the main context before spawning any sub-tasks
   - This ensures you have full context before decomposing the research

2. **Determine research mode and decompose the question:**
   - Check whether `src/` exists and has application code
   - Break down the user's query into composable research areas
   - Take time to ultrathink about the underlying patterns, connections, and architectural implications the user might be seeking
   - Identify specific components, patterns, or concepts to investigate
   - Create a research plan using TodoWrite to track all subtasks
   - Consider which directories, files, or architectural patterns are relevant

2.5. **If the feature has relevant UI (PRD has a "Design Reference" section):**
   Before spawning sub-tasks, conduct a Design Reference Analysis:
   - Read the current state of the affected components (markup, classes, existing files)
   - Identify reusable components that already cover part of the expected design
   - Record the Figma node IDs listed in the PRD that create_plan will need to consult via MCP

   Add a `## Design Reference Analysis` section to the generated research document:
   - **Current State**: existing components, markup, classes in use
   - **Reusable Components**: which ones already exist and can be reused
   - **Figma Nodes to Consult**: node IDs that create_plan needs to query via MCP before planning the frontend

3. **Spawn parallel sub-agent tasks for comprehensive research:**
   - Create multiple Task agents to research different aspects concurrently

   **For spec/doc research (specs-only or mixed mode):**
   - Use the **Read** tool to read full spec files (`specs/foundation/`, `specs/prds/`)
   - Use **Grep/Glob** to find relevant sections across spec documents
   - Document what the specs define as scope, decisions, data models, and rules
   - Note version pins, stack decisions, and constraints declared in specs

   **For codebase research (codebase or mixed mode):**
   - Use the **Explore** agent to find WHERE files and components live
   - Use **Grep/Glob** tools to understand HOW specific code works (without critiquing it)
   - Use the **Explore** agent to find examples of existing patterns (without evaluating them)

   **IMPORTANT**: All agents are documentarians, not critics. They describe what exists without suggesting improvements or identifying issues.

   **For web research (only if user explicitly asks):**
   - Use the **web-search-researcher** agent for external documentation and resources
   - IF you use web-research agents, instruct them to return LINKS with their findings, and please INCLUDE those links in your final report

   The key is to use these agents intelligently:
   - Start with Explore/Glob/Read to find what exists
   - Then use Grep/Read on the most promising findings to document how they work
   - Run multiple agents in parallel when they're searching for different things
   - Remind agents they are documenting, not evaluating or improving

4. **Wait for all sub-agents to complete and synthesize findings:**
   - IMPORTANT: Wait for ALL sub-agent tasks to complete before proceeding
   - Compile all sub-agent results
   - Prioritize live codebase findings over specs when both exist for the same component
   - Connect findings across different components
   - Include specific file paths and line numbers for reference
   - Highlight patterns, connections, and design decisions
   - Answer the user's specific questions with concrete evidence

5. **Gather metadata for the research document:**
   - Get current date, branch and commit via git: `git branch --show-current` and `git rev-parse --short HEAD`
   - Filename: `specs/workflow/research/YYYY-MM-DD-[prd-ref-]description.md`
     - Format where:
       - `YYYY-MM-DD` is today's date
       - `prd-ref` is the PRD reference if applicable (e.g. `prd-00a`), omit otherwise
       - `description` is a brief kebab-case description of the research topic
     - Examples:
       - With PRD: `2026-03-12-prd-02a-projetos-fases-backend.md`
       - Without PRD: `2026-03-12-auth-flow.md`

6. **Generate research document:**
   - Use the metadata gathered in step 5
   - Structure the document with YAML frontmatter followed by content:
     ```markdown
     ---
     date: [Current date and time with timezone in ISO format]
     researcher: Claude
     git_commit: [Current commit hash]
     branch: [Current branch name]
     repository: [Repository name]
     topic: "[User's Question/Topic]"
     tags: [research, relevant-component-names]
     status: complete
     last_updated: [Current date in YYYY-MM-DD format]
     last_updated_by: Claude
     ---

     # Research: [User's Question/Topic]

     **Date**: [Current date and time with timezone from step 5]
     **Git Commit**: [Current commit hash from step 5]
     **Branch**: [Current branch name from step 5]
     **Repository**: [Repository name]
     **Research Mode**: [Specs-only | Codebase | Mixed]

     ## Research Question
     [Original user query]

     ## Summary
     [High-level documentation of what was found, answering the user's question by describing what exists]

     ## Detailed Findings

     ### [Component/Area 1]
     - Description of what exists (`file.ext:line`)
     - How it connects to other components
     - Current implementation or spec-defined details (without evaluation)

     ### [Component/Area 2]
     ...

     ## References
     - `path/to/file.ts:123` — Description of what's there
     - `specs/prds/prd-01.md:45` — Description of the spec section

     ## Design & Decisions
     [Current patterns, conventions, stack decisions, and design found in specs or codebase]

     ## Open Questions
     [Any areas that need further investigation]
     ```

7. **Add GitHub permalinks (if applicable):**
   - Check if on main branch or if commit is pushed: `git branch --show-current` and `git status`
   - If on main or pushed, generate GitHub permalinks:
     - Get repo info: `gh repo view --json owner,name`
     - Create permalinks: `https://github.com/{owner}/{repo}/blob/{commit}/{file}#L{line}`
   - Replace local file references with permalinks in the document

8. **Present findings:**
   - Present a concise summary of findings to the user
   - Include key file references for easy navigation
   - Ask if they have follow-up questions or need clarification

9. **Handle follow-up questions:**
   - If the user has follow-up questions, append to the same research document
   - Update the frontmatter fields `last_updated` and `last_updated_by` to reflect the update
   - Add `last_updated_note: "Added follow-up research for [brief description]"` to frontmatter
   - Add a new section: `## Follow-up Research [timestamp]`
   - Spawn new sub-agents as needed for additional investigation
   - Continue updating the document

## Important notes

- Always use parallel Task agents to maximize efficiency and minimize context usage
- Always run fresh research — never rely solely on existing research documents
- Focus on finding concrete file paths and line numbers (or spec section references) for developer reference
- Research documents should be self-contained with all necessary context
- Each sub-agent prompt should be specific and focused on read-only documentation operations
- Document cross-component connections and how systems interact
- Include temporal context (when the research was conducted)
- Link to GitHub when possible for permanent references
- Keep the main agent focused on synthesis, not deep file reading
- Have sub-agents document examples and usage patterns as they exist
- **CRITICAL**: You and all sub-agents are documentarians, not evaluators
- **REMEMBER**: Document what IS (code) or what IS DEFINED (specs), not what SHOULD BE
- **NO RECOMMENDATIONS**: Only describe the current state of the project
- **File reading**: Always read mentioned files FULLY (no limit/offset) before spawning sub-tasks
- **Critical ordering**: Follow the numbered steps exactly
  - ALWAYS read mentioned files first before spawning sub-tasks (step 1)
  - ALWAYS determine research mode before spawning sub-tasks (step 2)
  - ALWAYS wait for all sub-agents to complete before synthesizing (step 4)
  - ALWAYS gather metadata before writing the document (step 5 before step 6)
  - NEVER write the research document with placeholder values
- **Frontmatter consistency**:
  - Always include frontmatter at the beginning of research documents
  - Keep frontmatter fields consistent across all research documents
  - Update frontmatter when adding follow-up research
  - Use snake_case for multi-word field names (e.g., `last_updated`, `git_commit`)
  - Tags should be relevant to the research topic and components studied
