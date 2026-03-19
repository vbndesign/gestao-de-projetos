# Design System Frontend — Contratos e Decisões

## Overview

Este documento é a **referência de contratos** do Design System no frontend. Registra o que existe, como usar, e por que as decisões foram tomadas — para que PRDs e implementações futuras partam de uma base clara.

**O que não está aqui:** workflow de integração com Figma (ver `07_design_ui.md`), arquitetura de tokens de cor (ver `design-system-colors.md`), tipografia (ver `design-system-typography.md`).

---

## Princípios

1. **Repositório como source of truth** — JSON tokens (`specs/design-system/tokens/`) são a origem oficial. Figma consome esses tokens, não os define.
2. **Tokens antes de componentes** — formalizar token em JSON antes de usar em componentes. Evita hex solto e tamanhos arbitrários.
3. **Granular com Figma MCP** — MCP é ferramenta de leitura (design context), usada componente por componente, nunca para gerar páginas inteiras.
4. **Estender primitives, não reescrever** — `src/components/ui/` contém primitives shadcn. Modificar apenas via variant, wrapper ou composição.
5. **Code Connect só após estabilização** — conectar Figma ↔ código após 2+ cycles de validação visual.

---

## Token Architecture

### Arquitetura

```
JSON (colors.json, typography.json, spacing.json, radius.json)
  ↓ node specs/design-system/scripts/generate-css-tokens.mjs
CSS vars (src/app/design-system-tokens.css)  ← nunca editar manualmente
  ↓ importado em globals.css
Tailwind @theme inline  →  utilities text-ds-*, bg-ds-*, border-ds-*, radius-ds-*, spacing-ds-*
```

### Como adicionar tokens

1. Editar o JSON correspondente em `specs/design-system/tokens/`
2. Rodar `node specs/design-system/scripts/generate-css-tokens.mjs`
3. Commitar JSON + CSS gerado

### Inventário atual (305 CSS vars)

| Categoria | Quantidade | Exemplos de prefixo |
|---|---|---|
| Color Primitives | 42 | `--ds-color-primitive-brand-*` |
| Color Semantic | 82 | `--ds-color-semantic-bg-*`, `--ds-color-semantic-text-*`, `--ds-color-semantic-border-*` |
| Color Component | 92 | `--ds-color-component-button-*`, `--ds-color-component-badge-*`, `--ds-color-component-data-row-*` |
| Typography | 43 | `--ds-typography-size-*`, `--ds-typography-weight-*`, `--ds-typography-line-height-*` |
| Spacing | 14 | `--ds-spacing-4` … `--ds-spacing-120` |
| Radius Primitive | 7 | `--ds-radius-primitive-none/xs/sm/md/lg/xl/full` |
| Radius Semantic | 8 | `--ds-radius-semantic-button/card/badge/input/dialog/…` |

### Utilities Tailwind disponíveis

```
text-ds-heading   text-ds-muted   text-ds-brand-500
bg-ds-subtle      border-ds-subtle
text-ds-sm        text-ds-base    text-ds-lg    text-ds-h5
```

---

## Component Contracts

Estrutura de 3 níveis:

```
src/components/ui/          → Level 1: primitives (shadcn + variantes DS)
src/components/             → Level 2: semânticos reutilizáveis (2+ features)
src/app/(internal)/*/       → Level 3: específicos de feature
  _components/
```

---

### Level 1 — Primitives (`src/components/ui/`)

#### Button — `button.tsx`

Variantes DS adicionadas ao `cva()` base do shadcn:

| Variante | Uso |
|---|---|
| `filled-brand` | Ação primária — criar, salvar (roxo DS) |
| `filled-neutral` | Ação secundária confirmativa |
| `outline-brand` | Ação secundária com identidade de marca |
| `outline-neutral` | Ação terciária / cancelar |

Variantes shadcn mantidas: `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`.

Tokens: `--ds-color-component-button-{variante}-{estado}-{bg|text|border}`

#### Badge — `badge.tsx`

Variantes DS de cor (7):

| Variante | Uso semântico |
|---|---|
| `purple` | Status primário / destaque |
| `indigo` | Info / categoria |
| `yellow` | Atenção / pendente |
| `pink` | Especial / marca |
| `green` | Sucesso / ativo |
| `sky` | Neutro-claro / secundário |
| `red` | Erro / crítico |

Tokens: `--ds-color-component-badge-{cor}-{bg|text}`

---

### Level 2 — Semânticos reutilizáveis (`src/components/`)

#### PageHeader — `page-header.tsx`

```
title (string)         — obrigatório
subtitle?  (string)    — linha secundária em text-ds-muted, abaixo do título
breadcrumbs?           — array de {label: string, href?: string}
                         último item omite href (item atual)
badge?   (ReactNode)   — renderizado inline ao lado do título (ex: Badge de status)
actions? (ReactNode)   — renderizado à direita (ex: botões de ação)
className?
```

