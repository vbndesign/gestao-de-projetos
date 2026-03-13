# PRD-02c — Fases UI: Implementation Plan

## Overview

Implementar a aba `/projetos/[id]/fases` com listagem, CRUD via modais, drag-and-drop e restrições da Fase Geral. PRD puramente frontend — toda a camada backend (actions, service, queries, schema) já existe (PRD-02a). Segue os padrões visuais e de código estabelecidos no PRD-02b.

## Current State Analysis

### Backend pronto (PRD-02a)

| Camada | Arquivo | Status |
|--------|---------|--------|
| Actions | `src/actions/fase.actions.ts` | ✅ `criarFaseAction`, `editarFaseAction`, `excluirFaseAction`, `reordenarFasesAction` |
| Query | `src/queries/fase.queries.ts` | ✅ `getFasesByProjeto(projetoId)` — retorna fases ordenadas por `ordem asc` |
| Service | `src/services/fase.service.ts` | ✅ `excluirFase` (bloqueia fase geral), `reordenarFases` (fase geral posição 1) |
| Schema | `src/types/schemas/fase.schema.ts` | ✅ `FaseFormSchema` + `FaseFormData` |

### UI existente (PRD-02b)

- Tab "Fases" já definida em `projeto-tabs.tsx:8` → aponta para `/projetos/${id}/fases`
- Rota existe no menu mas **não tem `page.tsx`** ainda
- Layout pai (`projetos/[id]/layout.tsx`) já trata projeto inexistente — sem necessidade de `notFound()`

### Padrões a seguir (extraídos do PRD-02b)

- **Dialog**: `useState(false)` para open/onOpenChange, `DialogTrigger` com prop `render` (não children)
- **trigger prop**: tipo `React.ReactElement` (não `ReactNode`)
- **Form**: `useForm<T>({ resolver: zodResolver(Schema as any) })` + `useTransition()`
- **Select**: `<Controller>` com `onValueChange={(v) => field.onChange(v ?? '')}`
- **Datas**: `toLocaleDateString('sv-SE') as unknown as Date` para defaultValues
- **Erros**: `<p className="text-sm text-destructive">{error.message}</p>`
- **Action call**: `startTransition(async () => { const result = await action(...); if (result.success) { toast.success(); setOpen(false) } else { toast.error(result.error) } })`
- **Skeleton**: divs com `animate-pulse rounded bg-muted` (sem componente `<Skeleton>`)
- **Server Component**: `params: Promise<{ id: string }>`, `await params`, dados passados a Client Component

## Desired End State

A aba Fases funcional com:
- Listagem de fases em cards ordenados
- Criação e edição via modal com 7 campos (nome, status, descrição, 4 datas)
- Exclusão com confirmação (AlertDialog) — apenas fases não-gerais
- Reordenação por drag-and-drop com `@dnd-kit` — Fase Geral imóvel em posição 1
- Skeleton loading

**Verificação final**: `pnpm build` sem erros + checklist manual do PRD passa.

## What We're NOT Doing

- Backend: actions, queries, service, schema já existem (PRD-02a)
- Tarefas dentro das fases (PRD-03)
- Outras abas (Timeline, Horas)
- Testes automatizados (não há framework de testes configurado)

## Implementation Approach

5 fases incrementais, cada uma com build verificável. Fases 4 e 5 requerem verificação manual. A ordem segue a dependência: constantes → página → dialog → manager com CRUD → drag-and-drop.

---

## Phase 1: Dependências e constantes

### Overview
Instalar `@dnd-kit` e adicionar `FASE_STATUS_LABELS` em `constants.ts`.

### Changes Required:

#### 1. Instalar pacotes @dnd-kit
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### 2. Adicionar constante de status de fases
**File**: `src/lib/constants.ts`
**Changes**: Adicionar `FASE_STATUS_LABELS` após `STATUS_LABELS` existente

```ts
export const FASE_STATUS_LABELS: Record<string, string> = {
  nao_iniciada: 'Não iniciada',
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando cliente',
  concluida: 'Concluída',
  pausada: 'Pausada',
  cancelada: 'Cancelada',
}
```

### Success Criteria:

#### Automated Verification:
- [x] Pacotes instalados: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] Type checking passes: `pnpm build`

#### Manual Verification:
- [x] Nenhuma — fase puramente de setup

**Implementation Note**: Fase simples, prosseguir automaticamente após build passar.

---

## Phase 2: page.tsx + loading.tsx

### Overview
Criar o Server Component da rota `/projetos/[id]/fases` e o skeleton de loading.

### Changes Required:

