# PRD-05 — Alinhamento Visual: Projetos

> **Tipo:** Refactor visual (sem mudanças de schema, actions ou services)
> **Branch:** `feature/prd-05-visual-projetos`

---

## Objetivo

Alinhar visualmente as telas `/projetos` e `/projetos/[id]` ao design do Figma. As implementações anteriores (PRD-02b e 02c) foram funcionais mas sem referência visual. Este PRD corrige o delta visual componente por componente.

---

## Escopo

### Inclui
- Refactor visual de `DataRowProjects` — novo layout tabular com colunas fixas e hover state
- Refactor visual de `ProjetosListagem` — list header com colunas, container bg-white, filtros integrados ao PageHeader
- Refactor visual de `ProjectSummaryCard` — novo design de dois cards horizontais (summaryCard + highlightCard)
- Refactor visual de `PageTabs` — botões filled/outline em vez de underline tabs
- Ajuste visual de `PageHeader` na visão geral — breadcrumb + subtítulo (nome do cliente)
- Ajuste de queries para expor dados das novas colunas da listagem (tarefas, orcamento, previsao)

### Não inclui
- Schema Prisma, migrations, actions, services
- Fases, timeline, horas — essas seções já existem e **não devem ser tocadas**
- Filtros com lógica nova (manter Select atual — apenas ajuste visual do posicionamento)
- Dark mode
- IconTile como componente separado (inline no DataRowProjects)

---

## Arquivos

### Modificar
```
src/app/(internal)/projetos/_components/data-row-projects.tsx     — refactor completo
src/app/(internal)/projetos/_components/projetos-listagem.tsx      — listHeader + container
src/app/(internal)/projetos/[id]/_components/projeto-detalhe.tsx   — remove actions do header, usa novo summaryCard
src/components/project-summary-card.tsx                            — novo design dual-card
src/components/page-tabs.tsx                                       — botões em vez de underline
src/components/page-header.tsx                                     — suporte a subtitle
src/queries/projeto.queries.ts                                     — getProjetosFiltrados: incluir tarefas, orcamento, previsao_entrega
```

---

## Design Reference

| Tela / Componente | Figma node | Screenshot |
|---|---|---|
| Listagem `/projetos` | `3:111` | canvas lavanda, listagem tabular com header |
| Visão geral `/projetos/[id]` | `30:1219` | breadcrumb + summaryGrid + tabs como botões |
| `DataRowProjects` (states) | `78:3286` | default (borda cinza) + hover (borda brand, bg lavanda, título brand) |
| `ProjectSummaryCard` (novo) | `35:346` | dois cards lado a lado: summaryCard + highlightCard |

---

## Especificação Visual

### 1. `DataRowProjects`

**Layout atual:** `border-b`, `justify-between`, sem colunas fixas, sem IconTile, data_inicio no subtítulo.

**Layout Figma:** row horizontal com colunas fixas, gap-64, p-24, rounded-[6px], border-[1px].

```
┌─ primaryInfo (420px) ─────────────────────┐  Tarefas  Horas  Orçamento  Data início  Previsão
│  [IconTile] [nome projeto]                │  (80px)  (80px)  (140px)    (140px)      (192px)
│             [nome cliente]                │
└───────────────────────────────────────────┘
```

**Tokens / estados:**

| Estado | bg | border | título |
|---|---|---|---|
| default | `white` | `var(--color/datarow/default/border, #d9d8db)` | `var(--color/datarow/default/title, #3f3e42)` |
| hover | `var(--color/datarow/hover/bg, #f5f2fa)` | `var(--color/datarow/hover/border, #6b43b8)` | `var(--color/datarow/hover/title, #6b43b8)` |

**IconTile** (inline — não extrair componente):
- bg `var(--color/icontile/purple/bg, #f0e6fe)` — equivalente DS: `var(--ds-color-primitive-brand-100)`
- padding 12px, rounded-[2px]
- ícone 24×24: ícone de notebook (SVG inline ou lucide `BookOpen` como fallback)

