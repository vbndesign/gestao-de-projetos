# PRD-02b — Projetos UI — Implementation Plan

## Overview

Implementar a UI completa do módulo de projetos: listagem com filtros server-side, página de criação com redirect, e detalhe com layout de abas, edição via dialog e exclusão com confirmação. Todo o backend (queries, actions, services, schemas) já existe do PRD-02a.

## Current State Analysis

**Backend pronto (PRD-02a):**
- `src/queries/projeto.queries.ts` — `getProjetosFiltrados()`, `getProjetoById()`, `getClientesParaSelect()`
- `src/actions/projeto.actions.ts` — `criarProjetoAction()`, `editarProjetoAction()`, `excluirProjetoAction()`
- `src/types/schemas/projeto.schema.ts` — `ProjetoFormSchema`, `ProjetoFormData`
- `src/services/projeto.service.ts` — `criarProjeto()` com R1 (fase Geral em $transaction)

**Padrões estabelecidos (PRD-01 — clientes):**
- Server Components buscam dados → passam para Client Components
- `zodResolver(schema as any)` — workaround Zod v4 + @hookform/resolvers
- `DialogTrigger render={<Element />}` — base-ui pattern, sem Fragment
- Skeletons com `animate-pulse rounded bg-muted` — sem componente Skeleton
- Tipos locais nos componentes (não importar do Prisma)
- `params: Promise<{ id: string }>` — tipagem inline Next.js 16

**Componentes shadcn a instalar:**
- `select` — filtros e campos de formulário
- `badge` — status do projeto

### Key Discoveries:
- Filtros server-side são padrão novo (clientes usa client-side `.filter()`)
- Layout com abas é padrão novo (clientes tem page simples)
- `React.cache()` nas queries deduplica chamadas entre layout e page
- `criarProjetoAction` retorna `{ success, projetoId }` para redirect
- `z.coerce.date()` no schema aceita strings de `<input type="date">`

## Desired End State

- `/projetos` — listagem funcional com filtros server-side (status + cliente)
- `/projetos/novo` — formulário de criação que redireciona para `/projetos/[id]`
- `/projetos/[id]` — layout com breadcrumb, badge, 4 abas; Visão Geral com dados, edição e exclusão
- `pnpm build` com zero erros TypeScript

### Verificação:
- Build limpo: `npx prisma generate && pnpm build`
- Navegação completa: listagem → criação → redirect → detalhe → editar → excluir → redirect
- Filtros alteram URL e resultados sem reload

## What We're NOT Doing

- Pages para abas futuras (Fases, Timeline, Horas) — PRDs 02c, 07b, 06
- Paginação ou ordenação da lista
- Dashboard — permanece placeholder
- Testes automatizados

## Implementation Approach

5 fases incrementais, cada uma verificável independentemente. Seguir padrões do PRD-01 (clientes) com ajustes documentados para filtros server-side e layout com abas.

**Decisões tomadas:**
1. `STATUS_LABELS` exportado de `src/lib/constants.ts` (usado em 4+ arquivos)
2. Datas para `<input type="date">`: `date.toLocaleDateString('sv-SE')` (evita bug UTC-3 do `.toISOString()`)
3. Abas futuras geram 404 — comportamento esperado

---

## Phase 1: Dependências + Constantes

### Overview
Instalar componentes shadcn necessários e criar arquivo de constantes compartilhadas.

### Changes Required:

#### 1. Instalar componentes shadcn
```bash
npx shadcn@latest add select badge
```

#### 2. Criar constantes compartilhadas
**File**: `src/lib/constants.ts`

```ts
export const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  ativo: 'Ativo',
  aguardando_cliente: 'Aguardando cliente',
  pausado: 'Pausado',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
}
```

### Success Criteria:

#### Automated Verification:
- [x] Componentes instalados: `src/components/ui/select.tsx` e `src/components/ui/badge.tsx` existem
- [x] Build passa: `pnpm build`

#### Manual Verification:
- [ ] N/A — fase de setup

**Implementation Note**: Após completar esta fase e verificação automatizada, prosseguir para Phase 2.

---

## Phase 2: Listagem (`/projetos`)

### Overview
Página de listagem com filtros server-side (status + cliente) via searchParams.

### Changes Required:

#### 1. Server Component — page
**File**: `src/app/(internal)/projetos/page.tsx`

