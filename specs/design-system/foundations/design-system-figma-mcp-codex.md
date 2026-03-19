# Figma MCP in Codex

This document defines the official Figma MCP workflow for Codex in this project.

It exists to standardize how the team brings Figma screens and components into Codex as implementation context.

---

# Official Setup

Use the official remote Figma MCP server in Codex.

Current global configuration:

```toml
[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
```

Rules:
- keep this configuration global in Codex unless there is a strong reason to isolate it per workspace
- do not add `figma-console-mcp` for Codex
- do not add a personal access token, desktop bridge plugin, or Claude-specific setup steps for Codex
- treat the Codex Figma integration as link-based by default

Validated state on 2026-03-18:
- the `figma` MCP server is available in Codex
- `whoami` succeeds for the authenticated Figma user
- the project can rely on the official Codex + Figma integration without extra repo setup

---

# Operating Workflow

Use this flow whenever a screen or component from Figma is needed as implementation context.

1. Copy a Figma link that points to a specific frame, component, or node.
2. Provide that link in the Codex prompt.
3. Prefer `get_design_context` as the primary MCP tool.
4. Use `get_metadata` when the layer tree or node structure matters.
5. Use `get_screenshot` when visual comparison is needed.
6. Use `get_variable_defs` when token or variable inspection is needed.
7. Use Code Connect tools only after the component mapping work exists.

Tool priority:
- `get_design_context`: primary tool for implementation and refinement
- `get_metadata`: structural inspection
- `get_screenshot`: visual confirmation
- `get_variable_defs`: design token and variable inspection
- `get_code_connect_map` / `get_code_connect_suggestions`: only useful after Code Connect is set up

---

# Input Requirements

Preferred input:
- a Figma Design link with `node-id`

Examples of good input:
- a frame URL for a screen
- a component URL for a reusable library component
- a specific variant URL when state matters

Avoid:
- vague references such as "use the button from Figma" without a link
- file-only links when the target node is ambiguous
- assuming a public link is enough for MCP access

Important:
- the MCP server can only access files that the authenticated Figma user can actually view
- if a file belongs to another workspace or team, access still depends on that user having permission there

---

# Permissions And Troubleshooting

If a tool returns `This figma file could not be accessed`:

1. Confirm the authenticated user with `whoami`.
2. Confirm the file belongs to a plan/team that this user can access.
3. Confirm the link is a valid Figma Design file and includes the correct `node-id`.
4. Retry with a link from a file already accessible to the authenticated user.

Observed on 2026-03-18:
- a real Figma link found in local notes failed in `get_design_context`, `get_screenshot`, and `get_metadata`
- this confirmed that Codex connectivity was healthy, but the referenced file was not accessible to the authenticated account via MCP

Interpretation:
- connection/authentication failure and file-permission failure are different problems
- in this project, the connection is working; inaccessible files should be treated as permission issues unless proven otherwise

---

# Code Connect Boundary

MCP connection and Code Connect are separate concerns.

What MCP solves now:
- screen and component context from Figma
- screenshots, metadata, and variables
- implementation guidance from a linked node

What still depends on Code Connect:
- mapping Figma components to real source files in this repository
- reusing the exact component references in MCP output
- turning design context into code that points to existing project components automatically

For this repository:
- use MCP immediately for reference and validation
- treat Code Connect as the next stage of design system integration
- align future mapping work with `specs/prds/prd-ds-frontend-implementation.md`