# PRD-04a — Registros Operacionais I — Backend — Implementation Plan

## Overview

Implementar o backend completo para Reunião, Decisão e Checkpoint: schemas Zod, queries de listagem, service com CRUD sincronizado com EventoTimeline via `$transaction`, e 9 Server Actions. Os modelos Prisma e a migration já existem — nenhuma alteração de banco.

## Current State Analysis

- **Prisma schema**: modelos `Reuniao`, `Decisao`, `Checkpoint` e `EventoTimeline` já existem com migration aplicada (`prisma/schema.prisma:169-231, 294-314`)
- **Enum `TipoEventoTimeline`**: valores `reuniao_registrada`, `decisao_registrada`, `checkpoint_registrado` já definidos (`prisma/schema.prisma:45-57`)
- **Cascade delete**: todos os modelos têm `onDelete: Cascade` na FK `projeto_id` — excluir projeto remove tudo automaticamente
- **Nenhum arquivo de backend** existe para essas entidades — tudo será criado do zero
- **Padrões estabelecidos**: schemas Zod em `types/schemas/`, queries com `cache()`, services com `$transaction`, actions com `requireAuth()` + Zod

### Key Discoveries:
- `src/types/schemas/tarefa.schema.ts:1-10` — padrão de schema Zod mais próximo (titulo + max)
- `src/queries/fase.queries.ts:1-34` — padrão de query com `cache()` e `select` explícito
- `src/services/projeto.service.ts:1-18` — padrão de `$transaction` interativa
- `src/actions/tarefa.actions.ts:1-99` — padrão de action com parentId, safeParse, requireAuth, revalidatePath

## Desired End State

6 arquivos novos implementados:

| Arquivo | Conteúdo |
|---------|----------|
| `src/types/schemas/reuniao.schema.ts` | `ReuniaoFormSchema` + `ReuniaoFormData` |
| `src/types/schemas/decisao.schema.ts` | `DecisaoFormSchema` + `DecisaoFormData` |
| `src/types/schemas/checkpoint.schema.ts` | `CheckpointFormSchema` + `CheckpointFormData` |
| `src/queries/registro-operacional.queries.ts` | 3 funções de listagem por projeto |
| `src/services/registro-operacional.service.ts` | 9 funções CRUD com `$transaction` + EventoTimeline |
| `src/actions/registro-operacional.actions.ts` | 9 Server Actions (3 entidades × 3 operações) |

**Verificação**: `pnpm build` sem erros + Prisma Studio confirma sincronização EventoTimeline.

## What We're NOT Doing

- UI (forms, listagens, modais) — PRD-04b
- `getTimelineInterna()` query consolidada — PRD-07a
- Queries `getById` para edição — edit modal recebe dados via props
- Pendência, Documento, Mudança de Direção — PRDs-05a/05b
- Alterar actions anteriores para o novo padrão de erro Zod
- Nenhum componente shadcn novo

## Implementation Approach

Service como camada obrigatória para todas as operações CRUD (diferente de PRDs anteriores). Toda criação/edição/exclusão passa pelo service porque precisa manter `EventoTimeline` sincronizado atomicamente via `$transaction`.

**Duas evoluções de padrão** neste PRD:
1. Mensagem de erro Zod por campo: `parsed.error.errors[0]?.message` (antes: genérico `'Dados inválidos.'`)
2. Parâmetro `rawData: unknown` nas actions (antes: tipo explícito `data: FormData`)

---

## Phase 1: Schemas Zod + Queries

### Overview
Criar os 3 schemas Zod (validação compartilhada entre client e server) e o arquivo de queries de listagem. Fundação de dados sem side-effects.

### Changes Required:

#### 1. Schema Zod — Reunião
**File**: `src/types/schemas/reuniao.schema.ts` (criar)

