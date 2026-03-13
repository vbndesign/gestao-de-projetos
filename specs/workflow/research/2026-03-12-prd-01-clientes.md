---
date: 2026-03-12T19:11:47+0000
researcher: Claude
git_commit: 43a4389
branch: feature/prd-01-clientes
repository: gestao-projetos
topic: "PRD-01 — CRUD completo de Clientes"
tags: [research, clientes, crud, queries, actions, ui, zod, react-hook-form]
status: complete
last_updated: 2026-03-12
last_updated_by: Claude
---

# Research: PRD-01 — CRUD completo de Clientes

**Date**: 2026-03-12T19:11:47+0000
**Git Commit**: 43a4389
**Branch**: feature/prd-01-clientes
**Repository**: gestao-projetos
**Research Mode**: Mixed (infraestrutura implementada, Clientes ainda nao existe)

## Research Question

Pesquisar o PRD-01 (Clientes) para documentar o que existe no codebase, o que o PRD define, quais padroes seguir e quais dependencias faltam antes da implementacao.

## Summary

O PRD-01 e o primeiro CRUD de dominio do projeto. A infraestrutura necessaria (Prisma schema com modelo Cliente, auth, proxy, layout autenticado) ja esta implementada via PRD-00a e PRD-00b. O PRD-01 criara 9 arquivos novos e nao modificara nenhum existente. A entidade Cliente nao tem regras de negocio cross-entity — nao precisa de `services/`, apenas `queries/` + `actions/` + `types/schemas/` + UI.

**Dependencias ausentes:** `react-hook-form`, `zod` e `@hookform/resolvers` nao estao instalados no `package.json` atual e serao necessarios. Componentes shadcn/ui `dialog`, `input`, `label`, `textarea` e `form` tambem precisam ser adicionados.

---

## Detailed Findings

### 1. Modelo Cliente no Prisma Schema (ja implementado)

**Arquivo**: `prisma/schema.prisma:61-74`

O modelo `Cliente` ja existe com todos os campos definidos no dominio:

| Campo | Tipo Prisma | Atributos |
|---|---|---|
| id | String | `@id @default(uuid()) @db.Uuid` |
| nome | String | — |
| empresa_organizacao | String? | — |
| email_principal | String? | — |
| telefone_contato | String? | — |
| observacoes | String? | `@db.Text` |
| created_at | DateTime | `@default(now())` |
| updated_at | DateTime | `@updatedAt` |

**Relacao**: `projetos Projeto[]` (one-to-many)
**Table mapping**: `@@map("clientes")`

O modelo `Projeto` (`schema.prisma:76-102`) tem `cliente_id` com `onDelete: Cascade`, o que significa que deletar um cliente cascateia para todos os seus projetos (e tudo abaixo).

### 2. Infraestrutura de Auth (ja implementada)

**`src/lib/auth.ts:1-27`** — `requireAuth()`:
- Exportado como `const` com `React.cache()` para deduplicacao
- Usa `@supabase/ssr` `createServerClient` com cookies
- Chama `supabase.auth.getUser()` para validacao real
- Se nao autenticado: `redirect('/login')`
- Se autenticado: retorna `User` do Supabase

**`src/lib/db.ts:1-13`** — Prisma singleton:
- `import 'server-only'` no topo
- Singleton via `globalThis` para evitar multiplas instancias em dev
- Exporta `db` como `const`

**`src/proxy.ts:1-40`** — Protecao de rotas:
- Rotas protegidas: `['/dashboard', '/projetos', '/clientes']` (linha 4)
- `/clientes` ja esta na lista de prefixos protegidos
- Verificacao otimista de cookie `sb-*-auth-token`

**`src/app/(internal)/layout.tsx:1-12`** — Layout autenticado:
- Chama `await requireAuth()` (linha 9)
- Envolve children com `<SessionProvider user={user}>`

### 3. Padroes de UI existentes

**Server Component** (`src/app/(internal)/dashboard/page.tsx:1-14`):
- Async function, chama `requireAuth()` independentemente
- Padrao simples: busca dados → renderiza UI

**Client Component** (`src/app/(auth)/login/login-button.tsx:1-23`):
- `'use client'` no topo
- Usa `createBrowserSupabaseClient()` para interatividade
- Handler async dentro do componente

**Componente shadcn existente**: apenas `src/components/ui/button.tsx`
- Usa CVA (class-variance-authority) para variantes
- Variantes: default, outline, secondary, ghost, destructive, link
- Tamanhos: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg

**Session Provider** (`src/components/providers/session-provider.tsx:1-27`):
- Cria `SessionContext` com `createContext`
- Exporta `useSession()` hook

### 4. Diretorios vazios (prontos para PRD-01)

Todos existem com `.gitkeep`:
- `src/actions/.gitkeep`
- `src/queries/.gitkeep`
- `src/services/.gitkeep`
- `src/types/schemas/.gitkeep`

### 5. Dependencias do `package.json`

**Instaladas**:
- next: 16.1.6
- react: 19.2.3
- typescript: ^5
- @prisma/client: ^5.22.0, prisma (dev): ^5.22.0
- @supabase/supabase-js: ^2.99.1, @supabase/ssr: ^0.9.0
- class-variance-authority: ^0.7.1
- lucide-react: ^0.577.0
- tailwindcss: ^4

**NAO instaladas (necessarias para PRD-01)**:
- `react-hook-form` (7.x) — formularios
- `zod` (4.x) — validacao
- `@hookform/resolvers` — integra zod com react-hook-form

### 6. Configuracao shadcn (`components.json`)

- Style: `"base-nova"` (equivalente ao antigo "New York")
- RSC: habilitado
- Aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`
- Icons: lucide
- CSS variables: habilitadas, baseColor "neutral"

Componentes shadcn a instalar antes de implementar:
```bash
npx shadcn@latest add dialog input label textarea form alert-dialog
```
> `alert-dialog` necessario para confirmacao de exclusao (mencionado no PRD como `AlertDialog`)

### 7. Fluxo canonico definido nas specs

**Leitura** (`specs/foundation/03_arquitetura.md`):
```
page.tsx (async Server Component)
  -> queries/cliente.queries.ts (import 'server-only')
    -> lib/db (Prisma com select explicito)
  -> passa dados como props para Client Components
```

**Mutacao** (`specs/foundation/03_arquitetura.md`):
```
Client Component ('use client')
  -> React Hook Form + Zod (validacao client-side)
  -> actions/cliente.actions.ts ('use server')
    -> ClienteFormSchema.safeParse() (revalidacao server-side)
    -> await requireAuth()
    -> db.cliente.create/update/delete (direto, sem service)
    -> revalidatePath('/clientes')
    -> return { success: true } | { success: false, error: string }
