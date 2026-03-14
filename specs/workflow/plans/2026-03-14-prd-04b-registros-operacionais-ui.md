# PRD-04b — Registros Operacionais UI — Implementation Plan

## Overview

Implementar a UI completa da aba `/projetos/[id]/timeline` com três seções (Reuniões, Decisões, Checkpoints). O backend (PRD-04a) está 100% completo. Este PRD cria 6 arquivos novos, zero modificados.

## Current State Analysis

- Backend completo: 9 actions, 3 queries, 3 schemas Zod, 1 service em `$transaction`
- Aba "Timeline" já existe em `projeto-tabs.tsx` apontando para `/projetos/[id]/timeline`
- `src/components/ui/select.tsx` já instalado — ignorar `npx shadcn@latest add select` do PRD
- Nenhuma rota `/projetos/[id]/timeline` existe ainda (nenhum `page.tsx`, `loading.tsx`, `_components/`)
- Padrões estabelecidos em `fases-manager.tsx`, `fase-form-dialog.tsx`, `tarefa-form-dialog.tsx`

## Desired End State

Página `/projetos/[id]/timeline` funcional com:
- Três seções: Reuniões, Decisões, Checkpoints
- CRUD completo por seção (criar, editar, excluir via dialogs/AlertDialog)
- Loading skeleton com 3 seções animate-pulse
- `pnpm build` sem erros TypeScript

## What We're NOT Doing

- Backend — actions, queries, service, schemas já existem (PRD-04a)
- Visualização consolidada da timeline (EventoTimeline) — PRD-07b
- Novos pacotes npm
- Instalação do `select` shadcn (já existe)
- `router.refresh()` nos dialogs (desnecessário — `revalidatePath()` já nas actions)

## Key Discoveries

- `src/queries/registro-operacional.queries.ts`: 3 funções com `React.cache()` + `server-only`
- `src/queries/fase.queries.ts`: `getFasesByProjeto()` retorna `is_fase_geral` — mapear antes de passar ao manager
- Datas chegam como `Date` — sem conversão de `Decimal` necessária
- `zodResolver(schema as any)` com eslint-disable — workaround tipos `@hookform/resolvers` v5 + Zod v4.3.x
- Select nullable: `value={field.value ?? ''}` + `onValueChange={(v) => field.onChange(v || null)}`
- Datas defaultValues modo edição: `toLocaleDateString('sv-SE') as unknown as Date` (evita bug UTC-3)
- `notFound()` desnecessário na page — layout pai já trata projeto inexistente
- Sem `<Skeleton>` component — usar `div` com `animate-pulse rounded bg-muted`

## Implementation Approach

Três fases progressivas: infraestrutura server → form dialogs → manager client. Cada fase resulta em um commit isolado. Os dialogs (Fase 2) seguem o mesmo padrão repetitivo; o manager (Fase 3) orquestra tudo.

---

## Phase 1: Server Component + Loading Skeleton

### Overview

Criar `page.tsx` (Server Component) e `loading.tsx` (skeleton). A página busca os 4 datasets em paralelo e passa ao `RegistrosManager` (stub — será criado na Fase 3).

### Changes Required

#### 1. `page.tsx`

**File**: `src/app/(internal)/projetos/[id]/timeline/page.tsx`

```tsx
import { getReunioesByProjeto, getDecisoesByProjeto, getCheckpointsByProjeto } from '@/queries/registro-operacional.queries'
import { getFasesByProjeto } from '@/queries/fase.queries'
import { RegistrosManager } from './_components/registros-manager'

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [reunioes, decisoes, checkpoints, fases] = await Promise.all([
    getReunioesByProjeto(id),
    getDecisoesByProjeto(id),
    getCheckpointsByProjeto(id),
    getFasesByProjeto(id),
  ])
  return (
    <RegistrosManager
      projetoId={id}
      reunioes={reunioes}
      decisoes={decisoes}
      checkpoints={checkpoints}
      fases={fases.map(f => ({ id: f.id, nome: f.nome, is_fase_geral: f.is_fase_geral }))}
    />
  )
}
```

