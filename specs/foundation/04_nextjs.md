# 04 — Padrões Next.js 16.1.6

Referência de implementação para App Router, proxy, Server Actions, caching e tipagem.
Folder structure está em `03_arquitetura.md`.

---

## Arquivos especiais de rota

| Arquivo | Função |
|---|---|
| `layout.tsx` | Layout compartilhado — **não re-renderiza** na navegação |
| `page.tsx` | Página — torna a rota pública |
| `loading.tsx` | Skeleton/Suspense automático da rota |
| `error.tsx` | Boundary de erro da rota (deve ser `'use client'`) |
| `not-found.tsx` | UI do 404 |
| `route.ts` | API endpoint (Route Handler) |
| `template.tsx` | Layout que **re-renderiza** a cada navegação |

Uma rota só é pública quando existe `page.tsx` ou `route.ts`. Arquivos em `_components/` nunca são roteáveis.

**Hierarquia de renderização:**
```
layout.tsx → template.tsx → error.tsx → loading.tsx → not-found.tsx → page.tsx
```

---

## Route Groups e separação de contextos

```
app/
├── (internal)/              ← painel interno — requer autenticação
│   ├── layout.tsx           ← chama requireAuth() uma vez
│   └── projetos/[id]/       ← URLs sem o grupo: /projetos/[id]
│
└── (portal)/                ← portal do cliente — público
    └── p/[slug]/
        ├── page.tsx          ← URL: /p/[slug]
        └── _components/      ← co-localizados (MVP tem 1 página)
```

**Duas camadas de proteção:**

| Camada | Responsabilidade |
|---|---|
| `proxy.ts` | Verifica **existência** do cookie — redireciona se ausente |
| `app/(internal)/layout.tsx` | Confirma **validade real** da sessão com Supabase |

> O layout **não re-renderiza** em navegações subsequentes dentro do grupo. `requireAuth()` no layout serve para o redirect inicial. Nas Server Actions, `requireAuth()` é chamado sempre — essa é a proteção real.

---

## Proxy

> **Next.js 16.x:** `middleware.ts` renomeado para `proxy.ts`. Função `middleware` → `proxy`.

```ts
// src/proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const internalPrefixes = ['/dashboard', '/projetos', '/clientes']

// @supabase/ssr salva o token como "sb-[project-ref]-auth-token" (pode ser chunked: .0, .1...)
// Verificacao otimista: basta existir qualquer cookie com esse padrao
// IMPORTANTE: nao usar 'sb-access-token' — esse nome era do cliente legado, nao do @supabase/ssr
function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect auth-aware para /
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(hasSupabaseSession(request) ? '/dashboard' : '/login', request.url)
    )
  }

  // Protecao de rotas internas
  const isInternalRoute = internalPrefixes.some((p) => pathname.startsWith(p))
  if (isInternalRoute) {
    if (!hasSupabaseSession(request)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```

**Regras:**
- ✅ Redirecionar com base em cookie ausente
- ✅ Modificar headers, reescrever URLs
- ❌ Buscar dados do banco
- ❌ Validar sessão completa (só verificação otimista)
- ❌ `fetch` com `cache`/`revalidate` (sem efeito no proxy)
- Sem `config.matcher` → executa em **todas** as rotas incluindo assets estáticos

---

## Server Components vs Client Components

| Precisa de... | Usar |
|---|---|
| Buscar dados do banco | **Server Component** |
| API keys, secrets | **Server Component** |
| `useState`, `useReducer`, `useEffect` | **Client Component** |
| Eventos (`onClick`, `onChange`) | **Client Component** |
| React Hook Form | **Client Component** |
| @dnd-kit (drag and drop) | **Client Component** |

**Padrão:** Server Component busca → passa dados como props → Client Component renderiza interatividade.

```tsx
// app/(internal)/projetos/[id]/page.tsx — Server Component
export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const projeto = await getProjetoById(id)
  if (!projeto) notFound()
  return <ProjetoForm projeto={projeto} />  // ← Client Component via props
}
```