```tsx
import { StatusProjeto } from '@prisma/client'
import { getProjetosFiltrados, getClientesParaSelect } from '@/queries/projeto.queries'
import { ProjetosListagem } from './_components/projetos-listagem'

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cliente?: string }>
}) {
  const { status, cliente } = await searchParams
  const [projetos, clientes] = await Promise.all([
    getProjetosFiltrados({
      status: status as StatusProjeto | undefined,
      clienteId: cliente,
    }),
    getClientesParaSelect(),
  ])
  return <ProjetosListagem projetos={projetos} clientes={clientes} />
}
```

#### 2. Client Component — listagem com filtros
**File**: `src/app/(internal)/projetos/_components/projetos-listagem.tsx`

```tsx
'use client'

import { useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '@/lib/constants'

type ProjetoListItem = {
  id: string
  nome: string
  status: string
  data_inicio: Date
  previsao_entrega: Date | null
  created_at: Date
  cliente: { id: string; nome: string }
}

export function ProjetosListagem({
  projetos,
  clientes,
}: {
  projetos: ProjetoListItem[]
  clientes: { id: string; nome: string }[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const statusAtual = searchParams.get('status') ?? ''
  const clienteAtual = searchParams.get('cliente') ?? ''
  const temFiltro = statusAtual || clienteAtual

  function handleFiltro(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.replace('/projetos?' + params.toString())
    })
  }

  function limparFiltros() {
    startTransition(() => {
      router.replace('/projetos')
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Projetos</h1>
        <Link href="/projetos/novo">
          <Button>Novo projeto</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusAtual}
          onValueChange={(v) => handleFiltro('status', v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={clienteAtual}
          onValueChange={(v) => handleFiltro('cliente', v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {temFiltro && (
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Lista */}
      {projetos.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          Nenhum projeto encontrado.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {projetos.map((projeto) => (
            <div
              key={projeto.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/projetos/${projeto.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {projeto.nome}
                </Link>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <span>{projeto.cliente.nome}</span>
                  <span>
                    {new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <Badge variant="secondary">
                {STATUS_LABELS[projeto.status] ?? projeto.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### 3. Loading skeleton
**File**: `src/app/(internal)/projetos/loading.tsx`

```tsx
export default function ProjetosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build passa: `pnpm build`

#### Manual Verification:
- [ ] `/projetos` exibe lista com nome, cliente, badge de status, data
- [ ] Filtro de status funciona (URL muda, lista atualiza)
- [ ] Filtro de cliente funciona
- [ ] "Limpar filtros" aparece com filtro ativo e remove parâmetros da URL
- [ ] "Novo projeto" linka para `/projetos/novo`
- [ ] Estado vazio mostra mensagem centralizada

**Implementation Note**: Após completar esta fase e verificação automatizada, pausar para confirmação manual antes de prosseguir.

---

## Phase 3: Criação (`/projetos/novo`)

### Overview
Página de criação com formulário completo e redirect pós-criação.

### Changes Required:

#### 1. Server Component — page
**File**: `src/app/(internal)/projetos/novo/page.tsx`

```tsx
import { getClientesParaSelect } from '@/queries/projeto.queries'
import { ProjetoForm } from './_components/projeto-form'

export default async function NovoProjetoPage() {
  const clientes = await getClientesParaSelect()
  return <ProjetoForm clientes={clientes} />
}
```

#### 2. Client Component — formulário de criação
**File**: `src/app/(internal)/projetos/novo/_components/projeto-form.tsx`

```tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProjetoFormSchema, type ProjetoFormData } from '@/types/schemas/projeto.schema'
import { criarProjetoAction } from '@/actions/projeto.actions'
import { STATUS_LABELS } from '@/lib/constants'

export function ProjetoForm({
  clientes,
}: {
  clientes: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProjetoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ProjetoFormSchema as any),
    defaultValues: {
      nome: '',
      cliente_id: '',
      descricao: '',
      status: 'rascunho',
    },
  })

  function onSubmit(data: ProjetoFormData) {
    startTransition(async () => {
      const result = await criarProjetoAction(data)
      if (result.success) {
        router.push('/projetos/' + result.projetoId)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/projetos" className="hover:text-foreground">
          Projetos
        </Link>
        <span>/</span>
        <span className="text-foreground">Novo projeto</span>
      </nav>

      <h1 className="text-2xl font-semibold">Novo projeto</h1>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        {/* Nome */}
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" {...form.register('nome')} />
          {form.formState.errors.nome && (
            <p className="text-sm text-destructive">
              {form.formState.errors.nome.message}
            </p>
          )}
        </div>

        {/* Cliente */}
        <div className="grid gap-2">
          <Label htmlFor="cliente_id">Cliente *</Label>
          <Controller
            control={form.control}
            name="cliente_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="cliente_id">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.cliente_id && (
            <p className="text-sm text-destructive">
              {form.formState.errors.cliente_id.message}
            </p>
          )}
        </div>

        {/* Descrição */}
        <div className="grid gap-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" {...form.register('descricao')} />
        </div>

        {/* Status */}
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Data de início */}
        <div className="grid gap-2">
          <Label htmlFor="data_inicio">Data de início *</Label>
          <Input id="data_inicio" type="date" {...form.register('data_inicio')} />
          {form.formState.errors.data_inicio && (
            <p className="text-sm text-destructive">
              {form.formState.errors.data_inicio.message}
            </p>
          )}
        </div>

        {/* Previsão de entrega */}
        <div className="grid gap-2">
          <Label htmlFor="previsao_entrega">Previsão de entrega</Label>
          <Input
            id="previsao_entrega"
            type="date"
            {...form.register('previsao_entrega', {
              setValueAs: (v) => (v === '' ? undefined : v),
            })}
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar projeto'}
        </Button>
      </form>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build passa: `pnpm build`

#### Manual Verification:
- [ ] `/projetos/novo` renderiza formulário com breadcrumb
- [ ] Campo `nome` vazio impede submit com mensagem de erro
- [ ] `cliente_id` sem seleção impede submit com mensagem de erro
- [ ] Criar com dados válidos redireciona para `/projetos/[id]`
- [ ] Projeto criado tem fase "Geral do projeto" (verificar via Prisma Studio)

**Implementation Note**: Após completar esta fase e verificação automatizada, pausar para confirmação manual antes de prosseguir.

---

## Phase 4: Layout do detalhe + arquivos triviais (`/projetos/[id]`)

### Overview
Layout compartilhado com breadcrumb, badge, abas, e arquivos auxiliares (loading, not-found, error).

### Changes Required:

#### 1. Layout com breadcrumb e tabs
**File**: `src/app/(internal)/projetos/[id]/layout.tsx`

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjetoById } from '@/queries/projeto.queries'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '@/lib/constants'
import { ProjetoTabs } from './_components/projeto-tabs'

export default async function ProjetoLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>
  children: React.ReactNode
}) {
  const { id } = await params
  const projeto = await getProjetoById(id)

  if (!projeto) notFound()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/projetos" className="hover:text-foreground">
          Projetos
        </Link>
        <span>/</span>
        <span className="text-foreground">{projeto.nome}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{projeto.nome}</h1>
        <Badge variant="secondary">
          {STATUS_LABELS[projeto.status] ?? projeto.status}
        </Badge>
      </div>

      {/* Tabs */}
      <ProjetoTabs id={id} />

      {/* Content */}
      {children}
    </div>
  )
}
```

#### 2. Client Component — tabs
**File**: `src/app/(internal)/projetos/[id]/_components/projeto-tabs.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const getTabs = (id: string) => [
  { label: 'Visão Geral', href: `/projetos/${id}` },
  { label: 'Fases', href: `/projetos/${id}/fases` },
  { label: 'Timeline', href: `/projetos/${id}/timeline` },
  { label: 'Horas', href: `/projetos/${id}/horas` },
]

export function ProjetoTabs({ id }: { id: string }) {
  const pathname = usePathname()
  const tabs = getTabs(id)

  return (
    <nav className="flex gap-4 border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            pathname === tab.href
              ? 'border-b-2 border-primary pb-2 font-medium'
              : 'pb-2 text-muted-foreground hover:text-foreground'
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
```

#### 3. Loading skeleton
**File**: `src/app/(internal)/projetos/[id]/loading.tsx`

```tsx
export default function ProjetoDetalheLoading() {
  return (
    <div className="space-y-8">
      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      </div>

      {/* Fases */}
      <div className="space-y-4">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
```

#### 4. Not found
**File**: `src/app/(internal)/projetos/[id]/not-found.tsx`

