---
date: 2026-03-13T12:00:00-03:00
researcher: Claude
git_commit: 1ede2a5
branch: feature/projetos-prd-02c
repository: gestao-projetos
topic: "PRD-02c — Fases UI: pesquisa para planejamento"
tags: [research, fases, ui, dnd-kit, prd-02c]
status: complete
last_updated: 2026-03-13
last_updated_by: Claude
---

# Research: PRD-02c — Fases UI

**Date**: 2026-03-13T12:00:00-03:00
**Git Commit**: 1ede2a5
**Branch**: feature/projetos-prd-02c
**Repository**: gestao-projetos
**Research Mode**: Mixed (backend existe, UI a criar)

## Research Question

Levantar todo o contexto necessário para planejar a implementação do PRD-02c — UI de fases com listagem, CRUD via modais, drag-and-drop e restrições da Fase Geral.

## Summary

O PRD-02c é um PRD **puramente frontend** (4 arquivos novos + 1 modificação). Toda a camada backend (actions, service, queries, schema) já foi entregue no PRD-02a e está funcional. A UI de projetos (PRD-02b) está concluída e define os padrões visuais e de código a seguir. A única dependência externa nova é `@dnd-kit` para drag-and-drop.

## Detailed Findings

### 1. Backend existente (PRD-02a) — pronto para consumo

**Actions** (`src/actions/fase.actions.ts`):
| Action | Assinatura | Retorno |
|--------|-----------|---------|
| `criarFaseAction` | `(projetoId: string, data: FaseFormData)` | `{ success, error?, faseId? }` |
| `editarFaseAction` | `(faseId: string, data: FaseFormData)` | `{ success, error? }` |
| `excluirFaseAction` | `(faseId: string)` | `{ success, error? }` |
| `reordenarFasesAction` | `(projetoId: string, fasesOrdenadas: { id: string; ordem: number }[])` | `{ success, error? }` |

**Query** (`src/queries/fase.queries.ts`):
- `getFasesByProjeto(projetoId)` — retorna fases ordenadas por `ordem asc`
- Campos: `id, nome, descricao, ordem, status, data_inicio_prevista, data_fim_prevista, data_inicio_real, data_fim_real, is_fase_geral, created_at`

**Schema** (`src/types/schemas/fase.schema.ts`):
- `FaseFormSchema` com campos: nome (required), descricao, status (enum), 4 datas (coerce date optional nullable)
- Type: `FaseFormData = z.infer<typeof FaseFormSchema>`

**Service** (`src/services/fase.service.ts`):
- `excluirFase(faseId)` — bloqueia exclusão de fase geral
- `reordenarFases(projetoId, fasesOrdenadas)` — garante fase geral em posição 1, transaction

### 2. Padrões UI do PRD-02b — a seguir

**Server Component (page.tsx)**:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await query(id)
  return <ClientComponent data={data} />
}
```

**Loading skeleton**: divs com `animate-pulse rounded bg-muted` (sem componente `<Skeleton>`)

**Dialog pattern** (shadcn v4 + base-ui):
- `<DialogTrigger render={<Button>...</Button>} />` — render prop, não children
- `trigger` prop tipada como `React.ReactElement` (não ReactNode)
- Dialog state: `useState(false)` para `open/onOpenChange`

**AlertDialog pattern**:
- `<AlertDialogTrigger render={<Button variant="destructive">...}` />
- Footer com Cancel + Action (variant destructive)

**Form pattern**:
- `useForm<FaseFormData>({ resolver: zodResolver(FaseFormSchema as any) })`
- `useTransition()` para isPending
- Select via `<Controller>` com `onValueChange={(v) => field.onChange(v ?? '')}`
- Datas: `toLocaleDateString('sv-SE') as unknown as Date`
- Erros: `<p className="text-sm text-destructive">{error.message}</p>`

**Action call pattern**:
```tsx
startTransition(async () => {
  const result = await action(...)
  if (result.success) { toast.success(...); setOpen(false) }
  else { toast.error(result.error) }
})
```

### 3. Constantes existentes (`src/lib/constants.ts`)

Contém apenas `STATUS_LABELS` (projetos). PRD-02c adiciona `FASE_STATUS_LABELS` ao mesmo arquivo.

### 4. Tabs já existentes

`src/app/(internal)/projetos/[id]/_components/projeto-tabs.tsx` já define a aba "Fases" apontando para `/projetos/${id}/fases`. A rota existe no menu mas não tem page.tsx ainda.

### 5. Dependência nova: @dnd-kit

Pacotes a instalar: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

Imports necessários:
```tsx
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
```

## Arquivos a criar/modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/constants.ts` | Modificar | Adicionar `FASE_STATUS_LABELS` |
| `src/app/(internal)/projetos/[id]/fases/page.tsx` | Criar | Server Component — busca fases |
| `src/app/(internal)/projetos/[id]/fases/loading.tsx` | Criar | Skeleton |
| `src/app/(internal)/projetos/[id]/fases/_components/fase-form-dialog.tsx` | Criar | Dialog criar/editar |
| `src/app/(internal)/projetos/[id]/fases/_components/fases-manager.tsx` | Criar | Client Component DnD + CRUD |

