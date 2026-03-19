# PRD-04a — Registros Operacionais I — Backend

> **Depende de:** PRD-03 (Tarefas) — deve estar concluído antes de iniciar
> **Contexto:** Backend completo para Reunião, Decisão e Checkpoint — schemas Zod, queries de listagem, service com criação/edição/exclusão sincronizada com EventoTimeline, e Server Actions. O schema Prisma para os três modelos e para `EventoTimeline` **já existe e a migration foi aplicada** — nenhuma alteração de banco neste PRD.

---

## Escopo

### Inclui
- Schemas Zod para Reunião, Decisão e Checkpoint (`types/schemas/`)
- Queries de listagem por projeto para as três entidades (`queries/registro-operacional.queries.ts`)
- Service `registro-operacional.service.ts` com CRUD que mantém `EventoTimeline` sincronizado via `$transaction`
- Server Actions para criar, editar e excluir cada uma das três entidades (`actions/registro-operacional.actions.ts`)

### Não inclui
- UI (forms, listagens, modais) — fica no PRD-04b
- `getTimelineInterna()` — query consolidada da timeline — fica no PRD-07a
- `getByteById()` queries para edição com fetch — o edit modal receberá dados via props da listagem (mesmo padrão de tarefas/fases)
- Pendência, Documento, Mudança de Direção — ficam nos PRDs-05a e 05b
- Nenhum novo componente shadcn necessário

---

## Arquivos

### Criar
```
src/types/schemas/reuniao.schema.ts                 — ReuniaoFormSchema + ReuniaoFormData
src/types/schemas/decisao.schema.ts                 — DecisaoFormSchema + DecisaoFormData
src/types/schemas/checkpoint.schema.ts              — CheckpointFormSchema + CheckpointFormData
src/queries/registro-operacional.queries.ts         — getReunioesbyProjeto, getDecisoesByProjeto, getCheckpointsByProjeto
src/services/registro-operacional.service.ts        — CRUD com EventoTimeline em $transaction
src/actions/registro-operacional.actions.ts         — 9 Server Actions (3 × 3 entidades)
```

**Total: 6 arquivos novos · 0 modificados**

---

## Especificação

### Schemas Zod

#### `types/schemas/reuniao.schema.ts`

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

#### `types/schemas/decisao.schema.ts`

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

#### `types/schemas/checkpoint.schema.ts`

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

> **Nota:** `projeto_id` não entra nos schemas — é passado como parâmetro separado nas actions (idêntico ao padrão `criarTarefaAction(faseId, data)`).

---

### Queries (`queries/registro-operacional.queries.ts`)

Três funções de listagem por projeto, usando `select` explícito. Ordenadas por data decrescente (mais recente primeiro).

#### `getReunioesbyProjeto(projetoId: string)`

```ts
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
}
orderBy: { data_reuniao: 'desc' }
```

#### `getDecisoesByProjeto(projetoId: string)`

```ts
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
}
orderBy: { data_decisao: 'desc' }
```

#### `getCheckpointsByProjeto(projetoId: string)`

```ts
select: {
  id: true,
  fase_id: true,
  titulo: true,
  resumo: true,
  proximos_passos: true,
  data_checkpoint: true,
  created_at: true,
}
orderBy: { data_checkpoint: 'desc' }
```

---

### Service (`services/registro-operacional.service.ts`)

Lógica cross-entity: toda operação de criação/edição/exclusão envolve o registro principal **e** o `EventoTimeline` correspondente. O service usa `db.$transaction` para garantir atomicidade.

#### Mapeamento de tipos de evento

| Entidade | `tipo_evento` | `origem_tipo` |
|---|---|---|
| Reunião | `reuniao_registrada` | `'reuniao'` |
| Decisão | `decisao_registrada` | `'decisao'` |
| Checkpoint | `checkpoint_registrado` | `'checkpoint'` |

#### Funções do service