Tokens: `--ds-typography-size-h5`, `--ds-typography-size-sm`, `text-ds-heading`, `text-ds-muted`

**Quando usar:** toda página do painel interno que tem título, breadcrumb ou ações no header. `subtitle` opcional para contexto adicional (ex: nome do cliente em detalhe de projeto).

---

#### PageTabs — `page-tabs.tsx`

```
tabs       — array de {label: string, href: string, icon?: ReactNode}
className?
```

`"use client"` — detecta aba ativa via `usePathname()`. Cada aba renderiza como `<Link>` com `buttonVariants()`:
- Ativa: `variant="filled-brand"`
- Inativa: `variant="outline-brand"`

Classes aplicadas: `h-14 rounded-[4px] gap-2` (icon + label com spacing).

Tokens: `--ds-color-component-button-filled-brand-default-*`, `--ds-color-component-button-outline-brand-default-*`, `text-ds-heading`, `text-ds-muted`

**Quando usar:** layouts com sub-navegação entre abas (ex: `/projetos/[id]/` com Visão Geral, Fases, Tarefas). Ícones opcionais para melhor UX.

---

#### DataRow — `data-row.tsx`

```
href       (string)    — obrigatório, link ao clicar no título
title      (string)    — obrigatório
metadata?  (ReactNode) — linha secundária abaixo do título (texto muted, size-sm)
trailing?  (ReactNode) — slot à direita (badge, botões de ação, qualquer ReactNode)
className?
```

Tokens: `--ds-color-component-data-row-{default|hover}-{bg|border|title}`

Container externo esperado (controla borda ao redor da lista):
```tsx
<div className="overflow-hidden rounded-lg border border-[var(--ds-color-component-data-row-default-border)]">
  {items.map(item => <DataRow key={item.id} ... />)}
</div>
```

**Quando usar:** qualquer listagem de entidades com link (clientes, projetos, tarefas). Substituiu markup manual de listas.

---

#### ProjectSummary — `project-summary.tsx`

Arquivo exporta **dois componentes**:

##### 1. SummaryFields (legacy API)

```
fields     — array de SummaryField (ver abaixo)
className?

SummaryField:
  label    (string)
  value    (ReactNode)
  href?    (string)    — se presente, value vira link clicável
  colSpan? (2)         — aceita apenas o literal 2 (não qualquer número)
```

Renderiza grid 2 colunas com `sm:grid-cols-2`. Campos com `colSpan: 2` ocupam linha inteira.

**Uso:** `ClienteDetalhe` — grid de informações do cliente (empresa, email, telefone, observações, datas).

##### 2. ProjectSummary (dual-card API, tipada)

```
clienteNome        (string)         — obrigatório
clienteHref?       (string)         — se presente, nome vira link
tarefasConcluidas  (number)         — X de Y
totalTarefas       (number)
horasTrabalhadas   (number)         — X de Y estimadas
horasEstimadas     (number)
orcamento          (number | null)  — null = exibe "—"
dataInicio         (Date)
previsaoTermino    (Date | null)    — null = exibe "—" em vez de "X dias"
className?
```

Layout:
- **summaryCard (flex-1):** border com tokens datarow, contém Cliente + Tarefas + Horas
- **highlightCard (shrink-0):** `bg-[var(--ds-color-component-project-summary-card-bg)]`, contém Orçamento + Data início + Previsão (valores em bold)

Formatação:
- `previsaoTermino` → "X dias" (cálculo de dias restantes a partir de hoje) ou "—"
- `orcamento` → "R$ X" pt-BR formatado ou "—"

Tokens: `--ds-color-component-project-summary-card-{bg|label|title}`, `--ds-color-component-data-row-{default|hover}-{bg|border}`

**Uso:** `ProjetoDetalhe` — summary dual-card de status de projeto com contexto de cliente e prazos.

---

### Level 3 — Feature-specific

#### DataRowProjects — `src/app/(internal)/projetos/_components/data-row-projects.tsx`

Componente específico para listagem tabular de projetos — layout com colunas fixas e widths definidos.

```
id                (string)          — obrigatório, para href
nome              (string)          — obrigatório
clienteNome       (string)          — obrigatório
totalTarefas      (number)          — total de tarefas do projeto
dataInicio        (Date)            — obrigatório
previsaoEntrega   (Date | null)     — opcional
className?
```

Layout:
- Container: `<Link>` com `group` class para hover states
- **primaryInfo (w-[420px]):** IconTile inline + texto (nome + clienteNome)
  - IconTile: `bg-[var(--ds-color-component-icon-tile-purple-bg)]` com ícone `BookOpen`