#### 1. Server Component da página de fases
**File**: `src/app/(internal)/projetos/[id]/fases/page.tsx` (criar)

```tsx
import { getFasesByProjeto } from '@/queries/fase.queries'
import { FasesManager } from './_components/fases-manager'

export default async function FasesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fases = await getFasesByProjeto(id)

  return <FasesManager projetoId={id} fases={fases} />
}
```

**Padrão seguido**: mesmo de `projetos/[id]/page.tsx` — async params, query, passa dados a Client Component. Sem `notFound()` (layout pai trata).

#### 2. Skeleton de loading
**File**: `src/app/(internal)/projetos/[id]/fases/loading.tsx` (criar)

```tsx
export default function FasesLoading() {
  return (
    <div className="space-y-4">
      {/* Botão "Nova fase" placeholder */}
      <div className="flex justify-end">
        <div className="h-9 w-28 animate-pulse rounded bg-muted" />
      </div>
      {/* Cards de fase skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
            <div className="h-5 w-5 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Padrão seguido**: `Array.from({ length: N })`, `animate-pulse bg-muted`, espelha estrutura real dos cards.

#### 3. Stub do FasesManager (para build passar)
**File**: `src/app/(internal)/projetos/[id]/fases/_components/fases-manager.tsx` (criar)

Stub temporário — será substituído nas fases 4-5:

```tsx
'use client'

type FaseData = {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  status: string
  data_inicio_prevista: Date | null
  data_fim_prevista: Date | null
  data_inicio_real: Date | null
  data_fim_real: Date | null
  is_fase_geral: boolean
  created_at: Date
}

type FasesManagerProps = {
  projetoId: string
  fases: FaseData[]
}