```tsx
import Link from 'next/link'

export default function ProjetoNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
      <p className="text-muted-foreground">O projeto que você procura não existe ou foi removido.</p>
      <Link href="/projetos" className="text-primary underline">Voltar para projetos</Link>
    </div>
  )
}
```

#### 5. Error boundary
**File**: `src/app/(internal)/projetos/[id]/error.tsx`

```tsx
'use client'

export default function ProjetoError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="text-muted-foreground mb-4">Ocorreu um erro ao carregar o projeto.</p>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build passa: `pnpm build`

#### Manual Verification:
- [ ] `/projetos/[id]` exibe breadcrumb "Projetos / {nome}" e badge de status
- [ ] 4 abas visíveis, "Visão Geral" destacada como ativa
- [ ] UUID inexistente exibe página not-found
- [ ] Abas futuras (Fases, Timeline, Horas) geram 404 — comportamento esperado

**Implementation Note**: Após completar esta fase e verificação automatizada, pausar para confirmação manual antes de prosseguir.

---

## Phase 5: Visão Geral (`/projetos/[id]` — page + detalhe)

### Overview
Page do detalhe e Client Component com exibição de dados, edição via Dialog e exclusão com AlertDialog.

### Changes Required:

#### 1. Server Component — page
**File**: `src/app/(internal)/projetos/[id]/page.tsx`

```tsx
import { getProjetoById, getClientesParaSelect } from '@/queries/projeto.queries'
import { ProjetoDetalhe } from './_components/projeto-detalhe'

