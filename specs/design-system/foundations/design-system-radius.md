# Design System — Border Radius

## Princípio

Border radius usa **duas camadas**: primitiva (escala) + semântica (componentes). A camada semântica permite mudança de linguagem visual global — ex: "marca ficou mais arredondada" → um ponto de mudança, todos os componentes atualizam.

> **Nota:** Os valores não seguem a grid de 4px do spacing. Border radius é propriedade visual, não de layout. 6px (`md`) é um valor intencional, comum em design systems consagrados.

---

## Escala Primitiva

| Token | CSS Var | Valor | Uso típico |
|---|---|---|---|
| `radius.primitive.none` | `--ds-radius-primitive-none` | 0px | Bordas retas |
| `radius.primitive.xs` | `--ds-radius-primitive-xs` | 2px | Decorativo sutil |
| `radius.primitive.sm` | `--ds-radius-primitive-sm` | 4px | Inputs, tags |
| `radius.primitive.md` | `--ds-radius-primitive-md` | 6px | Botões, padrão UI |
| `radius.primitive.lg` | `--ds-radius-primitive-lg` | 8px | Cards, painéis |
| `radius.primitive.xl` | `--ds-radius-primitive-xl` | 16px | Modais, containers |
| `radius.primitive.full` | `--ds-radius-primitive-full` | 9999px | Pills, badges |

---

## Camada Semântica

| Token | CSS Var | Primitivo | Valor |
|---|---|---|---|
| `radius.semantic.button` | `--ds-radius-semantic-button` | md | 6px |
| `radius.semantic.input` | `--ds-radius-semantic-input` | sm | 4px |
| `radius.semantic.card` | `--ds-radius-semantic-card` | lg | 8px |
| `radius.semantic.badge` | `--ds-radius-semantic-badge` | full | 9999px |
| `radius.semantic.dialog` | `--ds-radius-semantic-dialog` | xl | 16px |
| `radius.semantic.tag` | `--ds-radius-semantic-tag` | sm | 4px |
| `radius.semantic.avatar` | `--ds-radius-semantic-avatar` | full | 9999px |
| `radius.semantic.tooltip` | `--ds-radius-semantic-tooltip` | xs | 2px |

---

## Uso em componentes

Preferir tokens semânticos em componentes específicos, primitivos quando não há semântico adequado:

```css
/* Preferido — semântico */
.button { border-radius: var(--ds-radius-semantic-button); }
.card   { border-radius: var(--ds-radius-semantic-card); }

/* Aceitável — primitivo direto */
.divider { border-radius: var(--ds-radius-primitive-none); }
```

---

## Integração com shadcn/ui

Os tokens DS substituem o sistema calc-based do shadcn em `globals.css`:

| shadcn var | DS var | Valor |
|---|---|---|
| `--radius-sm` | `--ds-radius-primitive-sm` | 4px |
| `--radius-md` | `--ds-radius-primitive-md` | 6px |
| `--radius-lg` | `--ds-radius-primitive-lg` | 8px |
| `--radius-xl` | `--ds-radius-primitive-xl` | 16px |

A var `--radius: 0.625rem` é mantida como fallback para componentes shadcn que a referenciam diretamente.

---

## Figma — Coleções de variáveis

| Coleção | Tokens |
|---|---|
| `Primitives/Radius` | none, xs, sm, md, lg, xl, full |
| `Semantic/Radius` | button, input, card, badge, dialog, tag, avatar, tooltip |

---

## Fonte da verdade

`specs/design-system/tokens/radius.json` → gerado por `generate-css-tokens.mjs` → `src/app/design-system-tokens.css`

Nunca editar o CSS gerado à mão.
