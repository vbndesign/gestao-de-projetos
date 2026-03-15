---
project: Gestao de projetos
author: Vinicius Bispo
type: design system
document: colors
version: 1.0
---

# Color System Context

Project: Gestao de Projetos
Stack: Next.js + Tailwind + shadcn + CVA

This document defines the color system used in the project design system and provides the source-of-truth structure for color token generation.

The goal is to define a consistent color foundation that can be consumed by:
- Figma Variables
- CSS custom properties
- Tailwind adapters
- React components
- Design system documentation

The source of truth for color tokens is the repository.

Figma is a consumer of these tokens.

---

# Design Principles

The color system prioritizes:
- clear semantic meaning
- stable naming independent of framework
- explicit primitive palettes
- reuse through global semantic families before component-specific values
- compatibility with future parsers and adapters
- support for future auxiliary palettes

The design system owns its own color language.

Framework-specific naming must be handled by adapters, not by the token source.

---

# Primitive Color Palettes

Primitive colors are the raw palettes of the system.

They must use the exact hexadecimal values defined by the design source.

No color value should be inferred, interpolated, or calculated.

## Common

transparent: #00000000

## Brand

900: #332250
800: #3C2861
700: #4E3382
600: #6B43B8
500: #8955F1
400: #A779F5
300: #C9A9FA
200: #E1CDFD
100: #F0E6FE
50: #F5F2FA

## Neutral

900: #171617
800: #262627
700: #3F3E42
600: #514F54
500: #807D85
400: #918E96
300: #BEBCC0
200: #D9D8DB
100: #ECEBED
50: #F5F5F6
0: #FFFFFF

## Success

800: #226B34
700: #249746
500: #22C55E
300: #96DF9F
100: #D9F3DB

## Warning

800: #744D15
700: #BC7A14
500: #F59E0B
300: #FFC781
100: #FFE3C0

## Danger

800: #94312D
700: #CA3C3B
500: #EF4444
300: #FE8F82
100: #FFDAD4

## Info

800: #2F5297
700: #3465BC
500: #3B82F6
300: #92ACFA
100: #DDE3FE

---

# Semantic Layers

Color tokens follow a three-layer architecture.

Primitive tokens:
- raw hexadecimal values only

Global semantic tokens:
- reusable semantic aliases shared across the design system
- split into `family` and `role`

Component semantic tokens:
- tokens specialized for reusable components
- should prefer global semantic tokens over direct primitive references

---

# Global Semantic Families

The `family` layer standardizes reusable intensities for each palette.

This layer exists to prevent components from referencing primitive scales directly in most cases.

## Family

color.semantic.family.common.transparent

color.semantic.family.brand.subtle
color.semantic.family.brand.light
color.semantic.family.brand.soft
color.semantic.family.brand.pure
color.semantic.family.brand.strong

color.semantic.family.neutral.pure
color.semantic.family.neutral.subtle
color.semantic.family.neutral.soft
color.semantic.family.neutral.border
color.semantic.family.neutral.muted
color.semantic.family.neutral.medium
color.semantic.family.neutral.body
color.semantic.family.neutral.strong
color.semantic.family.neutral.inverse

color.semantic.family.success.light
color.semantic.family.success.soft
color.semantic.family.success.pure
color.semantic.family.success.strong

color.semantic.family.green.light
color.semantic.family.green.strong

color.semantic.family.warning.light
color.semantic.family.warning.soft
color.semantic.family.warning.pure
color.semantic.family.warning.strong

color.semantic.family.danger.light
color.semantic.family.danger.soft
color.semantic.family.danger.pure
color.semantic.family.danger.strong

color.semantic.family.red.light
color.semantic.family.red.strong

color.semantic.family.info.light
color.semantic.family.info.soft
color.semantic.family.info.pure
color.semantic.family.info.strong

color.semantic.family.indigo.light
color.semantic.family.indigo.strong

color.semantic.family.yellow.light
color.semantic.family.yellow.strong

color.semantic.family.pink.light
color.semantic.family.pink.strong

color.semantic.family.sky.light
color.semantic.family.sky.strong

The support families `indigo`, `yellow`, `pink`, and `sky` are semantic-level families.

They intentionally stay outside the primitive core palettes until they become broad enough to justify their own raw scales.

The `green` and `red` families are semantic aliases over `success` and `danger`.

