---
date: 2026-03-16T00:00:00-03:00
researcher: Claude
git_commit: eaa5ef5
branch: modulo/design-system-frontend
repository: gestao-projetos
topic: "Design System Frontend Implementation — PRD Analysis and Current State"
tags: [research, design-system, tokens, components, migration, css-vars, tailwind]
status: complete
last_updated: 2026-03-16
last_updated_by: Claude
---

# Research: Design System Frontend Implementation — PRD Analysis and Current State

**Date**: 2026-03-16T00:00:00-03:00
**Git Commit**: eaa5ef5
**Branch**: modulo/design-system-frontend
**Repository**: gestao-projetos
**Research Mode**: Mixed (Etapas 2-3 partial implemented, Etapas 4-6 spec-only)

## Research Question

Análise completa do PRD `specs/prds/prd-ds-frontend-implementation.md`: estado atual da implementação do Design System, infraestrutura de tokens, componentes existentes, páginas migradas vs. pendentes, e specs de fundação.

## Summary

O projeto possui um Design System com pipeline automatizado JSON → CSS vars → Tailwind utilities. A **Etapa 2** (camada de adaptação de tokens) está 100% completa com 273 CSS vars geradas. A **Etapa 3** (componentes semânticos) está ~70% completa: 6 componentes DS criados e integrados nas páginas de Projetos, mas as páginas de Clientes (listagem + detalhe) permanecem com markup manual e classes shadcn. As **Etapas 4-6** (Figma MCP, Code Connect, Spacing Tokens) são spec-only, sem implementação.

---

## Detailed Findings

### 1. Infraestrutura de Tokens (Etapa 2 — Completa)

#### Pipeline: JSON → Script → CSS vars → Tailwind

```
colors.json + typography.json
       ↓
generate-css-tokens.mjs (node script)
  - flattenObject(): JSON nested → dotted-path map
  - resolveRef(): resolve {color.primitive.brand.500} references
  - pathToCssVar(): dotted paths → --ds-* custom properties
       ↓
design-system-tokens.css (generated, 273 vars)
       ↓
globals.css (@theme inline mapping → Tailwind utilities)
       ↓
Classes: text-ds-muted, bg-ds-brand-500, border-ds-subtle, text-ds-sm, etc.
```

#### Contagem de Tokens por Camada

**colors.json** (`specs/design-system/tokens/colors.json`):

| Camada | Tokens | Exemplos |
|---|---|---|
| Primitive | 52 | brand 50-900, neutral 0-900, success/warning/danger/info |
| Semantic | 89 | bg (5), text (5), border (6), icon (10), feedback (16), family (48) |
| Component | 104 | button (24×4 variants), badge (7×2), dataRow (9), menuItem (9), iconTile (14), buttonIcon (8), projectSummaryCard (3) |
| **Total** | **245** | |

**typography.json** (`specs/design-system/tokens/typography.json`):

| Categoria | Tokens | Detalhes |
|---|---|---|
| font.size | 10 | sm(14), base(16), lg(18), xl(20), h6(20), h5(24), h4(28), h3(32), h2(40), h1(48) |
| font.lineHeight | 10 | Todos múltiplos de 4px (24-56px) |
| font.weight | 3 | regular(400), semibold(600), bold(700) |
| font.family | 1 | Inter |
| text.body | 9 | sm/md/lg × size/lineHeight/weight |
| text.heading | 6 | h1-h6 × size/lineHeight/weight |
| **Total** | **39** | |

#### CSS Vars Geradas (`src/app/design-system-tokens.css`)

273 variáveis CSS organizadas em `:root` por categoria:
- Color Components: 104 vars
- Color Primitives: 43 vars
- Color Semantic: 87 vars
- Typography (size, lineHeight, weight, family): 24 vars
- Typography Text (body + heading presets): 15 vars

#### Tailwind Mapping (`src/app/globals.css`)

