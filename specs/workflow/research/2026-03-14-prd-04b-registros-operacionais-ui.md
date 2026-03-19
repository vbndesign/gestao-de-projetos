---
date: 2026-03-14T00:00:00-03:00
researcher: Claude
git_commit: 13cf043
branch: feature/registros-operacionais-prd04b
repository: gestao-projetos
topic: "PRD-04b — Registros Operacionais UI — contexto de implementação"
tags: [research, prd-04b, registros-operacionais, ui, dialogs, forms, timeline]
status: complete
last_updated: 2026-03-14
last_updated_by: Claude
---

# Research: PRD-04b — Registros Operacionais UI

**Date**: 2026-03-14
**Git Commit**: 13cf043
**Branch**: feature/registros-operacionais-prd04b
**Repository**: gestao-projetos
**Research Mode**: Mixed (backend PRD-04a concluído; UI PRD-04b spec-only)

## Research Question

Levantar o contexto completo do projeto para implementar PRD-04b: página `/projetos/[id]/timeline` com Reuniões, Decisões e Checkpoints — backend (schemas, queries, actions, service) já disponível do PRD-04a.

---

## Summary

O backend do módulo está 100% implementado. O `select.tsx` **já existe** (`src/components/ui/select.tsx`) — o pré-requisito do PRD pode ser ignorado. Os padrões de dialog/form/delete estão bem estabelecidos em `fase-form-dialog.tsx` e `tarefa-form-dialog.tsx`. A aba Timeline já existe em `projeto-tabs.tsx` apontando para `/projetos/[id]/timeline`.

---

## Detailed Findings

### 1. Backend disponível (PRD-04a)

#### Queries — `src/queries/registro-operacional.queries.ts`

Três funções, todas `server-only` + `React.cache()`, explict `select`:

```ts
getReunioesByProjeto(projetoId: string)   // orderBy: data_reuniao desc
getDecisoesByProjeto(projetoId: string)   // orderBy: data_decisao desc
getCheckpointsByProjeto(projetoId: string) // orderBy: data_checkpoint desc
```

Campos retornados correspondem exatamente aos tipos `ReuniaoItem`, `DecisaoItem`, `CheckpointItem` definidos no PRD-04b. **Não há conversão de Decimal necessária** (diferente de `tempo_estimado_horas` das tarefas — datas chegam como `Date`).

#### Fases — `src/queries/fase.queries.ts`

```ts
getFasesByProjeto(projetoId: string)
```

Retorna campos: `id, nome, descricao, ordem, status, is_fase_geral, created_at` + tarefas aninhadas. A `page.tsx` da timeline só precisa dos campos `id, nome, is_fase_geral` — fazer `.map(f => ({ id: f.id, nome: f.nome, is_fase_geral: f.is_fase_geral }))` como indicado no PRD.

#### Actions — `src/actions/registro-operacional.actions.ts`

9 server actions:

| Função | Assinatura |
|--------|-----------|
| `criarReuniaoAction` | `(projetoId: string, rawData: unknown)` |
| `editarReuniaoAction` | `(reuniaoId: string, rawData: unknown)` |
| `excluirReuniaoAction` | `(reuniaoId: string)` |
| `criarDecisaoAction` | `(projetoId: string, rawData: unknown)` |
| `editarDecisaoAction` | `(decisaoId: string, rawData: unknown)` |
| `excluirDecisaoAction` | `(decisaoId: string)` |
| `criarCheckpointAction` | `(projetoId: string, rawData: unknown)` |
| `editarCheckpointAction` | `(checkpointId: string, rawData: unknown)` |
| `excluirCheckpointAction` | `(checkpointId: string)` |

Todas retornam `{ success: true }` ou `{ success: false, error: string }`. Todas chamam `revalidatePath('/projetos/${projetoId}/timeline')`.

#### Schemas Zod

| Schema | Campos obrigatórios | Campos opcionais |
|--------|--------------------|--------------------|
| `ReuniaoFormSchema` | `titulo` (min 1, max 200), `data_reuniao` | `fase_id` (UUID nullable), `participantes`, `link_referencia`, `resumo_executivo`, `ata_resumida` |
| `DecisaoFormSchema` | `titulo` (min 1, max 200), `descricao` (min 1), `data_decisao` | `fase_id`, `reuniao_id` (UUID nullable), `contexto`, `impacto` |
| `CheckpointFormSchema` | `titulo` (min 1, max 200), `resumo` (min 1), `data_checkpoint` | `fase_id` (UUID nullable), `proximos_passos` |

