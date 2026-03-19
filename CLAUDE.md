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

## Design System

### Documentação base

| Doc | Quando ler |
|---|---|
| `specs/foundation/07_design_ui.md` | Antes de qualquer feature com UI — define quando e como usar Figma MCP, workflow por tipo de feature, decisão de componente |
| `specs/design-system/foundations/design-system-frontend-implementation.md` | Contratos de componentes existentes (Level 1-3), token architecture, decisões de design |
| `specs/design-system/foundations/design-system-colors.md` | Antes de alterar tokens de cor |
| `specs/design-system/foundations/design-system-typography.md` | Antes de alterar tokens de tipografia |
| `specs/design-system/foundations/design-system-spacing.md` | Antes de alterar tokens de espaçamento |
| `specs/design-system/foundations/design-system-radius.md` | Antes de alterar tokens de border-radius |
| `specs/design-system/foundations/design-system-figma-naming.md` | Antes de criar/renomear componentes com raiz no Figma |

### Source of truth

Tokens em `specs/design-system/tokens/`:
- `colors.json` — arquitetura primitive → semantic → component
- `typography.json` — arquitetura primitive → semantic
- `spacing.json` — escala primitiva (4–120px)
- `radius.json` — arquitetura primitive → semantic

O repositório é a fonte da verdade. Figma consome esses tokens; não é a origem.

### Geração de CSS vars (automação)

Script: `specs/design-system/scripts/generate-css-tokens.mjs`

```bash
node specs/design-system/scripts/generate-css-tokens.mjs
```

Saída: `src/app/design-system-tokens.css` (importado em `globals.css`).

**Nunca editar o arquivo gerado à mão.** Para adicionar novos tokens: editar o JSON → rodar script → commitar ambos.

Scripts de Figma disponíveis em `package.json`:
- `pnpm figma:validate:typography`
- `pnpm figma:sync:typography`

### Naming das CSS vars

```
--ds-color-primitive-brand-500
--ds-color-semantic-text-heading
--ds-color-component-button-filled-brand-default-bg
--ds-typography-size-base
--ds-typography-weight-semibold
```

Utilities Tailwind expostos via `@theme` em `globals.css`:
- `text-ds-muted`, `text-ds-heading`, `bg-ds-brand-500`, `border-ds-subtle` etc.

### Regras de uso em componentes novos

| Proibido | Correto |
|---|---|
| Hex literal (`#6B43B8`) | `var(--ds-color-primitive-brand-600)` |
| OKLCh solto (`oklch(...)`) | Alias via CSS var |
| `text-gray-500`, `bg-gray-100` | `text-ds-muted`, `bg-ds-subtle` |
| Espaçamento arbitrário (`gap-3`) | Escala: 4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 72, 80, 96, 120 |
| Tamanho tipográfico arbitrário | Tokens: `text-ds-sm`, `text-ds-base`, `text-ds-lg` etc. |

### Localização de componentes

| Level | Localização | Tipo |
|---|---|---|
| 1 | `src/components/ui/` | Primitives shadcn com variantes DS (Button, Badge, Input…) |
| 2 | `src/components/` | Semânticos reutilizáveis em 2+ features (PageHeader, PageTabs, DataRow, ProjectSummaryCard) |
| 3 | `src/app/(internal)/[feature]/_components/` | Específicos de feature (DataRowProjects, form modals) |

### Workflow com Figma (features com UI)

Para qualquer feature nova com UI relevante, seguir o fluxo definido em `07_design_ui.md`:

```
PRD  →  seção "Design Reference" (nodes Figma identificados)
  ↓
research  →  seção "Design Reference Analysis" (estado atual vs. esperado)
  ↓
create_plan  →  inventário de componentes (criar / reutilizar / estender)
  ↓
implement_plan
  Phase A: dados (queries, actions, services)
  Phase B: componentes semânticos (via Figma MCP — node por node)
  Phase C: composição de telas
  Phase D: validação visual contra Figma
  Phase E: Code Connect (após estabilizar)
```

**Features sem UI relevante** seguem o fluxo atual sem seções de design.

### Dark mode

Fora de escopo por enquanto. O `.dark` class do shadcn é mantido por compatibilidade mas não expandido para componentes DS.

### Regras de manutenção

- Ao evoluir tokens, atualizar JSON + documentação foundation correspondente
- Não introduzir hex/OKLCH solto quando a intenção for criar regra de DS; formalizar o token no JSON primeiro
- Code Connect só após componente estabilizar (2+ cycles de validação visual)

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

Ver `specs/foundation/06_deploy.md`. Em resumo:
- `vercel.json` com `buildCommand: "prisma generate && next build"` e `regions` alinhada ao Supabase
- Env vars no Vercel dashboard — nunca em `.env.production` commitado
- `main` → produção, `dev` → staging, PRs → preview URL única
