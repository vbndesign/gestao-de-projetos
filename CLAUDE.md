# CLAUDE.md — Gestão de Projetos

Guia de referência para o Claude Code neste repositório. Leia antes de qualquer tarefa de implementação.

---

## O que é este projeto

Sistema de gestão de projetos com dois contextos:
- **Painel interno** — equipe autenticada, acesso total
- **Portal do cliente** — leitura pública por slug, sem horas nem dados internos

Stack: **Next.js 16.1.6 App Router · TypeScript strict · Prisma · PostgreSQL via Supabase · Supabase Auth · shadcn/ui · React Hook Form · Zod · Tailwind CSS**

> **shadcn/ui v4:** estilo `"base-nova"` (equivalente ao antigo "New York"). Adicionar componentes com `npx shadcn@latest add [componente]` — não usar `pnpm dlx` (não funciona neste ambiente). Inter font usa `variable: "--font-sans"` para integração com o sistema de CSS variables.

---

## Specs — leia antes de implementar

Índice completo em `specs/foundation/00_indice.md`.

**Documentação base** (`specs/foundation/`):

| Arquivo | Conteúdo |
|---|---|
| `specs/foundation/01_produto.md` | Escopo do MVP, módulos, o que está fora |
| `specs/foundation/02_dominio.md` | Entidades, campos, regras de negócio, fluxos, exclusão |
| `specs/foundation/03_arquitetura.md` | Stack, camadas, fluxo canônico, anti-patterns, folder structure, git |
| `specs/foundation/04_nextjs.md` | Padrões Next.js 16: proxy.ts, auth, cache, error handling, tipos |
| `specs/foundation/05_urls.md` | Mapa completo de rotas |
| `specs/foundation/06_deploy.md` | Vercel: vercel.json, env vars, regiões, Prisma migrate |

**PRDs** (`specs/prds/`): um arquivo por feature/módulo, adicionados ao longo do desenvolvimento.

---

## Estrutura de pastas

```
src/
├── proxy.ts                    # Proteção de rotas (Next.js 16 — não middleware.ts)
├── app/
│   ├── (internal)/             # Painel — autenticado
│   └── (portal)/p/[slug]/      # Portal — público
├── components/                 # Client Components
│   └── ui/                     # shadcn/ui (código copiado, você possui)
├── actions/                    # Server Actions (mutações apenas)
├── services/                   # Regras de negócio cross-entity
│   ├── projeto.service.ts      # R1 — criar projeto + fase Geral automática
│   ├── fase.service.ts         # R2 — proteção fase Geral, reordenação
│   └── timeline.service.ts     # R3 — resolver pendências com transaction
├── queries/                    # Leitura do banco
│   ├── cliente.queries.ts      # Clientes e relações
│   ├── projeto.queries.ts      # Projetos (interno + portal)
│   └── fase.queries.ts         # Fases
├── lib/
│   ├── db.ts                   # Prisma singleton (globalThis)
│   ├── auth.ts                 # requireAuth() com React.cache()
│   ├── supabase.ts             # Supabase server client (server-only)
│   └── supabase-browser.ts     # Supabase browser client (sem server-only — seguro em Client Components)
└── types/
    └── schemas/                # Zod schemas compartilhados
```

---

## Fluxo canônico — lei do projeto

**Leitura:**
```
page.tsx → queries/*.queries.ts → lib/db (Prisma) → props para components/
```

**Mutação:**
```
component ("use client") → action ("use server") → [service se cross-entity] → lib/db
                                                  → requireAuth()
                                                  → revalidatePath()
                                                  → return { success, error }
```

**Nunca pular camadas.** Actions não acessam `lib/db` quando há lógica de negócio — chamam `services/`. Services não conhecem HTTP, cookies ou UI.

---

## Regras críticas — memorize

