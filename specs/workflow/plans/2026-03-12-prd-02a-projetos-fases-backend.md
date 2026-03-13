# PRD-02a — Projetos + Fases Backend: Implementation Plan

## Overview

Implementar as camadas de dados (Zod schemas, queries), regras de negócio (services com R1/R2) e Server Actions para Projetos e Fases. Ao final, o backend está completo e pronto para as UIs dos PRDs 02b e 02c.

## Current State Analysis

- **Schema Prisma:** modelos `Projeto`, `Fase` e enums `StatusProjeto`, `StatusFase` já existem (`prisma/schema.prisma:76-132`). Nenhuma migration necessária.
- **Services:** diretório `src/services/` vazio (`.gitkeep`). Este PRD cria os primeiros services.
- **Queries:** apenas `cliente.queries.ts` existe. `getProjetosDoCliente()` já consulta a tabela `projeto` (`cliente.queries.ts:34-46`).
- **Actions:** apenas `cliente.actions.ts` existe com o padrão estabelecido.
- **Schemas Zod:** apenas `cliente.schema.ts` existe com o padrão estabelecido.
- **Rotas:** `/projetos` já protegido em `proxy.ts:4`. Diretório `app/(internal)/projetos/` não existe (UI é PRD-02b).

### Key Discoveries:
- Padrões do PRD-01 são claros e consistentes — seguir exatamente
- `getProjetosDoCliente()` em `cliente.queries.ts` já usa `select` explícito e `orderBy`
- Cascatas de deleção já definidas no Prisma schema — não precisam de lógica extra
- Timeline adiada para PRD-07a — `criarProjeto` não cria evento

## Desired End State

8 arquivos novos criados em `src/`:
- `types/schemas/projeto.schema.ts` e `fase.schema.ts`
- `queries/projeto.queries.ts` e `fase.queries.ts`
- `services/projeto.service.ts` e `fase.service.ts`
- `actions/projeto.actions.ts` e `fase.actions.ts`

Verificação: `pnpm build` com zero erros de TypeScript.

## What We're NOT Doing

- UI de projetos (`/projetos`, `/projetos/novo`, `/projetos/[id]`) — PRD-02b
- UI de fases (drag and drop, modais) — PRD-02c
- Tarefas planejadas — PRD-03
- Eventos de timeline ao criar projeto — PRD-07a
- Queries de portal (público) — PRD-08
- Modificação de arquivos existentes

---

## Phase 1: Zod Schemas

### Overview
Criar os schemas de validação que serão compartilhados entre forms (client) e actions (server).

### Changes Required:

#### 1. Schema de Projeto
**File**: `src/types/schemas/projeto.schema.ts` (criar)

```typescript
import { z } from 'zod'

export const ProjetoFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cliente_id: z.string().uuid('Cliente inválido'),
  descricao: z.string().optional(),
  status: z.enum([
    'rascunho', 'ativo', 'aguardando_cliente', 'pausado', 'concluido', 'arquivado',
  ]),
  data_inicio: z.coerce.date({ required_error: 'Data de início é obrigatória' }),
  previsao_entrega: z.coerce.date().optional().nullable(),
  data_conclusao_real: z.coerce.date().optional().nullable(),
})

export type ProjetoFormData = z.infer<typeof ProjetoFormSchema>
```

#### 2. Schema de Fase
**File**: `src/types/schemas/fase.schema.ts` (criar)

```typescript
import { z } from 'zod'

export const FaseFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  status: z.enum([
    'nao_iniciada', 'em_andamento', 'aguardando_cliente', 'concluida', 'pausada', 'cancelada',
  ]),
  data_inicio_prevista: z.coerce.date().optional().nullable(),
  data_fim_prevista: z.coerce.date().optional().nullable(),
  data_inicio_real: z.coerce.date().optional().nullable(),
  data_fim_real: z.coerce.date().optional().nullable(),
})

export type FaseFormData = z.infer<typeof FaseFormSchema>
```

### Success Criteria:

#### Automated Verification:
- [x] Arquivos criados nos caminhos corretos
- [x] `pnpm build` passa (sem imports consumidores ainda, mas tipos válidos)

