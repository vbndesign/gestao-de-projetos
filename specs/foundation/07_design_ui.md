# 07 — Design & Frontend: Integração de Figma no Fluxo

## Overview

Este documento formaliza como **Figma entra no processo de desenvolvimento de frontend** para evitar o padrão de "UI técnica primeiro, design depois = retrabalho visual garantido".

**Problema resolvido**: Antes, o fluxo PRD → research → plan → implement não tinha um "slot" para decisões visuais. Frontend nascia tecnicamente correto mas visualmente inconsistente, exigindo refatoração posterior contra Figma.

**Solução**: Inserir contexto de design no ponto certo do fluxo — antes do create_plan de frontend, não depois. Isso é feito de forma leve, sem criar máquina pesada de processo.

---

## Princípios Guia

### 1. Figma é Source of Context Visual, não Source of Truth de Tokens
- JSON tokens (`specs/design-system/tokens/`) é a origem oficial de cores, tipografia, espaçamento
- Figma **consome** esses tokens, não os define
- MCP é ferramenta de **leitura** (design context), não de geração

### 2. Backend-First para Dados e Regras, Design-Informed para UI
- Entidades, queries, actions, services são planejados sem depender de Figma
- Frontend é planejado **depois** que o contrato de dados está claro, **com** contexto de Figma
- Figma entra para informar layout, estados, hierarquia — não para ditar tecnologia ou estrutura de dados

### 3. Componente por Componente, Nunca Página Inteira
- MCP é usado para consultar design context de **nodes específicos** (Button, DataRow, Card, etc.)
- Nunca para "gerar a página inteira de uma vez"
- Cada componente é validado visualmente antes de passar para a próxima tela

### 4. Estender Biblioteca, Não Reescrever
- `src/components/ui/` contém primitives da biblioteca (Button, Badge, Input, Dialog)
- Modificar primitives apenas por **variant, wrapper ou composição**
- Nunca reescrever a primitive inteira por conveniência de domínio

### 5. Design Contract é Leve, Não Formal
- Não criar documento separado por feature
- Design context fica anexado ao research ou plan existente
- Apenas quando houver ambiguidade visual residual, adicionar nodes Figma para leitura

---

## Quando Figma Entra no Fluxo

### Para Features NOVAS com UI relevante

```
PRD (+ seção Design Reference: nodes Figma, telas, componentes candidatos)
  ↓
research_codebase (+ seção UI Delta: estado atual vs. esperado, Figma nodes a consultar)
  ↓
create_plan (com inventário de componentes antes de começar)
  → Phase A: contrato de dados (queries / actions / services)
  → Phase B: componentes semânticos novos (via Figma MCP)
  → Phase C: composição de telas
  → Phase D: validação visual contra Figma
  ↓
implement_plan
```

### Para Refactors Visuais (e.g., Etapa 3 atual)

```
PRD existente (já tem spec de componentes e tokens)
  ↓
Figma como guia de migração incremental
  → componente por componente
  → DataRow genérico primeiro
  → depois ClientesListagem, ClienteDetalhe
  ↓
implement_plan com validação visual Figma
```

### Para Features SEM UI relevante

Seguir fluxo atual sem exigir Figma:
```
PRD → research → create_plan → implement_plan (sem seções de design)
```

---

## Mudanças nos Prompts/Artefatos

### 1. Template de PRD (`specs/prds/_template.md`)

Adicionar seção obrigatória para features com UI:

```markdown
## Design Reference

### Telas e Fluxos Afetados
[Descrever quais páginas/features têm mudança de UI]

### Figma Nodes
| Tela | Node ID | Status |
|---|---|---|
| [Tela] | node-id: X:Y | [❓ Figma pending / ✅ Disponível] |

### Componentes Candidatos
- [ ] Reutilizar existente: [qual componente, de qual arquivo]
- [ ] Estender primitiva: [qual primitiva, como]
- [ ] Criar novo: [tipo, por quê]

### Tokens Envolvidos
[Listar variáveis visuais: core-brand, semantic-muted, component-button, etc.]
```

### 2. Research Codebase (`specs/workflow/prompts/01_research_codebase.md`)

Adicionar seção **UI Delta** (apenas se a feature tem frontend):

```markdown
## UI Delta (se feature tem UI)

### Estado Atual
[O que existe: componentes, markup, classes usadas]

### Esperado (por Figma)
[O que o design propõe: layout, componentes, states]

### Componentes Reutilizáveis Identificados
[Quais componentes já existentes podem ser usados]

### Nodes Figma a Consultar Antes do Plano
[Links ou node IDs que o create_plan precisa ver]
```

**Nota importante**: Esta seção muda o papel do research de puramente documental para incluir julgamento sobre delta visual. Isso é deliberado — permite que o create_plan já entre com contexto visual.

