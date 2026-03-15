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
- compatibility with future parsers and adapters
- support for future auxiliary palettes

The design system owns its own color language.

Framework-specific naming must be handled by adapters, not by the token source.

---

# Primitive Color Palettes

Primitive colors are the raw palettes of the system.

They must use the exact hexadecimal values defined by the design source.

No color value should be inferred, interpolated, or calculated.

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

# Semantic Color Roles

Semantic tokens define how colors are used in the interface.

They must reference primitive tokens.

Semantic tokens are intentionally independent from Tailwind or shadcn naming.

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

# Token Architecture

Color tokens follow a two-layer architecture.

Primitive tokens:
color.primitive.brand.*
color.primitive.neutral.*
color.primitive.success.*
color.primitive.warning.*
color.primitive.danger.*
color.primitive.info.*

Semantic tokens:
color.semantic.bg.*
color.semantic.text.*
color.semantic.border.*
color.semantic.feedback.*

Semantic tokens reference primitive tokens.

Example:
color.semantic.bg.canvas
color.primitive.neutral.0

---

# JSON Token Structure

Expected token format:
specs/design-system/tokens/colors.json

Example:
```json
{
  "color": {
    "primitive": {
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
      "bg": {
        "canvas": "{color.primitive.brand.50}",
        "surface": "{color.primitive.neutral.0}",
        "subtle": "{color.primitive.neutral.50}",
        "brand": "{color.primitive.brand.500}",
        "inverse": "{color.primitive.neutral.900}"
      },
      "text": {
        "heading": "{color.primitive.neutral.700}",
        "body": "{color.primitive.neutral.600}",
        "muted": "{color.primitive.neutral.500}",
        "placeholder": "{color.primitive.neutral.300}",
        "disabled": "{color.primitive.neutral.300}"
      },
      "border": {
        "default": "{color.primitive.neutral.200}",
        "subtle": "{color.primitive.neutral.100}",
        "strong": "{color.primitive.neutral.400}",
        "brand": "{color.primitive.brand.500}",
        "focus": "{color.primitive.brand.500}",
        "inverse": "{color.primitive.neutral.700}"
      },
      "feedback": {
        "success": {
          "bg": "{color.primitive.success.100}",
          "surface": "{color.primitive.success.300}",
          "text": "{color.primitive.success.800}",
          "border": "{color.primitive.success.500}"
        },
        "warning": {
          "bg": "{color.primitive.warning.100}",
          "surface": "{color.primitive.warning.300}",
          "text": "{color.primitive.warning.800}",
          "border": "{color.primitive.warning.500}"
        },
        "danger": {
          "bg": "{color.primitive.danger.100}",
          "surface": "{color.primitive.danger.300}",
          "text": "{color.primitive.danger.800}",
          "border": "{color.primitive.danger.500}"
        },
        "info": {
          "bg": "{color.primitive.info.100}",
          "surface": "{color.primitive.info.300}",
          "text": "{color.primitive.info.800}",
          "border": "{color.primitive.info.500}"
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
- color/brand/900
- color/neutral/0
- color/success/500

Semantic variable naming:
- color/bg/canvas
- color/text/heading
- color/border/focus
- color/feedback/success/bg

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

New primitive palettes should only become semantic tokens when they represent stable usage roles in the product.

---

# Codex Task

The Codex agent must:
1. Generate specs/design-system/tokens/colors.json using the structure above.
2. Preserve exact hexadecimal values from the approved design source.
3. Keep semantic tokens as aliases to primitive tokens.
4. Treat the repository token JSON as the source of truth for Figma and code adapters.