**Nota:** Sem `notFound()` — layout pai já trata. Sem conversão Decimal.

#### 2. `loading.tsx`

**File**: `src/app/(internal)/projetos/[id]/timeline/loading.tsx`

Três seções com skeleton animate-pulse, seguindo padrão de `fases/loading.tsx`:

```tsx
export default function TimelineLoading() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="h-9 w-32 animate-pulse rounded bg-muted" />
          </div>
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex items-center gap-4 rounded-lg border p-4">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="flex-1 h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

#### 3. Stub temporário do `RegistrosManager`

**File**: `src/app/(internal)/projetos/[id]/timeline/_components/registros-manager.tsx`

Stub mínimo para `pnpm build` passar nesta fase:

```tsx
'use client'

// tipos locais — serão expandidos na Fase 3
type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type ReuniaoItem = { id: string; titulo: string; data_reuniao: Date; fase_id: string | null; participantes: string | null; link_referencia: string | null; resumo_executivo: string | null; ata_resumida: string | null; created_at: Date }
type DecisaoItem = { id: string; titulo: string; descricao: string; contexto: string | null; impacto: string | null; data_decisao: Date; fase_id: string | null; reuniao_id: string | null; created_at: Date }
type CheckpointItem = { id: string; titulo: string; resumo: string; proximos_passos: string | null; data_checkpoint: Date; fase_id: string | null; created_at: Date }

type RegistrosManagerProps = {
  projetoId: string
  reunioes: ReuniaoItem[]
  decisoes: DecisaoItem[]
  checkpoints: CheckpointItem[]
  fases: FaseItem[]
}

