# PRD — Design System Frontend Implementation

## Overview

Este PRD documenta a estratégia de implementação do frontend usando o Design System como camada unificadora. Consolida o trabalho realizado em Etapas 2-3 e define o roadmap para Etapas 4-6 (Figma MCP, Code Connect, Spacing Tokens).

**Objetivo**: Manter uma implementação visual coesa, escalável e alinhada entre Figma (source of context visual) e repositório (source of truth de tokens e contratos).

---

## Status Atual

### Etapa 2 ✅ Completa: Camada de Adaptação de Tokens

**Realizado:**
- Script automático (`specs/design-system/scripts/generate-css-tokens.mjs`) converte JSON → CSS vars
- 259 CSS vars geradas em `src/app/design-system-tokens.css`:
  - 42 primitives (cores base)
  - 82 semantic (backgrounds, text, borders, feedback)
  - 92 components (button, badge, data-row, icon-tile, menu-item, button-icon, project-summary-card)
  - 43 typography (sizes, weights, line-heights, presets)
- Integração Tailwind via `@theme inline` em `globals.css`
- Utilities habilitadas: `text-ds-*`, `bg-ds-*`, `border-ds-*`, `text-ds-h*`

**Arquivos críticos:**
- `specs/design-system/tokens/colors.json` — source of truth
- `specs/design-system/tokens/typography.json` — source of truth
- `specs/design-system/scripts/generate-css-tokens.mjs` — automação
- `src/app/design-system-tokens.css` — gerado (nunca editar manualmente)
- `src/app/globals.css` — import + @theme mapping

**Fluxo:**
```
JSON (colors.json, typography.json)
  ↓
Script (generate-css-tokens.mjs)
  ↓
CSS vars (design-system-tokens.css)
  ↓
Tailwind utilities + inline vars (components)
```

### Etapa 3 ~70% Completa: Componentes Semânticos Reutilizáveis

**Componentes criados:**

| Componente | Arquivo | Uso | Status |
|---|---|---|---|
| PageHeader | `src/components/page-header.tsx` | Titles + breadcrumbs + actions | ✅ |
| PageTabs | `src/components/page-tabs.tsx` | Navegação entre abas (via layout) | ✅ |
| DataRowProjects | `src/app/(internal)/projetos/_components/data-row-projects.tsx` | Lista de projetos | ✅ |
| ProjectSummaryCard | `src/app/(internal)/projetos/_components/project-summary-card.tsx` | Grid de campos projeto | ✅ |
| Button variants DS | `src/components/ui/button.tsx` | filled-brand, filled-neutral, outline-* | ✅ |
| Badge variants DS | `src/components/ui/badge.tsx` | 7 cores (purple, indigo, yellow, etc.) | ✅ |

**Integração por página:**
- ✅ ProjetosListagem: PageHeader + DataRowProjects + Badge
- ✅ ProjetoLayout: PageHeader + PageTabs (herança automática para sub-páginas)
- ✅ ProjetoDetalhe: ProjectSummaryCard + Badge
- ❌ ClientesListagem: **markup manual, classes shadcn, sem DS tokens**
- ❌ ClienteDetalhe: **markup manual, 9+ `text-muted-foreground`, sem PageHeader**

**Pendências Etapa 3:**
1. Criar `DataRow` genérico reutilizável
2. Migrar `ClientesListagem` para PageHeader + DataRow
3. Migrar `ClienteDetalhe` para PageHeader + ProjectSummaryCard + DataRow
4. Validação: zero classes shadcn nos componentes migrados

---

## Etapa 3 — Completar Pendências

### Decisões Arquiteturais

**DataRow genérico vs. clones específicos:**
A spec Figma (`design-system-figma-naming.md`) define a anatomia do DataRow com slots para `primaryInfo`, `textContent`, `statusSlot` e `actionsGroup`. O token `dataRow` em `colors.json` é genérico (8 CSS vars: default/hover × bg/border/title + header). DataRowProjects é um consumidor desse token. Em vez de clonar DataRowProjects para cada entidade, criar um componente base `DataRow` com composição por props.