Mensagens de erro já definidas:
- `'Título é obrigatório'` (todas)
- `'Descrição é obrigatória'` (Decisão)
- `'Resumo é obrigatório'` (Checkpoint)
- `'Data é obrigatória'` (todas, via `z.coerce.date({ error: '...' })`)

---

### 2. Select component — já instalado

**`src/components/ui/select.tsx` JÁ EXISTE.** Usa `@base-ui/react/select` como primitivo.

Componentes exportados relevantes para os formulários:
```ts
Select, SelectTrigger, SelectValue, SelectContent, SelectItem
```

**Detalhe crítico de comportamento** (registrado em `memory/project_decisions.md`):
`onValueChange` retorna `string | null`, não apenas `string`. Para campos nullable (fase_id, reuniao_id), o padrão correto com Controller é:

```tsx
<Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
```

O `v || null` converte string vazia (opção "Sem fase") de volta para `null`.

**Pré-requisito do PRD (`npx shadcn@latest add select`) pode ser ignorado** — o componente já existe.

---

### 3. Padrões de UI estabelecidos

#### Dialog pattern (`fase-form-dialog.tsx`, `tarefa-form-dialog.tsx`)

```tsx
// Props
type XFormDialogProps = {
  trigger: React.ReactElement  // não ReactNode — base-ui exige elemento
  projetoId: string
  // ...outros props de dados
  registro?: RegistroItem       // presente → modo edição
  onSuccess?: () => void
}

// Estado
const [open, setOpen] = useState(false)
const [isPending, startTransition] = useTransition()
const form = useForm({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: zodResolver(XFormSchema as any),
  defaultValues: registro ? { ...dadosDoRegistro } : { ...vazios }
})

// Trigger
<DialogTrigger render={trigger} />

// Submit
function onSubmit(data: XFormData) {
  startTransition(async () => {
    const result = await criarXAction(projetoId, data)  // ou editarXAction
    if (result.success) {
      toast.success('X criado')
      setOpen(false)
      onSuccess?.()
    } else {
      toast.error(result.error)
    }
  })
}
```

**Nota:** `tarefa-form-dialog.tsx` chama `form.reset()` após sucesso; `fase-form-dialog.tsx` chama `router.refresh()`. Para registros-manager, o PRD não menciona `router.refresh()` — a ação já chama `revalidatePath()`, que força atualização automática dos Server Components.

#### Default values para campos de data (modo edição)

```tsx
data_reuniao: reuniao.data_reuniao.toLocaleDateString('sv-SE') as unknown as Date
```

`sv-SE` produz `YYYY-MM-DD` no fuso local (evita bug de -1 dia do `.toISOString()` em UTC-3).

#### AlertDialog de exclusão (`fases-manager.tsx`)

```tsx
<AlertDialog>
  <AlertDialogTrigger
    render={
      <Button variant="ghost" size="sm" className="text-destructive" disabled={isPending}>
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
      <AlertDialogAction variant="destructive" onClick={() => handleExcluir(id)}>
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

`AlertDialogTrigger` usa a mesma prop `render` do `DialogTrigger`. O handler de exclusão usa `useTransition`:

```tsx
const [isPending, startTransition] = useTransition()

