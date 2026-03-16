# Design System Figma Naming

This document defines the naming conventions for Figma layers, structural wrappers, and reusable component anatomy.

It complements the token specs and should be used when organizing the component library in Figma.

---

# Principles

- prefer reusable names over page-specific names when the anatomy is shared
- preserve canonical names of nested components such as `Icon Tile`, `Badge`, `Button Icon`, and `button`
- do not mirror React props or implementation details directly in the layer tree
- only create a new naming namespace when the visual or structural contract actually diverges

---

# Data Rows

`Data Row` and `Data Row Projects` currently share the same visual contract.

They should keep the same internal structural naming while this contract remains equivalent.

Recommended group naming:
- `primaryInfo`: main content block with leading icon and text content
- `textContent`: internal stack with title and description
- `statusSlot`: reserved area for badge or status content
- `actionsGroup`: grouped row actions

Apply this naming in the current library:
- `Data Row` `default` and `hover`
  - phase info container -> `primaryInfo`
  - inner title/description frame -> `textContent`
  - badge container -> `statusSlot`
  - actions container -> `actionsGroup`
- `Data Row Projects` `default` and `hover`
  - project info container -> `primaryInfo`
  - inner title/description frame -> `textContent`

Rules:
- preserve nested component names such as `Icon Tile`, `Badge`, and `Button Icon`
- do not create a separate naming or token namespace for `Data Row Projects` unless the visual contract diverges

Triggers for future separation:
- a distinct header treatment
- extra row states such as `selected`, `archived`, or `warning`
- different title, border, background, badge, or action color mappings

---

# Page And List Containers

Page-level and list-level wrappers should follow reusable structural naming.

Recommended names:
- `pageHeader`: main page header container
- `breadcrumb`: navigation trail inside the page header when present
- `titleBlock`: grouped textual content of the page header
- `title`: main page title
- `subtitle`: secondary textual context below the title
- `pageToolbar`: single container for page actions and filters
- `listContainer`: outer container for the list block
- `listHeader`: header row or header container of the list
- `rowsList`: container that groups repeated row instances

Recommended `pageHeader` anatomy:

```text
pageHeader
 ├ breadcrumb        (optional)
 ├ titleBlock
 │ ├ title
 │ └ subtitle        (optional)
 └ pageToolbar       (optional)
```

Apply this naming in the current library:
- simple page header
  - `pageHeader`
    - `title`
    - `pageToolbar`

Rules:
- keep this naming reusable instead of project-specific while the anatomy remains generic
- preserve nested component names such as `button` and `dataRowProjects`
- do not split `pageToolbar` into `actionsGroup` and `filtersGroup` in the current phase
- do not leave multiple text layers loose directly inside `pageHeader` when `titleBlock` is present
- use `subtitle` as the default name for a second supporting line such as company or contextual label

Triggers for future refinement:
- a toolbar that becomes structurally complex enough to need internal grouping
- list containers that stop following a generic header plus rows structure
- domain-specific wrappers that are no longer reusable across screens
- a page header that requires parallel contextual blocks beyond `titleBlock`