---

## Phase 2: Queries

### Overview
Criar as queries de leitura para projetos e fases, seguindo o padrão estabelecido: `import 'server-only'`, `cache()`, `select` explícito, `orderBy`.

### Changes Required:

#### 1. Queries de Projeto
**File**: `src/queries/projeto.queries.ts` (criar)

```typescript
import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import type { StatusProjeto } from '@prisma/client'

export const getProjetosFiltrados = cache(
  async (filtros?: { status?: StatusProjeto; clienteId?: string }) => {
    return db.projeto.findMany({
      where: {
        ...(filtros?.status && { status: filtros.status }),
        ...(filtros?.clienteId && { cliente_id: filtros.clienteId }),
      },
      select: {
        id: true,
        nome: true,
        status: true,
        data_inicio: true,
        previsao_entrega: true,
        created_at: true,
        cliente: { select: { id: true, nome: true } },
      },
      orderBy: { created_at: 'desc' },
    })
  }
)

export const getProjetoById = cache(async (id: string) => {
  return db.projeto.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      cliente_id: true,
      descricao: true,
      status: true,
      data_inicio: true,
      previsao_entrega: true,
      data_conclusao_real: true,
      fase_atual_id: true,
      created_at: true,
      updated_at: true,
      cliente: { select: { id: true, nome: true } },
      fases: {
        select: {
          id: true,
          nome: true,
          status: true,
          ordem: true,
          is_fase_geral: true,
        },
        orderBy: { ordem: 'asc' },
      },
    },
  })
})

export const getClientesParaSelect = cache(async () => {
  return db.cliente.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })
})
```

**Notas:**
- `getProjetosFiltrados` usa spread condicional para filtros opcionais cumulativos
- `getProjetoById` retorna todos os campos do projeto + cliente aninhado + fases aninhadas (ordenadas por `ordem`)
- `getClientesParaSelect` retorna apenas `id` e `nome` para popular selects

#### 2. Queries de Fase
**File**: `src/queries/fase.queries.ts` (criar)

```typescript
import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

export const getFasesByProjeto = cache(async (projetoId: string) => {
  return db.fase.findMany({
    where: { projeto_id: projetoId },
    select: {
      id: true,
      nome: true,
      descricao: true,
      ordem: true,
      status: true,
      data_inicio_prevista: true,
      data_fim_prevista: true,
      data_inicio_real: true,
      data_fim_real: true,
      is_fase_geral: true,
      created_at: true,
    },
    orderBy: { ordem: 'asc' },
  })
})
```

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` passa — imports de `@prisma/client` e `@/lib/db` resolvem corretamente

---

## Phase 3: Services

### Overview
Criar os primeiros services do projeto, implementando R1 (fase Geral automática) e R2 (proteção da fase Geral). Services não conhecem HTTP, cookies, UI ou Zod.

### Changes Required:

#### 1. Service de Projeto
**File**: `src/services/projeto.service.ts` (criar)

```typescript
import { db } from '@/lib/db'
import type { ProjetoFormData } from '@/types/schemas/projeto.schema'

export async function criarProjeto(data: ProjetoFormData) {
  return db.$transaction(async (tx) => {
    const projeto = await tx.projeto.create({ data })
    await tx.fase.create({
      data: {
        projeto_id: projeto.id,
        nome: 'Geral do projeto',
        ordem: 1,
        status: 'nao_iniciada',
        is_fase_geral: true,
      },
    })
    return projeto
  })
}
```

**Notas:**
- `$transaction` garante atomicidade: projeto + fase Geral criados juntos ou nenhum
- Não cria evento de timeline (PRD-07a)
- Recebe `ProjetoFormData` (tipo inferido do Zod, mas o service não importa o schema Zod em si — apenas o tipo)

#### 2. Service de Fase
**File**: `src/services/fase.service.ts` (criar)

```typescript
import { db } from '@/lib/db'