export function FasesManager({ fases }: FasesManagerProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        {fases.length} fase(s) encontrada(s).
      </p>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `pnpm build`

#### Manual Verification:
- [ ] Acessar `/projetos/[id]/fases` → página carrega sem erro, mostra contagem de fases
- [ ] Loading skeleton aparece durante carregamento

**Implementation Note**: Após build passar, pausar para verificação manual. O stub será expandido nas fases seguintes.

---

## Phase 3: fase-form-dialog.tsx

### Overview
Dialog reutilizável para criar e editar fases. 7 campos: nome, status (Select), descrição (textarea), 4 datas.

### Changes Required:

#### 1. Dialog de formulário de fase
**File**: `src/app/(internal)/projetos/[id]/fases/_components/fase-form-dialog.tsx` (criar)

**Props**:
```ts
type FaseFormDialogProps = {
  trigger: React.ReactElement
  projetoId: string
  fase?: FaseData          // se presente → modo edição
  onSuccess?: () => void
}
```

**Estrutura do componente**:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FaseFormSchema, type FaseFormData } from '@/types/schemas/fase.schema'
import { criarFaseAction, editarFaseAction } from '@/actions/fase.actions'
import { FASE_STATUS_LABELS } from '@/lib/constants'
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
```

**Campos do formulário** (7 campos, ordem do PRD):

| Campo | Input | Register/Controller | Default (editar) |
|-------|-------|---------------------|-------------------|
| nome | `<Input>` | `form.register('nome')` | `fase.nome` |
| status | `<Select>` | `<Controller>` com `onValueChange={(v) => field.onChange(v ?? '')}` | `fase.status as FaseFormData['status']` (criar: `'nao_iniciada'`) |
| descricao | `<Textarea>` | `form.register('descricao')` | `fase.descricao ?? ''` |
| data_inicio_prevista | `<Input type="date">` | `form.register(...)` com `setValueAs: (v) => v === '' ? undefined : v` | `toLocaleDateString('sv-SE') as unknown as Date` |
| data_fim_prevista | idem | idem | idem |
| data_inicio_real | idem | idem | idem |
| data_fim_real | idem | idem | idem |

**Comportamento**:
- `const [open, setOpen] = useState(false)`
- `const [isPending, startTransition] = useTransition()`
- `useForm<FaseFormData>({ resolver: zodResolver(FaseFormSchema as any), defaultValues: { ... } })`
- `onSubmit`: modo criar → `criarFaseAction(projetoId, data)`, modo editar → `editarFaseAction(fase.id, data)`
- Sucesso: `toast.success(...)`, `setOpen(false)`, `onSuccess?.()`
- Erro: `toast.error(result.error)`
- Título dinâmico: `fase ? 'Editar fase' : 'Nova fase'`
- Botão submit: `disabled={isPending}`, texto `isPending ? 'Salvando...' : 'Salvar'`

**Erro de validação** (padrão do projeto):
```tsx
{form.formState.errors.nome && (
  <p className="text-sm text-destructive">
    {form.formState.errors.nome.message}
  </p>
)}
```

**DialogTrigger** (padrão base-ui):
```tsx
<DialogTrigger render={trigger} />
```

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `pnpm build`

#### Manual Verification:
- [x] Nenhuma — dialog será testado na fase 4 quando integrado ao manager

**Implementation Note**: O dialog é criado isolado mas só será utilizável após a fase 4 integrá-lo ao fases-manager.

---

## Phase 4: fases-manager.tsx (listagem + CRUD)

### Overview
Expandir o stub do fases-manager com listagem em cards, botões de criar/editar/excluir, e restrições da Fase Geral. Sem drag-and-drop ainda.

### Changes Required:

#### 1. Expandir fases-manager.tsx
**File**: `src/app/(internal)/projetos/[id]/fases/_components/fases-manager.tsx` (substituir stub)

**Imports necessários**:
```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { excluirFaseAction } from '@/actions/fase.actions'
import { FASE_STATUS_LABELS } from '@/lib/constants'
import { FaseFormDialog } from './fase-form-dialog'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
```

**Tipo FaseData** (mesmo da fase 2, extrair ou manter inline):
```ts
type FaseData = {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  status: string
  data_inicio_prevista: Date | null
  data_fim_prevista: Date | null
  data_inicio_real: Date | null
  data_fim_real: Date | null
  is_fase_geral: boolean
  created_at: Date
}
```

**Layout do componente**:
```tsx
export function FasesManager({ projetoId, fases }: FasesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleExcluir(faseId: string) {
    startTransition(async () => {
      const result = await excluirFaseAction(faseId)
      if (result.success) {
        toast.success('Fase excluída.')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Header com botão Nova fase */}
      <div className="flex justify-end">
        <FaseFormDialog
          trigger={<Button>Nova fase</Button>}
          projetoId={projetoId}
        />
      </div>

      {/* Lista de fases em cards */}
      <div className="space-y-3">
        {fases.map((fase) => (
          <div key={fase.id} className="flex items-center gap-4 rounded-lg border p-4">
            {/* Placeholder para drag handle (fase 5) */}
            <div className="w-5" />

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{fase.nome}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs">
                  {FASE_STATUS_LABELS[fase.status] ?? fase.status}
                </span>
                {fase.is_fase_geral && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Geral
                  </span>
                )}
              </div>
              {fase.descricao && (
                <p className="text-sm text-muted-foreground truncate">{fase.descricao}</p>
              )}
              {/* Datas se existirem */}
              {(fase.data_inicio_prevista || fase.data_fim_prevista) && (
                <p className="text-xs text-muted-foreground">
                  {fase.data_inicio_prevista && `Início: ${new Date(fase.data_inicio_prevista).toLocaleDateString('pt-BR')}`}
                  {fase.data_inicio_prevista && fase.data_fim_prevista && ' — '}
                  {fase.data_fim_prevista && `Fim: ${new Date(fase.data_fim_prevista).toLocaleDateString('pt-BR')}`}
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <FaseFormDialog
                trigger={<Button variant="ghost" size="sm">Editar</Button>}
                projetoId={projetoId}
                fase={fase}
              />
              {/* R-Geral-2: Fase Geral não pode ser excluída — ocultar botão */}
              {!fase.is_fase_geral && (
                <AlertDialog>
                  <AlertDialogTrigger render={
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Excluir
                    </Button>
                  } />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir fase</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a fase &quot;{fase.nome}&quot;? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleExcluir(fase.id)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Regras de negócio implementadas**:
- **R-Geral-1** (visual): placeholder para drag handle — será adicionado na fase 5
- **R-Geral-2**: botão Excluir oculto quando `is_fase_geral === true`

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `pnpm build`

#### Manual Verification:
- [ ] Acessar `/projetos/[id]/fases` → lista de fases carrega, Fase Geral em primeiro
- [ ] Clicar "Nova fase" → preencher nome → salvar → nova fase aparece
- [ ] Clicar "Nova fase" → deixar nome vazio → salvar → mensagem "Nome é obrigatório"
- [ ] Clicar "Editar" em uma fase → alterar nome → salvar → nome atualizado
- [ ] Clicar "Excluir" em fase não-geral → confirmar → fase removida
- [ ] Fase Geral **não** tem botão Excluir

**Implementation Note**: Após build passar, pausar para verificação manual completa do CRUD antes de prosseguir para drag-and-drop.

---

## Phase 5: Drag-and-drop

### Overview
Adicionar reordenação por drag-and-drop com `@dnd-kit`. Fase Geral sem drag handle e imóvel em posição 1.

### Changes Required:

#### 1. Adicionar DnD ao fases-manager.tsx
**File**: `src/app/(internal)/projetos/[id]/fases/_components/fases-manager.tsx` (modificar)

**Imports adicionais**:
```tsx
import {
  DndContext, closestCenter, DragEndEvent,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reordenarFasesAction } from '@/actions/fase.actions'
```

**Estado local para reordenação otimista**:
```tsx
const [localFases, setLocalFases] = useState(fases)

// Sync com props (quando server revalida)
useEffect(() => { setLocalFases(fases) }, [fases])
```

**Sensores**:
```tsx
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
)
```

**Handler onDragEnd**:
```tsx
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return

  // R-Geral-1: impedir mover a Fase Geral
  const activeItem = localFases.find((f) => f.id === active.id)
  if (activeItem?.is_fase_geral) return

  const oldIndex = localFases.findIndex((f) => f.id === active.id)
  const newIndex = localFases.findIndex((f) => f.id === over.id)

  // Impedir mover para posição 0 (Fase Geral)
  if (newIndex === 0) return

  const reordered = arrayMove(localFases, oldIndex, newIndex)
  const withOrdem = reordered.map((f, i) => ({ ...f, ordem: i + 1 }))

  // Atualização otimista
  setLocalFases(withOrdem)

  // Persistir
  const fasesOrdenadas = withOrdem.map((f) => ({ id: f.id, ordem: f.ordem }))
  startTransition(async () => {
    const result = await reordenarFasesAction(projetoId, fasesOrdenadas)
    if (!result.success) {
      toast.error(result.error)
      setLocalFases(fases) // rollback
    }
  })
}
```

**Wrap da lista com DndContext + SortableContext**:
```tsx
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={localFases.map((f) => f.id)} strategy={verticalListSortingStrategy}>
    <div className="space-y-3">
      {localFases.map((fase) => (
        <SortableFaseCard key={fase.id} fase={fase} ... />
      ))}
    </div>
  </SortableContext>
</DndContext>
```

**Componente SortableFaseCard** (dentro do mesmo arquivo ou extraído):
```tsx
function SortableFaseCard({ fase, projetoId, onExcluir }: { ... }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: fase.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 rounded-lg border p-4">
      {/* R-Geral-1: Fase Geral sem drag handle */}
      {fase.is_fase_geral ? (
        <div className="w-5" />
      ) : (
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
          ⠿
        </button>
      )}

      {/* Restante do card igual à fase 4 */}
    </div>
  )
}
```

**Nota**: Usar `localFases` em vez de `fases` na renderização. A lista `fases` (prop) serve como fallback para rollback.

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `pnpm build`

#### Manual Verification:
- [ ] Arrastar fase não-geral → soltar em nova posição → ordem atualizada na tela
- [ ] Recarregar página → ordem persistida (confirmar via Prisma Studio)
- [ ] Fase Geral **não** tem drag handle (ícone ⠿)
- [ ] Fase Geral **não** pode ser movida (tentar arrastar sobre ela mantém posição)
- [ ] Arrastar fase para posição 1 (onde está Fase Geral) → nada acontece

**Implementation Note**: Após build passar, pausar para verificação manual completa do drag-and-drop. Esta é a última fase — após aprovação, PRD-02c está concluído.

---

## Testing Strategy

### Manual Testing Steps (checklist final do PRD):
1. Acessar `/projetos/[id]/fases` → lista carrega, Fase Geral em primeiro
2. Clicar "Nova fase" → preencher nome → salvar → nova fase aparece ao final
3. Clicar "Nova fase" → nome vazio → salvar → mensagem "Nome é obrigatório", modal não fecha
4. Clicar "Editar" em uma fase → alterar nome → salvar → nome atualizado
5. Clicar "Excluir" em fase não-geral → confirmar → fase removida
6. Arrastar fase não-geral → soltar em posição diferente → ordem persistida
7. Verificar Fase Geral → sem drag handle, sem botão excluir, sempre em primeiro

## References

- PRD: `specs/prds/prd-02c-fases-ui.md`
- Research: `specs/workflow/research/2026-03-13-prd-02c-fases-ui.md`
- Padrão Dialog/Form: `src/app/(internal)/projetos/[id]/_components/projeto-detalhe.tsx`
- Padrão tabs: `src/app/(internal)/projetos/[id]/_components/projeto-tabs.tsx`
- Actions: `src/actions/fase.actions.ts`
- Query: `src/queries/fase.queries.ts`
- Schema: `src/types/schemas/fase.schema.ts`
- Constants: `src/lib/constants.ts`