**Reunião:**

| Função | Assinatura | Transação |
|--------|-----------|-----------|
| `criarReuniao` | `(projetoId: string, data: ReuniaoFormData) → Reuniao` | Interativa: cria `Reuniao`, depois `EventoTimeline` com `origem_id = reuniao.id` |
| `editarReuniao` | `(reuniaoId: string, data: ReuniaoFormData) → Reuniao` | Interativa: atualiza `Reuniao`, atualiza `EventoTimeline` (titulo + data_evento) |
| `excluirReuniao` | `(reuniaoId: string) → { projetoId: string }` | Array-style: `deleteMany` em `EventoTimeline` + `delete` em `Reuniao` — retorna `projetoId` para revalidatePath |

**Decisão:** mesma estrutura com `Decisao` / `data_decisao`.

**Checkpoint:** mesma estrutura com `Checkpoint` / `data_checkpoint`.

#### Padrão de transação — criar (interativa)

```ts
// Exemplo para criarReuniao — mesma estrutura para as demais
export async function criarReuniao(projetoId: string, data: ReuniaoFormData) {
  return db.$transaction(async (tx) => {
    const reuniao = await tx.reuniao.create({
      data: {
        projeto_id: projetoId,
        fase_id:    data.fase_id ?? null,
        titulo:     data.titulo,
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
```

#### Padrão de transação — excluir (array-style)

```ts
// Busca projetoId antes, depois deleta em transação
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
```

#### Padrão de transação — editar (interativa)

```ts
// Atualiza o registro e o EventoTimeline correspondente
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
```

---

### Actions (`actions/registro-operacional.actions.ts`)

9 Server Actions. Todas chamam `requireAuth()`, validam com Zod e retornam `{ success: true } | { success: false, error: string }`.

#### Reunião

| Action | Assinatura | Revalida |
|--------|-----------|----------|
| `criarReuniaoAction` | `(projetoId: string, data: ReuniaoFormData)` | `/projetos/${projetoId}/timeline` |
| `editarReuniaoAction` | `(reuniaoId: string, data: ReuniaoFormData)` | `/projetos/${reuniao.projeto_id}/timeline` |
| `excluirReuniaoAction` | `(reuniaoId: string)` | `/projetos/${projetoId}/timeline` |

#### Decisão

| Action | Assinatura | Revalida |
|--------|-----------|----------|
| `criarDecisaoAction` | `(projetoId: string, data: DecisaoFormData)` | `/projetos/${projetoId}/timeline` |
| `editarDecisaoAction` | `(decisaoId: string, data: DecisaoFormData)` | `/projetos/${decisao.projeto_id}/timeline` |
| `excluirDecisaoAction` | `(decisaoId: string)` | `/projetos/${projetoId}/timeline` |

#### Checkpoint

| Action | Assinatura | Revalida |
|--------|-----------|----------|
| `criarCheckpointAction` | `(projetoId: string, data: CheckpointFormData)` | `/projetos/${projetoId}/timeline` |
| `editarCheckpointAction` | `(checkpointId: string, data: CheckpointFormData)` | `/projetos/${checkpoint.projeto_id}/timeline` |
| `excluirCheckpointAction` | `(checkpointId: string)` | `/projetos/${projetoId}/timeline` |

#### Padrão de implementação — criar (exemplo)

```ts
export async function criarReuniaoAction(projetoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = ReuniaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  try {
    await criarReuniao(projetoId, parsed.data)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true }
  } catch {
    return { success: false, error: 'Erro ao criar reunião' }
  }
}
```

#### Padrão de implementação — editar

```ts
export async function editarReuniaoAction(reuniaoId: string, rawData: unknown) {
  await requireAuth()
  const parsed = ReuniaoFormSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Dados inválidos' }
  }
  try {
    const reuniao = await editarReuniao(reuniaoId, parsed.data)
    revalidatePath(`/projetos/${reuniao.projeto_id}/timeline`)
    return { success: true }
  } catch {
    return { success: false, error: 'Erro ao editar reunião' }
  }
}
```

