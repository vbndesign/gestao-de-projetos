---
project: Gestão de projetos
author: Vinicius Bispo
document: design system
version: 1.0
---

# Typography System Context

Project: Gestão de Projetos
Stack: Next.js + Tailwind + shadcn + CVA
Font: Inter

This document defines the typographic system used in the project design system and provides context for token generation and Figma variable synchronization.

The goal is to define a consistent typographic scale aligned with the spacing grid and generate tokens that can be consumed by:
- Figma Variables
- Tailwind configuration
- React components
- Design system documentation

The source of truth for typography tokens is the repository.

Figma is a consumer of these tokens.

---

# Design Principles

The typography system prioritizes:
- readability in UI interfaces
- clear visual hierarchy
- consistency with spacing grid
- minimal typographic complexity
- compatibility with dark mode

The system is optimized for dashboards and product interfaces rather than editorial typography.

---

# Font Family

Primary font family:

Inter

Fallbacks:
system-ui  
sans-serif

Token:
font.family.primary

---

# Typographic Scale

The scale is derived from a modular scale approach using Minor Third (1.2) as reference.

Base font size:
16px

Ratio reference:
Minor Third (1.2)

Font sizes do not need to be strict multiples of 4px.

Values are rounded and curated to preserve readability, hierarchy, and consistency across the interface.

---

# Baseline Grid

Spacing system base unit:
4px

Typographic baseline grid:
4px

All line heights must be multiples of the baseline grid to maintain vertical rhythm.

---

# Spacing Scale

Spacing tokens available in the system:
4  
8  
12  
16  
24  
32  
40  
48  
56  
64  
72  
80  
96  
120

Typography must align visually with this spacing system.

This applies primarily to line height and vertical rhythm, not as a hard constraint for font-size values.

---

# Typography Tokens

## Font Sizes

sm: 14px  
base: 16px  
lg: 18px  
xl: 20px  

h6: 20px  
h5: 24px  
h4: 28px  
h3: 32px  
h2: 40px  
h1: 48px

---

## Line Heights

sm: 24px  
base: 24px  
lg: 28px  
xl: 32px  

h6: 28px  
h5: 32px  
h4: 36px  
h3: 40px  
h2: 48px  
h1: 56px

All line heights are multiples of 4px.

---

## Font Weights

regular: 400  
semibold: 600  
bold: 700

Rules:
- Regular is used for body text.
- Semibold is used for headings and labels.
- Bold is used sparingly for emphasis.

---

# Semantic Text Roles

Typography also defines semantic roles used across the interface.

Body text:
text.body.sm  
text.body.md  
text.body.lg

Heading text:
text.heading.h1  
text.heading.h2  
text.heading.h3  
text.heading.h4  
text.heading.h5  
text.heading.h6

---

# Token Architecture

Typography tokens follow a two-layer architecture.

Primitive tokens:
font.family.primary  
font.size.*  
font.lineHeight.*  
font.weight.*

Semantic tokens:
text.body.*  
text.heading.*

Semantic tokens reference primitive tokens.

Example:
text.heading.h1  
font.size.h1  
font.lineHeight.h1  
font.weight.semibold

These semantic tokens represent the canonical typography presets of the system. In Figma, they must exist as semantic variables and also drive the generated Text Styles.

---

# JSON Token Structure

Expected token format:
specs/design-system/tokens/typography.json

Example:
```json
{
  "font": {
    "family": {
      "primary": "Inter"
    },
    "size": {
      "sm": 14,
      "base": 16,
      "lg": 18,
      "xl": 20,
      "h6": 20,
      "h5": 24,
      "h4": 28,
      "h3": 32,
      "h2": 40,
      "h1": 48
    },
    "lineHeight": {
      "sm": 24,
      "base": 24,
      "lg": 28,
      "xl": 32,
      "h6": 28,
      "h5": 32,
      "h4": 36,
      "h3": 40,
      "h2": 48,
      "h1": 56
    },
    "weight": {
      "regular": 400,
      "semibold": 600,
      "bold": 700
    }
  },
  "text": {
    "body": {
      "sm": {
        "size": "{font.size.sm}",
        "lineHeight": "{font.lineHeight.sm}",
        "weight": "{font.weight.regular}"
      },
      "md": {
        "size": "{font.size.base}",
        "lineHeight": "{font.lineHeight.base}",
        "weight": "{font.weight.regular}"
      },
      "lg": {
        "size": "{font.size.lg}",
        "lineHeight": "{font.lineHeight.lg}",
        "weight": "{font.weight.regular}"
      }
    },
    "heading": {
      "h1": {
        "size": "{font.size.h1}",
        "lineHeight": "{font.lineHeight.h1}",
        "weight": "{font.weight.semibold}"
      }
    }
  }
}
```

# Figma Variable Mapping

Variables must be generated into the following collections.

Collection:
Primitives

Variables:
font/family/primary

font/size/sm  
font/size/base  
font/size/lg  
font/size/xl  
font/size/h6  
font/size/h5  
font/size/h4  
font/size/h3  
font/size/h2  
font/size/h1

font/lineHeight/sm  
font/lineHeight/base  
font/lineHeight/lg  
font/lineHeight/xl  
font/lineHeight/h6  
font/lineHeight/h5  
font/lineHeight/h4  
font/lineHeight/h3  
font/lineHeight/h2  
font/lineHeight/h1

font/weight/regular  
font/weight/semibold  
font/weight/bold

Collection:
Semantic

Variables:
text/body/sm/size  
text/body/sm/lineHeight  
text/body/sm/weight

text/body/md/size  
text/body/md/lineHeight  
text/body/md/weight

text/body/lg/size  
text/body/lg/lineHeight  
text/body/lg/weight

text/heading/h1/size  
text/heading/h1/lineHeight  
text/heading/h1/weight

text/heading/h2/size  
text/heading/h2/lineHeight  
text/heading/h2/weight

text/heading/h3/size  
text/heading/h3/lineHeight  
text/heading/h3/weight

text/heading/h4/size  
text/heading/h4/lineHeight  
text/heading/h4/weight

text/heading/h5/size  
text/heading/h5/lineHeight  
text/heading/h5/weight

text/heading/h6/size  
text/heading/h6/lineHeight  
text/heading/h6/weight

Semantic variables must alias the primitive variables instead of duplicating raw values.

The semantic layer should not duplicate `font-family`. Text Styles must use the primitive `font/family/primary` variable directly.

---

# Text Styles in Figma

Text Styles should be generated from the typography variables above.

They must bind:
- `font-family` from `font/family/primary`
- `font-size` from the semantic `size` variable
- `line-height` from the semantic `lineHeight` variable
- `font-weight` from the semantic `weight` variable

Generated style names:
Typography/Heading/H1  
Typography/Heading/H2  
Typography/Heading/H3  
Typography/Heading/H4  
Typography/Heading/H5  
Typography/Heading/H6

Typography/Body/Large  
Typography/Body/Default  
Typography/Body/Small

---

# Codex Task

The Codex agent must:
1. Generate `specs/design-system/tokens/typography.json`
2. Validate the token structure
3. Create a script to export tokens into Figma variables
4. Ensure tokens remain aligned with spacing grid
5. Prevent creation of arbitrary font sizes or line heights

Constraints:
- All line heights must be multiples of 4px.
- No new font weights should be created without explicit approval.
- Font sizes must follow the defined scale.

---

# Future Extensions

Possible future additions:
- responsive typography tokens
- fluid typography
- component-specific typography
- localization adjustments


---

# Estrutura sugerida da pasta no projeto
specs/design-system/foundations/design-system-typography.md