**ProjectSummaryCard:**
Manter específico (não generalizar). Se ClienteDetalhe precisar do mesmo padrão visual, reutilizar diretamente o componente passando fields diferentes.

### Tarefa 3.1: Criar DataRow genérico

**Arquivo**: `src/components/data-row.tsx`

**Especificação:**
```tsx
type DataRowProps = {
  href: string
  title: string
  metadata?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
}
```

**Implementação:**
- Token: `--ds-color-component-data-row-*` (default/hover × bg/border/title)
- Tipografia: `--ds-typography-size-base` (title), `--ds-typography-size-sm` (metadata)
- Container: `group flex items-center justify-between gap-4 border-b px-4 py-3 transition-colors`
- Title: Link com `text-[var(--ds-color-component-data-row-default-title)]`, hover via `group-hover`
- Metadata: `text-ds-muted` no tamanho sm
- Trailing: slot livre (badge, botões de ação, ou qualquer ReactNode)
- Referência de implementação: `data-row-projects.tsx` (copiar padrão de classes)

**Uso previsto:**
```tsx
// Em ProjetosListagem (se refatorar — opcional)
<DataRow href={`/projetos/${id}`} title={nome}
  metadata={<><span>{clienteNome}</span><span>{data}</span></>}
  trailing={<Badge variant="purple">{status}</Badge>}
/>

// Em ClientesListagem
<DataRow href={`/clientes/${id}`} title={nome}
  metadata={<>{empresa && <span>{empresa}</span>}{email && <span>{email}</span>}</>}
  trailing={<div className="flex items-center gap-1"><EditarBtn/><ExcluirBtn/></div>}
/>
```

**Nota:** DataRowProjects existente pode ser refatorado para usar DataRow genérico ou mantido como está. Decisão de refatoração posterior, não bloqueia Etapa 3.

---

### Tarefa 3.2: Migrar ClientesListagem

**Arquivo**: `src/app/(internal)/clientes/_components/clientes-listagem.tsx`

**Estado atual:**
- `<h1>` manual + `<Button>` solto (linha 71)
- Divs de linha manual com classes genéricas (linhas 87-149)
- `text-muted-foreground` (shadcn) em vez de DS tokens
- `font-medium text-primary` (shadcn) para links

**Mudanças:**
1. Substituir `<h1>` + botão → `<PageHeader title="Clientes" actions={<ClienteFormModal .../>}>`
2. Substituir divs de linha → `<DataRow>` para cada cliente:
   - `href={/clientes/${id}}`
   - `title={nome}`
   - `metadata` com empresa_organizacao + email_principal (dados já disponíveis em `getClientes()`)
   - `trailing` com botões Editar (ClienteFormModal) + Excluir (AlertDialog)
3. Container da lista: `rounded-lg border border-[var(--ds-color-component-data-row-default-border)]`
4. Empty state: `text-ds-muted` em vez de `text-muted-foreground`

**Dados da query `getClientes()`:**
`id`, `nome`, `empresa_organizacao`, `email_principal`, `created_at` — todos disponíveis, sem necessidade de atualizar a query.

---

### Tarefa 3.3: Migrar ClienteDetalhe

**Arquivo**: `src/app/(internal)/clientes/_components/cliente-detalhe.tsx`

**Estado atual:**
- Breadcrumb manual com `text-muted-foreground` (linhas 66-72)
- Header manual com `<h1>` + botões inline (linhas 75-111)
- Grid de info com `text-muted-foreground` repetido 9x (linhas 115-142)
- Lista de projetos com markup manual (linhas 150-166)
- Zero DS tokens usados

**Mudanças:**