export async function excluirFase(faseId: string) {
  const fase = await db.fase.findUnique({
    where: { id: faseId },
    select: { is_fase_geral: true, projeto_id: true },
  })

  if (!fase) {
    return { success: false as const, error: 'Fase não encontrada.' }
  }

  if (fase.is_fase_geral) {
    return { success: false as const, error: 'A fase Geral do projeto não pode ser excluída.' }
  }

  await db.fase.delete({ where: { id: faseId } })

  return { success: true as const, projetoId: fase.projeto_id }
}

export async function reordenarFases(
  projetoId: string,
  fasesOrdenadas: { id: string; ordem: number }[]
) {
  // Verificar se a fase Geral está na posição 1
  const faseGeral = await db.fase.findFirst({
    where: { projeto_id: projetoId, is_fase_geral: true },
    select: { id: true },
  })

  if (faseGeral) {
    const geralNoArray = fasesOrdenadas.find((f) => f.id === faseGeral.id)
    if (geralNoArray && geralNoArray.ordem !== 1) {
      return {
        success: false as const,
        error: 'A fase Geral deve permanecer na primeira posição.',
      }
    }
  }

  await db.$transaction(
    fasesOrdenadas.map((f) =>
      db.fase.update({
        where: { id: f.id },
        data: { ordem: f.ordem },
      })
    )
  )

  return { success: true as const }
}
```

**Notas:**
- `excluirFase` retorna `projetoId` para que a action possa fazer `revalidatePath`
- `reordenarFases` usa `$transaction` com array de updates (batch)
- Ambos verificam R2 antes de operar

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` passa — tipos `ProjetoFormData` e Prisma resolvem

---

## Phase 4: Actions

### Overview
Criar as Server Actions para projetos e fases, seguindo o padrão do PRD-01: `'use server'`, `safeParse()`, `requireAuth()`, try-catch, retorno tipado.

### Changes Required:

#### 1. Actions de Projeto
**File**: `src/actions/projeto.actions.ts` (criar)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProjetoFormSchema, type ProjetoFormData } from '@/types/schemas/projeto.schema'
import { criarProjeto } from '@/services/projeto.service'

export async function criarProjetoAction(data: ProjetoFormData) {
  const parsed = ProjetoFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    const projeto = await criarProjeto(parsed.data)
    revalidatePath('/projetos')
    return { success: true as const, projetoId: projeto.id }
  } catch {
    return { success: false as const, error: 'Erro ao criar projeto.' }
  }
}

export async function editarProjetoAction(id: string, data: ProjetoFormData) {
  const parsed = ProjetoFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    await db.projeto.update({ where: { id }, data: parsed.data })
  } catch {
    return { success: false as const, error: 'Erro ao editar projeto.' }
  }

  revalidatePath('/projetos')
  revalidatePath('/projetos/' + id)
  return { success: true as const }
}

export async function excluirProjetoAction(id: string) {
  await requireAuth()

  try {
    await db.projeto.delete({ where: { id } })
  } catch {
    return { success: false as const, error: 'Erro ao excluir projeto.' }
  }

  revalidatePath('/projetos')
  return { success: true as const }
}
```

**Notas:**
- `criarProjetoAction` chama `criarProjeto` do service (cross-entity: projeto + fase)
- `criarProjetoAction` retorna `projetoId` para redirect na UI (extensão do padrão PRD-01)
- `editarProjetoAction` e `excluirProjetoAction` operam diretamente via `db` (operações simples)

#### 2. Actions de Fase
**File**: `src/actions/fase.actions.ts` (criar)

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { FaseFormSchema, type FaseFormData } from '@/types/schemas/fase.schema'
import { excluirFase, reordenarFases } from '@/services/fase.service'

export async function criarFaseAction(projetoId: string, data: FaseFormData) {
  const parsed = FaseFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    const maxOrdem = await db.fase.aggregate({
      where: { projeto_id: projetoId },
      _max: { ordem: true },
    })
    const novaOrdem = (maxOrdem._max.ordem ?? 0) + 1

    await db.fase.create({
      data: {
        ...parsed.data,
        projeto_id: projetoId,
        ordem: novaOrdem,
        is_fase_geral: false,
      },
    })
  } catch {
    return { success: false as const, error: 'Erro ao criar fase.' }
  }

  revalidatePath('/projetos/' + projetoId)
  return { success: true as const }
}

export async function editarFaseAction(faseId: string, data: FaseFormData) {
  const parsed = FaseFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    const fase = await db.fase.update({
      where: { id: faseId },
      data: parsed.data,
      select: { projeto_id: true },
    })
    revalidatePath('/projetos/' + fase.projeto_id)
  } catch {
    return { success: false as const, error: 'Erro ao editar fase.' }
  }

  return { success: true as const }
}

export async function excluirFaseAction(faseId: string) {
  await requireAuth()

  const result = await excluirFase(faseId)
  if (!result.success) {
    return { success: false as const, error: result.error }
  }

  revalidatePath('/projetos/' + result.projetoId)
  return { success: true as const }
}

export async function reordenarFasesAction(
  projetoId: string,
  fasesOrdenadas: { id: string; ordem: number }[]
) {
  await requireAuth()

  const result = await reordenarFases(projetoId, fasesOrdenadas)
  if (!result.success) {
    return { success: false as const, error: result.error }
  }

  revalidatePath('/projetos/' + projetoId)
  return { success: true as const }
}
```