```

### 8. Padroes Next.js 16 relevantes

**Params e searchParams sao Promises** (`specs/foundation/04_nextjs.md`):
```tsx
export default async function Page(props: PageProps<'/clientes/[id]'>) {
  const { id } = await props.params  // await obrigatorio
}
```

**Server Actions nunca lancam excecao para a UI**:
- `safeParse()` + retorno `{ success, error }`
- `z.flattenError()` para Zod v4 (nao `error.flatten()`)

**`useTransition` para actions em Client Components**:
```tsx
const [isPending, startTransition] = useTransition()
function onSubmit(data) {
  startTransition(async () => {
    const result = await criarClienteAction(data)
    if (result.success) { /* fechar modal, toast */ }
    else { /* exibir erro */ }
  })
}
```

### 9. Rotas definidas no URL Map

**`/clientes`** (`specs/foundation/05_urls.md:75-84`):
- Arquivo: `app/(internal)/clientes/page.tsx`
- Loading: `app/(internal)/clientes/loading.tsx` (obrigatorio)
- Query string: `?busca=termo` — filtro client-side via `useSearchParams`
- Criacao: **modal** — usuario permanece na listagem
- Dados: `getClientes()`

**`/clientes/[id]`** (`specs/foundation/05_urls.md:87-97`):
- Arquivo: `app/(internal)/clientes/[id]/page.tsx`
- Loading: `app/(internal)/clientes/[id]/loading.tsx` (obrigatorio)
- Not found: `app/(internal)/clientes/[id]/not-found.tsx`
- Dados: `getClienteById(id)` + `getProjetosDoCliente(id)`
- Breadcrumb: `Clientes > {cliente.nome}`

### 10. Cascata de exclusao

Definida no Prisma schema (PRD-00b):

| Acao | Comportamento |
|---|---|
| Deletar Cliente | Cascade → todos os Projetos |
| Deletar Projeto | Cascade → Fases, registros operacionais, timeline |
| Deletar Fase | Cascade → TarefaPlanejada, LancamentoHoras; SetNull → registros operacionais |

A exclusao de um cliente e **irreversivel e potencialmente destrutiva**. O PRD-01 especifica um `AlertDialog` de confirmacao antes de executar `excluirClienteAction`.

---

## References

- `specs/prds/prd-01-clientes.md` — PRD completo com escopo, arquivos, especificacao e criterios de aceitacao
- `specs/foundation/02_dominio.md:9-30` — Entidade Cliente: campos, tipos, regras
- `specs/foundation/03_arquitetura.md` — Fluxo canonico de leitura e mutacao, anti-patterns
- `specs/foundation/04_nextjs.md` — Padroes Next.js 16: params async, Server Actions, forms, error handling
- `specs/foundation/05_urls.md:75-97` — Rotas `/clientes` e `/clientes/[id]`
- `prisma/schema.prisma:61-74` — Modelo Cliente implementado
- `prisma/schema.prisma:76-102` — Modelo Projeto com relacao `onDelete: Cascade` para Cliente
- `src/lib/auth.ts:1-27` — `requireAuth()` com `React.cache()`
- `src/lib/db.ts:1-13` — Prisma singleton
- `src/proxy.ts:4` — `/clientes` na lista de rotas protegidas
- `src/app/(internal)/layout.tsx:1-12` — Layout autenticado com SessionProvider
- `package.json` — Dependencias atuais (faltam react-hook-form, zod, @hookform/resolvers)
- `components.json` — Config shadcn (base-nova, neutral, CSS vars)

---

## Design & Decisions

| Decisao | Origem | Impacto no PRD-01 |
|---|---|---|
| Criacao via modal (nao pagina) | `specs/foundation/05_urls.md:83` | `ClienteFormModal` com `Dialog` shadcn |
| Busca client-side (`useSearchParams`) | `specs/foundation/05_urls.md:81` | Filtro no Client Component, sem nova request |
| Sem `services/` para Cliente | `specs/prds/prd-01-clientes.md:203` | Actions chamam `db` diretamente |
| `select` explicito em queries | `specs/foundation/03_arquitetura.md` | Nunca `findMany()` sem `select` |
| Schema Zod unico compartilhado | `specs/foundation/03_arquitetura.md` | Um arquivo em `types/schemas/`, usado no form e na action |
| `requireAuth()` em toda action | `specs/foundation/04_nextjs.md` | Mesmo com layout protegido, action valida independente |
| `revalidatePath()` apos mutacao | `specs/foundation/04_nextjs.md` | Invalida `/clientes` e `/clientes/[id]` |
| `AlertDialog` para exclusao | `specs/prds/prd-01-clientes.md:181` | Confirmar antes de cascatear |
| Zod v4: `z.flattenError()` | `specs/foundation/04_nextjs.md` | Nao usar `error.flatten()` (deprecated) |

---

## Open Questions

1. **`react-hook-form` e `zod` nao estao instalados** — o PRD menciona como pre-requisito a instalacao dos componentes shadcn, mas nao menciona explicitamente a instalacao dessas dependencias npm. Sera necessario rodar:
   ```bash
   pnpm add react-hook-form zod @hookform/resolvers
   ```

2. **`alert-dialog` shadcn nao mencionado** — o PRD referencia `AlertDialog` para confirmacao de exclusao, mas o comando de instalacao shadcn lista apenas `dialog input label textarea form`. Sera necessario tambem:
   ```bash
   npx shadcn@latest add alert-dialog
   ```

3. **`ClientesListagem` como Client Component** — o PRD sugere que pode ser "inline ou arquivo separado dentro do mesmo arquivo via `'use client'`". Na pratica, se `page.tsx` e Server Component, a listagem interativa precisa estar em um arquivo separado com `'use client'`. A decisao de usar `_components/clientes-listagem.tsx` ou manter inline depende da complexidade.

4. **Tipo de retorno de `criarClienteAction`** — o PRD define `{ success: true, clienteId: string }` como retorno de sucesso (com `clienteId`), mas as outras actions retornam apenas `{ success: true }`. Isso sugere que apos criar, a UI pode querer navegar para `/clientes/[id]` — confirmar se o modal deve redirecionar ou apenas fechar.

5. **`getProjetosDoCliente` antes de existir projetos** — como PRD-02 ainda nao foi implementado, a query retornara sempre lista vazia. A query deve ser implementada agora (preparando para o futuro) ou pode ser um placeholder simples.