### 3. Create Plan (`specs/workflow/prompts/02_create_plan.md`)

Adicionar regra:

```
Para features com UI relevante:
- Não planejar frontend visual sem nodes Figma identificados
- Incluir inventário explícito de componentes a criar, reutilizar ou estender
- Decidir se é refactor visual ou nova implementação (afeta phasing)
```

### 4. Implement Plan (`specs/workflow/prompts/03_implement_plan.md`)

Adicionar ordem de execução para features com UI:

```
1. Infraestrutura de dados (queries, actions)
2. Componentes semânticos base (novos ou estendidos)
3. Composição de telas (usando componentes do passo 2)
4. Validação visual contra Figma (via MCP, node por node)
5. Code Connect (apenas se componente estabilizar)
```

---

## Decisão de Componente: Quando Criar, Estender, ou Compor

### Regra Consolidada

```
┌─ One-off instável
│  └─→ compor inline, sem criar componente
│
├─ Padrão estável + anatomia visual clara (mesmo que 1x)
│  └─→ criar componente
│      (semântica de produto, contrato visual definido no Figma)
│
├─ Recorrência em 2+ telas/features
│  └─→ sinal forte de componentização (não lei obrigatória)
│      (valida a decisão de criar, mas não é único critério)
│
├─ Primitive da biblioteca (Button, Badge, Input, Dialog)
│  └─→ estender via variant, wrapper ou composição
│      (nunca reescrever a primitive inteira)
│      (exemplos: Button com nova variante DS, wrapper para campo obrigatório)
│
└─ Code Connect
   └─→ apenas após componente estabilizar em código e Figma
       (pode levar 2+ features ou sprints de validação visual)
```

### Exemplos Práticos

| Situação | Decisão | Por quê |
|---|---|---|
| Campo de input que aparece em 1 formulário apenas | Compor com `<Input/>` do shadcn, sem componente | One-off, sem padrão visual reutilizável |
| DataRow que aparece em Projetos + Clientes + Tarefas, com token próprio no DS | Criar `src/components/data-row.tsx` | Padrão estável, token namespace próprio, 3+ usos previstos |
| Button com nova variante DS (filled-brand) | Estender `src/components/ui/button.tsx` com `cva` variant | Primitive da biblioteca, mudança transversal |
| Página de dashboard com layout único | Compor com `PageHeader` + `DataRow` + `Badge` + layout customizado inline | Específico da página, sem aspecto reutilizável |
| Card para resumo de projeto que pode ser usado em Clientes também | Criar `ProjectSummaryCard` em `src/app/(internal)/projetos/_components/` | Padrão visual claro, 2+ usos previstos, anatomia definida |
| Menu item que pode aparecer em múltiplos contextos | Criar `src/components/menu-item.tsx` | Recorrência previsível, token próprio no DS |

---

## Fluxo de MCP — Como Usar Figma

### Antes: Preparação

1. Identificar node Figma para o componente/tela
2. Garantir que o node tenha `node-id` no URL
3. Copiar link exato: `figma.com/design/[fileKey]/...?node-id=[nodeId]`

### Durante: Leitura com MCP

```
get_design_context(fileKey, nodeId)
  → retorna screenshot + código reference + metadata + hints
  → adaptar para o stack do projeto (Next.js, shadcn/ui, tokens DS)

get_screenshot(fileKey, nodeId)
  → para validação visual rápida

get_metadata(fileKey, nodeId)
  → para entender estrutura de layers e props do componente
```

### Depois: Implementação

- Componente implementado deve respeitar tokens DS (`--ds-color-*`, `--ds-typography-*`)
- Nenhum hex solto, nenhum tamanho arbitrário
- Estados (default, hover, disabled, loading) mapeados do Figma para código
- Validação visual: screenshot de componente implementado vs. Figma

### Code Connect (depois de estabilizar)

```
Quando: componente passou por 2+ cycles de validação visual, está estável
Usar: /figma:code-connect-components ou mcp add_code_connect_map
Resultado: próximas implementações que usem o componente recebem referência real do código
```

---

## Estrutura de Componentes

### Level 1 — Primitives da Biblioteca (src/components/ui/)

```
button.tsx       → Button com variantes DS
badge.tsx        → Badge com 7 cores
input.tsx        → Input (shadcn + estilo DS)
select.tsx       → Select (shadcn + estilo DS)
dialog.tsx       → Dialog (shadcn + estilo DS)
```

**Modificar**: apenas adicionar variantes ou wrappers
**Nunca**: reescrever a lógica interna

### Level 2 — Componentes Semânticos Reutilizáveis (src/components/)