| Elemento atual | Substituir por |
|---|---|
| Breadcrumb manual (linhas 66-72) | `PageHeader` com `breadcrumbs={[{label:"Clientes",href:"/clientes"},{label:nome}]}` |
| `<h1>` + botões (linhas 75-111) | `PageHeader` com `title={nome}` e `actions={editar+excluir}` |
| Grid info (linhas 115-142) | `ProjectSummaryCard` com fields do cliente |
| Lista projetos (linhas 150-166) | `DataRow` ou `DataRowProjects` para cada projeto |
| `text-muted-foreground` (9x) | `text-ds-muted` |
| `text-foreground` | `text-ds-heading` |
| `text-primary` | Var DS equivalente |

**Fields para ProjectSummaryCard:**
```tsx
<ProjectSummaryCard fields={[
  { label: 'Empresa', value: empresa_organizacao },
  { label: 'Email', value: email_principal },
  { label: 'Telefone', value: telefone_contato },
  { label: 'Observações', value: observacoes, colSpan: 2 },
  { label: 'Criado em', value: formatDate(created_at) },
  { label: 'Atualizado em', value: formatDate(updated_at) },
]} />
```

---

### Tarefa 3.4: Validação Final

**Critérios de aceitação (Etapa 3 finalizada):**
- [ ] DataRow genérico criado em `src/components/data-row.tsx`
- [ ] ClientesListagem migrada: PageHeader + DataRow, sem markup manual
- [ ] ClienteDetalhe migrado: PageHeader + ProjectSummaryCard + DataRow/DataRowProjects
- [ ] Zero `text-muted-foreground` nos componentes migrados
- [ ] Zero `text-foreground` ou `text-primary` soltos
- [ ] Cores e tipografia 100% via CSS vars DS
- [ ] Hover states funcionais em DataRow
- [ ] Links para detalhe funcionais
- [ ] Ações (Editar/Excluir) funcionais em ClientesListagem e ClienteDetalhe
- [ ] Espaçamento respeita escala (4, 8, 12, 16, 24, 32, etc.)

---

## Etapa 4 — Validação e Refinamento com Figma MCP

**Bloco inicial:** Quando URL Figma file for compartilhada.

### Princípio: Granular + Seguro

Não usar MCP para gerar snapshots de páginas inteiras. Para **cada componente**:

1. Capturar design context do node específico no Figma (screenshot + metadata)
2. Implementar ou refinar o componente no código
3. Validar visualmente contra o design
4. Se reutilizável, conectar via Code Connect

> **Nota:** Os parâmetros exatos das ferramentas MCP (get_design_context, add_code_connect_map, etc.) devem ser verificados contra o schema real no início da Etapa 4. Não assumir nomes de parâmetros antes dessa verificação.

### Componentes Prioritários para MCP

#### Phase 4a: Validar Componentes Existentes

**Button** + **Badge**:
- Capturar design context nos nodes Button + Badge no Figma
- Comparar variantes DS com implementação
- Validar alinhamento de cores, tipografia, spacing
- Se divergências: atualizar componente ou token

**DataRow**:
- Capturar design context de "Data Row" node
- Validar default/hover states
- Validar espaçamento entre elementos (título, metadados, trailing)
- Comparar com código

#### Phase 4b: Implementar Componentes Novos

Quando novos componentes forem necessários:
- **Fases**: FaseCard, FaseForm (expandir implementação existente)
- **Timeline**: TimelineEvent, TimelineCard
- **Horas**: HorasTable, HorasChart (se especificado em PRD-06)

**Para cada componente:**
```
1. Identificar node no Figma
2. Capturar design context (screenshot + metadata)
3. Implementar respeitando tokens DS
4. Comparar implementação vs design
5. Se estável, conectar via Code Connect
```

**Critério de aceitação (Etapa 4 finalizada):**
- [ ] Componentes existentes validados contra Figma
- [ ] Novos componentes de Fases/Timeline/Horas implementados + validados
- [ ] Todos componentes usam CSS vars DS (zero hardcoded colors)
- [ ] MCP capaz de prover design context para revisão visual sem inspeção manual contínua

