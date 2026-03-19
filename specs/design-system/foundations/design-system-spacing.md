# Design System — Spacing

## Princípio

Espaçamento usa **apenas camada primitiva** — a escala numérica é o sistema. Camadas semânticas de espaçamento criam abstrações parciais sem ganho real, pois componentes combinam múltiplos valores simultaneamente (ex: gap-8, padding-16, margin-24).

---

## Escala

| Token | CSS Var | Valor |
|---|---|---|
| `spacing.4` | `--ds-spacing-4` | 4px |
| `spacing.8` | `--ds-spacing-8` | 8px |
| `spacing.12` | `--ds-spacing-12` | 12px |
| `spacing.16` | `--ds-spacing-16` | 16px |
| `spacing.24` | `--ds-spacing-24` | 24px |
| `spacing.32` | `--ds-spacing-32` | 32px |
| `spacing.40` | `--ds-spacing-40` | 40px |
| `spacing.48` | `--ds-spacing-48` | 48px |
| `spacing.56` | `--ds-spacing-56` | 56px |
| `spacing.64` | `--ds-spacing-64` | 64px |
| `spacing.72` | `--ds-spacing-72` | 72px |
| `spacing.80` | `--ds-spacing-80` | 80px |
| `spacing.96` | `--ds-spacing-96` | 96px |
| `spacing.120` | `--ds-spacing-120` | 120px |

---

## Uso em componentes

As CSS vars ficam disponíveis via `globals.css` como `--spacing-ds-*`:

```css
.my-component {
  padding: var(--ds-spacing-16);
  gap: var(--ds-spacing-8);
}
```

---

## Figma — Coleção de variáveis

Coleção: **`Primitives/Spacing`**

Todos os tokens como variáveis de número (em px).

---

## Fonte da verdade

`specs/design-system/tokens/spacing.json` → gerado por `generate-css-tokens.mjs` → `src/app/design-system-tokens.css`

Nunca editar o CSS gerado à mão.