They exist to support color-oriented component APIs without duplicating raw primitive palettes.

---

# Global Semantic Roles

Role tokens describe generic interface use and should preferably reference `family`.

## Background

color.semantic.bg.canvas
color.semantic.bg.surface
color.semantic.bg.subtle
color.semantic.bg.brand
color.semantic.bg.inverse

## Text

color.semantic.text.heading
color.semantic.text.body
color.semantic.text.muted
color.semantic.text.placeholder
color.semantic.text.disabled

## Border

color.semantic.border.default
color.semantic.border.subtle
color.semantic.border.strong
color.semantic.border.brand
color.semantic.border.focus
color.semantic.border.inverse

## Feedback

color.semantic.feedback.success.bg
color.semantic.feedback.success.surface
color.semantic.feedback.success.text
color.semantic.feedback.success.border

color.semantic.feedback.warning.bg
color.semantic.feedback.warning.surface
color.semantic.feedback.warning.text
color.semantic.feedback.warning.border

color.semantic.feedback.danger.bg
color.semantic.feedback.danger.surface
color.semantic.feedback.danger.text
color.semantic.feedback.danger.border

color.semantic.feedback.info.bg
color.semantic.feedback.info.surface
color.semantic.feedback.info.text
color.semantic.feedback.info.border

---

# Component Layer

The component layer defines colors for reusable UI patterns.

Component tokens should reference:
1. role tokens first
2. family tokens second
3. primitive tokens only as an exception

## Component State Guidance

Component tokens may be separated by state when the visual color changes between states.

Stateful color tokens are valid because they define the design contract, while CSS controls when the state is applied.

To prevent uncontrolled growth:
- only add a state when the color actually changes
- prefer canonical states such as `default`, `hover`, `active`, `disabled`, and `focus`
- do not duplicate state branches for components that do not need them

## Component Tokens

color.semantic.component.menuItem.default.bg
color.semantic.component.menuItem.default.icon
color.semantic.component.menuItem.default.text
color.semantic.component.menuItem.hover.bg
color.semantic.component.menuItem.hover.icon
color.semantic.component.menuItem.hover.text
color.semantic.component.menuItem.active.bg
color.semantic.component.menuItem.active.icon
color.semantic.component.menuItem.active.text

color.semantic.component.projectSummaryCard.bg
color.semantic.component.projectSummaryCard.title
color.semantic.component.projectSummaryCard.label

color.semantic.component.button.primary.default.bg
color.semantic.component.button.primary.default.text
color.semantic.component.button.primary.default.icon
color.semantic.component.button.primary.hover.bg
color.semantic.component.button.primary.hover.text
color.semantic.component.button.primary.hover.icon

color.semantic.component.button.primaryOutline.default.bg
color.semantic.component.button.primaryOutline.default.text
color.semantic.component.button.primaryOutline.default.icon
color.semantic.component.button.primaryOutline.default.border
color.semantic.component.button.primaryOutline.hover.bg
color.semantic.component.button.primaryOutline.hover.text
color.semantic.component.button.primaryOutline.hover.icon
color.semantic.component.button.primaryOutline.hover.border

color.semantic.component.badge.purple.bg
color.semantic.component.badge.purple.text
color.semantic.component.badge.indigo.bg
color.semantic.component.badge.indigo.text
color.semantic.component.badge.yellow.bg
color.semantic.component.badge.yellow.text
color.semantic.component.badge.pink.bg
color.semantic.component.badge.pink.text
color.semantic.component.badge.green.bg
color.semantic.component.badge.green.text
color.semantic.component.badge.sky.bg
color.semantic.component.badge.sky.text
color.semantic.component.badge.red.bg
color.semantic.component.badge.red.text

color.semantic.component.iconTile.purple.bg
color.semantic.component.iconTile.purple.icon
color.semantic.component.iconTile.indigo.bg
color.semantic.component.iconTile.indigo.icon
color.semantic.component.iconTile.yellow.bg
color.semantic.component.iconTile.yellow.icon
color.semantic.component.iconTile.pink.bg
color.semantic.component.iconTile.pink.icon
color.semantic.component.iconTile.green.bg
color.semantic.component.iconTile.green.icon
color.semantic.component.iconTile.sky.bg
color.semantic.component.iconTile.sky.icon
color.semantic.component.iconTile.red.bg
color.semantic.component.iconTile.red.icon

