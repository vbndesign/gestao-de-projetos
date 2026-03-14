# 03 — Arquitetura

Stack, camadas, fluxo canônico, anti-patterns, folder structure e convenções de git.

---

## Stack

| Camada | Tecnologia | Decisão |
|---|---|---|
| Framework | Next.js 16.1.6 App Router | Server Components + Server Actions nativos |
| Linguagem | TypeScript strict | Type safety em todas as camadas |
| ORM | Prisma 5.22.x | Cascata nativa, tipos gerados, migrations — 6.x e 7.x fora do escopo (driver adapters obrigatórios sem ganho para o perfil do MVP) |
| Banco | PostgreSQL via Supabase | Gerenciado, sem Docker local |
| Auth | Supabase Auth + `@supabase/ssr` | Integrado ao PostgreSQL do Supabase |
| Estilo | Tailwind CSS | Padrão do ecossistema Next.js |
| Componentes UI | shadcn/ui | Código copiado no projeto, customizável, LLM-friendly |
| Formulários | React Hook Form | Estado de forms sem re-render desnecessário |
| Validação | Zod | Schemas compartilhados entre client e server |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable | Reordenação de fases e tarefas |

---

## Versões de referência

Versões pinadas para o MVP. Não atualizar sem validação — especialmente Prisma (6.x e 7.x têm breaking changes incompatíveis com o setup atual).

| Pacote | Versão | Observação |
|---|---|---|
| `next` | `16.1.6` | App Router + Server Actions |
| `prisma` | `5.22.x` | CLI — `devDependencies` |
| `@prisma/client` | `5.22.x` | Deve ser idêntica à do CLI |
| `tailwindcss` | `4.x` | Sintaxe `@import "tailwindcss"` no globals.css |
| `typescript` | `5.x` | Strict mode obrigatório |
| `zod` | `4.x` | Schemas compartilhados client/server |
| `react-hook-form` | `7.x` | + `@hookform/resolvers` |
| `@supabase/ssr` | latest estável | |
| `@dnd-kit/core` | `6.x` | |
| `@dnd-kit/sortable` | `8.x` | |

> **Zod v4:** `error.flatten()` foi depreciado — usar `z.flattenError(parsed.error)` nas actions. `zodResolver` do `@hookform/resolvers` é compatível com v4. Demais APIs (`z.object`, `z.string`, `z.enum`, `z.coerce.date`, `safeParse`) sem mudança de comportamento.

> **shadcn/ui não é um pacote npm** — é um CLI que copia código para o projeto. Usar `npx shadcn@latest init --defaults` (não `pnpm dlx` — não funciona neste ambiente Windows). shadcn v4 usa estilo `"base-nova"` (equivalente ao antigo "New York") e instala `@base-ui/react`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css` com versões gerenciadas pelo próprio shadcn. Não gerenciar manualmente. Para adicionar componentes: `npx shadcn@latest add [componente]`.

---

## Configuração Supabase + Prisma

### Variáveis de ambiente

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"
```

### Schema Prisma — obrigatório

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooling via pgbouncer (queries)
  directUrl = env("DIRECT_URL")     // conexão direta (migrations)
}
```

### O que usar e não usar do Supabase

| Recurso | Usar? | Motivo |
|---|---|---|
| PostgreSQL gerenciado | ✅ | Elimina Docker local |
| Supabase Auth | ✅ | Substitui NextAuth, integrado |
| Storage | 🔜 Futuro | Relevante para Documentos — fora do MVP |
| RLS (Row Level Security) | ❌ | Regras de domínio ficam em `services/` |
| Supabase Client para queries | ❌ | Usar Prisma — type safety e consistência |
| Realtime | ❌ | Fora do escopo do MVP |

---

## shadcn/ui — níveis de customização

Componentes são copiados para `components/ui/` — você possui o código.

| Nível | Situação | Estratégia |
|---|---|---|
| **1 — Visual** | Componente existe mas com estilo diferente do Figma | Adiciona variante no `cva` em `components/ui/` |
| **2 — Props** | Componente existe mas com interface diferente | Cria wrapper em `components/[domínio]/` |
| **3 — Novo** | Sem equivalente no shadcn | Cria componente novo usando átomos do shadcn |

---

## React Hook Form + Zod — regra de ouro

Um único schema Zod em `types/schemas/` compartilhado entre form (client) e action (server).

```typescript
// types/schemas/projeto.schema.ts
export const criarProjetoSchema = z.object({
  nome:            z.string().min(1).max(100),
  clienteId:       z.string().uuid(),
  status:          z.enum(["rascunho", "ativo", "pausado", "concluido", "arquivado"]),
  dataInicio:      z.coerce.date(),
  previsaoEntrega: z.coerce.date().optional(),
})
export type CriarProjetoInput = z.infer<typeof criarProjetoSchema>
```

```typescript
// client — validação visual em tempo real
const form = useForm<CriarProjetoInput>({ resolver: zodResolver(criarProjetoSchema) })