export function RegistrosManager({ projetoId, reunioes, decisoes, checkpoints, fases }: RegistrosManagerProps) {
  return <div>Timeline — em construção</div>
}
```

### Success Criteria

#### Automated Verification:
- [x] `pnpm build` sem erros TypeScript

#### Manual Verification:
- [ ] Acessar `/projetos/[id]/timeline` → página carrega (exibe "Timeline — em construção")
- [ ] Navegar entre abas → aba "Timeline" ativa e carrega

---

## Phase 2: Form Dialogs (Reunião, Decisão, Checkpoint)

### Overview

Criar os 3 dialogs de formulário. Todos seguem o mesmo padrão de `fase-form-dialog.tsx` / `tarefa-form-dialog.tsx`. Podem ser implementados em sequência no mesmo commit.

### Changes Required

#### 1. `reuniao-form-dialog.tsx`

**File**: `src/app/(internal)/projetos/[id]/timeline/_components/reuniao-form-dialog.tsx`

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReuniaoFormSchema, type ReuniaoFormData } from '@/types/schemas/reuniao.schema'
import { criarReuniaoAction, editarReuniaoAction } from '@/actions/registro-operacional.actions'

type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type ReuniaoItem = {
  id: string; titulo: string; data_reuniao: Date; fase_id: string | null
  participantes: string | null; link_referencia: string | null
  resumo_executivo: string | null; ata_resumida: string | null; created_at: Date
}

type ReuniaoFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  reuniao?: ReuniaoItem
  onSuccess?: () => void
}

export function ReuniaoFormDialog({ trigger, projetoId, fases, reuniao, onSuccess }: ReuniaoFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ReuniaoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ReuniaoFormSchema as any),
    defaultValues: reuniao ? {
      titulo: reuniao.titulo,
      data_reuniao: reuniao.data_reuniao.toLocaleDateString('sv-SE') as unknown as Date,
      fase_id: reuniao.fase_id ?? null,
      participantes: reuniao.participantes ?? '',
      link_referencia: reuniao.link_referencia ?? '',
      resumo_executivo: reuniao.resumo_executivo ?? '',
      ata_resumida: reuniao.ata_resumida ?? '',
    } : {
      titulo: '',
      data_reuniao: undefined,
      fase_id: null,
    },
  })

  function onSubmit(data: ReuniaoFormData) {
    startTransition(async () => {
      const result = reuniao
        ? await editarReuniaoAction(reuniao.id, data)
        : await criarReuniaoAction(projetoId, data)
      if (result.success) {
        toast.success(reuniao ? 'Reunião atualizada' : 'Reunião criada')
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reuniao ? 'Editar reunião' : 'Nova reunião'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...form.register('titulo')} />
            {form.formState.errors.titulo && (
              <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="data_reuniao">Data *</Label>
            <Input id="data_reuniao" type="date" {...form.register('data_reuniao')} />
            {form.formState.errors.data_reuniao && (
              <p className="text-sm text-destructive">{form.formState.errors.data_reuniao.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Fase</Label>
            <Controller
              name="fase_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem fase</SelectItem>
                    {fases.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.is_fase_geral ? `${f.nome} (Geral)` : f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="participantes">Participantes</Label>
            <Textarea id="participantes" {...form.register('participantes')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="link_referencia">Link de referência</Label>
            <Input id="link_referencia" {...form.register('link_referencia')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="resumo_executivo">Resumo executivo</Label>
            <Textarea id="resumo_executivo" {...form.register('resumo_executivo')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ata_resumida">Ata resumida</Label>
            <Textarea id="ata_resumida" {...form.register('ata_resumida')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

#### 2. `decisao-form-dialog.tsx`

**File**: `src/app/(internal)/projetos/[id]/timeline/_components/decisao-form-dialog.tsx`

Mesmo padrão de Reunião, com campos adicionais `descricao` (obrigatório), `reuniao_id` (Select nullable), `contexto`, `impacto`.

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DecisaoFormSchema, type DecisaoFormData } from '@/types/schemas/decisao.schema'
import { criarDecisaoAction, editarDecisaoAction } from '@/actions/registro-operacional.actions'

type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type ReuniaoItem = { id: string; titulo: string; data_reuniao: Date; fase_id: string | null; participantes: string | null; link_referencia: string | null; resumo_executivo: string | null; ata_resumida: string | null; created_at: Date }
type DecisaoItem = { id: string; titulo: string; descricao: string; contexto: string | null; impacto: string | null; data_decisao: Date; fase_id: string | null; reuniao_id: string | null; created_at: Date }

type DecisaoFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  reunioes: ReuniaoItem[]
  decisao?: DecisaoItem
  onSuccess?: () => void
}

export function DecisaoFormDialog({ trigger, projetoId, fases, reunioes, decisao, onSuccess }: DecisaoFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<DecisaoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(DecisaoFormSchema as any),
    defaultValues: decisao ? {
      titulo: decisao.titulo,
      descricao: decisao.descricao,
      data_decisao: decisao.data_decisao.toLocaleDateString('sv-SE') as unknown as Date,
      fase_id: decisao.fase_id ?? null,
      reuniao_id: decisao.reuniao_id ?? null,
      contexto: decisao.contexto ?? '',
      impacto: decisao.impacto ?? '',
    } : { titulo: '', descricao: '', data_decisao: undefined, fase_id: null, reuniao_id: null },
  })

  function onSubmit(data: DecisaoFormData) {
    startTransition(async () => {
      const result = decisao
        ? await editarDecisaoAction(decisao.id, data)
        : await criarDecisaoAction(projetoId, data)
      if (result.success) {
        toast.success(decisao ? 'Decisão atualizada' : 'Decisão criada')
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{decisao ? 'Editar decisão' : 'Nova decisão'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...form.register('titulo')} />
            {form.formState.errors.titulo && (
              <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição *</Label>
            <Textarea id="descricao" {...form.register('descricao')} />
            {form.formState.errors.descricao && (
              <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="data_decisao">Data *</Label>
            <Input id="data_decisao" type="date" {...form.register('data_decisao')} />
            {form.formState.errors.data_decisao && (
              <p className="text-sm text-destructive">{form.formState.errors.data_decisao.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Fase</Label>
            <Controller
              name="fase_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem fase</SelectItem>
                    {fases.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.is_fase_geral ? `${f.nome} (Geral)` : f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label>Reunião de origem</Label>
            <Controller
              name="reuniao_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem reunião de origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem reunião de origem</SelectItem>
                    {reunioes.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.titulo} ({r.data_reuniao.toLocaleDateString('pt-BR')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="contexto">Contexto</Label>
            <Textarea id="contexto" {...form.register('contexto')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="impacto">Impacto</Label>
            <Textarea id="impacto" {...form.register('impacto')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

#### 3. `checkpoint-form-dialog.tsx`

**File**: `src/app/(internal)/projetos/[id]/timeline/_components/checkpoint-form-dialog.tsx`

Mesmo padrão, com campos `resumo` (obrigatório) e `proximos_passos` (opcional). Sem `reuniao_id`.

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckpointFormSchema, type CheckpointFormData } from '@/types/schemas/checkpoint.schema'
import { criarCheckpointAction, editarCheckpointAction } from '@/actions/registro-operacional.actions'

type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type CheckpointItem = { id: string; titulo: string; resumo: string; proximos_passos: string | null; data_checkpoint: Date; fase_id: string | null; created_at: Date }

type CheckpointFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fases: FaseItem[]
  checkpoint?: CheckpointItem
  onSuccess?: () => void
}

export function CheckpointFormDialog({ trigger, projetoId, fases, checkpoint, onSuccess }: CheckpointFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CheckpointFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CheckpointFormSchema as any),
    defaultValues: checkpoint ? {
      titulo: checkpoint.titulo,
      resumo: checkpoint.resumo,
      data_checkpoint: checkpoint.data_checkpoint.toLocaleDateString('sv-SE') as unknown as Date,
      fase_id: checkpoint.fase_id ?? null,
      proximos_passos: checkpoint.proximos_passos ?? '',
    } : { titulo: '', resumo: '', data_checkpoint: undefined, fase_id: null },
  })

  function onSubmit(data: CheckpointFormData) {
    startTransition(async () => {
      const result = checkpoint
        ? await editarCheckpointAction(checkpoint.id, data)
        : await criarCheckpointAction(projetoId, data)
      if (result.success) {
        toast.success(checkpoint ? 'Checkpoint atualizado' : 'Checkpoint criado')
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{checkpoint ? 'Editar checkpoint' : 'Novo checkpoint'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...form.register('titulo')} />
            {form.formState.errors.titulo && (
              <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="resumo">Resumo *</Label>
            <Textarea id="resumo" {...form.register('resumo')} />
            {form.formState.errors.resumo && (
              <p className="text-sm text-destructive">{form.formState.errors.resumo.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="data_checkpoint">Data *</Label>
            <Input id="data_checkpoint" type="date" {...form.register('data_checkpoint')} />
            {form.formState.errors.data_checkpoint && (
              <p className="text-sm text-destructive">{form.formState.errors.data_checkpoint.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Fase</Label>
            <Controller
              name="fase_id"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem fase</SelectItem>
                    {fases.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.is_fase_geral ? `${f.nome} (Geral)` : f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="proximos_passos">Próximos passos</Label>
            <Textarea id="proximos_passos" {...form.register('proximos_passos')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Success Criteria

#### Automated Verification:
- [x] `pnpm build` sem erros TypeScript

#### Manual Verification:
- [ ] Abrir "Nova reunião" → modal abre, campos em branco
- [ ] Salvar sem título → erro "Título é obrigatório" visível, modal não fecha
- [ ] Salvar sem data → erro "Data é obrigatória" visível, modal não fecha
- [ ] Select de fase_id exibe fases do projeto (fase Geral com sufixo "(Geral)")
- [ ] Select de reuniao_id (Decisão) exibe reuniões existentes
- [ ] Salvar decisão sem reuniao_id → campo vazio sem erros, enviado como null
- [ ] Salvar checkpoint sem resumo → erro "Resumo é obrigatório"

> **Implementation Note:** Após automated + manual verification, fazer commit da Fase 2 antes de prosseguir.

---

## Phase 3: `registros-manager.tsx` — Client Component Principal

### Overview

Substituir o stub da Fase 1 pelo componente completo. Orquestra as três seções com listagem, dialogs de criar/editar e AlertDialogs de exclusão.

### Changes Required

#### 1. `registros-manager.tsx` — implementação completa

**File**: `src/app/(internal)/projetos/[id]/timeline/_components/registros-manager.tsx`

Substituir o stub pelo componente completo:

```tsx
'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  excluirReuniaoAction,
  excluirDecisaoAction,
  excluirCheckpointAction,
} from '@/actions/registro-operacional.actions'
import { ReuniaoFormDialog } from './reuniao-form-dialog'
import { DecisaoFormDialog } from './decisao-form-dialog'
import { CheckpointFormDialog } from './checkpoint-form-dialog'

