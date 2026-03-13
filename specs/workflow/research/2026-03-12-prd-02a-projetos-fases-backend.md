---
date: 2026-03-12T22:00:00-03:00
researcher: Claude
git_commit: 8e3d7da
branch: dev
repository: gestao-projetos
topic: "PRD-02a — Projetos + Fases Backend: schemas, queries, services (R1/R2), actions"
tags: [research, projeto, fase, service, r1, r2, backend]
status: complete
last_updated: 2026-03-12
last_updated_by: Claude
---

# Research: PRD-02a — Projetos + Fases Backend

**Date**: 2026-03-12T22:00:00-03:00
**Git Commit**: 8e3d7da
**Branch**: dev
**Repository**: gestao-projetos
**Research Mode**: Mixed (código existente + PRD não implementado)

## Research Question

Mapear o estado atual do codebase e das specs para preparar a implementação do PRD-02a (Projetos + Fases Backend) — incluindo schema Prisma, padrões estabelecidos pelo PRD-01, regras de negócio R1/R2, e infraestrutura existente.

## Summary

O PRD-02a é o primeiro PRD a introduzir a camada `services/` — até agora vazia. O schema Prisma já define completamente os modelos `Projeto` e `Fase` com todos os campos, enums e cascatas. A camada de queries, actions e schemas Zod precisa ser criada do zero para essas entidades. O codebase já tem referências a projetos no módulo de clientes (links, tipos, queries) que serão consumidores do que o PRD-02a produz.

**8 arquivos a criar**, nenhum a modificar:
- 2 schemas Zod (`projeto.schema.ts`, `fase.schema.ts`)
- 2 queries (`projeto.queries.ts`, `fase.queries.ts`)
- 2 services (`projeto.service.ts`, `fase.service.ts`)
- 2 actions (`projeto.actions.ts`, `fase.actions.ts`)

---

## Detailed Findings

### 1. Schema Prisma — Modelos Já Existentes

Os modelos `Projeto` e `Fase` já estão completos no schema Prisma. Nenhuma migration é necessária.

#### Modelo `Projeto` (`prisma/schema.prisma:76-102`)

| Campo | Tipo Prisma | Obrigatório |
|---|---|---|
| `id` | `String @id @default(uuid()) @db.Uuid` | sim |
| `cliente_id` | `String @db.Uuid` | sim |
| `nome` | `String` | sim |
| `descricao` | `String? @db.Text` | não |
| `status` | `StatusProjeto` (enum) | sim |
| `data_inicio` | `DateTime @db.Date` | sim |
| `previsao_entrega` | `DateTime? @db.Date` | não |
| `data_conclusao_real` | `DateTime? @db.Date` | não |
| `fase_atual_id` | `String? @db.Uuid` | não |
| `created_at` | `DateTime @default(now())` | sim |
| `updated_at` | `DateTime @updatedAt` | sim |

**Relações:** `cliente` (Cascade), `fases[]`, `lancamentos_horas[]`, `reunioes[]`, `decisoes[]`, `checkpoints[]`, `pendencias[]`, `documentos[]`, `mudancas_direcao[]`, `eventos_timeline[]`

**Index:** `@@index([cliente_id])`, mapeado para tabela `"projetos"`

#### Modelo `Fase` (`prisma/schema.prisma:104-132`)

| Campo | Tipo Prisma | Obrigatório |
|---|---|---|
| `id` | `String @id @default(uuid()) @db.Uuid` | sim |
| `projeto_id` | `String @db.Uuid` | sim |
| `nome` | `String` | sim |
| `descricao` | `String? @db.Text` | não |
| `ordem` | `Int` | sim |
| `status` | `StatusFase` (enum) | sim |
| `data_inicio_prevista` | `DateTime? @db.Date` | não |
| `data_fim_prevista` | `DateTime? @db.Date` | não |
| `data_inicio_real` | `DateTime? @db.Date` | não |
| `data_fim_real` | `DateTime? @db.Date` | não |
| `is_fase_geral` | `Boolean` | sim |
| `created_at` | `DateTime @default(now())` | sim |
| `updated_at` | `DateTime @updatedAt` | sim |