function handleExcluir(id: string) {
  startTransition(async () => {
    const result = await excluirXAction(id)
    if (result.success) toast.success('X excluído')
    else toast.error(result.error)
  })
}
```

#### Erro de campo (validação)

```tsx
{form.formState.errors.titulo && (
  <p className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
)}
```

#### Loading skeleton pattern (`fases/loading.tsx`)

Sem componente `<Skeleton>` — usar `div` com classes diretamente:

```tsx
<div className="h-5 w-48 animate-pulse rounded bg-muted" />
```

Estrutura para 3 seções (conforme PRD-04b):
```tsx
<div className="space-y-8">
  {Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="space-y-3">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-32 animate-pulse rounded bg-muted" />
      </div>
      {/* Cards */}
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
```

---

### 4. Layout e roteamento

#### `src/app/(internal)/projetos/[id]/layout.tsx`

- Trata `notFound()` se projeto não existe — a `page.tsx` da timeline **não** precisa de `notFound()`
- `params: Promise<{ id: string }>` — padrão Next.js 16
- Renderiza `ProjetoTabs` com as 4 abas

#### `src/app/(internal)/projetos/[id]/_components/projeto-tabs.tsx`

A aba "Timeline" já está definida:
```ts
{ label: 'Timeline', href: `/projetos/${id}/timeline` },
```

A rota `/projetos/[id]/timeline` está no mapa de rotas oficial e a aba já existe — basta criar a `page.tsx`.

---

### 5. Padrão de page.tsx para a timeline

Baseado em `fases/page.tsx`:

```tsx
// src/app/(internal)/projetos/[id]/timeline/page.tsx
import { Promise.all } from 'next' // não necessário, Promise.all é nativo
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

**Sem conversão Decimal** — os campos de data chegam como `Date` normalmente. Nenhum campo `Decimal` é selecionado nas queries de registros.

---

### 6. Componentes shadcn/ui disponíveis

Já instalados e disponíveis para uso nos dialogs:

| Componente | Arquivo |
|-----------|---------|
| Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger | `src/components/ui/dialog.tsx` |
| AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger | `src/components/ui/alert-dialog.tsx` |
| Button | `src/components/ui/button.tsx` |
| Input | `src/components/ui/input.tsx` |
| Label | `src/components/ui/label.tsx` |
| Textarea | `src/components/ui/textarea.tsx` |
| Select, SelectContent, SelectItem, SelectTrigger, SelectValue | `src/components/ui/select.tsx` ✅ |

---

## References

- `src/actions/registro-operacional.actions.ts` — 9 server actions CRUD
- `src/services/registro-operacional.service.ts` — lógica com $transaction + EventoTimeline
- `src/queries/registro-operacional.queries.ts` — 3 queries com React.cache
- `src/queries/fase.queries.ts` — getFasesByProjeto (inclui is_fase_geral)
- `src/types/schemas/reuniao.schema.ts` — ReuniaoFormSchema + ReuniaoFormData
- `src/types/schemas/decisao.schema.ts` — DecisaoFormSchema + DecisaoFormData
- `src/types/schemas/checkpoint.schema.ts` — CheckpointFormSchema + CheckpointFormData
- `src/components/ui/select.tsx` — Select baseado em @base-ui/react/select (já instalado)
- `src/app/(internal)/projetos/[id]/fases/_components/fase-form-dialog.tsx` — padrão de dialog com datas
- `src/app/(internal)/projetos/[id]/fases/_components/tarefa-form-dialog.tsx` — padrão sem router.refresh
- `src/app/(internal)/projetos/[id]/fases/_components/fases-manager.tsx` — padrão AlertDialog + delete
- `src/app/(internal)/projetos/[id]/layout.tsx` — layout com notFound (timeline não precisa)
- `src/app/(internal)/projetos/[id]/_components/projeto-tabs.tsx` — aba Timeline já definida
- `src/app/(internal)/projetos/[id]/fases/loading.tsx` — padrão skeleton sem componente Skeleton
- `specs/prds/prd-04b-registros-operacionais-ui.md` — spec completa

---

## Design & Decisions

| Decisão | Impacto na implementação |
|---------|--------------------------|
| `select.tsx` já existe | Ignorar `npx shadcn@latest add select` do PRD |
| Base-ui `onValueChange` retorna `string \| null` | Usar `(v) => field.onChange(v \|\| null)` para nullable FKs |
| `zodResolver(schema as any)` com eslint-disable | Workaround para incompatibilidade de tipos @hookform/resolvers v5 + Zod 4.3.x |
| Datas com `toLocaleDateString('sv-SE')` | Evita bug de timezone em fuso UTC-3 |
| Sem `router.refresh()` nos dialogs | `revalidatePath()` nas actions já atualiza Server Components |
| Sem conversão Decimal na page.tsx | Queries de registros não selecionam campos Decimal |
| `notFound()` já no layout pai | `timeline/page.tsx` não precisa verificar se projeto existe |
| Layout do loading: 3 seções com `Array.from({ length: N })` | Padrão estabelecido em `fases/loading.tsx` |

## Open Questions

- Nenhuma — contexto completo levantado para implementação.