type FaseItem = { id: string; nome: string; is_fase_geral: boolean }
type ReuniaoItem = {
  id: string; titulo: string; data_reuniao: Date; fase_id: string | null
  participantes: string | null; link_referencia: string | null
  resumo_executivo: string | null; ata_resumida: string | null; created_at: Date
}
type DecisaoItem = {
  id: string; titulo: string; descricao: string; contexto: string | null
  impacto: string | null; data_decisao: Date; fase_id: string | null
  reuniao_id: string | null; created_at: Date
}
type CheckpointItem = {
  id: string; titulo: string; resumo: string; proximos_passos: string | null
  data_checkpoint: Date; fase_id: string | null; created_at: Date
}

type RegistrosManagerProps = {
  projetoId: string
  reunioes: ReuniaoItem[]
  decisoes: DecisaoItem[]
  checkpoints: CheckpointItem[]
  fases: FaseItem[]
}

export function RegistrosManager({ projetoId, reunioes, decisoes, checkpoints, fases }: RegistrosManagerProps) {
  const [isPendingReuniao, startReuniaoTransition] = useTransition()
  const [isPendingDecisao, startDecisaoTransition] = useTransition()
  const [isPendingCheckpoint, startCheckpointTransition] = useTransition()

  function handleExcluirReuniao(id: string) {
    startReuniaoTransition(async () => {
      const result = await excluirReuniaoAction(id)
      if (result.success) toast.success('Reunião excluída')
      else toast.error(result.error)
    })
  }

  function handleExcluirDecisao(id: string) {
    startDecisaoTransition(async () => {
      const result = await excluirDecisaoAction(id)
      if (result.success) toast.success('Decisão excluída')
      else toast.error(result.error)
    })
  }

  function handleExcluirCheckpoint(id: string) {
    startCheckpointTransition(async () => {
      const result = await excluirCheckpointAction(id)
      if (result.success) toast.success('Checkpoint excluído')
      else toast.error(result.error)
    })
  }

  return (
    <div className="space-y-8">
      {/* Seção Reuniões */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reuniões</h2>
          <ReuniaoFormDialog
            trigger={<Button size="sm">Nova reunião</Button>}
            projetoId={projetoId}
            fases={fases}
          />
        </div>
        {reunioes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma reunião registrada.</p>
        ) : (
          reunioes.map(reuniao => (
            <div key={reuniao.id} className="flex items-center gap-4 rounded-lg border p-4">
              <span className="text-sm text-muted-foreground shrink-0">
                {reuniao.data_reuniao.toLocaleDateString('pt-BR')}
              </span>
              <span className="flex-1 font-medium">{reuniao.titulo}</span>
              <div className="flex gap-2">
                <ReuniaoFormDialog
                  trigger={<Button variant="ghost" size="sm">Editar</Button>}
                  projetoId={projetoId}
                  fases={fases}
                  reuniao={reuniao}
                />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="sm" className="text-destructive" disabled={isPendingReuniao}>
                        Excluir
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir reunião?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleExcluirReuniao(reuniao.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Seção Decisões */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Decisões</h2>
          <DecisaoFormDialog
            trigger={<Button size="sm">Nova decisão</Button>}
            projetoId={projetoId}
            fases={fases}
            reunioes={reunioes}
          />
        </div>
        {decisoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma decisão registrada.</p>
        ) : (
          decisoes.map(decisao => (
            <div key={decisao.id} className="flex items-center gap-4 rounded-lg border p-4">
              <span className="text-sm text-muted-foreground shrink-0">
                {decisao.data_decisao.toLocaleDateString('pt-BR')}
              </span>
              <span className="flex-1 font-medium">{decisao.titulo}</span>
              <div className="flex gap-2">
                <DecisaoFormDialog
                  trigger={<Button variant="ghost" size="sm">Editar</Button>}
                  projetoId={projetoId}
                  fases={fases}
                  reunioes={reunioes}
                  decisao={decisao}
                />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="sm" className="text-destructive" disabled={isPendingDecisao}>
                        Excluir
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir decisão?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleExcluirDecisao(decisao.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Seção Checkpoints */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Checkpoints</h2>
          <CheckpointFormDialog
            trigger={<Button size="sm">Novo checkpoint</Button>}
            projetoId={projetoId}
            fases={fases}
          />
        </div>
        {checkpoints.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum checkpoint registrado.</p>
        ) : (
          checkpoints.map(checkpoint => (
            <div key={checkpoint.id} className="flex items-center gap-4 rounded-lg border p-4">
              <span className="text-sm text-muted-foreground shrink-0">
                {checkpoint.data_checkpoint.toLocaleDateString('pt-BR')}
              </span>
              <span className="flex-1 font-medium">{checkpoint.titulo}</span>
              <div className="flex gap-2">
                <CheckpointFormDialog
                  trigger={<Button variant="ghost" size="sm">Editar</Button>}
                  projetoId={projetoId}
                  fases={fases}
                  checkpoint={checkpoint}
                />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="sm" className="text-destructive" disabled={isPendingCheckpoint}>
                        Excluir
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir checkpoint?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleExcluirCheckpoint(checkpoint.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

### Success Criteria

#### Automated Verification:
- [x] `pnpm build` sem erros TypeScript

#### Manual Verification:
- [ ] Acessar `/projetos/[id]/timeline` → 3 seções visíveis (Reuniões, Decisões, Checkpoints)
- [ ] Seções vazias exibem empty state correto por tipo
- [ ] "Nova reunião" → preencher título + data → salvar → item aparece na listagem + toast "Reunião criada"
- [ ] "Editar" em reunião existente → modal abre com dados preenchidos → salvar → dados atualizados + toast "Reunião atualizada"
- [ ] "Excluir" em reunião → AlertDialog aparece → confirmar → item removido + toast "Reunião excluída"
- [ ] "Nova decisão" com reuniao_id preenchido → decisão vinculada à reunião no banco (verificar Prisma Studio)
- [ ] "Nova decisão" sem reuniao_id → `reuniao_id = null` no banco
- [ ] "Novo checkpoint" com resumo vazio → erro "Resumo é obrigatório"
- [ ] EventoTimeline criado/removido junto com o registro (verificar Prisma Studio)

> **Implementation Note:** Após automated + manual verification, fazer commit da Fase 3 antes de declarar o PRD concluído.

---

## Testing Strategy

### Manual Testing Steps:
1. Abrir `/projetos/[id]/timeline` — verificar 3 seções
2. Testar CRUD completo para cada tipo (Reunião, Decisão, Checkpoint)
3. Verificar erros de validação por campo (`titulo`, `data`, `descricao`, `resumo`)
4. Verificar selects: `fase_id` com opção "Sem fase", `reuniao_id` com opção "Sem reunião de origem"
5. Verificar exclusão via AlertDialog + toast
6. Verificar EventoTimeline via `npx prisma studio` (tabela `evento_timeline`)

## References

- Original PRD: `specs/prds/prd-04b-registros-operacionais-ui.md`
- Research: `specs/workflow/research/2026-03-14-prd-04b-registros-operacionais-ui.md`
- Backend actions: `src/actions/registro-operacional.actions.ts`
- Backend queries: `src/queries/registro-operacional.queries.ts`
- Schemas: `src/types/schemas/reuniao.schema.ts`, `decisao.schema.ts`, `checkpoint.schema.ts`
- Padrão de dialog: `src/app/(internal)/projetos/[id]/fases/_components/tarefa-form-dialog.tsx`
- Padrão AlertDialog: `src/app/(internal)/projetos/[id]/fases/_components/fases-manager.tsx`
- Padrão skeleton: `src/app/(internal)/projetos/[id]/fases/loading.tsx`