**Colunas de dados** (texto body-md/muted = `#8e8b94`):
- `tarefas`: formato `{concluidas} / {total}` (ex: "56 / 32") — width 80px
- `horas`: formato `{registradas} / {estimadas}` (ex: "68 / 42") — width 80px
- `orcamento`: formato `R$ {valor}` em pt-BR — width 140px
- `dataInicio`: dd/mm/aaaa — width 140px
- `previsaoTermino`: dd/mm/aaaa — width 192px

**Link:** card inteiro clicável → `/projetos/${id}`.

**Novos campos necessários na query** `getProjetosFiltrados`:
```prisma
_count: { select: { tarefas: true } },        // total tarefas
orcamento: true,
previsao_entrega: true,
```
Para tarefas concluídas seria um `_count` filtrado — usar `0` como placeholder se não disponível via Prisma count direto; `_count.tarefas` como total é suficiente para o MVF (mostrar como `- / {total}` se contagem parcial não disponível).

> Simplificação aceitável: exibir `_count.tarefas` no campo "total" e `—` no campo "concluídas" se a query não retornar breakdown por status. O design visual (colunas, sizing, hover) é o foco — os dados exatos são secundários para este PRD.

---

### 2. `ProjetosListagem`

**ListHeader** — header fixo com as mesmas colunas do DataRow:

```tsx
// bg: var(--ds-color-component-datarow-header-bg, #f5f2fa) — equivalente: bg-ds-subtle
// px-24 py-16 rounded-[6px] text-sm semibold text-body (#67656b)
// gap-64 (entre colunas)
```

Colunas do header: **Projetos (420px) | Tarefas (80px) | Horas (80px) | Orçamento (140px) | Data de início (140px) | Previsão de término (192px)**

**ListContainer:**
- bg-white, p-24, rounded-[6px]
- rows com gap-16 (flex-col, não divide-y)

**Filtros:**
- Design Figma: "Selecionar status" e "Selecionar cliente" como botões `outline-brand` com ícone chevron → integrar no `PageHeader` via `actions` prop (manter Select shadcn — apenas encapsular no botão visualmente ou manter como está; prioridade é o layout geral)
- Alternativa aceitável: mover filtros para dentro do `pageToolbar` junto com "Novo projeto"

**Título do PageHeader na listagem:** "Meus projetos" (não "Projetos")

---

### 3. `PageHeader` — ajustes para visão geral

Adicionar prop `subtitle?: string` para exibir nome do cliente abaixo do título.

```tsx
// Design visão geral:
// breadcrumb "Projetos /"  (texto muted, link /projetos)
// título: nome do projeto (h5/semibold/heading)
// subtitle: nome do cliente (sm/muted)
```

**Componente atual já suporta breadcrumbs** — apenas adicionar `subtitle` prop no bloco do título.

No `ProjetoDetalhe`, o PageHeader passa para o layout via `page.tsx` ou é renderizado dentro do componente. Ver onde está sendo composto e ajustar para incluir:
```
breadcrumbs={[{ label: 'Projetos', href: '/projetos' }]}
title={projeto.nome}
subtitle={projeto.cliente.nome}
```

---

### 4. `PageTabs` — botões filled/outline

**Design atual:** underline tabs com `border-b`, texto sm, linha inferior ativa.

**Design Figma:** botões `h-56 rounded-[4px]`, aba ativa = `filled-brand`, inativas = `outline-brand`. Cada tab tem um ícone à esquerda.

```tsx
type TabItem = {
  label: string
  href: string
  icon?: React.ReactNode  // novo: ícone à esquerda
}
```

**Aba ativa** determinada por `usePathname()` (lógica atual mantida).

**Ícones por aba** (lucide-react, definidos no call site em `ProjetoDetalhe`):
- Visão geral: `LayoutDashboard` ou `CalendarCheck`
- Fases: `Layers`
- Timeline: `BarChart2`
- Horas: `Clock`

**Remoção do `border-b`** do container nav.

**Token mapeamento:**
- filled ativo: `variant="filled-brand"` (Button L1 existente)
- outline inativo: `variant="outline-brand"` (Button L1 existente)

---

### 5. `ProjectSummaryCard` — novo design dual-card

**Design atual:** grid 2-cols genérico com `fields: SummaryField[]`.

**Design Figma:** dois cards lado a lado (flex row, gap-16, items-end):