#### Padrão de implementação — excluir

```ts
export async function excluirReuniaoAction(reuniaoId: string) {
  await requireAuth()
  try {
    const { projetoId } = await excluirReuniao(reuniaoId)
    revalidatePath(`/projetos/${projetoId}/timeline`)
    return { success: true }
  } catch {
    return { success: false, error: 'Erro ao excluir reunião' }
  }
}
```

---

## Regras de negócio

| Regra | Implementação |
|-------|---------------|
| Criar registro operacional → cria `EventoTimeline` correspondente | `$transaction` interativa em cada `criar*()` do service |
| Editar registro → atualiza titulo e data_evento no `EventoTimeline` | `$transaction` interativa em cada `editar*()` do service |
| Excluir registro → exclui `EventoTimeline` associado | `deleteMany` por `origem_tipo + origem_id` antes de deletar o registro |
| `EventoTimeline.origem_tipo` | String literal: `'reuniao'`, `'decisao'`, `'checkpoint'` |
| `EventoTimeline.origem_id` | UUID do registro correspondente |
| Reunião pode ter `fase_id` opcional | Propagado para o `EventoTimeline.fase_id` também |
| Decisão pode ter `reuniao_id` opcional | Apenas na `Decisao` — não refletido no `EventoTimeline` |
| Nenhum modelo tem status — sem enum adicional | Sem alterações em `constants.ts` neste PRD |

---

## Critérios de aceitação

- [ ] `criarReuniaoAction('projeto-id', data)` → cria 1 registro em `reunioes` e 1 em `eventos_timeline` com `tipo_evento = 'reuniao_registrada'`
- [ ] `criarDecisaoAction('projeto-id', data)` → cria 1 registro em `decisoes` e 1 em `eventos_timeline` com `tipo_evento = 'decisao_registrada'`
- [ ] `criarCheckpointAction('projeto-id', data)` → cria 1 registro em `checkpoints` e 1 em `eventos_timeline` com `tipo_evento = 'checkpoint_registrado'`
- [ ] `editarReuniaoAction(id, data)` → atualiza reunião e o `EventoTimeline` correspondente (titulo + data_evento)
- [ ] `excluirReuniaoAction(id)` → deleta reunião **e** o `EventoTimeline` com `origem_tipo = 'reuniao'` e `origem_id = id`
- [ ] Campo `titulo` vazio → retorna `{ success: false, error: 'Título é obrigatório' }`
- [ ] Campo `descricao` vazio em Decisão → retorna `{ success: false, error: 'Descrição é obrigatória' }`
- [ ] Campo `resumo` vazio em Checkpoint → retorna `{ success: false, error: 'Resumo é obrigatório' }`
- [ ] `getReunioesbyProjeto(id)` retorna apenas registros do projeto informado, ordenados por `data_reuniao desc`
- [ ] `pnpm build` sem erros de TypeScript

---

## Verificação

### Build
```bash
pnpm build
```

### Checklist manual via Prisma Studio

Após `npx prisma studio`:

- [ ] **Criar reunião** via chamada direta ou teste → verificar 1 linha em `reunioes` + 1 linha em `eventos_timeline` com `tipo_evento = reuniao_registrada` e `origem_id` correto
- [ ] **Editar reunião** (alterar título) → verificar que `eventos_timeline` correspondente também atualiza `titulo`
- [ ] **Excluir reunião** → verificar que a linha em `reunioes` some **e** o `EventoTimeline` correspondente é removido
- [ ] Repetir para Decisão e Checkpoint
- [ ] Excluir projeto com registros → verificar que `reunioes`, `decisoes`, `checkpoints` e `eventos_timeline` são removidos em cascata (garantido pelo `onDelete: Cascade` no schema)
