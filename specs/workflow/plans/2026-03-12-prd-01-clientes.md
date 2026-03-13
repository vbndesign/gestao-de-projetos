# PRD-01 — Clientes CRUD Implementation Plan

## Overview

Implementar o CRUD completo de Clientes — a entidade mais simples do domínio, sem regras de negócio cross-entity. Ao final, o usuário autenticado consegue listar, criar, editar, excluir e visualizar detalhes de clientes via painel interno (`/clientes` e `/clientes/[id]`).

## Current State Analysis

**Infraestrutura pronta (PRD-00a + PRD-00b):**
- Prisma schema com modelo `Cliente` completo (`prisma/schema.prisma:61-74`)
- `requireAuth()` com `React.cache()` (`src/lib/auth.ts:1-28`)
- Prisma singleton (`src/lib/db.ts:1-13`)
- `proxy.ts` já protege `/clientes` (`src/proxy.ts:4`)
- Layout autenticado com `SessionProvider` (`src/app/(internal)/layout.tsx:1-12`)
- shadcn configurado (style `base-nova`, apenas `button.tsx` instalado)

**O que falta:**
- Dependências npm: `react-hook-form`, `zod` (v4), `@hookform/resolvers`, `sonner`
- Componentes shadcn: `dialog`, `input`, `label`, `textarea`, `form`, `alert-dialog`, `sonner`
- Toaster no layout
- Todos os 9 arquivos do PRD-01 (queries, schema, actions, páginas, componentes)

### Key Discoveries:
- `onDelete: Cascade` em `Projeto.cliente_id` (`prisma/schema.prisma:89`) — excluir cliente cascateia tudo
- Padrão Next.js 16: `await props.params` obrigatório, tipos globais `PageProps<'/rota/[param]'>`
- Zod v4: usar `z.flattenError(parsed.error)` para erros em actions (não `error.flatten()`)
- `useSearchParams` para filtro client-side (força dynamic rendering apenas no client)

## Desired End State

- `/clientes` exibe lista de clientes com busca client-side, botão "Novo cliente" (modal), editar/excluir por linha
- `/clientes/[id]` exibe detalhe completo + projetos vinculados (lista vazia por ora) + editar/excluir
- Todas as actions validam com Zod no server, chamam `requireAuth()`, retornam `{ success, error }`
- Toast de feedback (Sonner) em criar/editar/excluir
- `pnpm build` com zero erros TypeScript

## What We're NOT Doing

- Dashboard (`/dashboard`) — permanece placeholder
- Integração com projetos (PRD-02a+)
- Relatórios, exportações, paginação server-side
- Filtros por status de projetos do cliente
- Portal do cliente (PRD futuro)
- `error.tsx` para as rotas de clientes (pode ser adicionado em PRD futuro)

## Implementation Approach

Seguir o fluxo canônico do projeto: dados primeiro, UI depois. 4 fases com checkpoints de verificação:

1. **Dependências** — instalar tudo, configurar Toaster
2. **Data layer** — Zod schema → queries → actions (testáveis sem UI via Prisma Studio)
3. **Listagem** — `/clientes` com busca, modal criar/editar, excluir com confirmação
4. **Detalhe** — `/clientes/[id]` com todos os campos, projetos, editar/excluir

---

## Phase 1: Dependencies & Infrastructure

### Overview
Instalar dependências npm e componentes shadcn/ui necessários. Adicionar o `<Toaster />` do Sonner ao layout interno.

### Changes Required:

#### 1. Instalar dependências npm

```bash
pnpm add react-hook-form zod @hookform/resolvers sonner
```

#### 2. Instalar componentes shadcn/ui

```bash
npx shadcn@latest add dialog input label textarea form alert-dialog sonner
```

> Isso cria arquivos em `src/components/ui/`: `dialog.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`, `form.tsx`, `alert-dialog.tsx`, `sonner.tsx`

#### 3. Adicionar Toaster ao layout interno

**File**: `src/app/(internal)/layout.tsx`
**Changes**: Importar e renderizar `<Toaster />` do componente Sonner shadcn