```
┌─ summaryCard (flex-1) ────────────────────────────────────┐  ┌─ highlightCard (shrink-0) ──────────────────────────┐
│  [Cliente - nome/href]  [Tarefas concluídas]  [Horas]     │  │  R$ 2.750,00    17/12/2025    45 dias               │
│  Fabricio Oliveira      56 / 32               68 / 42     │  │  Orçamento      Data de início  Previsão de término │
└───────────────────────────────────────────────────────────┘  └─────────────────────────────────────────────────────┘
```

**summaryCard:**
- border `#d9d8db`, rounded-[6px], px-24, py via flex `items-center` (altura auto)
- gap-72 entre items (flex row)
- Items: flex-col, valor acima, label abaixo
  - Cliente: valor = `h6/semibold/20px/heading`, label = `sm/muted`
  - Tarefas concluídas: valor = `body-lg/semibold/18px/heading`, label = `sm/muted`
  - Horas trabalhadas: valor = `body-lg/semibold/18px/heading`, label = `sm/muted`

**highlightCard:**
- bg `var(--color/brand/100, #f0e6fe)` = `var(--ds-color-primitive-brand-100)`
- px-40 py-32, rounded-[6px], gap-72 entre items
- Valores: `body-lg/bold/18px/brand-600` = `var(--ds-color-primitive-brand-600, #6b43b8)` font-bold
- Labels: `sm/muted`

**Nova API do componente:**
```tsx
type ProjectSummaryCardProps = {
  clienteNome: string
  clienteHref?: string
  tarefasConcluidas: number
  totalTarefas: number
  horasTrabalhadas: number    // em horas
  horasEstimadas: number
  orcamento: number | null
  dataInicio: Date
  previsaoTermino: Date | null
}
```

Formatação de `previsaoTermino` no highlightCard: se `null`, exibir "—". Se disponível, calcular dias restantes (`Math.ceil((previsaoTermino - today) / ms_per_day) + " dias"`) **ou** exibir a data formatada. Figma mostra "45 dias" — calcular dias entre hoje e previsão_entrega.

---

## Ajuste de query

`getProjetosFiltrados` precisa incluir:
```prisma
select: {
  ...atual,
  orcamento: true,
  previsao_entrega: true,       // já existe no type mas não no select
  _count: { select: { tarefas: true } },
}
```

`getProjetoById` já precisa expor tarefas concluídas e horas para o `ProjectSummaryCard`. Verificar se já inclui — se não, adicionar `_count` e contagem de horas registradas.

---

## Critérios de aceitação

### Listagem `/projetos`
- [ ] ListHeader com 6 colunas fixas visível acima dos rows
- [ ] Cada DataRow tem IconTile + nome + cliente na coluna primária (420px)
- [ ] Hover no DataRow: bg lavanda + borda brand + título brand
- [ ] Todo o card é clicável → `/projetos/${id}`
- [ ] Container bg-white com padding e rounded (não `divide-y border`)
- [ ] Título do header: "Meus projetos"

### Visão geral `/projetos/[id]`
- [ ] Breadcrumb "Projetos /" linkando para `/projetos`
- [ ] Subtítulo com nome do cliente abaixo do título do projeto
- [ ] `PageTabs` renderiza botões filled/outline, não underline
- [ ] Aba ativa = filled-brand, inativas = outline-brand
- [ ] `ProjectSummaryCard` renderiza dois cards: summaryCard + highlightCard
- [ ] highlightCard com bg brand-100, valores em bold/brand-600

### Tokens e DS
- [ ] Sem hex literals no código novo — usar CSS vars DS ou `var(--color/...)` mapeados
- [ ] Sem `text-gray-*` ou `bg-gray-*` — usar aliases DS

---

## Verificação

```bash
# 1. Build sem erros
pnpm dev

# 2. Checklist visual por tela
# - Abrir /projetos e comparar com screenshot node 3:111
# - Hover em um DataRow: verificar bg + borda + cor do título
# - Abrir /projetos/[id] e comparar com screenshot node 30:1219
# - Verificar tabs: botões, não underline
# - Verificar summaryGrid: dois cards, highlight roxo
```
