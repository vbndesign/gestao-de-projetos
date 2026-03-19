---
description: Implement PRDs directly — phase by phase with Figma visual validation. Use for visual refactors, component alignment, and small features with no new backend.
---

# Design Implementation

You are tasked with implementing a PRD directly — without a separate plan file. This prompt is designed for PRDs where the specification is complete and the delta is clear: visual refactors, component alignment to Figma, and small features with no new schema or actions.

## When to Use This vs. `03_implement_plan`

```
Use this prompt when:
  ✓ PRD has only "Modify" entries (no new schema, migrations, or actions)
  ✓ It's a visual refactor or component alignment
  ✓ Figma nodes are already identified in the PRD
  ✓ The delta is clear — no research phase needed

Use 01_research + 02_create_plan + 03_implement_plan when:
  ✗ PRD includes schema migrations or new Server Actions
  ✗ Feature involves cross-entity business logic (services)
  ✗ The delta is unclear and requires research before planning
  ✗ Phases have hard dependencies that need a formal plan
```

---

## Getting Started

When invoked with a PRD path:

1. **Read the PRD completely** — never use limit/offset, you need the full file
2. **Read all files listed in "Arquivos > Modificar"** — understand the current state before touching anything
3. **Derive the phase list** from the PRD (see Phase Detection below)
4. **Present the phase list** to the user before starting:

```
I've read PRD-XX. Here's the execution plan:

Phase 0 (if applicable): [Query/data adjustments]
Phase 1: [ComponentName] — [Figma node or "no Figma node"]
Phase 2: [ComponentName] — [Figma node or "no Figma node"]
...
Phase N: [Final composition / build verification]

Ready to start with Phase 0. Should I proceed?
```

Wait for user confirmation before executing any phase.

---

## Phase Detection

Derive phases from the PRD in this order:

1. **Phase 0 — Data adjustments** (if "Ajuste de query" or similar section exists): query changes, type additions. No Figma node. Verified with `pnpm build`.

2. **One phase per component** listed in "Arquivos > Modificar" — in dependency order (primitives before composites, L1 before L2 before L3).

3. **Final phase — Composition** (if a screen-level component composes multiple updated components): integrate everything, run full build.

**Figma node assignment:** For each phase, check the PRD's "Design Reference" table. If the component has a mapped node, that phase uses Figma MCP. If not (e.g., a query file), skip Figma and go straight to build verification.

---

## Execution Loop

For each phase, follow this loop exactly:

### For phases WITH a Figma node:

1. **Read the current file** completely
2. **Call `get_design_context`** with the component's `nodeId` and `fileKey` from the PRD
3. **Implement** the changes — adapt the Figma reference to the project's DS tokens, patterns, and conventions (never copy raw hex or absolute positioning from Figma output)
4. **Call `get_screenshot`** with the same `nodeId` and `fileKey` to capture the design
5. **Compare visually** — describe the alignment: what matches, what still differs
6. **Adjust** if there are discrepancies (spacing, tokens, states)
7. **Pause** with the Phase Report (see format below)

### For phases WITHOUT a Figma node:

1. **Read the current file** completely
2. **Implement** the changes
3. **Run `pnpm build`** to verify no type errors
4. **Pause** with the Phase Report

---

## Phase Report Format

After completing a phase, always report in this format:

```
---
Phase [N] Complete — [ComponentName]

Changes:
- [What was changed, file:line reference]
- [...]

Visual alignment: [✓ Aligned | △ Minor deltas — described below | ✗ Needs adjustment]
[If △ or ✗: describe the specific issue]

Build: [✓ Passing | ✗ Errors — listed below]

Screenshot: [attached via get_screenshot if applicable]

Next: Phase [N+1] — [ComponentName]
Waiting for your confirmation to proceed (or let me know if adjustments are needed).
---
```

---

## After Phase Approval

Once the user confirms a phase is good:

1. **Commit the changes** before moving to the next phase:
   ```bash
   git add [changed files]
   git commit -m "feat(visual): align [ComponentName] to Figma — PRD-XX"
   ```
   Use the PRD number from the file name (e.g., PRD-05). Use `refactor(visual):` if it's a pure visual refactor with no new behavior.

2. **Proceed to the next phase** without re-reading the PRD (you already have context).

> Commits happen **after user approval**, never automatically. This ensures each component has its own commit and rollback is easy.

---

## Continuation and Controls

The user can respond with:

- **"proceed" / "ok" / "continua"** → commit + start next phase
- **"adjust: [feedback]"** → make the described adjustment, re-validate, re-report (do NOT commit yet)
- **"skip"** → commit as-is and move to next phase
- **"stop"** → stop after committing the current phase; do not continue

If the user says "proceed with all phases" or similar at the start, skip the pause between phases and stop only after the final build verification.

---

## Rules

- **Figma-first for UI** — never start implementing a visual component before calling `get_design_context`
- **One phase at a time** — never implement multiple components in parallel
- **Full file reads** — always read the current file completely before editing; never edit blind
- **DS tokens only** — no raw hex literals, no `text-gray-*`, no arbitrary spacing outside the DS scale
- **No plan file** — do not create anything in `specs/workflow/plans/`; the PRD is the plan
- **No scope creep** — if you notice something outside the PRD's scope, mention it in the report but don't implement it

---

## Example Invocation

```
@specs/workflow/prompts/04_design_implementation.md specs/prds/prd-05-visual-projetos.md
```

Or with explicit instruction to run all phases:

```
@specs/workflow/prompts/04_design_implementation.md specs/prds/prd-05-visual-projetos.md — run all phases
```