```tsx
import { Toaster } from '@/components/ui/sonner'

// Dentro do return, após {children}:
<Toaster />
```

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` compila sem erros
- [x] Arquivos shadcn existem em `src/components/ui/`: dialog.tsx, input.tsx, label.tsx, textarea.tsx, alert-dialog.tsx, sonner.tsx (form.tsx não existe no shadcn v4 — react-hook-form é usado diretamente)
- [x] `package.json` inclui react-hook-form, zod, @hookform/resolvers, sonner

#### Manual Verification:
- [ ] `pnpm dev` inicia sem erros
- [ ] Acessar `/dashboard` funciona normalmente (nenhuma regressão)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Data Layer (Schema + Queries + Actions)

### Overview
Criar o Zod schema compartilhado, as 3 queries de leitura e as 3 actions de mutação. Toda a lógica de dados sem UI.

### Changes Required:

#### 1. Zod Schema
**File**: `src/types/schemas/cliente.schema.ts`
**Changes**: Criar schema `ClienteFormSchema` e tipo `ClienteFormData`

```ts
import { z } from 'zod'

export const ClienteFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  empresa_organizacao: z.string().optional(),
  email_principal: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  telefone_contato: z.string().optional(),
  observacoes: z.string().optional(),
})

export type ClienteFormData = z.infer<typeof ClienteFormSchema>
```

#### 2. Queries
**File**: `src/queries/cliente.queries.ts`
**Changes**: Criar 3 queries com `import 'server-only'`, `select` explícito, importando `db` de `@/lib/db`

```ts
import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

// Lista para /clientes
export const getClientes = cache(async () => {
  return db.cliente.findMany({
    select: {
      id: true,
      nome: true,
      empresa_organizacao: true,
      email_principal: true,
      created_at: true,
    },
    orderBy: { nome: 'asc' },
  })
})

// Detalhe para /clientes/[id]
export const getClienteById = cache(async (id: string) => {
  return db.cliente.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      empresa_organizacao: true,
      email_principal: true,
      telefone_contato: true,
      observacoes: true,
      created_at: true,
      updated_at: true,
    },
  })
})

// Projetos vinculados para /clientes/[id]
export const getProjetosDoCliente = cache(async (clienteId: string) => {
  return db.projeto.findMany({
    where: { cliente_id: clienteId },
    select: {
      id: true,
      nome: true,
      status: true,
      data_inicio: true,
      previsao_entrega: true,
    },
    orderBy: { created_at: 'desc' },
  })
})
```

> **Nota:** `getClientes` e `getClienteById` usam `React.cache()` para deduplicação caso sejam chamadas múltiplas vezes no mesmo render pass. `getProjetosDoCliente` também usa cache por consistência.

#### 3. Actions
**File**: `src/actions/cliente.actions.ts`
**Changes**: Criar 3 actions com `'use server'`, validação Zod, `requireAuth()`, `revalidatePath()`

```ts
'use server'

import { z } from 'zod'
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

export async function editarClienteAction(id: string, data: ClienteFormData) {
  const parsed = ClienteFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Dados inválidos.' }
  }

  await requireAuth()

  try {
    await db.cliente.update({ where: { id }, data: parsed.data })
  } catch {
    return { success: false as const, error: 'Erro ao editar cliente.' }
  }

  revalidatePath('/clientes')
  revalidatePath('/clientes/' + id)
  return { success: true as const }
}

export async function excluirClienteAction(id: string) {
  await requireAuth()

  try {
    await db.cliente.delete({ where: { id } })
  } catch {
    return { success: false as const, error: 'Erro ao excluir cliente.' }
  }

  revalidatePath('/clientes')
  return { success: true as const }
}
```

> **Decisão:** Actions retornam `{ success: false as const, error: string }` com mensagem genérica em caso de exceção do Prisma. Não expor detalhes internos ao cliente. Validação Zod retorna mensagem genérica porque o form client-side já valida campo a campo — o safeParse server-side é uma segunda linha de defesa.

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` compila sem erros TypeScript
- [x] Arquivos existem: `src/types/schemas/cliente.schema.ts`, `src/queries/cliente.queries.ts`, `src/actions/cliente.actions.ts`

#### Manual Verification:
- [ ] `npx prisma studio` — tabela `clientes` visível e acessível (confirma que as queries vão funcionar)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Listagem (`/clientes`)

### Overview
Criar a página de listagem de clientes com busca client-side, modal de criação/edição, e exclusão com confirmação. 4 arquivos: page.tsx, loading.tsx, cliente-form-modal.tsx, clientes-listagem.tsx.

