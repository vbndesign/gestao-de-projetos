---
date: "2026-03-13T12:00:00-03:00"
researcher: Claude
git_commit: c76b804
branch: feature/registros-operacionais-prd04a
repository: gestao-projetos
topic: "PRD-04a — Registros Operacionais I — Backend: research de codebase e specs"
tags: [research, prd-04a, registros-operacionais, reuniao, decisao, checkpoint, evento-timeline]
status: complete
last_updated: "2026-03-13"
last_updated_by: Claude
---

# Research: PRD-04a — Registros Operacionais I — Backend

**Date**: 2026-03-13T12:00:00-03:00
**Git Commit**: c76b804
**Branch**: feature/registros-operacionais-prd04a
**Repository**: gestao-projetos
**Research Mode**: Mixed (codebase implementada até PRD-03 + PRD-04a spec-only)

## Research Question

Levantar o estado atual do codebase e specs para implementação do PRD-04a (Registros Operacionais Backend): schemas Zod, queries, service com EventoTimeline sincronizado, e Server Actions para Reunião, Decisão e Checkpoint.

## Summary

O PRD-04a define **6 arquivos novos** e **0 modificações**. Os modelos Prisma (`Reuniao`, `Decisao`, `Checkpoint`, `EventoTimeline`) e o enum `TipoEventoTimeline` já existem no schema e a migration está aplicada. A implementação segue padrões bem estabelecidos no codebase (schemas Zod, queries com `cache()`, services com `$transaction`, Server Actions com `requireAuth()` + Zod + `revalidatePath`). O PRD-04a introduz uma novidade: o **service como camada obrigatória** para todas as operações CRUD (diferente de PRDs anteriores onde services eram opcionais).

---

## Detailed Findings

### 1. Modelos Prisma — Já existem no schema

Os 4 modelos relevantes para o PRD-04a já estão definidos em `prisma/schema.prisma` com migration aplicada.

#### Reuniao (`reunioes`) — linhas 169–189

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `id` | String (UUID) | @id, @default(uuid()) |
| `projeto_id` | String (UUID) | FK → Projeto (Cascade) |
| `fase_id` | String (UUID)? | FK → Fase (SetNull) |
| `titulo` | String | required |
| `data_reuniao` | DateTime | @db.Date |
| `participantes` | String? | @db.Text |
| `link_referencia` | String? | — |
| `resumo_executivo` | String? | @db.Text |
| `ata_resumida` | String? | @db.Text |
| `created_at` | DateTime | @default(now()) |
| `updated_at` | DateTime | @updatedAt |

Relações: `projeto` (Cascade), `fase?` (SetNull), `decisoes[]` (reverse).

#### Decisao (`decisoes`) — linhas 191–212

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `id` | String (UUID) | @id, @default(uuid()) |
| `projeto_id` | String (UUID) | FK → Projeto (Cascade) |
| `fase_id` | String (UUID)? | FK → Fase (SetNull) |
| `reuniao_id` | String (UUID)? | FK → Reuniao (SetNull) |
| `titulo` | String | required |
| `descricao` | String | @db.Text, required |
| `contexto` | String? | @db.Text |
| `impacto` | String? | @db.Text |
| `data_decisao` | DateTime | @db.Date |
| `created_at` | DateTime | @default(now()) |
| `updated_at` | DateTime | @updatedAt |

Relações: `projeto` (Cascade), `fase?` (SetNull), `reuniao?` (SetNull).

#### Checkpoint (`checkpoints`) — linhas 214–231

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `id` | String (UUID) | @id, @default(uuid()) |
| `projeto_id` | String (UUID) | FK → Projeto (Cascade) |
| `fase_id` | String (UUID)? | FK → Fase (SetNull) |
| `titulo` | String | required |
| `resumo` | String | @db.Text, required |
| `proximos_passos` | String? | @db.Text |
| `data_checkpoint` | DateTime | @db.Date |
| `created_at` | DateTime | @default(now()) |
| `updated_at` | DateTime | @updatedAt |