export default async function ProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [projeto, clientes] = await Promise.all([
    getProjetoById(id),
    getClientesParaSelect(),
  ])

  // layout.tsx already handles notFound()
  return <ProjetoDetalhe projeto={projeto!} clientes={clientes} />
}
```

#### 2. Client Component — detalhe com editar/excluir
**File**: `src/app/(internal)/projetos/[id]/_components/projeto-detalhe.tsx`

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProjetoFormSchema, type ProjetoFormData } from '@/types/schemas/projeto.schema'
import { editarProjetoAction, excluirProjetoAction } from '@/actions/projeto.actions'
import { STATUS_LABELS } from '@/lib/constants'

type ProjetoData = {
  id: string
  nome: string
  cliente_id: string
  descricao: string | null
  status: string
  data_inicio: Date
  previsao_entrega: Date | null
  data_conclusao_real: Date | null
  fase_atual_id: string | null
  created_at: Date
  updated_at: Date
  cliente: { id: string; nome: string }
  fases: { id: string; nome: string; status: string; ordem: number; is_fase_geral: boolean }[]
}

export function ProjetoDetalhe({
  projeto,
  clientes,
}: {
  projeto: ProjetoData
  clientes: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProjetoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ProjetoFormSchema as any),
    defaultValues: {
      nome: projeto.nome,
      cliente_id: projeto.cliente_id,
      descricao: projeto.descricao ?? '',
      status: projeto.status,
      data_inicio: new Date(projeto.data_inicio).toLocaleDateString('sv-SE'),
      previsao_entrega: projeto.previsao_entrega
        ? new Date(projeto.previsao_entrega).toLocaleDateString('sv-SE')
        : '',
      data_conclusao_real: projeto.data_conclusao_real
        ? new Date(projeto.data_conclusao_real).toLocaleDateString('sv-SE')
        : '',
    },
  })

  function onSubmit(data: ProjetoFormData) {
    startTransition(async () => {
      const result = await editarProjetoAction(projeto.id, data)
      if (result.success) {
        toast.success('Projeto atualizado.')
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleExcluir() {
    startTransition(async () => {
      const result = await excluirProjetoAction(projeto.id)
      if (result.success) {
        toast.success('Projeto excluído.')
        router.push('/projetos')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Actions */}
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline">Editar</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar projeto</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {/* Nome */}
              <div className="grid gap-2">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input id="edit-nome" {...form.register('nome')} />
                {form.formState.errors.nome && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.nome.message}
                  </p>
                )}
              </div>

              {/* Cliente */}
              <div className="grid gap-2">
                <Label htmlFor="edit-cliente_id">Cliente *</Label>
                <Controller
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="edit-cliente_id">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.cliente_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.cliente_id.message}
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div className="grid gap-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea id="edit-descricao" {...form.register('descricao')} />
              </div>

              {/* Status */}
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Data de início */}
              <div className="grid gap-2">
                <Label htmlFor="edit-data_inicio">Data de início *</Label>
                <Input
                  id="edit-data_inicio"
                  type="date"
                  {...form.register('data_inicio')}
                />
                {form.formState.errors.data_inicio && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.data_inicio.message}
                  </p>
                )}
              </div>

              {/* Previsão de entrega */}
              <div className="grid gap-2">
                <Label htmlFor="edit-previsao_entrega">Previsão de entrega</Label>
                <Input
                  id="edit-previsao_entrega"
                  type="date"
                  {...form.register('previsao_entrega', {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                />
              </div>

              {/* Data de conclusão real */}
              <div className="grid gap-2">
                <Label htmlFor="edit-data_conclusao_real">Data de conclusão real</Label>
                <Input
                  id="edit-data_conclusao_real"
                  type="date"
                  {...form.register('data_conclusao_real', {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                />
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" disabled={isPending}>
                Excluir
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir &quot;{projeto.nome}&quot;? Todos os
                dados vinculados serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleExcluir}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Cliente</p>
          <p>
            <Link
              href={`/clientes/${projeto.cliente.id}`}
              className="text-primary hover:underline"
            >
              {projeto.cliente.nome}
            </Link>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <p>
            <Badge variant="secondary">
              {STATUS_LABELS[projeto.status] ?? projeto.status}
            </Badge>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Data de início</p>
          <p>{new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}</p>
        </div>
        {projeto.previsao_entrega && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Previsão de entrega</p>
            <p>{new Date(projeto.previsao_entrega).toLocaleDateString('pt-BR')}</p>
          </div>
        )}
        {projeto.data_conclusao_real && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Data de conclusão real</p>
            <p>{new Date(projeto.data_conclusao_real).toLocaleDateString('pt-BR')}</p>
          </div>
        )}
        {projeto.descricao && (
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Descrição</p>
            <p className="whitespace-pre-wrap">{projeto.descricao}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Criado em</p>
          <p>{new Date(projeto.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Atualizado em</p>
          <p>{new Date(projeto.updated_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Fases */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Fases</h2>
        {projeto.fases.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma fase encontrada.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {projeto.fases.map((fase) => (
              <div key={fase.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{fase.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {fase.is_fase_geral ? 'Fase geral' : `Ordem: ${fase.ordem}`}
                  </p>
                </div>
                <Badge variant="outline">{fase.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build passa: `npx prisma generate && pnpm build` — zero erros TypeScript

#### Manual Verification:
- [ ] Visão Geral exibe todos os campos do projeto (cliente como link, status como badge, datas, descrição)
- [ ] Lista de fases exibe a fase "Geral do projeto" criada automaticamente
- [ ] Botão "Editar" abre modal com campos pré-preenchidos (datas formatadas corretamente)
- [ ] Editar status e salvar → badge atualiza sem reload
- [ ] Botão "Excluir" exibe confirmação → confirmar → redirect para `/projetos`
- [ ] Fluxo completo: listagem → novo → redirect → detalhe → editar → excluir → redirect

**Implementation Note**: Após completar esta fase e todas as verificações, o PRD-02b está completo.

---

## Testing Strategy

### Manual Testing Steps:
1. Criar projeto em `/projetos/novo` → verificar redirect para `/projetos/[id]`
2. Verificar fase Geral via Prisma Studio (`is_fase_geral: true`, `ordem: 1`)
3. Filtrar por `status=ativo` em `/projetos` → lista mostra apenas projetos ativos
4. Filtrar por cliente → lista mostra apenas projetos do cliente
5. Limpar filtros → URL limpa, lista completa
6. Editar status de rascunho para ativo → badge atualiza
7. Excluir projeto → confirmação → redirect para `/projetos`
8. UUID inválido em `/projetos/[id]` → not-found
9. `pnpm dev` → sem erros de hidratação no console

## References

- Original PRD: `specs/prds/prd-02b-projetos-ui.md`
- Research: `specs/workflow/research/2026-03-12-prd-02b-projetos-ui.md`
- Padrão clientes (PRD-01): `src/app/(internal)/clientes/`
- Backend (PRD-02a): `src/queries/projeto.queries.ts`, `src/actions/projeto.actions.ts`
- Schema: `src/types/schemas/projeto.schema.ts`