---

## Etapa 5 — Code Connect Progressivo

**Começa após Etapa 4a (validação de componentes existentes).**

### Componentes de Prioridade 1

1. **Button** — variantes filled-brand, filled-neutral, outline-brand, outline-neutral
   - Source: `src/components/ui/button.tsx`

2. **Badge** — 7 variantes de cor
   - Source: `src/components/ui/badge.tsx`

3. **DataRow** — componente genérico
   - Source: `src/components/data-row.tsx`

### Componentes de Prioridade 2

4. **ProjectSummaryCard**
   - Source: `src/app/(internal)/projetos/_components/project-summary-card.tsx`

5. **PageHeader** + **PageTabs**
   - Source: `src/components/page-header.tsx`
   - Source: `src/components/page-tabs.tsx`

> **Nota:** Os parâmetros exatos do Code Connect MCP devem ser verificados contra o schema real das ferramentas disponíveis antes de executar mapeamentos.

**Critério de aceitação (Etapa 5 finalizada):**
- [ ] Button + Badge mapeados via Code Connect
- [ ] DataRow mapeado via Code Connect
- [ ] ProjectSummaryCard mapeado via Code Connect
- [ ] PageHeader + PageTabs mapeados via Code Connect

---

## Etapa 6 — Formalizar Spacing Tokens

**Bloco futuro**, não bloqueia Etapas 3-5.

### Objetivo

Trazer espaçamento para a mesma formalidade de cores/tipografia:
- Adicionar `spacing.json` em `specs/design-system/tokens/`
- Escala: 4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 72, 80, 96, 120 (px)
- Gerar CSS vars `--ds-spacing-*`
- Mapear para Tailwind utilities `gap-ds-*`, `p-ds-*`, etc.

### Por Que Agora Ainda Não?

Espaçamento é automaticamente capturado via auto layout no Figma. Componentes existentes já respeitam a escala manualmente (`gap-3`=12px, `gap-4`=16px, `px-4`=16px, `py-3`=12px).

Quando implementar:
1. Editar `spacing.json` com escala
2. Atualizar script `generate-css-tokens.mjs` para processar spacing
3. Executar script → gera CSS vars
4. Mapear Tailwind `@theme inline`
5. Refatorar componentes para usar utilities `gap-ds-*`, `p-ds-*`

**Critério de aceitação (Etapa 6 finalizada):**
- [ ] spacing.json criado com escala formalizada
- [ ] CSS vars de spacing geradas
- [ ] Componentes refatorados para usar utilities spacing DS
- [ ] Zero espaçamento arbitrário no código

---

## Princípios Guia

### 1. Repository as Source of Truth
- JSON tokens (`colors.json`, `typography.json`) são a origem oficial
- Figma **consome** esses tokens, não os define

### 2. Tokens Before Components
- Sempre formalizar token em JSON antes de usar em componentes
- Evita hex solto, tamanhos arbitrários, spacing fora da escala

### 3. Granular + Seguro
- MCP é ferramenta de **leitura** (design context)
- Não usar MCP para gerar markup de páginas inteiras
- Componente por componente, com validação visual contínua

### 4. Code Connect = Linkagem, Sem Geração
- Code Connect conecta Figma ↔ repositório
- Reduz divergência, não substitui implementação manual

### 5. Figma Naming Informa, Sem Ditar
- Anatomia Figma (actionsGroup, statusSlot, etc.) serve como referência
- Estrutura de código é decidida pela praticidade, não por espelhamento do Figma
- Apenas divergir do naming Figma quando o contrato visual divergir

### 6. Escalabilidade
- Adicionar novos tokens: editar JSON + rodar script
- Adicionar novos componentes: implementar em código + Code Connect
- Sistema cresce linearmente, não exponencialmente em complexidade

---

## Arquivos Críticos e Fluxos

### Arquivos de Tokens