```ts
import { z } from 'zod'

export const ReuniaoFormSchema = z.object({
  fase_id:           z.string().uuid().nullable().optional(),
  titulo:            z.string().min(1, 'Título é obrigatório').max(200),
  data_reuniao:      z.coerce.date({ required_error: 'Data é obrigatória' }),
  participantes:     z.string().optional(),
  link_referencia:   z.string().optional(),
  resumo_executivo:  z.string().optional(),
  ata_resumida:      z.string().optional(),
})

export type ReuniaoFormData = z.infer<typeof ReuniaoFormSchema>
```

#### 2. Schema Zod — Decisão
**File**: `src/types/schemas/decisao.schema.ts` (criar)

```ts
import { z } from 'zod'

export const DecisaoFormSchema = z.object({
  fase_id:      z.string().uuid().nullable().optional(),
  reuniao_id:   z.string().uuid().nullable().optional(),
  titulo:       z.string().min(1, 'Título é obrigatório').max(200),
  descricao:    z.string().min(1, 'Descrição é obrigatória'),
  contexto:     z.string().optional(),
  impacto:      z.string().optional(),
  data_decisao: z.coerce.date({ required_error: 'Data é obrigatória' }),
})

export type DecisaoFormData = z.infer<typeof DecisaoFormSchema>
```

#### 3. Schema Zod — Checkpoint
**File**: `src/types/schemas/checkpoint.schema.ts` (criar)

```ts
import { z } from 'zod'

export const CheckpointFormSchema = z.object({
  fase_id:          z.string().uuid().nullable().optional(),
  titulo:           z.string().min(1, 'Título é obrigatório').max(200),
  resumo:           z.string().min(1, 'Resumo é obrigatório'),
  proximos_passos:  z.string().optional(),
  data_checkpoint:  z.coerce.date({ required_error: 'Data é obrigatória' }),
})

export type CheckpointFormData = z.infer<typeof CheckpointFormSchema>
```

#### 4. Queries de listagem
**File**: `src/queries/registro-operacional.queries.ts` (criar)

```ts
import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

export const getReunioesbyProjeto = cache(async (projetoId: string) => {
  return db.reuniao.findMany({
    where: { projeto_id: projetoId },
    select: {
      id: true,
      fase_id: true,
      titulo: true,
      data_reuniao: true,
      participantes: true,
      link_referencia: true,
      resumo_executivo: true,
      ata_resumida: true,
      created_at: true,
    },
    orderBy: { data_reuniao: 'desc' },
  })
})

export const getDecisoesByProjeto = cache(async (projetoId: string) => {
  return db.decisao.findMany({
    where: { projeto_id: projetoId },
    select: {
      id: true,
      fase_id: true,
      reuniao_id: true,
      titulo: true,
      descricao: true,
      contexto: true,
      impacto: true,
      data_decisao: true,
      created_at: true,
    },
    orderBy: { data_decisao: 'desc' },
  })
})

export const getCheckpointsByProjeto = cache(async (projetoId: string) => {
  return db.checkpoint.findMany({
    where: { projeto_id: projetoId },
    select: {
      id: true,
      fase_id: true,
      titulo: true,
      resumo: true,
      proximos_passos: true,
      data_checkpoint: true,
      created_at: true,
    },
    orderBy: { data_checkpoint: 'desc' },
  })
})
```

### Success Criteria:

#### Automated Verification:
- [ ] `pnpm build` sem erros de TypeScript

#### Manual Verification:
- [ ] Nenhuma — schemas e queries são validados pelo build

**Implementation Note**: Após `pnpm build` passar, prosseguir diretamente para Phase 2.

---

## Phase 2: Service + Server Actions

### Overview
Criar o service com 9 funções CRUD que mantêm `EventoTimeline` sincronizado via `$transaction`, e as 9 Server Actions correspondentes.

### Changes Required:

#### 1. Service — Registro Operacional
**File**: `src/services/registro-operacional.service.ts` (criar)

**Mapeamento de tipos de evento:**

| Entidade | `tipo_evento` | `origem_tipo` | Campo de data |
|----------|---------------|---------------|---------------|
| Reunião | `reuniao_registrada` | `'reuniao'` | `data_reuniao` |
| Decisão | `decisao_registrada` | `'decisao'` | `data_decisao` |
| Checkpoint | `checkpoint_registrado` | `'checkpoint'` | `data_checkpoint` |