```tsx
// components/projetos/projeto-form.tsx — Client Component
'use client'
export function ProjetoForm({ projeto }: { projeto: Projeto }) {
  const form = useForm<AtualizarProjetoInput>({
    resolver: zodResolver(atualizarProjetoSchema),
    defaultValues: { nome: projeto.nome, status: projeto.status },
  })
  async function onSubmit(data: AtualizarProjetoInput) {
    const result = await atualizarProjetoAction(projeto.id, data)
  }
  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* campos */}</form>
}
```

**Context providers** — encapsular em Client Component para passar estado global do Server Component:

```tsx
// components/providers/session-provider.tsx
'use client'
const SessionContext = createContext<User | null>(null)
export function SessionProvider({ children, user }: { children: React.ReactNode; user: User }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}

// app/(internal)/layout.tsx
export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth()
  return <SessionProvider user={user}>{children}</SessionProvider>
}
```

---

> `searchParams` força **renderização dinâmica**. Usar `useSearchParams()` no Client Component quando o filtro é apenas visual (sem ir ao banco).

---

## Data Fetching

| Necessidade | Mecanismo |
|---|---|
| Ler dados para a UI | Server Component + Prisma direto via `queries/` |
| Mutação a partir do cliente | Server Action |
| Endpoint HTTP público (webhook, JSON) | Route Handler |
| Auth callback (OAuth, Supabase) | Route Handler |

> Nunca chamar Route Handler de um Server Component — introduz round trip HTTP desnecessário.
> Nunca usar Server Action para buscar dados — actions são enfileiradas.

**Queries com `select` explícito e `React.cache()`:**

```ts
// queries/projeto.queries.ts
import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'

export const getProjetoById = cache(async (id: string) => {
  return db.projeto.findUnique({
    where: { id },
    select: {
      id: true, nome: true, status: true, dataInicio: true,
      cliente: { select: { id: true, nome: true } },
      fases: { orderBy: { ordem: 'asc' }, select: { id: true, nome: true, status: true, isFaseGeral: true } },
    },
  })
})

// Query de portal — nunca retorna horas ou dados internos
export async function getProjetoParaPortal(slug: string) {
  return db.projeto.findFirst({
    where: { slug },
    select: {
      id: true, nome: true, status: true,
      fases: {
        where: { isFaseGeral: false },
        orderBy: { ordem: 'asc' },
        select: {
          id: true, nome: true, status: true,
          tarefas: { select: { id: true, titulo: true, status: true } },
        },
      },
    },
  })
}
```

**Queries paralelas:**

```tsx
const [projeto, timeline] = await Promise.all([
  getProjetoById(id),
  getTimelineInterna(id),
])
```

---

## Server Actions

```ts
// actions/projeto.actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { criarProjetoSchema, type CriarProjetoInput } from '@/types/schemas/projeto.schema'
import { projetoService } from '@/services/projeto.service'

export async function criarProjetoAction(input: CriarProjetoInput) {
  const parsed = criarProjetoSchema.safeParse(input)          // 1. Validar no servidor
  if (!parsed.success) return { success: false, error: z.flattenError(parsed.error) }

  await requireAuth()                                          // 2. Autenticar
  await projetoService.criar(parsed.data)                     // 3. Executar (cross-entity → service)

  revalidatePath('/projetos')                                  // 4. Invalidar cache
  return { success: true }                                     // 5. Retornar — nunca throw para a UI
}

export async function atualizarProjetoAction(id: string, input: AtualizarProjetoInput) {
  const parsed = atualizarProjetoSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: z.flattenError(parsed.error) }
  await requireAuth()
  await db.projeto.update({ where: { id }, data: parsed.data })   // simples → db direto
  revalidatePath(`/projetos/${id}`)
  revalidatePath('/projetos')
  return { success: true }
}

export async function deletarProjetoAction(id: string) {
  await requireAuth()
  await db.projeto.delete({ where: { id } })
  revalidatePath('/projetos')
  redirect('/projetos')   // executa após revalidatePath; código após redirect() nunca executa
}
```

**React Hook Form + Server Action — padrão completo:**

> **`zodResolver` com Zod v4:** passar o schema com `as any` para contornar incompatibilidade de tipos entre `@hookform/resolvers` v5 e Zod 4.3.x. O runtime funciona corretamente — é só um problema de tipagem.