color.semantic.component.dataRow.header.bg
color.semantic.component.dataRow.header.text
color.semantic.component.dataRow.default.bg
color.semantic.component.dataRow.default.border
color.semantic.component.dataRow.default.title
color.semantic.component.dataRow.hover.bg
color.semantic.component.dataRow.hover.border
color.semantic.component.dataRow.hover.title
color.semantic.component.dataRow.actionIcon.default.bg
color.semantic.component.dataRow.actionIcon.default.icon
color.semantic.component.dataRow.actionIcon.hover.bg
color.semantic.component.dataRow.actionIcon.hover.icon

---

# JSON Token Structure

Expected token format:
specs/design-system/tokens/colors.json

Example:
```json
{
  "color": {
    "primitive": {
      "common": {
        "transparent": "#00000000"
      },
      "brand": {
        "900": "#332250",
        "800": "#3C2861",
        "700": "#4E3382",
        "600": "#6B43B8",
        "500": "#8955F1",
        "400": "#A779F5",
        "300": "#C9A9FA",
        "200": "#E1CDFD",
        "100": "#F0E6FE",
        "50": "#F5F2FA"
      },
      "neutral": {
        "900": "#171617",
        "800": "#262627",
        "700": "#3F3E42",
        "600": "#514F54",
        "500": "#807D85",
        "400": "#918E96",
        "300": "#BEBCC0",
        "200": "#D9D8DB",
        "100": "#ECEBED",
        "50": "#F5F5F6",
        "0": "#FFFFFF"
      },
      "success": {
        "800": "#226B34",
        "700": "#249746",
        "500": "#22C55E",
        "300": "#96DF9F",
        "100": "#D9F3DB"
      },
      "warning": {
        "800": "#744D15",
        "700": "#BC7A14",
        "500": "#F59E0B",
        "300": "#FFC781",
        "100": "#FFE3C0"
      },
      "danger": {
        "800": "#94312D",
        "700": "#CA3C3B",
        "500": "#EF4444",
        "300": "#FE8F82",
        "100": "#FFDAD4"
      },
      "info": {
        "800": "#2F5297",
        "700": "#3465BC",
        "500": "#3B82F6",
        "300": "#92ACFA",
        "100": "#DDE3FE"
      }
    },
    "semantic": {
      "family": {
        "common": {
          "transparent": "{color.primitive.common.transparent}"
        },
        "brand": {
          "subtle": "{color.primitive.brand.50}",
          "light": "{color.primitive.brand.100}",
          "soft": "{color.primitive.brand.200}",
          "pure": "{color.primitive.brand.500}",
          "strong": "{color.primitive.brand.600}"
        },
        "neutral": {
          "pure": "{color.primitive.neutral.0}",
          "subtle": "{color.primitive.neutral.50}",
          "soft": "{color.primitive.neutral.100}",
          "border": "{color.primitive.neutral.200}",
          "muted": "{color.primitive.neutral.300}",
          "medium": "{color.primitive.neutral.500}",
          "body": "{color.primitive.neutral.600}",
          "strong": "{color.primitive.neutral.700}",
          "inverse": "{color.primitive.neutral.900}"
        },
        "success": {
          "light": "{color.primitive.success.100}",
          "soft": "{color.primitive.success.300}",
          "pure": "{color.primitive.success.500}",
          "strong": "{color.primitive.success.800}"
        },
        "green": {
          "light": "{color.semantic.family.success.light}",
          "strong": "{color.semantic.family.success.strong}"
        },
        "warning": {
          "light": "{color.primitive.warning.100}",
          "soft": "{color.primitive.warning.300}",
          "pure": "{color.primitive.warning.500}",
          "strong": "{color.primitive.warning.800}"
        },
        "danger": {
          "light": "{color.primitive.danger.100}",
          "soft": "{color.primitive.danger.300}",
          "pure": "{color.primitive.danger.500}",
          "strong": "{color.primitive.danger.800}"
        },
        "red": {
          "light": "{color.semantic.family.danger.light}",
          "strong": "{color.semantic.family.danger.strong}"
        },
        "info": {
          "light": "{color.primitive.info.100}",
          "soft": "{color.primitive.info.300}",
          "pure": "{color.primitive.info.500}",
          "strong": "{color.primitive.info.800}"
        },
        "indigo": {
          "light": "#E6EAFE",
          "strong": "#485ECC"
        },
        "yellow": {
          "light": "#FFF8D5",
          "strong": "#998836"
        },
        "pink": {
          "light": "#FFD5F1",
          "strong": "#993678"
        },
        "sky": {
          "light": "#D5F1FF",
          "strong": "#367899"
        }
      },
      "bg": {
        "canvas": "{color.semantic.family.brand.subtle}",
        "surface": "{color.semantic.family.neutral.pure}",
        "subtle": "{color.semantic.family.neutral.soft}",
        "brand": "{color.semantic.family.brand.pure}",
        "inverse": "{color.semantic.family.neutral.inverse}"
      },
      "text": {
        "heading": "{color.semantic.family.neutral.strong}",
        "body": "{color.semantic.family.neutral.body}",
        "muted": "{color.semantic.family.neutral.medium}",
        "placeholder": "{color.semantic.family.neutral.muted}",
        "disabled": "{color.semantic.family.neutral.muted}"
      },
      "border": {
        "default": "{color.semantic.family.neutral.border}",
        "subtle": "{color.semantic.family.neutral.soft}",
        "strong": "{color.semantic.family.neutral.medium}",
        "brand": "{color.semantic.family.brand.pure}",
        "focus": "{color.semantic.family.brand.pure}",
        "inverse": "{color.semantic.family.neutral.strong}"
      },
      "feedback": {
        "success": {
          "bg": "{color.semantic.family.success.light}",
          "surface": "{color.semantic.family.success.soft}",
          "text": "{color.semantic.family.success.strong}",
          "border": "{color.semantic.family.success.pure}"
        },
        "warning": {
          "bg": "{color.semantic.family.warning.light}",
          "surface": "{color.semantic.family.warning.soft}",
          "text": "{color.semantic.family.warning.strong}",
          "border": "{color.semantic.family.warning.pure}"
        },
        "danger": {
          "bg": "{color.semantic.family.danger.light}",
          "surface": "{color.semantic.family.danger.soft}",
          "text": "{color.semantic.family.danger.strong}",
          "border": "{color.semantic.family.danger.pure}"
        },
        "info": {
          "bg": "{color.semantic.family.info.light}",
          "surface": "{color.semantic.family.info.soft}",
          "text": "{color.semantic.family.info.strong}",
          "border": "{color.semantic.family.info.pure}"
        }
      },
      "component": {
        "menuItem": {
          "default": {
            "bg": "{color.semantic.bg.surface}",
            "icon": "{color.semantic.family.brand.strong}",
            "text": "{color.semantic.text.body}"
          },
          "hover": {
            "bg": "{color.semantic.family.neutral.subtle}",
            "icon": "{color.semantic.family.brand.strong}",
            "text": "{color.semantic.text.body}"
          },
          "active": {
            "bg": "{color.semantic.family.brand.pure}",
            "icon": "{color.semantic.family.neutral.pure}",
            "text": "{color.semantic.family.neutral.pure}"
          }
        },
        "projectSummaryCard": {
          "bg": "{color.semantic.family.brand.light}",
          "title": "{color.semantic.family.brand.strong}",
          "label": "{color.semantic.text.muted}"
        },
        "button": {
          "primary": {
            "default": {
              "bg": "{color.semantic.bg.brand}",
              "text": "{color.semantic.family.neutral.pure}",
              "icon": "{color.semantic.family.neutral.pure}"
            },
            "hover": {
              "bg": "{color.semantic.family.brand.strong}",
              "text": "{color.semantic.family.neutral.pure}",
              "icon": "{color.semantic.family.neutral.pure}"
            }
          },
          "primaryOutline": {
            "default": {
              "bg": "{color.semantic.family.common.transparent}",
              "text": "{color.semantic.family.brand.pure}",
              "icon": "{color.semantic.family.brand.pure}",
              "border": "{color.semantic.border.brand}"
            },
            "hover": {
              "bg": "{color.semantic.family.brand.subtle}",
              "text": "{color.semantic.family.brand.strong}",
              "icon": "{color.semantic.family.brand.strong}",
              "border": "{color.semantic.family.brand.strong}"
            }
          }
        },
        "badge": {
          "purple": {
            "bg": "{color.semantic.family.brand.light}",
            "text": "{color.semantic.family.brand.pure}"
          },
          "indigo": {
            "bg": "{color.semantic.family.indigo.light}",
            "text": "{color.semantic.family.indigo.strong}"
          },
          "yellow": {
            "bg": "{color.semantic.family.yellow.light}",
            "text": "{color.semantic.family.yellow.strong}"
          },
          "pink": {
            "bg": "{color.semantic.family.pink.light}",
            "text": "{color.semantic.family.pink.strong}"
          },
          "green": {
            "bg": "{color.semantic.family.green.light}",
            "text": "{color.semantic.family.green.strong}"
          },
          "sky": {
            "bg": "{color.semantic.family.sky.light}",
            "text": "{color.semantic.family.sky.strong}"
          },
          "red": {
            "bg": "{color.semantic.family.red.light}",
            "text": "{color.semantic.family.red.strong}"
          }
        },
        "iconTile": {
          "purple": {
            "bg": "{color.semantic.family.brand.light}",
            "icon": "{color.semantic.family.brand.pure}"
          },
          "indigo": {
            "bg": "{color.semantic.family.indigo.light}",
            "icon": "{color.semantic.family.indigo.strong}"
          },
          "yellow": {
            "bg": "{color.semantic.family.yellow.light}",
            "icon": "{color.semantic.family.yellow.strong}"
          },
          "pink": {
            "bg": "{color.semantic.family.pink.light}",
            "icon": "{color.semantic.family.pink.strong}"
          },
          "green": {
            "bg": "{color.semantic.family.green.light}",
            "icon": "{color.semantic.family.green.strong}"
          },
          "sky": {
            "bg": "{color.semantic.family.sky.light}",
            "icon": "{color.semantic.family.sky.strong}"
          },
          "red": {
            "bg": "{color.semantic.family.red.light}",
            "icon": "{color.semantic.family.red.strong}"
          }
        },
        "dataRow": {
          "header": {
            "bg": "{color.semantic.family.brand.subtle}",
            "text": "{color.semantic.text.body}"
          },
          "default": {
            "bg": "{color.semantic.bg.surface}",
            "border": "{color.semantic.border.default}",
            "title": "{color.semantic.family.brand.strong}"
          },
          "hover": {
            "bg": "{color.semantic.family.brand.subtle}",
            "border": "{color.semantic.family.brand.strong}",
            "title": "{color.semantic.family.brand.strong}"
          },
          "actionIcon": {
            "default": {
              "bg": "{color.semantic.family.brand.light}",
              "icon": "{color.semantic.family.brand.strong}"
            },
            "hover": {
              "bg": "{color.semantic.family.brand.soft}",
              "icon": "{color.semantic.family.brand.strong}"
            }
          }
        }
      }
    }
  }
}
```