**Relações:** `projeto` (Cascade), `tarefas[]`, `lancamentos_horas[]`, `reunioes[]`, `decisoes[]`, `checkpoints[]`, `pendencias[]`, `documentos[]`, `mudancas_direcao[]`, `eventos_timeline[]`

**Index:** `@@index([projeto_id])`, mapeado para tabela `"fases"`

#### Enums

**`StatusProjeto`** (`prisma/schema.prisma:13-20`): `rascunho` · `ativo` · `aguardando_cliente` · `pausado` · `concluido` · `arquivado`

**`StatusFase`** (`prisma/schema.prisma:22-29`): `nao_iniciada` · `em_andamento` · `aguardando_cliente` · `concluida` · `pausada` · `cancelada`

#### Comportamento de Cascata

- **Deletar Cliente** → cascateia para Projetos → cascateia para Fases → cascateia para Tarefas + Horas
- **Deletar Projeto** → cascateia para Fases, Horas, Reuniões, Decisões, Checkpoints, Pendências, Documentos, Mudanças, Timeline
- **Deletar Fase** → cascateia para TarefaPlanejada (`onDelete: Cascade`, linha 145) e LancamentoHoras (`onDelete: Cascade`, linha 162)
- **Deletar Fase** → Reuniões, Decisões, etc. usam `onDelete: SetNull` (perdem referência mas não são deletados)

---

### 2. Padrões Estabelecidos pelo PRD-01

O PRD-01 (Clientes CRUD) definiu os padrões que o PRD-02a deve seguir. Documentados por arquivo:

#### Schema Zod (`src/types/schemas/cliente.schema.ts`)

```typescript
import { z } from 'zod'

export const ClienteFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  // ... campos opcionais com .optional()
})

export type ClienteFormData = z.infer<typeof ClienteFormSchema>
```

**Padrões:**
- Export nomeado `const` para o schema
- Export nomeado `type` inferido do schema
- Mensagens de erro em português
- Campos opcionais usam `.optional()` ou `.optional().or(z.literal(''))`

#### Queries (`src/queries/cliente.queries.ts`)

```typescript
import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

export const getClientes = cache(async () => {
  return db.cliente.findMany({
    select: { id: true, nome: true, /* ... */ },
    orderBy: { nome: 'asc' },
  })
})
```

**Padrões:**
- `import 'server-only'` no topo
- Todas as queries wrapped com `cache()` do React
- Export nomeado como `const`
- `select` explícito — nunca retorna entidade completa
- `orderBy` para resultados determinísticos
- List view seleciona menos campos que detail view

#### Actions (`src/actions/cliente.actions.ts`)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ClienteFormSchema, type ClienteFormData } from '@/types/schemas/cliente.schema'