// server — revalidação obrigatória (nunca confiar no client)
const parsed = criarProjetoSchema.safeParse(input)
if (!parsed.success) return { success: false, error: z.flattenError(parsed.error) }
```

---

## Arquitetura — visão geral

**Layered Architecture com Feature-Based grouping** e separação de contextos por Route Groups do Next.js.

> Cada camada tem uma única responsabilidade. Regras de negócio cross-entity vivem em `services/`. Nenhuma action acessa `db` diretamente quando há lógica de negócio envolvida. Nenhum componente conhece o banco.

```
┌─────────────────────────────────────────────────┐
│  app/  — Rotas, layouts, páginas thin            │
│  components/ — UI Client Components              │
├─────────────────────────────────────────────────┤
│  actions/ — Entrada: validação + coordenação     │
├─────────────────────────────────────────────────┤
│  services/ — Regras de negócio cross-entity      │
├─────────────────────────────────────────────────┤
│  queries/ — Leitura do banco por contexto        │
├─────────────────────────────────────────────────┤
│  lib/ — Infraestrutura (db, auth, utils)         │
│  types/ — Contratos e schemas Zod                │
└─────────────────────────────────────────────────┘
```

---

## Estrutura de pastas

```
src/
│
├── proxy.ts                             # Proteção de rotas (verificação otimista de cookie)
│
├── app/
│   ├── (internal)/                      # Painel interno — autenticado
│   │   ├── layout.tsx                   # Chama requireAuth() uma vez
│   │   ├── dashboard/page.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── projetos/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           ├── fases/page.tsx
│   │           ├── timeline/page.tsx
│   │           └── horas/page.tsx
│   │
│   └── (portal)/                        # Portal do cliente — público
│       └── p/[slug]/
│           ├── page.tsx
│           └── _components/             # Co-localizados (MVP tem 1 página)
│               ├── projeto-portal-header.tsx
│               ├── fases-portal.tsx
│               └── timeline-portal.tsx
│
├── components/                          # Client Components do painel interno
│   ├── ui/                              # Primitivos shadcn/ui
│   ├── projetos/
│   │   ├── projeto-card.tsx
│   │   ├── projeto-form.tsx
│   │   └── projeto-status-badge.tsx
│   ├── fases/
│   │   ├── fase-list.tsx
│   │   ├── fase-form.tsx
│   │   └── fase-reorder.tsx             # @dnd-kit
│   ├── tarefas/
│   │   ├── tarefa-list.tsx
│   │   ├── tarefa-form.tsx
│   │   └── tarefa-reorder.tsx
│   ├── clientes/
│   │   ├── cliente-form.tsx
│   │   └── cliente-card.tsx
│   ├── timeline/
│   │   ├── timeline-list.tsx
│   │   └── timeline-event-item.tsx
│   ├── horas/
│   │   ├── horas-form.tsx
│   │   └── horas-list.tsx
│   └── registros/
│       ├── reuniao-form.tsx
│       ├── decisao-form.tsx
│       ├── checkpoint-form.tsx
│       ├── pendencia-form.tsx
│       ├── documento-form.tsx
│       └── mudanca-direcao-form.tsx
│
├── actions/                             # Server Actions — camada de entrada fina
│   ├── projeto.actions.ts
│   ├── fase.actions.ts
│   ├── tarefa.actions.ts
│   ├── pendencia.actions.ts
│   ├── horas.actions.ts
│   ├── cliente.actions.ts
│   └── registros.actions.ts
│
├── services/                            # Regras de negócio cross-entity
│   ├── projeto.service.ts               # criar() → cria fase Geral automaticamente
│   ├── fase.service.ts                  # reordenar(), deletar() com proteção is_fase_geral
│   └── timeline.service.ts              # criarEvento(), resolverPendencia()
│
├── queries/                             # Leitura do banco — nomenclatura explícita por contexto
│   ├── projeto.queries.ts               # getProjetoById(), getProjetosDoCliente(), getProjetoParaPortal()
│   ├── fase.queries.ts
│   ├── tarefa.queries.ts
│   ├── timeline.queries.ts              # getTimelineInterna(), getTimelinePortal()
│   ├── cliente.queries.ts
│   └── horas.queries.ts                 # getTotalHorasPorFase(), getTotalHorasPorProjeto()
│
├── lib/
│   ├── db.ts                            # Prisma singleton com globalThis
│   ├── auth.ts                          # requireAuth() com React.cache()
│   ├── supabase.ts                      # Supabase server client (server-only) — Server Components, Actions, Route Handlers
│   ├── supabase-browser.ts              # Supabase browser client — Client Components (sem server-only)
│   └── utils.ts                         # cn(), formatDate()
│
└── types/
    ├── schemas/                         # Schemas Zod (compartilhados client/server)
    │   ├── projeto.schema.ts
    │   ├── fase.schema.ts
    │   ├── tarefa.schema.ts
    │   ├── cliente.schema.ts
    │   ├── pendencia.schema.ts
    │   ├── horas.schema.ts
    │   └── registros.schema.ts
    ├── projeto.types.ts
    ├── fase.types.ts
    ├── timeline.types.ts
    └── portal.types.ts                  # Tipos filtrados para o portal