| Arquivo | Propósito | Editar? |
|---|---|---|
| `specs/design-system/tokens/colors.json` | Primitives → Semantic → Component | ✅ Sim (conforme necessário) |
| `specs/design-system/tokens/typography.json` | Sizes, weights, line-heights, presets | ✅ Sim (conforme necessário) |
| `specs/design-system/scripts/generate-css-tokens.mjs` | Converte JSON → CSS vars | ✅ Sim (adicionar domínios novos) |
| `src/app/design-system-tokens.css` | CSS vars geradas | ❌ **NUNCA** (gerado automaticamente) |
| `src/app/globals.css` | Import + @theme mapping | ✅ Sim (adicionar utilities novas) |

### Arquivos de Componentes

| Arquivo | Propósito | Status |
|---|---|---|
| `src/components/page-header.tsx` | Header semântico reutilizável | ✅ Pronto |
| `src/components/page-tabs.tsx` | Tabs semânticas reutilizáveis | ✅ Pronto |
| `src/components/ui/button.tsx` | Button com variantes DS | ✅ Pronto + variants |
| `src/components/ui/badge.tsx` | Badge com 7 variantes DS | ✅ Pronto + variants |
| `src/components/data-row.tsx` | DataRow genérico reutilizável | 🔄 **CRIAR** |
| `src/app/(internal)/projetos/_components/data-row-projects.tsx` | Data Row para projetos (específico) | ✅ Pronto |
| `src/app/(internal)/projetos/_components/project-summary-card.tsx` | Summary card para projeto | ✅ Pronto |
| `src/app/(internal)/clientes/_components/clientes-listagem.tsx` | Listagem com PageHeader + DataRow | 🔄 **MIGRAR** |
| `src/app/(internal)/clientes/_components/cliente-detalhe.tsx` | Detalhe com PageHeader + SummaryCard | 🔄 **MIGRAR** |

### Tokens com Componentes Pendentes de Implementação

| Token (colors.json) | CSS vars geradas | Componente no código |
|---|---|---|
| `menuItem` | ✅ Sim | ❌ Sem componente DS |
| `buttonIcon` | ✅ Sim | ❌ Sem componente DS |
| `iconTile` | ✅ Sim | ❌ Sem componente DS |

> Esses tokens existem para uso futuro. Não bloqueiam a Etapa 3. Componentes serão implementados quando necessários no contexto de DataRow ou outras features.

### Queries Relevantes

| Arquivo | Propósito | Atualizar? |
|---|---|---|
| `src/queries/cliente.queries.ts` | `getClientes()` retorna: id, nome, empresa_organizacao, email_principal, created_at | Não (dados suficientes para DataRow) |
| `src/queries/cliente.queries.ts` | `getClienteById()` retorna todos campos + telefone + observações | Não (dados suficientes para SummaryCard) |

---

## Referências

- `CLAUDE.md` — instruções globais do projeto
- `specs/design-system/foundations/design-system-colors.md` — arquitetura 3 camadas (primitive → semantic → component)
- `specs/design-system/foundations/design-system-typography.md` — tipografia, escala, baseline grid 4px
- `specs/design-system/foundations/design-system-figma-naming.md` — anatomia de componentes, naming, divergence triggers
- `specs/design-system/tokens/colors.json` — fonte oficial de cores (9 component namespaces)
- `specs/design-system/tokens/typography.json` — fonte oficial de tipografia

---

## Notas Finais

- **Figma file URL**: Pendente — necessária para iniciar Etapas 4-5
- **Design System branch**: `modulo/design-system-frontend` (branch atual)
- **No breaking changes**: Migração respeita funcionalidade existente, substitui apenas markup/styling
- **DataRowProjects**: Não será refatorado para usar DataRow genérico nesta etapa. Decisão de migração posterior.

---

**Documento criado**: 2026-03-16
**Última revisão**: 2026-03-16 (v2 — correções pós-análise de specs e código)
**Próxima revisão**: Após Etapa 3 finalizada