Relações: `projeto` (Cascade), `fase?` (SetNull).

#### EventoTimeline (`evento_timeline`) — linhas 294–314

| Campo | Tipo | Constraints |
|-------|------|-------------|
| `id` | String (UUID) | @id, @default(uuid()) |
| `projeto_id` | String (UUID) | FK → Projeto (Cascade) |
| `fase_id` | String (UUID)? | FK → Fase (SetNull) |
| `tipo_evento` | TipoEventoTimeline | enum, required |
| `titulo` | String | required |
| `descricao` | String? | @db.Text |
| `data_evento` | DateTime | @db.Date |
| `origem_tipo` | String? | Tracks origin entity type |
| `origem_id` | String (UUID)? | References origin entity ID |
| `created_at` | DateTime | @default(now()) |
| `updated_at` | DateTime | @updatedAt |

Indexes: `projeto_id`, `fase_id`, `origem_id`.

#### Enum TipoEventoTimeline — linhas 45–57

Valores relevantes para PRD-04a:
- `reuniao_registrada`
- `decisao_registrada`
- `checkpoint_registrado`

---

### 2. Padrões de Schemas Zod existentes

**Arquivos existentes:** `src/types/schemas/` contém `cliente.schema.ts`, `projeto.schema.ts`, `fase.schema.ts`, `tarefa.schema.ts`.

**Padrão uniforme:**

```ts
import { z } from 'zod'

export const {Entity}FormSchema = z.object({ ... })
export type {Entity}FormData = z.infer<typeof {Entity}FormSchema>
```

**Convenções encontradas:**
- Naming: `{Entity}FormSchema` + `{Entity}FormData`
- Import único: `import { z } from 'zod'`
- Strings obrigatórias: `.min(1, 'Mensagem em pt-BR')`
- Strings com limite: `.max(200)` (usado em `tarefa.schema.ts`)
- Campos opcionais: `.optional()` ou `.optional().nullable()`
- Datas: `z.coerce.date()` com `required_error` ou `error`
- UUIDs: `z.string().uuid()` com `.nullable().optional()` quando FK opcional
- Mensagens: sempre em português brasileiro

**PRD-04a especifica 3 novos schemas** seguindo exatamente esse padrão: `ReuniaoFormSchema`, `DecisaoFormSchema`, `CheckpointFormSchema`.

**Nota importante:** `projeto_id` **não** entra nos schemas — é passado como parâmetro separado nas actions (mesmo padrão de `criarTarefaAction(faseId, data)`).

---

### 3. Padrões de Queries existentes

**Arquivos existentes:** `src/queries/` contém `cliente.queries.ts`, `projeto.queries.ts`, `fase.queries.ts`. Não existe `tarefa.queries.ts` (tarefas são queries aninhadas em `fase.queries.ts`).

**Padrão uniforme:**

```ts
import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

export const getFunctionName = cache(async (param: string) => {
  return db.model.findMany({
    where: { ... },
    select: { field: true, ... },
    orderBy: { field: 'desc' },
  })
})
```

**Convenções encontradas:**
- Header: `'server-only'` + `cache` do React + `db` do Prisma
- Funções exportadas como `const` com `cache()` wrapper
- `select` explícito (nunca retorna todos os campos)
- `orderBy` contextual (nome asc para listagens, data desc para timeline)
- Tipos inferidos automaticamente pelo Prisma a partir do `select`
- Sem `getById` quando o edit modal recebe dados via props

**PRD-04a especifica 3 funções de listagem:** `getReunioesbyProjeto`, `getDecisoesByProjeto`, `getCheckpointsByProjeto` — todas com `where: { projeto_id }`, `select` explícito, e `orderBy` por data desc.

---

### 4. Padrões de Services existentes

**Arquivos existentes:** `src/services/` contém `projeto.service.ts` e `fase.service.ts`.