```

---

## Fluxo canônico

Este fluxo é **lei** — toda operação segue este caminho sem exceções.

### Leitura

```
page.tsx (async Server Component)
  └── queries/[entidade].queries.ts
        └── lib/db (Prisma)
  └── passa props para components/
```

### Mutação

```
components/form.tsx ("use client")
  └── React Hook Form + Zod (validação client-side)
  └── actions/[entidade].actions.ts ("use server")
        └── Zod.safeParse() (revalidação obrigatória server-side)
        └── requireAuth()
        └── SE simples: lib/db diretamente
        └── SE cross-entity: services/[entidade].service.ts
              └── db.$transaction()
        └── revalidatePath()
        └── return { success: true } | { success: false, error: string }
```

### Exemplo — criar projeto (demonstra R1)

```typescript
// actions/projeto.actions.ts
import { z } from 'zod'

export async function criarProjetoAction(input: CriarProjetoInput) {
  const parsed = criarProjetoSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: z.flattenError(parsed.error) }
  await requireAuth()
  await projetoService.criar(parsed.data)   // cross-entity → service
  revalidatePath("/projetos")
  return { success: true }
}

// services/projeto.service.ts
export async function criar(data: CriarProjetoInput) {
  return await db.$transaction(async (tx) => {
    const projeto = await tx.projeto.create({ data })
    await tx.fase.create({                  // R1 — fase Geral automática
      data: { projetoId: projeto.id, nome: "Geral do projeto",
              ordem: 1, status: "nao_iniciada", isFaseGeral: true },
    })
    await timelineService.criarEvento(tx, {
      projetoId: projeto.id, tipoEvento: "projeto_criado",
      titulo: `Projeto "${projeto.nome}" criado`, dataEvento: new Date(),
    })
    return projeto
  })
}
```

### Exemplo — resolver pendência (demonstra R3)

```typescript
// services/timeline.service.ts
export async function resolverPendencia(pendenciaId: string) {
  return await db.$transaction(async (tx) => {
    const pendencia = await tx.pendencia.update({
      where: { id: pendenciaId },
      data: { status: "resolvida", dataResolucao: new Date() },
    })
    // R3 — remove evento de criação, cria evento de resolução
    await tx.eventoTimeline.deleteMany({
      where: { origemId: pendenciaId, tipoEvento: "pendencia_criada" },
    })
    await tx.eventoTimeline.create({
      data: {
        projetoId: pendencia.projetoId, tipoEvento: "pendencia_resolvida",
        titulo: `Pendência resolvida: ${pendencia.titulo}`,
        origemTipo: "pendencia", origemId: pendenciaId, dataEvento: new Date(),
      },
    })
  })
}
```

---

## Regras de camada

### `app/` — Páginas
- ✅ Buscar dados via `queries/`
- ✅ Usar `notFound()`, `redirect()`, `generateMetadata()`
- ❌ Lógica de negócio
- ❌ Acessar `lib/db` diretamente

### `components/` — UI
- ✅ Receber dados via props e renderizar
- ✅ React Hook Form + Zod para formulários
- ✅ Chamar `actions/` para mutações
- ❌ `useEffect + fetch` para buscar dados
- ❌ Lógica de negócio ou acesso a `lib/db`

### `actions/` — Entrada
- ✅ Validar input com Zod (sempre, mesmo que o client já validou)
- ✅ Verificar autenticação via `requireAuth()`
- ✅ Chamar `services/` para operações cross-entity
- ✅ Chamar `lib/db` para operações simples sem regras
- ✅ Revalidar cache com `revalidatePath()`
- ✅ Retornar `{ success, error }` — nunca lançar exceção para a UI
- ❌ Lógica de negócio complexa
- ❌ Chamar outras `actions/`

### `services/` — Regras de negócio
- ✅ Executar regras cross-entity
- ✅ Coordenar operações em `db.$transaction()`
- ✅ Chamar outros `services/`
- ✅ Acessar `lib/db` diretamente
- ❌ Conhecer HTTP, cookies, headers, redirect, UI ou Zod schemas
- ❌ Chamar `actions/` ou `queries/` (evita ciclo — services escrevem, queries leem)

### `queries/` — Leitura
- ✅ Consultas com `select` explícito
- ✅ Nomenclatura explícita por contexto (`getProjetoById()` vs `getProjetoParaPortal()`)
- ✅ Funções de portal nunca retornam horas ou dados internos
- ❌ Mutações
- ❌ Chamar `services/` ou `actions/`

### `lib/` — Infraestrutura
- `db.ts` — Prisma singleton com `globalThis`
- `auth.ts` — `requireAuth()` com `React.cache()` (deduplicado por render pass)
- `supabase.ts` — factory de Supabase client (server e browser)
- `utils.ts` — funções puras `cn()`, `formatDate()`

### `types/` — Contratos
- ✅ Interfaces e tipos de domínio compartilhados
- ✅ Schemas Zod em `types/schemas/`
- ✅ Enums de status
- ❌ Lógica — apenas tipos e schemas

---

## Anti-patterns a evitar

| Anti-pattern | Por quê é problemático |
|---|---|
| Lógica de negócio em `actions/` | Regras cross-entity precisam de camada isolada para serem reutilizáveis |
| `lib/db` direto em `actions/` com regras cross-entity | Acopla a regra à camada de entrada |
| Tipos Prisma crus na UI (`Project` do `@prisma/client`) | Mudança no schema quebra componentes |
| `useEffect + fetch` para buscar dados | App Router resolve com async Server Components |
| `"use server"` fora de `actions/` | Expõe funções como Server Actions chamáveis do client |
| Queries sem `select` explícito | Retorna dados desnecessários, inclusive campos internos |
| Filtro portal nos components | Filtro "o que o cliente vê" deve estar nas queries |
| `middleware.ts` | Usar `proxy.ts` com export `proxy()` |
| Supabase Client para queries de domínio | Usar Prisma — type safety e consistência |
| RLS para regras de negócio | RLS é para isolamento multi-tenant; regras de domínio ficam em `services/` |
| Zod só no client | Validar também no server action |
| Schema Zod duplicado | Um schema em `types/schemas/` compartilhado |

---

## Decisões arquiteturais

| Decisão | Alternativa | Motivo |
|---|---|---|
| Server Actions em vez de API Routes | REST com Route Handlers | Type-safe, sem boilerplate de fetch |
| Supabase Auth em vez de NextAuth | NextAuth.js v5, Clerk | Integrado ao PostgreSQL do Supabase |
| Prisma mesmo com Supabase | Supabase Client para queries | Type safety, migrations controladas |
| Prisma sem Repository Pattern | Repository abstraindo Prisma | Prisma já é o repository |
| shadcn/ui | Mantine, Chakra, MUI | Código copiado, LLM-friendly, Figma-ready |
| React Hook Form + Zod | Formik + Yup | Performance, schema reutilizável no server |
| `queries/` plano com nomenclatura explícita | `queries/internal/` e `queries/portal/` | Subpastas prematuras para o MVP |
| Componentes portal co-localizados | `components/portal/` separado | MVP tem 1 página no portal |
| `timeline.service.ts` sem `pendencia.service.ts` | Arquivo separado | Lógica de pendência é 100% timeline |

---

## Git

### Modelo de branches

```
main                     ← produção — nunca push direto
└── dev                  ← base de desenvolvimento
    ├── feature/[modulo]-prd-NN   ← uma branch por PRD
    ├── fix/[escopo]-[descricao]
    ├── hotfix/[descricao]
    └── chore/[descricao]