### Changes Required:

#### 1. ClienteFormModal (Client Component reutilizável)
**File**: `src/app/(internal)/clientes/_components/cliente-form-modal.tsx`
**Changes**: Criar componente modal para criar e editar clientes

- `'use client'`
- Props: `{ cliente?: ClienteData; trigger: React.ReactNode }` onde `ClienteData` é o tipo inferido de `getClienteById`
- Se `cliente` presente → modo edição (pré-popula, chama `editarClienteAction`)
- Se ausente → modo criação (form vazio, chama `criarClienteAction`)
- Usa `Dialog` + `DialogContent` do shadcn como container
- `trigger` renderizado como `DialogTrigger`
- Form com `useForm` + `zodResolver(ClienteFormSchema)`
- `useTransition` para wrapping da action
- Campos: `nome` (obrigatório), `empresa_organizacao`, `email_principal`, `telefone_contato`, `observacoes` (textarea)
- Submit: chama action → sucesso: `toast.success()` + fecha dialog (`setOpen(false)`) → erro: `toast.error(result.error)`
- Botão submit com `disabled={isPending}` e texto dinâmico ("Criando..."/"Salvando...")
- Estado `open` controlado via `useState` para poder fechar programaticamente

#### 2. ClientesListagem (Client Component)
**File**: `src/app/(internal)/clientes/_components/clientes-listagem.tsx`
**Changes**: Criar componente de listagem interativa

- `'use client'`
- Props: `{ clientes: ClienteListItem[] }` (tipo inferido de `getClientes`)
- `useSearchParams` + `useRouter` para query string `?busca=`
- Campo de busca (Input) filtra por `nome` ou `empresa_organizacao` (case-insensitive, client-side)
- Botão "Novo cliente" abre `<ClienteFormModal trigger={<Button>Novo cliente</Button>} />`
- Cada linha exibe: nome, empresa, email, data de criação
- Cada linha tem: link para `/clientes/[id]` (no nome), botão "Editar" (abre modal), botão "Excluir" (abre AlertDialog)
- AlertDialog de confirmação antes de chamar `excluirClienteAction`
- `useTransition` para a ação de excluir (disable buttons enquanto pending)
- Toast de sucesso/erro na exclusão

#### 3. Server Page
**File**: `src/app/(internal)/clientes/page.tsx`
**Changes**: Criar Server Component que busca dados e delega para ClientesListagem

```tsx
import { getClientes } from '@/queries/cliente.queries'
import { ClientesListagem } from './_components/clientes-listagem'

export default async function ClientesPage() {
  const clientes = await getClientes()
  return <ClientesListagem clientes={clientes} />
}
```

#### 4. Loading skeleton
**File**: `src/app/(internal)/clientes/loading.tsx`
**Changes**: Criar skeleton para a listagem

- Renderiza placeholder com `div` + classes Tailwind para simular a UI (header + linhas)
- Sem dependência de shadcn Skeleton (usa `animate-pulse` do Tailwind diretamente)

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` compila sem erros TypeScript
- [x] Arquivos existem: page.tsx, loading.tsx, cliente-form-modal.tsx, clientes-listagem.tsx

#### Manual Verification:
- [ ] Acessar `/clientes` exibe a lista (vazia ou com dados de teste)
- [ ] Campo de busca filtra por nome e empresa sem reload
- [ ] "Novo cliente" abre modal com form vazio
- [ ] Submeter com `nome` vazio mostra "Nome é obrigatório"
- [ ] Submeter com email inválido mostra "Email inválido"
- [ ] Criar cliente com dados válidos: fecha modal, toast de sucesso, cliente aparece na lista
- [ ] "Editar" abre modal com dados pré-preenchidos; salvar atualiza a lista
- [ ] "Excluir" abre AlertDialog de confirmação; confirmar remove o cliente + toast
- [ ] Cancelar exclusão não deleta o cliente

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Detalhe (`/clientes/[id]`)

### Overview
Criar a página de detalhe do cliente com todos os campos, lista de projetos vinculados, editar e excluir.

### Changes Required:

#### 1. Detail Page
**File**: `src/app/(internal)/clientes/[id]/page.tsx`
**Changes**: Criar Server Component de detalhe

```tsx
import { notFound } from 'next/navigation'
import { getClienteById, getProjetosDoCliente } from '@/queries/cliente.queries'
import { ClienteDetalhe } from '../_components/cliente-detalhe'