**Padrão de `projeto.service.ts`:**
- `criarProjeto(data)` — `db.$transaction(async (tx) => { ... })` interativa
- Cria projeto + fase "Geral" atomicamente (R1)
- Retorna o objeto criado
- Sem tratamento de erro explícito — exceções propagam para o caller

**Padrão de `fase.service.ts`:**
- `excluirFase(faseId)` — verificação de precondições antes de deletar (R2: proteção fase Geral)
- `reordenarFases(projetoId, fasesOrdenadas)` — `db.$transaction(array.map(...))` batch
- Retorna `{ success: true/false as const, error? }` discriminated union

**Imports consistentes:**
```ts
import { db } from '@/lib/db'
import type { FormData } from '@/types/schemas/...'
```

**PRD-04a introduz `registro-operacional.service.ts`** com 9 funções (3 entidades × 3 operações). Todas usam `$transaction` para manter `EventoTimeline` sincronizado. Isso é uma novidade: **primeiro service onde TODAS as operações CRUD passam por service** (antes, services eram usados seletivamente).

**Padrões de transação no PRD-04a:**
- **Criar** — interativa: cria entidade + `EventoTimeline` com `origem_id = entity.id`
- **Editar** — interativa: atualiza entidade + `updateMany` no `EventoTimeline` (titulo + data_evento + fase_id)
- **Excluir** — array-style: `deleteMany` no `EventoTimeline` + `delete` na entidade. Busca `projeto_id` antes da transação para retornar ao caller.

---

### 5. Padrões de Server Actions existentes

**Arquivos existentes:** `src/actions/` contém `cliente.actions.ts`, `projeto.actions.ts`, `fase.actions.ts`, `tarefa.actions.ts`.

**Padrão uniforme:**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Schema, type FormData } from '@/types/schemas/...'
// optional: import from services