```

**Nomenclatura por situação:**

| Módulo tem sub-PRDs? | Padrão |
|---|---|
| ✅ Sim (ex: Projetos → 02a, 02b, 02c) | `modulo/projetos` como base + `feature/projetos/prd-02a` por sub-PRD |
| ❌ Não (PRD único) | `feature/[modulo]-prd-NN` diretamente a partir de `dev` |

Exemplos: `feature/tarefas-prd-03`, `feature/horas-prd-06`

Branches são deletadas localmente após o merge (`git branch -d`).

### Regras por branch

| Branch | Push direto | Merge para |
|---|---|---|
| `main` | ❌ Nunca | — |
| `dev` | ❌ Nunca | — |
| `feature/*` | ✅ | PR → dev |
| `fix/*` | ✅ | PR → dev |
| `hotfix/*` | ✅ | PR → main + dev |
| `chore/*` | ✅ | PR → dev |

### Convenção de commits (Conventional Commits)

```
tipo(escopo): descrição curta no imperativo
```

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `chore` | Config, deps, build |
| `docs` | Documentação |
| `test` | Testes |
| `perf` | Performance |
| `style` | Formatação, lint |

**Escopos:** `cliente` · `projeto` · `fase` · `tarefa` · `timeline` · `pendencia` · `horas` · `portal` · `auth` · `db` · `ui` · `config`

**Exemplos:**
```
feat(projeto): criar projeto com fase Geral automática
feat(fase): implementar reordenação com atualização de ordem
feat(timeline): adicionar evento ao resolver pendência
fix(fase): impedir exclusão de fase marcada como is_fase_geral
refactor(queries): separar queries de portal e interno
chore(supabase): configurar variáveis de ambiente e cliente SSR
```

### Estratégia de merge

- `feature/*` → `dev` — **Merge commit `--no-ff`** (mantém histórico da branch visível na árvore)
- `dev` → `main` — **Merge commit** (registra ponto de release)
- `hotfix/*` → `main` + `dev` — Merge commit + cherry-pick

### Versionamento com tags (Semver)

Convenção adotada para o MVP: **um tag por PRD concluído**.

| Tag | Significado |
|---|---|
| `v0.0.0-specs` | Marco inicial — specs finalizadas, zero código implementado ✅ |
| `v0.1.0` | PRD-00a concluído (setup) |
| `v0.2.0` | PRD-00b concluído (auth + db) |
| `v0.3.0` | PRD-01 concluído (clientes) |
| … | continua por PRD |
| `v1.0.0` | MVP completo (todos os PRDs concluídos) |

```bash
# Após cada PRD concluído e testado
git tag -a v0.1.0 -m "PRD-00a: setup Next.js + Tailwind + shadcn"
git push origin v0.1.0
```

> Em produção, o Vercel detecta tags automaticamente e faz deploy. Tags de PRD intermediários (`v0.x.0`) são para rastreabilidade — o deploy de produção usa `v1.0.0` em diante.

### Proteção de branches (GitHub)

`main`: Require PR before merging · Require 1 approval · Do not allow bypassing