**9 funções** (3 entidades × 3 operações):

```ts
import { db } from '@/lib/db'
import type { ReuniaoFormData } from '@/types/schemas/reuniao.schema'
import type { DecisaoFormData } from '@/types/schemas/decisao.schema'
import type { CheckpointFormData } from '@/types/schemas/checkpoint.schema'

// ── Reunião ──────────────────────────────────────────────

export async function criarReuniao(projetoId: string, data: ReuniaoFormData) {
  return db.$transaction(async (tx) => {
    const reuniao = await tx.reuniao.create({
      data: {
        projeto_id: projetoId,
        fase_id:           data.fase_id ?? null,
        titulo:            data.titulo,
        data_reuniao:      data.data_reuniao,
        participantes:     data.participantes     ?? null,
        link_referencia:   data.link_referencia   ?? null,
        resumo_executivo:  data.resumo_executivo  ?? null,
        ata_resumida:      data.ata_resumida      ?? null,
      },
    })
    await tx.eventoTimeline.create({
      data: {
        projeto_id:  projetoId,
        fase_id:     data.fase_id ?? null,
        tipo_evento: 'reuniao_registrada',
        titulo:      data.titulo,
        data_evento: data.data_reuniao,
        origem_tipo: 'reuniao',
        origem_id:   reuniao.id,
      },
    })
    return reuniao
  })
}

export async function editarReuniao(reuniaoId: string, data: ReuniaoFormData) {
  return db.$transaction(async (tx) => {
    const reuniao = await tx.reuniao.update({
      where: { id: reuniaoId },
      data: {
        fase_id:           data.fase_id ?? null,
        titulo:            data.titulo,
        data_reuniao:      data.data_reuniao,
        participantes:     data.participantes     ?? null,
        link_referencia:   data.link_referencia   ?? null,
        resumo_executivo:  data.resumo_executivo  ?? null,
        ata_resumida:      data.ata_resumida      ?? null,
      },
    })
    await tx.eventoTimeline.updateMany({
      where: { origem_tipo: 'reuniao', origem_id: reuniaoId },
      data: {
        titulo:      data.titulo,
        data_evento: data.data_reuniao,
        fase_id:     data.fase_id ?? null,
      },
    })
    return reuniao
  })
}

export async function excluirReuniao(reuniaoId: string) {
  const reuniao = await db.reuniao.findUniqueOrThrow({
    where: { id: reuniaoId },
    select: { projeto_id: true },
  })
  await db.$transaction([
    db.eventoTimeline.deleteMany({
      where: { origem_tipo: 'reuniao', origem_id: reuniaoId },
    }),
    db.reuniao.delete({ where: { id: reuniaoId } }),
  ])
  return { projetoId: reuniao.projeto_id }
}

// ── Decisão ──────────────────────────────────────────────

export async function criarDecisao(projetoId: string, data: DecisaoFormData) {
  return db.$transaction(async (tx) => {
    const decisao = await tx.decisao.create({
      data: {
        projeto_id: projetoId,
        fase_id:      data.fase_id ?? null,
        reuniao_id:   data.reuniao_id ?? null,
        titulo:       data.titulo,
        descricao:    data.descricao,
        contexto:     data.contexto ?? null,
        impacto:      data.impacto ?? null,
        data_decisao: data.data_decisao,
      },
    })
    await tx.eventoTimeline.create({
      data: {
        projeto_id:  projetoId,
        fase_id:     data.fase_id ?? null,
        tipo_evento: 'decisao_registrada',
        titulo:      data.titulo,
        data_evento: data.data_decisao,
        origem_tipo: 'decisao',
        origem_id:   decisao.id,
      },
    })
    return decisao
  })
}

export async function editarDecisao(decisaoId: string, data: DecisaoFormData) {
  return db.$transaction(async (tx) => {
    const decisao = await tx.decisao.update({
      where: { id: decisaoId },
      data: {
        fase_id:      data.fase_id ?? null,
        reuniao_id:   data.reuniao_id ?? null,
        titulo:       data.titulo,
        descricao:    data.descricao,
        contexto:     data.contexto ?? null,
        impacto:      data.impacto ?? null,
        data_decisao: data.data_decisao,
      },
    })
    await tx.eventoTimeline.updateMany({
      where: { origem_tipo: 'decisao', origem_id: decisaoId },
      data: {
        titulo:      data.titulo,
        data_evento: data.data_decisao,
        fase_id:     data.fase_id ?? null,
      },
    })
    return decisao
  })
}

export async function excluirDecisao(decisaoId: string) {
  const decisao = await db.decisao.findUniqueOrThrow({
    where: { id: decisaoId },
    select: { projeto_id: true },
  })
  await db.$transaction([
    db.eventoTimeline.deleteMany({
      where: { origem_tipo: 'decisao', origem_id: decisaoId },
    }),
    db.decisao.delete({ where: { id: decisaoId } }),
  ])
  return { projetoId: decisao.projeto_id }
}

// ── Checkpoint ───────────────────────────────────────────

export async function criarCheckpoint(projetoId: string, data: CheckpointFormData) {
  return db.$transaction(async (tx) => {
    const checkpoint = await tx.checkpoint.create({
      data: {
        projeto_id: projetoId,
        fase_id:         data.fase_id ?? null,
        titulo:          data.titulo,
        resumo:          data.resumo,
        proximos_passos: data.proximos_passos ?? null,
        data_checkpoint: data.data_checkpoint,
      },
    })
    await tx.eventoTimeline.create({
      data: {
        projeto_id:  projetoId,
        fase_id:     data.fase_id ?? null,
        tipo_evento: 'checkpoint_registrado',
        titulo:      data.titulo,
        data_evento: data.data_checkpoint,
        origem_tipo: 'checkpoint',
        origem_id:   checkpoint.id,
      },
    })
    return checkpoint
  })
}

export async function editarCheckpoint(checkpointId: string, data: CheckpointFormData) {
  return db.$transaction(async (tx) => {
    const checkpoint = await tx.checkpoint.update({
      where: { id: checkpointId },
      data: {
        fase_id:         data.fase_id ?? null,
        titulo:          data.titulo,
        resumo:          data.resumo,
        proximos_passos: data.proximos_passos ?? null,
        data_checkpoint: data.data_checkpoint,
      },
    })
    await tx.eventoTimeline.updateMany({
      where: { origem_tipo: 'checkpoint', origem_id: checkpointId },
      data: {
        titulo:      data.titulo,
        data_evento: data.data_checkpoint,
        fase_id:     data.fase_id ?? null,
      },
    })
    return checkpoint
  })
}

export async function excluirCheckpoint(checkpointId: string) {
  const checkpoint = await db.checkpoint.findUniqueOrThrow({
    where: { id: checkpointId },
    select: { projeto_id: true },
  })
  await db.$transaction([
    db.eventoTimeline.deleteMany({
      where: { origem_tipo: 'checkpoint', origem_id: checkpointId },
    }),
    db.checkpoint.delete({ where: { id: checkpointId } }),
  ])
  return { projetoId: checkpoint.projeto_id }
}
```