```
page-header.tsx  → Header com breadcrumb + title + actions (2+ telas)
page-tabs.tsx    → Tabs para navegação entre abas (2+ telas)
data-row.tsx     → Linha genérica para listagens (3+ contextos)
```

**Criar quando**: padrão aparece em 2+ features com clareza visual
**Compõem**: Level 1 primitives
**Não compõem**: lógica de negócio ou dados específicos

### Level 3 — Componentes Específicos de Feature (src/app/(internal)/[feature]/_components/)

```
src/app/(internal)/projetos/_components/
  ├─ project-summary-card.tsx   → Grid de campos de projeto
  ├─ data-row-projects.tsx      → Row com colunas de projeto (opcional, pode usar DataRow genérico)

src/app/(internal)/clientes/_components/
  ├─ cliente-form-modal.tsx     → Form de criação/edição de cliente
```

**Criar quando**: padrão visual é específico de uma entidade
**Reutilização**: podem usar Level 2 componentes como base
**Escopo**: apenas a feature específica

---

## Exemplo Prático: Feature Nova "Tarefas"

### Passo 1: PRD (specs/prds/prd-05-tarefas.md)

```markdown
## Design Reference

### Telas Figma
- Listagem de tarefas: node-id: 123:456
- Detalhe de tarefa: node-id: 123:789
- Criar/editar tarefa: node-id: 123:012

### Componentes Candidatos
- Reutilizar: DataRow (para listagem), PageHeader (para header)
- Criar: TaskCard (resumo de tarefa), TaskTimeline (histórico de mudanças)
- Estender: Badge (nova cor: "priority-high")
```

### Passo 2: Research (specs/workflow/research/2026-XX-XX-prd-05-tarefas.md)

```markdown
## UI Delta

### Componentes Reutilizáveis Identificados
- DataRow pode ser usado para listagem de tarefas (já validado em Projetos e Clientes)
- PageHeader é padrão em todo o sistema, usar aqui também

### Figma Nodes a Consultar
- get_design_context no node TaskCard para validar se precisa de novo componente
- get_design_context no node TaskTimeline (provável novo componente)
```

### Passo 3: Create Plan (specs/workflow/plans/2026-XX-XX-prd-05-tarefas.md)

```markdown
## Phase B: Componentes Semânticos

### 1. Estender Badge com nova variante "priority-high"
Arquivo: src/components/ui/badge.tsx
Mudança: adicionar variante ao cva()

### 2. Criar TaskCard (novo)
Arquivo: src/components/task-card.tsx
Base: Level 2 (reutilizável em Dashboard também)
Tokens: --ds-color-component-task-card-*
Figma node: 123:345

### 3. Criar TaskTimeline (novo)
Arquivo: src/app/(internal)/tarefas/_components/task-timeline.tsx
Base: Level 3 (específico de Tarefas)
Figma node: 123:678
```

### Passo 4: Implement Plan

```
Phase A: Backend
  - schema (Tarefa + TarefaTimeline)
  - queries (getTarefas, getTarefaById, etc.)
  - actions (createTarefa, updateTarefa, etc.)

Phase B: Componentes
  - estender Badge com priority-high
  - criar TaskCard (via MCP)
  - criar TaskTimeline (via MCP)

Phase C: Composição
  - TarefasListagem (PageHeader + DataRow + Badge)
  - TarefaDetalhe (PageHeader + TaskCard + TaskTimeline)

Phase D: Validação Visual
  - screenshot vs. Figma node por node
  - ajustes finos de spacing/cor

Phase E: Code Connect (depois de estabilizar)
  - TaskCard → Figma
  - TaskTimeline → Figma
```

---

## Checklist: Antes de Começar Feature com UI

- [ ] PRD tem seção "Design Reference" com nodes Figma identificados
- [ ] Research tem seção "UI Delta" mapeando estado atual vs. esperado
- [ ] Create plan tem inventário explícito de componentes (criar/reutilizar/estender)
- [ ] Create plan não planeja UI visual sem Figma nodes identificados
- [ ] Implementação respeita order: dados → componentes semânticos → telas → validação visual

---

## Referências

- `specs/design-system/foundations/design-system-frontend-implementation.md` — roadmap de Etapas 2-6 do DS
- `specs/design-system/foundations/design-system-colors.md` — arquitetura de tokens (primitive → semantic → component)
- `specs/design-system/foundations/design-system-typography.md` — tipografia, escala, presets
- `specs/design-system/tokens/colors.json` — source of truth de cores
- `specs/design-system/tokens/typography.json` — source of truth de tipografia
- `CLAUDE.md` — instruções gerais do projeto (componentes, fluxo canônico, anti-patterns)

---

**Documento criado**: 2026-03-18
**Versão**: 1.0 (formalização de workflow híbrido Figma + PRD)