### Autenticação
- `proxy.ts` (não `middleware.ts`) — verificação otimista de cookie, exporta `proxy()` não `middleware()`
- `app/(internal)/layout.tsx` — chama `requireAuth()` (validação real com Supabase)
- `requireAuth()` usa `React.cache()` — deduplicado por render pass, exportado como `const`
- **Layout não re-renderiza** em navegação entre páginas — Server Actions sempre chamam `requireAuth()` independente

### Caching
- `React.cache()` para deduplicação de requests no mesmo render pass
- `revalidatePath()` após mutações — nunca `'use cache'` ou `cacheTag` (requer flag extra, fora do perfil deste projeto)

### Server Actions
- **Apenas mutações** — nunca usar para buscar dados
- Sempre revalidar input com Zod (mesmo que o client já validou)
- Retornam `{ success: true }` ou `{ success: false, error: string }` — nunca lançam exceção para a UI

### Queries
- Sempre usar `select` explícito — nunca retornar todos os campos
- `getProjetoParaPortal()` nunca retorna horas ou dados internos — filtro nas queries, não nos components
- Nomenclatura explícita por contexto: `getProjetoById()` vs `getProjetoParaPortal()`

### Formulários
- React Hook Form + Zod schema de `types/schemas/`
- **Um único schema** compartilhado entre form (client) e action (server)
- Schemas em `types/schemas/[entidade].schema.ts`

### Drag & Drop (@dnd-kit)
- **Sempre usar `useId()` no DndContext** para evitar hydration mismatch em SSR
```tsx
import { useId } from 'react'
import { DndContext } from '@dnd-kit/core'

export default function MyComponent() {
  const dndId = useId()
  return <DndContext id={dndId} /* ... */>...</DndContext>
}
```
- Sem `id` estável, servidor e cliente geram IDs diferentes → hydration error
- `useId()` garante sincronização entre SSR e cliente

---

## Regras de negócio que impactam código

| Regra | Onde implementar |
|---|---|
| R1 — Criar projeto cria fase "Geral" automática | `services/projeto.service.ts` em `$transaction` |
| R2 — Fase Geral não pode ser deletada/reordenada | `services/fase.service.ts` verifica `is_fase_geral` |
| R3 — Resolver pendência: remove evento criação, cria evento resolução | `services/timeline.service.ts` em `$transaction` |
| R4 — Horas nunca aparecem no portal, nunca geram timeline | queries de portal + `getTimelinePortal()` |
| R5 — Excluir fase exclui tarefas e horas em cascata | Prisma schema com `onDelete: Cascade` |

---

## Anti-patterns a evitar

| Errado | Correto |
|---|---|
| Lógica de negócio em `actions/` | Mover para `services/` |
| `lib/db` direto em `actions/` com regras cross-entity | Chamar `services/` |
| `useEffect + fetch` para dados | `async` Server Component + `queries/` |
| `"use server"` fora de `actions/` | Apenas `actions/` usa a diretiva |
| Tipos Prisma crus (`Project` do `@prisma/client`) na UI | Tipos de `types/` |
| Schema Zod duplicado em form e action | Um schema em `types/schemas/` |
| Filtro portal nos components | Filtro nas queries |
| `middleware.ts` | `proxy.ts` com export `proxy()` |
| `'use cache'` / `cacheTag` | `React.cache()` + `revalidatePath()` |

---

## Comandos frequentes

```bash
# Dev
pnpm dev

# Build (igual ao Vercel)
prisma generate && next build

# Migrations
npx prisma migrate dev --name descricao
npx prisma migrate deploy          # produção

# Gerar cliente Prisma após mudança de schema
npx prisma generate

# Visualizar banco
npx prisma studio

# shadcn/ui — adicionar componentes (usar npx, não pnpm dlx)
npx shadcn@latest add button
npx shadcn@latest add input dialog select
```

---

## Deploy

Ver `specs/06_deploy.md`. Em resumo:
- `vercel.json` com `buildCommand: "prisma generate && next build"` e `regions` alinhada ao Supabase
- Env vars no Vercel dashboard — nunca em `.env.production` commitado
- `main` → produção, `dev` → staging, PRs → preview URL única