## Regras de negócio (frontend)

| Regra | Implementação |
|-------|--------------|
| R-Geral-1: Fase Geral sempre posição 1 | Sem drag handle, `onDragEnd` impede mover |
| R-Geral-2: Fase Geral não pode ser excluída | Ocultar botão excluir quando `is_fase_geral` |

## Design & Decisions

- **Padrão de Dialog**: reutilizável via prop `trigger: React.ReactElement`, modo criar/editar via presença de `fase?`
- **Reordenação otimista**: atualizar estado local antes de chamar action
- **zodResolver as any**: padrão do projeto para contornar incompatibilidade Zod 4.x
- **Datas sv-SE**: padrão do projeto para evitar bug de fuso horário
- **Sem notFound**: layout pai já trata projeto inexistente

## Plano de fases de implementação sugerido

### Fase 1 — Dependências e constantes
- Instalar `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Adicionar `FASE_STATUS_LABELS` em `src/lib/constants.ts`
- **Verificação**: `pnpm build` passa

### Fase 2 — page.tsx + loading.tsx
- Criar `fases/page.tsx` (Server Component)
- Criar `fases/loading.tsx` (Skeleton)
- **Verificação**: `pnpm build` passa, aba Fases carrega sem erro

### Fase 3 — fase-form-dialog.tsx
- Dialog reutilizável criar/editar
- 7 campos: nome, status (Select), descricao (textarea), 4 datas
- zodResolver + useForm + useTransition
- **Verificação**: `pnpm build` passa

### Fase 4 — fases-manager.tsx (listagem + CRUD)
- Listagem com cards
- Botão "Nova fase" → abre dialog criar
- Botão "Editar" por fase → abre dialog editar
- AlertDialog exclusão (só fases não-gerais)
- Restrições visuais da Fase Geral
- **Verificação**: `pnpm build` passa, CRUD funciona

### Fase 5 — Drag-and-drop
- DndContext + SortableContext no fases-manager
- useSortable por card
- onDragEnd com arrayMove + reordenarFasesAction
- Fase Geral sem drag handle, imóvel
- **Verificação**: `pnpm build` passa, reordenação funciona

## Open Questions

- Nenhuma — PRD-02c está bem especificado e todo o backend necessário existe.

## References

- `specs/prds/prd-02c-fases-ui.md` — especificação completa
- `src/actions/fase.actions.ts` — actions do backend
- `src/queries/fase.queries.ts` — query de fases
- `src/services/fase.service.ts` — regras de negócio
- `src/types/schemas/fase.schema.ts` — schema Zod
- `src/lib/constants.ts` — constantes existentes
- `src/app/(internal)/projetos/[id]/_components/projeto-detalhe.tsx` — padrão de Dialog/AlertDialog
- `src/app/(internal)/projetos/[id]/_components/projeto-tabs.tsx` — tabs com aba Fases