---

# Figma Mapping

Color tokens must be synced into two Figma Variable Collections:
- Primitives
- Semantic

Primitive variable naming:
- color/common/transparent
- color/brand/900
- color/neutral/0
- color/success/500

Semantic variable naming:
- color/family/brand/pure
- color/bg/canvas
- color/text/heading
- color/border/focus
- color/feedback/success/bg
- color/component/menuItem/active/bg
- color/component/button/primary/default/bg
- color/component/badge/purple/bg
- color/component/dataRow/actionIcon/hover/icon

---

# Color Styles in Figma

Color Styles are not required for the canonical implementation of this system.

The color system should be variables-first.

Variables are the required artifact because they are the best fit for:
- repository source of truth
- Figma sync
- parser-based web adapters
- future automation via plugin, MCP, or API

Color Styles may be generated later as a convenience layer, but they are not the source of truth and should not replace variables.

---

# Adapter Guidance

Web adapters may translate semantic color tokens into framework-specific names such as:
- Tailwind theme values
- shadcn CSS variables
- custom CSS variables

This translation layer must live outside the token source.

---

# Future Growth

The primitive layer may grow with auxiliary palettes such as:
- teal
- pink
- indigo
- orange
- cyan

New primitive palettes should only become primitive families when they represent broad raw scales in the system.

Smaller reusable tones may live in `semantic.family` until they justify promotion to `primitive`.

---

# Codex Task

The Codex agent must:
1. Generate specs/design-system/tokens/colors.json using the structure above.
2. Preserve exact hexadecimal values from the approved design source.
3. Keep global semantic roles and component tokens dependent on semantic families whenever possible.
4. Treat the repository token JSON as the source of truth for Figma and code adapters.