- **Colunas:** tarefas (w-20) | horas (w-20) | orçamento (w-[140px]) | data início (w-[140px]) | previsão (w-48)
- Hover: `group-hover:` em título muda para cor `hover-title`

Tokens: `--ds-color-component-data-row-{default|hover}-{bg|border|title}`, `--ds-color-component-icon-tile-purple-{bg|icon}`, `text-ds-muted`

**Contexto:** parte da listagem `/projetos` com ListHeader. Colunas são responsáveis por representar status do projeto de forma compacta.

---

## Decisões de Design

### Por que tokens ficam em JSON, não no Figma

O repositório é a source of truth. Figma é uma ferramenta de design e contexto visual, não um repositório de contratos. Tokens em JSON:
- Versionados em git com histórico
- Gerados automaticamente para CSS — evita divergência manual
- Independentes de ferramenta externa (sem lock-in de plataforma Figma)

Figma **consome** os tokens via plugin; não os origina.

---

### Por que DataRow é genérico em `src/components/`

Três contextos com o mesmo padrão visual confirmados no momento de criação: clientes, projetos (via DataRowProjects) e tarefas (previsto). Token namespace `dataRow` é genérico em `colors.json` — não pertence a nenhuma entidade. Criar um componente por entidade geraria duplicação de lógica de hover state, tokens e estrutura.

---

### Por que ProjectSummaryCard está em `src/components/` e não em `projetos/_components/`

Criado inicialmente em `projetos/_components/`. Movido ao ser reutilizado em `ClienteDetalhe` com o mesmo contrato visual. A decisão seguiu a regra: componente que aparece em 2+ features passa para `src/components/`.

---

### Por que DataRowProjects não foi refatorado para usar DataRow genérico

DataRowProjects tem colunas fixas com layout específico (nome + badge status + data). Refatorar para usar DataRow genérico exigiria configuração via props que aumentaria a complexidade do componente genérico sem benefício claro. A decisão é manter como está e, se necessário, refatorar quando um terceiro caso de uso surgir com requisitos similares.

---

### Por que Etapas 4-6 não são mais roadmap

Quando o PRD original foi criado, Etapas 4 (Figma MCP), 5 (Code Connect) e 6 (spacing tokens) eram listadas como "próximas etapas". Com a formalização de `07_design_ui.md`, essas atividades passaram a ser parte do **fluxo normal** de desenvolvimento:

- **Validação com Figma MCP** → Phase D do `implement_plan` para qualquer feature com UI
- **Code Connect** → executado após componente estabilizar (2+ cycles), usando `/figma:code-connect-components`
- **Spacing tokens** → adicionar `spacing.json` + rodar script quando o primeiro componente precisar de tokens formalizados de espaçamento

Não há roadmap pendente — há um workflow que se aplica a cada nova feature.

---

## Tokens com Componentes Pendentes

Tokens existem em `colors.json` e CSS vars foram geradas. Componentes serão implementados conforme demanda de features:

| Token namespace | CSS vars geradas | Componente |
|---|---|---|
| `menuItem` | ✅ | Sem componente DS ainda |
| `buttonIcon` | ✅ | Sem componente DS ainda |
| `iconTile` | ✅ | Sem componente DS ainda |

---

## Arquivos Críticos

| Arquivo | Propósito | Editar? |
|---|---|---|
| `specs/design-system/tokens/colors.json` | Source of truth de cores | ✅ Para adicionar tokens |
| `specs/design-system/tokens/typography.json` | Source of truth de tipografia | ✅ Para adicionar tokens |
| `specs/design-system/scripts/generate-css-tokens.mjs` | Converte JSON → CSS vars | ✅ Para suportar novos domínios |
| `src/app/design-system-tokens.css` | CSS vars geradas | ❌ Nunca editar manualmente |
| `src/app/globals.css` | Import + @theme Tailwind | ✅ Para adicionar utilities |

---

## Referências

- `specs/foundation/07_design_ui.md` — workflow de integração Figma no processo de desenvolvimento
- `specs/design-system/foundations/design-system-colors.md` — arquitetura de tokens de cor
- `specs/design-system/foundations/design-system-typography.md` — tokens de tipografia, escala, presets
- `specs/design-system/foundations/design-system-figma-naming.md` — naming conventions Figma
- `specs/design-system/tokens/colors.json` — source of truth de cores
- `specs/design-system/tokens/typography.json` — source of truth de tipografia

---

**Versão**: 2.1 — Atualizado após PRD-05 (alinhamento visual, dual-card ProjectSummary, PageTabs com botões, DataRowProjects tabular) (2026-03-19)
**Versão 2.0**: Reescrito como referência de contratos
**Versão anterior**: PRD de migração Etapas 2-3 (concluído)