**Notas:**
- `criarFaseAction` calcula `max(ordem) + 1` inline (operação simples, sem necessidade de transaction)
- `editarFaseAction` busca `projeto_id` do update para revalidar o path correto
- `excluirFaseAction` e `reordenarFasesAction` delegam ao service (R2)
- `excluirFaseAction` e `reordenarFasesAction` não fazem validação Zod (sem payload de formulário)

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` completa com zero erros de TypeScript
- [x] Todos os imports resolvem corretamente (`@/services/`, `@/lib/`, `@/types/schemas/`)

#### Manual Verification:
- [ ] **Criar projeto** via action → projeto criado + fase "Geral do projeto" com `is_fase_geral: true`, `ordem: 1`
- [ ] **Editar projeto** → campos atualizados, `updated_at` alterado
- [ ] **Excluir projeto** → projeto, fases e tudo abaixo removidos (cascata)
- [ ] **Criar fase** → fase criada com `ordem = max + 1`, `is_fase_geral: false`
- [ ] **Editar fase** → campos atualizados
- [ ] **Excluir fase Geral** → bloqueado com mensagem de erro
- [ ] **Excluir fase normal** → fase removida, tarefas e horas cascateadas
- [ ] **Reordenar fases** → ordens atualizadas; tentativa de mover Geral → bloqueada

**Implementation Note**: Após completar esta fase e a verificação automatizada passar, pausar para confirmação manual do humano antes de declarar o PRD concluído.

---

## Testing Strategy

### Automated
```bash
npx prisma generate && pnpm build
```
Zero erros de TypeScript é pré-requisito.

### Manual Testing (via Prisma Studio ou UI futura)
1. Criar projeto → verificar que fase Geral foi criada automaticamente
2. Tentar excluir fase Geral → deve retornar erro
3. Criar 3 fases adicionais → verificar `ordem` incremental (2, 3, 4)
4. Reordenar fases mantendo Geral em 1 → deve funcionar
5. Tentar mover Geral para outra posição → deve retornar erro
6. Excluir fase normal → verificar cascata
7. Excluir projeto → verificar cascata completa

## Migration Notes

Nenhuma migration necessária — modelos `Projeto` e `Fase` já existem no schema Prisma.

## References

- Original PRD: `specs/prds/prd-02a-projetos-fases-backend.md`
- Research: `specs/workflow/research/2026-03-12-prd-02a-projetos-fases-backend.md`
- Padrão de schema Zod: `src/types/schemas/cliente.schema.ts`
- Padrão de queries: `src/queries/cliente.queries.ts`
- Padrão de actions: `src/actions/cliente.actions.ts`
- Schema Prisma (Projeto): `prisma/schema.prisma:76-102`
- Schema Prisma (Fase): `prisma/schema.prisma:104-132`
- Regra R1: `specs/foundation/02_dominio.md:55`
- Regra R2: `specs/foundation/02_dominio.md:85-87`
- Fluxo canônico: `specs/foundation/03_arquitetura.md:253-279`