#### 2. Server Actions — Registro Operacional
**File**: `src/actions/registro-operacional.actions.ts` (criar)

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { ReuniaoFormSchema } from '@/types/schemas/reuniao.schema'
import { DecisaoFormSchema } from '@/types/schemas/decisao.schema'
import { CheckpointFormSchema } from '@/types/schemas/checkpoint.schema'
import {
  criarReuniao, editarReuniao, excluirReuniao,
  criarDecisao, editarDecisao, excluirDecisao,
  criarCheckpoint, editarCheckpoint, excluirCheckpoint,
} from '@/services/registro-operacional.service'

// ── Reunião ──────────────────────────────────────────────

export async function criarReuniaoAction(projetoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = ReuniaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  try {
    await criarReuniao(projetoId, parsed.data)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao criar reunião' }
  }
}

export async function editarReuniaoAction(reuniaoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = ReuniaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  try {
    const reuniao = await editarReuniao(reuniaoId, parsed.data)
    revalidatePath(`/projetos/${reuniao.projeto_id}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao editar reunião' }
  }
}

export async function excluirReuniaoAction(reuniaoId: string) {
  await requireAuth()
  try {
    const { projetoId } = await excluirReuniao(reuniaoId)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao excluir reunião' }
  }
}

// ── Decisão ──────────────────────────────────────────────

export async function criarDecisaoAction(projetoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = DecisaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  try {
    await criarDecisao(projetoId, parsed.data)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao criar decisão' }
  }
}

export async function editarDecisaoAction(decisaoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = DecisaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  try {
    const decisao = await editarDecisao(decisaoId, parsed.data)
    revalidatePath(`/projetos/${decisao.projeto_id}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao editar decisão' }
  }
}

export async function excluirDecisaoAction(decisaoId: string) {
  await requireAuth()
  try {
    const { projetoId } = await excluirDecisao(decisaoId)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao excluir decisão' }
  }
}

// ── Checkpoint ───────────────────────────────────────────

export async function criarCheckpointAction(projetoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = CheckpointFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  try {
    await criarCheckpoint(projetoId, parsed.data)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao criar checkpoint' }
  }
}

export async function editarCheckpointAction(checkpointId: string, rawData: unknown) {
  await requireAuth()
  const parsed = CheckpointFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  try {
    const checkpoint = await editarCheckpoint(checkpointId, parsed.data)
    revalidatePath(`/projetos/${checkpoint.projeto_id}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao editar checkpoint' }
  }
}

export async function excluirCheckpointAction(checkpointId: string) {
  await requireAuth()
  try {
    const { projetoId } = await excluirCheckpoint(checkpointId)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Erro ao excluir checkpoint' }
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `pnpm build` sem erros de TypeScript

#### Manual Verification:
- [ ] Via Prisma Studio: criar reunião → verificar 1 linha em `reunioes` + 1 em `eventos_timeline` com `tipo_evento = reuniao_registrada` e `origem_id` correto
- [ ] Via Prisma Studio: editar reunião (alterar título) → verificar que `eventos_timeline` correspondente também atualiza `titulo`
- [ ] Via Prisma Studio: excluir reunião → verificar que a linha em `reunioes` some **e** o `EventoTimeline` correspondente é removido
- [ ] Repetir para Decisão e Checkpoint
- [ ] Excluir projeto com registros → verificar cascade remove `reunioes`, `decisoes`, `checkpoints` e `eventos_timeline`

**Implementation Note**: Após `pnpm build` passar, pausar para verificação manual via Prisma Studio antes de considerar o PRD-04a concluído.

---

## Testing Strategy

### Build
```bash
pnpm build
```

### Manual Testing via Prisma Studio
```bash
npx prisma studio
```

1. **Criar reunião** via chamada direta → verificar 1 linha em `reunioes` + 1 linha em `eventos_timeline` com `tipo_evento = reuniao_registrada` e `origem_id` correto
2. **Editar reunião** (alterar título) → verificar que `eventos_timeline` correspondente também atualiza `titulo` e `data_evento`
3. **Excluir reunião** → verificar que `reunioes` e `eventos_timeline` correspondente são removidos
4. Repetir para Decisão e Checkpoint
5. **Cascade**: excluir projeto com registros → verificar que `reunioes`, `decisoes`, `checkpoints` e `eventos_timeline` são removidos automaticamente

## References

- Original PRD: `specs/prds/prd-04a-registros-operacionais-backend.md`
- Research: `specs/workflow/research/2026-03-13-prd-04a-registros-operacionais-backend.md`
- Padrão schema Zod: `src/types/schemas/tarefa.schema.ts:1-10`
- Padrão query: `src/queries/fase.queries.ts:1-34`
- Padrão service: `src/services/projeto.service.ts:1-18`
- Padrão action: `src/actions/tarefa.actions.ts:1-99`