export async function criarEntityAction(parentId: string, data: FormData) {
  await requireAuth()
  const parsed = Schema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }
  try {
    await serviceOrDb(...)
    revalidatePath(`/path`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao criar entity.' }
  }
}
```

**Convenções encontradas:**
- `'use server'` sempre na linha 1
- `requireAuth()` chamado após `safeParse` (validação barata primeiro)
- Erro Zod genérico: `'Dados inválidos.'` (codebase atual)
- `try/catch` com mensagem genérica por operação
- `revalidatePath()` após operação bem-sucedida
- Retorno: `{ success: true/false as const, error? }`
- Service chamado quando há lógica cross-entity; `db` direto quando operação simples

**PRD-04a muda o padrão de erro Zod** para retornar a mensagem do primeiro erro:
```ts
return { success: false, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
```

**Assinaturas no PRD-04a:**
- Criar: `(projetoId: string, rawData: unknown)` — rawData validado com safeParse
- Editar: `(entityId: string, rawData: unknown)` — service retorna entidade com projeto_id
- Excluir: `(entityId: string)` — service retorna `{ projetoId }` para revalidatePath

**Revalidação:** sempre `/projetos/${projetoId}/timeline` (rota da timeline, não da entidade).

---

### 6. Mapeamento Entidade → EventoTimeline

| Entidade | `tipo_evento` | `origem_tipo` | Data usada em `data_evento` |
|----------|---------------|---------------|-----------------------------|
| Reunião | `reuniao_registrada` | `'reuniao'` | `data_reuniao` |
| Decisão | `decisao_registrada` | `'decisao'` | `data_decisao` |
| Checkpoint | `checkpoint_registrado` | `'checkpoint'` | `data_checkpoint` |

**Campos sincronizados na edição:** `titulo`, `data_evento`, `fase_id`.

**Exclusão:** `deleteMany` por `origem_tipo + origem_id` antes de deletar o registro principal.

---

### 7. Arquivos a criar (PRD-04a)

| Arquivo | Conteúdo |
|---------|----------|
| `src/types/schemas/reuniao.schema.ts` | `ReuniaoFormSchema` + `ReuniaoFormData` |
| `src/types/schemas/decisao.schema.ts` | `DecisaoFormSchema` + `DecisaoFormData` |
| `src/types/schemas/checkpoint.schema.ts` | `CheckpointFormSchema` + `CheckpointFormData` |
| `src/queries/registro-operacional.queries.ts` | 3 funções de listagem por projeto |
| `src/services/registro-operacional.service.ts` | 9 funções CRUD com `$transaction` + EventoTimeline |
| `src/actions/registro-operacional.actions.ts` | 9 Server Actions (3 entidades × 3 operações) |

**Total: 6 arquivos novos · 0 modificados.**

---

## References

- `prisma/schema.prisma:169-189` — modelo Reuniao
- `prisma/schema.prisma:191-212` — modelo Decisao
- `prisma/schema.prisma:214-231` — modelo Checkpoint
- `prisma/schema.prisma:294-314` — modelo EventoTimeline
- `prisma/schema.prisma:45-57` — enum TipoEventoTimeline
- `src/types/schemas/tarefa.schema.ts` — padrão de schema Zod mais próximo (titulo + max)
- `src/queries/fase.queries.ts` — padrão de query com `cache()` e `select` explícito
- `src/services/projeto.service.ts` — padrão de `$transaction` interativa
- `src/services/fase.service.ts` — padrão de `$transaction` batch e retorno discriminated union
- `src/actions/tarefa.actions.ts` — padrão de action com parentId (faseId → projetoId)
- `specs/prds/prd-04a-registros-operacionais-backend.md` — spec completa

## Design & Decisions

### Padrões confirmados pelo codebase

1. **Fluxo canônico respeitado:** Component → Action → Service → db (com service obrigatório para PRD-04a por causa de EventoTimeline)
2. **Schemas Zod separados por entidade:** um arquivo por schema em `types/schemas/`
3. **Queries agrupadas por domínio:** `registro-operacional.queries.ts` agrupa 3 entidades (padrão similar a `projeto.queries.ts` que agrupa projeto + clientes para select)
4. **Service agrupa entidades relacionadas:** `registro-operacional.service.ts` com 9 funções para 3 entidades (inédito no codebase — services anteriores tinham 1-2 funções)
5. **Actions agrupadas por domínio:** `registro-operacional.actions.ts` com 9 actions (inédito — máximo anterior era 5 em `tarefa.actions.ts`)

### Divergências do PRD-04a em relação ao codebase atual

1. **Mensagens de erro Zod por campo** — PRD-04a usa `parsed.error.errors[0]?.message` ao invés do genérico `'Dados inválidos.'`. Isso é uma evolução do padrão.
2. **rawData: unknown** — PRD-04a recebe `rawData: unknown` e faz safeParse, enquanto actions atuais recebem `data: FormData` tipado. O runtime é equivalente (safeParse valida de qualquer forma), mas a tipagem é mais segura no PRD-04a.
3. **Todas as operações via service** — Diferente de PRDs anteriores onde services eram opcionais (cliente usa db direto, tarefa usa db direto), PRD-04a exige service para todas as 9 operações por causa da sincronização com EventoTimeline.

### Cascade delete

Todos os modelos têm `onDelete: Cascade` na FK `projeto_id`. Excluir um projeto remove automaticamente todas as reuniões, decisões, checkpoints e eventos de timeline associados. Não é necessário implementar exclusão em cascata manualmente.

## Open Questions

1. **Consistência de erro Zod:** O PRD-04a introduz mensagens de erro por campo (`parsed.error.errors[0]?.message`). Devemos retroativamente atualizar as actions anteriores para o mesmo padrão? (Provavelmente não — fora do escopo do PRD-04a.)
2. **Tipagem rawData:** O PRD-04a usa `rawData: unknown` enquanto actions anteriores usam tipos explícitos. Manter consistência com o novo padrão ou alinhar com o existente?