export async function criarClienteAction(data: ClienteFormData) {
  const parsed = ClienteFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }
  await requireAuth()
  try {
    await db.cliente.create({ data: parsed.data })
  } catch {
    return { success: false as const, error: 'Erro ao criar cliente.' }
  }
  revalidatePath('/clientes')
  return { success: true as const }
}
```

**Padrões:**
- `'use server'` no topo do arquivo
- Export nomeado como `async function`
- Validação Zod com `safeParse()` → check `!parsed.success`
- `await requireAuth()` após validação, antes do DB
- Try-catch em operações de banco
- Retorno: `{ success: true as const }` ou `{ success: false as const, error: string }`
- `revalidatePath()` antes do return de sucesso
- Editar revalida lista + detalhe: `revalidatePath('/clientes')` + `revalidatePath('/clientes/' + id)`
- Excluir não faz validação Zod (sem payload de dados)

---

### 3. Regras de Negócio R1 e R2

#### R1 — Criar Projeto Cria Fase Geral Automática

**Definição:** `specs/foundation/02_dominio.md:55`
> "Ao criar um projeto, o sistema cria automaticamente a fase Geral do projeto (`is_fase_geral = true`)"

**Fluxo** (`specs/foundation/02_dominio.md:354-362`):
1. Usuário seleciona cliente existente
2. Informa dados do projeto (nome, status, data_inicio, etc.)
3. Sistema cria automaticamente a fase Geral: `is_fase_geral = true`, `ordem = 1`, `status = nao_iniciada`
4. Usuário pode criar fases adicionais e reordená-las (exceto a Geral)

**Implementação definida** (`specs/foundation/03_arquitetura.md:297-310`):
```typescript
// services/projeto.service.ts
export async function criar(data: CriarProjetoInput) {
  return await db.$transaction(async (tx) => {
    const projeto = await tx.projeto.create({ data })
    await tx.fase.create({
      data: { projetoId: projeto.id, nome: "Geral do projeto",
              ordem: 1, status: "nao_iniciada", isFaseGeral: true },
    })
    // timeline event — PRD-07a, não neste PRD
    return projeto
  })
}
```

**Onde:** `services/projeto.service.ts` em `$transaction`

#### R2 — Fase Geral Não Pode Ser Excluída/Reordenada

**Definição:** `specs/foundation/02_dominio.md:85-87`
- Cada projeto tem exatamente uma fase com `is_fase_geral = true`
- A fase geral sempre ocupa a primeira posição e não pode ser reordenada
- As demais fases podem ser reordenadas pelo usuário

**Regras de exclusão** (`specs/foundation/02_dominio.md:422-428`):
- Qualquer fase criada manualmente pode ser excluída
- A fase **Geral do projeto não pode ser excluída**
- Ao excluir uma fase: tarefas e horas cascateiam (`onDelete: Cascade`)

**Onde:** `services/fase.service.ts` — verifica `is_fase_geral` antes de excluir/reordenar

---

### 4. Estado Atual do Codebase — O Que Existe vs O Que Falta

| Camada | Estado | Arquivos |
|---|---|---|
| `src/services/` | Vazio — apenas `.gitkeep` | Nenhum service criado |
| `src/queries/` | Apenas `cliente.queries.ts` | `getProjetosDoCliente()` já referencia tabela `projeto` |
| `src/actions/` | Apenas `cliente.actions.ts` | Nenhuma action de projeto/fase |
| `src/types/schemas/` | Apenas `cliente.schema.ts` | Nenhum schema de projeto/fase |
| `src/app/(internal)/projetos/` | Não existe | Diretório inexistente (UI é PRD-02b) |
| `src/proxy.ts` | `/projetos` protegido | Linha 4: `'/projetos'` em `internalPrefixes` |

#### Referências Existentes a Projetos no Código

O módulo de clientes (PRD-01) já referencia projetos em 4 pontos:

1. **`src/queries/cliente.queries.ts:34-46`** — `getProjetosDoCliente(clienteId)` consulta a tabela `projeto` com `select: { id, nome, status, data_inicio, previsao_entrega }`
2. **`src/app/(internal)/clientes/_components/cliente-detalhe.tsx:33-39`** — define tipo `ProjetoListItem` com `{ id, nome, status, data_inicio, previsao_entrega }`
3. **`src/app/(internal)/clientes/_components/cliente-detalhe.tsx:155-156`** — links para `/projetos/${projeto.id}` (rota ainda não existe)
4. **`src/app/(internal)/clientes/_components/clientes-listagem.tsx:133`** — mensagem de cascata: "Todos os projetos e dados vinculados serão removidos permanentemente"

---

### 5. Fluxo Canônico de Mutação

**Definido em** `specs/foundation/03_arquitetura.md:253-279`:

```
component ("use client") → action ("use server") → service (se cross-entity) → lib/db
```

**Regras da camada services** (`specs/foundation/03_arquitetura.md:365-371`):
- ✅ Executar regras cross-entity
- ✅ Coordenar operações em `db.$transaction()`
- ✅ Chamar outros services
- ✅ Acessar `lib/db` diretamente
- ❌ Conhecer HTTP, cookies, headers, redirect, UI ou Zod schemas
- ❌ Chamar actions ou queries

**Decisão para PRD-02a:**
- `criarProjetoAction` → chama `projetoService.criarProjeto()` (cross-entity: projeto + fase)
- `editarProjetoAction` → `db` direto (operação simples)
- `excluirProjetoAction` → `db` direto (cascata é do Prisma)
- `excluirFaseAction` → chama `faseService.excluirFase()` (verifica R2)
- `reordenarFasesAction` → chama `faseService.reordenarFases()` (verifica R2)

---

### 6. Rotas que Consumirão os Dados do PRD-02a

Definidas em `specs/foundation/05_urls.md`:

| Rota | Query necessária | PRD da UI |
|---|---|---|
| `/projetos` | `getProjetosFiltrados({ status, clienteId })` | PRD-02b |
| `/projetos/novo` | `getClientesParaSelect()` | PRD-02b |
| `/projetos/[id]` | `getProjetoById(id)` | PRD-02b |
| `/projetos/[id]/fases` | `getFasesByProjeto(id)` com tarefas aninhadas | PRD-02c |
| `/projetos/[id]/timeline` | `getTimelineInterna(id)` | PRD-07b |
| `/projetos/[id]/horas` | `getTotalHorasPorFase(id)` | PRD-06 |
| `/clientes/[id]` | `getProjetosDoCliente(id)` — já existe | PRD-01 ✅ |

**Nota sobre `/projetos/novo`:** página dedicada (não modal) por decisão arquitetural — formulário complexo com URL compartilhável (`specs/foundation/05_urls.md:122`).

**Nota sobre `/projetos/[id]`:** tem layout próprio com nav por abas (Visão Geral, Fases, Timeline, Horas). Layout carrega dados via `React.cache()` e compartilha com sub-rotas.

---

### 7. Nota sobre Timeline

O exemplo de `criarProjeto` na spec de arquitetura (`03_arquitetura.md:297-310`) inclui a criação de evento `projeto_criado` na timeline. No entanto, o PRD-02a **não implementa timeline** — o `timeline.service.ts` será criado no PRD-07a. O service de criação de projeto neste PRD deve criar apenas o projeto + fase Geral, sem evento de timeline.

---

### 8. Campos Prisma vs Campos Zod — Mapeamento

#### Projeto

| Campo Prisma | Campo no Zod Schema | Notas |
|---|---|---|
| `nome` | `nome` | obrigatório |
| `cliente_id` | `cliente_id` | UUID, obrigatório |
| `descricao` | `descricao` | opcional |
| `status` | `status` | enum, obrigatório |
| `data_inicio` | `data_inicio` | `z.coerce.date()`, obrigatório |
| `previsao_entrega` | `previsao_entrega` | `z.coerce.date()`, opcional/nullable |
| `data_conclusao_real` | `data_conclusao_real` | `z.coerce.date()`, opcional/nullable |
| `id` | — | gerado pelo banco |
| `fase_atual_id` | — | não no form (gerenciado internamente) |
| `created_at` | — | automático |
| `updated_at` | — | automático |

#### Fase

| Campo Prisma | Campo no Zod Schema | Notas |
|---|---|---|
| `nome` | `nome` | obrigatório |
| `descricao` | `descricao` | opcional |
| `status` | `status` | enum, obrigatório |
| `data_inicio_prevista` | `data_inicio_prevista` | `z.coerce.date()`, opcional/nullable |
| `data_fim_prevista` | `data_fim_prevista` | `z.coerce.date()`, opcional/nullable |
| `data_inicio_real` | `data_inicio_real` | `z.coerce.date()`, opcional/nullable |
| `data_fim_real` | `data_fim_real` | `z.coerce.date()`, opcional/nullable |
| `id` | — | gerado pelo banco |
| `projeto_id` | — | passado como parâmetro da action, não no form |
| `ordem` | — | calculado automaticamente |
| `is_fase_geral` | — | controlado pelo sistema |
| `created_at` | — | automático |
| `updated_at` | — | automático |

---

## References

- `prisma/schema.prisma:13-20` — enum StatusProjeto
- `prisma/schema.prisma:22-29` — enum StatusFase
- `prisma/schema.prisma:76-102` — modelo Projeto com relações e cascatas
- `prisma/schema.prisma:104-132` — modelo Fase com relações e cascatas
- `prisma/schema.prisma:134-149` — modelo TarefaPlanejada (cascata de Fase)
- `prisma/schema.prisma:151-167` — modelo LancamentoHoras (cascata de Fase)
- `src/types/schemas/cliente.schema.ts` — padrão Zod schema estabelecido
- `src/queries/cliente.queries.ts` — padrão de queries com cache/select
- `src/actions/cliente.actions.ts` — padrão de actions com safeParse/requireAuth/try-catch
- `src/lib/db.ts` — Prisma singleton
- `src/lib/auth.ts` — requireAuth com React.cache()
- `src/services/.gitkeep` — diretório vazio, primeiro service será criado neste PRD
- `src/proxy.ts:4` — `/projetos` já protegido como rota interna
- `src/queries/cliente.queries.ts:34-46` — getProjetosDoCliente já referencia tabela projeto
- `src/app/(internal)/clientes/_components/cliente-detalhe.tsx:33-39` — tipo ProjetoListItem já definido
- `specs/foundation/02_dominio.md:55` — definição R1 (fase Geral automática)
- `specs/foundation/02_dominio.md:85-87` — definição R2 (fase Geral imutável)
- `specs/foundation/02_dominio.md:354-362` — fluxo de criação de projeto
- `specs/foundation/02_dominio.md:422-428` — regras de exclusão de fases
- `specs/foundation/03_arquitetura.md:253-279` — fluxo canônico de mutação
- `specs/foundation/03_arquitetura.md:297-310` — exemplo R1 em service com $transaction
- `specs/foundation/03_arquitetura.md:365-371` — regras da camada services
- `specs/foundation/05_urls.md:100-108` — rota /projetos (listagem)
- `specs/foundation/05_urls.md:112-122` — rota /projetos/novo (criação)
- `specs/foundation/05_urls.md:126-146` — rota /projetos/[id] (detalhe com abas)
- `specs/foundation/05_urls.md:150-159` — rota /projetos/[id]/fases
- `specs/prds/prd-02a-projetos-fases-backend.md` — PRD completo

## Design & Decisions

### Padrões a seguir (derivados do PRD-01)

1. **Zod schemas:** `export const EntityFormSchema` + `export type EntityFormData = z.infer<>`
2. **Queries:** `import 'server-only'` + `cache()` wrapper + `select` explícito + `orderBy`
3. **Actions:** `'use server'` + `safeParse()` + `requireAuth()` + try-catch + `{ success: true/false as const }`
4. **Services:** `db.$transaction()` para operações cross-entity, sem conhecer HTTP/UI/Zod
5. **Nomenclatura Prisma:** campos em `snake_case` (conforme schema existente)

### Decisão: Timeline adiada

O PRD-02a não cria eventos de timeline ao criar projeto. O `timeline.service.ts` será implementado no PRD-07a. O service `criarProjeto` cria apenas projeto + fase Geral.

### Decisão: `fase_atual_id` fora do form

O campo `fase_atual_id` do Projeto não é incluído no `ProjetoFormSchema` — será gerenciado internamente pela UI quando o usuário selecionar a fase atual (PRD-02b/02c).

## Open Questions

1. **`getProjetoById` — quais campos retornar no select?** O PRD diz "todos os campos do projeto" + cliente + fases. A spec de arquitetura (`04_nextjs.md:194-201`) mostra um exemplo com campos selecionados. Definir o `select` completo na implementação.

2. **`criarProjetoAction` retorna `projetoId`?** O PRD define `{ success: true, projetoId: string }` para redirect. O padrão do PRD-01 retorna apenas `{ success: true as const }`. Será uma extensão do padrão.

3. **Ordem de validação nas fase actions:** `criarFaseAction` precisa calcular `max(ordem) + 1` antes de criar. Isso requer uma query adicional dentro da action — fazer em transação ou em sequência simples?