`@theme inline` mapeia tokens DS para utilities:
- **Cores primitivas**: `--color-ds-brand-[50-900]` (10 tokens)
- **Backgrounds semânticos**: `--color-ds-[canvas|surface|subtle|inverse]` (4)
- **Texto semântico**: `--color-ds-[heading|body|muted|placeholder]` (4)
- **Bordas semânticas**: `--color-ds-border-[default|subtle|strong|brand]` (4)
- **Feedback**: `--color-ds-[success|warning|danger|info]` (4)
- **Font sizes**: `--font-size-ds-[sm|base|lg|xl|h1-h6]` (10)
- **Line heights**: `--line-height-ds-[sm|base|lg|xl|h1-h6]` (10)

**Nota**: `spacing.json` **não existe** ainda — listado como Etapa 6 futura.

---

### 2. Componentes DS Existentes (Etapa 3 — ~70%)

#### 2.1 PageHeader (`src/components/page-header.tsx`, 54 linhas)

**Props:**
```typescript
type PageHeaderProps = {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}
```

**Tokens DS usados:**
- `text-ds-muted` (breadcrumb default)
- `text-ds-heading` (breadcrumb hover/active, h1 title)
- `--ds-typography-size-h5` / `--ds-typography-line-height-h5` (h1 title)
- `--ds-typography-size-sm` / `--ds-typography-line-height-sm` (breadcrumb)
- `--ds-color-semantic-border-default` (breadcrumb separator)

**Uso atual:**
- `projetos-listagem.tsx` — header com title e action button
- `projetos/[id]/layout.tsx` — header com breadcrumbs, title e badge de status

---

#### 2.2 PageTabs (`src/components/page-tabs.tsx`, 43 linhas, "use client")

**Props:**
```typescript
type PageTabsProps = {
  tabs: TabItem[]
  className?: string
}
```

**Tokens DS usados:**
- `text-ds-muted` (tab inativa)
- `text-ds-heading` (tab ativa + hover)
- `border-ds-brand-500` (borda inferior da tab ativa)
- `--ds-color-semantic-border-default` (borda inferior da nav)
- `--ds-typography-size-sm` / `--ds-typography-line-height-sm`

**Uso atual:**
- `projetos/[id]/layout.tsx` — navegação "Visão Geral", "Fases", "Timeline", "Horas"

---

#### 2.3 Button (`src/components/ui/button.tsx`, 70 linhas)

**Variantes DS adicionadas (além das shadcn existentes):**

| Variante | Tokens DS |
|---|---|
| `filled-brand` | `--ds-color-component-button-filled-brand-{default|hover|disabled}-{bg|text}` |
| `filled-neutral` | `--ds-color-component-button-filled-neutral-{default|hover|disabled}-{bg|text}` |
| `outline-brand` | `--ds-color-component-button-outline-brand-{default|hover|disabled}-{bg|text|border}` |
| `outline-neutral` | `--ds-color-component-button-outline-neutral-{default|hover|disabled}-{bg|text|border}` |

**Sizes adicionados:** `xs`, `icon-xs`, `icon-sm`, `icon-lg`

**Variantes shadcn mantidas:** `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`

---

#### 2.4 Badge (`src/components/ui/badge.tsx`, 68 linhas)

**7 variantes DS de cor:**