```tsx
// components/projetos/projeto-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function CriarProjetoForm() {
  const [isPending, startTransition] = useTransition()
  const form = useForm<CriarProjetoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(criarProjetoSchema as any),
    defaultValues: { nome: '', status: 'rascunho' },
  })

  function onSubmit(data: CriarProjetoInput) {
    startTransition(async () => {
      const result = await criarProjetoAction(data)
      if (result.success) {
        toast.success('Projeto criado')
        form.reset()
      } else {
        toast.error('Erro ao criar projeto')
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* campos */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Criando...' : 'Criar Projeto'}
      </button>
    </form>
  )
}
```

**Server Action em event handler sem formulário:**

```tsx
function handleToggle() {
  startTransition(async () => {
    await atualizarStatusTarefaAction(tarefa.id, 'concluida')
  })
}
```

---

## Caching e Revalidação

| Mecanismo | Onde | Efeito |
|---|---|---|
| `React.cache()` | `queries/` | Deduplica queries no mesmo request |
| `revalidatePath('/rota')` | `actions/` após mutação | Invalida router cache da rota |

> Não usar `'use cache'` / `cacheTag` — requerem flag `cacheComponents: true`, projetada para apps híbridos estáticos+dinâmicos. Num app 100% autenticado, complexidade sem benefício.

**Granularidade:**
```ts
revalidatePath('/projetos')                    // invalida listagem
revalidatePath(`/projetos/${id}`)              // invalida página do projeto
revalidatePath(`/projetos/${id}`, 'layout')    // invalida layout + todas as sub-rotas
```

---

## Tipagem — params e searchParams

`params` e `searchParams` são Promises a partir do Next.js 15. Usar tipagem inline diretamente — `PageProps<'/rota'>` e `LayoutProps` não estão disponíveis nesta versão/configuração.

```tsx
// page.tsx com parâmetro dinâmico
export default async function ProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
}

// page.tsx com searchParams
export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
}

// layout.tsx com parâmetro dinâmico
export default async function ProjetoLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>
  children: React.ReactNode
}) {
  const { id } = await params
  return <div>{children}</div>
}

// route.ts com parâmetro dinâmico
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}
```

---

## Streaming e Loading States

**`loading.tsx` — skeleton automático da rota:**

> Não existe componente `<Skeleton>` no shadcn v4 deste projeto. Usar divs com `animate-pulse rounded bg-muted` diretamente.

```tsx
// app/(internal)/projetos/loading.tsx
export default function ProjetosLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}
```

**`<Suspense>` — streaming granular:**

```tsx
// page.tsx
const fasesPromise = getFasesByProjeto(id)        // inicia sem await
const timelinePromise = getTimelineInterna(id)    // inicia sem await

return (
  <div>
    <ProjetoHeader projeto={projeto} />            {/* renderizado imediatamente */}
    <Suspense fallback={<FaseListSkeleton />}>
      <FaseListServer fasesPromise={fasesPromise} />
    </Suspense>
    <Suspense fallback={<TimelineSkeleton />}>
      <TimelineListServer timelinePromise={timelinePromise} />
    </Suspense>
  </div>
)
```

---

## Tratamento de Erros

| Tipo de erro | Mecanismo |
|---|---|
| Erro de negócio / validação | Retornar `{ success: false, error }` na action |
| Dado não encontrado | `notFound()` → `not-found.tsx` |
| Erro inesperado durante render / startTransition | `throw` → capturado pelo `error.tsx` |
| Erro em event handler síncrono | `try/catch` + `useState` |
| Erro no root layout | `global-error.tsx` |

**Actions retornam erros de negócio como valor — nunca throw:**

```ts
export async function deletarFaseAction(id: string) {
  await requireAuth()
  const fase = await db.fase.findUnique({ where: { id }, select: { isFaseGeral: true } })
  if (fase?.isFaseGeral) {
    return { success: false, error: 'A fase Geral do projeto não pode ser excluída.' }
  }
  await faseService.deletar(id)
  revalidatePath('/projetos')
  return { success: true }
}
```

**`error.tsx` — obrigatório como Client Component:**

```tsx
// app/(internal)/projetos/[id]/error.tsx
'use client'
export default function ProjetoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2>Algo deu errado</h2>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
```

**`global-error.tsx` — precisa de `<html>` + `<body>` próprios:**