export default async function ClienteDetalhePage(props: PageProps<'/clientes/[id]'>) {
  const { id } = await props.params
  const [cliente, projetos] = await Promise.all([
    getClienteById(id),
    getProjetosDoCliente(id),
  ])

  if (!cliente) notFound()

  return <ClienteDetalhe cliente={cliente} projetos={projetos} />
}
```

#### 2. ClienteDetalhe (Client Component)
**File**: `src/app/(internal)/clientes/_components/cliente-detalhe.tsx`
**Changes**: Criar componente de detalhe interativo

- `'use client'`
- Props: `{ cliente: ClienteData; projetos: ProjetoListItem[] }`
- Breadcrumb: `Clientes > {cliente.nome}` (link para `/clientes`)
- Exibe todos os campos: nome, empresa, email, telefone, observações, created_at, updated_at
- Botão "Editar" abre `<ClienteFormModal cliente={cliente} trigger={...} />`
- Botão "Excluir" abre AlertDialog; em sucesso `router.push('/clientes')` + toast
- Lista de projetos: nome, status, data_início — cada um com `<Link href={/projetos/${p.id}}>` (rota ainda não existe, mas link funcional)
- Mensagem "Nenhum projeto vinculado" se lista vazia

#### 3. Not Found
**File**: `src/app/(internal)/clientes/[id]/not-found.tsx`
**Changes**: Página 404 para cliente inexistente

```tsx
import Link from 'next/link'

export default function ClienteNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Cliente não encontrado</h2>
      <p className="text-muted-foreground">O cliente que você procura não existe ou foi removido.</p>
      <Link href="/clientes" className="text-primary underline">Voltar para clientes</Link>
    </div>
  )
}
```

#### 4. Loading skeleton
**File**: `src/app/(internal)/clientes/[id]/loading.tsx`
**Changes**: Skeleton para a página de detalhe

- Simula breadcrumb + blocos de informação + lista de projetos com `animate-pulse`

### Success Criteria:

#### Automated Verification:
- [x] `pnpm build` compila sem erros TypeScript
- [x] Arquivos existem: `[id]/page.tsx`, `[id]/loading.tsx`, `[id]/not-found.tsx`, `_components/cliente-detalhe.tsx`

#### Manual Verification:
- [ ] Acessar `/clientes/[id]` de um cliente existente exibe todos os campos
- [ ] Lista de projetos mostra "Nenhum projeto vinculado" (por enquanto)
- [ ] Botão "Editar" abre modal com dados pré-preenchidos; salvar atualiza o detalhe
- [ ] Botão "Excluir" abre confirmação; confirmar redireciona para `/clientes` + toast
- [ ] UUID inexistente em `/clientes/[id]` exibe "Cliente não encontrado"
- [ ] `npx prisma studio` confirma que operações persistiram corretamente

---

## Testing Strategy

### Manual Testing Steps:
1. Criar cliente com todos os campos preenchidos → aparece na lista em `/clientes`
2. Busca por nome na listagem → filtra corretamente sem reload
3. Editar nome e email de um cliente → alterações persistem após refresh
4. Acessar `/clientes/[id]` → exibe campos completos + projetos (lista vazia)
5. Excluir cliente via listagem → cliente some da lista
6. Excluir cliente via detalhe → redireciona para `/clientes`
7. Cancelar exclusão → cliente não é deletado
8. UUID inexistente → exibe "Cliente não encontrado"
9. `npx prisma studio` → registros refletem no banco corretamente
10. `pnpm build` → zero erros TypeScript

## References

- Original PRD: `specs/prds/prd-01-clientes.md`
- Related research: `specs/workflow/research/2026-03-12-prd-01-clientes.md`
- Foundation specs: `specs/foundation/02_dominio.md`, `specs/foundation/03_arquitetura.md`, `specs/foundation/04_nextjs.md`, `specs/foundation/05_urls.md`
- Prisma schema: `prisma/schema.prisma:61-74` (Cliente), `prisma/schema.prisma:76-102` (Projeto com cascade)
- Auth pattern: `src/lib/auth.ts:1-28`
- Existing UI: `src/components/ui/button.tsx` (shadcn pattern)