| Variante | BG Token | Text Token |
|---|---|---|
| `purple` | `--ds-color-component-badge-purple-bg` (#F0E6FE) | `--ds-color-component-badge-purple-text` (#8955F1) |
| `indigo` | `--ds-color-component-badge-indigo-bg` (#E6EAFE) | `--ds-color-component-badge-indigo-text` (#485ECC) |
| `yellow` | `--ds-color-component-badge-yellow-bg` (#FFF8D5) | `--ds-color-component-badge-yellow-text` (#998836) |
| `pink` | `--ds-color-component-badge-pink-bg` (#FFD5F1) | `--ds-color-component-badge-pink-text` (#993678) |
| `green` | `--ds-color-component-badge-green-bg` (#D9F3DB) | `--ds-color-component-badge-green-text` (#226B34) |
| `sky` | `--ds-color-component-badge-sky-bg` (#D5F1FF) | `--ds-color-component-badge-sky-text` (#367899) |
| `red` | `--ds-color-component-badge-red-bg` (#FFDAD4) | `--ds-color-component-badge-red-text` (#94312D) |

**Variantes shadcn mantidas:** `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`

---

#### 2.5 DataRowProjects (`src/app/(internal)/projetos/_components/data-row-projects.tsx`, 53 linhas)

**Props:**
```typescript
type DataRowProjectsProps = {
  id: string
  nome: string
  clienteNome: string
  dataInicio: Date
  badge?: React.ReactNode
  className?: string
}
```

**Tokens DS usados:**
- `--ds-color-component-data-row-{default|hover}-{bg|border|title}` (6 vars)
- `text-ds-muted` (metadados: cliente + data)
- `--ds-typography-size-{base|sm}` + line heights

**Estrutura:** Link com hover states via `.group`, flex layout com badge slot à direita.

---

#### 2.6 ProjectSummaryCard (`src/app/(internal)/projetos/_components/project-summary-card.tsx`, 52 linhas)

**Props:**
```typescript
type ProjectSummaryCardProps = {
  fields: SummaryField[]
  className?: string
}
type SummaryField = {
  label: string
  value: React.ReactNode
  href?: string
  colSpan?: 2
}
```

**Tokens DS usados:**
- `--ds-color-component-project-summary-card-{bg|label|title}` (3 vars)
- `text-ds-heading` (valores de campo)

**Estrutura:** Grid responsivo 2 colunas, com suporte a `colSpan: 2`, links em valores, fundo brand light (#F0E6FE).

---

#### 2.7 DataRow Genérico — NÃO EXISTE

`src/components/data-row.tsx` **não existe** ainda. O PRD define como Tarefa 3.1 com esta API:

```typescript
type DataRowProps = {
  href: string
  title: string
  metadata?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
}
```

---

### 3. Integração por Página — Migradas vs. Pendentes

#### Páginas Migradas (Projetos)

| Página | Componentes DS | Status |
|---|---|---|
| `projetos-listagem.tsx` | PageHeader + DataRowProjects + Badge + Button(filled-brand) | ✅ |
| `projetos/[id]/layout.tsx` | PageHeader(breadcrumbs) + PageTabs + Badge | ✅ |
| `projetos/[id]/page.tsx` | ProjectSummaryCard + Badge | ✅ |

**Padrões observados nas páginas migradas:**
- Empty state usa `text-ds-muted` (não `text-muted-foreground`)
- Container de lista usa `border-[var(--ds-color-component-data-row-default-border)]`
- Botão primário usa `variant="filled-brand"`
- Breadcrumbs via prop `breadcrumbs` do PageHeader

---

#### Páginas Pendentes de Migração (Clientes)

##### ClientesListagem (`src/app/(internal)/clientes/_components/clientes-listagem.tsx`)

**Estado atual — markup manual, zero tokens DS:**
- Header: `<h1 className="text-2xl font-semibold">` + botão solto
- Rows: `<div>` manual com `font-medium text-primary hover:underline` (link) + `text-sm text-muted-foreground` (metadados)
- Empty state: `text-muted-foreground py-8 text-center`
- Ações: Button `ghost` (editar) + AlertDialog `destructive` (excluir)
- Container: `divide-y rounded-lg border`

**Classes shadcn identificadas:**
- `text-muted-foreground` (2 ocorrências)
- `text-primary` (1 ocorrência)
- `font-medium` (1 ocorrência)

##### ClienteDetalhe (`src/app/(internal)/clientes/_components/cliente-detalhe.tsx`)

**Estado atual — markup manual, zero tokens DS:**
- Breadcrumb: `<nav>` manual com `text-sm text-muted-foreground`, `hover:text-foreground`
- Header: `<h1 className="text-2xl font-semibold">` + botões inline
- Info grid: `grid gap-4 sm:grid-cols-2` com labels `text-sm font-medium text-muted-foreground`
- Projetos list: `<div>` manual com `font-medium text-primary hover:underline`
- Container: `divide-y rounded-lg border`

**Classes shadcn identificadas:**
- `text-muted-foreground` — 7 ocorrências
- `text-foreground` — 1 ocorrência
- `text-primary` — 1 ocorrência
- `font-semibold` — 2 ocorrências
- `font-medium` — 2 ocorrências

---

#### Queries Disponíveis (`src/queries/cliente.queries.ts`)

| Query | Campos Retornados | Suficiente? |
|---|---|---|
| `getClientes()` | id, nome, empresa_organizacao, email_principal, created_at | Sim (DataRow) |
| `getClienteById(id)` | id, nome, empresa_organizacao, email_principal, telefone_contato, observacoes, created_at, updated_at | Sim (SummaryCard) |
| `getProjetosDoCliente(clienteId)` | id, nome, status, data_inicio, previsao_entrega | Sim (DataRow/DataRowProjects) |

---

### 4. Specs de Fundação do Design System

#### Colors (`specs/design-system/foundations/design-system-colors.md`)

**Arquitetura 3 camadas:**
1. **Primitive** — hex raw values extraídos do Figma
2. **Global Semantic** — aliases por família (brand, neutral, success, etc.) e por role (bg, text, border, icon, feedback)
3. **Component** — tokens multi-estado pré-compostos (button.filled.brand.default.bg)

**7 component namespaces:** menuItem, projectSummaryCard, button, badge, iconTile, buttonIcon, dataRow

**Regra de referência:** Components → role tokens → family tokens → primitives (hierarquia preferencial)

**Regra DataRow:** `Data Row` e `Data Row Projects` compartilham `color.component.dataRow.*`. Namespace dedicado `dataRowProjects` só se: cor de header distinta, estados adicionais (selected, archived, warning), ou mapeamentos de cor diferentes.

#### Typography (`specs/design-system/foundations/design-system-typography.md`)

**Arquitetura 2 camadas:**
1. **Primitives** — font.family (Inter), font.size (10), font.lineHeight (10), font.weight (3)
2. **Semantic** — text.body (sm/md/lg), text.heading (h1-h6)

**Baseline grid:** 4px — todos line heights são múltiplos de 4px

**Escala de espaçamento referenciada:** 4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 72, 80, 96, 120px

#### Figma Naming (`specs/design-system/foundations/design-system-figma-naming.md`)

**Anatomias definidas:**
- **DataRow:** primaryInfo → textContent (title + description), statusSlot, actionsGroup
- **PageHeader:** breadcrumb, titleBlock (title + subtitle), pageTabs, pageToolbar
- **Overview Sections:** overviewSection → summaryGrid → summaryCard/highlightCard → summaryItem/highlightItem
- **List Sections:** listSection → sectionHeader + listContainer → listHeader + rowsList

**Divergence triggers** (quando código pode divergir do naming Figma):
- Toolbar complexo precisando de agrupamento interno
- Listas não seguindo mais o padrão genérico header + rows
- Wrappers específicos de domínio não mais reutilizáveis
- Page header precisando de blocos contextuais paralelos

---

### 5. Tokens com Componentes Pendentes

| Token namespace | CSS vars existem | Componente no código |
|---|---|---|
| `menuItem` | ✅ (9 vars) | ❌ Não implementado |
| `buttonIcon` | ✅ (8 vars) | ❌ Não implementado |
| `iconTile` | ✅ (14 vars) | ❌ Não implementado |

Esses tokens existem no JSON e são gerados como CSS vars, mas não há componentes React correspondentes. O PRD nota que serão implementados quando necessários.

---

### 6. Roadmap de Etapas (PRD)

| Etapa | Status | Descrição |
|---|---|---|
| 2 | ✅ Completa | Camada de adaptação de tokens (JSON → CSS vars → Tailwind) |
| 3 | ~70% | Componentes semânticos — Projetos migrados, Clientes pendentes |
| 4 | Spec-only | Validação com Figma MCP (requer URL Figma file) |
| 5 | Spec-only | Code Connect progressivo (após Etapa 4a) |
| 6 | Spec-only | Spacing tokens formalizados (não bloqueia Etapas 3-5) |

**Pendências da Etapa 3 (Tarefas 3.1-3.4):**
1. Criar `DataRow` genérico em `src/components/data-row.tsx`
2. Migrar `ClientesListagem` para PageHeader + DataRow
3. Migrar `ClienteDetalhe` para PageHeader + ProjectSummaryCard + DataRow
4. Validação: zero classes shadcn nos componentes migrados

---

## References

- `specs/prds/prd-ds-frontend-implementation.md` — PRD completo do DS Frontend
- `specs/design-system/tokens/colors.json` — Source of truth para cores (245 tokens)
- `specs/design-system/tokens/typography.json` — Source of truth para tipografia (39 tokens)
- `specs/design-system/scripts/generate-css-tokens.mjs` — Script de geração automática
- `src/app/design-system-tokens.css` — 273 CSS vars geradas (nunca editar)
- `src/app/globals.css` — Import de tokens + @theme mapping para Tailwind
- `specs/design-system/foundations/design-system-colors.md` — Spec de cores (3 camadas)
- `specs/design-system/foundations/design-system-typography.md` — Spec de tipografia
- `specs/design-system/foundations/design-system-figma-naming.md` — Anatomia de componentes Figma
- `src/components/page-header.tsx` — Componente PageHeader (54 linhas)
- `src/components/page-tabs.tsx` — Componente PageTabs (43 linhas)
- `src/components/ui/button.tsx` — Button com 4 variantes DS (70 linhas)
- `src/components/ui/badge.tsx` — Badge com 7 variantes DS (68 linhas)
- `src/app/(internal)/projetos/_components/data-row-projects.tsx` — DataRowProjects (53 linhas)
- `src/app/(internal)/projetos/_components/project-summary-card.tsx` — ProjectSummaryCard (52 linhas)
- `src/app/(internal)/clientes/_components/clientes-listagem.tsx` — Listagem (markup manual, zero DS)
- `src/app/(internal)/clientes/_components/cliente-detalhe.tsx` — Detalhe (markup manual, zero DS)
- `src/queries/cliente.queries.ts` — Queries: getClientes(), getClienteById(), getProjetosDoCliente()

## Design & Decisions

### Princípios Arquiteturais do DS

1. **Repository as Source of Truth** — JSON tokens são a origem oficial; Figma consome, não define
2. **Tokens Before Components** — Formalizar token em JSON antes de usar em componentes
3. **Granular + Seguro** — MCP para leitura de design context, componente por componente
4. **Code Connect = Linkagem, Sem Geração** — Conecta Figma ↔ repo, reduz divergência
5. **Figma Naming Informa, Sem Ditar** — Anatomia Figma como referência, não espelhamento rígido
6. **Escalabilidade** — Adicionar tokens: editar JSON + rodar script; linear, não exponencial

### Padrões de Uso nos Componentes

**Três padrões de aplicação de tokens:**
1. **Utilities semânticas** (simples): `text-ds-heading`, `bg-ds-surface`
2. **Inline var()** (component-specific): `border-[var(--ds-color-component-data-row-default-border)]`
3. **Typography size+lh** (explícito): `text-[length:var(--ds-typography-size-base)] leading-[var(--ds-typography-line-height-base)]`

### Decisão sobre DataRow

O PRD define DataRow genérico com composição por props (`href`, `title`, `metadata`, `trailing`). DataRowProjects existente não será refatorado para usar o genérico nesta etapa — decisão de migração posterior.

### Decisão sobre ProjectSummaryCard

Mantido específico (não generalizado). ClienteDetalhe reutiliza diretamente passando fields diferentes.

## Open Questions

1. **Figma file URL** — pendente, necessária para iniciar Etapas 4-5
2. **Dark mode** — DS tokens não aplicados ao `.dark` class; fora de escopo atual
3. **Spacing tokens** — Etapa 6, não bloqueia Etapas 3-5; componentes usam escala manualmente
4. **menuItem, buttonIcon, iconTile** — tokens existem sem componentes React correspondentes; quando serão necessários?