```tsx
// app/global-error.tsx
'use client'
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <div>
          <h2>Algo deu errado</h2>
          <button onClick={() => reset()}>Tentar novamente</button>
        </div>
      </body>
    </html>
  )
}
```

---

## Supabase clients — dois arquivos separados

`lib/supabase.ts` e `lib/supabase-browser.ts` são arquivos **separados** porque `import 'server-only'` no arquivo server impediria o import em Client Components.

```ts
// lib/supabase.ts — server (tem server-only)
// Usar em: Server Components, Server Actions, Route Handlers
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll falha em Server Components (read-only) — ignorar
          }
        },
      },
    }
  )
}
```

```ts
// lib/supabase-browser.ts — browser (sem server-only)
// Usar em: Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

> `requireAuth()` em `lib/auth.ts` **não reutiliza** `lib/supabase.ts` — cria o client internamente para ter controle total sobre `cookies()` e deduplicação via `React.cache()`.

---

## server-only

Adicionar `import 'server-only'` em módulos que **não devem ir ao bundle do cliente**. Causa erro de build se importado em Client Component.

```ts
// lib/db.ts — Prisma 5.22.x (driver adapters não necessários nesta versão)
import 'server-only'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['query'] : [] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

```ts
// lib/auth.ts
import 'server-only'
import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// cache() deduplica — se layout e page chamarem requireAuth() no mesmo request → 1 chamada apenas
export const requireAuth = cache(async () => {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
})
```

**Variáveis de ambiente:**
```ts
// Acessível em servidor e browser
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Somente servidor — string vazia no bundle do cliente
process.env.DATABASE_URL
process.env.SUPABASE_SERVICE_ROLE_KEY
process.env.DIRECT_URL
```

---

## Route Handler — Auth Callback

Necessário para o fluxo OAuth do Supabase. Sem ele, autenticação não funciona.

```
1. Usuário clica "Login com Google"
2. Supabase redireciona para o provider OAuth
3. Provider redireciona para /auth/callback?code=...
4. Route Handler troca o code por sessão e seta o cookie
5. Redireciona para /dashboard
```

```ts
// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

> Configurar no painel do Supabase: `Redirect URL = https://seu-dominio.com/auth/callback`

---

## Checklist de implementação

### Query
- [ ] Arquivo em `queries/[entidade].queries.ts`
- [ ] `import 'server-only'` no topo
- [ ] `select` explícito — nunca `findMany()` sem select
- [ ] `React.cache()` se chamada em múltiplos lugares (layout + page da mesma rota)
- [ ] Query de portal: nomenclatura `getXxxParaPortal()`, nunca retorna horas/dados internos

### Action
- [ ] Arquivo em `actions/[entidade].actions.ts`
- [ ] `'use server'` no topo do arquivo
- [ ] `zod.safeParse()` com o mesmo schema do formulário
- [ ] `await requireAuth()` antes de qualquer operação
- [ ] Operação simples → `db` direto; cross-entity → `service`
- [ ] `revalidatePath()` após mutação
- [ ] Retorno `{ success: true }` ou `{ success: false, error }` — nunca throw para a UI

### Formulário (Client Component)
- [ ] `'use client'` no topo
- [ ] `useForm` com `zodResolver` + schema de `types/schemas/`
- [ ] `useTransition` para wrapping da action
- [ ] Toast (Sonner) para feedback de sucesso/erro
- [ ] `disabled={isPending}` no botão de submit

### Página (Server Component)
- [ ] Async function com `await params`
- [ ] Tipagem inline: `{ params: Promise<{ id: string }> }` — `PageProps` não está disponível
- [ ] `notFound()` se dado não encontrado
- [ ] `loading.tsx` na mesma pasta (obrigatório em rotas dinâmicas)
- [ ] `error.tsx` na mesma pasta para boundary
- [ ] Página thin — delegar UI complexa para `components/`

### Proxy
- [ ] Arquivo em `src/proxy.ts`
- [ ] Exportar função `proxy` (não `middleware`)
- [ ] Verificação otimista — apenas existência do cookie
- [ ] `config.matcher` excluindo `_next/static`, `_next/image`, `favicon.ico`
- [ ] Validação real de sessão no layout via `requireAuth()`
